=== VALIDATION OVERVIEW ===

Purpose: Validation product area overview
Detail Level: Compact summary

**How is the workflow enforced?** FSM, DoD, anti-patterns, process guard, lint.


=== API TYPES ===

| Type | Kind |
| --- | --- |
| isDeliverableComplete | function |
| hasAcceptanceCriteria | function |
| extractAcceptanceCriteriaScenarios | function |
| validateDoDForPhase | function |
| validateDoD | function |
| formatDoDSummary | function |
| AntiPatternDetectionOptions | interface |
| detectAntiPatterns | function |
| detectProcessInCode | function |
| detectMagicComments | function |
| detectScenarioBloat | function |
| detectMegaFeature | function |
| formatAntiPatternReport | function |
| toValidationIssues | function |
| LintRule | interface |
| LintContext | interface |
| defaultRules | const |
| severityOrder | const |
| filterRulesBySeverity | function |
| missingPatternName | const |
| missingStatus | const |
| invalidStatus | const |
| missingWhenToUse | const |
| tautologicalDescription | const |
| missingRelationships | const |
| patternConflictInImplements | const |
| missingRelationshipTarget | const |
| VALID_TRANSITIONS | const |
| isValidTransition | function |
| getValidTransitionsFrom | function |
| getTransitionErrorMessage | function |
| PROTECTION_LEVELS | const |
| ProtectionLevel | type |
| getProtectionLevel | function |
| isTerminalState | function |
| isFullyEditable | function |
| isScopeLocked | function |
| validateChanges | function |


=== BEHAVIOR SPECIFICATIONS ===

--- StreamingGitDiff ---

| Rule | Description |
| --- | --- |
| Git commands stream output instead of buffering |  |
| Diff content is parsed as it streams |  |
| Streaming errors are handled gracefully |  |

--- StepLintVitestCucumber ---

| Rule | Description |
| --- | --- |
| Hash comments inside description pseudo-code-blocks are detected | **Invariant:** A # at the start of a line inside a """ block within a<br>    Feature or Rule description terminates the... |
| Duplicate And steps in the same scenario are detected | **Invariant:** Multiple And steps with identical text in the same<br>    scenario cause vitest-cucumber step matching... |
| Dollar sign in step text is detected | **Invariant:** The $ character in step text causes matching issues<br>    in vitest-cucumber's expression parser.... |
| Regex step patterns are detected | **Invariant:** vitest-cucumber only supports string patterns with<br>    {string} and {int}. Regex patterns throw... |
| Unsupported phrase type is detected | **Invariant:** vitest-cucumber does not support {phrase}. Use {string}<br>    with quoted values in the feature file.... |
| ScenarioOutline function params are detected | **Invariant:** ScenarioOutline step callbacks must use the variables<br>    object, not function params. Using (_ctx,... |
| Missing And destructuring is detected | **Invariant:** If a feature file has And steps, the step definition<br>    must destructure And from the scenario... |
| Missing Rule wrapper is detected | **Invariant:** If a feature file has Rule: blocks, the step definition<br>    must destructure Rule from... |
| Feature-to-step pairing resolves both loadFeature patterns | **Invariant:** Step files use two loadFeature patterns: simple string<br>    paths and resolve(__dirname, relative)... |

--- StepLintExtendedRules ---

| Rule | Description |
| --- | --- |
| Hash in step text is detected | **Invariant:** A hash character in the middle of a Gherkin step line<br>    can be interpreted as a comment by some... |
| Gherkin keywords in description text are detected | **Invariant:** A Feature or Rule description line that starts with<br>    Given, When, Then, And, or But breaks the... |
| Scenario Outline steps with quoted values are detected | **Invariant:** When a feature file has a Scenario Outline and its<br>    steps use quoted values instead of... |
| Repeated step patterns in the same scenario are detected | **Invariant:** Registering the same step pattern twice in one<br>    Scenario block causes vitest-cucumber to overwrite... |

--- StatusAwareEslintSuppression ---

| Rule | Description |
| --- | --- |
| File status determines unused-vars enforcement | **Invariant:** Files with `@libar-docs-status roadmap` or `deferred` have relaxed<br>    unused-vars rules. Files with... |
| Reuses deriveProcessState for status extraction | **Invariant:** Status extraction logic must be shared with Process Guard Linter.<br>    No duplicate parsing or... |
| ESLint Processor filters messages based on status | **Invariant:** The processor uses ESLint's postprocess hook to filter or downgrade<br>    messages. Source code is never... |
| CLI can generate static ESLint ignore list | **Invariant:** Running `pnpm lint:process --eslint-ignores` outputs a list of files<br>    that should have relaxed... |
| Replaces directory-based ESLint exclusions | **Invariant:** After implementation, the directory-based exclusions in eslint.config.js<br>    (lines 30-57) are... |
| Rule relaxation is configurable | **Invariant:** The set of rules relaxed for roadmap/deferred files is configurable,<br>    defaulting to... |

--- ReleaseAssociationRules ---

| Rule | Description |
| --- | --- |
| Spec files must not contain release columns |  |
| TypeScript phase files must have required annotations |  |
| Release version follows semantic versioning |  |

--- ProgressiveGovernance ---

--- ProcessGuardLinter ---

| Rule | Description |
| --- | --- |
| Protection levels determine modification restrictions | Files inherit protection from their `@libar-docs-status` tag. Higher<br>    protection levels require explicit unlock to... |
| Session definition files scope what can be modified | Optional session files (`delivery-process/sessions/*.feature`) explicitly<br>    declare which specs are in-scope for... |
| Status transitions follow PDR-005 FSM | When a file's status changes, the transition must be valid per PDR-005.<br>    This extends phase-state-machine.feature... |
| Active specs cannot add new deliverables | Once a spec transitions to `active`, its deliverables table is<br>    considered scope-locked. Adding new rows indicates... |
| CLI provides flexible validation modes |  |
| Integrates with existing lint infrastructure |  |
| New tags support process guard functionality | The following tags are defined in the TypeScript taxonomy to support process guard: |

--- PhaseStateMachineValidation ---

| Rule | Description |
| --- | --- |
| Valid status values are enforced |  |
| Status transitions follow state machine rules |  |
| Terminal states require completion metadata |  |

--- PhaseNumberingConventions ---

| Rule | Description |
| --- | --- |
| Phase numbers must be unique within a release |  |
| Phase number gaps are detected |  |
| CLI suggests next available phase number |  |

--- DoDValidation ---

--- StatusTransitionDetectionTesting ---

| Rule | Description |
| --- | --- |
| Status transitions are detected from file-level tags |  |
| Status tags inside docstrings are ignored |  |
| First valid status tag outside docstrings is used |  |
| Line numbers are tracked from hunk headers |  |
| Generated documentation directories are excluded |  |

--- ProcessGuardTesting ---

| Rule | Description |
| --- | --- |
| Completed files require unlock-reason to modify |  |
| Status transitions must follow PDR-005 FSM |  |
| Active specs cannot add new deliverables |  |
| Files outside active session scope trigger warnings |  |
| Explicitly excluded files trigger errors |  |
| Multiple rules validate independently |  |

--- FSMValidatorTesting ---

| Rule | Description |
| --- | --- |
| Status values must be valid PDR-005 FSM states |  |
| Status transitions must follow FSM rules |  |
| Completed patterns should have proper metadata |  |
| Protection levels match FSM state definitions |  |
| Combined validation provides complete results |  |

--- DoDValidatorTesting ---

| Rule | Description |
| --- | --- |
| Deliverable completion uses canonical status taxonomy |  |
| Acceptance criteria must be tagged with @acceptance-criteria |  |
| Acceptance criteria scenarios can be extracted by name |  |
| DoD requires all deliverables complete and AC present |  |
| DoD can be validated across multiple completed phases |  |
| Summary can be formatted for console output |  |

--- DetectChangesTesting ---

| Rule | Description |
| --- | --- |
| Status changes are detected as modifications not additions |  |
| New deliverables are detected as additions |  |
| Removed deliverables are detected as removals |  |
| Mixed changes are correctly categorized |  |
| Non-deliverable tables are ignored |  |

--- ConfigSchemaValidation ---

--- AntiPatternDetectorTesting ---

| Rule | Description |
| --- | --- |
| Process metadata should not appear in TypeScript code |  |
| Generator hints should not appear in feature files |  |
| Feature files should not have excessive scenarios |  |
| Feature files should not exceed size thresholds |  |
| All anti-patterns can be detected in one pass |  |
| Violations can be formatted for console output |  |

--- LintRulesTesting ---

--- LintEngineTesting ---

--- LinterValidationTesting ---

| Rule | Description |
| --- | --- |
| Pattern cannot implement itself (circular reference) | A file cannot define a pattern that implements itself. This creates a<br>    circular reference. Different patterns are... |
| Relationship targets should exist (strict mode) | In strict mode, all relationship targets are validated against known patterns. |
| Bidirectional traceability links should be consistent |  |
| Parent references must be valid |  |
