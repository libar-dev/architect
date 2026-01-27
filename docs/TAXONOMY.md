# Tag Taxonomy Reference

The tag taxonomy is 100% TypeScript-defined, providing type safety and IDE autocomplete. This is the single source of truth for all tag definitions.

## Overview

The taxonomy is organized into several modules:

```
src/taxonomy/
├── status-values.ts      # FSM state values (roadmap, active, completed, deferred)
├── normalized-status.ts  # Display normalization (completed, active, planned)
├── categories.ts         # 21 domain categories (DDD, ES, CQRS, etc.)
├── format-types.ts       # Tag value formats (value, enum, csv, flag, etc.)
├── hierarchy-levels.ts   # Work item hierarchy (epic, phase, task)
├── risk-levels.ts        # Risk assessment values
├── layer-types.ts        # Feature layer types
└── registry-builder.ts   # Build complete registry
```

---

## Status Values

### FSM States (Process Status)

The 4-state FSM from PDR-005:

| Status      | Protection | Description                                          |
| ----------- | ---------- | ---------------------------------------------------- |
| `roadmap`   | none       | Planned work, fully editable                         |
| `active`    | scope      | In progress, scope-locked (no new deliverables)      |
| `completed` | hard       | Done, hard-locked (requires unlock-reason to modify) |
| `deferred`  | none       | On hold, fully editable                              |

```typescript
import { PROCESS_STATUS_VALUES } from '@libar-dev/delivery-process/taxonomy';
// ["roadmap", "active", "completed", "deferred"]
```

### Display Normalization

For UI presentation, statuses normalize to 3 buckets:

| Raw Status  | Display Bucket |
| ----------- | -------------- |
| `completed` | `completed`    |
| `active`    | `active`       |
| `roadmap`   | `planned`      |
| `deferred`  | `planned`      |

```typescript
import { normalizeStatus } from '@libar-dev/delivery-process/taxonomy';

normalizeStatus('completed'); // → "completed"
normalizeStatus('active'); // → "active"
normalizeStatus('roadmap'); // → "planned"
normalizeStatus('deferred'); // → "planned"
normalizeStatus(undefined); // → "planned"
```

---

## Categories

21 categories for classifying patterns in DDD/ES/CQRS domains:

| Tag               | Domain               | Priority | Description                                    |
| ----------------- | -------------------- | -------- | ---------------------------------------------- |
| `domain`          | Strategic DDD        | 1        | Bounded contexts, aggregates, strategic design |
| `ddd`             | Domain-Driven Design | 2        | DDD tactical patterns                          |
| `bounded-context` | Bounded Context      | 3        | BC contracts and definitions                   |
| `event-sourcing`  | Event Sourcing       | 4        | Event store, aggregates, replay                |
| `decider`         | Decider              | 5        | Decider pattern                                |
| `fsm`             | FSM                  | 5        | Finite state machine patterns                  |
| `cqrs`            | CQRS                 | 5        | Command/query separation                       |
| `projection`      | Projection           | 6        | Read models, checkpoints                       |
| `saga`            | Saga                 | 7        | Cross-context coordination, process managers   |
| `command`         | Command              | 8        | Command handlers, orchestration                |
| `arch`            | Architecture         | 9        | Architecture patterns, decisions               |
| `infra`           | Infrastructure       | 10       | Infrastructure, composition root               |
| `validation`      | Validation           | 11       | Input validation, schemas                      |
| `testing`         | Testing              | 12       | Test patterns, BDD                             |
| `performance`     | Performance          | 13       | Optimization, caching                          |
| `security`        | Security             | 14       | Auth, authorization                            |
| `core`            | Core                 | 15       | Core utilities                                 |
| `api`             | API                  | 16       | Public APIs                                    |
| `generator`       | Generator            | 17       | Code generators                                |
| `middleware`      | Middleware           | 18       | Middleware patterns                            |
| `correlation`     | Correlation          | 19       | Correlation tracking                           |

**Usage in annotations:**

```typescript
/**
 * @<prefix>
 * @<prefix>-pattern MyPattern
 * @<prefix>-event-sourcing
 * @<prefix>-cqrs
 */
```

**Category aliases:**

| Tag              | Aliases           |
| ---------------- | ----------------- |
| `event-sourcing` | `es`              |
| `saga`           | `process-manager` |
| `infra`          | `infrastructure`  |

```typescript
import { CATEGORIES, CATEGORY_TAGS } from '@libar-dev/delivery-process/taxonomy';

// Access category definitions
for (const cat of CATEGORIES) {
  console.log(`${cat.tag}: ${cat.description}`);
}

// Get just the tags
console.log(CATEGORY_TAGS); // ["domain", "ddd", "bounded-context", ...]
```

---

## Format Types

Defines how tag values are parsed:

| Format         | Description                         | Example                              |
| -------------- | ----------------------------------- | ------------------------------------ |
| `value`        | Simple string value                 | `@<prefix>-pattern MyPattern`        |
| `enum`         | Constrained to predefined values    | `@<prefix>-status completed`         |
| `quoted-value` | String in quotes (preserves spaces) | `@<prefix>-brief:'Multi word value'` |
| `csv`          | Comma-separated values              | `@<prefix>-uses A, B, C`             |
| `number`       | Numeric value                       | `@<prefix>-phase 15`                 |
| `flag`         | Boolean presence (no value needed)  | `@<prefix>-core`                     |

```typescript
import { FORMAT_TYPES } from '@libar-dev/delivery-process/taxonomy';
// ["value", "enum", "quoted-value", "csv", "number", "flag"]
```

---

## Hierarchy Levels

Three-level hierarchy for organizing work:

| Level   | Scope                               | Duration  |
| ------- | ----------------------------------- | --------- |
| `epic`  | Multi-quarter strategic initiatives | Months    |
| `phase` | Standard work units                 | 2-5 days  |
| `task`  | Fine-grained session-level work     | 1-4 hours |

```typescript
import { HIERARCHY_LEVELS, DEFAULT_HIERARCHY_LEVEL } from '@libar-dev/delivery-process/taxonomy';

console.log(HIERARCHY_LEVELS); // ["epic", "phase", "task"]
console.log(DEFAULT_HIERARCHY_LEVEL); // "phase"
```

**Usage:**

```gherkin
@<prefix>
@<prefix>-pattern:MyEpic
@<prefix>-level:epic
Feature: Strategic initiative
```

---

## Risk Levels

Risk assessment values for planning:

| Level    | When to Use                           |
| -------- | ------------------------------------- |
| `low`    | Straightforward, well-understood work |
| `medium` | Some uncertainty or dependencies      |
| `high`   | Significant unknowns, critical path   |

```typescript
import { RISK_LEVELS } from '@libar-dev/delivery-process/taxonomy';
// ["low", "medium", "high"]
```

**Usage:**

```gherkin
@<prefix>-risk:high
Feature: Complex integration
```

---

## Layer Types

Feature layer types for test organization, inferred from file paths:

| Layer         | Description                      | Example Path              |
| ------------- | -------------------------------- | ------------------------- |
| `timeline`    | Process/workflow features        | `specs/delivery-process/` |
| `domain`      | Business domain features         | `specs/domain/orders/`    |
| `integration` | Cross-system integration tests   | `specs/integration/`      |
| `e2e`         | End-to-end user journey tests    | `specs/e2e/`              |
| `component`   | Unit/component level tests       | `tests/components/`       |
| `unknown`     | Cannot determine layer from path | -                         |

```typescript
import { LAYER_TYPES } from '@libar-dev/delivery-process/taxonomy';
// ["timeline", "domain", "integration", "e2e", "component", "unknown"]
```

---

## Building the Registry

Use `buildRegistry()` to create a complete tag registry:

```typescript
import { buildRegistry } from '@libar-dev/delivery-process/taxonomy';

// Build with default prefix (@libar-docs-)
const registry = buildRegistry();

// Build with custom prefix
const customRegistry = buildRegistry({ tagPrefix: '@docs-' });

// Access registry properties
console.log(registry.tagPrefix); // "@libar-docs-"
console.log(registry.fileOptInTag); // "@libar-docs"
console.log(registry.categories); // CategoryDefinition[]
console.log(registry.statusValues); // ["roadmap", "active", "completed", "deferred"]
```

---

## Extending the Taxonomy

### Adding Custom Categories

To add custom categories, create your own category array and build a custom registry:

```typescript
import { CATEGORIES, buildRegistry } from '@libar-dev/delivery-process/taxonomy';

const CUSTOM_CATEGORIES = [
  ...CATEGORIES,
  {
    tag: 'ml',
    domain: 'Machine Learning',
    priority: 20,
    description: 'ML patterns and pipelines',
    aliases: ['ai'],
  },
];

// Use in your custom configuration
const customRegistry = buildRegistry({
  tagPrefix: '@myapp-',
  categories: CUSTOM_CATEGORIES,
});
```

### Using Generic Preset

For simpler projects, use the `generic` preset which provides only 3 categories:

```typescript
import { createDeliveryProcess, GENERIC_PRESET } from '@libar-dev/delivery-process';

const dp = createDeliveryProcess({ preset: 'generic' });
// Uses @docs- prefix with minimal categories
```

| Generic Category | Description     |
| ---------------- | --------------- |
| `core`           | Core patterns   |
| `api`            | API definitions |
| `infra`          | Infrastructure  |

---

## Generating TAG_TAXONOMY.md

Generate a human-readable taxonomy reference:

```bash
npx generate-tag-taxonomy -o TAG_TAXONOMY.md -f
```

This creates a markdown file documenting all tags, their formats, valid values, and usage examples.
