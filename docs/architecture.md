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
