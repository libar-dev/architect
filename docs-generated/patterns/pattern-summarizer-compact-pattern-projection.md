# 📋 PatternSummarizer — Compact Pattern Projection

**Purpose:** Detailed documentation for the PatternSummarizer — Compact Pattern Projection pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | Status |

## Description

Projects the full ExtractedPattern (~3.5KB per pattern) down to a
PatternSummary (~100 bytes) for list queries. Reduces CLI output
from ~594KB to ~4KB for typical codebases.

Uses Zod schema-first pattern: PatternSummarySchema defines the type,
and PatternSummary is inferred from it.

Target: src/api/summarize.ts
See: DataAPIOutputShaping spec, Rule 1 (Pattern Summarization)
Since: DS-A

---

[← Back to Pattern Registry](../PATTERNS.md)
