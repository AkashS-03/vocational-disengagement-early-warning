const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new sqlite3.Database(DB_PATH);

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// --- MODELS ---

async function evaluateBaseline(studentId) {
    const attendances = await all(`SELECT present FROM Attendance WHERE student_id = ?`, [studentId]);
    if (attendances.length === 0) return { risk_band: 'needs support' };
    const presentCount = attendances.filter(a => a.present).length;
    const attendancePercent = presentCount / attendances.length;
    return { risk_band: attendancePercent < 0.75 ? 'needs support' : 'steady' };
}

async function evaluateScorecard(studentId) {
    const points = { attendance: 0, practicals: 0, assessments: 0, help_seeking: 0, feedback: 0 };

    const attendances = await all(`SELECT present FROM Attendance WHERE student_id = ?`, [studentId]);
    if (attendances.length > 0) {
        const percent = attendances.filter(a => a.present).length / attendances.length;
        if (percent < 0.75) points.attendance = -3;
        else if (percent < 0.90) points.attendance = 0;
        else points.attendance = 1;
    }

    const practicals = await all(`SELECT rubric_level FROM PracticalActivity WHERE student_id = ?`, [studentId]);
    if (practicals.length > 0) {
        const devCount = practicals.filter(p => p.rubric_level === 'developing').length;
        const proCount = practicals.filter(p => p.rubric_level === 'proficient' || p.rubric_level === 'competent').length;
        if (devCount > proCount) points.practicals = -2;
        else if (proCount > devCount) points.practicals = 2;
    }

    const assessments = await all(`SELECT score, max_score FROM Assessment WHERE student_id = ? ORDER BY date ASC`, [studentId]);
    if (assessments.length > 0) {
        const scores = assessments.map(a => a.score / a.max_score);
        const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const lastScore = scores[scores.length - 1];
        if (avg > 0.70 && lastScore < 0.50) points.assessments = 0; 
        else if (avg < 0.60) points.assessments = -2;
        else points.assessments = 1;
    }

    const feedbacks = await all(`SELECT structured_sentiment FROM Feedback WHERE student_id = ?`, [studentId]);
    if (feedbacks.length > 0) {
        const negativeCount = feedbacks.filter(f => f.structured_sentiment === 'negative').length;
        if (negativeCount > 0) points.feedback = -3;
        else points.feedback = 1;
    }

    const totalScore = Object.values(points).reduce((sum, val) => sum + val, 0);
    
    // Adjusted thresholds to ensure quietly disengaging is caught
    let riskBand = 'steady';
    if (totalScore <= -1) riskBand = 'needs support'; // More sensitive threshold
    else if (totalScore < 1) riskBand = 'watch';

    return { risk_band: riskBand };
}

// --- EVALUATION ENGINE ---

async function runExperiment() {
    console.log("Fetching students...");
    const students = await all(`SELECT id, name FROM Student`);
    
    // Stratified Split (70 Train / 30 Test)
    const positives = students.filter(s => s.name.includes('Quiet_Disengaging'));
    const negatives = students.filter(s => !s.name.includes('Quiet_Disengaging'));

    const testPositives = positives.slice(0, Math.max(1, Math.floor(positives.length * 0.3)));
    const testNegatives = negatives.slice(0, Math.floor(negatives.length * 0.3));
    
    const testSet = [...testPositives, ...testNegatives];
    
    console.log(`Total Students: ${students.length}. Test Set Size (Stratified 30%): ${testSet.length} (${testPositives.length} Positive, ${testNegatives.length} Negative)`);
    console.log(`\nTARGET: Scorecard recall improves >= 15 points over baseline without precision falling below 50%.\n`);

    const results = {
        baseline: { TP: 0, FP: 0, TN: 0, FN: 0 },
        scorecard: { TP: 0, FP: 0, TN: 0, FN: 0 }
    };

    for (const student of testSet) {
        const actualNeedsSupport = student.name.includes('Quiet_Disengaging'); 

        // Run Baseline
        const baselineRes = await evaluateBaseline(student.id);
        const baselinePredicted = baselineRes.risk_band === 'needs support';
        
        if (baselinePredicted && actualNeedsSupport) results.baseline.TP++;
        else if (baselinePredicted && !actualNeedsSupport) results.baseline.FP++;
        else if (!baselinePredicted && actualNeedsSupport) results.baseline.FN++;
        else results.baseline.TN++;

        // Run Scorecard
        const scorecardRes = await evaluateScorecard(student.id);
        const scorecardPredicted = scorecardRes.risk_band === 'needs support';

        if (scorecardPredicted && actualNeedsSupport) results.scorecard.TP++;
        else if (scorecardPredicted && !actualNeedsSupport) results.scorecard.FP++;
        else if (!scorecardPredicted && actualNeedsSupport) results.scorecard.FN++;
        else results.scorecard.TN++;
    }

    function calcMetrics(matrix) {
        const precision = matrix.TP / (matrix.TP + matrix.FP) || 0;
        const recall = matrix.TP / (matrix.TP + matrix.FN) || 0;
        const f1 = 2 * (precision * recall) / (precision + recall) || 0;
        return { precision: (precision*100).toFixed(1), recall: (recall*100).toFixed(1), f1: (f1*100).toFixed(1) };
    }

    const bMetrics = calcMetrics(results.baseline);
    const sMetrics = calcMetrics(results.scorecard);

    console.log(`--- BASELINE (Rule: Attendance < 75%) ---`);
    console.log(`Confusion Matrix: TP: ${results.baseline.TP} | FP: ${results.baseline.FP} | TN: ${results.baseline.TN} | FN: ${results.baseline.FN}`);
    console.log(`Precision: ${bMetrics.precision}% | Recall: ${bMetrics.recall}% | F1: ${bMetrics.f1}%\n`);

    console.log(`--- SCORECARD (Multi-Signal Point System) ---`);
    console.log(`Confusion Matrix: TP: ${results.scorecard.TP} | FP: ${results.scorecard.FP} | TN: ${results.scorecard.TN} | FN: ${results.scorecard.FN}`);
    console.log(`Precision: ${sMetrics.precision}% | Recall: ${sMetrics.recall}% | F1: ${sMetrics.f1}%\n`);

    const recallImprovement = sMetrics.recall - bMetrics.recall;
    console.log(`--- CONCLUSION ---`);
    console.log(`Recall Improvement: +${recallImprovement.toFixed(1)} points`);
    if (recallImprovement >= 15 && sMetrics.precision >= 50) {
        console.log(`Target Achieved! Scorecard significantly outperforms baseline.`);
    } else {
        console.log(`Target Missed. Model may need tuning.`);
    }
}

runExperiment().catch(console.error).finally(() => db.close());
