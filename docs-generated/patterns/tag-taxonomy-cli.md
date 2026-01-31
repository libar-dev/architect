# ⏸️ Tag Taxonomy CLI

**Purpose:** Detailed documentation for the Tag Taxonomy CLI pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | Cli |

## Description

by the codec-based TaxonomyCodec which:
- Fits the MasterDataset pipeline architecture
- Provides progressive disclosure with detail files
- Groups tags by domain (Core, Relationship, Timeline, ADR, Architecture)
- Includes presets comparison and architecture diagrams

Generates TAG_TAXONOMY.md from the TypeScript taxonomy module.
Use to auto-generate comprehensive tag reference documentation.

### When to Use

- Use after modifying src/taxonomy/ to update documentation
- Use to generate human-readable tag reference from TypeScript config
- Use in documentation regeneration workflows

---

[← Back to Pattern Registry](../PATTERNS.md)
