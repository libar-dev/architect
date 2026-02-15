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

--- SessionFileLifecycle ---
