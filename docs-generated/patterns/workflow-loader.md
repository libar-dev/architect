# ✅ Workflow Loader

**Purpose:** Detailed documentation for the Workflow Loader pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Config |

## Description

Provides the default 6-phase workflow as an inline constant and loads
custom workflow overrides from JSON files via `--workflow <path>`.

### When to Use

- Use `loadDefaultWorkflow()` at pipeline startup (synchronous, infallible)
- Use `loadWorkflowFromPath()` for custom `--workflow <file>` overrides

---

[← Back to Pattern Registry](../PATTERNS.md)
