# 🚧 Pattern Summarizer Impl

**Purpose:** Detailed documentation for the Pattern Summarizer Impl pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Core |

## Description

Projects the full ExtractedPattern (~3.5KB per pattern) down to a
PatternSummary (~100 bytes) for list queries. Reduces CLI output
from ~594KB to ~4KB for typical codebases.

Uses Zod schema-first pattern: PatternSummarySchema defines the type,
and PatternSummary is inferred from it.

---

[← Back to Pattern Registry](../PATTERNS.md)
