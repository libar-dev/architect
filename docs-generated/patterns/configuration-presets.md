# ✅ Configuration Presets

**Purpose:** Detailed documentation for the Configuration Presets pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

## Configuration Presets

Predefined configuration presets for common use cases.
Uses `as const satisfies` for full type inference while ensuring
configuration shape compliance.

### Available Presets

- **GENERIC_PRESET**: Minimal categories with @docs- prefix for non-DDD projects
- **LIBAR_GENERIC_PRESET**: Minimal categories with @libar-docs- prefix (for package-level config)
- **DDD_ES_CQRS_PRESET**: Full 21-category taxonomy with @libar-docs- prefix

### When to Use

- Use GENERIC_PRESET for simple documentation needs
- Use DDD_ES_CQRS_PRESET for full DDD/ES/CQRS taxonomy (default)
- Use as base for custom configurations

---

[← Back to Pattern Registry](../PATTERNS.md)
