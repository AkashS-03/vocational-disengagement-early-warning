import { queryAll } from '../src/lib/db';
import { evaluateBaseline } from '../src/models/baseline';
import { evaluateScorecard } from '../src/models/scorecard';

/**
 * TypeScript Model Evaluation Runner
 * 
 * 1. Loads students from SQLite database.
 * 2. Stratified train/test split.
 * 3. Evaluates Baseline vs. Scorecard.
 * 4. Outputs Precision, Recall, F1, and Confusion Matrices.
 */

interface ConfusionMatrix {
    TP: number;
    FP: number;
    TN: number;
    FN: number;
}

export async function runExperiment() {
    console.log("Fetching students from database...");
    const students = await queryAll<{ id: string; name: string }>(`SELECT id, name FROM Student`);
    
    // Stratified Split (70 Train / 30 Test)
    const positives = students.filter(s => s.name.includes('Quiet_Disengaging'));
    const negatives = students.filter(s => !s.name.includes('Quiet_Disengaging'));

    const testPositives = positives.slice(0, Math.max(1, Math.floor(positives.length * 0.3)));
    const testNegatives = negatives.slice(0, Math.floor(negatives.length * 0.3));
    
    const testSet = [...testPositives, ...testNegatives];
    
    console.log(`Total Students: ${students.length}. Test Set Size (Stratified 30%): ${testSet.length} (${testPositives.length} Positive, ${testNegatives.length} Negative)`);
    console.log(`\nTARGET: Scorecard recall improves >= 15 points over baseline without precision falling below 50%.\n`);

    const results: { baseline: ConfusionMatrix; scorecard: ConfusionMatrix } = {
        baseline: { TP: 0, FP: 0, TN: 0, FN: 0 },
        scorecard: { TP: 0, FP: 0, TN: 0, FN: 0 }
    };

    const dbWrapper = {
        all: (sql: string, params: any[]) => queryAll(sql, params)
    };

    for (const student of testSet) {
        const actualNeedsSupport = student.name.includes('Quiet_Disengaging'); 

        // Run Baseline
        const baselineRes = await evaluateBaseline(student.id, dbWrapper);
        const baselinePredicted = baselineRes.risk_band === 'needs support';
        
        if (baselinePredicted && actualNeedsSupport) results.baseline.TP++;
        else if (baselinePredicted && !actualNeedsSupport) results.baseline.FP++;
        else if (!baselinePredicted && actualNeedsSupport) results.baseline.FN++;
        else results.baseline.TN++;

        // Run Scorecard
        const scorecardRes = await evaluateScorecard(student.id, dbWrapper);
        const scorecardPredicted = scorecardRes.risk_band === 'needs support';

        if (scorecardPredicted && actualNeedsSupport) results.scorecard.TP++;
        else if (scorecardPredicted && !actualNeedsSupport) results.scorecard.FP++;
        else if (!scorecardPredicted && actualNeedsSupport) results.scorecard.FN++;
        else results.scorecard.TN++;
    }

    function calcMetrics(matrix: ConfusionMatrix) {
        const precision = matrix.TP / (matrix.TP + matrix.FP) || 0;
        const recall = matrix.TP / (matrix.TP + matrix.FN) || 0;
        const f1 = (2 * precision * recall) / (precision + recall) || 0;
        return { 
            precision: (precision * 100).toFixed(1), 
            recall: (recall * 100).toFixed(1), 
            f1: (f1 * 100).toFixed(1) 
        };
    }

    const bMetrics = calcMetrics(results.baseline);
    const sMetrics = calcMetrics(results.scorecard);

    console.log(`--- BASELINE (Rule: Attendance < 75%) ---`);
    console.log(`Confusion Matrix: TP: ${results.baseline.TP} | FP: ${results.baseline.FP} | TN: ${results.baseline.TN} | FN: ${results.baseline.FN}`);
    console.log(`Precision: ${bMetrics.precision}% | Recall: ${bMetrics.recall}% | F1: ${bMetrics.f1}%\n`);

    console.log(`--- SCORECARD (Multi-Signal Point System) ---`);
    console.log(`Confusion Matrix: TP: ${results.scorecard.TP} | FP: ${results.scorecard.FP} | TN: ${results.scorecard.TN} | FN: ${results.scorecard.FN}`);
    console.log(`Precision: ${sMetrics.precision}% | Recall: ${sMetrics.recall}% | F1: ${sMetrics.f1}%\n`);

    const recallImprovement = parseFloat(sMetrics.recall) - parseFloat(bMetrics.recall);
    console.log(`--- CONCLUSION ---`);
    console.log(`Recall Improvement: +${recallImprovement.toFixed(1)} points`);
    if (recallImprovement >= 15 && parseFloat(sMetrics.precision) >= 50) {
        console.log(`Target Achieved! Scorecard significantly outperforms baseline.`);
    } else {
        console.log(`Target Missed.`);
    }

    return { results, bMetrics, sMetrics, recallImprovement };
}

if (require.main === module) {
    runExperiment().catch(console.error);
}
