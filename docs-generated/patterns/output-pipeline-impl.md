# 🚧 Output Pipeline Impl

**Purpose:** Detailed documentation for the Output Pipeline Impl pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Core |

## Description

Post-processing pipeline that transforms raw API results into shaped CLI output.
Applies output modifiers (--names-only, --count, --fields, --full) and wraps
results in QueryResult envelopes.

Architecture decision: This is a single post-processing function, NOT a
middleware chain. The 4 modifiers are mutually exclusive with clear precedence:
count > namesOnly > fields > default summarize.

---

[← Back to Pattern Registry](../PATTERNS.md)
