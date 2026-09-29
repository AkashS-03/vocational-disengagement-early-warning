# Early-Warning Tool: Comprehensive User Guide

Welcome to the **Transparent Disengagement Early-Warning Tool** for vocational institutes. This guide provides role-specific instructions for workshop instructors, student coordinators, counselors, and administrative staff.

---

## 1. System Philosophy & Ethical Charter

1. **Early Warning $\ne$ Disciplinary Action**: This system is designed solely to connect students with timely, compassionate support before disengagement turns into course dropout.
2. **Transparent, Explainable Scores**: Every flag is broken down into simple, additive points (e.g. Practicals $-2$, Attendance $+1$). You will never encounter an unexplainable "black box" percentage.
3. **Never Rely on a Single Signal**: Attendance alone or exam grades alone will never trigger a high-risk flag without corroborating hands-on or affective signals.
4. **Human Authority**: The machine only suggests; humans make decisions. Staff can dispute, override, or confirm any flag.

---

## 2. Instructor Workflow: Field-Friendly Data Capture

Field instructors operate primarily in workshops, garages, and laboratories where internet connectivity is frequently unavailable or erratic.

```
[Open Mobile Interface] 
        │
        ├──► Select Trade Cohort (Electrical, Welding, Automotive, IT Hardware)
        ├──► Mark Daily Attendance (Present / Absent)
        ├──► Evaluate Practical Competencies (Rubric-Based: Not Observed, Developing, Competent, Proficient)
        ├──► Enter Observation Notes & Feedback (English or Tamil)
        │
   [Offline?] ──Yes──► Stored locally in IndexedDB Queue (Orange Badge: "Offline - Queued")
        │
        └──No──► Immediate Sync with Central Server (Green Badge: "Online - Synced")
```

### Step 2.1: Logging Hands-on Competency Rubrics
- Avoid binary "Pass/Fail".
- Use the 4-level vocational rubric:
  - **Not Observed**: The student did not perform this task today (does NOT penalize the student).
  - **Developing**: Student requires instructor intervention, demonstrates unsafe technique, or cannot complete the task independently.
  - **Competent**: Student completes task safely to industry standard with minimal supervision.
  - **Proficient**: Student performs task with speed, precision, and can guide peers.

### Step 2.2: Working Offline
1. The field interface operates completely offline through client-side local caching (IndexedDB).
2. If internet connection drops, you will see a badge: **"Working Offline (N records queued)"**.
3. Continue recording attendance and practicals normally.
4. Once you return to an area with Wi-Fi or mobile data, click **"Sync Queued Records"**.

---

## 3. Coordinator Workflow: Early-Warning Dashboard

Coordinators and student counselors use the desktop/tablet dashboard to identify students needing guidance and coordinate interventions.

### Step 3.1: Understanding the Risk Bands
- **Steady (Score $\ge 1$)**: Student is progressing well across practicals, attendance, and feedback.
- **Watch (Score $0$ to $-2$)**: Early signs of friction (e.g. good attendance but struggling in practicals, or high exam scores but negative peer feedback). Schedule an informal check-in.
- **Needs Support (Score $\le -3$)**: Multiple corroborating signals indicate disengagement. Requires proactive counseling outreach.

### Step 3.2: Reading the Transparent Point Breakdown
Click on any student row to expand their transparent scorecard:
- **Attendance**:
  - $>90\%$: $+1$ point
  - $75\% - 90\%$: $0$ points
  - $<75\%$: $-3$ points
- **Practicals**:
  - Predominantly Proficient/Competent: $+2$ points
  - Balanced / Not Observed: $0$ points
  - Predominantly Developing: $-2$ points
- **Assessments**:
  - Average $>70\%$: $+1$ point
  - Single Bad Day Smoothed: $0$ points (isolated drop ignored if career average $>70\%$)
  - Consistent failing ($<60\%$): $-2$ points
- **Feedback & Help-Seeking**:
  - Negative sentiment observed: $-3$ points
  - Neutral / Positive: $+1$ point

### Step 3.3: Checking Data Confidence Badges
- **High Confidence**: 4 to 5 independent signal streams available over $\ge 4$ weeks.
- **Medium Confidence**: 3 signal streams available.
- **Low Confidence (Sparse Data)**: $\le 2$ signal streams available (e.g. student enrolled $<7$ days ago). **Caution**: Do not initiate formal interventions solely on low-confidence flags.

### Step 3.4: Submitting Human Review Feedback
Every flagged student has a **Review & Feedback** card:
1. Select one status:
   - **Confirmed**: Valid early warning. Supportive intervention initiated.
   - **False Positive**: Student is engaged; external factor identified (e.g. bereavement, illness, equipment shortage).
   - **False Negative**: Student was overlooked by the model but required intervention.
2. Enter qualitative notes in the text box.
3. Click **"Save Review"** to update institutional audit logs.

---

## 4. Coordinator Workflow: Conflict Resolution Center

When multiple instructors evaluate the same student on the same day while offline on different devices, the sync engine flags a **Sync Conflict**:

1. Navigate to the **Sync Conflicts** tab on the navigation bar.
2. View conflicting cards side-by-side:
   - **Device A Entry**: Timestamp, Instructor Name, Task, Rubric Level, and Notes.
   - **Device B Entry**: Timestamp, Instructor Name, Task, Rubric Level, and Notes.
3. Choose the resolution strategy:
   - Select **"Accept Device A"** or **"Accept Device B"**.
   - Or click **"Merge & Edit"** to combine notes and choose the authoritative rubric.
4. Click **"Resolve Conflict"**. The central database and scorecard will automatically re-score using the resolved record.

---

## 5. Accessibility & Multilingual Features

### Switching Languages (English / தமிழ்)
- Click the **Language Toggle** in the top navigation header (`EN` | `தமிழ்`).
- All primary navigation, labels, table headers, risk bands, and explanations instantly switch to Tamil.

### Low-Bandwidth / Text-Only Mode
- For staff working in areas with dial-up or unstable 2G cellular connections, click **"Low-Bandwidth Mode"**.
- This disables heavy CSS styling, animations, and non-essential visual elements, presenting an ultra-fast, high-contrast, screen-reader optimized text interface (<50 KB payload).

### WCAG 2.2 AA Compliance
- The application guarantees color contrast ratios $\ge 4.5:1$ for normal text and $\ge 3:0:1$ for interactive components.
- Risk levels are **never communicated through color alone**: they always include distinct textual labels, numeric points, and semantic aria-tags for assistive technology.
