# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Documentation generator that extracts patterns from TypeScript and Gherkin sources using configurable JSDoc annotations. Generates LLM-optimized markdown documentation treating code as the single source of truth.

## Common Commands

```bash
# Build and development
pnpm build              # Compile TypeScript
pnpm dev                # Watch mode compilation
pnpm typecheck          # Type check without emit

# Testing
pnpm test               # Run all Vitest tests
pnpm test <pattern>     # Run tests matching pattern (e.g., pnpm test scanner)

# Linting
pnpm lint               # ESLint on src and tests
pnpm lint:fix           # Auto-fix lint issues
pnpm lint-patterns      # Lint pattern annotations in src/**/*.ts

# Validation
pnpm validate:patterns  # Cross-source pattern validation
pnpm validate:dod       # Definition of Done validation
pnpm validate:all       # All validations including anti-patterns

# Documentation generation
pnpm docs:patterns      # Generate pattern docs
pnpm docs:all           # Generate all doc types (patterns, roadmap, remaining, changelog)
```

## Architecture

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

### Two Presets

| Preset                  | Tag Prefix     | Categories | Use Case                         |
| ----------------------- | -------------- | ---------- | -------------------------------- |
| `ddd-es-cqrs` (default) | `@libar-docs-` | 21         | DDD/Event Sourcing architectures |
| `generic`               | `@docs-`       | 3          | Simple projects                  |

## Testing

Tests use Vitest with BDD/Gherkin integration:

- **Feature files**: `tests/features/**/*.feature`
- **Step definitions**: `tests/steps/**/*.steps.ts`
- **Fixtures**: `tests/fixtures/` - test data and factory functions
- **Support**: `tests/support/` - test helpers and setup utilities

Run a single test file: `pnpm test tests/steps/scanner.steps.ts`

## Annotation System

Files must opt-in with a marker to be scanned:

```typescript
/** @libar-docs */

/**
 * @libar-docs-pattern PatternName
 * @libar-docs-status completed
 * @libar-docs-core
 * @libar-docs-uses OtherPattern
 *
 * ## Description in markdown
 */
export class MyClass { ... }
```

Key tags: `pattern`, `status` (roadmap/active/completed/deferred), `uses`, `used-by`, `phase`, `release`, category tags (`core`, `api`, `infra`, etc.)

## CLI Commands

- `generate-docs` - Generate documentation from annotated sources
- `lint-patterns` - Validate annotation quality
- `lint-process` - FSM validation for delivery process
- `validate-patterns` - Cross-source validation with DoD checks
- `generate-tag-taxonomy` - Generate tag reference from TypeScript
