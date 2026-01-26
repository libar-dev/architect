# ✅ Validate Patterns CLI

**Purpose:** Detailed documentation for the Validate Patterns CLI pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Cli |

## Description

## ValidatePatternsCLI - Cross-Source Pattern Validator

Cross-validates TypeScript patterns vs Gherkin feature files.
Ensures consistency between code annotations and feature specifications.

### Exit Codes

- `0` - No errors
- `1` - Errors found
- `2` - Warnings found (with --strict)

### When to Use

- Pre-commit validation to ensure code and feature files stay in sync
- CI pipeline to catch documentation drift early
- Strict mode (`--strict`) for production readiness checks

---

[← Back to Pattern Registry](../PATTERNS.md)
