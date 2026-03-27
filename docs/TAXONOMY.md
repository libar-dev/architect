# Tag Taxonomy

> **Deprecated:** This document is superseded by the auto-generated [Taxonomy Reference](../docs-live/TAXONOMY.md) which contains the full 60-tag catalog with all values, format types, and preset details. This file is preserved for reference only.

The taxonomy defines the vocabulary for pattern annotations: what tags exist, their valid values, and how they're parsed. It's 100% TypeScript-defined in `src/taxonomy/`, providing type safety and IDE autocomplete.

---

## Concept

A **taxonomy** is a classification system. In `@libar-dev/architect`, the taxonomy defines:

| Component        | Purpose                                                   |
| ---------------- | --------------------------------------------------------- |
| **Categories**   | Domain classifications (e.g., `core`, `api`)              |
| **Status**       | FSM states (`roadmap`, `active`, `completed`, `deferred`) |
| **Format Types** | How tag values are parsed (`flag`, `csv`, `enum`)         |
| **Hierarchy**    | Work item levels (`epic`, `phase`, `task`)                |

The taxonomy is NOT a fixed schema. Presets (`libar-generic`, `generic`, `ddd-es-cqrs`) select different subsets, and you can define custom categories.

---

## Architecture

```
src/taxonomy/
├── index.ts               # Barrel exports
├── registry-builder.ts    # buildRegistry() — creates TagRegistry
├── categories.ts          # Category definitions (core, api, ddd, …)
├── status-values.ts       # FSM state values: roadmap/active/completed/deferred
├── deliverable-status.ts  # Deliverable statuses: complete/in-progress/pending/deferred/superseded/n-a
├── normalized-status.ts   # Display normalization (3 buckets)
├── format-types.ts        # Tag value parsing rules
├── hierarchy-levels.ts    # epic/phase/task
├── risk-levels.ts         # low/medium/high
├── severity-types.ts      # error/warning/info
├── layer-types.ts         # timeline/domain/integration/e2e/component/unknown
├── generator-options.ts   # Format, groupBy, sortBy, workflow, priority, ADR enums
└── conventions.ts         # Convention values for reference document generation
```

### TagRegistry

The `buildRegistry()` function creates a `TagRegistry` containing all taxonomy definitions:

```typescript
import { buildRegistry } from '@libar-dev/architect/taxonomy';

const registry = buildRegistry();
// registry.tagPrefix       → "@architect-"
// registry.fileOptInTag    → "@architect"
// registry.categories      → CategoryDefinition[]
// registry.metadataTags    → MetadataTagDefinition[]
// registry.aggregationTags → AggregationTagDefinition[]
// registry.formatOptions   → string[]
```

### Presets Select Taxonomy Subsets

| Preset                    | Categories | Tag Prefix    | Use Case                                |
| ------------------------- | ---------- | ------------- | --------------------------------------- |
| `libar-generic` (default) | 3          | `@architect-` | Simple projects (this package)          |
| `ddd-es-cqrs`             | 21         | `@architect-` | DDD/Event Sourcing architectures        |
| `generic`                 | 3          | `@architect-` | Simple projects with @architect- prefix |

The preset determines which categories are available. All presets share the same status values and format types.

---

## Format Types

Tags have different value formats:

| Format         | Example                         | Parsing                        |
| -------------- | ------------------------------- | ------------------------------ |
| `flag`         | `@architect-core`               | Boolean presence (no value)    |
| `value`        | `@architect-pattern MyPattern`  | Simple string                  |
| `enum`         | `@architect-status completed`   | Constrained to predefined list |
| `csv`          | `@architect-uses A, B, C`       | Comma-separated values         |
| `number`       | `@architect-phase 15`           | Numeric value                  |
| `quoted-value` | `@architect-brief:'Multi word'` | Preserves spaces               |

---

## Generating a Tag Reference

Generate a human-readable taxonomy reference from the TypeScript taxonomy source:

```bash
# Via the docs generator (recommended)
npx generate-docs -g taxonomy -i "src/**/*.ts" -o docs -f

# Flat single-file reference (deprecated — use generate-docs instead)
pnpm docs:taxonomy
```

The generated output reflects every tag the system supports — including all 21 categories available with the `ddd-es-cqrs` preset.

---

## Related Documentation

| Topic                 | Document                                                    |
| --------------------- | ----------------------------------------------------------- |
| **Presets & config**  | [CONFIGURATION.md](./CONFIGURATION.md)                      |
| **Custom categories** | [CONFIGURATION.md](./CONFIGURATION.md#custom-configuration) |
