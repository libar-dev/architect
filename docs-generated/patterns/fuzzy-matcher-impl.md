# 🚧 Fuzzy Matcher Impl

**Purpose:** Detailed documentation for the Fuzzy Matcher Impl pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Core |

## Description

Provides fuzzy matching for pattern names with tiered scoring:
exact (1.0) > prefix (0.9) > substring (0.7) > Levenshtein (distance-based).

No external dependencies — Levenshtein implementation is ~20 lines.

Used by:
- `search` subcommand: ranked results via fuzzyMatchPatterns()
- `pattern` subcommand: "Did you mean...?" fallback via findBestMatch()

---

[← Back to Pattern Registry](../PATTERNS.md)
