# Tag Taxonomy

The taxonomy defines the vocabulary for pattern annotations: what tags exist, their valid values, and how they're parsed. It's 100% TypeScript-defined in `src/taxonomy/`, providing type safety and IDE autocomplete.

---

## Concept

A **taxonomy** is a classification system. In `@libar-dev/delivery-process`, the taxonomy defines:

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
import { buildRegistry } from '@libar-dev/delivery-process/taxonomy';

const registry = buildRegistry();
// registry.tagPrefix       → "@libar-docs-"
// registry.fileOptInTag    → "@libar-docs"
// registry.categories      → CategoryDefinition[]
// registry.metadataTags    → MetadataTagDefinition[]
// registry.aggregationTags → AggregationTagDefinition[]
// registry.formatOptions   → string[]
```

### Presets Select Taxonomy Subsets

| Preset                    | Categories | Tag Prefix     | Use Case                           |
| ------------------------- | ---------- | -------------- | ---------------------------------- |
| `libar-generic` (default) | 3          | `@libar-docs-` | Simple projects (this package)     |
| `ddd-es-cqrs`             | 21         | `@libar-docs-` | DDD/Event Sourcing architectures   |
| `generic`                 | 3          | `@docs-`       | Simple projects with @docs- prefix |

The preset determines which categories are available. All presets share the same status values and format types.

---

## Format Types

Tags have different value formats:

| Format         | Example                    | Parsing                        |
| -------------- | -------------------------- | ------------------------------ |
| `flag`         | `@docs-core`               | Boolean presence (no value)    |
| `value`        | `@docs-pattern MyPattern`  | Simple string                  |
| `enum`         | `@docs-status completed`   | Constrained to predefined list |
| `csv`          | `@docs-uses A, B, C`       | Comma-separated values         |
| `number`       | `@docs-phase 15`           | Numeric value                  |
| `quoted-value` | `@docs-brief:'Multi word'` | Preserves spaces               |

---

## Generating a Tag Reference

Generate a human-readable taxonomy reference from the TypeScript taxonomy source:

```bash
# Via the docs generator (recommended)
npx generate-docs -g taxonomy -i "src/**/*.ts" -o docs -f

# Flat single-file reference (deprecated — use generate-docs instead)
npx generate-tag-taxonomy -o TAG_TAXONOMY.md -f
```

The generated output reflects every tag the system supports — including all 21 categories available with the `ddd-es-cqrs` preset.

---

## Related Documentation

| Topic                 | Document                                                    |
| --------------------- | ----------------------------------------------------------- |
| **Presets & config**  | [CONFIGURATION.md](./CONFIGURATION.md)                      |
| **Custom categories** | [CONFIGURATION.md](./CONFIGURATION.md#custom-configuration) |
