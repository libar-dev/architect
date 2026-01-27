# Configuration Guide

Configure tag prefixes, presets, and custom taxonomies for `@libar-dev/delivery-process`.

> **Prerequisites:** See [README.md](../README.md) for installation and basic usage.
> **Tag Reference:** See [INSTRUCTIONS.md](../INSTRUCTIONS.md) for complete tag lists.

---

## Quick Reference

| Preset        | Tag Prefix     | Categories | Use Case                     |
| ------------- | -------------- | ---------- | ---------------------------- |
| **`generic`** | `@docs-`       | 3          | Most projects (recommended)  |
| `ddd-es-cqrs` | `@libar-docs-` | 21         | DDD/Event Sourcing codebases |

```typescript
import { createDeliveryProcess } from '@libar-dev/delivery-process';

// Generic preset (recommended for most projects)
const dp = createDeliveryProcess({ preset: 'generic' });

// DDD preset (for DDD/ES/CQRS architectures)
const dp = createDeliveryProcess({ preset: 'ddd-es-cqrs' });

// Custom prefix with generic taxonomy
const dp = createDeliveryProcess({
  preset: 'generic',
  tagPrefix: '@acme-',
  fileOptInTag: '@acme',
});
```

---

## Presets

### Generic Preset

| Property        | Value                |
| --------------- | -------------------- |
| **Tag Prefix**  | `@docs-`             |
| **File Opt-In** | `@docs`              |
| **Categories**  | 3 (core, api, infra) |

```typescript
/**
 * @docs
 * @docs-pattern PatternScanner
 * @docs-status completed
 * @docs-core
 * @docs-uses FileDiscovery, ASTParser
 */
export function scanPatterns(config: ScanConfig): Promise<ScanResult> { ... }
```

### DDD-ES-CQRS Preset (Default)

Full taxonomy for domain-driven architectures with 21 categories.

| Property        | Value                                                                  |
| --------------- | ---------------------------------------------------------------------- |
| **Tag Prefix**  | `@libar-docs-`                                                         |
| **File Opt-In** | `@libar-docs`                                                          |
| **Categories**  | 21 (domain, ddd, bounded-context, event-sourcing, decider, cqrs, etc.) |

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern TransformDataset
 * @libar-docs-status completed
 * @libar-docs-core
 * @libar-docs-uses MasterDataset, ExtractedPattern
 * @libar-docs-used-by Orchestrator
 */
export function transformToMasterDataset(input: TransformInput): MasterDataset { ... }
```

> **Category Reference:** See [INSTRUCTIONS.md](../INSTRUCTIONS.md#category-tags) for the complete list.

---

## Hierarchical Configuration

CLI tools discover `delivery-process.config.ts` files automatically.

### Discovery Order

1. Current directory
2. Walk up to repo root (`.git` folder)
3. Fall back to libar-generic preset (3 categories, `@libar-docs-` prefix)

### Config File Format

```typescript
// delivery-process.config.ts
import { createDeliveryProcess } from '@libar-dev/delivery-process';

export default createDeliveryProcess({ preset: 'generic' });
```

### Monorepo Example

```
my-monorepo/
├── delivery-process.config.ts          # Repo: ddd-es-cqrs
└── packages/
    └── my-package/
        └── delivery-process.config.ts  # Package: generic
```

CLI tools use the nearest config file to the working directory.

---

## Custom Configuration

### Custom Tag Prefix

Keep a preset's taxonomy but change the prefix:

```typescript
const dp = createDeliveryProcess({
  preset: 'generic',
  tagPrefix: '@team-',
  fileOptInTag: '@team',
});

// Your annotations:
// /** @team */
// /** @team-pattern DualSourceExtractor */
// /** @team-core */
```

### Custom Categories

Define your own taxonomy:

```typescript
const dp = createDeliveryProcess({
  tagPrefix: '@docs-',
  fileOptInTag: '@docs',
  categories: [
    { tag: 'scanner', domain: 'Scanner', priority: 1, description: 'File scanning', aliases: [] },
    {
      tag: 'extractor',
      domain: 'Extractor',
      priority: 2,
      description: 'Pattern extraction',
      aliases: [],
    },
    {
      tag: 'generator',
      domain: 'Generator',
      priority: 3,
      description: 'Doc generation',
      aliases: [],
    },
  ],
});
```

---

## RegexBuilders API

The `DeliveryProcessInstance` includes utilities for tag detection:

```typescript
const dp = createDeliveryProcess({ preset: 'generic' });

// Check if file should be scanned
dp.regexBuilders.hasFileOptIn(fileContent); // true if contains /** @docs */

// Check for any documentation directives
dp.regexBuilders.hasDocDirectives(fileContent); // true if contains @docs-*

// Normalize tag for lookup
dp.regexBuilders.normalizeTag('@docs-pattern'); // "pattern"
```

---

## Programmatic Config Loading

For tools that need to load configuration files:

```typescript
import { loadConfig, formatConfigError } from '@libar-dev/delivery-process/config';

const result = await loadConfig(process.cwd());

if (!result.ok) {
  console.error(formatConfigError(result.error));
  process.exit(1);
}

const { instance, isDefault, path } = result.value;
// instance.registry - TagRegistry for scanning/extraction
// instance.regexBuilders - Regex utilities for detection
// isDefault - true if no config file found
// path - config file path (if found)
```

---

## Related Documentation

| Document                              | Purpose                         |
| ------------------------------------- | ------------------------------- |
| [README.md](../README.md)             | Installation and quick start    |
| [INSTRUCTIONS.md](../INSTRUCTIONS.md) | Complete tag and CLI reference  |
| [ARCHITECTURE.md](./ARCHITECTURE.md)  | Pipeline and codec architecture |
| [METHODOLOGY.md](./METHODOLOGY.md)    | Dual-source ownership strategy  |
