# ✅ Public API

**Purpose:** Detailed documentation for the Public API pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Main entry point for the @libar-dev/delivery-process package.
Exports the three-stage pipeline (Scanner → Extractor → Generator) for
extracting documentation directly from TypeScript source code.

**Key Features:**
- Three-stage pipeline: Scanner → Extractor → Generator
- Tag-based categorization with priority inference
- Composable section-based document generation
- JSON-configurable generators

### When to Use

- Use when importing the package's public API in client code
- Use for accessing scanner, extractor, and generator modules

---

[← Back to Pattern Registry](../PATTERNS.md)
