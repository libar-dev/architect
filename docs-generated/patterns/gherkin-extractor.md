# ✅ Gherkin Extractor

**Purpose:** Detailed documentation for the Gherkin Extractor pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Extractor |

## Description

## GherkinExtractor - Convert Feature Files to Pattern Documentation

Transforms scanned Gherkin feature files into ExtractedPattern objects
for inclusion in generated documentation. Maps feature tags, descriptions,
and scenarios to pattern metadata.

### When to Use

- When building multi-source documentation (TypeScript + Gherkin)
- When converting acceptance criteria to pattern documentation
- When defining roadmap patterns in .feature files before implementation

### Key Concepts

- **Feature → Pattern**: Feature name becomes pattern name
- **Tags → Metadata**: @pattern:Name, @phase:N map to pattern fields
- **Scenarios → Use Cases**: Acceptance criteria become "When to Use" examples

---

[← Back to Pattern Registry](../PATTERNS.md)
