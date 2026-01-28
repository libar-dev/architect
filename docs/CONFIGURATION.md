# Configuration Guide

Configure tag prefixes, presets, and custom taxonomies for `@libar-dev/delivery-process`.

> **Prerequisites:** See [README.md](../README.md) for installation and basic usage.
> **Tag Reference:** See [INSTRUCTIONS.md](../INSTRUCTIONS.md) for complete tag lists.

---

## Quick Reference

| Preset                        | Tag Prefix     | Categories | Use Case                             |
| ----------------------------- | -------------- | ---------- | ------------------------------------ |
| **`libar-generic`** (default) | `@libar-docs-` | 3          | Simple projects (this package)       |
| `generic`                     | `@docs-`       | 3          | Simple projects with `@docs-` prefix |
| `ddd-es-cqrs`                 | `@libar-docs-` | 21         | DDD/Event Sourcing architectures     |

```typescript
import { createDeliveryProcess } from '@libar-dev/delivery-process';

// Default: libar-generic preset (simple 3-category taxonomy)
const dpDefault = createDeliveryProcess();
// Tag prefix: @libar-docs-*
// Categories: core, api, infra

// DDD-ES-CQRS preset (full 21-category taxonomy)
const dpDDD = createDeliveryProcess({ preset: 'ddd-es-cqrs' });
// Tag prefix: @libar-docs-*
// Categories: 21 domain-specific categories

// Generic preset (simple taxonomy with @docs- prefix)
const dpGeneric = createDeliveryProcess({ preset: 'generic' });
// Tag prefix: @docs-*
// Categories: core, api, infra

// Custom prefix with any taxonomy
const dpCustom = createDeliveryProcess({
  preset: 'libar-generic',
  tagPrefix: '@acme-',
  fileOptInTag: '@acme',
});
```

### Preset Category Behavior

When using a preset, the preset's categories **replace** the base taxonomy categories entirely (not merged):

| Preset          | Categories        | Count |
| --------------- | ----------------- | ----- |
| `generic`       | core, api, infra  | 3     |
| `libar-generic` | core, api, infra  | 3     |
| `ddd-es-cqrs`   | Full DDD taxonomy | 21    |

**Design decision:** If you need DDD categories (ddd, event-sourcing, cqrs, saga, projection, decider, etc.), use the `ddd-es-cqrs` preset. The `generic` and `libar-generic` presets provide a simpler 3-category taxonomy.

**Note:** The `mergeTagRegistries()` function is exported for consumers who need custom merge behavior, but `createDeliveryProcess()` uses replacement semantics.

### Default Preset Selection

All entry points use the same default:

| Entry Point                       | Default Preset                 | Context                  |
| --------------------------------- | ------------------------------ | ------------------------ |
| `createDeliveryProcess()`         | `libar-generic` (3 categories) | Programmatic API         |
| `loadConfig()` fallback (no file) | `libar-generic` (3 categories) | CLI tools                |
| This package's config file        | `libar-generic` (3 categories) | Standalone package usage |

**Rationale:** Simple defaults for most users. Use `preset: 'ddd-es-cqrs'` explicitly if you need the full 21-category DDD taxonomy.

---

## Presets

### Libar-Generic Preset (Default)

The default preset used by this package. Same 3 categories as `generic` but with `@libar-docs-` prefix.

| Property        | Value                |
| --------------- | -------------------- |
| **Tag Prefix**  | `@libar-docs-`       |
| **File Opt-In** | `@libar-docs`        |
| **Categories**  | 3 (core, api, infra) |

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern PatternScanner
 * @libar-docs-status completed
 * @libar-docs-core
 * @libar-docs-uses FileDiscovery, ASTParser
 */
export function scanPatterns(config: ScanConfig): Promise<ScanResult> { ... }
```

### Generic Preset

Same 3 categories as `libar-generic` but with `@docs-` prefix. Use when you prefer shorter tag names.

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

### DDD-ES-CQRS Preset

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

// Uses libar-generic preset (default)
export default createDeliveryProcess();

// Or explicitly specify a preset
export default createDeliveryProcess({ preset: 'ddd-es-cqrs' });
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
  preset: 'libar-generic',
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
const dp = createDeliveryProcess(); // Uses libar-generic (default)

// Check if file should be scanned
dp.regexBuilders.hasFileOptIn(fileContent); // true if contains /** @libar-docs */

// Check for any documentation directives
dp.regexBuilders.hasDocDirectives(fileContent); // true if contains @libar-docs-*

// Normalize tag for lookup
dp.regexBuilders.normalizeTag('@libar-docs-pattern'); // "pattern"
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
