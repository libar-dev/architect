# Configuration Guide

This guide covers the configuration system for `@libar-dev/delivery-process`, including presets, custom tag prefixes, and programmatic usage.

---

## Table of Contents

- [Import Paths](#import-paths)
- [Quick Start](#quick-start)
- [Available Presets](#available-presets)
- [Hierarchical Configuration](#hierarchical-configuration)
- [Custom Configuration](#custom-configuration)
- [RegexBuilders API](#regexbuilders-api)
- [CLI Integration](#cli-integration)
- [Migration Guide](#migration-guide)

---

## Import Paths

The Configuration API is available from two import paths:

| Import Path | Recommended | Description |
|-------------|-------------|-------------|
| `@libar-dev/delivery-process` | ✅ **Yes** | Main entry point (canonical) |
| `@libar-dev/delivery-process/config` | For specific use cases | Dedicated config module |

### Canonical Import (Recommended)

```typescript
import {
  createDeliveryProcess,
  GENERIC_PRESET,
  DDD_ES_CQRS_PRESET,
  type DeliveryProcessConfig,
  type DeliveryProcessInstance
} from '@libar-dev/delivery-process';
```

### Dedicated Config Path

Use the `/config` subpath when you need fine-grained tree-shaking or are building tooling that only needs configuration:

```typescript
import {
  createDeliveryProcess,
  PRESETS
} from '@libar-dev/delivery-process/config';
```

> **Note:** Both paths export the same API. The main entry point is recommended for most use cases as it provides consistent imports across the codebase.

---

## Quick Start

The package provides a `createDeliveryProcess()` factory function for creating configured instances:

```typescript
import { createDeliveryProcess } from '@libar-dev/delivery-process';

// Option 1: Use defaults (DDD-ES-CQRS preset with @libar-docs- prefix)
const dp = createDeliveryProcess();

// Option 2: Use generic preset (simpler taxonomy with @docs- prefix)
const dp = createDeliveryProcess({ preset: "generic" });

// Option 3: Use libar-generic preset (simpler taxonomy, same @libar-docs- prefix)
const dp = createDeliveryProcess({ preset: "libar-generic" });

// Option 4: Custom prefix with DDD taxonomy
const dp = createDeliveryProcess({
  preset: "ddd-es-cqrs",
  tagPrefix: "@my-project-",
  fileOptInTag: "@my-project"
});
```

### Four Usage Modes

| Mode | Options | Tag Prefix | Categories |
|------|---------|------------|------------|
| **Default** | `{}` or none | `@libar-docs-` | 21 DDD categories |
| **Generic Preset** | `{ preset: "generic" }` | `@docs-` | 3 basic categories |
| **Libar Generic** | `{ preset: "libar-generic" }` | `@libar-docs-` | 3 basic categories |
| **Custom** | Explicit options | Your choice | Your choice |

---

## Available Presets

### GENERIC_PRESET

Minimal preset for simple documentation needs.

| Property | Value |
|----------|-------|
| **Tag Prefix** | `@docs-` |
| **File Opt-In** | `@docs` |
| **Categories** | 3 (core, api, infra) |

**Use when:**
- Simple projects without DDD architecture
- Basic pattern tracking needs
- You want minimal overhead

**Example usage:**

```typescript
import { createDeliveryProcess, GENERIC_PRESET } from '@libar-dev/delivery-process';

const dp = createDeliveryProcess({ preset: "generic" });

// Your code annotations use @docs- prefix:
// /** @docs */
// /** @docs-pattern MyPattern */
// /** @docs-status completed */
```

**Categories in Generic Preset:**

| Tag | Domain | Priority |
|-----|--------|----------|
| `@docs-core` | Core | 1 |
| `@docs-api` | API | 2 |
| `@docs-infra` | Infrastructure | 3 |

---

### LIBAR_GENERIC_PRESET

Same minimal categories as GENERIC_PRESET but with `@libar-docs-` prefix.

| Property | Value |
|----------|-------|
| **Tag Prefix** | `@libar-docs-` |
| **File Opt-In** | `@libar-docs` |
| **Categories** | 3 (core, api, infra) |

**Use when:**
- Projects already using `@libar-docs-` tags
- Package-level configuration with simplified categories
- Gradual adoption without tag migration

**Example usage:**

```typescript
import { createDeliveryProcess, LIBAR_GENERIC_PRESET } from '@libar-dev/delivery-process';

const dp = createDeliveryProcess({ preset: "libar-generic" });

// Your code annotations use @libar-docs- prefix with 3 categories:
// /** @libar-docs */
// /** @libar-docs-pattern MyPattern */
// /** @libar-docs-core */
```

**Categories in Libar Generic Preset:**

| Tag | Domain | Priority |
|-----|--------|----------|
| `@libar-docs-core` | Core | 1 |
| `@libar-docs-api` | API | 2 |
| `@libar-docs-infra` | Infrastructure | 3 |

---

### DDD_ES_CQRS_PRESET

Full taxonomy for DDD/Event Sourcing/CQRS architectures. **This is the default preset.**

| Property | Value |
|----------|-------|
| **Tag Prefix** | `@libar-docs-` |
| **File Opt-In** | `@libar-docs` |
| **Categories** | 21 (full DDD taxonomy) |

**Use when:**
- Building DDD architectures
- Event sourcing implementations
- CQRS patterns
- Full roadmap/phase tracking
- Enterprise-scale projects

**Example usage:**

```typescript
import { createDeliveryProcess } from '@libar-dev/delivery-process';

// These are equivalent:
const dp1 = createDeliveryProcess();
const dp2 = createDeliveryProcess({ preset: "ddd-es-cqrs" });

// Your code annotations use @libar-docs- prefix:
// /** @libar-docs */
// /** @libar-docs-pattern DeciderPattern */
// /** @libar-docs-event-sourcing */
```

**Key Categories in DDD Preset:**

| Tag | Domain | Priority |
|-----|--------|----------|
| `@libar-docs-domain` | Strategic DDD | 1 |
| `@libar-docs-ddd` | Domain-Driven Design | 2 |
| `@libar-docs-bounded-context` | Bounded Context | 3 |
| `@libar-docs-event-sourcing` | Event Sourcing | 4 |
| `@libar-docs-decider` | Decider | 5 |
| `@libar-docs-cqrs` | CQRS | 5 |
| `@libar-docs-projection` | Projections | 6 |
| `@libar-docs-saga` | Sagas/Workflows | 7 |
| ... | ... | ... |

> **See:** [INSTRUCTIONS.md](../INSTRUCTIONS.md) for the complete category list.

---

## Hierarchical Configuration

CLI tools automatically discover configuration via `delivery-process.config.ts` files.

### Config File Discovery

When you run a CLI tool (e.g., `lint-patterns`, `validate-patterns`), it searches for configuration:

1. Look for `delivery-process.config.ts` in the current directory
2. Walk up parent directories until a `.git` folder is found (repo root)
3. If found, load the configuration
4. If not found, use the default `DDD_ES_CQRS_PRESET`

### Config File Format

Create a `delivery-process.config.ts` file in your project root:

```typescript
import { createDeliveryProcess } from '@libar-dev/delivery-process';

export default createDeliveryProcess({ preset: "libar-generic" });
```

### Two-Level Configuration Example

For monorepos with package-level and repo-level configurations:

**Package level** (`packages/my-package/delivery-process.config.ts`):

```typescript
import { createDeliveryProcess } from '@libar-dev/delivery-process';

// Simplified 3-category taxonomy for the package
export default createDeliveryProcess({ preset: "libar-generic" });
```

**Repo level** (`delivery-process.config.ts` at repo root):

```typescript
import { createDeliveryProcess } from '@libar-dev/delivery-process';

// Full 21-category DDD taxonomy for the repo
export default createDeliveryProcess(); // Uses DDD_ES_CQRS_PRESET (default)
```

When you run CLI tools from the package directory, they use the package config.
When you run from the repo root, they use the repo-level config.

### Config Loader API

For programmatic access to the config loader:

```typescript
import { loadConfig, formatConfigError } from '@libar-dev/delivery-process/config';

const result = await loadConfig(process.cwd());

if (!result.ok) {
  console.error(formatConfigError(result.error));
  process.exit(1);
}

const { instance, isDefault, path } = result.value;
// instance.registry - the TagRegistry
// instance.regexBuilders - regex utilities
// isDefault - true if no config file was found
// path - path to the config file (if found)
```

---

## Custom Configuration

### Custom Tag Prefix

Override the tag prefix while keeping the preset's taxonomy:

```typescript
const dp = createDeliveryProcess({
  preset: "ddd-es-cqrs",  // Full 21-category taxonomy
  tagPrefix: "@acme-docs-",
  fileOptInTag: "@acme-docs"
});

// Your annotations:
// /** @acme-docs */
// /** @acme-docs-pattern MyPattern */
// /** @acme-docs-event-sourcing */
```

### Custom File Opt-In Tag

The file opt-in tag is separate from the prefix:

```typescript
const dp = createDeliveryProcess({
  tagPrefix: "@docs-",
  fileOptInTag: "@documented"  // Files must have /** @documented */ to be scanned
});
```

### Custom Categories (Advanced)

Provide your own category definitions:

```typescript
import { createDeliveryProcess, type DeliveryProcessConfig } from '@libar-dev/delivery-process';

const customConfig: DeliveryProcessConfig = {
  tagPrefix: "@team-",
  fileOptInTag: "@team",
  categories: [
    { tag: "frontend", domain: "Frontend", priority: 1, description: "UI components", aliases: ["ui"] },
    { tag: "backend", domain: "Backend", priority: 2, description: "Server code", aliases: ["server"] },
    { tag: "shared", domain: "Shared", priority: 3, description: "Shared utilities", aliases: [] },
  ]
};

// Note: For fully custom configs, use the registry directly
import { mergeTagRegistries, buildRegistry } from '@libar-dev/delivery-process';
```

---

## RegexBuilders API

The `DeliveryProcessInstance` returned by `createDeliveryProcess()` includes `regexBuilders` for tag detection:

```typescript
const dp = createDeliveryProcess({ preset: "generic" });

// Check if a file has the opt-in marker
const hasOptIn = dp.regexBuilders.hasFileOptIn(fileContent);
// Returns: true if content contains /** @docs */ (or configured opt-in)

// Check if content has any doc directives
const hasDirectives = dp.regexBuilders.hasDocDirectives(fileContent);
// Returns: true if content contains @docs-* tags

// Normalize a tag (remove @ and prefix)
const normalized = dp.regexBuilders.normalizeTag("@docs-pattern");
// Returns: "pattern"
```

### RegexBuilders Interface

```typescript
interface RegexBuilders {
  /** Pattern to match file-level opt-in (e.g., /** @docs */) */
  readonly fileOptInPattern: RegExp;

  /** Pattern to match directives (e.g., @docs-pattern, @docs-status) */
  readonly directivePattern: RegExp;

  /** Check if content has the file-level opt-in marker */
  hasFileOptIn(content: string): boolean;

  /** Check if content has any doc directives */
  hasDocDirectives(content: string): boolean;

  /** Normalize a tag by removing @ and prefix */
  normalizeTag(tag: string): string;
}
```

---

## CLI Integration

### Config File Discovery

CLI tools (`lint-patterns`, `validate-patterns`, `generate-tag-taxonomy`) automatically discover `delivery-process.config.ts`:

```bash
# CLI discovers configuration from delivery-process.config.ts
npx lint-patterns -i "src/**/*.ts"
```

Output shows which configuration is being used:

```
  Config: /path/to/delivery-process.config.ts
```

Or if no config file is found:

```
  Config: (default DDD-ES-CQRS taxonomy)
```

### Example: Package with Custom Config

1. Create `delivery-process.config.ts` in your package:

```typescript
import { createDeliveryProcess } from '@libar-dev/delivery-process';

export default createDeliveryProcess({ preset: "libar-generic" });
```

2. Run CLI tools - they automatically use your config:

```bash
cd my-package
npx lint-patterns -i "src/**/*.ts"
# Uses libar-generic preset with 3 categories
```

### Programmatic API

For advanced use cases, you can also use the programmatic API:

```typescript
import {
  createDeliveryProcess,
  scanPatterns,
  extractPatterns
} from '@libar-dev/delivery-process';

// Create configured instance
const dp = createDeliveryProcess({ preset: "libar-generic" });

// Use registry in scanner
const scanned = await scanPatterns(
  { patterns: ["src/**/*.ts"], baseDir: process.cwd() },
  dp.registry
);

// Extract patterns
const patterns = extractPatterns(scanned.value.files, process.cwd(), dp.registry);
```

---

## Migration Guide

### From Hardcoded to Configurable

If you're migrating code from `@libar-docs-*` to a custom prefix:

**Step 1: Update code annotations**

```typescript
// Before (hardcoded)
/** @libar-docs */
/** @libar-docs-pattern MyPattern */

// After (with generic preset)
/** @docs */
/** @docs-pattern MyPattern */
```

**Step 2: Update configuration**

```typescript
// Use the matching preset
const dp = createDeliveryProcess({ preset: "generic" });
```

**Step 3: Update scripts**

For custom prefixes, switch from CLI to programmatic API (see [CLI Integration](#cli-integration)).

### What Changes

| Component | Before | After |
|-----------|--------|-------|
| File opt-in | `@libar-docs` | Configured `fileOptInTag` |
| Tag prefix | `@libar-docs-` | Configured `tagPrefix` |
| Scanner detection | Hardcoded regex | `RegexBuilders` from config |
| Categories | 21 DDD categories | Preset or custom |

### What Stays the Same

- Metadata tag names (status, phase, pattern, etc.)
- Feature file tag format (`@libar-docs-pattern:Name`)
- Generator output structure
- Pipeline architecture

---

## Related Documentation

- **[README.md](../README.md)** - Package quick start
- **[INSTRUCTIONS.md](../INSTRUCTIONS.md)** - Complete tag reference
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Pipeline and codec architecture
