# 🚧 Config Resolver

**Purpose:** Detailed documentation for the Config Resolver pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Core |

## Description

Resolves a raw `DeliveryProcessProjectConfig` into a fully-resolved `ResolvedConfig`
with all defaults applied, stubs merged into TypeScript sources, and context inference
rules prepended to defaults.

### Architecture

```
DeliveryProcessProjectConfig (user-authored)
    |
    v
resolveProjectConfig() -- creates instance, merges sources, applies defaults
    |
    v
ResolvedConfig { instance, project, isDefault, configPath }
```

### When to Use

- Called by `loadProjectConfig()` after Zod validation succeeds
- Called directly in tests to resolve a config without file I/O
- `createDefaultResolvedConfig()` provides a fallback when no config file exists

---

[← Back to Pattern Registry](../PATTERNS.md)
