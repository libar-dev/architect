# ✅ Built In Generators

**Purpose:** Detailed documentation for the Built In Generators pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Generator |

## Description

## BuiltInGenerators - Default Generator Bootstrap

Registers all codec-based generators on import using the RDM
(RenderableDocument Model) architecture.

All generators use Zod 4 codecs to transform MasterDataset
into RenderableDocuments, which are then rendered to markdown.

### When to Use

- Use when setting up documentation generation for a project
- Import this module to register all default generators

---

[← Back to Pattern Registry](../PATTERNS.md)
