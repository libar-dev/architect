# Configuration Guide

> **Deprecated:** This document is superseded by the auto-generated [Configuration Guide](../docs-live/reference/CONFIGURATION-GUIDE.md). This file is preserved for reference only.

Configure tag prefixes, role sets, sources, output, and custom taxonomies for `@libar-dev/architect`.

> **Prerequisites:** See [README.md](../README.md) for installation and basic usage.
> **Tag Reference:** Run `pnpm docs:taxonomy` for a complete tag list. See [TAXONOMY.md](./TAXONOMY.md) for concepts.

---

## Quick Reference

The package-host runtime now documents a focused authored role surface. Use the generated taxonomy for exact counts, but the retained everyday roles are `projection`, `service`, `decider`, `read-model`, `codec`, `contract`, `barrel`, and `utility`.

```typescript
// architect.config.ts
import { defineConfig } from '@libar-dev/architect/config';
import { DEFAULT_ROLES } from '@libar-dev/architect/taxonomy';

export default defineConfig({
  roles: DEFAULT_ROLES,
  sources: {
    typescript: ['src/**/*.ts'],
    features: ['architect/specs/**/*.feature'],
    stubs: ['architect/stubs/**/*.ts'],
  },
  output: { directory: 'docs-generated', overwrite: true },
});
```

### Role set behavior

Role arrays replace the base role surface, they do not merge with it. That matters when a project wants a custom role catalog.

| Role Set              | Description                                                             |
| --------------------- | ----------------------------------------------------------------------- |
| `DEFAULT_ROLES`       | The package-host authored role surface used throughout the current docs |
| Custom `roles: [...]` | Fully replaces the default roles for that project                       |

### Default selection

All entry points fall back to `DEFAULT_ROLES` when the config omits `roles` entirely. The fallback is deliberate: a project with no explicit role policy still gets a stable classification surface.

---

## Role examples

### Service-style implementation

```typescript
/**
 * @architect
 * @architect-pattern PatternScanner
 * @architect-status completed
 * @architect-role service
 * @architect-uses FileDiscovery, ASTParser
 */
export function scanPatterns(config: ScanConfig): Promise<ScanResult> { ... }
```

### Contract-style implementation

```typescript
/**
 * @architect
 * @architect-pattern TransformDatasetContract
 * @architect-status completed
 * @architect-role contract
 */
export function transformToPatternGraph(input: TransformInput): PatternGraph { ... }
```

For the exact live registry, regenerate docs and read [../docs-live/TAXONOMY.md](../docs-live/TAXONOMY.md).

---

## Unified Config File

The `defineConfig()` function centralizes taxonomy, sources, output, and generator overrides in a single `architect.config.ts` file. CLI tools discover this file automatically.

### Discovery Order

1. Current directory: check `architect.config.ts`, then `.js`
2. Walk up to repo root (`.git` folder), checking each directory
3. Fall back to the default role set (3 roles, `@architect-` prefix)

### Config File Format

```typescript
// architect.config.ts
import { defineConfig } from '@libar-dev/architect/config';

export default defineConfig({
  roles: DEFAULT_ROLES,
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
  roles: DEFAULT_ROLES,
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
        └── architect.config.ts  # Package: libar-generic
```

CLI tools use the nearest config file to the working directory.

---

## Custom Configuration

### Custom Tag Prefix

Keep a role set's taxonomy but change the prefix:

```typescript
export default defineConfig({
  roles: DEFAULT_ROLES,
  tagPrefix: '@team-',
  fileOptInTag: '@team',
  sources: { typescript: ['src/**/*.ts'] },
});

// Your annotations:
// /** @team */
// /** @team-pattern DualSourceExtractor */
// /** @team-core */
```

### Custom Roles

Define your own role set:

```typescript
export default defineConfig({
  tagPrefix: '@architect-',
  fileOptInTag: '@architect',
  roles: [
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
