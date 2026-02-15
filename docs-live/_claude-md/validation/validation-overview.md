=== VALIDATION OVERVIEW ===

Purpose: Validation product area overview
Detail Level: Compact summary

**How is the workflow enforced?** Validation is the enforcement boundary — it ensures that every change to annotated source files respects the delivery lifecycle rules defined by the FSM, protection levels, and scope constraints. The system operates in three layers: the FSM validator checks status transitions against a 4-state directed graph, the Process Guard orchestrates commit-time validation using a Decider pattern (state derived from annotations, not stored separately), and the lint engine provides pluggable rule execution with pretty and JSON output. Anti-pattern detection enforces dual-source ownership boundaries — `@libar-docs-uses` belongs on TypeScript, `@libar-docs-depends-on` belongs on Gherkin — preventing cross-domain tag confusion that causes documentation drift. Definition of Done validation ensures completed patterns have all deliverables marked done and at least one acceptance-criteria scenario.

=== KEY INVARIANTS ===

- Protection levels: `roadmap`/`deferred` = none (fully editable), `active` = scope-locked (no new deliverables), `completed` = hard-locked (requires `@libar-docs-unlock-reason`)
- Valid FSM transitions: Only roadmap→active, roadmap→deferred, active→completed, active→roadmap, deferred→roadmap. Completed is terminal
- Decider pattern: All validation is (state, changes, options) → result. State is derived from annotations, not maintained separately
- Dual-source ownership: Anti-pattern detection enforces tag boundaries — `uses` on TypeScript (runtime deps), `depends-on`/`quarter`/`team` on Gherkin (planning metadata). Violations are flagged before they cause documentation drift

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

--- StreamingGitDiff ---

| Rule                                            | Description |
| ----------------------------------------------- | ----------- |
| Git commands stream output instead of buffering |             |
| Diff content is parsed as it streams            |             |
| Streaming errors are handled gracefully         |             |

--- StepLintVitestCucumber ---

| Rule                                                             | Description                                                                                                             |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Hash comments inside description pseudo-code-blocks are detected | **Invariant:** A # at the start of a line inside a """ block within a<br> Feature or Rule description terminates the... |
| Duplicate And steps in the same scenario are detected            | **Invariant:** Multiple And steps with identical text in the same<br> scenario cause vitest-cucumber step matching...   |
| Dollar sign in step text is detected                             | **Invariant:** The $ character in step text causes matching issues<br> in vitest-cucumber's expression parser....       |
| Regex step patterns are detected                                 | **Invariant:** vitest-cucumber only supports string patterns with<br> {string} and {int}. Regex patterns throw...       |
| Unsupported phrase type is detected                              | **Invariant:** vitest-cucumber does not support {phrase}. Use {string}<br> with quoted values in the feature file....   |
| ScenarioOutline function params are detected                     | **Invariant:** ScenarioOutline step callbacks must use the variables<br> object, not function params. Using (\_ctx,...  |
| Missing And destructuring is detected                            | **Invariant:** If a feature file has And steps, the step definition<br> must destructure And from the scenario...       |
| Missing Rule wrapper is detected                                 | **Invariant:** If a feature file has Rule: blocks, the step definition<br> must destructure Rule from...                |
| Feature-to-step pairing resolves both loadFeature patterns       | **Invariant:** Step files use two loadFeature patterns: simple string<br> paths and resolve(\_\_dirname, relative)...   |

--- StepLintExtendedRules ---

| Rule                                                     | Description                                                                                                             |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Hash in step text is detected                            | **Invariant:** A hash character in the middle of a Gherkin step line<br> can be interpreted as a comment by some...     |
| Gherkin keywords in description text are detected        | **Invariant:** A Feature or Rule description line that starts with<br> Given, When, Then, And, or But breaks the...     |
| Scenario Outline steps with quoted values are detected   | **Invariant:** When a feature file has a Scenario Outline and its<br> steps use quoted values instead of...             |
| Repeated step patterns in the same scenario are detected | **Invariant:** Registering the same step pattern twice in one<br> Scenario block causes vitest-cucumber to overwrite... |

--- StatusAwareEslintSuppression ---

| Rule                                              | Description                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| File status determines unused-vars enforcement    | **Invariant:** Files with `@libar-docs-status roadmap` or `deferred` have relaxed<br> unused-vars rules. Files with...   |
| Reuses deriveProcessState for status extraction   | **Invariant:** Status extraction logic must be shared with Process Guard Linter.<br> No duplicate parsing or...          |
| ESLint Processor filters messages based on status | **Invariant:** The processor uses ESLint's postprocess hook to filter or downgrade<br> messages. Source code is never... |
| CLI can generate static ESLint ignore list        | **Invariant:** Running `pnpm lint:process --eslint-ignores` outputs a list of files<br> that should have relaxed...      |
| Replaces directory-based ESLint exclusions        | **Invariant:** After implementation, the directory-based exclusions in eslint.config.js<br> (lines 30-57) are...         |
| Rule relaxation is configurable                   | **Invariant:** The set of rules relaxed for roadmap/deferred files is configurable,<br> defaulting to...                 |

--- ReleaseAssociationRules ---

| Rule                                                  | Description |
| ----------------------------------------------------- | ----------- |
| Spec files must not contain release columns           |             |
| TypeScript phase files must have required annotations |             |
| Release version follows semantic versioning           |             |

--- ProgressiveGovernance ---

--- ProcessGuardLinter ---

| Rule                                                  | Description                                                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Protection levels determine modification restrictions | Files inherit protection from their `@libar-docs-status` tag. Higher<br> protection levels require explicit unlock to... |
| Session definition files scope what can be modified   | Optional session files (`delivery-process/sessions/*.feature`) explicitly<br> declare which specs are in-scope for...    |
| Status transitions follow PDR-005 FSM                 | Status changes in a file must follow a valid transition per PDR-005.<br> This extends phase-state-machine.feature to...  |
| Active specs cannot add new deliverables              | Once a spec transitions to `active`, its deliverables table is<br> considered scope-locked. Adding new rows indicates... |
| CLI provides flexible validation modes                |                                                                                                                          |
| Integrates with existing lint infrastructure          |                                                                                                                          |
| New tags support process guard functionality          | The following tags are defined in the TypeScript taxonomy to support process guard:                                      |

--- PhaseStateMachineValidation ---

| Rule                                          | Description |
| --------------------------------------------- | ----------- |
| Valid status values are enforced              |             |
| Status transitions follow state machine rules |             |
| Terminal states require completion metadata   |             |

--- PhaseNumberingConventions ---

| Rule                                          | Description |
| --------------------------------------------- | ----------- |
| Phase numbers must be unique within a release |             |
| Phase number gaps are detected                |             |
| CLI suggests next available phase number      |             |

--- DoDValidation ---

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

| Rule                                                  | Description                                                                                                           |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Files must declare an explicit pattern name           | **Invariant:** Every annotated file must have a non-empty patternName to be identifiable in the registry....          |
| Files should declare a lifecycle status               | **Invariant:** Every annotated file should have a status tag to track its position in the delivery lifecycle....      |
| Files should document when to use the pattern         | **Invariant:** Annotated files should include whenToUse guidance so consumers know when to apply the pattern....      |
| Descriptions must not repeat the pattern name         | **Invariant:** A description that merely echoes the pattern name adds no value and must be rejected....               |
| Files should declare relationship tags                | **Invariant:** Annotated files should declare uses or usedBy relationships to enable dependency tracking and...       |
| Default rules collection is complete and well-ordered | **Invariant:** The default rules collection must contain all defined rules with unique IDs, ordered by severity...    |
| Rules can be filtered by minimum severity             | **Invariant:** Filtering by severity must return only rules at or above the specified level.<br> **Rationale:** CI... |

--- LintEngineTesting ---

| Rule                                                                  | Description                                                                                                             |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Single directive linting validates annotations against rules          | **Invariant:** Every directive is checked against all provided rules and violations include source location....         |
| Multi-file batch linting aggregates results across files              | **Invariant:** All files and directives are scanned, violations are collected per file, and severity counts are...      |
| Failure detection respects strict mode for severity escalation        | **Invariant:** Errors always indicate failure. Warnings only indicate failure in strict mode. Info never indicates...   |
| Violation sorting orders by severity then by line number              | **Invariant:** Sorted output places errors first, then warnings, then info, with stable line-number ordering within...  |
| Pretty formatting produces human-readable output with severity counts | **Invariant:** Pretty output includes file paths, line numbers, severity labels, rule IDs, and summary counts. Quiet... |
| JSON formatting produces machine-readable output with full details    | **Invariant:** JSON output is valid, includes all summary fields, and preserves violation details including file,...    |

--- LinterValidationTesting ---

| Rule                                                  | Description                                                                                                             |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Pattern cannot implement itself (circular reference)  | **Invariant:** A pattern's implements tag must reference a different pattern than its own pattern tag....               |
| Relationship targets should exist (strict mode)       | **Invariant:** Every relationship target must reference a pattern that exists in the known pattern registry when...     |
| Bidirectional traceability links should be consistent | **Invariant:** Every forward traceability link (executable-specs, roadmap-spec) must have a corresponding back-link...  |
| Parent references must be valid                       | **Invariant:** A pattern's parent reference must point to an existing epic pattern in the registry.<br> \*\*Verified... |
