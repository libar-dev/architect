# ✅ Shared Codec Schema

**Purpose:** Detailed documentation for the Shared Codec Schema pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Provides a simplified RenderableDocument output schema for use with
Zod 4 codecs. The simplification (using z.any() for recursive fields)
avoids complex recursive type issues at the codec boundary while
maintaining type safety in the rest of the system.

### Why z.any() for sections?

Zod's recursive schemas with z.lazy() cause type inference issues
when used with z.codec(). The full RenderableDocumentSchema from
schema.ts works fine for validation, but causes the codec's decode()
return type to become `any`. Using a simplified schema here keeps
codec return types clean while still validating the structure.

---

[← Back to Pattern Registry](../PATTERNS.md)
