### Four-Stage Pipeline

```
CONFIG → SCANNER → EXTRACTOR → TRANSFORMER → CODEC
         (files)   (patterns)   (MasterDataset)  (Markdown)
```

1. **Scanner** (`src/scanner/`): File discovery, AST parsing, opt-in detection via `@architect` marker
2. **Extractor** (`src/extractor/`): Pattern extraction from TypeScript JSDoc and Gherkin tags
3. **Transformer** (`src/generators/pipeline/`): Builds MasterDataset with pre-computed views
4. **Codec** (`src/renderable/`): Zod 4 codecs transform MasterDataset → RenderableDocument → Markdown

### Key Design Patterns

- **Result Monad**: Explicit error handling via `Result<T, E>` in `src/types/result.ts` - functions return `Result.ok(value)` or `Result.error(err)` instead of throwing
- **Schema-First**: Zod schemas in `src/validation-schemas/` define types with runtime validation
- **Registry Pattern**: Tag registry (`src/taxonomy/`) defines categories, status values, and tag formats
- **Codec-Based Rendering**: Generators in `src/generators/` use codecs to transform data to markdown
- **Pipeline Factory**: Shared `buildMasterDataset()` in `src/generators/pipeline/build-pipeline.ts` — all consumers (orchestrator, process-api, validate-patterns) call this instead of wiring inline pipelines. Per-consumer behavior via `PipelineOptions`.
- **Single Read Model** (ADR-006): MasterDataset is the sole read model. No consumer re-derives data from raw scanner/extractor output. Anti-patterns: Parallel Pipeline, Lossy Local Type, Re-derived Relationship.

**Live module inventory:** `pnpm architect:query -- arch context` and `pnpm architect:query -- arch layer`

### Decision Specs

Architecture and process decisions are recorded as annotated Gherkin specs in `architect/decisions/`:

| Spec    | Key Decision                                                               |
| ------- | -------------------------------------------------------------------------- |
| ADR-001 | Taxonomy canonical values — tag registry is the single source of truth     |
| ADR-002 | Gherkin-only testing — no `.test.ts` files, all tests are `.feature`       |
| ADR-003 | Source-first pattern architecture — code drives docs, not the reverse      |
| ADR-005 | Codec-based markdown rendering — Zod codecs transform data to markdown     |
| ADR-006 | Single read model — MasterDataset is the sole read model for all consumers |
| PDR-001 | Session workflow commands — Process Data API CLI design decisions          |

Query decisions: `pnpm architect:query -- decisions <pattern>`
