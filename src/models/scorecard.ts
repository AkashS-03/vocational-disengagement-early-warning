/**
 * Scorecard Model
 * Transparent, additive point-based system across 5 signal families.
 */

export async function evaluateScorecard(studentId: string, db: any) {
    const points = { attendance: 0, practicals: 0, assessments: 0, help_seeking: 0, feedback: 0 };
    let signalsPresent = 0;

    // 1. Attendance Signal
    const attendances = await db.all(`SELECT present FROM Attendance WHERE student_id = ?`, [studentId]);
    if (attendances.length > 0) {
        signalsPresent++;
        const percent = attendances.filter(a => a.present).length / attendances.length;
        if (percent < 0.75) points.attendance = -3;
        else if (percent < 0.90) points.attendance = 0;
        else points.attendance = 1;
    }

    // 2. Practicals Signal
    const practicals = await db.all(`SELECT rubric_level FROM PracticalActivity WHERE student_id = ?`, [studentId]);
    if (practicals.length > 0) {
        signalsPresent++;
        const developingCount = practicals.filter(p => p.rubric_level === 'developing').length;
        const proficientCount = practicals.filter(p => p.rubric_level === 'proficient' || p.rubric_level === 'competent').length;
        
        if (developingCount > proficientCount) points.practicals = -2;
        else if (proficientCount > developingCount) points.practicals = 2;
        else points.practicals = 0;
    }

    // 3. Assessments Signal (Smoothing out "Single bad day")
    const assessments = await db.all(`SELECT score, max_score FROM Assessment WHERE student_id = ? ORDER BY date ASC`, [studentId]);
    if (assessments.length > 0) {
        signalsPresent++;
        const scores = assessments.map(a => a.score / a.max_score);
        const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        
        // Single bad day check: If avg is > 70% but last score is < 50%, don't overreact
        const lastScore = scores[scores.length - 1];
        if (avg > 0.70 && lastScore < 0.50) {
            points.assessments = 0; // Smoothed
        } else if (avg < 0.60) {
            points.assessments = -2;
        } else {
            points.assessments = 1;
        }
    }

    // 4. Feedback Signal
    const feedbacks = await db.all(`SELECT structured_sentiment FROM Feedback WHERE student_id = ?`, [studentId]);
    if (feedbacks.length > 0) {
        signalsPresent++;
        const negativeCount = feedbacks.filter(f => f.structured_sentiment === 'negative').length;
        if (negativeCount > 0) points.feedback = -3;
        else points.feedback = 1;
    }

    // 5. Help-Seeking Signal (Look for drop-off)
    const help = await db.all(`SELECT timestamp FROM HelpSeeking WHERE student_id = ? ORDER BY timestamp DESC`, [studentId]);
    if (help.length > 0) {
        signalsPresent++;
        // Naive drop-off check: if they used to ask for help but haven't recently
        // For prototype, we'll just assign a nominal value or leave 0 if not enough data
        points.help_seeking = 0; 
    } else {
        // Quietly disengaging often have 0 help seeking
        // We don't penalize strictly for 0, but it doesn't help their score
        points.help_seeking = 0;
    }

    // --- Summation & Banding ---
    const totalScore = Object.values(points).reduce((sum, val) => sum + val, 0);
    
    let riskBand = 'steady';
    if (totalScore <= -3) riskBand = 'needs support';
    else if (totalScore < 0) riskBand = 'watch';

    // --- Confidence Calculation ---
    // If we only have 1 or 2 signals (like a sparse/new-entrant), confidence is Low.
    let confidence = 'high';
    if (signalsPresent <= 2) confidence = 'low';
    else if (signalsPresent === 3) confidence = 'medium';

    return {
        student_id: studentId,
        model_version: 'scorecard_v1',
        risk_band: riskBand,
        confidence_level: confidence,
        total_score: totalScore,
        per_signal_point_contributions: JSON.stringify(points),
        run_date: new Date().toISOString()
    };
}
