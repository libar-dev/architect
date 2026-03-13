### DataAPI Overview

**How do I query process state?** The Data API provides direct terminal access to delivery process state. It replaces reading generated markdown or launching explore agents — targeted queries use 5-10x less context. The `context` command assembles curated bundles tailored to session type (planning, design, implement).

#### Key Invariants

- One-command context assembly: `context <pattern> --session <type>` returns metadata + file paths + dependency status + architecture position in ~1.5KB
- Session type tailoring: `planning` (~500B, brief + deps), `design` (~1.5KB, spec + stubs + deps), `implement` (deliverables + FSM + tests)
- Direct API queries replace doc reading: JSON output is 5-10x smaller than generated docs


#### Contents

- [Key Invariants](#key-invariants)
- [Shared Pipeline Factory Responsibilities](#shared-pipeline-factory-responsibilities)
- [8-Step Dataset Build Flow](#8-step-dataset-build-flow)
- [Consumer Architecture and PipelineOptions Differentiation](#consumer-architecture-and-pipelineoptions-differentiation)
- [API Types](#api-types)


#### Shared Pipeline Factory Responsibilities

**Invariant:** `buildMasterDataset()` is the shared factory for Steps 1-8 of the architecture pipeline and returns `Result<PipelineResult, PipelineError>` without process-level side effects.


#### 8-Step Dataset Build Flow


#### Consumer Architecture and PipelineOptions Differentiation


#### API Types

| Type | Kind |
| --- | --- |
| PipelineOptions | interface |
| PipelineResult | interface |
| MasterDatasetSchema | const |
| StatusGroupsSchema | const |
| StatusCountsSchema | const |
| PhaseGroupSchema | const |
| SourceViewsSchema | const |
| RelationshipEntrySchema | const |
| ArchIndexSchema | const |
