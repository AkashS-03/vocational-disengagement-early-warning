# System Architecture

The Disengagement Early-Warning Tool is designed as an offline-first, transparent system to capture student signals and generate interpretable risk scores.

## Architecture Diagram

```mermaid
flowchart TD
    subgraph Client [Field Capture (Offline-First)]
        UI[Instructor Mobile UI\nAttendance, Rubrics, Feedback]
        LocalQ[(Local Queue / IndexedDB)]
        UI -->|Save| LocalQ
    end

    subgraph SyncLayer [Sync & Conflict Resolution]
        SyncEngine[Sync Engine]
        ConflictRes[Conflict Resolution UI\n(Coordinator)]
        LocalQ -->|Opportunistic Sync| SyncEngine
        SyncEngine -->|Detects Conflict| ConflictRes
    end

    subgraph DataStore [Backend Data Store]
        DB[(Primary DB\nSQLite/PostgreSQL)]
        SyncEngine -->|Write (Device ID + Timestamp)| DB
        ConflictRes -->|Manual Merge| DB
    end

    subgraph MLPipeline [Model & Explainability]
        FeatureBin[Feature Binning Layer]
        Baseline[Baseline Model\n(Rule-based)]
        Scorecard[Scorecard Model\n(Additive Points)]
        Explain[Explainability & Confidence Layer]
        
        DB --> FeatureBin
        FeatureBin --> Baseline
        FeatureBin --> Scorecard
        Baseline --> Explain
        Scorecard --> Explain
    end

    subgraph Dashboard [Coordinator Dashboard]
        FullView[Full UI\n(Bilingual, Accessible)]
        LowBandwidth[Low-Bandwidth\nText-Only View]
        FeedbackLoop[Human Review\n(FP / FN Marking)]
        
        Explain --> FullView
        Explain --> LowBandwidth
        FullView --> FeedbackLoop
        FeedbackLoop --> DB
    end
```

## Key Architectural Decisions
1. **Offline-First Writes**: Field tools are used in workshops where connectivity is spotty. Writes go to a local queue and sync when online.
2. **Conflict Resolution**: Implicit "last-write-wins" is disabled for conflicting records from different devices on the same day. These surface to coordinators for manual resolution.
3. **Transparent Scorecard over Black-Box ML**: Instead of outputting a random forest probability, the system bins signals and applies pre-calculated integer points (derived via SHAP/Logistic Regression). This allows the UI to display exact contributions (e.g., "Practicals: +3").

## Sync Conflict Resolution Lifecycle

The following sequence details how concurrent offline observations from multiple field instructors are managed, detected, and resolved without silent overwrites:

```mermaid
sequenceDiagram
    autonumber
    actor InstA as Instructor A (Device A)
    actor InstB as Instructor B (Device B)
    participant LocalDB_A as Device A (IndexedDB)
    participant LocalDB_B as Device B (IndexedDB)
    participant SyncAPI as Sync Engine / API
    participant CentralDB as Central SQLite / Prisma
    actor Coord as Coordinator (Dashboard)

    Note over InstA,InstB: Offline in Workshop (Spotty Connectivity)
    InstA->>LocalDB_A: Log Practical (Welding: Developing, t=10:00)
    InstB->>LocalDB_B: Log Practical (Welding: Competent, t=11:30)

    Note over LocalDB_A,LocalDB_B: Network Connectivity Restored
    LocalDB_A->>SyncAPI: POST /api/sync (Device A Queue)
    SyncAPI->>CentralDB: Write record (device_id=A, captured_at=10:00)
    
    LocalDB_B->>SyncAPI: POST /api/sync (Device B Queue)
    SyncAPI->>CentralDB: Query existing (student_id, date, task_id)
    Note over SyncAPI: Detected conflict for same student & task!
    SyncAPI->>CentralDB: Store secondary record marked with CONFLICT status
    
    SyncAPI->>Coord: Surface in Conflict Resolution Center
    Coord->>CentralDB: GET /api/conflicts
    Coord->>Coord: Inspect timestamps, rubric levels, & instructor notes
    Coord->>SyncAPI: POST /api/conflicts/resolve (Selected record or manual merge)
    SyncAPI->>CentralDB: Mark chosen record authoritative; archive conflicting entry
    Note over CentralDB: Risk Scorecard re-evaluates with resolved authoritative signal
```

