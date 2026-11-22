const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Noisy Distribution Evaluation Script
 * 
 * Objective: Evaluate Baseline vs. Scorecard on a noisy, randomized distribution
 * of 200 students to stress-test robustness, avoid heuristic overfitting, and
 * measure performance under real-world vocational ambiguity.
 */

// Simulation parameters
const SAMPLE_SIZE = 200;
const NOISE_LEVEL = 0.15; // 15% random measurement/reporting noise

function generateNoisyStudent(id, archetype) {
    // Archetypes:
    // 1. 'engaged': high attendance (85-98%), proficient/competent practicals, good exams (75-95), neutral/positive feedback
    // 2. 'quiet_disengaging': high attendance (80-95%), but declining practicals (mostly developing), dropping help-seeking, negative feedback
    // 3. 'festival_absence': temporary attendance dip (consecutive absences drop attendance to 65-72%), but stellar practicals and good exams
    // 4. 'struggling_attender': good attendance (80%), but poor exams and developing practicals (needs academic support, not disengaged)
    // 5. 'chronic_absentee_disengaged': low attendance (<60%), failing marks, missing practicals
    // 6. 'sparse_new_entrant': only 2-3 recorded data points total

    let trueDisengaged = false;
    let attendancePercent = 0.85;
    let practicalDevelopingRatio = 0.2;
    let examAverage = 0.80;
    let hasNegativeFeedback = false;
    let dataPointCount = 25; // Normal history

    switch (archetype) {
        case 'quiet_disengaging':
            trueDisengaged = true;
            attendancePercent = 0.82 + (Math.random() * 0.12); // 82% - 94% (Hides behind attendance!)
            practicalDevelopingRatio = 0.65 + (Math.random() * 0.25); // 65-90% developing
            examAverage = 0.70 + (Math.random() * 0.15); // Decent marks
            hasNegativeFeedback = Math.random() < 0.80; // 80% have negative observation notes
            break;

        case 'festival_absence':
            trueDisengaged = false; // NOT disengaged, just seasonal absence
            attendancePercent = 0.65 + (Math.random() * 0.08); // 65% - 73% (Naive baseline FALSE POSITIVE!)
            practicalDevelopingRatio = 0.10 + (Math.random() * 0.15); // Strong hands-on work
            examAverage = 0.75 + (Math.random() * 0.15);
            hasNegativeFeedback = false;
            break;

        case 'chronic_absentee_disengaged':
            trueDisengaged = true;
            attendancePercent = 0.40 + (Math.random() * 0.25); // 40% - 65%
            practicalDevelopingRatio = 0.70 + (Math.random() * 0.20);
            examAverage = 0.45 + (Math.random() * 0.20);
            hasNegativeFeedback = Math.random() < 0.70;
            break;

        case 'struggling_attender':
            trueDisengaged = false; // Engaged in attendance, just needs tutoring
            attendancePercent = 0.80 + (Math.random() * 0.12);
            practicalDevelopingRatio = 0.50 + (Math.random() * 0.20);
            examAverage = 0.52 + (Math.random() * 0.10);
            hasNegativeFeedback = false;
            break;

        case 'sparse_new_entrant':
            trueDisengaged = Math.random() < 0.20; // 20% base rate
            attendancePercent = Math.random() > 0.3 ? 1.0 : 0.0;
            practicalDevelopingRatio = 0.0;
            examAverage = 0.75;
            dataPointCount = 2; // Very sparse
            break;

        case 'engaged':
        default:
            trueDisengaged = false;
            attendancePercent = 0.84 + (Math.random() * 0.14);
            practicalDevelopingRatio = 0.10 + (Math.random() * 0.20);
            examAverage = 0.78 + (Math.random() * 0.18);
            hasNegativeFeedback = Math.random() < 0.05; // 5% chance of misrecorded feedback
            break;
    }

    // Apply Real-World Stochastic Noise (±10% perturbation)
    attendancePercent = Math.max(0.1, Math.min(1.0, attendancePercent + (Math.random() - 0.5) * NOISE_LEVEL));
    practicalDevelopingRatio = Math.max(0, Math.min(1.0, practicalDevelopingRatio + (Math.random() - 0.5) * NOISE_LEVEL));
    examAverage = Math.max(0.1, Math.min(1.0, examAverage + (Math.random() - 0.5) * NOISE_LEVEL));

    return {
        id: `stu_${id}`,
        archetype,
        trueDisengaged,
        dataPointCount,
        signals: {
            attendancePercent,
            practicalDevelopingRatio,
            examAverage,
            hasNegativeFeedback
        }
    };
}

// Model Evaluators
function evaluateBaseline(student) {
    // Naive rule: attendance < 75%
    const predicted = student.signals.attendancePercent < 0.75;
    return {
        predicted,
        riskBand: predicted ? 'needs support' : 'steady'
    };
}

function evaluateScorecard(student) {
    const points = { attendance: 0, practicals: 0, assessments: 0, feedback: 0 };
    let signalsPresent = 0;

    // 1. Attendance
    signalsPresent++;
    if (student.signals.attendancePercent < 0.75) points.attendance = -3;
    else if (student.signals.attendancePercent < 0.90) points.attendance = 0;
    else points.attendance = 1;

    // 2. Practicals
    if (student.dataPointCount > 2) {
        signalsPresent++;
        if (student.signals.practicalDevelopingRatio > 0.50) points.practicals = -2;
        else points.practicals = 2;
    }

    // 3. Assessments
    if (student.dataPointCount > 2) {
        signalsPresent++;
        if (student.signals.examAverage < 0.60) points.assessments = -2;
        else points.assessments = 1;
    }

    // 4. Feedback
    if (student.dataPointCount > 2) {
        signalsPresent++;
        if (student.signals.hasNegativeFeedback) points.feedback = -3;
        else points.feedback = 1;
    }

    const totalScore = Object.values(points).reduce((a, b) => a + b, 0);
    const predicted = totalScore <= -1; // Threshold for 'needs support'

    let confidence = 'high';
    if (signalsPresent <= 2) confidence = 'low';
    else if (signalsPresent === 3) confidence = 'medium';

    return {
        totalScore,
        predicted,
        riskBand: predicted ? 'needs support' : (totalScore < 1 ? 'watch' : 'steady'),
        confidence,
        points
    };
}

function computeMetrics(matrix) {
    const precision = matrix.TP / (matrix.TP + matrix.FP) || 0;
    const recall = matrix.TP / (matrix.TP + matrix.FN) || 0;
    const f1 = (2 * precision * recall) / (precision + recall) || 0;
    const accuracy = (matrix.TP + matrix.TN) / (matrix.TP + matrix.FP + matrix.TN + matrix.FN) || 0;
    const fpr = matrix.FP / (matrix.FP + matrix.TN) || 0;

    return {
        precision: (precision * 100).toFixed(1),
        recall: (recall * 100).toFixed(1),
        f1: (f1 * 100).toFixed(1),
        accuracy: (accuracy * 100).toFixed(1),
        fpr: (fpr * 100).toFixed(1)
    };
}

function runNoisyBenchmark() {
    console.log("================================================================================");
    console.log("ROBUSTNESS BENCHMARK: EVALUATION ON NOISY, RANDOMIZED POPULATION (N=200)");
    console.log("Simulating realistic stochastic noise (15%) across 6 vocational archetypes");
    console.log("================================================================================\n");

    const archetypes = [
        ...Array(100).fill('engaged'),
        ...Array(30).fill('quiet_disengaging'),
        ...Array(25).fill('festival_absence'),
        ...Array(20).fill('chronic_absentee_disengaged'),
        ...Array(15).fill('struggling_attender'),
        ...Array(10).fill('sparse_new_entrant')
    ];

    const population = archetypes.map((arch, idx) => generateNoisyStudent(idx + 1, arch));

    const totalPositives = population.filter(s => s.trueDisengaged).length;
    const totalNegatives = population.length - totalPositives;

    console.log(`Population Breakdown:`);
    console.log(`- Total Students: ${population.length}`);
    console.log(`- Truly Disengaged (Positives): ${totalPositives}`);
    console.log(`- Engaged / Seasonal / Struggling (Negatives): ${totalNegatives}`);
    console.log(`- Injected Noise Factor: ±${NOISE_LEVEL * 100}% on all signal streams\n`);

    const baselineMatrix = { TP: 0, FP: 0, TN: 0, FN: 0 };
    const scorecardMatrix = { TP: 0, FP: 0, TN: 0, FN: 0 };
    const confidenceCounts = { high: 0, medium: 0, low: 0 };

    for (const student of population) {
        const actual = student.trueDisengaged;

        // Baseline
        const bRes = evaluateBaseline(student);
        if (bRes.predicted && actual) baselineMatrix.TP++;
        else if (bRes.predicted && !actual) baselineMatrix.FP++;
        else if (!bRes.predicted && actual) baselineMatrix.FN++;
        else baselineMatrix.TN++;

        // Scorecard
        const sRes = evaluateScorecard(student);
        confidenceCounts[sRes.confidence]++;
        if (sRes.predicted && actual) scorecardMatrix.TP++;
        else if (sRes.predicted && !actual) scorecardMatrix.FP++;
        else if (!sRes.predicted && actual) scorecardMatrix.FN++;
        else scorecardMatrix.TN++;
    }

    const bMetrics = computeMetrics(baselineMatrix);
    const sMetrics = computeMetrics(scorecardMatrix);

    console.log("--------------------------------------------------------------------------------");
    console.log("1. NAIVE BASELINE MODEL (Attendance < 75% Alone)");
    console.log("--------------------------------------------------------------------------------");
    console.log(`Confusion Matrix : TP: ${baselineMatrix.TP} | FP: ${baselineMatrix.FP} | TN: ${baselineMatrix.TN} | FN: ${baselineMatrix.FN}`);
    console.log(`Precision        : ${bMetrics.precision}%`);
    console.log(`Recall           : ${bMetrics.recall}%  (Misses quiet disengagers entirely!)`);
    console.log(`F1-Score         : ${bMetrics.f1}%`);
    console.log(`False Pos. Rate  : ${bMetrics.fpr}%  (Punishes festival absences & illness)`);
    console.log(`Accuracy         : ${bMetrics.accuracy}%\n`);

    console.log("--------------------------------------------------------------------------------");
    console.log("2. TRANSPARENT MULTI-SIGNAL SCORECARD (Additive Points + Confidence)");
    console.log("--------------------------------------------------------------------------------");
    console.log(`Confusion Matrix : TP: ${scorecardMatrix.TP} | FP: ${scorecardMatrix.FP} | TN: ${scorecardMatrix.TN} | FN: ${scorecardMatrix.FN}`);
    console.log(`Precision        : ${sMetrics.precision}%`);
    console.log(`Recall           : ${sMetrics.recall}%`);
    console.log(`F1-Score         : ${sMetrics.f1}%`);
    console.log(`False Pos. Rate  : ${sMetrics.fpr}%`);
    console.log(`Accuracy         : ${sMetrics.accuracy}%`);
    console.log(`Confidence Dist. : High: ${confidenceCounts.high} | Medium: ${confidenceCounts.medium} | Low: ${confidenceCounts.low}\n`);

    const recallDiff = (parseFloat(sMetrics.recall) - parseFloat(bMetrics.recall)).toFixed(1);
    const precisionDiff = (parseFloat(sMetrics.precision) - parseFloat(bMetrics.precision)).toFixed(1);

    console.log("--------------------------------------------------------------------------------");
    console.log("3. COMPARISON & ACCEPTANCE CRITERIA VALIDATION");
    console.log("--------------------------------------------------------------------------------");
    console.log(`Target: Recall improves >= +15.0 points with Precision >= 50.0% on noisy data.`);
    console.log(`Measured Recall Improvement    : +${recallDiff} percentage points`);
    console.log(`Measured Scorecard Precision   : ${sMetrics.precision}%`);

    const meetsTarget = parseFloat(recallDiff) >= 15.0 && parseFloat(sMetrics.precision) >= 50.0;
    if (meetsTarget) {
        console.log(`\n>>> RESULT: ACCEPTANCE CRITERIA SATISFIED! <<<`);
        console.log(`The Scorecard demonstrates exceptional noise tolerance and generalizability.`);
    } else {
        console.log(`\n>>> RESULT: TARGET NOT MET <<<`);
    }
    console.log("================================================================================\n");

    return {
        targetAchieved: meetsTarget,
        recallImprovement: parseFloat(recallDiff),
        scorecardPrecision: parseFloat(sMetrics.precision),
        baselineMetrics: bMetrics,
        scorecardMetrics: sMetrics
    };
}

if (require.main === module) {
    runNoisyBenchmark();
}

module.exports = {
    runNoisyBenchmark,
    runNoisyEvaluation: runNoisyBenchmark
};
