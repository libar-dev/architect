# ✅ Codec Generator Registration

**Purpose:** Detailed documentation for the Codec Generator Registration pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

Registers codec-based generators for the RenderableDocument Model (RDM) system.
These generators use Zod 4 codecs to transform MasterDataset into RenderableDocuments,
which are then rendered to markdown via the universal renderer.

### When to Use

- When initializing the generator registry with built-in generators
- When understanding which generators are available out-of-the-box
- When extending with custom generators (use as reference for registration pattern)

Available generators:
- `patterns` - Pattern registry with category details
- `roadmap` - Development roadmap by phase
- `milestones` - Historical completed milestones
- `requirements` - Product requirements by area/role
- `session` - Current session context and focus
- `remaining` - Aggregate view of incomplete work

---

[← Back to Pattern Registry](../PATTERNS.md)
