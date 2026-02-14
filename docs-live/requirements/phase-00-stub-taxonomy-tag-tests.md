# 🚧 Stub Taxonomy Tag Tests

**Purpose:** Detailed requirements for the Stub Taxonomy Tag Tests feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Product Area | DataAPI |

## Description

**Problem:**
  Stub metadata (target path, design session) was stored as plain text
  in JSDoc descriptions, invisible to structured queries.

  **Solution:**
  Register libar-docs-target and libar-docs-since as taxonomy tags
  so they flow through the extraction pipeline as structured fields.

## Acceptance Criteria

**Target and since tags exist in registry**

- Given the default tag registry
- When looking up the "target" metadata tag
- Then the tag exists with format "value"
- And the "since" tag also exists with format "value"

**Built registry groups target and since as stub tags**

- Given the default tag registry
- When I look up tags in the "stub" metadata group
- Then the group contains "target"
- And the group contains "since"

## Business Rules

**Taxonomy tags are registered in the registry**

_Verified by: Target and since tags exist in registry_

**Tags are part of the stub metadata group**

_Verified by: Built registry groups target and since as stub tags_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
