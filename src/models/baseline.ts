/**
 * Baseline Model
 * Naive rule: "Flag if attendance < 75%"
 */
export async function evaluateBaseline(studentId, db) {
    // 1. Calculate Attendance %
    const attendances = await db.all(`SELECT present FROM Attendance WHERE student_id = ?`, [studentId]);
    
    if (attendances.length === 0) {
        return {
            student_id: studentId,
            model_version: 'baseline',
            risk_band: 'needs support',
            confidence_level: 'low',
            total_score: 0,
            per_signal_point_contributions: JSON.stringify({ attendance: 0 }),
            run_date: new Date().toISOString()
        };
    }

    const presentCount = attendances.filter(a => a.present).length;
    const attendancePercent = presentCount / attendances.length;

    // 2. Apply Baseline Rule
    const riskBand = attendancePercent < 0.75 ? 'needs support' : 'steady';

    return {
        student_id: studentId,
        model_version: 'baseline',
        risk_band: riskBand,
        confidence_level: 'high',
        total_score: attendancePercent < 0.75 ? 1 : 0,
        per_signal_point_contributions: JSON.stringify({ attendance_percent: Math.round(attendancePercent * 100) }),
        run_date: new Date().toISOString()
    };
}
