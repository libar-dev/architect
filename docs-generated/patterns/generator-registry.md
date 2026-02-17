# ✅ Generator Registry

**Purpose:** Detailed documentation for the Generator Registry pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Generator |

## Description

Manages registration and lookup of document generators (both built-in and custom).
Uses explicit registration pattern for transparency and debuggability.

### When to Use

- Registering built-in generators on module import
- Registering custom generators from user code
- Looking up generators by name in the CLI

### Key Concepts

- **Singleton:** Single global instance shared across the package
- **Explicit Registration:** No auto-discovery, transparent registration
- **Name Uniqueness:** Prevents duplicate generator names

## Implementations

Files that implement this pattern:

- [`registry.feature`](../../tests/features/generators/registry.feature) - Tests the GeneratorRegistry registration, lookup, and listing capabilities.

---

[← Back to Pattern Registry](../PATTERNS.md)
