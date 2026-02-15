# ✅ String Utils

**Purpose:** Detailed requirements for the String Utils feature

---

## Overview

| Property     | Value     |
| ------------ | --------- |
| Status       | completed |
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

## Business Rules

**slugify generates URL-safe slugs**

**Invariant:** slugify must produce lowercase, alphanumeric, hyphen-only strings with no leading/trailing hyphens.
**Rationale:** URL slugs appear in file paths and links across all generated documentation; inconsistent slugification would break cross-references.
**Verified by:** slugify converts text to URL-safe format, slugify handles empty-ish input, slugify handles single word

_Verified by: slugify converts text to URL-safe format, slugify handles empty-ish input, slugify handles single word_

**camelCaseToTitleCase generates readable titles**

**Invariant:** camelCaseToTitleCase must insert spaces at camelCase boundaries and preserve known acronyms (HTTP, XML, API, DoD, AST, GraphQL).
**Rationale:** Pattern names stored as PascalCase identifiers appear as human-readable titles in generated documentation; incorrect splitting would produce unreadable headings.
**Verified by:** camelCaseToTitleCase converts to title case, camelCaseToTitleCase handles all-uppercase acronym, camelCaseToTitleCase handles lowercase word

_Verified by: camelCaseToTitleCase converts to title case, camelCaseToTitleCase handles all-uppercase acronym, camelCaseToTitleCase handles lowercase word_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
