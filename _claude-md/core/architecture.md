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

### Module Structure

| Module            | Purpose                                                   |
| ----------------- | --------------------------------------------------------- |
| `src/config/`     | Configuration factory, presets (generic, ddd-es-cqrs)     |
| `src/taxonomy/`   | Tag definitions - categories, status values, format types |
| `src/scanner/`    | TypeScript and Gherkin file scanning                      |
| `src/extractor/`  | Pattern extraction from AST/Gherkin                       |
| `src/generators/` | Document generators and orchestrator                      |
| `src/renderable/` | Markdown codec system                                     |
| `src/validation/` | FSM validation, DoD checks, anti-patterns                 |
| `src/lint/`       | Pattern linting and process guard                         |
| `src/api/`        | Process State API for programmatic access                 |

### Three Presets

| Preset                    | Tag Prefix     | Categories | Use Case                           |
| ------------------------- | -------------- | ---------- | ---------------------------------- |
| `libar-generic` (default) | `@libar-docs-` | 3          | Simple projects (this package)     |
| `ddd-es-cqrs`             | `@libar-docs-` | 21         | DDD/Event Sourcing architectures   |
| `generic`                 | `@docs-`       | 3          | Simple projects with @docs- prefix |
