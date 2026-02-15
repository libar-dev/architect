# Validation Business Rules

**Purpose:** Business rules for the Validation product area

---

**41 rules** from 8 features. 10 rules have explicit invariants.

---

## Uncategorized

### Anti Pattern Detector

*- Dependencies in features (should be code-only) cause drift*

---

#### Process metadata should not appear in TypeScript code

**Verified by:**
- Code without process tags passes
- Feature-only process tags in code are flagged

---

#### Generator hints should not appear in feature files

**Verified by:**
- Feature without magic comments passes
- Features with excessive magic comments are flagged
- Magic comments within threshold pass

---

#### Feature files should not have excessive scenarios

**Verified by:**
- Feature with few scenarios passes
- Feature exceeding scenario threshold is flagged

---

#### Feature files should not exceed size thresholds

**Verified by:**
- Normal-sized feature passes
- Oversized feature is flagged

---

#### All anti-patterns can be detected in one pass

**Verified by:**
- Combined detection finds process-in-code issues

---

#### Violations can be formatted for console output

**Verified by:**
- Empty violations produce clean report
- Violations are grouped by severity

*anti-patterns.feature*

### Config Schema Validation

*Configuration schemas validate scanner and generator inputs with security*

---

#### ScannerConfigSchema validates scanner configuration

> **Invariant:** Scanner configuration must contain at least one valid glob pattern with no parent directory traversal, and baseDir must resolve to an absolute path.
>
> **Rationale:** Malformed or malicious glob patterns could scan outside project boundaries, exposing sensitive files.

**Verified by:**
- ScannerConfigSchema validates correct configuration
- ScannerConfigSchema accepts multiple patterns
- ScannerConfigSchema rejects empty patterns array
- ScannerConfigSchema rejects parent traversal in patterns
- ScannerConfigSchema rejects hidden parent traversal
- ScannerConfigSchema normalizes baseDir to absolute path
- ScannerConfigSchema accepts optional exclude patterns

---

#### GeneratorConfigSchema validates generator configuration

> **Invariant:** Generator configuration must use a .json registry file and an output directory that does not escape the project root via parent traversal.
>
> **Rationale:** Non-JSON registry files could introduce parsing vulnerabilities, and unrestricted output paths could overwrite files outside the project.

**Verified by:**
- GeneratorConfigSchema validates correct configuration
- GeneratorConfigSchema requires .json registry file
- GeneratorConfigSchema rejects outputDir with parent traversal
- GeneratorConfigSchema accepts relative output directory
- GeneratorConfigSchema defaults overwrite to false
- GeneratorConfigSchema defaults readmeOnly to false

---

#### isScannerConfig type guard narrows unknown values

> **Invariant:** isScannerConfig returns true only for objects that have a non-empty patterns array and a string baseDir.

**Verified by:**
- isScannerConfig returns true for valid config
- isScannerConfig returns false for invalid config
- isScannerConfig returns false for null
- isScannerConfig returns false for non-object

---

#### isGeneratorConfig type guard narrows unknown values

> **Invariant:** isGeneratorConfig returns true only for objects that have a string outputDir and a .json registryPath.

**Verified by:**
- isGeneratorConfig returns true for valid config
- isGeneratorConfig returns false for invalid config
- isGeneratorConfig returns false for non-json registry

*config-schemas.feature*

### Detect Changes

*Tests for the detectDeliverableChanges function that parses git diff output.*

---

#### Status changes are detected as modifications not additions

**Verified by:**
- Single deliverable status change is detected as modification
- Multiple deliverable status changes are all modifications

---

#### New deliverables are detected as additions

**Verified by:**
- New deliverable is detected as addition

---

#### Removed deliverables are detected as removals

**Verified by:**
- Removed deliverable is detected as removal

---

#### Mixed changes are correctly categorized

**Verified by:**
- Mixed additions, removals, and modifications are handled correctly

---

#### Non-deliverable tables are ignored

**Verified by:**
- Changes in Examples tables are not detected as deliverable changes

*detect-changes.feature*

### Do D Validator

*- Phases marked "completed" without all deliverables done*

---

#### Deliverable completion uses canonical status taxonomy

**Verified by:**
- Complete status is detected as complete
- Non-complete canonical statuses are correctly identified

---

#### Acceptance criteria must be tagged with @acceptance-criteria

**Verified by:**
- Feature with @acceptance-criteria scenario passes
- Feature without @acceptance-criteria fails
- Tag matching is case-insensitive

---

#### Acceptance criteria scenarios can be extracted by name

**Verified by:**
- Extract multiple AC scenario names
- No AC scenarios returns empty list

---

#### DoD requires all deliverables complete and AC present

**Verified by:**
- Phase with all deliverables complete and AC passes
- Phase with incomplete deliverables fails
- Phase without acceptance criteria fails
- Phase without deliverables fails

---

#### DoD can be validated across multiple completed phases

**Verified by:**
- All completed phases passing DoD
- Mixed pass/fail results
- Only completed phases are validated by default
- Filter to specific phases

---

#### Summary can be formatted for console output

**Verified by:**
- Empty summary shows no completed phases message
- Summary with passed phases shows details
- Summary with failed phases shows details

*dod-validator.feature*

### FSM Validator

*- Status values must conform to PDR-005 FSM states*

---

#### Status values must be valid PDR-005 FSM states

**Verified by:**
- Valid status values are accepted
- Invalid status values are rejected
- Terminal state returns warning

---

#### Status transitions must follow FSM rules

**Verified by:**
- Valid transitions are accepted
- Invalid transitions are rejected with alternatives
- Terminal state has no valid transitions
- Invalid source status in transition
- Invalid target status in transition

---

#### Completed patterns should have proper metadata

**Verified by:**
- Completed pattern with full metadata has no warnings
- Completed pattern without date shows warning
- Completed pattern with planned but no actual effort shows warning
- Non-completed pattern skips metadata validation

---

#### Protection levels match FSM state definitions

**Verified by:**
- Roadmap status has no protection
- Active status has scope protection
- Completed status has hard protection
- Deferred status has no protection

---

#### Combined validation provides complete results

**Verified by:**
- Valid completed pattern returns combined results

*fsm-validator.feature*

### Linter Validation

*Tests for lint rules that validate relationship integrity, detect conflicts,*

---

#### Pattern cannot implement itself (circular reference)

A file cannot define a pattern that implements itself.

**Verified by:**
- Pattern tag with implements tag causes error
- Implements without pattern tag is valid

---

#### Relationship targets should exist (strict mode)

In strict mode, all relationship targets are validated against known patterns.

**Verified by:**
- Uses referencing non-existent pattern warns
- Implements referencing non-existent pattern warns
- Valid relationship target passes

---

#### Bidirectional traceability links should be consistent

**Verified by:**
- Missing back-link detected
- Orphan executable spec detected

---

#### Parent references must be valid

**Verified by:**
- Invalid parent reference detected
- Valid parent reference passes

*linter-validation.feature*

### Process Guard

*- Completed specs modified without explicit unlock reason*

---

#### Completed files require unlock-reason to modify

> **Invariant:** A completed spec file cannot be modified unless it carries an @libar-docs-unlock-reason tag.
>
> **Rationale:** Completed work represents validated, shipped functionality — accidental modification risks regression.

**Verified by:**
- Completed file with unlock-reason passes validation
- Completed file without unlock-reason fails validation
- Protection levels and unlock requirement
- File transitioning to completed does not require unlock-reason

---

#### Status transitions must follow PDR-005 FSM

> **Invariant:** Status changes must follow the directed graph: roadmap->active->completed, roadmap<->deferred, active->roadmap.
>
> **Rationale:** The FSM prevents skipping required stages (e.g., roadmap->completed bypasses implementation).

**Verified by:**
- Valid transitions pass validation
- Invalid transitions fail validation

---

#### Active specs cannot add new deliverables

> **Invariant:** A spec in active status cannot have deliverables added that were not present when it entered active.
>
> **Rationale:** Scope-locking active work prevents mid-sprint scope creep that derails delivery commitments.

**Verified by:**
- Active spec with no deliverable changes passes
- Active spec adding deliverable fails validation
- Roadmap spec can add deliverables freely
- Removing deliverable produces warning
- Deliverable status change does not trigger scope-creep
- Multiple deliverable status changes pass validation

---

#### Files outside active session scope trigger warnings

> **Invariant:** Files modified outside the active session's declared scope produce a session-scope warning.
>
> **Rationale:** Session scoping keeps focus on planned work and makes accidental cross-cutting changes visible.

**Verified by:**
- File in session scope passes validation
- File outside session scope triggers warning
- No active session means all files in scope
- ignoreSession flag suppresses session warnings

---

#### Explicitly excluded files trigger errors

> **Invariant:** Files explicitly excluded from a session cannot be modified, producing a session-excluded error.
>
> **Rationale:** Exclusion is stronger than scope — it marks files that must NOT be touched during this session.

**Verified by:**
- Excluded file triggers error
- Non-excluded file passes validation
- ignoreSession flag suppresses excluded errors

---

#### Multiple rules validate independently

> **Invariant:** Each validation rule evaluates independently — a single file can produce violations from multiple rules.
>
> **Rationale:** Independent evaluation ensures no rule masks another, giving complete diagnostic output.

**Verified by:**
- Multiple violations from different rules
- Strict mode promotes warnings to errors
- Clean change produces empty violations

*process-guard.feature*

### Status Transition Detection

*Tests for the detectStatusTransitions function that parses git diff output.*

---

#### Status transitions are detected from file-level tags

**Verified by:**
- New file with status tag is detected as transition from roadmap
- Modified file with status change is detected
- No transition when status unchanged

---

#### Status tags inside docstrings are ignored

**Verified by:**
- Status tag inside docstring is not used for transition
- Multiple docstring status tags are all ignored
- Only docstring status tags results in no transition

---

#### First valid status tag outside docstrings is used

**Verified by:**
- First file-level tag wins over subsequent tags

---

#### Line numbers are tracked from hunk headers

**Verified by:**
- Transition location includes correct line number

---

#### Generated documentation directories are excluded

**Verified by:**
- Status in docs-generated directory is ignored
- Status in docs-living directory is ignored

*status-transition-detection.feature*

---

[← Back to Business Rules](../BUSINESS-RULES.md)
