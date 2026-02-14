# 🚧 Project Config Schema

**Purpose:** Detailed documentation for the Project Config Schema pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Core |

## Description

Zod validation schema for `DeliveryProcessProjectConfig`.
Validates at load time (not at `defineConfig()` call time)
following the Vite/Vitest identity-function convention.

### Validation Rules

- At least one TypeScript source glob when `sources` is provided
- No parent directory traversal in glob patterns (security)
- Preset name must be one of the known presets
- `replaceFeatures` and `additionalFeatures` are mutually exclusive

---

[← Back to Pattern Registry](../PATTERNS.md)
