# Data Schema Documentation

The data model is built to ensure robust tracking of multiple signal families and rigorous handling of offline synchronization metadata.

## Core Entities

### `Student`
- **Fields**: `id`, `name`, `cohort_trade`, `enrollment_date`, `language_pref`, `first_generation_flag`, `device_tier`
- **Rationale**: `first_generation_flag` and `device_tier` are specifically captured to test for bias in the outcomes and to simulate edge cases, not as model inputs.

### `Attendance`
- **Fields**: `student_id`, `date`, `present` (bool), `source`, `captured_offline` (bool)
- **Rationale**: Tracks both self-reported and instructor-captured attendance.

### `PracticalActivity`
- **Fields**: `student_id`, `date`, `task_id`, `task_name`, `rubric_level`, `instructor_id`, `notes`
- **Rationale**: Uses a competency rubric (`not_observed`, `developing`, `competent`, `proficient`) rather than binary pass/fail, treating "not observed" as a first-class state that does not penalize the student.

### `Assessment`
- **Fields**: `student_id`, `date`, `assessment_type`, `score`, `max_score`
- **Rationale**: Tracks varied assessment types over time to enable trend analysis (smoothing over a "single bad day").

### `HelpSeeking`
- **Fields**: `student_id`, `timestamp`, `type`, `initiated_by_student`
- **Rationale**: A key behavioral signal. A drop in student-initiated help-seeking combined with other subtle factors can trigger the "quietly disengaging" flag.

### `Feedback`
- **Fields**: `student_id`, `date`, `source`, `structured_sentiment` (`positive`, `neutral`, `negative`), `free_text`, `language`
- **Rationale**: Supports multilingual free text. Sentiment is structured to feed directly into the scorecard.

### `RiskFlag` (Predictions)
- **Fields**: `student_id`, `run_date`, `total_score`, `risk_band`, `confidence_level`, `per_signal_point_contributions` (JSON), `model_version`, `human_review_status`, `reviewer_notes`
- **Rationale**: The scorecard output. It explicitly stores the breakdown of points per signal to ensure transparency, and includes `human_review_status` to support error analysis and model feedback loops.

## Sync Metadata 
Every transactional record (Attendance, PracticalActivity, Assessment, HelpSeeking, Feedback) includes the following mandatory fields for robust conflict resolution:
- `device_id`: The identifier of the client device that captured the record.
- `captured_at`: The client-side timestamp when the record was created offline.
- `synced_at`: The server-side timestamp when the record reached the database.
- `created_by`: The ID of the user who authored the record.
