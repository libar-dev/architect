# ✅ Transform Dataset

**Purpose:** Detailed documentation for the Transform Dataset pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Transforms raw extracted patterns into a MasterDataset with all pre-computed
views. This is the core of the unified transformation pipeline, computing
status groups, phase groups, quarter groups, category groups, and source
groups in a single iteration over the pattern array.

### When to Use

- Use in orchestrator after pattern extraction and merging
- Use when you need pre-computed views for multiple generators

### Key Concepts

- **Single-pass**: O(n) complexity regardless of view count
- **Immutable output**: Returns a new MasterDataset object
- **Workflow integration**: Uses workflow config for phase names

## Use Cases

- When computing all pattern views in a single pass
- When transforming raw extracted data for generators

## Implementations

Files that implement this pattern:

- [`transform-dataset.feature`](../../tests/features/behavior/transform-dataset.feature) - The transformToMasterDataset function transforms raw extracted patterns

---

[← Back to Pattern Registry](../PATTERNS.md)
