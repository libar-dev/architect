# Configuration Guide

**Purpose:** Reference document: Configuration Guide
**Detail Level:** Full reference

---

## Quick Reference

| Preset                        | Tag Prefix     | Categories | Use Case                             |
| ----------------------------- | -------------- | ---------- | ------------------------------------ |
| **`libar-generic`** (default) | `@libar-docs-` | 3          | Simple projects (this package)       |
| `generic`                     | `@docs-`       | 3          | Simple projects with `@docs-` prefix |
| `ddd-es-cqrs`                 | `@libar-docs-` | 21         | DDD/Event Sourcing architectures     |

```typescript
// delivery-process.config.ts
import { defineConfig } from '@libar-dev/delivery-process/config';

// Default: libar-generic preset (simple 3-category taxonomy)
export default defineConfig({
  preset: 'libar-generic',
  sources: {
    typescript: ['src/**/*.ts'],
    features: ['specs/*.feature'],
  },
  output: { directory: 'docs-generated' },
});
```

---

## Preset Selection

### When to Use Each Preset

| Preset          | Use When                                                     | Categories                                                                               |
| --------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `libar-generic` | Simple projects, standard `@libar-docs-` prefix              | 3 (core, api, infra)                                                                     |
| `generic`       | Prefer shorter `@docs-` prefix                               | 3 (core, api, infra)                                                                     |
| `ddd-es-cqrs`   | DDD architecture with bounded contexts, event sourcing, CQRS | 21 (domain, ddd, bounded-context, event-sourcing, decider, cqrs, saga, projection, etc.) |

**Design decision:** Presets **replace** the base taxonomy categories entirely (not merged). If you need DDD categories, use the `ddd-es-cqrs` preset.

### Default Preset Selection

All entry points default to `libar-generic`:

| Entry Point                    | Default Preset                 | Context                          |
| ------------------------------ | ------------------------------ | -------------------------------- |
| `defineConfig()`               | `libar-generic` (3 categories) | Config file                      |
| `loadProjectConfig()` fallback | `libar-generic` (3 categories) | CLI tools (no config file found) |
| This package's config file     | `libar-generic` (3 categories) | Standalone package usage         |

---

## Unified Config File

The `defineConfig()` function centralizes taxonomy, sources, output, and generator overrides in a single `delivery-process.config.ts` file. CLI tools discover this file automatically.

### Discovery Order

1. Current directory: check `delivery-process.config.ts`, then `.js`
2. Walk up to repo root (`.git` folder), checking each directory
3. Fall back to libar-generic preset (3 categories, `@libar-docs-` prefix)

### Config File Format

```typescript
// delivery-process.config.ts
import { defineConfig } from '@libar-dev/delivery-process/config';

export default defineConfig({
  preset: 'libar-generic',
  sources: {
    typescript: ['src/**/*.ts'],
    stubs: ['delivery-process/stubs/**/*.ts'],
    features: ['delivery-process/specs/*.feature'],
  },
  output: {
    directory: 'docs-generated',
    overwrite: true,
  },
});
```

### Sources Configuration

| Field        | Type       | Description                                          |
| ------------ | ---------- | ---------------------------------------------------- |
| `typescript` | `string[]` | Glob patterns for TypeScript source files (required) |
| `features`   | `string[]` | Glob patterns for Gherkin feature files              |
| `stubs`      | `string[]` | Glob patterns for design stub files                  |
| `exclude`    | `string[]` | Glob patterns to exclude from all scanning           |

Stubs are merged into TypeScript sources at resolution time. No parent directory traversal (`..`) is allowed in globs.

### Output Configuration

| Field       | Type      | Default               | Description                         |
| ----------- | --------- | --------------------- | ----------------------------------- |
| `directory` | `string`  | `'docs/architecture'` | Output directory for generated docs |
| `overwrite` | `boolean` | `false`               | Overwrite existing files            |

### Generator Overrides

Some generators need different sources than the base config. Use `generatorOverrides` for per-generator customization:

```typescript
export default defineConfig({
  preset: 'libar-generic',
  sources: {
    typescript: ['src/**/*.ts'],
    features: ['delivery-process/specs/*.feature'],
  },
  output: { directory: 'docs-generated', overwrite: true },
  generatorOverrides: {
    changelog: {
      additionalFeatures: ['delivery-process/decisions/*.feature'],
    },
    'doc-from-decision': {
      replaceFeatures: ['delivery-process/decisions/*.feature'],
    },
  },
});
```

| Override Field       | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `additionalFeatures` | Feature globs appended to base features              |
| `additionalInput`    | TypeScript globs appended to base TypeScript sources |
| `replaceFeatures`    | Feature globs used INSTEAD of base features          |
| `outputDirectory`    | Override output directory for this generator         |

**Constraint:** `replaceFeatures` and `additionalFeatures` are mutually exclusive when both are non-empty.

---

## Monorepo Setup

```my-monorepo/ delivery-process.config.ts          # Repo-level: ddd-es-cqrs   packages/     my-package/       delivery-process.config.ts      # Package-level: generic

```

CLI tools use the nearest config file to the working directory. Each package can have its own preset and source globs.

---

## Custom Configuration

### Custom Tag Prefix

Keep a preset's taxonomy but change the prefix:

```typescript
export default defineConfig({
  preset: 'libar-generic',
  tagPrefix: '@team-',
  fileOptInTag: '@team',
  sources: { typescript: ['src/**/*.ts'] },
});

// Your annotations:
// /** @team */
// /** @team-pattern DualSourceExtractor */
// /** @team-core */
```

### Custom Categories

Define your own taxonomy:

```typescript
export default defineConfig({
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
  sources: { typescript: ['src/**/*.ts'] },
});
```

---

## Programmatic Config Loading

For tools that need to load configuration files:

```typescript
import { loadProjectConfig } from '@libar-dev/delivery-process/config';

const result = await loadProjectConfig(process.cwd());

if (!result.ok) {
  console.error(result.error.message);
  process.exit(1);
}

const resolved = result.value;
// resolved.instance    - DeliveryProcessInstance (registry + regexBuilders)
// resolved.project     - ResolvedProjectConfig (sources, output, generators)
// resolved.isDefault   - true if no config file found
// resolved.configPath  - config file path (if found)
```

For per-generator source resolution:

```typescript
import { mergeSourcesForGenerator } from '@libar-dev/delivery-process/config';

const effectiveSources = mergeSourcesForGenerator(
  resolved.project.sources,
  'changelog',
  resolved.project.generatorOverrides
);
// effectiveSources.typescript - merged TypeScript globs
// effectiveSources.features   - merged or replaced feature globs
```

---

## Backward Compatibility

The legacy `createDeliveryProcess()` API is still exported and supported. Config files using the old format are detected automatically by `loadProjectConfig()` and wrapped in a `ResolvedConfig` with default project settings.

```typescript
// Legacy format (still works)
import { createDeliveryProcess } from '@libar-dev/delivery-process';
export default createDeliveryProcess({ preset: 'ddd-es-cqrs' });
```

New projects should use `defineConfig()` for the unified configuration experience.

---
