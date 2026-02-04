# ✅ Codec Base Options

**Purpose:** Detailed documentation for the Codec Base Options pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Shared types, interfaces, and utilities for all document codecs.
Individual codec files define their own specific option types that extend BaseCodecOptions.

### When to Use

- When creating custom codec options that extend the base
- When implementing new codecs that need standard configuration
- When importing shared types like DetailLevel or NormalizedStatusFilter

---

[← Back to Pattern Registry](../PATTERNS.md)
