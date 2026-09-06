import { PrismaClient } from '@prisma/client';
import { addDays, subDays, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

const trades = ['electrical', 'welding', 'automotive', 'it_hardware'];
const languages = ['en', 'ta'];
const deviceTiers = ['low', 'medium', 'high'];
const practicalTasks = {
  electrical: ['Wiring a plug', 'Circuit testing', 'Panel installation'],
  welding: ['MIG welding joint', 'TIG precision', 'Safety inspection'],
  automotive: ['Oil change', 'Brake pad replacement', 'Engine diagnostics'],
  it_hardware: ['PC Assembly', 'Network cabling', 'RAM replacement']
};
const rubricLevels = ['not_observed', 'developing', 'competent', 'proficient'];

// Utility to get a random item from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Utility to get random int between min and max (inclusive)
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random date in the past 12 weeks
function randomDateWithin(weeks: number) {
  const days = weeks * 7;
  return subDays(new Date(), randomInt(0, days));
}

// Ensure the DB is clear before seeding
async function clearDB() {
  await prisma.riskFlag.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.helpSeeking.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.practicalActivity.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.student.deleteMany();
}

// Create a typical student
async function createStudent(profileType: string) {
  const trade = randomItem(trades);
  const enrollmentDate = profileType === 'sparse' ? subDays(new Date(), 7) : subDays(new Date(), 84); // Sparse enrolled 1 week ago, others 12 weeks ago

  const student = await prisma.student.create({
    data: {
      name: `Student ${profileType} ${randomInt(1000, 9999)}`,
      cohort_trade: trade,
      enrollment_date: enrollmentDate,
      language_pref: randomItem(languages),
      first_generation_flag: Math.random() > 0.7,
      device_tier: randomItem(deviceTiers),
    },
  });

  return { student, trade, enrollmentDate };
}

// Default generation behavior
async function generateNormalStudent() {
  const { student, trade, enrollmentDate } = await createStudent('normal');

  // Attendance (around 85% presence)
  for (let i = 0; i < 40; i++) { // ~40 classes over 12 weeks
    const date = addDays(enrollmentDate, i * 2); // roughly every 2 days
    if (date > new Date()) break;

    await prisma.attendance.create({
      data: {
        student_id: student.id,
        date: date,
        present: Math.random() > 0.15, // 85% present
        source: 'instructor',
        device_id: 'device-instructor-1',
        captured_at: date,
        created_by: 'instructor_1'
      }
    });
  }

  // Assessments (3-5 assessments)
  const numAssessments = randomInt(3, 5);
  for (let i = 0; i < numAssessments; i++) {
    await prisma.assessment.create({
      data: {
        student_id: student.id,
        date: addDays(enrollmentDate, i * 14),
        assessment_type: randomItem(['written', 'practical', 'quiz']),
        score: randomInt(60, 95),
        max_score: 100,
        device_id: 'device-instructor-1',
        captured_at: new Date(),
        created_by: 'instructor_1'
      }
    });
  }

  // Practical activities
  for (let i = 0; i < 10; i++) {
    const taskName = randomItem(practicalTasks[trade as keyof typeof practicalTasks]);
    await prisma.practicalActivity.create({
      data: {
        student_id: student.id,
        date: addDays(enrollmentDate, i * 7),
        task_id: `task_${randomInt(1,10)}`,
        task_name: taskName,
        rubric_level: randomItem(['developing', 'competent', 'proficient']),
        instructor_id: 'instructor_1',
        device_id: 'device-instructor-1',
        captured_at: new Date(),
        created_by: 'instructor_1'
      }
    });
  }
}

// Persona 1: Quietly disengaging
// Good attendance and grades, declining help-seeking and negative feedback. Baseline ignores, scorecard flags.
async function generateQuietlyDisengaging() {
  const { student, trade, enrollmentDate } = await createStudent('quiet_disengaging');
  
  // 95% attendance
  for (let i = 0; i < 40; i++) {
    const date = addDays(enrollmentDate, i * 2);
    if (date > new Date()) break;
    await prisma.attendance.create({
      data: { student_id: student.id, date, present: Math.random() > 0.05, source: 'instructor', device_id: 'd1', captured_at: date, created_by: 'i1' }
    });
  }
  
  // Good grades
  await prisma.assessment.create({ data: { student_id: student.id, date: addDays(enrollmentDate, 30), assessment_type: 'written', score: 88, max_score: 100, device_id: 'd1', captured_at: new Date(), created_by: 'i1' } });

  // Negative feedback recently
  await prisma.feedback.create({
    data: {
      student_id: student.id, date: subDays(new Date(), 5), source: 'instructor', structured_sentiment: 'negative', free_text: 'Seems distracted during workshop.', language: 'en', device_id: 'd1', captured_at: new Date(), created_by: 'i1'
    }
  });
}

// Persona 2: False-baseline-positive
// Attendance dips due to festival, but all else strong.
async function generateFalseBaselinePositive() {
  const { student, trade, enrollmentDate } = await createStudent('false_baseline_pos');
  
  // Attendance: Good, but 5 days consecutive absence (festival)
  const festivalStart = 15;
  for (let i = 0; i < 40; i++) {
    const date = addDays(enrollmentDate, i * 2);
    if (date > new Date()) break;
    const isFestival = i >= festivalStart && i <= festivalStart + 5;
    
    await prisma.attendance.create({
      data: { student_id: student.id, date, present: !isFestival, source: 'instructor', device_id: 'd1', captured_at: date, created_by: 'i1' }
    });
  }

  // Very strong practicals
  await prisma.practicalActivity.create({
    data: { student_id: student.id, date: new Date(), task_id: 't1', task_name: 'Final Project', rubric_level: 'proficient', instructor_id: 'i1', device_id: 'd1', captured_at: new Date(), created_by: 'i1' }
  });
}

// Persona 3: Sparse/new-entrant
// Missing history
async function generateSparse() {
  const { student } = await createStudent('sparse'); // Enrolled 7 days ago
  
  await prisma.attendance.create({
    data: { student_id: student.id, date: subDays(new Date(), 2), present: true, source: 'instructor', device_id: 'd1', captured_at: new Date(), created_by: 'i1' }
  });
}

// Persona 4: Single bad day
// Strong overall, one 30% assessment
async function generateSingleBadDay() {
  const { student, enrollmentDate } = await createStudent('single_bad_day');
  
  await prisma.assessment.create({ data: { student_id: student.id, date: addDays(enrollmentDate, 20), assessment_type: 'written', score: 90, max_score: 100, device_id: 'd1', captured_at: new Date(), created_by: 'i1' } });
  await prisma.assessment.create({ data: { student_id: student.id, date: addDays(enrollmentDate, 40), assessment_type: 'written', score: 85, max_score: 100, device_id: 'd1', captured_at: new Date(), created_by: 'i1' } });
  
  // Single bad day
  await prisma.assessment.create({ data: { student_id: student.id, date: addDays(enrollmentDate, 60), assessment_type: 'written', score: 30, max_score: 100, device_id: 'd1', captured_at: new Date(), created_by: 'i1' } });

  // Still good practicals
  await prisma.practicalActivity.create({ data: { student_id: student.id, date: new Date(), task_id: 't1', task_name: 'Test', rubric_level: 'competent', instructor_id: 'i1', device_id: 'd1', captured_at: new Date(), created_by: 'i1' } });
}

// Persona 5: Sync conflict
// Two instructors logged different rubric levels offline and synced
async function generateSyncConflict() {
  const { student } = await createStudent('sync_conflict');
  const conflictDate = startOfDay(new Date());

  await prisma.practicalActivity.create({
    data: {
      student_id: student.id,
      date: conflictDate,
      task_id: 'task_welding_1',
      task_name: 'MIG welding joint',
      rubric_level: 'developing',
      instructor_id: 'instructor_A',
      device_id: 'device_A',
      captured_at: addDays(conflictDate, 0.1),
      synced_at: addDays(conflictDate, 0.5),
      created_by: 'instructor_A'
    }
  });

  await prisma.practicalActivity.create({
    data: {
      student_id: student.id,
      date: conflictDate,
      task_id: 'task_welding_1',
      task_name: 'MIG welding joint',
      rubric_level: 'competent',
      instructor_id: 'instructor_B',
      device_id: 'device_B',
      captured_at: addDays(conflictDate, 0.2), // Later capture
      synced_at: addDays(conflictDate, 0.4), // But earlier sync
      created_by: 'instructor_B'
    }
  });
}

async function main() {
  console.log("Clearing DB...");
  await clearDB();

  console.log("Generating normal students...");
  for (let i = 0; i < 140; i++) {
    await generateNormalStudent();
  }

  console.log("Generating edge cases...");
  for (let i = 0; i < 3; i++) await generateQuietlyDisengaging();
  for (let i = 0; i < 3; i++) await generateFalseBaselinePositive();
  for (let i = 0; i < 3; i++) await generateSparse();
  for (let i = 0; i < 3; i++) await generateSingleBadDay();
  for (let i = 0; i < 3; i++) await generateSyncConflict();

  console.log("Data generation complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
