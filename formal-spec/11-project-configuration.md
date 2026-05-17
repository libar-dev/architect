# 11 — Project Configuration

> **Architect Spec v0.2.0** — The `architect.config.ts` format, role sets, and project layout.

---

## Overview

Every project using the Architect Spec has a configuration file at the repository root
that defines source locations, output preferences, tag taxonomy, and processing options.

## Configuration File

The configuration file MUST be named `architect.config.ts` and located at the repository
root. It exports a configuration object using the `defineConfig()` helper.

```typescript
import { DEFAULT_ROLES, defineConfig } from '@libar-dev/architect-core';

export default defineConfig({
  roles: DEFAULT_ROLES,
  sources: {
    typescript: ['src/**/*.ts'],
    stubs: ['architect/stubs/**/*.ts'],
    features: [
      'architect/specs/*.feature',
      'architect/decisions/*.feature',
      'architect/releases/*.feature',
    ],
  },
  output: {
    directory: 'docs-live',
    overwrite: true,
  },
});
```

## Configuration Schema

### Top-Level Fields

| Field                   | Type             | Required | Default                                        | Description                     |
| ----------------------- | ---------------- | -------- | ---------------------------------------------- | ------------------------------- |
| `roles`                 | RoleDefinition[] | SHOULD   | `DEFAULT_ROLES`                                | Role set for classification     |
| `sources`               | SourceConfig     | MUST     | —                                              | Source file glob patterns       |
| `output`                | OutputConfig     | SHOULD   | `{ directory: 'docs-live', overwrite: false }` | Output configuration            |
| `project`               | ProjectConfig    | MAY      | —                                              | Project metadata                |
| `generators`            | string[]         | MAY      | all                                            | Which generators to run         |
| `generatorOverrides`    | object           | MAY      | —                                              | Per-generator source overrides  |
| `projectionOptions`     | object           | MAY      | —                                              | Per-projection options          |
| `referenceDocConfigs`   | object[]         | MAY      | —                                              | Reference documentation configs |
| `contextInferenceRules` | object[]         | MAY      | —                                              | Custom context inference        |
| `workflowPath`          | string           | MAY      | —                                              | Custom workflow definition path |

### Source Configuration

```typescript
sources: {
  // TypeScript files with @architect-* JSDoc annotations
  typescript: string[];    // Glob patterns, e.g., ['src/**/*.ts']

  // Design stubs (not compiled/linted)
  stubs: string[];         // e.g., ['architect/stubs/**/*.ts']

  // Gherkin feature files (specs, ADRs, releases)
  features: string[];      // e.g., ['architect/specs/*.feature']

  // Files to exclude from processing
  exclude?: string[];      // e.g., ['**/*.test.ts', '**/*.spec.ts']
}
```

**Source types determine extraction behavior:**

| Source Type  | Extraction     | Tags From                      | Produces                                     |
| ------------ | -------------- | ------------------------------ | -------------------------------------------- |
| `typescript` | JSDoc parser   | `/** @architect-* */` comments | Patterns with code shapes                    |
| `stubs`      | JSDoc parser   | `/** @architect-* */` comments | Stub patterns with interfaces                |
| `features`   | Gherkin parser | `@architect-*` Gherkin tags    | Patterns with rules, scenarios, deliverables |

### Output Configuration

```typescript
output: {
  directory: string;     // Output directory for generated docs (e.g., 'docs-live')
  overwrite?: boolean;   // Whether to overwrite existing files (default: false)
}
```

### Project Metadata

```typescript
project: {
  name?: string;         // Project display name
  description?: string;  // Project description
  version?: string;      // Project version
}
```

## Role Sets

Role sets provide default tag taxonomies and configuration values for common project types.

### Default Role Set

A general-purpose role set suitable for most TypeScript projects:

- Standard `@architect-*` tag prefix
- Canonical roles for common application and infrastructure patterns
- 4 FSM states: roadmap, active, completed, deferred
- 4 priority levels: critical, high, medium, low
- Standard effort format (hours/days/weeks)

### Extended DDD Role Set

Extended role set for Domain-Driven Design projects with event sourcing and CQRS:

- All default roles plus DDD-specific roles
- Architecture roles: aggregate, entity, value-object, domain-service, repository, factory, event, command, query, projection, saga, policy
- Bounded context validation
- Sequence diagram support for saga orchestration

## Tag Taxonomy Customization

Projects customize their role taxonomy through the configuration:

```typescript
export default defineConfig({
  // Replace the default role set when you need project-specific roles
  roles: [
    { tag: 'core', domain: 'Core', priority: 1 },
    { tag: 'api', domain: 'API', priority: 2 },
    { tag: 'infra', domain: 'Infrastructure', priority: 3 },
  ],
});
```

A project MAY additionally maintain an informative `architect/tag-taxonomy.md`
document describing its role taxonomy, but the configuration above is the source of
truth. The reference implementation surfaces the taxonomy via
`architect:query taxonomy` rather than a static file.

## Canonical Project Layout

A fully configured project follows this layout:

```
project-root/
  architect/
    specs/                  # Feature specifications (.feature), grouped
      <group>/              # Domain area, bounded context, or feature family
        <feature>.feature   # Candidate, plan-level, or design-level specs
      feature-inventory.md  # Optional: human-readable feature inventory
    decisions/              # Architecture Decision Records (.feature)
      adr-001-title.feature
    stubs/                  # Design stubs (.ts, ephemeral)
      <pattern-name>/
        module.ts
    releases/               # Release manifests (.feature)
      vNEXT.feature
    briefs/                 # Optional: pre-candidate briefs (.md)
      pattern-name.md
    design-reviews/         # Optional: design review artifacts
    tag-taxonomy.md         # OPTIONAL: tag taxonomy reference (informative)
  architect.config.ts       # Configuration file
  docs-live/                # Generated documentation (output)
    INDEX.md
    PATTERNS.md
    DECISIONS.md
    BUSINESS-RULES.md
    ARCHITECTURE.md
    TAXONOMY.md
  tests/
    features/               # Executable specs (.feature + step defs, permanent)
      <group>/              # Same grouping as architect/specs/
        <feature>.feature
        <feature>.steps.ts
  src/                      # Implementation source code
    ...
```

### Ephemeral vs. Permanent Directories

| Directory              | Lifecycle                                           | Content                             |
| ---------------------- | --------------------------------------------------- | ----------------------------------- |
| `architect/specs/`     | **Ephemeral** — specs deleted during implementation | Candidate, plan, design specs       |
| `architect/stubs/`     | **Ephemeral** — stubs deleted during implementation | Interface definitions               |
| `architect/decisions/` | **Permanent**                                       | ADRs (historical record)            |
| `tests/features/`      | **Permanent** — created during implementation       | Executable specs + step definitions |

### Required Directories

| Directory              | Required | Purpose                                              |
| ---------------------- | -------- | ---------------------------------------------------- |
| `architect/`           | MUST     | Root for all architect artifacts                     |
| `architect/specs/`     | MUST     | Feature specifications (grouped into subdirectories) |
| `architect/decisions/` | SHOULD   | ADRs (if decisions are tracked)                      |
| `architect/stubs/`     | SHOULD   | Design stubs (if design-level specs exist)           |
| `architect/releases/`  | MAY      | Release manifests                                    |
| `tests/features/`      | SHOULD   | Executable specs (if implementation exists)          |

### Optional Directories

| Directory                   | Purpose                                |
| --------------------------- | -------------------------------------- |
| `architect/briefs/`         | Pre-candidate Markdown briefs          |
| `architect/design-reviews/` | Design review artifacts and checklists |
| `docs-live/`                | Generated documentation output         |

## Generator Configuration

Generators produce documentation from the pattern graph. The `generators` field controls
which generators run:

```typescript
generators: [
  'patterns',        // Pattern inventory
  'requirements',    // Product requirements
  'business-rules',  // Business rules aggregation
  'decisions',       // Architecture decisions
  'architecture',    // Architecture overview with diagrams
  'taxonomy',        // Tag taxonomy reference
  'index',           // Navigation index
],
```

Each generator corresponds to one or more projections (§12 — Live Documentation API).
Per-generator options can be set via `projectionOptions`:

```typescript
projectionOptions: {
  index: {
    preamble: '...custom preamble text...',
    documentEntries: [
      { title: 'Patterns', path: 'PATTERNS.md', description: '...', audience: 'all' },
      { title: 'Decisions', path: 'DECISIONS.md', description: '...', audience: 'architects' },
    ],
  },
},
```

## Minimal Configuration

The simplest valid configuration for a new project:

```typescript
import { DEFAULT_ROLES, defineConfig } from '@libar-dev/architect-core';

export default defineConfig({
  roles: DEFAULT_ROLES,
  sources: {
    typescript: ['src/**/*.ts'],
    features: ['architect/specs/*.feature'],
  },
});
```

This uses the default role set and outputs to `docs-live/`.
