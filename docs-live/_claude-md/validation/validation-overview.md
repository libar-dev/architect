=== VALIDATION OVERVIEW ===

Purpose: Validation product area overview
Detail Level: Compact summary

**How is the workflow enforced?** Validation enforces delivery workflow rules at commit time using a Decider pattern. Process Guard derives state from annotations (no separate state store), validates proposed changes against FSM rules, and blocks invalid transitions. Protection levels escalate with status: roadmap allows free editing, active locks scope, completed requires explicit unlock.

=== KEY INVARIANTS ===

- Protection levels: `roadmap`/`deferred` = none (fully editable), `active` = scope-locked (no new deliverables), `completed` = hard-locked (requires `@libar-docs-unlock-reason`)
- Valid FSM transitions: Only roadmap→active, roadmap→deferred, active→completed, active→roadmap, deferred→roadmap. Completed is terminal
- Decider pattern: All validation is (state, changes, options) → result. State is derived from annotations, not maintained separately

=== API TYPES ===

| Type                               | Kind      |
| ---------------------------------- | --------- |
| AntiPatternDetectionOptions        | interface |
| LintRule                           | interface |
| LintContext                        | interface |
| ProtectionLevel                    | type      |
| isDeliverableComplete              | function  |
| hasAcceptanceCriteria              | function  |
| extractAcceptanceCriteriaScenarios | function  |
| validateDoDForPhase                | function  |
| validateDoD                        | function  |
| formatDoDSummary                   | function  |
| detectAntiPatterns                 | function  |
| detectProcessInCode                | function  |
| detectMagicComments                | function  |
| detectScenarioBloat                | function  |
| detectMegaFeature                  | function  |
| formatAntiPatternReport            | function  |
| toValidationIssues                 | function  |
| filterRulesBySeverity              | function  |
| isValidTransition                  | function  |
| getValidTransitionsFrom            | function  |

=== BEHAVIOR SPECIFICATIONS ===

--- StatusTransitionDetectionTesting ---

| Rule                                                 | Description                                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Status transitions are detected from file-level tags | **Invariant:** Status transitions must be detected by comparing @libar-docs-status tags at the file level between the... |
| Status tags inside docstrings are ignored            | **Invariant:** Status tags appearing inside Gherkin docstring blocks (between triple-quote delimiters) must not be...    |
| First valid status tag outside docstrings is used    | **Invariant:** When multiple status tags appear outside docstrings, only the first one determines the file's status....  |
| Line numbers are tracked from hunk headers           | **Invariant:** Detected status transitions must include the line number where the status tag appears, derived from...    |
| Generated documentation directories are excluded     | **Invariant:** Files in generated documentation directories (docs-generated/, docs-living/) must be excluded from...     |

--- ProcessGuardTesting ---

| Rule                                                | Description                                                                                                            |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Completed files require unlock-reason to modify     | **Invariant:** A completed spec file cannot be modified unless it carries an @libar-docs-unlock-reason tag....         |
| Status transitions must follow PDR-005 FSM          | **Invariant:** Status changes must follow the directed graph: roadmap->active->completed, roadmap<->deferred,...       |
| Active specs cannot add new deliverables            | **Invariant:** A spec in active status cannot have deliverables added that were not present when it entered active.... |
| Files outside active session scope trigger warnings | **Invariant:** Files modified outside the active session's declared scope produce a session-scope warning....          |
| Explicitly excluded files trigger errors            | **Invariant:** Files explicitly excluded from a session cannot be modified, producing a session-excluded error....     |
| Multiple rules validate independently               | **Invariant:** Each validation rule evaluates independently — a single file can produce violations from multiple...    |

--- FSMValidatorTesting ---

| Rule                                           | Description                                                                                                             |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Status values must be valid PDR-005 FSM states | **Invariant:** Every pattern status value must be one of the states defined in the PDR-005 finite state machine...      |
| Status transitions must follow FSM rules       | **Invariant:** Every status change must follow a valid edge in the PDR-005 state machine graph — no skipping states...  |
| Completed patterns should have proper metadata | **Invariant:** Patterns in completed status must carry completion date and actual effort metadata to pass validation... |
| Protection levels match FSM state definitions  | **Invariant:** Each FSM state must map to exactly one protection level (none, scope-locked, or hard-locked) as...       |
| Combined validation provides complete results  | **Invariant:** The FSM validator must return a combined result including status validity, transition validity,...       |

--- DoDValidatorTesting ---

| Rule                                                         | Description                                                                                                            |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Deliverable completion uses canonical status taxonomy        | **Invariant:** Deliverable completion status must be determined exclusively using the 6 canonical values from the...   |
| Acceptance criteria must be tagged with @acceptance-criteria | **Invariant:** Every completed pattern must have at least one scenario tagged with @acceptance-criteria in its...      |
| Acceptance criteria scenarios can be extracted by name       | **Invariant:** The validator must be able to extract scenario names from @acceptance-criteria-tagged scenarios for...  |
| DoD requires all deliverables complete and AC present        | **Invariant:** A pattern passes Definition of Done only when ALL deliverables have complete status AND at least one... |
| DoD can be validated across multiple completed phases        | **Invariant:** DoD validation must evaluate all completed phases independently and report per-phase pass/fail...       |
| Summary can be formatted for console output                  | **Invariant:** DoD validation results must be renderable as structured console output showing phase-level pass/fail... |

--- DetectChangesTesting ---

| Rule                                                       | Description                                                                                                              |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Status changes are detected as modifications not additions | **Invariant:** When a deliverable's status value changes between versions, the change detector must classify it as a...  |
| New deliverables are detected as additions                 | **Invariant:** Deliverables present in the new version but absent in the old version must be classified as...            |
| Removed deliverables are detected as removals              | **Invariant:** Deliverables present in the old version but absent in the new version must be classified as removals....  |
| Mixed changes are correctly categorized                    | **Invariant:** When a single diff contains additions, removals, and modifications simultaneously, each change must be... |
| Non-deliverable tables are ignored                         | **Invariant:** Changes to non-deliverable tables (e.g., ScenarioOutline Examples tables) must not be detected as...      |

--- ConfigSchemaValidation ---

| Rule                                                    | Description                                                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| ScannerConfigSchema validates scanner configuration     | **Invariant:** Scanner configuration must contain at least one valid glob pattern with no parent directory traversal,... |
| GeneratorConfigSchema validates generator configuration | **Invariant:** Generator configuration must use a .json registry file and an output directory that does not escape...    |
| isScannerConfig type guard narrows unknown values       | **Invariant:** isScannerConfig returns true only for objects that have a non-empty patterns array and a string...        |
| isGeneratorConfig type guard narrows unknown values     | **Invariant:** isGeneratorConfig returns true only for objects that have a string outputDir and a .json...               |

--- AntiPatternDetectorTesting ---

| Rule                                                  | Description                                                                                                          |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Process metadata should not appear in TypeScript code | **Invariant:** Process metadata tags (@libar-docs-status, @libar-docs-phase, etc.) must only appear in Gherkin...    |
| Generator hints should not appear in feature files    | **Invariant:** Feature files must not contain generator magic comments beyond a configurable threshold....           |
| Feature files should not have excessive scenarios     | **Invariant:** A single feature file must not exceed the configured maximum scenario count.<br> **Rationale:**...    |
| Feature files should not exceed size thresholds       | **Invariant:** A single feature file must not exceed the configured maximum line count.<br> **Rationale:**...        |
| All anti-patterns can be detected in one pass         | **Invariant:** The anti-pattern detector must evaluate all registered rules in a single scan pass over the source... |
| Violations can be formatted for console output        | **Invariant:** Anti-pattern violations must be renderable as grouped, human-readable console output....              |

--- LintRulesTesting ---

--- LintEngineTesting ---

--- LinterValidationTesting ---

| Rule                                                  | Description                                                                                                             |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Pattern cannot implement itself (circular reference)  | **Invariant:** A pattern's implements tag must reference a different pattern than its own pattern tag....               |
| Relationship targets should exist (strict mode)       | **Invariant:** Every relationship target must reference a pattern that exists in the known pattern registry when...     |
| Bidirectional traceability links should be consistent | **Invariant:** Every forward traceability link (executable-specs, roadmap-spec) must have a corresponding back-link...  |
| Parent references must be valid                       | **Invariant:** A pattern's parent reference must point to an existing epic pattern in the registry.<br> \*\*Verified... |
