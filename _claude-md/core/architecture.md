### Four-Stage Pipeline

```
CONFIG → SCANNER → EXTRACTOR → TRANSFORMER → CODEC
         (files)   (patterns)   (MasterDataset)  (Markdown)
```

1. **Scanner** (`src/scanner/`): File discovery, AST parsing, opt-in detection via `@libar-docs` marker
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

### Module Structure

| Module                     | Purpose                                                              |
| -------------------------- | -------------------------------------------------------------------- |
| `src/config/`              | Configuration factory, presets (generic, ddd-es-cqrs)                |
| `src/taxonomy/`            | Tag definitions - categories, status values, format types            |
| `src/scanner/`             | TypeScript and Gherkin file scanning                                 |
| `src/extractor/`           | Pattern extraction from AST/Gherkin                                  |
| `src/generators/`          | Document generators, orchestrator, and pipeline factory              |
| `src/generators/pipeline/` | `buildMasterDataset()` factory, `mergePatterns()`, dataset transform |
| `src/renderable/`          | Markdown codec system                                                |
| `src/validation/`          | FSM validation, DoD checks, anti-patterns                            |
| `src/lint/`                | Pattern linting and process guard                                    |
| `src/api/`                 | Query layer: Data API CLI, business rules query (`rules-query.ts`)   |
| `delivery-process/stubs/`  | Design session code stubs (outside src/ for TS/ESLint isolation)     |

**Live inventory:** `pnpm process:query -- arch context` and `pnpm process:query -- arch layer` reflect the actual annotated codebase structure.

### Three Presets

| Preset                    | Tag Prefix     | Categories | Use Case                           |
| ------------------------- | -------------- | ---------- | ---------------------------------- |
| `libar-generic` (default) | `@libar-docs-` | 3          | Simple projects (this package)     |
| `ddd-es-cqrs`             | `@libar-docs-` | 21         | DDD/Event Sourcing architectures   |
| `generic`                 | `@docs-`       | 3          | Simple projects with @docs- prefix |
