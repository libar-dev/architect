# Validation Business Rules

**Purpose:** Business rules for the Validation product area

---

**54 rules** from 11 features. 54 rules have explicit invariants.

---

## Uncategorized

### Anti Pattern Detector

_- Dependencies in features (should be code-only) cause drift_

---

#### Process metadata should not appear in TypeScript code

> **Invariant:** Process metadata tags (@libar-docs-status, @libar-docs-phase, etc.) must only appear in Gherkin feature files, never in TypeScript source code.
>
> **Rationale:** TypeScript owns runtime behavior while Gherkin owns delivery process metadata — mixing them creates dual-source conflicts and validation ambiguity.

**Verified by:**

- Code without process tags passes
- Feature-only process tags in code are flagged

---

#### Generator hints should not appear in feature files

> **Invariant:** Feature files must not contain generator magic comments beyond a configurable threshold.
>
> **Rationale:** Generator hints are implementation details that belong in TypeScript — excessive magic comments in specs indicate leaking implementation concerns into business requirements.

**Verified by:**

- Feature without magic comments passes
- Features with excessive magic comments are flagged
- Magic comments within threshold pass

---

#### Feature files should not have excessive scenarios

> **Invariant:** A single feature file must not exceed the configured maximum scenario count.
>
> **Rationale:** Oversized feature files indicate missing decomposition — they become hard to maintain and slow to execute.

**Verified by:**

- Feature with few scenarios passes
- Feature exceeding scenario threshold is flagged

---

#### Feature files should not exceed size thresholds

> **Invariant:** A single feature file must not exceed the configured maximum line count.
>
> **Rationale:** Excessively large files indicate a feature that should be split into focused, independently testable specifications.

**Verified by:**

- Normal-sized feature passes
- Oversized feature is flagged

---

#### All anti-patterns can be detected in one pass

> **Invariant:** The anti-pattern detector must evaluate all registered rules in a single scan pass over the source files.
>
> **Rationale:** Single-pass detection ensures consistent results and avoids O(n\*m) performance degradation with multiple file traversals.

**Verified by:**

- Combined detection finds process-in-code issues

---

#### Violations can be formatted for console output

> **Invariant:** Anti-pattern violations must be renderable as grouped, human-readable console output.
>
> **Rationale:** Developers need actionable feedback at commit time — ungrouped or unformatted violations are hard to triage and fix.

**Verified by:**

- Empty violations produce clean report
- Violations are grouped by severity

_anti-patterns.feature_

### Config Schema Validation

_Configuration schemas validate scanner and generator inputs with security_

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
>
> **Rationale:** Without a reliable type guard, callers cannot safely narrow unknown config objects and risk accessing properties on incompatible types at runtime.

**Verified by:**

- isScannerConfig returns true for valid config
- isScannerConfig returns false for invalid config
- isScannerConfig returns false for null
- isScannerConfig returns false for non-object

---

#### isGeneratorConfig type guard narrows unknown values

> **Invariant:** isGeneratorConfig returns true only for objects that have a string outputDir and a .json registryPath.
>
> **Rationale:** Without a reliable type guard, callers cannot safely narrow unknown config objects and risk passing malformed generator configs that bypass schema validation.

**Verified by:**

- isGeneratorConfig returns true for valid config
- isGeneratorConfig returns false for invalid config
- isGeneratorConfig returns false for non-json registry

_config-schemas.feature_

### Detect Changes

_Tests for the detectDeliverableChanges function that parses git diff output._

---

#### Status changes are detected as modifications not additions

> **Invariant:** When a deliverable's status value changes between versions, the change detector must classify it as a modification, not an addition or removal.
>
> **Rationale:** Correct change classification drives scope-creep detection — misclassifying a status change as an addition would trigger false scope-creep violations on active specs.

**Verified by:**

- Single deliverable status change is detected as modification
- Multiple deliverable status changes are all modifications

---

#### New deliverables are detected as additions

> **Invariant:** Deliverables present in the new version but absent in the old version must be classified as additions.
>
> **Rationale:** Addition detection powers the scope-creep rule — new deliverables added to active specs must be flagged as violations.

**Verified by:**

- New deliverable is detected as addition

---

#### Removed deliverables are detected as removals

> **Invariant:** Deliverables present in the old version but absent in the new version must be classified as removals.
>
> **Rationale:** Removal detection enables the deliverable-removed warning — silently dropping deliverables could hide incomplete work.

**Verified by:**

- Removed deliverable is detected as removal

---

#### Mixed changes are correctly categorized

> **Invariant:** When a single diff contains additions, removals, and modifications simultaneously, each change must be independently categorized.
>
> **Rationale:** Real-world commits often contain mixed changes — incorrect categorization of any single change cascades into wrong validation decisions.

**Verified by:**

- Mixed additions, removals, and modifications are handled correctly
- Mixed additions
- removals
- and modifications are handled correctly

---

#### Non-deliverable tables are ignored

> **Invariant:** Changes to non-deliverable tables (e.g., ScenarioOutline Examples tables) must not be detected as deliverable changes.
>
> **Rationale:** Feature files contain many table structures — only the Background deliverables table is semantically relevant to process guard validation.

**Verified by:**

- Changes in Examples tables are not detected as deliverable changes

_detect-changes.feature_

### DoD Validator

_- Phases marked "completed" without all deliverables done_

---

#### Deliverable completion uses canonical status taxonomy

> **Invariant:** Deliverable completion status must be determined exclusively using the 6 canonical values from the deliverable status taxonomy.
>
> **Rationale:** Freeform status strings bypass schema validation and produce inconsistent completion tracking across the monorepo.

**Verified by:**

- Complete status is detected as complete
- Non-complete canonical statuses are correctly identified

---

#### Acceptance criteria must be tagged with @acceptance-criteria

> **Invariant:** Every completed pattern must have at least one scenario tagged with @acceptance-criteria in its feature file.
>
> **Rationale:** Without explicit acceptance criteria tags, there is no machine-verifiable proof that the delivered work meets its requirements.

**Verified by:**

- Feature with @acceptance-criteria scenario passes
- Feature without @acceptance-criteria fails
- Tag matching is case-insensitive

---

#### Acceptance criteria scenarios can be extracted by name

> **Invariant:** The validator must be able to extract scenario names from @acceptance-criteria-tagged scenarios for reporting.
>
> **Rationale:** Extracted names appear in traceability reports and DoD summaries, providing an audit trail from requirement to verification.

**Verified by:**

- Extract multiple AC scenario names
- No AC scenarios returns empty list

---

#### DoD requires all deliverables complete and AC present

> **Invariant:** A pattern passes Definition of Done only when ALL deliverables have complete status AND at least one @acceptance-criteria scenario exists.
>
> **Rationale:** Partial completion or missing acceptance criteria means the pattern is not verified — marking it complete would bypass quality gates.

**Verified by:**

- Phase with all deliverables complete and AC passes
- Phase with incomplete deliverables fails
- Phase without acceptance criteria fails
- Phase without deliverables fails

---

#### DoD can be validated across multiple completed phases

> **Invariant:** DoD validation must evaluate all completed phases independently and report per-phase pass/fail results.
>
> **Rationale:** Multi-phase patterns need granular validation — a single aggregate result would hide which specific phase failed its Definition of Done.

**Verified by:**

- All completed phases passing DoD
- Mixed pass/fail results
- Only completed phases are validated by default
- Filter to specific phases

---

#### Summary can be formatted for console output

> **Invariant:** DoD validation results must be renderable as structured console output showing phase-level pass/fail details.
>
> **Rationale:** Developers need immediate, actionable feedback during pre-commit validation — raw data structures are not human-readable.

**Verified by:**

- Empty summary shows no completed phases message
- Summary with passed phases shows details
- Summary with failed phases shows details

_dod-validator.feature_

### FSM Validator

_- Status values must conform to PDR-005 FSM states_

---

#### Status values must be valid PDR-005 FSM states

> **Invariant:** Every pattern status value must be one of the states defined in the PDR-005 finite state machine (roadmap, active, completed, deferred).
>
> **Rationale:** Invalid status values bypass FSM transition validation and produce undefined behavior in process guard enforcement.

**Verified by:**

- Valid status values are accepted
- Invalid status values are rejected
- Terminal state returns warning

---

#### Status transitions must follow FSM rules

> **Invariant:** Every status change must follow a valid edge in the PDR-005 state machine graph — no skipping states or invalid paths.
>
> **Rationale:** The FSM encodes the delivery workflow contract — invalid transitions indicate process violations that could corrupt delivery tracking.

**Verified by:**

- Valid transitions are accepted
- Invalid transitions are rejected with alternatives
- Terminal state has no valid transitions
- Invalid source status in transition
- Invalid target status in transition

---

#### Completed patterns should have proper metadata

> **Invariant:** Patterns in completed status must carry completion date and actual effort metadata to pass validation without warnings.
>
> **Rationale:** Completion metadata enables retrospective analysis and effort estimation — missing metadata degrades project planning accuracy over time.

**Verified by:**

- Completed pattern with full metadata has no warnings
- Completed pattern without date shows warning
- Completed pattern with planned but no actual effort shows warning
- Non-completed pattern skips metadata validation

---

#### Protection levels match FSM state definitions

> **Invariant:** Each FSM state must map to exactly one protection level (none, scope-locked, or hard-locked) as defined in PDR-005.
>
> **Rationale:** Protection levels enforce edit constraints per state — mismatched protection would allow prohibited modifications to active or completed specs.

**Verified by:**

- Roadmap status has no protection
- Active status has scope protection
- Completed status has hard protection
- Deferred status has no protection

---

#### Combined validation provides complete results

> **Invariant:** The FSM validator must return a combined result including status validity, transition validity, metadata warnings, and protection level in a single call.
>
> **Rationale:** Callers need a complete validation picture — requiring multiple separate calls risks partial validation and inconsistent error reporting.

**Verified by:**

- Valid completed pattern returns combined results

_fsm-validator.feature_

### Lint Engine

_The lint engine orchestrates rule execution, aggregates violations,_

---

#### Single directive linting validates annotations against rules

> **Invariant:** Every directive is checked against all provided rules and violations include source location.
>
> **Rationale:** Skipping rules or omitting source locations makes violations unactionable, as developers cannot locate or understand the issue.

**Verified by:**

- Return empty array when all rules pass
- Return violations for failing rules
- Run all provided rules
- Include correct file and line in violations

---

#### Multi-file batch linting aggregates results across files

> **Invariant:** All files and directives are scanned, violations are collected per file, and severity counts are accurate.
>
> **Rationale:** Missing files or inaccurate severity counts cause silent rule violations in CI and undermine trust in the linting pipeline.

**Verified by:**

- Return empty results for clean files
- Collect violations by file
- Count violations by severity
- Handle multiple directives per file

---

#### Failure detection respects strict mode for severity escalation

> **Invariant:** Errors always indicate failure. Warnings only indicate failure in strict mode. Info never indicates failure.
>
> **Rationale:** Without correct severity-to-exit-code mapping, CI pipelines either miss real errors or block on informational messages, eroding developer trust in the linter.

**Verified by:**

- Return true when there are errors
- Return false for warnings only in non-strict mode
- Return true for warnings in strict mode
- Return false for info only
- Return false when no violations

---

#### Violation sorting orders by severity then by line number

> **Invariant:** Sorted output places errors first, then warnings, then info, with stable line-number ordering within each severity. Sorting does not mutate the original array.
>
> **Rationale:** Unsorted output forces developers to manually scan for critical errors among lower-severity noise, and mutating the original array would break callers that hold a reference to it.

**Verified by:**

- Sort errors first then warnings then info
- Sort by line number within same severity
- Not mutate original array

---

#### Pretty formatting produces human-readable output with severity counts

> **Invariant:** Pretty output includes file paths, line numbers, severity labels, rule IDs, and summary counts. Quiet mode suppresses non-error violations.
>
> **Rationale:** Incomplete formatting (missing file paths or line numbers) prevents developers from navigating directly to violations, and noisy output in quiet mode defeats its purpose.

**Verified by:**

- Show success message when no violations
- Format violations with file line severity and message
- Show summary line with counts
- Filter out warnings and info in quiet mode

---

#### JSON formatting produces machine-readable output with full details

> **Invariant:** JSON output is valid, includes all summary fields, and preserves violation details including file, line, severity, rule, and message.
>
> **Rationale:** Machine consumers (CI pipelines, IDE integrations) depend on valid JSON with complete fields; missing or malformed output breaks automated tooling downstream.

**Verified by:**

- Return valid JSON
- Include all summary fields
- Include violation details

_lint-engine.feature_

### Linter Validation

_Tests for lint rules that validate relationship integrity, detect conflicts,_

---

#### Pattern cannot implement itself (circular reference)

> **Invariant:** A pattern's implements tag must reference a different pattern than its own pattern tag.
>
> **Rationale:** Self-implementing patterns create circular references that break the sub-pattern hierarchy.

**Verified by:**

- Pattern tag with implements tag causes error
- Implements without pattern tag is valid
- Implements without pattern tag is valid

  A file cannot define a pattern that implements itself. This creates a
  circular reference. Different patterns are allowed (sub-pattern hierarchy).

---

#### Relationship targets should exist (strict mode)

> **Invariant:** Every relationship target must reference a pattern that exists in the known pattern registry when strict mode is enabled.
>
> **Rationale:** Dangling references to non-existent patterns produce broken dependency graphs and misleading documentation.

**Verified by:**

- Uses referencing non-existent pattern warns
- Implements referencing non-existent pattern warns
- Valid relationship target passes
- Valid relationship target passes

  In strict mode

- all relationship targets are validated against known patterns.

---

#### Bidirectional traceability links should be consistent

> **Invariant:** Every forward traceability link (executable-specs, roadmap-spec) must have a corresponding back-link in the target file.
>
> **Rationale:** Asymmetric links mean one side of the traceability chain is invisible, defeating the purpose of bidirectional tracing.

**Verified by:**

- Missing back-link detected
- Orphan executable spec detected

---

#### Parent references must be valid

> **Invariant:** A pattern's parent reference must point to an existing epic pattern in the registry.
>
> **Rationale:** Dangling parent references break the epic-to-pattern hierarchy, causing patterns to appear orphaned in roadmap views and losing rollup visibility.

**Verified by:**

- Invalid parent reference detected
- Valid parent reference passes

_linter-validation.feature_

### Lint Rule Advanced

_Complex lint rule logic and collection-level behavior._

---

#### Descriptions must not repeat the pattern name

> **Invariant:** A description that merely echoes the pattern name adds no value and must be rejected.
>
> **Rationale:** Tautological descriptions waste reader attention and indicate missing documentation effort.

**Verified by:**

- Detect description that equals pattern name
- Detect description that is pattern name with punctuation
- Detect short description starting with pattern name
- Accept description with substantial content after name
- Accept meaningfully different description
- Ignore empty descriptions
- Ignore missing pattern name
- Skip headings when finding first line
- Skip "When to use" sections when finding first line

---

#### Default rules collection is complete and well-ordered

> **Invariant:** The default rules collection must contain all defined rules with unique IDs, ordered by severity (errors first).
>
> **Rationale:** A complete, ordered collection ensures no rule is silently dropped and severity-based filtering works correctly.

**Verified by:**

- Default rules contains all 8 rules
- Default rules have unique IDs
- Default rules are ordered by severity
- Default rules include all named rules

---

#### Rules can be filtered by minimum severity

> **Invariant:** Filtering by severity must return only rules at or above the specified level.
>
> **Rationale:** CI pipelines need to control which violations block merges vs. which are advisory.

**Verified by:**

- Filter returns all rules for info severity
- Filter excludes info rules for warning severity
- Filter returns only errors for error severity

_lint-rules-advanced.feature_

### Lint Rule Individual

_Individual lint rules that check parsed directives for completeness._

---

#### Files must declare an explicit pattern name

> **Invariant:** Every annotated file must have a non-empty patternName to be identifiable in the registry.
>
> **Rationale:** Without a pattern name, the file cannot be tracked, linked, or referenced in generated documentation.

**Verified by:**

- Detect missing pattern name
- Detect empty string pattern name
- Detect whitespace-only pattern name
- Accept valid pattern name
- Include file and line in violation

---

#### Files should declare a lifecycle status

> **Invariant:** Every annotated file should have a status tag to track its position in the delivery lifecycle.
>
> **Rationale:** Missing status prevents FSM validation and roadmap tracking.

**Verified by:**

- Detect missing status
- Accept completed status
- Accept active status
- Accept roadmap status
- Accept deferred status

---

#### Files should document when to use the pattern

> **Invariant:** Annotated files should include whenToUse guidance so consumers know when to apply the pattern.
>
> **Rationale:** Without usage guidance, patterns become undiscoverable despite being documented.

**Verified by:**

- Detect missing whenToUse
- Detect empty whenToUse array
- Accept whenToUse with content

---

#### Files should declare relationship tags

> **Invariant:** Annotated files should declare uses or usedBy relationships to enable dependency tracking and architecture diagrams.
>
> **Rationale:** Isolated patterns without relationships produce diagrams with no edges and prevent dependency analysis.

**Verified by:**

- Detect missing relationship tags
- Detect empty uses array
- Accept uses with content
- Accept usedBy with content
- Accept both uses and usedBy

_lint-rules-individual.feature_

### Process Guard

_- Completed specs modified without explicit unlock reason_

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

_process-guard.feature_

### Status Transition Detection

_Tests for the detectStatusTransitions function that parses git diff output._

---

#### Status transitions are detected from file-level tags

> **Invariant:** Status transitions must be detected by comparing @libar-docs-status tags at the file level between the old and new versions of a file.
>
> **Rationale:** File-level tags are the canonical source of pattern status — detecting transitions from tags ensures consistency with the FSM validator.

**Verified by:**

- New file with status tag is detected as transition from roadmap
- Modified file with status change is detected
- No transition when status unchanged

---

#### Status tags inside docstrings are ignored

> **Invariant:** Status tags appearing inside Gherkin docstring blocks (between triple-quote delimiters) must not be treated as real status declarations.
>
> **Rationale:** Docstrings often contain example code or documentation showing status tags — parsing these as real would cause phantom status transitions.

**Verified by:**

- Status tag inside docstring is not used for transition
- Multiple docstring status tags are all ignored
- Only docstring status tags results in no transition

---

#### First valid status tag outside docstrings is used

> **Invariant:** When multiple status tags appear outside docstrings, only the first one determines the file's status.
>
> **Rationale:** A single canonical status per file prevents ambiguity — using the first tag matches Gherkin convention where file-level tags appear at the top.

**Verified by:**

- First file-level tag wins over subsequent tags

---

#### Line numbers are tracked from hunk headers

> **Invariant:** Detected status transitions must include the line number where the status tag appears, derived from git diff hunk headers.
>
> **Rationale:** Line numbers enable precise error reporting — developers need to know exactly where in the file the transition was detected.

**Verified by:**

- Transition location includes correct line number

---

#### Generated documentation directories are excluded

> **Invariant:** Files in generated documentation directories (docs-generated/, docs-living/) must be excluded from status transition detection.
>
> **Rationale:** Generated files are projections of source files — detecting transitions in them would produce duplicate violations and false positives.

**Verified by:**

- Status in docs-generated directory is ignored
- Status in docs-living directory is ignored

_status-transition-detection.feature_

---

[← Back to Business Rules](../BUSINESS-RULES.md)
