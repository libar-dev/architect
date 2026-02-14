# ✅ ADR 002 Progressive Disclosure Architecture

**Purpose:** Detailed documentation for the ADR 002 Progressive Disclosure Architecture pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | DDD |
| Phase | 43 |

## Description

**Context:**
  Single-file PRD documentation became unwieldy at scale.
  - PRODUCT-REQUIREMENTS.md grew to 2143 lines
  - Stakeholders overwhelmed by inline acceptance criteria
  - Navigation difficult without table of contents
  - Large product areas dominated the document
  - Hard to find specific features in massive single file

  **Decision:**
  Implement progressive disclosure pattern for generated documentation:
  - Executive summary with product area navigation in main file
  - Detail files per product area (always created when enabled)
  - Binary toggle: enabled creates all detail files, disabled inlines all
  - No thresholds - consistent behavior regardless of item count
  - Multi-file output via context.additionalFiles API

  **Update 2026-01-18:** Removed threshold-based splitting. Original design used
  splitThreshold to inline small categories, but this created inconsistent behavior.
  Patterns and Requirements codecs used binary generateDetailFiles, while ADR codec
  had threshold logic. Unified to binary pattern for consistency.

  **Consequences:**
  - (+) Main PRD becomes scannable executive summary
  - (+) Stakeholders can navigate to specific areas
  - (+) Consistent behavior: enabled = all files, disabled = all inline
  - (+) Progressive detail: summary → full specs
  - (+) Pattern reusable for other generators (ADRs, etc.)
  - (+) Simpler API - no threshold configuration needed
  - (-) Multiple files to maintain
  - (-) Small categories also get their own files (acceptable trade-off)
  - (-) Requires INDEX.md to explain file organization

## Acceptance Criteria

**All product areas split to detail files when enabled**

- Given any product area with features
- When generating PRD with progressive disclosure enabled
- Then requirements/[ProductArea].md is created for each area
- And main PRD links to detail file

---

[← Back to Pattern Registry](../PATTERNS.md)
