# ConfigurationReference

**Purpose:** Compact reference for Claude context
**Detail Level:** summary

---

## Overview

### Preset Quick Reference

**Context:** Three presets are available with different tag prefixes and category counts.

    **Quick Reference Table:**

| Preset | Tag Prefix | Categories | Use Case |
| --- | --- | --- | --- |
| libar-generic (default) | prefix libar-docs- | 3 | Simple projects (this package) |
| generic | prefix docs- | 3 | Simple projects with docs- prefix |
| ddd-es-cqrs | prefix libar-docs- | 21 | DDD/Event Sourcing architectures |

    **Note:** The tag prefix begins with the at-symbol followed by the shown prefix.

### Preset Category Behavior

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

### Default Preset Selection

**Context:** All entry points use consistent defaults.

    **Default Preset Table:**

| Entry Point | Default | Context |
| --- | --- | --- |
| createDeliveryProcess() | libar-generic (3 categories) | Programmatic API |
| loadConfig() fallback | libar-generic (3 categories) | CLI tools when no config file |
| This package config | libar-generic (3 categories) | Standalone package usage |

    **Rationale:** Simple defaults for most users.
    Use preset ddd-es-cqrs explicitly if you need the full 21-category DDD taxonomy.

### Libar Generic Preset

**Context:** Default preset with libar-docs- prefix and 3 categories.

| Property | Value |
| --- | --- |
| Tag Prefix | at-libar-docs- |
| File Opt-In | at-libar-docs |
| Categories | 3 (core, api, infra) |

    **Usage Example:**

    """typescript
    /**
     * at-libar-docs
     * at-libar-docs-pattern PatternScanner
     * at-libar-docs-status completed
     * at-libar-docs-core
     * at-libar-docs-uses FileDiscovery, ASTParser
     */
    export function scanPatterns(config: ScanConfig): Promise<ScanResult> {
      // Implementation
    }
    """

### Generic Preset

**Context:** Same 3 categories as libar-generic but with shorter docs- prefix.

| Property | Value |
| --- | --- |
| Tag Prefix | at-docs- |
| File Opt-In | at-docs |
| Categories | 3 (core, api, infra) |

    **Usage Example:**

    """typescript
    /**
     * at-docs
     * at-docs-pattern PatternScanner
     * at-docs-status completed
     * at-docs-core
     * at-docs-uses FileDiscovery, ASTParser
     */
    export function scanPatterns(config: ScanConfig): Promise<ScanResult> {
      // Implementation
    }
    """

### DDD ES CQRS Preset

**Context:** Full taxonomy for domain-driven architectures with 21 categories.

| Property | Value |
| --- | --- |
| Tag Prefix | at-libar-docs- |
| File Opt-In | at-libar-docs |
| Categories | 21 (domain, ddd, bounded-context, event-sourcing, decider, cqrs, etc.) |

    **When to Use:**

    - DDD architectures
    - Event sourcing projects
    - CQRS implementations
    - Full roadmap/phase tracking

### Presets

- `GENERIC_PRESET` - const
- `LIBAR_GENERIC_PRESET` - const
- `DDD_ES_CQRS_PRESET` - const
- `PresetName` - type
- `PRESETS` - const

### Factory Options

- `CreateDeliveryProcessOptions` - interface
- `createDeliveryProcess` - function

### Types

- `DeliveryProcessConfig` - interface
- `DeliveryProcessInstance` - interface
- `RegexBuilders` - interface

### Hierarchical Configuration

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
- `ConfigLoadError` - interface
- `ConfigLoadResult` - type
- `findConfigFile` - function
- `loadConfig` - function
- `formatConfigError` - function

### RegexBuilders API

**Context:** DeliveryProcessInstance includes utilities for tag detection.

    **API Methods:**

| Method | Description |
| --- | --- |
| hasFileOptIn(content) | true if content contains file opt-in marker |
| hasDocDirectives(content) | true if content contains doc directives |
| normalizeTag(tag) | Strips prefix: at-libar-docs-pattern becomes pattern |

    **Usage Example:**

    """typescript
    const dp = createDeliveryProcess(); // Uses libar-generic (default)

    // Check if file should be scanned
    dp.regexBuilders.hasFileOptIn(fileContent);  // true if contains /** at-libar-docs */

    // Check for any documentation directives
    dp.regexBuilders.hasDocDirectives(fileContent);  // true if contains at-libar-docs-*

    // Normalize tag for lookup
    dp.regexBuilders.normalizeTag('at-libar-docs-pattern');  // "pattern"
    """

### RegexBuilders

- `createRegexBuilders` - function
