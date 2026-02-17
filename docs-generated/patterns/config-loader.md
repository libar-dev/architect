# ✅ Config Loader

**Purpose:** Detailed documentation for the Config Loader pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Discovers and loads `delivery-process.config.ts` files for hierarchical configuration.
Supports package-level and repo-level configuration inheritance.

### When to Use

- When CLI tools need to load project configuration automatically
- When implementing custom tooling that respects project config
- When testing configuration loading in different directory structures

### Discovery Strategy

1. Look for `delivery-process.config.ts` in current directory
2. Walk up parent directories until repo root (contains .git)
3. Stop at first config found or fall back to default

### Config File Format

Config files should export a `DeliveryProcessInstance`:

```typescript
import { createDeliveryProcess } from '@libar-dev/delivery-process';

export default createDeliveryProcess({ preset: "libar-generic" });
```

## Implementations

Files that implement this pattern:

- [`config-loader.feature`](../../tests/features/config/config-loader.feature) - The config loader discovers and loads `delivery-process.config.ts` files

---

[← Back to Pattern Registry](../PATTERNS.md)
