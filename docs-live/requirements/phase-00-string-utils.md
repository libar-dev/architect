# ✅ String Utils

**Purpose:** Detailed requirements for the String Utils feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Product Area | CoreTypes |

## Description

String utilities provide consistent text transformations across the codebase.
  These functions handle URL slugification and case conversion with proper
  handling of edge cases like acronyms and special characters.

  **Covered functions:**
  - `slugify` - Convert text to URL-safe slugs (lowercase, alphanumeric, hyphens)
  - `camelCaseToTitleCase` - Convert CamelCase to "Title Case" with spaces

  **Note:** `toKebabCase` is already tested in kebab-case-slugs.feature

## Acceptance Criteria

**slugify converts text to URL-safe format**

- When I slugify "<input>"
- Then the slug should be "<expected>"

**slugify handles empty-ish input**

- When I slugify "---"
- Then the slug should be ""

**slugify handles single word**

- When I slugify "word"
- Then the slug should be "word"

**camelCaseToTitleCase converts to title case**

- When I convert "<input>" to title case
- Then the title should be "<expected>"

**camelCaseToTitleCase handles all-uppercase acronym**

- When I convert "DCB" to title case
- Then the title should be "DCB"

**camelCaseToTitleCase handles lowercase word**

- When I convert "test" to title case
- Then the title should be "test"

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
