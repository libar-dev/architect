# ✅ Pattern Id Generator

**Purpose:** Detailed documentation for the Pattern Id Generator pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

## Pattern ID Generator - Deterministic ID Generation

Generates unique, deterministic pattern IDs based on file path and line number.
Uses MD5 hashing to produce stable 8-character identifiers.

### When to Use

- When extracting patterns from TypeScript or Gherkin files
- When needing stable IDs that survive re-extraction
- When correlating patterns across multiple extraction runs

### Key Concepts

- **Deterministic**: Same file + line always produces same ID
- **Collision-resistant**: MD5 hash provides adequate uniqueness for pattern counts
- **Human-friendly prefix**: `pattern-` prefix aids debugging and identification

---

[← Back to Pattern Registry](../PATTERNS.md)
