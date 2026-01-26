# ✅ Master Dataset

**Purpose:** Detailed documentation for the Master Dataset pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

## MasterDataset - Unified Pattern Views Schema

Defines the schema for a pre-computed dataset that holds all extracted patterns
along with derived views (by status, phase, quarter, category, source). This enables
single-pass transformation instead of redundant filtering in each section renderer.

### When to Use

- Use when sections need filtered/grouped pattern views
- Use when computing aggregate statistics across patterns
- Use as input to report-specific codecs (RoadmapReport, TimelineReport, etc.)

### Key Concepts

- **Single-pass computation**: All views computed in one iteration over patterns
- **Pre-computed groups**: Status, phase, quarter, category, source groupings
- **Aggregate statistics**: Counts, completion percentages, phase/category counts
- **Type-safe views**: All views are typed via Zod schema inference

## Use Cases

- When providing pre-computed views to section renderers
- When eliminating redundant filtering across generators

---

[← Back to Pattern Registry](../PATTERNS.md)
