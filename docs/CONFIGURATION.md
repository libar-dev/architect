# Configuration Guide

> **Deprecated:** This document is superseded by the auto-generated [Configuration Guide](../docs-live/reference/CONFIGURATION-GUIDE.md). This file is preserved for reference only.

Configure tag prefixes, presets, sources, output, and custom taxonomies for `@libar-dev/architect`.

> **Prerequisites:** See [README.md](../README.md) for installation and basic usage.
> **Tag Reference:** Run `npx generate-tag-taxonomy -o TAG_TAXONOMY.md -f` for a complete tag list. See [TAXONOMY.md](./TAXONOMY.md) for concepts.

---

## Quick Reference

| Preset                        | Tag Prefix    | Categories | Use Case                             |
| ----------------------------- | ------------- | ---------- | ------------------------------------ |
| **`libar-generic`** (default) | `@architect-` | 3          | Simple projects (this package)       |
| `generic`                     | `@docs-`      | 3          | Simple projects with `@docs-` prefix |
| `ddd-es-cqrs`                 | `@architect-` | 21         | DDD/Event Sourcing architectures     |

```typescript
// architect.config.ts
import { defineConfig } from '@libar-dev/architect/config';

// Default: libar-generic preset (simple 3-category taxonomy)
export default defineConfig({
  preset: 'libar-generic',
  sources: {
    typescript: ['src/**/*.ts'],
    features: ['specs/*.feature'],
  },
  output: { directory: 'docs-generated' },
});

// DDD-ES-CQRS preset (full 21-category taxonomy)
export default defineConfig({
  preset: 'ddd-es-cqrs',
  sources: {
    typescript: ['packages/*/src/**/*.ts'],
    features: ['architect/specs/**/*.feature'],
    stubs: ['architect/stubs/**/*.ts'],
  },
  output: { directory: 'docs-living', overwrite: true },
});

// Generic preset (simple taxonomy with @docs- prefix)
export default defineConfig({
  preset: 'generic',
  sources: { typescript: ['src/**/*.ts'] },
});

// Custom prefix with any taxonomy
export default defineConfig({
  preset: 'libar-generic',
  tagPrefix: '@acme-',
  fileOptInTag: '@acme',
  sources: { typescript: ['src/**/*.ts'] },
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

### Default Preset Selection

All entry points use the same default:

| Entry Point                              | Default Preset                 | Context                  |
| ---------------------------------------- | ------------------------------ | ------------------------ |
| `defineConfig()`                         | `libar-generic` (3 categories) | Config file              |
| `loadProjectConfig()` fallback (no file) | `libar-generic` (3 categories) | CLI tools                |
| This package's config file               | `libar-generic` (3 categories) | Standalone package usage |

**Rationale:** Simple defaults for most users. Use `preset: 'ddd-es-cqrs'` explicitly if you need the full 21-category DDD taxonomy.

---

## Presets

### Libar-Generic Preset (Default)

The default preset used by this package. Same 3 categories as `generic` but with `@architect-` prefix.

| Property        | Value                |
| --------------- | -------------------- |
| **Tag Prefix**  | `@architect-`        |
| **File Opt-In** | `@architect`         |
| **Categories**  | 3 (core, api, infra) |

```typescript
/**
 * @architect
 * @architect-pattern PatternScanner
 * @architect-status completed
 * @architect-core
 * @architect-uses FileDiscovery, ASTParser
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
| **Tag Prefix**  | `@architect-`                                                          |
| **File Opt-In** | `@architect`                                                           |
| **Categories**  | 21 (domain, ddd, bounded-context, event-sourcing, decider, cqrs, etc.) |

```typescript
/**
 * @architect
 * @architect-pattern TransformDataset
 * @architect-status completed
 * @architect-core
 * @architect-uses MasterDataset, ExtractedPattern
 * @architect-used-by Orchestrator
 */
export function transformToMasterDataset(input: TransformInput): MasterDataset { ... }
```

> **Category Reference:** Run `npx generate-tag-taxonomy -o TAG_TAXONOMY.md -f` for the complete list. See [TAXONOMY.md](./TAXONOMY.md) for concepts.

---

## Unified Config File

The `defineConfig()` function centralizes taxonomy, sources, output, and generator overrides in a single `architect.config.ts` file. CLI tools discover this file automatically.

### Discovery Order

1. Current directory: check `architect.config.ts`, then `.js`
2. Walk up to repo root (`.git` folder), checking each directory
3. Fall back to libar-generic preset (3 categories, `@architect-` prefix)

### Config File Format

```typescript
// architect.config.ts
import { defineConfig } from '@libar-dev/architect/config';

export default defineConfig({
  preset: 'libar-generic',
  sources: {
    typescript: ['src/**/*.ts'],
    stubs: ['architect/stubs/**/*.ts'],
    features: ['architect/specs/*.feature'],
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
    features: ['architect/specs/*.feature'],
  },
  output: { directory: 'docs-generated', overwrite: true },
  generatorOverrides: {
    changelog: {
      additionalFeatures: ['architect/decisions/*.feature'],
    },
    'doc-from-decision': {
      replaceFeatures: ['architect/decisions/*.feature'],
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

### Monorepo Example

```
my-monorepo/
├── architect.config.ts          # Repo: ddd-es-cqrs
└── packages/
    └── my-package/
        └── architect.config.ts  # Package: generic
```

CLI tools use the nearest config file to the working directory.

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
import { loadProjectConfig } from '@libar-dev/architect/config';

const result = await loadProjectConfig(process.cwd());

if (!result.ok) {
  console.error(result.error.message);
  process.exit(1);
}

const resolved = result.value;
// resolved.instance    - ArchitectInstance (registry + regexBuilders)
// resolved.project     - ResolvedProjectConfig (sources, output, generators)
// resolved.isDefault   - true if no config file found
// resolved.configPath  - config file path (if found)
```

For per-generator source resolution:

```typescript
import { mergeSourcesForGenerator } from '@libar-dev/architect/config';

const effectiveSources = mergeSourcesForGenerator(
  resolved.project.sources,
  'changelog',
  resolved.project.generatorOverrides
);
// effectiveSources.typescript - merged TypeScript globs
// effectiveSources.features   - merged or replaced feature globs
```

---

## Related Documentation

| Document                             | Purpose                         |
| ------------------------------------ | ------------------------------- |
| [README.md](../README.md)            | Installation and quick start    |
| [TAXONOMY.md](./TAXONOMY.md)         | Tag taxonomy concepts and API   |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Pipeline and codec architecture |
| [METHODOLOGY.md](./METHODOLOGY.md)   | Dual-source ownership strategy  |
