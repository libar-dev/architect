## Quick Reference

| Preset                        | Tag Prefix    | Categories | Use Case                         |
| ----------------------------- | ------------- | ---------- | -------------------------------- |
| **`libar-generic`** (default) | `@architect-` | 3          | Simple projects (this package)   |
| `ddd-es-cqrs`                 | `@architect-` | 21         | DDD/Event Sourcing architectures |

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
```

---

## Preset Selection

### When to Use Each Preset

| Preset          | Use When                                                     | Categories                                                                               |
| --------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `libar-generic` | Simple projects, standard `@architect-` prefix               | 3 (core, api, infra)                                                                     |
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

---

## Monorepo Setup

```
my-monorepo/
  architect.config.ts          # Repo-level: ddd-es-cqrs
  packages/
    my-package/
      architect.config.ts      # Package-level: libar-generic
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
  tagPrefix: '@architect-',
  fileOptInTag: '@architect',
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
