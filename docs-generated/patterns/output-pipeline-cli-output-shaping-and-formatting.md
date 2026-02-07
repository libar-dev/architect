# 📋 OutputPipeline — CLI Output Shaping and Formatting

**Purpose:** Detailed documentation for the OutputPipeline — CLI Output Shaping and Formatting pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | Status |

## Description

Post-processing pipeline that transforms raw API results into shaped CLI output.
Applies output modifiers (--names-only, --count, --fields, --full) and wraps
results in QueryResult<T> envelopes.

Architecture decision: This is a single post-processing function, NOT a
middleware chain. The 4 modifiers are mutually exclusive with clear precedence:
count > namesOnly > fields > default summarize.

The pipeline discriminates pattern arrays from scalars using a PipelineInput
discriminated union — the router knows which methods return ExtractedPattern[]
via a static PATTERN_ARRAY_METHODS set.

Target: src/cli/output-pipeline.ts
See: DataAPIOutputShaping spec, Rule 2 (Output Modifiers), Rule 3 (Output Format)
Since: DS-A

---

[← Back to Pattern Registry](../PATTERNS.md)
