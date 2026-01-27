# Tag Taxonomy

The taxonomy defines the vocabulary for pattern annotations: what tags exist, their valid values, and how they're parsed. It's 100% TypeScript-defined in `src/taxonomy/`, providing type safety and IDE autocomplete.

---

## Concept

A **taxonomy** is a classification system. In `@libar-dev/delivery-process`, the taxonomy defines:

| Component        | Purpose                                           |
| ---------------- | ------------------------------------------------- |
| **Categories**   | Domain classifications (e.g., `core`, `api`)      |
| **Status**       | FSM states (`roadmap`, `active`, `completed`)     |
| **Format Types** | How tag values are parsed (`flag`, `csv`, `enum`) |
| **Hierarchy**    | Work item levels (`epic`, `phase`, `task`)        |

The taxonomy is NOT a fixed schema. Presets (`generic`, `ddd-es-cqrs`) select different subsets, and you can define custom categories.

---

## Architecture

```
src/taxonomy/
├── registry-builder.ts   # buildRegistry() - creates TagRegistry
├── categories.ts         # Category definitions
├── status-values.ts      # FSM state values (PDR-005)
├── normalized-status.ts  # Display normalization (3 buckets)
├── format-types.ts       # Tag value parsing rules
├── hierarchy-levels.ts   # epic/phase/task
├── risk-levels.ts        # low/medium/high
└── layer-types.ts        # timeline/domain/integration/e2e
```

### TagRegistry

The `buildRegistry()` function creates a `TagRegistry` containing all taxonomy definitions:

```typescript
import { buildRegistry } from '@libar-dev/delivery-process/taxonomy';

const registry = buildRegistry();
// registry.tagPrefix       → "@libar-docs-"
// registry.fileOptInTag    → "@libar-docs"
// registry.categories      → CategoryDefinition[]
// registry.statusValues    → ["roadmap", "active", "completed", "deferred"]
```

### Presets Select Taxonomy Subsets

| Preset        | Categories | Tag Prefix     | Use Case             |
| ------------- | ---------- | -------------- | -------------------- |
| `generic`     | 3          | `@docs-`       | Simple projects      |
| `ddd-es-cqrs` | 21         | `@libar-docs-` | DDD/ES architectures |

The preset determines which categories are available. Both share the same status values and format types.

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

To generate a human-readable taxonomy reference:

```bash
npx generate-tag-taxonomy -o TAG_TAXONOMY.md -f
```

This creates a markdown file documenting all tags with their formats, valid values, and examples.

---

## Related Documentation

| Topic                 | Document                                                    |
| --------------------- | ----------------------------------------------------------- |
| **Complete tag list** | [INSTRUCTIONS.md](../INSTRUCTIONS.md)                       |
| **Presets & config**  | [CONFIGURATION.md](./CONFIGURATION.md)                      |
| **Custom categories** | [CONFIGURATION.md](./CONFIGURATION.md#custom-configuration) |
