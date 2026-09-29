# Institutional & Ethical Risk Register

This Risk Register documents the ethical, algorithmic, technical, and operational risks associated with deploying the Disengagement Early-Warning Tool in a vocational education institute, along with mitigation strategies and accountability owners.

---

## Risk Matrix Summary

| ID | Risk Category | Risk Description | Severity | Likelihood | Residual Risk | Owner |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **R-01** | **Ethical / Policy** | **Punitive Misuse**: System flags used automatically to disqualify students from practical exams, dock grades, or revoke stipends. | **CRITICAL** | Medium | **LOW** | Academic Board / Dean |
| **R-02** | **Ethical / Social** | **Stigmatization & Public Ranking**: Risk bands displayed publicly, shared among peers, or used for competitive cohort ranking. | **HIGH** | Medium | **LOW** | Student Welfare Lead |
| **R-03** | **Algorithmic** | **Overconfidence on Sparse Data**: New entrants (first 1–2 weeks) flagged with high certainty based on 1–2 missing sessions. | **HIGH** | High | **LOW** | ML / Data Lead |
| **R-04** | **Technical / Data** | **Silent Overwrite in Offline Sync**: Multiple instructors assessing the same practical task on separate offline devices, silently discarding one evaluation. | **HIGH** | High | **LOW** | Software Lead |
| **R-05** | **Algorithmic / Bias** | **Demographic / Device Bias**: Model unfairly penalizing students with low-tier devices or first-generation learners. | **HIGH** | Low | **LOW** | Ethics & Bias Committee |
| **R-06** | **Operational** | **Alert Fatigue & Coordinator Burnout**: Too many false alerts leading staff to ignore notifications. | **MEDIUM** | Medium | **LOW** | Head of Counseling |
| **R-07** | **Accessibility** | **Bandwidth Exclusion**: Instructors or coordinators in remote workshops unable to access heavy graphic dashboards. | **MEDIUM** | High | **LOW** | UX / Frontend Lead |
| **R-08** | **Language / Equity** | **Linguistic Exclusion**: Non-English speaking instructors unable to record feedback or read dashboard summaries. | **MEDIUM** | High | **LOW** | Localization Coordinator |

---

## Detailed Risk Assessments & Mitigations

### R-01: Punitive Misuse of Early-Warning Predictions
- **Description**: The risk that administrators or instructors weaponize early-warning flags as automated justification for disciplinary actions, exam disqualifications, or financial aid cancellation.
- **Root Cause**: Institutional desire for quick administrative decisions without human investigation.
- **Mitigation Strategy**:
  1. **Strict Architectural Constraint**: The system exposes no programmatic APIs or triggers to gradebooks or accreditation management.
  2. **Non-Negotiable Institutional Policy**: Flags are formally classified as *Invitations for Supportive Conversation*, not disciplinary evidence.
  3. **Human-in-the-Loop Requirement**: A coordinator must verify and log an intervention conversation before any institutional action can be contemplated.
- **Residual Risk**: Low. Continuous auditing of intervention notes ensures compliance.

---

### R-02: Stigmatization & Public Ranking
- **Description**: Exposing risk status to peers or ranking students from "best" to "worst" creates psychological distress, shame, and self-fulfilling disengagement.
- **Root Cause**: Displaying leaderboard-style dashboards or careless data sharing in common workshop areas.
- **Mitigation Strategy**:
  1. **Strict Role-Based Access Control (RBAC)**: Only assigned counselors and head coordinators have access to the risk dashboard.
  2. **Zero Student-Facing Risk Badges**: The student interface (if deployed) focuses purely on personal competency milestones, never risk scores.
  3. **No Aggregate Ranking**: The dashboard sorts by priority of needed support, never numeric leaderboard ranks.

---

### R-03: Overconfidence on Sparse Data
- **Description**: When a student has just enrolled or has only 1–2 recorded classes, a naive algorithm might flag them as *High Risk* with 100% confidence because their presence rate is 0/1 (0%).
- **Root Cause**: Epistemic uncertainty ignored by basic ratio calculations.
- **Mitigation Strategy**:
  1. **Explicit Confidence Scoring**: The scorecard computes the number of signal streams present. If $\le 2$ signals are available, the confidence is capped at **"Low Confidence"**.
  2. **Visual Warning Banners**: The UI displays an amber warning: *"Sparse Data — Preliminary Signal Only. Do not initiate formal intervention."*

---

### R-04: Silent Overwrites in Offline Synchronization
- **Description**: Vocational workshops frequently lack cell reception or Wi-Fi. If Instructor A grades a student offline as *Developing* at 10:00 AM, and Instructor B grades them as *Competent* at 11:30 AM offline, a naive "last-write-wins" HTTP PUT would silently erase Instructor A's observations.
- **Root Cause**: Typical REST APIs without conflict detection.
- **Mitigation Strategy**:
  1. **Audit Metadata on Every Record**: Every entry records `device_id`, `captured_at`, `synced_at`, and `created_by`.
  2. **Explicit Conflict Flagging**: The backend flags concurrent observations on the same student/task/date and saves both.
  3. **Coordinator Conflict Resolution Center**: A dedicated UI allows coordinators to compare timestamps, notes, and rubrics, selecting or merging records manually.

---

### R-05: Demographic & Device Bias
- **Description**: Students using low-end smartphones (`device_tier: low`) may experience slower upload times or miss online check-ins, leading to synthetic penalties. First-generation learners (`first_generation_flag`) may have less familiarity with digital LMS tools.
- **Root Cause**: Confounding technical access barriers with disinterest.
- **Mitigation Strategy**:
  1. **Prohibited Model Features**: `device_tier`, `first_generation_flag`, and `language_pref` are strictly banned from feature binning and point calculations in `scorecard.ts`.
  2. **Offline-First Field Input**: Instructors record hands-on workshop work directly, eliminating reliance on the student's personal phone.
  3. **Disparate Impact Auditing**: Routine stratified evaluation checks false-positive rates across first-generation versus non-first-generation groups to ensure parity.

---

### R-06: Alert Fatigue & Coordinator Burnout
- **Description**: High rates of false alarms cause coordinators to distrust the tool, leading them to ignore all notifications.
- **Mitigation Strategy**:
  1. **Tuned Scorecard Thresholds**: Multi-signal smoothing avoids reacting to isolated bad days or temporary festival absences.
  2. **Feedback Loop (FP/FN Marking)**: Coordinators can mark any flag as *False Positive* or *False Negative* directly in the dashboard, updating the training set for periodic scorecard point recalibration.

---

### R-07: Bandwidth Exclusion in Remote Workshops
- **Description**: Rural ITIs and practical training sheds often operate on spotty 2G/3G connections. Heavy graphic dashboards will fail to load or consume costly cellular data.
- **Mitigation Strategy**:
  1. **Dedicated Low-Bandwidth / Text-Only View**: A lightweight, zero-asset, semantic HTML mode with instant load times (<100KB).
  2. **Client-Side Caching**: Uses IndexedDB and Service Workers to cache student rosters and rubrics locally.

---

### R-08: Linguistic Exclusion (English vs. Tamil)
- **Description**: In regional vocational institutes (e.g. in Tamil Nadu), instructors and students often communicate in Tamil. English-only interfaces degrade data quality and disempower staff.
- **Mitigation Strategy**:
  1. **Native Bilingual Interface**: Global instant toggle between English and Tamil (`தமிழ்`).
  2. **Multilingual Free-Text Support**: Feedback notes accommodate Tamil script (`ta`) and UTF-8 characters seamlessly.
