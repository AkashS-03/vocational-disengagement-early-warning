import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', '..', 'prisma', 'dev.db');
export const sqliteDb = new sqlite3.Database(DB_PATH);

// Helper for Promisified SQLite Queries
export function queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
        sqliteDb.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows as T[]);
        });
    });
}

export function queryGet<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    return new Promise((resolve, reject) => {
        sqliteDb.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve((row as T) || null);
        });
    });
}

export function queryRun(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
        sqliteDb.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

/**
 * Prisma Compatibility Adapter
 * Enables direct SQLite access while preserving Prisma API signatures
 */
const uuid = () => require('crypto').randomUUID();

export const prisma = {
    $disconnect: async () => {},
    student: {
        findMany: async (args?: any) => {
            return queryAll(`SELECT * FROM Student ORDER BY name ASC`);
        },
        findFirst: async (args: { where: { id: string } }) => {
            return queryGet(`SELECT * FROM Student WHERE id = ?`, [args.where.id]);
        },
        create: async (args: { data: any }) => {
            const id = args.data.id || uuid();
            const d = args.data;
            await queryRun(`INSERT INTO Student (id, name, cohort_trade, enrollment_date, language_pref, first_generation_flag, device_tier)
                            VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [id, d.name, d.cohort_trade, new Date(d.enrollment_date).toISOString(), d.language_pref || 'en', d.first_generation_flag ? 1 : 0, d.device_tier || 'high']);
            return { id, ...d };
        },
        deleteMany: async () => queryRun(`DELETE FROM Student`)
    },
    attendance: {
        create: async (args: { data: any }) => {
            const id = args.data.id || uuid();
            const d = args.data;
            await queryRun(`INSERT INTO Attendance (id, student_id, date, present, source, captured_offline, device_id, captured_at, synced_at, created_by)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [id, d.student_id, new Date(d.date).toISOString(), d.present ? 1 : 0, d.source || 'instructor', d.captured_offline ? 1 : 0, d.device_id || 'dev', new Date(d.captured_at || Date.now()).toISOString(), new Date(d.synced_at || Date.now()).toISOString(), d.created_by || 'inst']);
            return { id, ...d };
        },
        deleteMany: async () => queryRun(`DELETE FROM Attendance`)
    },
    practicalActivity: {
        create: async (args: { data: any }) => {
            const id = args.data.id || uuid();
            const d = args.data;
            await queryRun(`INSERT INTO PracticalActivity (id, student_id, date, task_id, task_name, rubric_level, instructor_id, notes, device_id, captured_at, synced_at, created_by)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [id, d.student_id, new Date(d.date).toISOString(), d.task_id, d.task_name, d.rubric_level, d.instructor_id, d.notes || '', d.device_id || 'dev', new Date(d.captured_at || Date.now()).toISOString(), new Date(d.synced_at || Date.now()).toISOString(), d.created_by || 'inst']);
            return { id, ...d };
        },
        findFirst: async (args: { where: { student_id: string; task_id: string; date?: any } }) => {
            const { student_id, task_id, date } = args.where;
            if (date && date.gte) {
                const startStr = new Date(date.gte).toISOString();
                const endStr = new Date(date.lte).toISOString();
                return queryGet(`SELECT * FROM PracticalActivity WHERE student_id = ? AND task_id = ? AND date >= ? AND date <= ?`, [student_id, task_id, startStr, endStr]);
            }
            return queryGet(`SELECT * FROM PracticalActivity WHERE student_id = ? AND task_id = ?`, [student_id, task_id]);
        },
        findMany: async (args?: any) => {
            return queryAll(`
                SELECT p.*, s.name as student_name, s.cohort_trade
                FROM PracticalActivity p
                JOIN Student s ON p.student_id = s.id
                ORDER BY p.captured_at DESC
            `);
        },
        update: async (args: { where: { id: string }; data: any }) => {
            if (args.data.notes) {
                await queryRun(`UPDATE PracticalActivity SET notes = ? WHERE id = ?`, [args.data.notes, args.where.id]);
            }
            return { id: args.where.id, ...args.data };
        },
        delete: async (args: { where: { id: string } }) => {
            return queryRun(`DELETE FROM PracticalActivity WHERE id = ?`, [args.where.id]);
        },
        deleteMany: async () => queryRun(`DELETE FROM PracticalActivity`)
    },
    assessment: {
        create: async (args: { data: any }) => {
            const id = args.data.id || uuid();
            const d = args.data;
            await queryRun(`INSERT INTO Assessment (id, student_id, date, assessment_type, score, max_score, device_id, captured_at, synced_at, created_by)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [id, d.student_id, new Date(d.date).toISOString(), d.assessment_type, d.score, d.max_score, d.device_id || 'dev', new Date(d.captured_at || Date.now()).toISOString(), new Date(d.synced_at || Date.now()).toISOString(), d.created_by || 'inst']);
            return { id, ...d };
        },
        deleteMany: async () => queryRun(`DELETE FROM Assessment`)
    },
    helpSeeking: {
        create: async (args: { data: any }) => {
            const id = args.data.id || uuid();
            const d = args.data;
            await queryRun(`INSERT INTO HelpSeeking (id, student_id, timestamp, type, initiated_by_student, device_id, captured_at, synced_at, created_by)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [id, d.student_id, new Date(d.timestamp).toISOString(), d.type, d.initiated_by_student ? 1 : 0, d.device_id || 'dev', new Date(d.captured_at || Date.now()).toISOString(), new Date(d.synced_at || Date.now()).toISOString(), d.created_by || 'inst']);
            return { id, ...d };
        },
        deleteMany: async () => queryRun(`DELETE FROM HelpSeeking`)
    },
    feedback: {
        create: async (args: { data: any }) => {
            const id = args.data.id || uuid();
            const d = args.data;
            await queryRun(`INSERT INTO Feedback (id, student_id, date, source, structured_sentiment, free_text, language, device_id, captured_at, synced_at, created_by)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [id, d.student_id, new Date(d.date).toISOString(), d.source, d.structured_sentiment, d.free_text || '', d.language || 'en', d.device_id || 'dev', new Date(d.captured_at || Date.now()).toISOString(), new Date(d.synced_at || Date.now()).toISOString(), d.created_by || 'inst']);
            return { id, ...d };
        },
        deleteMany: async () => queryRun(`DELETE FROM Feedback`)
    },
    riskFlag: {
        create: async (args: { data: any }) => {
            const id = args.data.id || uuid();
            const d = args.data;
            await queryRun(`INSERT INTO RiskFlag (id, student_id, run_date, total_score, risk_band, confidence_level, per_signal_point_contributions, model_version, human_review_status, reviewer_notes)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [id, d.student_id, new Date(d.run_date).toISOString(), d.total_score, d.risk_band, d.confidence_level, d.per_signal_point_contributions, d.model_version, d.human_review_status || 'unreviewed', d.reviewer_notes || '']);
            return { id, ...d };
        },
        deleteMany: async () => queryRun(`DELETE FROM RiskFlag`)
    }
};

export default prisma;
