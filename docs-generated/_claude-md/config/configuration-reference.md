# ConfigurationReference

**Purpose:** Compact reference for Claude context
**Detail Level:** summary

---

## Overview

### Quick Reference

**Context:** Three presets are available with different tag prefixes and category counts.

    **Quick Reference Table:**

| Preset | Tag Prefix | Categories | Use Case |
| --- | --- | --- | --- |
| libar-generic (default) | prefix libar-docs- | 3 | Simple projects (this package) |
| generic | prefix docs- | 3 | Simple projects with docs- prefix |
| ddd-es-cqrs | prefix libar-docs- | 21 | DDD/Event Sourcing architectures |

    **Note:** The tag prefix begins with the at-symbol followed by the shown prefix.

### Category Behavior

**Context:** Presets define complete category sets that replace base taxonomy.

    **Category Replacement Behavior:**

| Preset | Categories | Count |
| --- | --- | --- |
| generic | core, api, infra | 3 |
| libar-generic | core, api, infra | 3 |
| ddd-es-cqrs | Full DDD taxonomy | 21 |

    **Design Decision:** Preset categories REPLACE base taxonomy (not merged).
    If you need DDD categories (ddd, event-sourcing, cqrs, saga, projection, decider, etc.),
    use the ddd-es-cqrs preset explicitly.

### Default Preset

**Context:** All entry points use consistent defaults.

    **Default Preset Table:**

| Entry Point | Default | Context |
| --- | --- | --- |
| createDeliveryProcess() | libar-generic (3 categories) | Programmatic API |
| loadConfig() fallback | libar-generic (3 categories) | CLI tools when no config file |
| This package config | libar-generic (3 categories) | Standalone package usage |

    **Rationale:** Simple defaults for most users.
    Use preset ddd-es-cqrs explicitly if you need the full 21-category DDD taxonomy.

### Presets

- `PresetName` - type
- `PRESETS` - const

### Factory Options

- `CreateDeliveryProcessOptions` - interface
- `createDeliveryProcess` - function

### Types

- `DeliveryProcessConfig` - interface
- `DeliveryProcessInstance` - interface
- `RegexBuilders` - interface

### Discovery Order

**Context:** CLI tools discover config files automatically via directory traversal.

    **Discovery Order:**

| Step | Action |
| --- | --- |
| 1 | Look for delivery-process.config.ts in current directory |
| 2 | Walk up parent directories until repo root (.git folder) |
| 3 | Fall back to libar-generic preset (3 categories) |

    **Config File Variants:**

| File Name | Notes |
| --- | --- |
| delivery-process.config.ts | TypeScript config (primary) |
| delivery-process.config.js | JavaScript config (pre-compiled) |

### Config Loader

- `ConfigDiscoveryResult` - interface
- `loadConfig` - function
- `findConfigFile` - function

### RegexBuilders

- `createRegexBuilders` - function
