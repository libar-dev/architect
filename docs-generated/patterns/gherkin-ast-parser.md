# ✅ Gherkin AST Parser

**Purpose:** Detailed documentation for the Gherkin AST Parser pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Scanner |

## Description

## GherkinASTParser - Parse Feature Files Using Cucumber Gherkin

Parses Gherkin feature files using @cucumber/gherkin and extracts structured data
including feature metadata, tags, scenarios, and steps.

### Supported Formats

- **Classic Gherkin** (`.feature`) - Standard Gherkin syntax
- **MDG - Markdown with Gherkin** (`.feature.md`) - Rich Markdown with embedded Gherkin

MDG files use Markdown headers for keywords (`# Feature:`, `## Scenario:`) and
list items for steps (`* Given`, `* When`, `* Then`). They render beautifully
in GitHub while remaining parseable for documentation generation.

### Rule Keyword Support

Both formats support the Gherkin v6+ `Rule:` keyword for grouping scenarios
under business rules. Scenarios inside Rules are extracted with a synthetic
`rule:Rule-Name` tag for traceability.

### When to Use

- When parsing Gherkin .feature files for pattern extraction
- When parsing MDG .feature.md files for PRD generation
- When converting acceptance criteria to documentation
- When building multi-source documentation pipelines

---

[← Back to Pattern Registry](../PATTERNS.md)
