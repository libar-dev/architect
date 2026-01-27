# ✅ Pattern Scanner

**Purpose:** Detailed documentation for the Pattern Scanner pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Discovers TypeScript files matching glob patterns and filters to only
those with `@libar-docs` opt-in. Entry point for the scanning phase.

### When to Use

- Discovering source files for documentation generation
- Checking file opt-in status before extraction
- Building file lists for batch processing

### Key Concepts

- **Opt-in Model**: Files must explicitly declare `@libar-docs` to be processed
- **Glob Patterns**: Uses glob for flexible file matching
- **Exclusion Support**: Configurable exclude patterns for node_modules, tests, etc.

## Use Cases

- When discovering TypeScript files for documentation extraction
- When filtering files by @libar-docs opt-in marker

---

[← Back to Pattern Registry](../PATTERNS.md)
