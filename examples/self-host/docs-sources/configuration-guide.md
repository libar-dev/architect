## Quick Reference

| Role Set          | Import                                                | Use Case                                                                             |
| ----------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Built-in defaults | Omit `roles`                                          | General projects that only need `core`, `api`, and `infra`                           |
| DDD / ES / CQRS   | `DDD_ES_CQRS_ROLES` from `@libar-dev/architect/roles` | Projects that need aggregates, projections, sagas, deciders, CQRS, and related roles |
| Custom            | Inline `RoleDefinition[]`                             | Teams with their own role vocabulary or ordering                                     |

```typescript
// architect.config.ts
import { defineConfig } from '@libar-dev/architect/config';

// Omit roles to use the built-in DEFAULT_ROLES set.
export default defineConfig({
  sources: {
    typescript: ['src/**/*.ts'],
    features: ['architect/specs/*.feature'],
  },
  output: { directory: 'docs-live', overwrite: true },
});
```

---

## Choosing a Role Set

### Built-in Defaults

If you omit `roles`, Architect uses `DEFAULT_ROLES` automatically:

- `core`
- `api`
- `infra`

This keeps setup minimal for general TypeScript projects.

### Extended DDD / Event Sourcing Roles

Use the public `@libar-dev/architect/roles` entrypoint when you need richer role modeling:

```typescript
import { defineConfig } from '@libar-dev/architect/config';
import { DDD_ES_CQRS_ROLES } from '@libar-dev/architect/roles';

export default defineConfig({
  roles: DDD_ES_CQRS_ROLES,
  sources: {
    typescript: ['src/**/*.ts'],
    features: ['architect/specs/*.feature'],
  },
});
```

Use this when your codebase benefits from role tags such as `aggregate`, `projection`,
`decider`, `saga`, `command`, or `read-model`.

### Custom Roles

Define your own role taxonomy when neither built-in set matches your project:

```typescript
import { defineConfig } from '@libar-dev/architect/config';

export default defineConfig({
  roles: [
    { tag: 'scanner', domain: 'Scanner', priority: 1, description: 'File discovery' },
    { tag: 'extractor', domain: 'Extractor', priority: 2, description: 'Pattern extraction' },
    { tag: 'generator', domain: 'Generator', priority: 3, description: 'Document generation' },
  ],
  sources: { typescript: ['src/**/*.ts'] },
});
```

---

## Unified Config File

`defineConfig()` centralizes role selection, sources, output, and generator overrides in a
single `architect.config.ts` file. CLI tools discover this file automatically.

### Discovery Order

1. Current directory: check `architect.config.ts`, then `.js`
2. Walk up to repo root (`.git` folder), checking each directory
3. Fall back to built-in defaults (`DEFAULT_ROLES`, empty sources, `docs-live` output)

### Config File Format

```typescript
import { defineConfig } from '@libar-dev/architect/config';
import { DDD_ES_CQRS_ROLES } from '@libar-dev/architect/roles';

export default defineConfig({
  roles: DDD_ES_CQRS_ROLES,
  sources: {
    typescript: ['src/**/*.ts'],
    stubs: ['architect/stubs/**/*.ts'],
    features: ['architect/specs/*.feature'],
    exclude: ['dist/**'],
  },
  output: {
    directory: 'docs-live',
    overwrite: true,
  },
});
```

### Sources Configuration

| Field        | Type       | Description                                                        |
| ------------ | ---------- | ------------------------------------------------------------------ |
| `typescript` | `string[]` | Glob patterns for TypeScript source files                          |
| `features`   | `string[]` | Glob patterns for Gherkin feature files                            |
| `stubs`      | `string[]` | Glob patterns for design stub files merged into TypeScript sources |
| `exclude`    | `string[]` | Glob patterns excluded from all scanning                           |

No parent directory traversal (`..`) is allowed in globs.

### Output Configuration

| Field       | Type      | Default       | Description                         |
| ----------- | --------- | ------------- | ----------------------------------- |
| `directory` | `string`  | `'docs-live'` | Output directory for generated docs |
| `overwrite` | `boolean` | `false`       | Overwrite existing files            |

### Generator Overrides

Use `generatorOverrides` when a generator needs different sources than the base config:

```typescript
export default defineConfig({
  sources: {
    typescript: ['src/**/*.ts'],
    features: ['architect/specs/*.feature'],
  },
  generatorOverrides: {
    changelog: {
      additionalFeatures: ['architect/releases/*.feature'],
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
| `replaceFeatures`    | Feature globs used instead of base features          |
| `outputDirectory`    | Override output directory for this generator         |

`replaceFeatures` and `additionalFeatures` are mutually exclusive when both are non-empty.

---

## Monorepo Setup

```text
my-monorepo/
  architect.config.ts          # Repo-level roles and source globs
  packages/
    my-package/
      architect.config.ts      # Package-level roles and source globs
```

CLI tools use the nearest config file to the working directory, so a monorepo root and a
workspace package can each define their own delivery process independently.

---

## Custom Prefixes and Opt-in Tags

Role selection is independent from tag prefix customization:

```typescript
export default defineConfig({
  tagPrefix: '@team-',
  fileOptInTag: '@team',
  roles: [{ tag: 'service', domain: 'Service', priority: 1, description: 'Core services' }],
  sources: { typescript: ['src/**/*.ts'] },
});

// Your annotations:
// /** @team */
// /** @team-pattern BillingService */
// /** @team-role:service */
```

---

## Programmatic Config Loading

```typescript
import { loadProjectConfig, mergeSourcesForGenerator } from '@libar-dev/architect/config';

const result = await loadProjectConfig(process.cwd());

if (!result.ok) {
  console.error(result.error.message);
  process.exit(1);
}

const resolved = result.value;
const effectiveSources = mergeSourcesForGenerator(
  resolved.project.sources,
  'changelog',
  resolved.project.generatorOverrides
);
```

The resolved config carries both the runtime `ArchitectInstance` and the fully merged
project-level sources/output settings used by the CLI and generators.
