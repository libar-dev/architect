# ✅ Configuration Defaults

**Purpose:** Detailed documentation for the Configuration Defaults pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

## Configuration Defaults

Centralized default constants for the delivery-process package.
These defaults are used when no custom configuration or registry is provided.

### Why Centralize?

Previously, the default tag prefix string `"@libar-docs-"` appeared in 6+ files.
Centralizing eliminates duplication and provides a single source of truth.

### When to Use

- Import these defaults when implementing functions that need fallback values
- Use `DEFAULT_REGEX_BUILDERS` for opt-in detection when no registry is provided
- Use `DEFAULT_TAG_PREFIX` in error messages when no registry context exists

---

[← Back to Pattern Registry](../PATTERNS.md)
