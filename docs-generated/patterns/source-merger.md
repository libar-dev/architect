# 🚧 Source Merger

**Purpose:** Detailed documentation for the Source Merger pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Core |

## Description

Computes effective sources for a specific generator by applying
per-generator overrides to the base resolved sources.

### Override Semantics

- `replaceFeatures` (non-empty): Used INSTEAD of base features
- `additionalFeatures`: Appended to base features (ignored if `replaceFeatures` is set)
- `additionalInput`: Appended to base TypeScript sources
- `exclude`: Always inherited from base (no override mechanism)

### When to Use

Called by the orchestrator before invoking each generator, so that
generators like `changelog` can pull from different feature sets
than the base config specifies.

---

[← Back to Pattern Registry](../PATTERNS.md)
