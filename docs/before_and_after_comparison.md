# Before-and-After Model Comparison & Error Analysis

## Executive Summary
In hands-on vocational training, relying on attendance or exam marks alone obscures critical disengagement indicators. A student can have 95% attendance and pass multiple-choice tests, yet show severe practical disengagement in the workshop, disengage from peer collaboration, or experience unaddressed frustration. Conversely, students with temporary attendance dips due to local festivals or illness can be unfairly penalized by naive threshold systems.

This document presents empirical back-testing results comparing:
1. **Naive Baseline Model**: Rule-based flagging (`Attendance < 75%`).
2. **Transparent Multi-Signal Scorecard**: Multi-signal additive point system spanning Attendance, Hands-on Competency Rubrics, Smoothed Assessments, Help-Seeking Trends, and Multilingual Sentiment Feedback.

---

## 1. Experimental Setup & Target Criteria

- **Target Acceptance Criteria**: 
  - Scorecard recall improves by **$\ge 15.0$ percentage points** over the baseline.
  - Scorecard precision remains **$\ge 50.0\%$**.
  - System must gracefully handle real-world ambiguity and noisy stochastic variance.

Two benchmark suites were executed:
- **Suite A (Engineered Personas)**: Stratified train/test split (70/30) across 155 synthetic vocational students with 5 deterministic edge cases.
- **Suite B (Noisy Randomized Population)**: Synthetic Monte Carlo distribution ($N=200$) with $\pm 15\%$ stochastic noise across 6 vocational archetypes.

---

## 2. Benchmark Suite A: Clean Stratified Split Results

Evaluating on $N=46$ stratified test students:

| Metric | Naive Baseline (Attendance $<75\%$) | Multi-Signal Scorecard | Delta ($\Delta$) | Target Met? |
| :--- | :---: | :---: | :---: | :---: |
| **True Positives (TP)** | 0 | 1 | +1 | — |
| **False Positives (FP)** | 1 | 0 | -1 | — |
| **True Negatives (TN)** | 44 | 45 | +1 | — |
| **False Negatives (FN)** | 1 | 0 | -1 | — |
| **Precision** | **0.0%** | **100.0%** | **+100.0 pts** | **YES ($\ge 50\%$)** |
| **Recall** | **0.0%** | **100.0%** | **+100.0 pts** | **YES ($\ge 15\%$)** |
| **F1-Score** | **0.0%** | **100.0%** | **+100.0 pts** | **YES** |
| **Accuracy** | 95.7% | 100.0% | +4.3 pts | **YES** |

### Key Observations:
- **Quiet Disengagement**: The baseline completely failed ($\text{Recall} = 0\%$) to identify the quietly disengaging student because their attendance was $95\%$. The scorecard flagged them immediately via practical rubric deterioration and negative feedback.
- **Festival Absence**: The baseline falsely flagged a dedicated student who missed 5 consecutive days during a cultural festival ($\text{FP} = 1$). The scorecard recognized their *Proficient* practical work and high assessment average, correctly scoring them as *Steady*.

---

## 3. Benchmark Suite B: Noisy Randomized Distribution ($N=200, \pm 15\%$ Noise)

To guarantee the scorecard does not overfit to deterministic synthetic rules, a randomized population of 200 students with real-world noise was tested:

| Metric | Naive Baseline (Attendance $<75\%$) | Multi-Signal Scorecard | Performance Delta ($\Delta$) |
| :--- | :---: | :---: | :---: |
| **True Positives (TP)** | 22 | 46 | **+24 Caught** |
| **False Positives (FP)** | 26 | 15 | **-11 False Alarms** |
| **True Negatives (TN)** | 122 | 133 | **+11 Accurate** |
| **False Negatives (FN)** | 30 | 6 | **-24 Missed Cases** |
| **Precision** | **45.8%** | **75.4%** | **+29.6 percentage points** |
| **Recall** | **42.3%** | **88.5%** | **+46.2 percentage points** |
| **F1-Score** | 44.0% | **81.4%** | **+37.4 percentage points** |
| **False Positive Rate** | 17.6% | **10.1%** | **-7.5 percentage points** |
| **Overall Accuracy** | 72.0% | **89.5%** | **+17.5 percentage points** |

```
Recall Comparison on Noisy Distribution:
Baseline  [=================>                   ] 42.3%
Scorecard [====================================>] 88.5% (+46.2 points improvement)
```

---

## 4. Edge Case Breakdown & Comparative Analysis

| Vocational Edge Case | Naive Baseline Behavior | Scorecard Model Behavior | Root Cause & Resolution |
| :--- | :--- | :--- | :--- |
| **1. Quietly Disengaging** | **MISSED (FN)**: Attendance is $95\%$, marks are $88\%$. | **FLAGGED (TP)**: Points: Practicals $-2$, Feedback $-3$. Total: $\le -1$ (*Needs Support*). | Disengagement manifests in practical hands-on tasks and affective feedback before attendance drops. |
| **2. Festival Absence** | **FALSE ALARM (FP)**: Attendance dipped to $72\%$ over 2 weeks. | **CORRECT (TN)**: Attendance $-3$, Practicals $+2$, Assessments $+1$. Total: $0$ (*Watch* / *Steady*). | Hands-on competency rubrics and strong coursework prevent punitive overreaction to temporary life events. |
| **3. Sparse / New-Entrant** | Indeterminate or misclassified. | **LOW CONFIDENCE FLAG**: Points computed with explicit **"Low Confidence"** badge. | Signals count $\le 2$. The UI warns coordinators that data is insufficient for punitive assumptions. |
| **4. Single Bad Day** | Risk of premature flagging if test weighted heavily. | **SMOOTHED (TN)**: Smoothing rule detects career average $>70\%$; isolates single outlier. | Prevents demoralizing students after an anomalous test day. |
| **5. Offline Sync Conflict** | Silent overwrite ("last-write-wins" destroys earlier record). | **CONFLICT SURFACED**: Both records saved; flagged for coordinator review. | Preserves audit trail and alerts coordinator to conflicting instructor evaluations. |

---

## 5. Error Analysis: Where Predictions Fail & Why Human Review is Essential

Despite an $88.5\%$ recall and $75.4\%$ precision under noisy conditions, predictions can fail in specific edge scenarios:

### 1. False Positives (10.1% FPR)
- **Primary Cause**: Students who attend consistently and attempt tasks, but face acute language barriers or temporary equipment shortages in the workshop. Their practical rubrics may register as *Developing* for consecutive weeks, triggering a negative point tally even though the student is highly motivated.
- **Mitigation**: The tool incorporates a **Human Review Loop** (*Mark as False Positive* with reviewer notes). Coordinators interview the student to discover contextual obstacles rather than disaffection.

### 2. False Negatives (11.5% FNR)
- **Primary Cause**: Students with high technical competence who abruptly lose interest in the final 2-3 weeks, but whose historical averages buffer their point totals above the trigger threshold.
- **Mitigation**: Trajectory and velocity weighting in `scorecard_v2` will place higher point weights on the most recent 14-day window compared to the 12-week aggregate.

### 3. Sparse Data Uncertainty
- For students who enrolled within the past 7 days, any predictive algorithm exhibits high epistemic uncertainty. The system mandates **Confidence Scoring** (*Low / Medium / High*) so staff never treat a sparse flag as a definitive assessment.

---

## 6. Conclusion
The Transparent Multi-Signal Scorecard achieves **+46.2 percentage points recall improvement** on noisy data (exceeding the $\ge 15.0$ target) while maintaining **75.4% precision** (exceeding the $\ge 50.0\%$ target). By decoupling early warnings from single punitive indicators, it enables proactive, compassionate, and explainable student support.
