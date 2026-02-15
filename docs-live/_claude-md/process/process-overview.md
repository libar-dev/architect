=== PROCESS OVERVIEW ===

Purpose: Process product area overview
Detail Level: Compact summary

**How does the session workflow work?** Process defines the session workflow and canonical taxonomy. Git is the event store; documentation artifacts are projections; feature files are the single source of truth. TypeScript source owns pattern identity (ADR-003), while Tier 1 specs are ephemeral planning documents that lose value after completion.

=== KEY INVARIANTS ===

- TypeScript source owns pattern identity: `@libar-docs-pattern` in TypeScript defines the pattern. Tier 1 specs are ephemeral working documents
- 7 canonical product-area values: Annotation, Configuration, Generation, Validation, DataAPI, CoreTypes, Process — reader-facing sections, not source modules
- Two distinct status domains: Pattern FSM status (4 values) vs. deliverable status (6 values). Never cross domains

=== BEHAVIOR SPECIFICATIONS ===

--- SessionHandoffs ---

| Rule                                                          | Description                                                                                                             |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Handoff context generation captures session state             | **Invariant:** Active phases with handoff context enabled must include session handoff sections with template and...    |
| Handoff templates and checklists contain required sections    | **Invariant:** Session handoff template and retrospective checklist must exist and contain all required sections for... |
| PROCESS_SETUP.md documents handoff and coordination protocols | **Invariant:** PROCESS_SETUP.md must document both session handoff protocol and multi-developer coordination...         |
| Edge cases and acceptance criteria ensure robustness          | **Invariant:** Handoff context must degrade gracefully when no discoveries exist and must be disableable. Mid-phase...  |

--- SessionFileLifecycle ---
