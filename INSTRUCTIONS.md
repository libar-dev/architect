# Tag Reference & CLI Guide

Complete reference for documentation tags and CLI commands.

> **Configurable Prefixes:** This document uses `@libar-docs-*` examples (DDD_ES_CQRS_PRESET default).
> For other prefixes (e.g., `@docs-*` with GENERIC_PRESET), substitute the configured prefix.
> See [docs/CONFIGURATION.md](./docs/CONFIGURATION.md) for configuration options.

> **Source of Truth:** All tags are defined in TypeScript at `src/taxonomy/registry-builder.ts`.
> Presets can customize the tag prefix. Generate a complete reference with: `npx generate-tag-taxonomy -o TAG_TAXONOMY.md -f`

## Table of Contents

- [File-Level Opt-In](#file-level-opt-in)
- [Category Tags](#category-tags)
- [Metadata Tags](#metadata-tags)
- [Aggregation Tags](#aggregation-tags)
- [CLI Reference](#cli-reference)
- [Gherkin Integration](#gherkin-integration)
- [CI Integration](#ci-integration)

---

## File-Level Opt-In

Files must have an opt-in marker to be scanned. The marker depends on your configuration:

| Preset                | Opt-In Marker             |
| --------------------- | ------------------------- |
| DDD_ES_CQRS (default) | `@libar-docs`             |
| GENERIC               | `@docs`                   |
| Custom                | Configured `fileOptInTag` |

**Example (default preset):**

```typescript
/** @libar-docs */

// This file will be scanned for documentation patterns
```

Without the opt-in marker, the file is skipped entirely.

---

## Category Tags

Assign patterns to categories. Multiple categories allowed per pattern.

> **Complete list:** See `src/taxonomy/categories.ts` for all 21 DDD_ES_CQRS categories.
> The GENERIC_PRESET includes only 3 categories (core, api, infra).
> Custom configurations can define their own categories.

| Tag                           | Domain               | Priority |
| ----------------------------- | -------------------- | -------- |
| `@libar-docs-domain`          | Strategic DDD        | 1        |
| `@libar-docs-ddd`             | Domain-Driven Design | 2        |
| `@libar-docs-bounded-context` | Bounded Context      | 3        |
| `@libar-docs-event-sourcing`  | Event Sourcing       | 4        |
| `@libar-docs-decider`         | Decider              | 5        |
| `@libar-docs-fsm`             | FSM                  | 5        |
| `@libar-docs-cqrs`            | CQRS                 | 5        |
| `@libar-docs-projection`      | Projections          | 6        |
| `@libar-docs-saga`            | Sagas/Workflows      | 7        |
| `@libar-docs-command`         | Command Handling     | 8        |
| `@libar-docs-arch`            | Architecture         | 9        |
| `@libar-docs-infra`           | Infrastructure       | 10       |
| `@libar-docs-validation`      | Validation           | 11       |
| `@libar-docs-testing`         | Testing              | 12       |
| `@libar-docs-performance`     | Performance          | 13       |
| `@libar-docs-security`        | Security             | 14       |
| `@libar-docs-core`            | Core Utilities       | 15       |
| `@libar-docs-api`             | Public APIs          | 16       |
| `@libar-docs-generator`       | Generators           | 17       |
| `@libar-docs-middleware`      | Middleware           | 18       |
| `@libar-docs-correlation`     | Correlation          | 19       |

**Priority:** Lower number = higher priority. When a pattern has multiple categories, the lowest-priority-number category becomes primary.

**Aliases:** Some categories have aliases (e.g., `es` for `event-sourcing`, `process-manager` for `saga`).

---

## Metadata Tags

Enrich patterns with structured data.

> **Complete list:** See `src/taxonomy/registry-builder.ts` for all metadata tags.

### Core Metadata

| Tag                   | Format        | Required    | Purpose                      |
| --------------------- | ------------- | ----------- | ---------------------------- |
| `@libar-docs-pattern` | `PatternName` | **Yes**     | Explicit pattern name        |
| `@libar-docs-status`  | enum          | Recommended | FSM status (per PDR-005)     |
| `@libar-docs-core`    | flag          | No          | Marks as essential/must-know |
| `@libar-docs-phase`   | number        | No          | Roadmap phase number         |
| `@libar-docs-release` | `v0.1.0`      | No          | Target release version       |

**Status values:** `roadmap` (default), `active`, `completed`, `deferred`

- Legacy values also accepted: `implemented`, `partial`, `in-progress`

### Relationship Tags

| Tag                      | Format | Purpose                      |
| ------------------------ | ------ | ---------------------------- |
| `@libar-docs-uses`       | csv    | Patterns this depends on     |
| `@libar-docs-used-by`    | csv    | Patterns that depend on this |
| `@libar-docs-depends-on` | csv    | Roadmap dependencies         |
| `@libar-docs-enables`    | csv    | Patterns this enables        |
| `@libar-docs-usecase`    | quoted | Use case (repeatable)        |

### Process Metadata

| Tag                         | Format       | Purpose                                                     |
| --------------------------- | ------------ | ----------------------------------------------------------- |
| `@libar-docs-quarter`       | `Q1-2026`    | Delivery quarter                                            |
| `@libar-docs-completed`     | `2026-01-08` | Completion date (YYYY-MM-DD)                                |
| `@libar-docs-effort`        | `2d`         | Estimated effort (4h, 2d, 1w)                               |
| `@libar-docs-effort-actual` | `3d`         | Actual effort                                               |
| `@libar-docs-team`          | value        | Team assignment                                             |
| `@libar-docs-workflow`      | enum         | `implementation`, `planning`, `validation`, `documentation` |
| `@libar-docs-risk`          | enum         | `low`, `medium`, `high`                                     |
| `@libar-docs-priority`      | enum         | `critical`, `high`, `medium`, `low`                         |

### PRD/Requirements Tags

| Tag                          | Format | Purpose                           |
| ---------------------------- | ------ | --------------------------------- |
| `@libar-docs-product-area`   | value  | Product area for PRD grouping     |
| `@libar-docs-user-role`      | value  | Target user persona               |
| `@libar-docs-business-value` | value  | Business value statement          |
| `@libar-docs-constraint`     | value  | Technical constraint (repeatable) |
| `@libar-docs-brief`          | path   | Path to pattern brief markdown    |

### Hierarchy Tags

| Tag                  | Format | Purpose                           |
| -------------------- | ------ | --------------------------------- |
| `@libar-docs-level`  | enum   | `epic`, `phase` (default), `task` |
| `@libar-docs-parent` | value  | Parent pattern name               |

### ADR/PDR Tags

| Tag                             | Format | Purpose                                                                                      |
| ------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| `@libar-docs-adr`               | `015`  | ADR/PDR number                                                                               |
| `@libar-docs-adr-status`        | enum   | `proposed` (default), `accepted`, `deprecated`, `superseded`                                 |
| `@libar-docs-adr-category`      | value  | Decision category                                                                            |
| `@libar-docs-adr-supersedes`    | value  | ADR number this supersedes                                                                   |
| `@libar-docs-adr-superseded-by` | value  | ADR number that supersedes this                                                              |
| `@libar-docs-adr-theme`         | enum   | `persistence`, `isolation`, `commands`, `projections`, `coordination`, `taxonomy`, `testing` |
| `@libar-docs-adr-layer`         | enum   | `foundation`, `infrastructure`, `refinement`                                                 |

### Traceability Tags (PDR-007)

| Tag                            | Format | Purpose                                    |
| ------------------------------ | ------ | ------------------------------------------ |
| `@libar-docs-executable-specs` | csv    | Links to package executable spec locations |
| `@libar-docs-roadmap-spec`     | value  | Links back to roadmap pattern              |

---

## Aggregation Tags

Route patterns to specific generated documents.

| Tag                    | Target Document | Purpose               |
| ---------------------- | --------------- | --------------------- |
| `@libar-docs-overview` | OVERVIEW.md     | Architecture overview |
| `@libar-docs-decision` | DECISIONS.md    | ADR-style decisions   |
| `@libar-docs-intro`    | (template)      | Package introduction  |

---

## CLI Reference

### generate-docs

Generate documentation from annotated sources.

```bash
generate-docs [options]
```

| Flag                         | Short | Description                                    | Default             |
| ---------------------------- | ----- | ---------------------------------------------- | ------------------- |
| `--input <pattern>`          | `-i`  | Glob pattern for TypeScript files (repeatable) | required            |
| `--generators <names>`       | `-g`  | Generator names (comma-separated)              | required            |
| `--features <pattern>`       |       | Glob pattern for Gherkin files                 | -                   |
| `--exclude <pattern>`        | `-e`  | Exclude pattern (repeatable)                   | -                   |
| `--output <dir>`             | `-o`  | Output directory                               | `docs/architecture` |
| `--base-dir <path>`          | `-b`  | Base directory                                 | cwd                 |
| `--overwrite`                | `-f`  | Overwrite existing files                       | false               |
| `--workflow <file>`          | `-w`  | Workflow config JSON file                      | -                   |
| `--list-generators`          |       | List available generators                      | -                   |
| `--git-diff-base <branch>`   |       | PR Changes: base branch for diff               | -                   |
| `--changed-files <file>`     |       | PR Changes: explicit file list                 | -                   |
| `--release-filter <version>` |       | PR Changes: filter by release                  | -                   |

**Examples:**

```bash
# Generate pattern registry
generate-docs -g patterns -i "src/**/*.ts" -o docs -f

# Multiple generators
generate-docs -g patterns,adrs,roadmap -i "src/**/*.ts" -o docs -f

# With Gherkin integration
generate-docs -g patterns -i "src/**/*.ts" --features "specs/**/*.feature" -o docs -f

# List available generators
generate-docs --list-generators
```

### lint-patterns

Validate pattern annotation quality.

```bash
lint-patterns [options]
```

| Flag                     | Short | Description                         | Default  |
| ------------------------ | ----- | ----------------------------------- | -------- |
| `--input <pattern>`      | `-i`  | Glob pattern (required, repeatable) | required |
| `--exclude <pattern>`    | `-e`  | Exclude pattern (repeatable)        | -        |
| `--base-dir <dir>`       | `-b`  | Base directory                      | cwd      |
| `--strict`               |       | Treat warnings as errors            | false    |
| `--format <type>`        | `-f`  | Output: `pretty` or `json`          | `pretty` |
| `--quiet`                | `-q`  | Only show errors                    | false    |
| `--min-severity <level>` |       | `error`, `warning`, `info`          | -        |

**Lint Rules:**

| Severity | Rule                       | Description                        |
| -------- | -------------------------- | ---------------------------------- |
| error    | `missing-pattern-name`     | Must have `@libar-docs-pattern`    |
| error    | `tautological-description` | Description can't just repeat name |
| warning  | `missing-status`           | Should have `@libar-docs-status`   |
| warning  | `missing-when-to-use`      | Should have "When to Use" section  |
| info     | `missing-relationships`    | Consider `uses`/`usedBy`           |

**Exit Codes:** `0` = no errors, `1` = errors (or warnings with `--strict`)

### lint-process

Process Guard linter for delivery process FSM validation (PDR-005).

```bash
lint-process [options]
```

| Flag               | Short | Description                           | Default      |
| ------------------ | ----- | ------------------------------------- | ------------ |
| `--staged`         |       | Validate staged changes               | default mode |
| `--all`            |       | Validate all changes vs main          | -            |
| `--files`          |       | Validate specific files mode          | -            |
| `--file`           | `-f`  | Specify file to validate (repeatable) | -            |
| `--base-dir`       | `-b`  | Base directory                        | cwd          |
| `--strict`         |       | Treat warnings as errors              | false        |
| `--ignore-session` |       | Ignore session scope rules            | false        |
| `--show-state`     |       | Show derived process state (debug)    | false        |
| `--format`         |       | Output: `pretty` or `json`            | `pretty`     |

### validate-patterns

Cross-source pattern validator with DoD and anti-pattern detection.

```bash
validate-patterns [options]
```

| Flag                        | Short | Description                                      | Default  |
| --------------------------- | ----- | ------------------------------------------------ | -------- |
| `--input`                   | `-i`  | Glob for TypeScript files (required, repeatable) | required |
| `--features`                | `-F`  | Glob for Gherkin files (required, repeatable)    | required |
| `--exclude`                 | `-e`  | Exclude pattern (repeatable)                     | -        |
| `--base-dir`                | `-b`  | Base directory                                   | cwd      |
| `--strict`                  |       | Treat warnings as errors                         | false    |
| `--format`                  | `-f`  | Output: `pretty` or `json`                       | `pretty` |
| `--dod`                     |       | Enable Definition of Done validation             | false    |
| `--phase`                   |       | Validate specific phase (repeatable)             | -        |
| `--anti-patterns`           |       | Enable anti-pattern detection                    | false    |
| `--scenario-threshold`      |       | Max scenarios per feature                        | 20       |
| `--mega-feature-threshold`  |       | Max lines per feature                            | 500      |
| `--magic-comment-threshold` |       | Max magic comments                               | 5        |

### generate-tag-taxonomy

Generate TAG_TAXONOMY.md reference from TypeScript taxonomy.

```bash
generate-tag-taxonomy [options]
```

| Flag               | Short | Description             | Default                             |
| ------------------ | ----- | ----------------------- | ----------------------------------- |
| `--output <path>`  | `-o`  | Output file path        | `docs/architecture/TAG_TAXONOMY.md` |
| `--overwrite`      | `-f`  | Overwrite existing file | false                               |
| `--base-dir <dir>` | `-b`  | Base directory          | cwd                                 |

---

## Gherkin Integration

Link Gherkin scenarios to patterns using `@pattern:*` tags.

### In Feature Files

```gherkin
@orders @pattern:CommandOrchestrator
Feature: Order Management

  @pattern:DeciderTypes @pattern:FSMTypes
  Scenario: Submit draft order
    Given an order in draft status
    When I submit the order
    Then the order status should be "submitted"
```

**Rules:**

- Feature-level `@pattern:X` applies to all scenarios
- Scenario-level `@pattern:X` applies to that scenario only
- Names are normalized (case-insensitive, spaces removed)

### Process Metadata Tags

In `.feature` files, use `@libar-docs-*` tags (same as TypeScript):

```gherkin
@libar-docs-pattern:DeciderPattern
@libar-docs-status:active
@libar-docs-phase:14
@libar-docs-quarter:Q1-2026
Feature: Decider Pattern Implementation
```

---

## CI Integration

### GitHub Actions

```yaml
name: Pattern Documentation

on:
  push:
    paths:
      - 'packages/**/*.ts'
      - 'specs/**/*.feature'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - name: Lint annotations
        run: npx lint-patterns -i "src/**/*.ts" --strict
      - name: Validate patterns
        run: npx validate-patterns -i "src/**/*.ts" -F "specs/**/*.feature" --dod
      - name: Generate docs
        run: npx generate-docs -g patterns -i "src/**/*.ts" -o docs -f
```

### package.json Scripts

```json
{
  "scripts": {
    "docs:patterns": "generate-docs -g patterns -i 'src/**/*.ts' -o docs -f",
    "lint:patterns": "lint-patterns -i 'src/**/*.ts'",
    "lint:patterns:strict": "lint-patterns -i 'src/**/*.ts' --strict",
    "lint:process": "lint-process --staged",
    "validate:all": "validate-patterns -i 'src/**/*.ts' -F 'specs/**/*.feature' --dod --anti-patterns"
  }
}
```
