# Current Work

**Purpose:** Active development work currently in progress
**Detail Level:** Phase summaries with links to details

---

## Summary

**Overall Progress:** [████████████░░░░░░░░] 104/175 (59%)

| Metric | Value |
| --- | --- |
| Total Patterns | 175 |
| Completed | 104 |
| Active | 34 |
| Planned | 37 |
| Active Phases | 2 |

---

## Active Phases

### 🚧 ProcessStateAPIRelationshipQueries

[████████░░░░░░░] 1/2 50% complete (1 done, 1 active)

| Pattern | Description |
| --- | --- |
| 🚧 Process State API Relationship Queries | Problem: ProcessStateAPI currently supports dependency queries (`uses`, `usedBy`, `dependsOn`, `enables`) but lacks... |

#### Deliverables

- 🔄 Implementation relationship queries
- 🔄 Inheritance hierarchy queries
- ✅ ProcessStateAPI type extensions
- 🔄 Relationship query step definitions

[View ProcessStateAPIRelationshipQueries details →](current/phase-24-process-state-api-relationship-queries.md)

---

### 🚧 SourceMapper

[████████████░░░] 4/5 80% complete (4 done, 1 active)

| Pattern | Description |
| --- | --- |
| 🚧 File Cache | Simple Map-based cache for file contents during a single generation run. |

[View SourceMapper details →](current/phase-27-source-mapper.md)

---

## All Active Patterns

| Pattern | Phase | Effort | Description |
| --- | --- | --- | --- |
| 🚧 Process State API Relationship Queries | Phase 24 | 3d | Problem: ProcessStateAPI currently supports dependency queries (`uses`, `usedBy`, `dependsOn`, `enables`) but lacks... |
| 🚧 File Cache | Phase 27 | - | Simple Map-based cache for file contents during a single generation run. |
| 🚧 API Module | - | - | Central export for the Process State API, providing a TypeScript interface for querying delivery process state. |
| 🚧 Arch Queries Impl | - | - | Pure functions over MasterDataset for deep architecture exploration. |
| 🚧 Composite Codec | - | - | Assembles reference documents from multiple codec outputs by concatenating RenderableDocument sections. |
| 🚧 Config Resolver | - | - | Resolves a raw `DeliveryProcessProjectConfig` into a fully-resolved `ResolvedConfig` with all defaults applied, stubs... |
| 🚧 Context Assembler Impl | - | - | Pure function composition over MasterDataset. |
| 🚧 Context Formatter Impl | - | - | First plain-text formatter in the codebase. |
| 🚧 Coverage Analyzer Impl | - | - | Reports annotation completeness by comparing scannable files (from glob) against annotated patterns in MasterDataset. |
| 🚧 Define Config | - | - | Identity function for type-safe project configuration. |
| 🚧 Deliverable Status Taxonomy | - | - | Canonical status values for deliverables in Gherkin Background tables. |
| 🚧 Derive Process State | - | - | :GherkinScanner,FSMValidator Derives process state from @libar-docs-* annotations in files. |
| 🚧 Detect Changes | - | - | Detects changes from git diff including: - Modified, added, deleted files - Status transitions (@libar-docs-status... |
| 🚧 FSM Module | - | - | :PDR005MvpWorkflow Central export for the 4-state FSM defined in PDR-005: ``` roadmap ──→ active ──→ completed │     ... |
| 🚧 FSM States | - | - | :PDR005MvpWorkflow Defines the 4-state FSM from PDR-005 MVP Workflow: - roadmap: Planned work (fully editable) -... |
| 🚧 FSM Transitions | - | - | :PDR005MvpWorkflow Defines valid transitions between FSM states per PDR-005: ``` roadmap ──→ active ──→ completed │  ... |
| 🚧 FSM Validator | - | - | :PDR005MvpWorkflow Pure validation functions following the Decider pattern: - No I/O, no side effects - Return... |
| 🚧 Fuzzy Matcher Impl | - | - | Provides fuzzy matching for pattern names with tiered scoring: exact (1.0) > prefix (0.9) > substring (0.7) >... |
| 🚧 Lint Process CLI | - | - | Validates git changes against delivery process rules. |
| 🚧 Output Pipeline Impl | - | - | Post-processing pipeline that transforms raw API results into shaped CLI output. |
| 🚧 Pattern Helpers | - | - | Common helper functions used by context-assembler, arch-queries, and other API modules that need pattern name... |
| 🚧 Pattern Summarizer Impl | - | - | Projects the full ExtractedPattern (~3.5KB per pattern) down to a PatternSummary (~100 bytes) for list queries. |
| 🚧 Process API CLI Impl | - | - | Exposes ProcessStateAPI methods as CLI subcommands with JSON output. |
| 🚧 Process Guard Decider | - | - | :FSMValidator,DeriveProcessState,DetectChanges Pure function that validates changes against process rules. |
| 🚧 Process Guard Module | - | - | :FSMValidator,DeriveProcessState,DetectChanges,ProcessGuardDecider Enforces delivery process rules by validating... |
| 🚧 Process Guard Types | - | - | :FSMValidator Defines types for the process guard linter including: - Process state derived from file annotations -... |
| 🚧 Process State API | - | - | TypeScript interface for querying delivery process state. |
| 🚧 Process State Types | - | - | :MasterDataset Type definitions for the ProcessStateAPI query interface. |
| 🚧 Project Config Schema | - | - | Zod validation schema for `DeliveryProcessProjectConfig`. |
| 🚧 Project Config Types | - | - | Unified project configuration for the delivery-process package. |
| 🚧 Reference Document Codec | - | - | A single codec factory that creates reference document codecs from configuration objects. |
| 🚧 Reference Generator Registration | - | - | Registers all reference document generators. |
| 🚧 Source Merger | - | - | Computes effective sources for a specific generator by applying per-generator overrides to the base resolved sources. |
| 🚧 Stub Resolver Impl | - | - | Identifies design session stubs in the MasterDataset and resolves them against the filesystem to determine... |

---
