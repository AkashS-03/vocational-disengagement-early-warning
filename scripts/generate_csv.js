const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const EXPORT_DIR = path.join(__dirname, '..', 'data_exports');
const WEEKS = 12;
const NUM_STUDENTS = 140; // Plus edge cases

// Helper: Dates
const now = new Date();
function subDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() - days);
    return d.toISOString();
}
function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString();
}

// Data Stores for CSV
const csvData = {
    students: ['id,name,cohort_trade,enrollment_date,language_pref,first_generation_flag,device_tier'],
    attendance: ['student_id,date,present,source,captured_offline,device_id,captured_at,synced_at,created_by'],
    practicals: ['student_id,date,task_id,task_name,rubric_level,instructor_id,notes,device_id,captured_at,synced_at,created_by'],
    assessments: ['student_id,date,assessment_type,score,max_score,device_id,captured_at,synced_at,created_by'],
    feedback: ['student_id,date,source,structured_sentiment,free_text,language,device_id,captured_at,synced_at,created_by'],
    helpSeeking: ['student_id,timestamp,type,initiated_by_student,device_id,captured_at,synced_at,created_by']
};

function pushCSV(table, rowArray) {
    csvData[table].push(rowArray.map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v).join(','));
}

// Data Arrays
const trades = ['electrical', 'welding', 'automotive', 'it_hardware'];
const practicalTasks = {
  electrical: ['Wiring a plug', 'Circuit testing', 'Panel installation'],
  welding: ['MIG welding joint', 'TIG precision', 'Safety inspection'],
  automotive: ['Oil change', 'Brake pad replacement', 'Engine diagnostics'],
  it_hardware: ['PC Assembly', 'Network cabling', 'RAM replacement']
};

// --- Generation Logic ---

function createStudent(profileType, enrolledDaysAgo) {
    const id = crypto.randomUUID();
    const trade = trades[Math.floor(Math.random() * trades.length)];
    const enrollDate = subDays(now, enrolledDaysAgo);
    
    pushCSV('students', [
        id, 
        `Student ${profileType} ${Math.floor(Math.random()*9000)+1000}`, 
        trade, enrollDate, 'en', false, 'high'
    ]);
    return { id, trade, enrollDate: new Date(enrollDate) };
}

// 1. Normal Students
for(let i = 0; i < NUM_STUDENTS; i++) {
    const { id, trade, enrollDate } = createStudent('Normal', 84);
    
    // ~40 attendances
    for(let j=0; j<40; j++) {
        const date = addDays(enrollDate, j*2);
        pushCSV('attendance', [id, date, Math.random() > 0.15 ? 'true' : 'false', 'instructor', 'false', 'd1', date, date, 'inst_1']);
    }

    // 4 assessments
    for(let j=0; j<4; j++) {
        const date = addDays(enrollDate, j*20);
        pushCSV('assessments', [id, date, 'written', Math.floor(Math.random()*30)+70, 100, 'd1', date, date, 'inst_1']);
    }

    // Practicals
    for(let j=0; j<8; j++) {
        const date = addDays(enrollDate, j*10);
        const task = practicalTasks[trade][0];
        pushCSV('practicals', [id, date, 't1', task, 'competent', 'inst_1', '', 'd1', date, date, 'inst_1']);
    }
}

// 2. Edge Case: Quietly Disengaging
for(let i=0; i<3; i++) {
    const { id, trade, enrollDate } = createStudent('Quiet_Disengaging', 84);
    // Great attendance
    for(let j=0; j<40; j++) pushCSV('attendance', [id, addDays(enrollDate, j*2), 'true', 'instructor', 'false', 'd1', addDays(enrollDate, j*2), addDays(enrollDate, j*2), 'inst_1']);
    // Great grades
    pushCSV('assessments', [id, addDays(enrollDate, 30), 'written', 95, 100, 'd1', addDays(enrollDate, 30), addDays(enrollDate, 30), 'inst_1']);
    // Negative feedback recently
    const recent = subDays(now, 5);
    pushCSV('feedback', [id, recent, 'instructor', 'negative', 'Seems completely detached during the workshop recently.', 'en', 'd1', recent, recent, 'inst_1']);
}

// 3. Edge Case: False Baseline Positive (Festival Absence)
for(let i=0; i<3; i++) {
    const { id, trade, enrollDate } = createStudent('False_Baseline_Positive', 84);
    // 5 day block absence
    for(let j=0; j<40; j++) {
        const isFestival = j > 15 && j < 21;
        pushCSV('attendance', [id, addDays(enrollDate, j*2), isFestival ? 'false' : 'true', 'instructor', 'false', 'd1', addDays(enrollDate, j*2), addDays(enrollDate, j*2), 'inst_1']);
    }
    pushCSV('practicals', [id, addDays(enrollDate, 40), 't1', 'Final Exam', 'proficient', 'inst_1', 'Brilliant work', 'd1', addDays(enrollDate, 40), addDays(enrollDate, 40), 'inst_1']);
}

// 4. Edge Case: Sparse / New Entrant
for(let i=0; i<3; i++) {
    const { id } = createStudent('Sparse_NewEntrant', 7);
    pushCSV('attendance', [id, subDays(now, 2), 'true', 'instructor', 'false', 'd1', subDays(now, 2), subDays(now, 2), 'inst_1']);
}

// 5. Edge Case: Single Bad Day
for(let i=0; i<3; i++) {
    const { id, enrollDate } = createStudent('Single_BadDay', 84);
    pushCSV('assessments', [id, addDays(enrollDate, 20), 'written', 90, 100, 'd1', addDays(enrollDate, 20), addDays(enrollDate, 20), 'inst_1']);
    pushCSV('assessments', [id, addDays(enrollDate, 40), 'written', 85, 100, 'd1', addDays(enrollDate, 40), addDays(enrollDate, 40), 'inst_1']);
    pushCSV('assessments', [id, addDays(enrollDate, 60), 'written', 30, 100, 'd1', addDays(enrollDate, 60), addDays(enrollDate, 60), 'inst_1']); // Bad day
}

// 6. Edge Case: Sync Conflict
for(let i=0; i<3; i++) {
    const { id } = createStudent('Sync_Conflict', 84);
    const conflictDate = subDays(now, 2);
    // Instructor A marks developing
    pushCSV('practicals', [id, conflictDate, 't_w1', 'MIG Welding', 'developing', 'inst_A', 'Needs work', 'device_A', conflictDate, subDays(now, 1), 'inst_A']);
    // Instructor B marks competent on same day
    const capturedLater = new Date(conflictDate); capturedLater.setHours(capturedLater.getHours() + 2);
    pushCSV('practicals', [id, conflictDate, 't_w1', 'MIG Welding', 'competent', 'inst_B', 'Looks fine', 'device_B', capturedLater.toISOString(), subDays(now, 1.5), 'inst_B']);
}

// --- Write Files ---
fs.writeFileSync(path.join(EXPORT_DIR, 'students.csv'), csvData.students.join('\n'));
fs.writeFileSync(path.join(EXPORT_DIR, 'attendance.csv'), csvData.attendance.join('\n'));
fs.writeFileSync(path.join(EXPORT_DIR, 'practicals.csv'), csvData.practicals.join('\n'));
fs.writeFileSync(path.join(EXPORT_DIR, 'assessments.csv'), csvData.assessments.join('\n'));
fs.writeFileSync(path.join(EXPORT_DIR, 'feedback.csv'), csvData.feedback.join('\n'));
fs.writeFileSync(path.join(EXPORT_DIR, 'help_seeking.csv'), csvData.helpSeeking.join('\n'));

console.log("CSV Generation Complete in data_exports/ directory.");
