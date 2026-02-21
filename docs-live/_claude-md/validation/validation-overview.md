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
