# 🚧 Define Config

**Purpose:** Detailed documentation for the Define Config pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Core |

## Description

Identity function for type-safe project configuration.
Follows the Vite/Vitest `defineConfig()` convention:
returns the input unchanged, providing only TypeScript type checking.

Validation happens later at load time via Zod schema in `loadProjectConfig()`.

### When to Use

In `delivery-process.config.ts` at project root:

```typescript
import { defineConfig } from '@libar-dev/delivery-process/config';

export default defineConfig({
  preset: 'ddd-es-cqrs',
  sources: { typescript: ['src/** /*.ts'] },
});
```

---

[← Back to Pattern Registry](../PATTERNS.md)
