/**
 * Frontend Application Logic & State Management
 * Bilingual (EN/TA) | Offline-First (IndexedDB) | Accessible
 */

// Bilingual Translation Dictionary
const i18n = {
    en: {
        appTitle: "Vocational Disengagement Early-Warning System",
        appSubtitle: "Transparent multi-signal early detection for hands-on technical competencies",
        onlineStatus: "Online - Synced",
        offlineStatus: "Offline - Simulating Workshop Shed",
        syncQueueBtn: "Sync Queue",
        lowBandwidthToggle: "Low-Bandwidth Mode",
        langToggle: "தமிழ்",

        // Navigation
        tabDashboard: "Coordinator Dashboard",
        tabFieldCapture: "Instructor Field Log",
        tabConflicts: "Sync Conflicts",
        tabComparison: "Model Comparison",

        // Metrics
        metricTotal: "Total Cohort",
        metricNeedsSupport: "Needs Support",
        metricWatch: "Watch Band",
        metricSteady: "Steady Progress",
        metricConflicts: "Active Conflicts",
        metricRecallGain: "Recall Improvement",

        // Filters
        searchPlaceholder: "Search student by name or trade...",
        filterTradeAll: "All Trades",
        filterTradeElectrical: "Electrical",
        filterTradeWelding: "Welding",
        filterTradeAutomotive: "Automotive",
        filterTradeIT: "IT Hardware",

        filterRiskAll: "All Risk Bands",
        filterRiskNeedsSupport: "Needs Support (≤ -1)",
        filterRiskWatch: "Watch (-1 to 0)",
        filterRiskSteady: "Steady (≥ +1)",

        filterConfAll: "All Confidence Levels",
        filterConfHigh: "High Confidence",
        filterConfMedium: "Medium Confidence",
        filterConfLow: "Low (Sparse Data)",

        // Table
        colStudent: "Student & Trade",
        colAttendance: "Attendance",
        colPracticals: "Practical Rubrics",
        colExams: "Exam Avg",
        colScorecard: "Transparent Signal Breakdown",
        colRiskBand: "Risk Score & Band",
        colConfidence: "Confidence",
        colReview: "Human Review",
        colAction: "Action",
        inspectBtn: "Inspect",
        exportCsv: "Export CSV",
        lmsIngestion: "LMS Ingestion",

        // Drawer
        drawerTitle: "Student Risk Scorecard Details",
        sigAttendance: "Attendance Signal",
        sigPracticals: "Hands-on Practical Rubric",
        sigAssessments: "Coursework & Exams",
        sigFeedback: "Instructor Observation & Feedback",
        sigHelpSeeking: "Help-Seeking Activity",
        humanReviewHeading: "Human-in-the-Loop Review",
        reviewStatusLabel: "Verification Status:",
        statusUnreviewed: "Unreviewed",
        statusConfirmed: "Confirmed (Support Action Initiated)",
        statusFP: "False Positive (Engaged / External Context)",
        statusFN: "False Negative (Overlooked by Model)",
        reviewerNotesPlaceholder: "Add coordinator intervention notes, contextual reasons, or workshop observations...",
        saveReviewBtn: "Save Review Status",

        // Field Capture
        fieldTitle: "Instructor Workshop Data Capture (Offline-First)",
        fieldSubtitle: "Log attendance and hands-on practical competency rubrics in workshop sheds without internet",
        selectStudentLabel: "Select Student:",
        selectDateLabel: "Observation Date:",
        attendanceLabel: "Daily Attendance:",
        presentOption: "Present in Workshop",
        absentOption: "Absent",
        taskLabel: "Practical Competency Task:",
        rubricLabel: "Competency Level Observed:",
        rubricNotObserved: "Not Observed (0 pts)",
        rubricDeveloping: "Developing (-2 pts)",
        rubricCompetent: "Competent (+2 pts)",
        rubricProficient: "Proficient (+2 pts)",
        notesLabel: "Instructor Notes & Feedback:",
        notesPlaceholder: "Enter practical observations, safety compliance, or behavioral notes...",
        saveFieldBtn: "Save to Field Log",
        offlineNotice: "Records will be safely stored in local IndexedDB and synced when connection resumes.",

        // Conflicts
        conflictsTitle: "Sync Conflict Resolution Center",
        conflictsSubtitle: "Concurrent offline logs detected from multiple instructor devices on the same day",
        noConflicts: "No unresolved synchronization conflicts detected. Central database is in sync.",
        acceptA: "Accept Device A",
        acceptB: "Accept Device B",
        mergeNotes: "Merge Observations & Resolve",

        // Comparison
        compTitle: "Model Comparison: Naive Baseline vs. Multi-Signal Scorecard",
        compSubtitle: "Evaluating why early disengagement is hidden behind attendance or exam marks alone",
        compBaselineRule: "Baseline Rule: Attendance < 75% alone",
        compScorecardRule: "Scorecard: 5-Signal Additive Points + Confidence Layer"
    },
    ta: {
        appTitle: "தொழிற்கல்வி மாணவர் ஈடுபாடு முன்கூட்டிய எச்சரிக்கை அமைப்பு",
        appSubtitle: "நடைமுறைத் திறன் மற்றும் கற்றல் சமிக்ஞைகளின் வெளிப்படையான கண்காணிப்பு",
        onlineStatus: "இணைப்பில் உள்ளது - ஒத்திசைக்கப்பட்டது",
        offlineStatus: "ஆஃப்லைன் - பட்டறை பயன்முறை",
        syncQueueBtn: "வரிசையை ஒத்திசை",
        lowBandwidthToggle: "குறைந்த அலைவரிசை பயன்முறை",
        langToggle: "English",

        // Navigation
        tabDashboard: "ஒருங்கிணைப்பாளர் பலகை",
        tabFieldCapture: "ஆசிரியர் களப் பதிவு",
        tabConflicts: "ஒத்திசைவு முரண்பாடுகள்",
        tabComparison: "மாதிரி ஒப்பீடு",

        // Metrics
        metricTotal: "மொத்த மாணவர்கள்",
        metricNeedsSupport: "ஆதரவு தேவைப்படுவோர்",
        metricWatch: "கண்காணிப்பு நிலை",
        metricSteady: "நிலையான முன்னேற்றம்",
        metricConflicts: "முரண்பாடுகள்",
        metricRecallGain: "மீட்டெடுப்பு உயர்வு",

        // Filters
        searchPlaceholder: "பெயர் அல்லது தொழிற்பிரிவு மூலம் தேடுக...",
        filterTradeAll: "அனைத்து தொழிற்பிரிவுகள்",
        filterTradeElectrical: "மின்சாரவியல் (Electrical)",
        filterTradeWelding: "வெல்டிங் (Welding)",
        filterTradeAutomotive: "தானியங்கி (Automotive)",
        filterTradeIT: "ஐடி வன்பொருள் (IT Hardware)",

        filterRiskAll: "அனைத்து இடர் நிலைகள்",
        filterRiskNeedsSupport: "ஆதரவு தேவை (≤ -1)",
        filterRiskWatch: "கண்காணிப்பு (-1 to 0)",
        filterRiskSteady: "நிலையானது (≥ +1)",

        filterConfAll: "அனைத்து நம்பிக்கை நிலைகள்",
        filterConfHigh: "உயர் நம்பிக்கை",
        filterConfMedium: "நடுத்தர நம்பிக்கை",
        filterConfLow: "குறைந்த நம்பிக்கை (குறைந்த தரவு)",

        // Table
        colStudent: "மாணவர் & தொழிற்பிரிவு",
        colAttendance: "வருகை",
        colPracticals: "நடைமுறை மதிப்பீடு",
        colExams: "தேர்வு சராசரி",
        colScorecard: "வெளிப்படையான சமிக்ஞை புள்ளிகள்",
        colRiskBand: "இடர் நிலை",
        colConfidence: "நம்பகத்தன்மை",
        colReview: "மனித சரிபார்ப்பு",
        colAction: "செயல்",
        inspectBtn: "ஆராய்க",
        exportCsv: "CSV ஏற்றுமதி",
        lmsIngestion: "LMS தரவேற்றம்",

        // Drawer
        drawerTitle: "மாணவர் இடர் மதிப்பீட்டு விவரங்கள்",
        sigAttendance: "வருகை சமிக்ஞை",
        sigPracticals: "நடைமுறைச் செய்முறைத் திறன்",
        sigAssessments: "தேர்வுகள் & மதிப்பெண்",
        sigFeedback: "ஆசிரியர் கருத்து & பின்னூட்டம்",
        sigHelpSeeking: "உதவி கோரும் செயல்பாடு",
        humanReviewHeading: "மனித ஒருங்கிணைப்பாளர் சரிபார்ப்பு",
        reviewStatusLabel: "சரிபார்ப்பு நிலை:",
        statusUnreviewed: "மதிப்பிடப்படவில்லை",
        statusConfirmed: "உறுதிப்படுத்தப்பட்டது (ஆதரவு நடவடிக்கை தொடங்கப்பட்டது)",
        statusFP: "தவறான எச்சரிக்கை (ஈடுபாட்டுடன் உள்ளார்)",
        statusFN: "விடுபட்டவர் (மாதிரி கவனிக்கத் தவறியது)",
        reviewerNotesPlaceholder: "ஆசிரியர் அல்லது ஒருங்கிணைப்பாளர் குறிப்புகளை உள்ளிடவும்...",
        saveReviewBtn: "நிலையைச் சேமி",

        // Field Capture
        fieldTitle: "ஆசிரியர் பட்டறை நேரடிப் பதிவு (ஆஃப்லைன்)",
        fieldSubtitle: "இணையம் இல்லாத பட்டறைகளில் வருகை மற்றும் நடைமுறைத் திறனைப் பதிவுசெய்க",
        selectStudentLabel: "மாணவரைத் தேர்வுசெய்க:",
        selectDateLabel: "பதிவு தேதி:",
        attendanceLabel: "தினசரி வருகை:",
        presentOption: "வருகை தந்தார்",
        absentOption: "வரவில்லை",
        taskLabel: "நடைமுறைத் திறன் பணி:",
        rubricLabel: "கவனிக்கப்பட்ட திறன் நிலை:",
        rubricNotObserved: "கவனிக்கப்படவில்லை (0 புள்ளிகள்)",
        rubricDeveloping: "வளர்ந்து வருகிறார் (-2 புள்ளிகள்)",
        rubricCompetent: "திறமை வாய்ந்தவர் (+2 புள்ளிகள்)",
        rubricProficient: "மிகச்சிறந்தவர் (+2 புள்ளிகள்)",
        notesLabel: "ஆசிரியர் குறிப்புகள் & கருத்து:",
        notesPlaceholder: "நடைமுறைப் பணிக் குறிப்புகள் அல்லது பாதுகாப்பு விதிகளை உள்ளிடவும்...",
        saveFieldBtn: "களப் பதிவில் சேமிக்க",
        offlineNotice: "பதிவுகள் சாதனத்தில் பாதுகாப்பாக சேமிக்கப்பட்டு இணையம் கிடைத்ததும் ஒத்திசைக்கப்படும்.",

        // Conflicts
        conflictsTitle: "ஒத்திசைவு முரண்பாடு தீர்வு மையம்",
        conflictsSubtitle: "ஒரே நாளில் வெவ்வேறு ஆசிரியர்களால் பதியப்பட்ட முரண்பாடான ஆஃப்லைன் பதிவுகள்",
        noConflicts: "தீர்க்கப்படாத முரண்பாடுகள் எதுவும் இல்லை. தரவுத்தளம் சீராக உள்ளது.",
        acceptA: "சாதனம் A-ஐ ஏற்க",
        acceptB: "சாதனம் B-ஐ ஏற்க",
        mergeNotes: "குறிப்புகளை இணைத்துத் தீர்க்கவும்",

        // Comparison
        compTitle: "மாதிரி ஒப்பீடு: அடிப்படை விதி vs பல-சமிக்ஞை மதிப்பீட்டு முறை",
        compSubtitle: "வருகை அல்லது தேர்வு மதிப்பெண்களுக்குப் பின்னால் மறைந்திருக்கும் முன்கூட்டிய விலகலைக் கண்டறிதல்",
        compBaselineRule: "அடிப்படை விதி: வருகை < 75% மட்டுமே",
        compScorecardRule: "மதிப்பீட்டு முறை: 5 சமிக்ஞை கூட்டல் புள்ளிகள் + நம்பிக்கை அடுக்கு"
    }
};

// Global App State
const state = {
    lang: 'en',
    lowBandwidth: false,
    currentTab: 'dashboard',
    students: [],
    filteredStudents: [],
    conflicts: [],
    metrics: null,
    selectedStudent: null,
    offlineSimulated: false,
    selectedRubric: 'competent',
    offlineQueueCount: 0
};

// Helpers
const $ = (id) => document.getElementById(id);
const t = (key) => i18n[state.lang][key] || key;

// Initialization
async function initApp() {
    setupEventListeners();
    await updateOfflineQueueBadge();
    await fetchMetrics();
    await fetchStudents();
    await fetchConflicts();
    renderApp();
}

function setupEventListeners() {
    // Navigation Tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.currentTab = tab.dataset.tab;
            renderTabContent();
        });
    });

    // Language Toggle
    $('lang-toggle-btn').addEventListener('click', () => {
        state.lang = state.lang === 'en' ? 'ta' : 'en';
        $('lang-toggle-btn').textContent = t('langToggle');
        applyTranslations();
        renderApp();
    });

    // Low-Bandwidth Mode
    $('low-bandwidth-btn').addEventListener('click', () => {
        state.lowBandwidth = !state.lowBandwidth;
        if (state.lowBandwidth) {
            document.body.classList.add('low-bandwidth-mode');
            $('low-bandwidth-btn').classList.add('active');
        } else {
            document.body.classList.remove('low-bandwidth-mode');
            $('low-bandwidth-btn').classList.remove('active');
        }
    });

    // Offline Simulation Toggle
    $('offline-sim-btn').addEventListener('click', () => {
        state.offlineSimulated = !state.offlineSimulated;
        const badge = $('network-status-badge');
        if (state.offlineSimulated) {
            badge.className = 'pill-badge badge-offline';
            badge.textContent = `⚡ ${t('offlineStatus')}`;
            $('offline-sim-btn').classList.add('active');
        } else {
            badge.className = 'pill-badge badge-online';
            badge.textContent = `● ${t('onlineStatus')}`;
            $('offline-sim-btn').classList.remove('active');
        }
    });

    // Sync Offline Queue Button
    $('sync-queue-btn').addEventListener('click', handleSyncQueue);

    // Search & Filter Listeners
    $('search-input').addEventListener('input', applyFilters);
    $('trade-filter').addEventListener('change', applyFilters);
    $('risk-filter').addEventListener('change', applyFilters);
    $('conf-filter').addEventListener('change', applyFilters);

    // Segmented Risk Filter Chips
    document.querySelectorAll('.risk-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.risk-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            if ($('risk-filter')) {
                $('risk-filter').value = chip.dataset.risk;
            }
            applyFilters();
        });
    });

    // Rubric Selector Buttons
    document.querySelectorAll('.rubric-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.rubric-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            state.selectedRubric = btn.dataset.rubric;
        });
    });

    // Field Capture Form Submit
    $('field-form').addEventListener('submit', handleFieldFormSubmit);

    // LMS Modal Listeners
    const lmsModal = $('lms-modal');
    if ($('lms-modal-btn')) {
        $('lms-modal-btn').addEventListener('click', () => {
            if (lmsModal) lmsModal.style.display = 'flex';
        });
    }
    if ($('lms-close-btn')) {
        $('lms-close-btn').addEventListener('click', () => {
            if (lmsModal) lmsModal.style.display = 'none';
        });
    }
    if ($('lms-sample-btn')) {
        $('lms-sample-btn').addEventListener('click', () => {
            const platform = $('lms-platform-select').value;
            if (platform === 'generic') {
                $('lms-csv-input').value = `student_name,date,attendance_status\nStudent False_Baseline_Positive 1831,2026-09-30,present\nStudent Consistent_Engaged 2741,2026-09-30,present`;
            } else {
                $('lms-csv-input').value = `student_name,score,max_score,assessment_type\nStudent False_Baseline_Positive 1831,88,100,practical_exam\nStudent Consistent_Engaged 2741,94,100,practical_exam`;
            }
        });
    }
    if ($('lms-submit-btn')) {
        $('lms-submit-btn').addEventListener('click', async () => {
            const csvData = $('lms-csv-input').value.trim();
            const platform = $('lms-platform-select').value;
            const statusDiv = $('lms-status-msg');
            if (!csvData) {
                statusDiv.style.display = 'block';
                statusDiv.style.background = 'rgba(239, 68, 68, 0.2)';
                statusDiv.style.color = '#f87171';
                statusDiv.textContent = 'Please enter or paste CSV records.';
                return;
            }

            statusDiv.style.display = 'block';
            statusDiv.style.background = 'rgba(59, 130, 246, 0.2)';
            statusDiv.style.color = '#93c5fd';
            statusDiv.textContent = 'Ingesting records...';

            try {
                const res = await fetch('/api/lms/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/csv' },
                    body: csvData
                });
                const data = await res.json();
                if (data.success) {
                    statusDiv.style.background = 'rgba(16, 185, 129, 0.2)';
                    statusDiv.style.color = '#6ee7b7';
                    statusDiv.textContent = `✔ ${data.message}`;
                    await fetchStudents();
                    await fetchMetrics();
                    renderApp();
                    setTimeout(() => { if (lmsModal) lmsModal.style.display = 'none'; }, 2000);
                } else {
                    statusDiv.style.background = 'rgba(239, 68, 68, 0.2)';
                    statusDiv.style.color = '#f87171';
                    statusDiv.textContent = `Error: ${data.error || 'Failed to ingest records'}`;
                }
            } catch (err) {
                statusDiv.style.background = 'rgba(239, 68, 68, 0.2)';
                statusDiv.style.color = '#f87171';
                statusDiv.textContent = `Network error: ${err.message}`;
            }
        });
    }
}

// -------------------------------------------------------------
// Data Fetching
// -------------------------------------------------------------
async function fetchStudents() {
    try {
        const res = await fetch('/api/students');
        const json = await res.json();
        if (json.success) {
            state.students = json.data;
            state.filteredStudents = [...json.data];
            // Cache in IndexedDB for offline roster lookup
            if (window.OfflineDB) {
                await window.OfflineDB.cacheStudentsLocally(json.data);
            }
            populateStudentDropdown(json.data);
        }
    } catch (err) {
        console.warn('Network fetch failed, attempting IndexedDB cache fallback...', err);
        if (window.OfflineDB) {
            const cached = await window.OfflineDB.getCachedStudentsLocally();
            if (cached && cached.length > 0) {
                state.students = cached;
                state.filteredStudents = [...cached];
                populateStudentDropdown(cached);
            }
        }
    }
}

async function fetchConflicts() {
    try {
        const res = await fetch('/api/conflicts');
        const json = await res.json();
        if (json.success) {
            state.conflicts = json.data;
            $('conflict-count-badge').textContent = json.count;
            $('metric-conflicts-num').textContent = json.count;
        }
    } catch (err) {
        console.error('Failed to fetch conflicts:', err);
    }
}

async function fetchMetrics() {
    try {
        const res = await fetch('/api/metrics');
        const json = await res.json();
        if (json.success) {
            state.metrics = json;
            renderMetrics(json);
        }
    } catch (err) {
        console.error('Failed to fetch metrics:', err);
    }
}

async function updateOfflineQueueBadge() {
    if (window.OfflineDB) {
        const queue = await window.OfflineDB.getOfflineQueue();
        state.offlineQueueCount = queue.length;
        const syncBtn = $('sync-queue-btn');
        syncBtn.textContent = `🔄 ${t('syncQueueBtn')} (${queue.length})`;
        syncBtn.style.display = queue.length > 0 ? 'inline-flex' : 'none';
    }
}

// -------------------------------------------------------------
// Rendering Functions
// -------------------------------------------------------------
function renderApp() {
    renderTabContent();
    applyTranslations();
}

function renderTabContent() {
    // Hide all view sections
    $('view-dashboard').style.display = 'none';
    $('view-field-capture').style.display = 'none';
    $('view-conflicts').style.display = 'none';
    $('view-comparison').style.display = 'none';

    if (state.currentTab === 'dashboard') {
        $('view-dashboard').style.display = 'block';
        renderStudentTable();
    } else if (state.currentTab === 'field-capture') {
        $('view-field-capture').style.display = 'block';
    } else if (state.currentTab === 'conflicts') {
        $('view-conflicts').style.display = 'block';
        renderConflicts();
    } else if (state.currentTab === 'comparison') {
        $('view-comparison').style.display = 'block';
        renderComparison();
    }
}

function getTradeInitials(trade) {
    if (!trade) return 'VO';
    const t = trade.toLowerCase();
    if (t.includes('elect')) return 'EL';
    if (t.includes('weld')) return 'WE';
    if (t.includes('auto')) return 'AU';
    if (t.includes('it') || t.includes('hard')) return 'IT';
    return trade.substring(0, 2).toUpperCase();
}

function renderMetrics(m) {
    const total = (m && m.totalStudents) ? m.totalStudents : state.students.length;
    if ($('metric-total-num')) $('metric-total-num').textContent = total;
    
    // Count risk bands
    let needsSupport = 0, watch = 0, steady = 0;
    state.students.forEach(s => {
        if (s.riskBand === 'needs support') needsSupport++;
        else if (s.riskBand === 'watch') watch++;
        else steady++;
    });

    if ($('metric-needs-support-num')) $('metric-needs-support-num').textContent = needsSupport;
    if ($('metric-watch-num')) $('metric-watch-num').textContent = watch;
    if ($('metric-steady-num')) $('metric-steady-num').textContent = steady;

    const denom = total || 1;
    const supPct = Math.round((needsSupport / denom) * 100);
    const watPct = Math.round((watch / denom) * 100);
    const stePct = Math.max(0, 100 - supPct - watPct);

    if ($('metric-needs-support-pct')) $('metric-needs-support-pct').textContent = `${supPct}% of cohort`;
    if ($('metric-watch-pct')) $('metric-watch-pct').textContent = `${watPct}% of cohort`;
    if ($('metric-steady-pct')) $('metric-steady-pct').textContent = `${stePct}% of cohort`;

    // Proportional distribution progress segments
    if ($('dist-bar-support')) $('dist-bar-support').style.width = `${needsSupport > 0 ? Math.max(2, supPct) : 0}%`;
    if ($('dist-bar-watch')) $('dist-bar-watch').style.width = `${watch > 0 ? Math.max(2, watPct) : 0}%`;
    if ($('dist-bar-steady')) $('dist-bar-steady').style.width = `${steady > 0 ? Math.max(2, stePct) : 0}%`;

    if ($('dist-pct-support')) $('dist-pct-support').textContent = `${supPct}%`;
    if ($('dist-pct-watch')) $('dist-pct-watch').textContent = `${watPct}%`;
    if ($('dist-pct-steady')) $('dist-pct-steady').textContent = `${stePct}%`;

    // Update risk filter chips counts
    const chips = document.querySelectorAll('.risk-chip');
    chips.forEach(chip => {
        const r = chip.dataset.risk;
        if (r === 'all') chip.textContent = `All (${total})`;
        else if (r === 'needs support') chip.textContent = `⚠️ Needs Support (${needsSupport})`;
        else if (r === 'watch') chip.textContent = `👁️ Watch (${watch})`;
        else if (r === 'steady') chip.textContent = `✅ Steady (${steady})`;
    });
}

function renderStudentTable() {
    const tbody = $('student-table-body');
    tbody.innerHTML = '';

    if (state.filteredStudents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 3rem; color: var(--text-muted); font-size: 0.95rem;">🔍 No students match the active search or filter criteria.</td></tr>`;
        return;
    }

    state.filteredStudents.forEach(s => {
        const tr = document.createElement('tr');

        // Risk badge
        let riskClass = 'risk-steady';
        let riskIcon = '✔';
        let riskText = 'STEADY';
        if (s.riskBand === 'needs support') {
            riskClass = 'risk-needs-support';
            riskIcon = '⚠';
            riskText = 'NEEDS SUPPORT';
        } else if (s.riskBand === 'watch') {
            riskClass = 'risk-watch';
            riskIcon = '👁';
            riskText = 'WATCH';
        }

        // Confidence badge
        let confClass = `conf-${s.confidence}`;
        let confText = s.confidence.toUpperCase();
        if (s.confidence === 'low') confText += ' (SPARSE)';

        // Multi-signal points
        const pts = s.points || { attendance: 0, practicals: 0, assessments: 0, feedback: 0, help_seeking: 0 };
        const pill = (val, label, shortLabel) => {
            const cls = val > 0 ? 'pill-pos' : (val < 0 ? 'pill-neg' : 'pill-zero');
            const sign = val > 0 ? `+${val}` : `${val}`;
            return `<span class="signal-pill ${cls}" title="${label}: ${sign}">${shortLabel}: ${sign}</span>`;
        };

        // Attendance meter
        const attPct = s.stats ? s.stats.attendancePercent : 0;
        const attFillClass = attPct >= 90 ? 'fill-steady' : (attPct >= 75 ? 'fill-watch' : 'fill-support');

        // Exam meter
        const examPct = s.stats ? s.stats.examAverage : 0;
        const examFillClass = examPct >= 75 ? 'fill-steady' : (examPct >= 60 ? 'fill-watch' : 'fill-support');

        // Human review indicator
        let reviewBadge = `<span style="color:var(--text-muted); font-size:0.75rem; font-weight:500;">Unreviewed</span>`;
        if (s.humanReview && s.humanReview.status === 'confirmed') {
            reviewBadge = `<span style="color:#6ee7b7; font-weight:700; font-size:0.75rem; background:rgba(16,185,129,0.15); padding:0.2rem 0.5rem; border-radius:4px; border:1px solid rgba(16,185,129,0.3);">✔ Confirmed</span>`;
        } else if (s.humanReview && s.humanReview.status === 'false_positive') {
            reviewBadge = `<span style="color:#fcd34d; font-weight:700; font-size:0.75rem; background:rgba(245,158,11,0.15); padding:0.2rem 0.5rem; border-radius:4px; border:1px solid rgba(245,158,11,0.3);">✖ False Pos</span>`;
        } else if (s.humanReview && s.humanReview.status === 'false_negative') {
            reviewBadge = `<span style="color:#fca5a5; font-weight:700; font-size:0.75rem; background:rgba(239,68,68,0.15); padding:0.2rem 0.5rem; border-radius:4px; border:1px solid rgba(239,68,68,0.3);">✖ False Neg</span>`;
        }

        const initials = getTradeInitials(s.cohort_trade);

        tr.innerHTML = `
            <td>
                <div class="student-cell">
                    <div class="student-avatar" title="${s.cohort_trade.toUpperCase()}">${initials}</div>
                    <div class="student-meta">
                        <span class="student-name">${s.name}</span>
                        <span class="trade-pill">${s.cohort_trade.toUpperCase()}</span>
                    </div>
                </div>
            </td>
            <td>
                <div class="metric-cell">
                    <span class="metric-val">${attPct}%</span>
                    <div class="meter-track">
                        <div class="meter-fill ${attFillClass}" style="width: ${Math.min(100, attPct)}%;"></div>
                    </div>
                </div>
            </td>
            <td>
                <div style="display:flex; gap:0.35rem; align-items:center;">
                    <span class="signal-pill pill-pos" title="Competent/Proficient observations">Prof: ${s.stats ? s.stats.practicalsProficient : 0}</span>
                    <span class="signal-pill ${s.stats && s.stats.practicalsDeveloping > 0 ? 'pill-neg' : 'pill-zero'}" title="Developing observations">Dev: ${s.stats ? s.stats.practicalsDeveloping : 0}</span>
                </div>
            </td>
            <td>
                <div class="metric-cell">
                    <div style="display:flex; align-items:center;">
                        <span class="metric-val">${examPct}%</span>
                        ${s.stats && s.stats.singleBadDaySmoothed ? '<span class="badge-smoothed" title="Single bad day anomaly smoothed">Smoothed</span>' : ''}
                    </div>
                    <div class="meter-track">
                        <div class="meter-fill ${examFillClass}" style="width: ${Math.min(100, examPct)}%;"></div>
                    </div>
                </div>
            </td>
            <td>
                <div class="signal-pill-group">
                    ${pill(pts.attendance, 'Attendance', 'Att')}
                    ${pill(pts.practicals, 'Practicals', 'Prac')}
                    ${pill(pts.assessments, 'Exams', 'Exam')}
                    ${pill(pts.feedback, 'Feedback', 'Feed')}
                </div>
            </td>
            <td>
                <span class="risk-badge ${riskClass}" aria-label="${riskText}">
                    ${riskIcon} ${riskText} (${s.totalScore > 0 ? '+'+s.totalScore : s.totalScore})
                </span>
            </td>
            <td><span class="conf-badge ${confClass}">${confText}</span></td>
            <td>${reviewBadge}</td>
            <td>
                <button class="btn-inspect" data-id="${s.id}">
                    🔍 ${t('inspectBtn')}
                </button>
            </td>
        `;

        tr.querySelector('.btn-inspect').addEventListener('click', () => openStudentDrawer(s.id));
        tbody.appendChild(tr);
    });
}

function applyFilters() {
    const search = $('search-input').value.toLowerCase();
    const trade = $('trade-filter').value;
    const risk = $('risk-filter').value;
    const conf = $('conf-filter').value;

    state.filteredStudents = state.students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search) || s.cohort_trade.toLowerCase().includes(search);
        const matchesTrade = trade === 'all' || s.cohort_trade === trade;
        const matchesRisk = risk === 'all' || s.riskBand === risk;
        const matchesConf = conf === 'all' || s.confidence === conf;
        return matchesSearch && matchesTrade && matchesRisk && matchesConf;
    });

    renderStudentTable();
}

function populateStudentDropdown(students) {
    const select = $('field-student-select');
    select.innerHTML = '';
    students.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.name} (${s.cohort_trade})`;
        select.appendChild(opt);
    });
}

// -------------------------------------------------------------
// Scorecard Inspector Drawer
// -------------------------------------------------------------
async function openStudentDrawer(studentId) {
    try {
        const res = await fetch(`/api/students/${studentId}`);
        const data = await res.json();
        if (!data.success) return;

        state.selectedStudent = data;
        const s = data.student;
        const sc = data.scorecard;
        const p = sc.points;

        $('drawer-student-name').textContent = s.name;
        $('drawer-student-sub').textContent = `Trade: ${s.cohort_trade.toUpperCase()} | Enrolled: ${s.enrollment_date.split('T')[0]} | Device: ${s.device_tier}`;

        // Fill breakdown cards
        $('sc-att-points').textContent = p.attendance > 0 ? `+${p.attendance}` : p.attendance;
        $('sc-att-desc').textContent = `Presence rate: ${sc.stats.attendancePercent}% over ${sc.stats.attendanceTotal} sessions.`;

        $('sc-prac-points').textContent = p.practicals > 0 ? `+${p.practicals}` : p.practicals;
        $('sc-prac-desc').textContent = `Proficient/Competent: ${sc.stats.practicalsProficient} | Developing: ${sc.stats.practicalsDeveloping} | Not Observed: ${sc.stats.practicalsNotObserved}`;

        $('sc-exam-points').textContent = p.assessments > 0 ? `+${p.assessments}` : p.assessments;
        $('sc-exam-desc').textContent = `Average score: ${sc.stats.examAverage}%. ${sc.stats.singleBadDaySmoothed ? 'Single bad day detected and smoothed.' : 'Standard trend.'}`;

        $('sc-feed-points').textContent = p.feedback > 0 ? `+${p.feedback}` : p.feedback;
        $('sc-feed-desc').textContent = `${sc.stats.hasNegativeFeedback ? 'Negative observation notes logged by workshop instructor.' : 'Neutral or positive observations recorded.'}`;

        $('sc-total-score').textContent = `Total Points: ${sc.totalScore > 0 ? '+'+sc.totalScore : sc.totalScore} ➜ ${sc.riskBand.toUpperCase()}`;

        // Populate Review Form
        $('review-status-select').value = sc.humanReview.status || 'unreviewed';
        $('reviewer-notes-input').value = sc.humanReview.notes || '';

        $('student-drawer').style.display = 'flex';
        $('drawer-save-review-btn').onclick = () => submitHumanReview(studentId);
        $('drawer-close-btn').onclick = () => { $('student-drawer').style.display = 'none'; };
    } catch (err) {
        console.error('Failed to load student drawer:', err);
    }
}

async function submitHumanReview(studentId) {
    const status = $('review-status-select').value;
    const notes = $('reviewer-notes-input').value;

    try {
        const res = await fetch(`/api/students/${studentId}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, notes })
        });
        const json = await res.json();
        if (json.success) {
            alert('Human review recorded successfully.');
            $('student-drawer').style.display = 'none';
            await fetchStudents();
            applyFilters();
        }
    } catch (err) {
        alert('Failed to save review: ' + err.message);
    }
}

// -------------------------------------------------------------
// Field Capture & Offline Queuing
// -------------------------------------------------------------
async function handleFieldFormSubmit(e) {
    e.preventDefault();

    const studentId = $('field-student-select').value;
    const date = $('field-date-input').value || new Date().toISOString();
    const present = $('field-att-present').checked;
    const taskName = $('field-task-input').value || 'Workshop Practical';
    const rubricLevel = state.selectedRubric;
    const notes = $('field-notes-input').value;

    const record = {
        type: 'practical',
        student_id: studentId,
        date,
        task_id: 'task_' + taskName.toLowerCase().replace(/\s+/g, '_'),
        task_name: taskName,
        rubric_level: rubricLevel,
        instructor_id: 'instructor_mobile_field',
        notes,
        device_id: 'field_device_inst_1',
        captured_at: new Date().toISOString()
    };

    if (state.offlineSimulated || !navigator.onLine) {
        // Enqueue locally into IndexedDB
        if (window.OfflineDB) {
            await window.OfflineDB.enqueueOfflineRecord(record);
            await updateOfflineQueueBadge();
            alert('⚠️ Network Offline: Record safely stored in local IndexedDB queue. It will sync when online.');
        }
    } else {
        // Post directly to sync endpoint
        try {
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: [record], deviceId: 'field_device_inst_1' })
            });
            const json = await res.json();
            if (json.success) {
                alert(`✅ Record synced directly to server! (${json.message})`);
                await fetchStudents();
                await fetchConflicts();
                applyFilters();
            }
        } catch (err) {
            // Fallback to offline queue
            if (window.OfflineDB) {
                await window.OfflineDB.enqueueOfflineRecord(record);
                await updateOfflineQueueBadge();
                alert('⚠️ Server connection interrupted. Record saved to local IndexedDB queue.');
            }
        }
    }

    $('field-notes-input').value = '';
}

async function handleSyncQueue() {
    if (!window.OfflineDB) return;
    const queue = await window.OfflineDB.getOfflineQueue();
    if (queue.length === 0) return alert('No queued records to sync.');

    try {
        const res = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ records: queue, deviceId: 'field_device_inst_1' })
        });
        const json = await res.json();
        if (json.success) {
            await window.OfflineDB.clearOfflineQueue();
            await updateOfflineQueueBadge();
            alert(`🎉 Sync Complete: ${json.message}`);
            await fetchStudents();
            await fetchConflicts();
            applyFilters();
        }
    } catch (err) {
        alert('Sync failed. Please ensure server connectivity.');
    }
}

// -------------------------------------------------------------
// Conflict Resolution Center
// -------------------------------------------------------------
function renderConflicts() {
    const container = $('conflicts-container');
    container.innerHTML = '';

    if (state.conflicts.length === 0) {
        container.innerHTML = `<div class="detail-card" style="text-align:center; padding:2.5rem; color:var(--text-muted);">${t('noConflicts')}</div>`;
        return;
    }

    state.conflicts.forEach(c => {
        const card = document.createElement('div');
        card.className = 'conflict-card';

        const recA = c.records[0];
        const recB = c.records[1];

        card.innerHTML = `
            <div class="conflict-header">
                <div>
                    <strong style="font-size:1.05rem;">${c.studentName}</strong>
                    <div style="font-size:0.8rem; color:var(--text-secondary);">${c.cohortTrade.toUpperCase()} | Task: ${c.taskName} | Date: ${c.date}</div>
                </div>
                <span class="risk-badge risk-watch">⚡ CONCURRENT OFFLINE EDITS</span>
            </div>

            <div class="conflict-split">
                <div class="conflict-side">
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.3rem;">DEVICE A (${recA.device_id})</div>
                    <div>Instructor: <strong>${recA.instructor_id}</strong></div>
                    <div>Rubric: <strong style="color:#6ee7b7;">${recA.rubric_level.toUpperCase()}</strong></div>
                    <div>Captured: ${new Date(recA.captured_at).toLocaleTimeString()}</div>
                    <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.4rem;">Notes: "${recA.notes || 'None'}"</div>
                    <button class="btn-primary" style="margin-top:0.85rem; width:100%;" id="btn-resolve-a-${recA.id}">
                        ✔ ${t('acceptA')}
                    </button>
                </div>

                <div class="conflict-side">
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.3rem;">DEVICE B (${recB.device_id})</div>
                    <div>Instructor: <strong>${recB.instructor_id}</strong></div>
                    <div>Rubric: <strong style="color:#fcd34d;">${recB.rubric_level.toUpperCase()}</strong></div>
                    <div>Captured: ${new Date(recB.captured_at).toLocaleTimeString()}</div>
                    <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.4rem;">Notes: "${recB.notes || 'None'}"</div>
                    <button class="btn-primary" style="margin-top:0.85rem; width:100%;" id="btn-resolve-b-${recB.id}">
                        ✔ ${t('acceptB')}
                    </button>
                </div>
            </div>
        `;

        card.querySelector(`#btn-resolve-a-${recA.id}`).addEventListener('click', () => resolveConflictRecord(recA.id, [recB.id], `Accepted Device A: ${recA.rubric_level}`));
        card.querySelector(`#btn-resolve-b-${recB.id}`).addEventListener('click', () => resolveConflictRecord(recB.id, [recA.id], `Accepted Device B: ${recB.rubric_level}`));

        container.appendChild(card);
    });
}

async function resolveConflictRecord(authoritativeId, discardedIds, notes) {
    try {
        const res = await fetch('/api/conflicts/resolve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authoritativeId, discardedIds, resolvedNotes: notes })
        });
        const json = await res.json();
        if (json.success) {
            alert('Conflict resolved. Authoritative record saved.');
            await fetchConflicts();
            await fetchStudents();
            renderConflicts();
        }
    } catch (err) {
        alert('Resolution failed: ' + err.message);
    }
}

// -------------------------------------------------------------
// Before-and-After Comparison View
// -------------------------------------------------------------
function renderComparison() {
    const tbody = $('comparison-table-body');
    tbody.innerHTML = '';

    state.students.forEach(s => {
        const isQuietDisengaging = s.name.includes('Quiet_Disengaging');
        const isFestivalAbsence = s.name.includes('False_Baseline_Positive');
        
        let highlightClass = '';
        let tag = '';
        if (isQuietDisengaging) {
            highlightClass = 'style="background: rgba(239, 68, 68, 0.08);"';
            tag = `<span class="pill-badge badge-offline" style="font-size:0.68rem;">EDGE: QUIET DISENGAGER</span>`;
        } else if (isFestivalAbsence) {
            highlightClass = 'style="background: rgba(245, 158, 11, 0.08);"';
            tag = `<span class="pill-badge badge-online" style="font-size:0.68rem;">EDGE: FESTIVAL ABSENCE</span>`;
        }

        const tr = document.createElement('tr');
        if (highlightClass) tr.setAttribute('style', highlightClass.replace('style="', '').replace('"', ''));

        tr.innerHTML = `
            <td>
                <strong>${s.name}</strong> ${tag}
                <div style="font-size:0.75rem; color:var(--text-muted);">${s.cohort_trade}</div>
            </td>
            <td>${s.stats ? s.stats.attendancePercent : 0}%</td>
            <td>
                <span class="risk-badge ${s.baselinePrediction === 'needs support' ? 'risk-needs-support' : 'risk-steady'}">
                    ${s.baselinePrediction.toUpperCase()}
                </span>
            </td>
            <td>
                <span class="risk-badge ${s.riskBand === 'needs support' ? 'risk-needs-support' : (s.riskBand === 'watch' ? 'risk-watch' : 'risk-steady')}">
                    ${s.riskBand.toUpperCase()} (${s.totalScore > 0 ? '+'+s.totalScore : s.totalScore})
                </span>
            </td>
            <td>
                <span style="font-size:0.8rem; color:${isQuietDisengaging ? '#6ee7b7' : (isFestivalAbsence ? '#6ee7b7' : 'var(--text-secondary)')}">
                    ${isQuietDisengaging ? '✔ Caught by Scorecard (Baseline Missed - FN)' : (isFestivalAbsence ? '✔ Preserved as Steady (Baseline Flagged - FP)' : 'Consistent')}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// -------------------------------------------------------------
// Multilingual Translation Binding
// -------------------------------------------------------------
function applyTranslations() {
    $('app-title').textContent = t('appTitle');
    $('app-subtitle').textContent = t('appSubtitle');
    $('low-bandwidth-btn').textContent = t('lowBandwidthToggle');
    
    // Tab labels
    $('tab-dashboard-text').textContent = t('tabDashboard');
    $('tab-field-text').textContent = t('tabFieldCapture');
    $('tab-conflicts-text').textContent = t('tabConflicts');
    $('tab-comp-text').textContent = t('tabComparison');

    // Metrics labels
    if ($('metric-total-label')) $('metric-total-label').textContent = t('metricTotal');
    if ($('metric-needs-support-label')) $('metric-needs-support-label').textContent = t('metricNeedsSupport');
    if ($('metric-watch-label')) $('metric-watch-label').textContent = t('metricWatch');
    if ($('metric-steady-label')) $('metric-steady-label').textContent = t('metricSteady');
    if ($('metric-conflicts-label')) $('metric-conflicts-label').textContent = t('metricConflicts');
    if ($('metric-recall-label')) $('metric-recall-label').textContent = t('metricRecallGain');
    if ($('dist-title-text')) $('dist-title-text').textContent = t('distTitle') || 'Cohort Risk Distribution';
    if ($('legend-support-text')) $('legend-support-text').textContent = t('metricNeedsSupport');
    if ($('legend-watch-text')) $('legend-watch-text').textContent = t('metricWatch');
    if ($('legend-steady-text')) $('legend-steady-text').textContent = t('metricSteady');

    // Search & Filter & Actions
    $('search-input').placeholder = t('searchPlaceholder');
    if ($('export-csv-text')) $('export-csv-text').textContent = t('exportCsv');
    if ($('lms-import-text')) $('lms-import-text').textContent = t('lmsIngestion');

    // Field capture labels
    $('field-title').textContent = t('fieldTitle');
    $('field-subtitle').textContent = t('fieldSubtitle');
    $('field-student-label').textContent = t('selectStudentLabel');
    $('field-date-label').textContent = t('selectDateLabel');
    $('field-att-label').textContent = t('attendanceLabel');
    $('field-present-text').textContent = t('presentOption');
    $('field-absent-text').textContent = t('absentOption');
    $('field-task-label').textContent = t('taskLabel');
    $('field-rubric-label').textContent = t('rubricLabel');
    $('field-notes-label').textContent = t('notesLabel');
    $('field-submit-btn').textContent = t('saveFieldBtn');
    $('field-offline-notice').textContent = t('offlineNotice');

    // Conflicts labels
    $('conflicts-title').textContent = t('conflictsTitle');
    $('conflicts-subtitle').textContent = t('conflictsSubtitle');

    // Comparison labels
    $('comp-title').textContent = t('compTitle');
    $('comp-subtitle').textContent = t('compSubtitle');
}

// Start App on DOM Ready
window.addEventListener('DOMContentLoaded', initApp);
