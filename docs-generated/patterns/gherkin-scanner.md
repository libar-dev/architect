# ✅ Gherkin Scanner

**Purpose:** Detailed documentation for the Gherkin Scanner pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Scanner |

## Description

## GherkinScanner - Multi-Source Pattern Extraction from Feature Files

Scans .feature files for pattern metadata encoded in Gherkin tags.
Enables roadmap patterns to be defined in acceptance criteria files
before implementation, supporting specification-first development.

### When to Use

- When defining roadmap patterns in .feature files
- When extracting pattern metadata from acceptance criteria
- When building multi-source documentation (TypeScript + Gherkin)

### Key Concepts

- **Feature Tags**: @pattern:Name, @phase:N, @status:roadmap map to pattern metadata
- **Multi-Source**: Patterns can be defined in TypeScript stubs OR Gherkin features
- **Conflict Detection**: Same pattern name in both sources triggers error

---

[← Back to Pattern Registry](../PATTERNS.md)
