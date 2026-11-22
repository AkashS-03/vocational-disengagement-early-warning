/**
 * LMS / SIS Ingestion Connector
 * 
 * Supports automated ingestion of attendance logs, practical assignment grades,
 * and exam results exported from external LMS platforms (e.g. Moodle, Canvas, Google Classroom).
 */

const crypto = require('crypto');

/**
 * Parses a single CSV line respecting quotes and commas inside quotes
 */
function splitCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
            if (inQuotes && line[i + 1] === char) {
                current += char;
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

/**
 * Parses generic CSV into array of trimmed key-value objects
 */
function parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];
    
    // Header parsing
    const headers = splitCsvLine(lines[0]).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
        const row = splitCsvLine(lines[i]).map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (row.length === headers.length) {
            const entry = {};
            headers.forEach((h, idx) => {
                entry[h] = row[idx];
            });
            records.push(entry);
        }
    }
    return records;
}

/**
 * Ingests LMS Assessment and Attendance records into SQLite
 * 
 * @param {Array<Object>} records Array of records to ingest
 * @param {Object} db Database helper with queryRun, queryGet, queryAll
 * @param {String} sourcePlatform e.g., 'moodle', 'canvas', 'google_classroom'
 */
async function ingestLmsBatch(records, db, sourcePlatform = 'moodle') {
    let importedAssessments = 0;
    let importedAttendance = 0;
    const errors = [];
    const now = new Date().toISOString();

    for (const item of records) {
        try {
            // Find student by ID or name
            let student = null;
            if (item.student_id) {
                student = await db.queryGet(`SELECT id FROM Student WHERE id = ?`, [item.student_id]);
            }
            if (!student && item.student_name) {
                student = await db.queryGet(`SELECT id FROM Student WHERE name LIKE ?`, [`%${item.student_name}%`]);
            }

            if (!student) {
                errors.push(`Student not found for record: ${JSON.stringify(item)}`);
                continue;
            }

            // Ingest Assessment / Gradebook record
            if (item.score !== undefined && (item.max_score !== undefined || item.assessment_type)) {
                const score = parseFloat(item.score);
                const maxScore = parseFloat(item.max_score || 100);
                const assessmentType = item.assessment_type || 'theory_exam';
                const date = item.date ? new Date(item.date).toISOString() : now;
                const id = crypto.randomUUID();

                await db.queryRun(
                    `INSERT INTO Assessment (id, student_id, date, assessment_type, score, max_score, device_id, captured_at, synced_at, created_by)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [id, student.id, date, assessmentType, score, maxScore, `${sourcePlatform}_connector`, now, now, `lms_${sourcePlatform}`]
                );
                importedAssessments++;
            }

            // Ingest Attendance record
            if (item.present !== undefined || item.attendance_status !== undefined) {
                const isPresent = item.present === true || item.present === 'true' || item.present === '1' || item.attendance_status === 'present';
                const date = item.date ? new Date(item.date).toISOString() : now;
                const id = crypto.randomUUID();

                await db.queryRun(
                    `INSERT INTO Attendance (id, student_id, date, present, source, captured_offline, device_id, captured_at, synced_at, created_by)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [id, student.id, date, isPresent ? 1 : 0, `${sourcePlatform}_lms`, 0, `${sourcePlatform}_sync`, now, now, `lms_${sourcePlatform}`]
                );
                importedAttendance++;
            }
        } catch (err) {
            errors.push(`Failed to ingest record ${JSON.stringify(item)}: ${err.message}`);
        }
    }

    return {
        success: errors.length === 0,
        importedAssessments,
        importedAttendance,
        totalImported: importedAssessments + importedAttendance,
        errors
    };
}

module.exports = {
    parseCSV,
    ingestLmsBatch
};
