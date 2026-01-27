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

---

[← Back to Pattern Registry](../PATTERNS.md)
