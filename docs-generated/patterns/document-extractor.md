# ✅ Document Extractor

**Purpose:** Detailed documentation for the Document Extractor pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

## Document Extractor - Pattern Extraction and Metadata Generation

Converts scanned file data into complete ExtractedPattern objects with
unique IDs, inferred names, categories, and timestamps. Second stage of
the pipeline: Scanner → **Extractor** → Generator.

### When to Use

- Transforming directives to structured patterns
- Inferring metadata from tags and exports
- Validating pattern structure against schemas

### Key Concepts

- **Category Inference**: Uses tag registry priorities to determine primary category
- **Name Inference**: Extracts from exports or JSDoc title when not explicit
- **Deterministic IDs**: MD5 hash of file path + line number ensures stable identifiers

## Use Cases

- When converting scanned files to ExtractedPattern objects
- When inferring pattern names and categories from exports

---

[← Back to Pattern Registry](../PATTERNS.md)
