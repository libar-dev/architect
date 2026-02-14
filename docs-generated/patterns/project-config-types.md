# 🚧 Project Config Types

**Purpose:** Detailed documentation for the Project Config Types pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Core |

## Description

Unified project configuration for the delivery-process package.
Replaces the fragmented system where taxonomy, source discovery,
and output config lived in three disconnected layers.

### Architecture

```
defineConfig() → raw DeliveryProcessProjectConfig
    ↓
loadProjectConfig() → validates (Zod) → resolveProjectConfig()
    ↓
ResolvedConfig { instance, project }
    ↓
mergeSourcesForGenerator() → per-generator effective sources
```

### When to Use

- Define project config in `delivery-process.config.ts`
- Internal resolution via `resolveProjectConfig()`
- CLI override merging

---

[← Back to Pattern Registry](../PATTERNS.md)
