### Architecture Types Reference

#### Orchestrator Pipeline Responsibilities

**Invariant:** The orchestrator is the integration boundary for full docs generation: it delegates dataset construction to the shared pipeline, then executes codecs and writes files.


#### Steps 1-8 via buildMasterDataset()


#### Steps 9-10: Codec Execution and File Writing


#### Shared Pipeline Factory Responsibilities

**Invariant:** `buildMasterDataset()` is the shared factory for Steps 1-8 of the architecture pipeline and returns `Result<PipelineResult, PipelineError>` without process-level side effects.


#### 8-Step Dataset Build Flow


#### Consumer Architecture and PipelineOptions Differentiation


#### API Types

| Type | Kind |
| --- | --- |
| MasterDatasetSchema | const |
| StatusGroupsSchema | const |
| StatusCountsSchema | const |
| PhaseGroupSchema | const |
| SourceViewsSchema | const |
| RelationshipEntrySchema | const |
| RuntimeMasterDataset | interface |
| RawDataset | interface |
| PipelineOptions | interface |
| PipelineResult | interface |
