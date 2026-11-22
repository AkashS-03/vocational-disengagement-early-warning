const path = require('path');
const fs = require('fs');
const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const { serveStatic } = require('@hono/node-server/serve-static');
const sqlite3 = require('sqlite3').verbose();

const app = new Hono();
const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new sqlite3.Database(DB_PATH);

// Helper for Promisified SQLite queries
function queryAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function queryGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function queryRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

// -------------------------------------------------------------
// Scoring Algorithms
// -------------------------------------------------------------
async function calculateStudentScores(studentId) {
    const points = { attendance: 0, practicals: 0, assessments: 0, help_seeking: 0, feedback: 0 };
    let signalsPresent = 0;

    // 1. Attendance Signal
    const attendances = await queryAll(`SELECT present, date FROM Attendance WHERE student_id = ? ORDER BY date ASC`, [studentId]);
    let attendancePercent = 0;
    if (attendances.length > 0) {
        signalsPresent++;
        const presentCount = attendances.filter(a => a.present).length;
        attendancePercent = presentCount / attendances.length;
        if (attendancePercent < 0.75) points.attendance = -3;
        else if (attendancePercent < 0.90) points.attendance = 0;
        else points.attendance = 1;
    }

    // Baseline rule
    const baselinePrediction = (attendances.length > 0 && attendancePercent < 0.75) ? 'needs support' : 'steady';

    // 2. Practicals Signal
    const practicals = await queryAll(`SELECT rubric_level, task_name, date, notes, device_id FROM PracticalActivity WHERE student_id = ? ORDER BY date DESC`, [studentId]);
    let devCount = 0;
    let profCount = 0;
    let notObsCount = 0;
    if (practicals.length > 0) {
        signalsPresent++;
        devCount = practicals.filter(p => p.rubric_level === 'developing').length;
        profCount = practicals.filter(p => p.rubric_level === 'proficient' || p.rubric_level === 'competent').length;
        notObsCount = practicals.filter(p => p.rubric_level === 'not_observed').length;

        if (devCount > profCount) points.practicals = -2;
        else if (profCount > devCount) points.practicals = 2;
        else points.practicals = 0;
    }

    // 3. Assessments Signal (Smoothing single bad day)
    const assessments = await queryAll(`SELECT score, max_score, date, assessment_type FROM Assessment WHERE student_id = ? ORDER BY date ASC`, [studentId]);
    let avgExam = 0;
    let singleBadDaySmoothed = false;
    if (assessments.length > 0) {
        signalsPresent++;
        const scores = assessments.map(a => a.score / a.max_score);
        avgExam = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const lastScore = scores[scores.length - 1];

        // Single bad day check: If avg is > 70% but last score is < 50%, don't overreact
        if (avgExam > 0.70 && lastScore < 0.50) {
            points.assessments = 0;
            singleBadDaySmoothed = true;
        } else if (avgExam < 0.60) {
            points.assessments = -2;
        } else {
            points.assessments = 1;
        }
    }

    // 4. Feedback Signal
    const feedbacks = await queryAll(`SELECT structured_sentiment, free_text, language, date, source FROM Feedback WHERE student_id = ? ORDER BY date DESC`, [studentId]);
    let negativeFeedbackCount = 0;
    if (feedbacks.length > 0) {
        signalsPresent++;
        negativeFeedbackCount = feedbacks.filter(f => f.structured_sentiment === 'negative').length;
        if (negativeFeedbackCount > 0) points.feedback = -3;
        else points.feedback = 1;
    }

    // 5. Help Seeking
    const helpSeeking = await queryAll(`SELECT type, initiated_by_student, timestamp FROM HelpSeeking WHERE student_id = ?`, [studentId]);
    if (helpSeeking.length > 0) {
        signalsPresent++;
        points.help_seeking = 0;
    }

    // Summation & Risk Banding
    const totalScore = Object.values(points).reduce((sum, val) => sum + val, 0);
    let riskBand = 'steady';
    if (totalScore <= -1) riskBand = 'needs support';
    else if (totalScore < 1) riskBand = 'watch';

    // Confidence Level
    let confidence = 'high';
    if (signalsPresent <= 2) confidence = 'low';
    else if (signalsPresent === 3) confidence = 'medium';

    // Fetch existing Human Review if present in RiskFlag table
    const existingFlag = await queryGet(`SELECT human_review_status, reviewer_notes FROM RiskFlag WHERE student_id = ? ORDER BY run_date DESC LIMIT 1`, [studentId]);

    return {
        points,
        totalScore,
        riskBand,
        confidence,
        signalsPresent,
        baselinePrediction,
        stats: {
            attendancePercent: Math.round(attendancePercent * 100),
            attendanceTotal: attendances.length,
            practicalsTotal: practicals.length,
            practicalsDeveloping: devCount,
            practicalsProficient: profCount,
            practicalsNotObserved: notObsCount,
            examAverage: Math.round(avgExam * 100),
            singleBadDaySmoothed,
            feedbacksTotal: feedbacks.length,
            hasNegativeFeedback: negativeFeedbackCount > 0,
            helpSeekingTotal: helpSeeking.length
        },
        humanReview: {
            status: existingFlag ? existingFlag.human_review_status : 'unreviewed',
            notes: existingFlag ? existingFlag.reviewer_notes : ''
        }
    };
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 2. All students with calculated scorecards & baseline
app.get('/api/students', async (c) => {
    try {
        const students = await queryAll(`SELECT id, name, cohort_trade, enrollment_date, language_pref, first_generation_flag, device_tier FROM Student ORDER BY name ASC`);
        
        const results = await Promise.all(students.map(async (student) => {
            const scoreData = await calculateStudentScores(student.id);
            return {
                ...student,
                ...scoreData
            };
        }));

        return c.json({ success: true, count: results.length, data: results });
    } catch (err) {
        console.error('Failed to fetch students:', err);
        return c.json({ success: false, error: err.message }, 500);
    }
});

// 3. Single student detailed data
app.get('/api/students/:id', async (c) => {
    const studentId = c.req.param('id');
    try {
        const student = await queryGet(`SELECT * FROM Student WHERE id = ?`, [studentId]);
        if (!student) return c.json({ success: false, error: 'Student not found' }, 404);

        const scoreData = await calculateStudentScores(studentId);
        const attendances = await queryAll(`SELECT * FROM Attendance WHERE student_id = ? ORDER BY date DESC LIMIT 30`, [studentId]);
        const practicals = await queryAll(`SELECT * FROM PracticalActivity WHERE student_id = ? ORDER BY date DESC LIMIT 20`, [studentId]);
        const assessments = await queryAll(`SELECT * FROM Assessment WHERE student_id = ? ORDER BY date DESC LIMIT 20`, [studentId]);
        const feedbacks = await queryAll(`SELECT * FROM Feedback WHERE student_id = ? ORDER BY date DESC LIMIT 20`, [studentId]);
        const helpSeeking = await queryAll(`SELECT * FROM HelpSeeking WHERE student_id = ? ORDER BY timestamp DESC LIMIT 20`, [studentId]);

        return c.json({
            success: true,
            student,
            scorecard: scoreData,
            history: {
                attendances,
                practicals,
                assessments,
                feedbacks,
                helpSeeking
            }
        });
    } catch (err) {
        console.error('Failed to fetch student detail:', err);
        return c.json({ success: false, error: err.message }, 500);
    }
});

// 4. Update Human Review Status for a student
app.post('/api/students/:id/review', async (c) => {
    const studentId = c.req.param('id');
    const body = await c.req.json();
    const { status, notes } = body;

    if (!['unreviewed', 'confirmed', 'false_positive', 'false_negative'].includes(status)) {
        return c.json({ success: false, error: 'Invalid review status' }, 400);
    }

    try {
        const scoreData = await calculateStudentScores(studentId);
        const id = require('crypto').randomUUID();

        // Delete previous risk flag for this student or insert new
        await queryRun(`DELETE FROM RiskFlag WHERE student_id = ?`, [studentId]);
        await queryRun(`INSERT INTO RiskFlag (id, student_id, run_date, total_score, risk_band, confidence_level, per_signal_point_contributions, model_version, human_review_status, reviewer_notes)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [id, studentId, new Date().toISOString(), scoreData.totalScore, scoreData.riskBand, scoreData.confidence, JSON.stringify(scoreData.points), 'scorecard_v1', status, notes || '']);

        return c.json({ success: true, message: 'Review recorded successfully', status, notes });
    } catch (err) {
        console.error('Failed to save review:', err);
        return c.json({ success: false, error: err.message }, 500);
    }
});

// 5. Active Sync Conflicts
app.get('/api/conflicts', async (c) => {
    try {
        const rawConflicts = await queryAll(`
            SELECT p.id, p.student_id, p.date, p.task_id, p.task_name, p.rubric_level, p.instructor_id, p.notes, p.device_id, p.captured_at, p.synced_at, s.name as student_name, s.cohort_trade
            FROM PracticalActivity p
            JOIN Student s ON p.student_id = s.id
            WHERE (p.student_id, date(p.date), p.task_id) IN (
                SELECT student_id, date(date), task_id
                FROM PracticalActivity
                GROUP BY student_id, date(date), task_id
                HAVING count(*) > 1
            )
            ORDER BY p.date DESC, p.student_id ASC
        `);

        // Group by student_id + task_id + date
        const grouped = {};
        for (const item of rawConflicts) {
            const dt = item.date.split('T')[0];
            const key = `${item.student_id}_${item.task_id}_${dt}`;
            if (!grouped[key]) {
                grouped[key] = {
                    conflictKey: key,
                    studentId: item.student_id,
                    studentName: item.student_name,
                    cohortTrade: item.cohort_trade,
                    taskId: item.task_id,
                    taskName: item.task_name,
                    date: dt,
                    records: []
                };
            }
            grouped[key].records.push(item);
        }

        const conflictList = Object.values(grouped);
        return c.json({ success: true, count: conflictList.length, data: conflictList });
    } catch (err) {
        console.error('Failed to fetch conflicts:', err);
        return c.json({ success: false, error: err.message }, 500);
    }
});

// 6. Resolve Conflict
app.post('/api/conflicts/resolve', async (c) => {
    const body = await c.req.json();
    const { authoritativeId, discardedIds, resolvedNotes } = body;

    if (!authoritativeId || !discardedIds || !Array.isArray(discardedIds)) {
        return c.json({ success: false, error: 'Missing authoritativeId or discardedIds' }, 400);
    }

    try {
        // Update authoritative record
        if (resolvedNotes) {
            await queryRun(`UPDATE PracticalActivity SET notes = ? WHERE id = ?`, [`[RESOLVED]: ${resolvedNotes}`, authoritativeId]);
        }

        // Delete discarded entries
        for (const dId of discardedIds) {
            await queryRun(`DELETE FROM PracticalActivity WHERE id = ?`, [dId]);
        }

        return c.json({ success: true, message: 'Conflict resolved successfully', authoritativeId });
    } catch (err) {
        console.error('Failed to resolve conflict:', err);
        return c.json({ success: false, error: err.message }, 500);
    }
});

// 7. Sync Offline Queue (from client IndexedDB)
app.post('/api/sync', async (c) => {
    const body = await c.req.json();
    const { records, deviceId } = body;

    if (!records || !Array.isArray(records)) {
        return c.json({ success: false, error: 'No records provided' }, 400);
    }

    let syncedCount = 0;
    let conflictsDetected = 0;
    const crypto = require('crypto');

    try {
        for (const item of records) {
            const id = crypto.randomUUID();
            const now = new Date().toISOString();

            if (item.type === 'attendance') {
                await queryRun(`INSERT INTO Attendance (id, student_id, date, present, source, captured_offline, device_id, captured_at, synced_at, created_by)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [id, item.student_id, item.date, item.present ? 1 : 0, 'instructor', 1, deviceId || item.device_id || 'mobile_field_device', item.captured_at || now, now, item.created_by || 'instructor']);
                syncedCount++;
            } else if (item.type === 'practical') {
                // Check if existing record exists for same day and task
                const dt = (item.date || now).split('T')[0];
                const existing = await queryGet(`SELECT id, rubric_level, device_id FROM PracticalActivity WHERE student_id = ? AND task_id = ? AND date(date) = ?`, [item.student_id, item.task_id, dt]);

                if (existing && (existing.rubric_level !== item.rubric_level || existing.device_id !== (deviceId || item.device_id))) {
                    conflictsDetected++;
                }

                await queryRun(`INSERT INTO PracticalActivity (id, student_id, date, task_id, task_name, rubric_level, instructor_id, notes, device_id, captured_at, synced_at, created_by)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [id, item.student_id, item.date || now, item.task_id, item.task_name, item.rubric_level, item.instructor_id || 'inst_field', item.notes || '', deviceId || item.device_id || 'mobile_field_device', item.captured_at || now, now, item.created_by || 'instructor']);
                syncedCount++;
            } else if (item.type === 'feedback') {
                await queryRun(`INSERT INTO Feedback (id, student_id, date, source, structured_sentiment, free_text, language, device_id, captured_at, synced_at, created_by)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [id, item.student_id, item.date || now, 'instructor', item.structured_sentiment || 'neutral', item.free_text || '', item.language || 'en', deviceId || item.device_id || 'mobile_field_device', item.captured_at || now, now, item.created_by || 'instructor']);
                syncedCount++;
            }
        }

        return c.json({
            success: true,
            syncedCount,
            conflictsDetected,
            message: `Successfully synced ${syncedCount} record(s). ${conflictsDetected} conflict(s) detected.`
        });
    } catch (err) {
        console.error('Sync failed:', err);
        return c.json({ success: false, error: err.message }, 500);
    }
});

// 8. Performance Metrics & Comparison
app.get('/api/metrics', async (c) => {
    try {
        const students = await queryAll(`SELECT id, name FROM Student`);
        
        let baseline = { TP: 0, FP: 0, TN: 0, FN: 0 };
        let scorecard = { TP: 0, FP: 0, TN: 0, FN: 0 };

        for (const s of students) {
            const actualQuietDisengaging = s.name.includes('Quiet_Disengaging');
            const scoreData = await calculateStudentScores(s.id);

            const bPredicted = scoreData.baselinePrediction === 'needs support';
            const sPredicted = scoreData.riskBand === 'needs support';

            if (bPredicted && actualQuietDisengaging) baseline.TP++;
            else if (bPredicted && !actualQuietDisengaging) baseline.FP++;
            else if (!bPredicted && actualQuietDisengaging) baseline.FN++;
            else baseline.TN++;

            if (sPredicted && actualQuietDisengaging) scorecard.TP++;
            else if (sPredicted && !actualQuietDisengaging) scorecard.FP++;
            else if (!sPredicted && actualQuietDisengaging) scorecard.FN++;
            else scorecard.TN++;
        }

        function getStats(m) {
            const prec = m.TP / (m.TP + m.FP) || 0;
            const rec = m.TP / (m.TP + m.FN) || 0;
            const f1 = (2 * prec * rec) / (prec + rec) || 0;
            return {
                precision: +(prec * 100).toFixed(1),
                recall: +(rec * 100).toFixed(1),
                f1: +(f1 * 100).toFixed(1),
                matrix: m
            };
        }

        const bStats = getStats(baseline);
        const sStats = getStats(scorecard);
        const recallDelta = +(sStats.recall - bStats.recall).toFixed(1);

        return c.json({
            success: true,
            totalStudents: students.length,
            baseline: bStats,
            scorecard: sStats,
            recallDelta,
            targetAchieved: recallDelta >= 15 && sStats.precision >= 50
        });
    } catch (err) {
        return c.json({ success: false, error: err.message }, 500);
    }
});

// 9. LMS / SIS External Ingestion Connector & Webhook
const { parseCSV, ingestLmsBatch } = require('./lib/lms_connector');

app.post('/api/lms/import', async (c) => {
    try {
        const contentType = c.req.header('content-type') || '';
        let records = [];
        let sourcePlatform = 'moodle';

        if (contentType.includes('application/json')) {
            const body = await c.req.json();
            records = Array.isArray(body) ? body : (body.records || []);
            sourcePlatform = body.sourcePlatform || 'moodle';
        } else {
            // Treat as raw CSV
            const rawText = await c.req.text();
            records = parseCSV(rawText);
        }

        if (!records || records.length === 0) {
            return c.json({ success: false, error: 'No valid records parsed from payload' }, 400);
        }

        const result = await ingestLmsBatch(records, { queryRun, queryGet, queryAll }, sourcePlatform);
        return c.json({
            success: true,
            ...result,
            message: `Successfully processed ${result.totalImported} LMS record(s) from ${sourcePlatform}.`
        });
    } catch (err) {
        console.error('LMS import failed:', err);
        return c.json({ success: false, error: err.message }, 500);
    }
});

app.post('/api/lms/webhook', async (c) => {
    try {
        const body = await c.req.json();
        const { event, student_id, score, max_score, present, date, source } = body;
        
        const record = {
            student_id,
            score,
            max_score,
            present,
            date: date || new Date().toISOString()
        };

        const result = await ingestLmsBatch([record], { queryRun, queryGet, queryAll }, source || 'webhook');
        return c.json({ success: true, event, result });
    } catch (err) {
        console.error('LMS webhook error:', err);
        return c.json({ success: false, error: err.message }, 500);
    }
});

// 10. Cohort Data Export (CSV)
app.get('/api/export/cohort', async (c) => {
    try {
        const students = await queryAll(`SELECT * FROM Student ORDER BY cohort_trade ASC, name ASC`);
        const rows = [
            [
                'Student ID',
                'Name',
                'Trade',
                'Language',
                'First Gen',
                'Attendance %',
                'Exam Avg %',
                'Attendance Points',
                'Practicals Points',
                'Assessment Points',
                'Feedback Points',
                'Help Seeking Points',
                'Total Score',
                'Risk Band',
                'Confidence',
                'Human Review Status',
                'Reviewer Notes'
            ].join(',')
        ];

        for (const s of students) {
            const scoreData = await calculateStudentScores(s.id);
            const r = [
                `"${s.id}"`,
                `"${s.name.replace(/"/g, '""')}"`,
                `"${s.cohort_trade}"`,
                `"${s.language_pref}"`,
                s.first_generation_flag ? 'Yes' : 'No',
                `${scoreData.stats ? scoreData.stats.attendancePercent : 0}%`,
                `${scoreData.stats ? scoreData.stats.examAverage : 0}%`,
                scoreData.points.attendance,
                scoreData.points.practicals,
                scoreData.points.assessments,
                scoreData.points.feedback,
                scoreData.points.help_seeking,
                scoreData.totalScore,
                `"${scoreData.riskBand}"`,
                `"${scoreData.confidence}"`,
                `"${scoreData.humanReview.status}"`,
                `"${(scoreData.humanReview.notes || '').replace(/"/g, '""')}"`
            ];
            rows.push(r.join(','));
        }

        const csvContent = rows.join('\r\n');
        return new Response(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="vocational_cohort_risk_export.csv"'
            }
        });
    } catch (err) {
        console.error('Export failed:', err);
        return c.json({ success: false, error: err.message }, 500);
    }
});


// -------------------------------------------------------------
// Serve Frontend Static Files
// -------------------------------------------------------------
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

app.use('/*', serveStatic({ root: './public' }));

// Start server
const PORT = process.env.PORT || 3000;
console.log(`Starting Early-Warning System on port ${PORT}...`);
serve({
    fetch: app.fetch,
    port: PORT
});
console.log(`Server running at http://localhost:${PORT}`);
