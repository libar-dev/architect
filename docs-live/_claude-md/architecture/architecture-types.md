### Architecture Types Reference

#### API Types

| Type                    | Kind      |
| ----------------------- | --------- |
| PatternGraphSchema      | const     |
| StatusGroupsSchema      | const     |
| StatusCountsSchema      | const     |
| PhaseGroupSchema        | const     |
| SourceViewsSchema       | const     |
| RelationshipEntrySchema | const     |
| RuntimePatternGraph     | interface |
| RawDataset              | interface |
| PipelineOptions         | interface |
| PipelineResult          | interface |

#### Orchestrator Pipeline Responsibilities

**Invariant:** The orchestrator is the integration boundary for full docs generation: it delegates dataset construction to the shared pipeline, then executes codecs and writes files.

#### Steps 1-8 via buildPatternGraph()

#### Steps 9-10: Codec Execution and File Writing

#### Shared Pipeline Factory Responsibilities

**Invariant:** `buildPatternGraph()` is the shared factory for Steps 1-8 of the architecture pipeline and returns `Result<PipelineResult, PipelineError>` without process-level side effects.

#### 8-Step Dataset Build Flow

#### Consumer Architecture and PipelineOptions Differentiation
