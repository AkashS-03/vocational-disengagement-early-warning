const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');
const EXPORT_DIR = path.join(__dirname, '..', 'data_exports');

const db = new sqlite3.Database(DB_PATH);

// Run DB queries as Promises
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}
function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function initDB() {
    console.log("Initializing database schema...");
    
    await run(`CREATE TABLE IF NOT EXISTS Student (
        id TEXT PRIMARY KEY, name TEXT, cohort_trade TEXT, enrollment_date DATETIME,
        language_pref TEXT DEFAULT 'en', first_generation_flag BOOLEAN, device_tier TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await run(`CREATE TABLE IF NOT EXISTS Attendance (
        id TEXT PRIMARY KEY, student_id TEXT, date DATETIME, present BOOLEAN, source TEXT,
        captured_offline BOOLEAN, device_id TEXT, captured_at DATETIME, synced_at DATETIME, created_by TEXT
    )`);

    await run(`CREATE TABLE IF NOT EXISTS PracticalActivity (
        id TEXT PRIMARY KEY, student_id TEXT, date DATETIME, task_id TEXT, task_name TEXT,
        rubric_level TEXT, instructor_id TEXT, notes TEXT, device_id TEXT, captured_at DATETIME, 
        synced_at DATETIME, created_by TEXT
    )`);

    await run(`CREATE TABLE IF NOT EXISTS Assessment (
        id TEXT PRIMARY KEY, student_id TEXT, date DATETIME, assessment_type TEXT, score REAL, 
        max_score REAL, device_id TEXT, captured_at DATETIME, synced_at DATETIME, created_by TEXT
    )`);

    await run(`CREATE TABLE IF NOT EXISTS HelpSeeking (
        id TEXT PRIMARY KEY, student_id TEXT, timestamp DATETIME, type TEXT, initiated_by_student BOOLEAN, 
        device_id TEXT, captured_at DATETIME, synced_at DATETIME, created_by TEXT
    )`);

    await run(`CREATE TABLE IF NOT EXISTS Feedback (
        id TEXT PRIMARY KEY, student_id TEXT, date DATETIME, source TEXT, structured_sentiment TEXT, 
        free_text TEXT, language TEXT, device_id TEXT, captured_at DATETIME, synced_at DATETIME, created_by TEXT
    )`);

    await run(`CREATE TABLE IF NOT EXISTS RiskFlag (
        id TEXT PRIMARY KEY, student_id TEXT, run_date DATETIME, total_score INTEGER, risk_band TEXT, 
        confidence_level TEXT, per_signal_point_contributions TEXT, model_version TEXT, 
        human_review_status TEXT, reviewer_notes TEXT
    )`);

    // Clear existing data for idempotency
    await run(`DELETE FROM RiskFlag`);
    await run(`DELETE FROM Feedback`);
    await run(`DELETE FROM HelpSeeking`);
    await run(`DELETE FROM Assessment`);
    await run(`DELETE FROM PracticalActivity`);
    await run(`DELETE FROM Attendance`);
    await run(`DELETE FROM Student`);
}

function parseCSVLine(text) {
    const re = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
    return text.split(re).map(v => v.replace(/^"|"$/g, '').trim());
}

async function loadCSV(filename) {
    const filePath = path.join(EXPORT_DIR, filename);
    if (!fs.existsSync(filePath)) return [];
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim() !== '');
    if (lines.length < 2) return [];
    
    const headers = parseCSVLine(lines[0]);
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const obj = {};
        headers.forEach((h, idx) => obj[h] = values[idx]);
        data.push(obj);
    }
    return data;
}

const uuid = () => require('crypto').randomUUID();

async function ingestStudents() {
    console.log("Ingesting Students...");
    const rows = await loadCSV('students.csv');
    for (const r of rows) {
        await run(`INSERT INTO Student (id, name, cohort_trade, enrollment_date, language_pref, first_generation_flag, device_tier) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                   [r.id, r.name, r.cohort_trade, r.enrollment_date, r.language_pref, r.first_generation_flag === 'true' ? 1 : 0, r.device_tier]);
    }
    console.log(`-> Inserted ${rows.length} students`);
}

async function ingestAttendance() {
    console.log("Ingesting Attendance...");
    const rows = await loadCSV('attendance.csv');
    for (const r of rows) {
        await run(`INSERT INTO Attendance (id, student_id, date, present, source, captured_offline, device_id, captured_at, synced_at, created_by)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                   [uuid(), r.student_id, r.date, r.present === 'true' ? 1 : 0, r.source, r.captured_offline === 'true' ? 1 : 0, r.device_id, r.captured_at, r.synced_at, r.created_by]);
    }
    console.log(`-> Inserted ${rows.length} attendance records`);
}

async function ingestPracticals() {
    console.log("Ingesting Practicals...");
    const rows = await loadCSV('practicals.csv');
    for (const r of rows) {
        await run(`INSERT INTO PracticalActivity (id, student_id, date, task_id, task_name, rubric_level, instructor_id, notes, device_id, captured_at, synced_at, created_by)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                   [uuid(), r.student_id, r.date, r.task_id, r.task_name, r.rubric_level, r.instructor_id, r.notes, r.device_id, r.captured_at, r.synced_at, r.created_by]);
    }
    console.log(`-> Inserted ${rows.length} practical records`);
}

async function ingestAssessments() {
    console.log("Ingesting Assessments...");
    const rows = await loadCSV('assessments.csv');
    for (const r of rows) {
        await run(`INSERT INTO Assessment (id, student_id, date, assessment_type, score, max_score, device_id, captured_at, synced_at, created_by)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                   [uuid(), r.student_id, r.date, r.assessment_type, parseFloat(r.score), parseFloat(r.max_score), r.device_id, r.captured_at, r.synced_at, r.created_by]);
    }
    console.log(`-> Inserted ${rows.length} assessment records`);
}

async function ingestFeedback() {
    console.log("Ingesting Feedback...");
    const rows = await loadCSV('feedback.csv');
    for (const r of rows) {
        await run(`INSERT INTO Feedback (id, student_id, date, source, structured_sentiment, free_text, language, device_id, captured_at, synced_at, created_by)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                   [uuid(), r.student_id, r.date, r.source, r.structured_sentiment, r.free_text, r.language, r.device_id, r.captured_at, r.synced_at, r.created_by]);
    }
    console.log(`-> Inserted ${rows.length} feedback records`);
}

async function main() {
    console.log("Starting Raw SQLite Data Ingestion Pipeline...");
    await initDB();
    await ingestStudents();
    await ingestAttendance();
    await ingestPracticals();
    await ingestAssessments();
    await ingestFeedback();
    
    console.log("Analyzing Sync Conflicts...");
    const conflicts = await all(`
        SELECT student_id, date(date) as conf_date, task_id, count(*) as count
        FROM PracticalActivity
        GROUP BY student_id, conf_date, task_id
        HAVING count(*) > 1
    `);
    
    if (conflicts.length > 0) {
        console.log(`\n[WARNING] Detected ${conflicts.length} sync conflict(s) in PracticalActivity!`);
        console.log("These occur when two instructors log data for the same student/task offline on the same day.");
        console.log("The sync engine correctly ingested both (no silent overwrites). They will be surfaced to the coordinator dashboard.");
    }

    console.log("\nPipeline Complete. The database is now ready for the Risk Model analysis.");
}

main().catch(console.error).finally(() => db.close());
