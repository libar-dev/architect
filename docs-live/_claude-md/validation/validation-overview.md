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

| Rule                                                 | Description |
| ---------------------------------------------------- | ----------- |
| Status transitions are detected from file-level tags |             |
| Status tags inside docstrings are ignored            |             |
| First valid status tag outside docstrings is used    |             |
| Line numbers are tracked from hunk headers           |             |
| Generated documentation directories are excluded     |             |

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

| Rule                                           | Description |
| ---------------------------------------------- | ----------- |
| Status values must be valid PDR-005 FSM states |             |
| Status transitions must follow FSM rules       |             |
| Completed patterns should have proper metadata |             |
| Protection levels match FSM state definitions  |             |
| Combined validation provides complete results  |             |

--- DoDValidatorTesting ---

| Rule                                                         | Description |
| ------------------------------------------------------------ | ----------- |
| Deliverable completion uses canonical status taxonomy        |             |
| Acceptance criteria must be tagged with @acceptance-criteria |             |
| Acceptance criteria scenarios can be extracted by name       |             |
| DoD requires all deliverables complete and AC present        |             |
| DoD can be validated across multiple completed phases        |             |
| Summary can be formatted for console output                  |             |

--- DetectChangesTesting ---

| Rule                                                       | Description |
| ---------------------------------------------------------- | ----------- |
| Status changes are detected as modifications not additions |             |
| New deliverables are detected as additions                 |             |
| Removed deliverables are detected as removals              |             |
| Mixed changes are correctly categorized                    |             |
| Non-deliverable tables are ignored                         |             |

--- ConfigSchemaValidation ---

--- AntiPatternDetectorTesting ---

| Rule                                                  | Description |
| ----------------------------------------------------- | ----------- |
| Process metadata should not appear in TypeScript code |             |
| Generator hints should not appear in feature files    |             |
| Feature files should not have excessive scenarios     |             |
| Feature files should not exceed size thresholds       |             |
| All anti-patterns can be detected in one pass         |             |
| Violations can be formatted for console output        |             |

--- LintRulesTesting ---

--- LintEngineTesting ---

--- LinterValidationTesting ---

| Rule                                                  | Description                                                                                                             |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Pattern cannot implement itself (circular reference)  | A file cannot define a pattern that implements itself. This creates a<br> circular reference. Different patterns are... |
| Relationship targets should exist (strict mode)       | In strict mode, all relationship targets are validated against known patterns.                                          |
| Bidirectional traceability links should be consistent |                                                                                                                         |
| Parent references must be valid                       |                                                                                                                         |
