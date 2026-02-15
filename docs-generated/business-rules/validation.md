# Validation Business Rules

**Purpose:** Business rules for the Validation product area

---

**37 rules** from 7 features. 6 rules have explicit invariants.

---

## Uncategorized

### Anti Pattern Detector

*- Dependencies in features (should be code-only) cause drift*

#### Process metadata should not appear in TypeScript code

_Verified by: Code without process tags passes, Feature-only process tags in code are flagged_

#### Generator hints should not appear in feature files

_Verified by: Feature without magic comments passes, Features with excessive magic comments are flagged, Magic comments within threshold pass_

#### Feature files should not have excessive scenarios

_Verified by: Feature with few scenarios passes, Feature exceeding scenario threshold is flagged_

#### Feature files should not exceed size thresholds

_Verified by: Normal-sized feature passes, Oversized feature is flagged_

#### All anti-patterns can be detected in one pass

_Verified by: Combined detection finds process-in-code issues_

#### Violations can be formatted for console output

_Verified by: Empty violations produce clean report, Violations are grouped by severity_

*anti-patterns.feature*

### Detect Changes

*Tests for the detectDeliverableChanges function that parses git diff output.*

#### Status changes are detected as modifications not additions

_Verified by: Single deliverable status change is detected as modification, Multiple deliverable status changes are all modifications_

#### New deliverables are detected as additions

_Verified by: New deliverable is detected as addition_

#### Removed deliverables are detected as removals

_Verified by: Removed deliverable is detected as removal_

#### Mixed changes are correctly categorized

_Verified by: Mixed additions, removals, and modifications are handled correctly_

#### Non-deliverable tables are ignored

_Verified by: Changes in Examples tables are not detected as deliverable changes_

*detect-changes.feature*

### Do D Validator

*- Phases marked "completed" without all deliverables done*

#### Deliverable completion uses canonical status taxonomy

_Verified by: Complete status is detected as complete, Non-complete canonical statuses are correctly identified_

#### Acceptance criteria must be tagged with @acceptance-criteria

_Verified by: Feature with @acceptance-criteria scenario passes, Feature without @acceptance-criteria fails, Tag matching is case-insensitive_

#### Acceptance criteria scenarios can be extracted by name

_Verified by: Extract multiple AC scenario names, No AC scenarios returns empty list_

#### DoD requires all deliverables complete and AC present

_Verified by: Phase with all deliverables complete and AC passes, Phase with incomplete deliverables fails, Phase without acceptance criteria fails, Phase without deliverables fails_

#### DoD can be validated across multiple completed phases

_Verified by: All completed phases passing DoD, Mixed pass/fail results, Only completed phases are validated by default, Filter to specific phases_

#### Summary can be formatted for console output

_Verified by: Empty summary shows no completed phases message, Summary with passed phases shows details, Summary with failed phases shows details_

*dod-validator.feature*

### FSM Validator

*- Status values must conform to PDR-005 FSM states*

#### Status values must be valid PDR-005 FSM states

_Verified by: Valid status values are accepted, Invalid status values are rejected, Terminal state returns warning_

#### Status transitions must follow FSM rules

_Verified by: Valid transitions are accepted, Invalid transitions are rejected with alternatives, Terminal state has no valid transitions, Invalid source status in transition, Invalid target status in transition_

#### Completed patterns should have proper metadata

_Verified by: Completed pattern with full metadata has no warnings, Completed pattern without date shows warning, Completed pattern with planned but no actual effort shows warning, Non-completed pattern skips metadata validation_

#### Protection levels match FSM state definitions

_Verified by: Roadmap status has no protection, Active status has scope protection, Completed status has hard protection, Deferred status has no protection_

#### Combined validation provides complete results

_Verified by: Valid completed pattern returns combined results_

*fsm-validator.feature*

### Linter Validation

*Tests for lint rules that validate relationship integrity, detect conflicts,*

#### Pattern cannot implement itself (circular reference)

A file cannot define a pattern that implements itself.

_Verified by: Pattern tag with implements tag causes error, Implements without pattern tag is valid_

#### Relationship targets should exist (strict mode)

In strict mode, all relationship targets are validated against known patterns.

_Verified by: Uses referencing non-existent pattern warns, Implements referencing non-existent pattern warns, Valid relationship target passes_

#### Bidirectional traceability links should be consistent

_Verified by: Missing back-link detected, Orphan executable spec detected_

#### Parent references must be valid

_Verified by: Invalid parent reference detected, Valid parent reference passes_

*linter-validation.feature*

### Process Guard

*- Completed specs modified without explicit unlock reason*

#### Completed files require unlock-reason to modify

**Invariant:** A completed spec file cannot be modified unless it carries an @libar-docs-unlock-reason tag.

**Rationale:** Completed work represents validated, shipped functionality — accidental modification risks regression.

_Verified by: Completed file with unlock-reason passes validation, Completed file without unlock-reason fails validation, Protection levels and unlock requirement, File transitioning to completed does not require unlock-reason_

#### Status transitions must follow PDR-005 FSM

**Invariant:** Status changes must follow the directed graph: roadmap->active->completed, roadmap<->deferred, active->roadmap.

**Rationale:** The FSM prevents skipping required stages (e.g., roadmap->completed bypasses implementation).

_Verified by: Valid transitions pass validation, Invalid transitions fail validation_

#### Active specs cannot add new deliverables

**Invariant:** A spec in active status cannot have deliverables added that were not present when it entered active.

**Rationale:** Scope-locking active work prevents mid-sprint scope creep that derails delivery commitments.

_Verified by: Active spec with no deliverable changes passes, Active spec adding deliverable fails validation, Roadmap spec can add deliverables freely, Removing deliverable produces warning, Deliverable status change does not trigger scope-creep, Multiple deliverable status changes pass validation_

#### Files outside active session scope trigger warnings

**Invariant:** Files modified outside the active session's declared scope produce a session-scope warning.

**Rationale:** Session scoping keeps focus on planned work and makes accidental cross-cutting changes visible.

_Verified by: File in session scope passes validation, File outside session scope triggers warning, No active session means all files in scope, ignoreSession flag suppresses session warnings_

#### Explicitly excluded files trigger errors

**Invariant:** Files explicitly excluded from a session cannot be modified, producing a session-excluded error.

**Rationale:** Exclusion is stronger than scope — it marks files that must NOT be touched during this session.

_Verified by: Excluded file triggers error, Non-excluded file passes validation, ignoreSession flag suppresses excluded errors_

#### Multiple rules validate independently

**Invariant:** Each validation rule evaluates independently — a single file can produce violations from multiple rules.

**Rationale:** Independent evaluation ensures no rule masks another, giving complete diagnostic output.

_Verified by: Multiple violations from different rules, Strict mode promotes warnings to errors, Clean change produces empty violations_

*process-guard.feature*

### Status Transition Detection

*Tests for the detectStatusTransitions function that parses git diff output.*

#### Status transitions are detected from file-level tags

_Verified by: New file with status tag is detected as transition from roadmap, Modified file with status change is detected, No transition when status unchanged_

#### Status tags inside docstrings are ignored

_Verified by: Status tag inside docstring is not used for transition, Multiple docstring status tags are all ignored, Only docstring status tags results in no transition_

#### First valid status tag outside docstrings is used

_Verified by: First file-level tag wins over subsequent tags_

#### Line numbers are tracked from hunk headers

_Verified by: Transition location includes correct line number_

#### Generated documentation directories are excluded

_Verified by: Status in docs-generated directory is ignored, Status in docs-living directory is ignored_

*status-transition-detection.feature*

---

[← Back to Business Rules](../BUSINESS-RULES.md)
