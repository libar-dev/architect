# ✅ Directive Detection

**Purpose:** Detailed requirements for the Directive Detection feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Annotation |

## Description

Pure functions that detect @libar-docs directives in TypeScript source code.
These functions enable quick file filtering before full AST parsing.

**Problem:**

- Full AST parsing of every TypeScript file is expensive and slow
- Files without documentation directives waste processing time
- Need to distinguish file-level opt-in (@libar-docs) from section tags (@libar-docs-\*)
- Similar patterns like @libar-doc-core could cause false positives

**Solution:**

- hasDocDirectives: Fast regex check for any @libar-docs-\* directive
- hasFileOptIn: Validates explicit @libar-docs opt-in (not @libar-docs-\*)
- Both use regex patterns optimized for quick filtering before AST parsing
- Negative lookahead ensures @libar-docs doesn't match @libar-docs-\*

## Acceptance Criteria

**Detect @libar-docs-core directive in JSDoc block**

- Given source code with JSDoc containing "@libar-docs-core"
- When checking for documentation directives
- Then hasDocDirectives should return true

**Detect various @libar-docs-\* directives**

- Given source code containing directive "<directive>"
- When checking for documentation directives
- Then hasDocDirectives should return true

**Detect directive anywhere in file content**

- Given source code with directive in middle of file
- When checking for documentation directives
- Then hasDocDirectives should return true

**Detect multiple directives on same line**

- Given source code "/\*_ @libar-docs-core @libar-docs-validation _/"
- When checking for documentation directives
- Then hasDocDirectives should return true

**Detect directive in inline comment**

- Given source code "// @libar-docs-core Quick directive"
- When checking for documentation directives
- Then hasDocDirectives should return true

**Return false for content without directives**

- Given source code with only standard JSDoc tags
- When checking for documentation directives
- Then hasDocDirectives should return false

**Return false for empty content in hasDocDirectives**

- Given empty source code
- When checking for documentation directives
- Then hasDocDirectives should return false

**Reject similar but non-matching patterns**

- Given source code containing pattern "<pattern>"
- When checking for documentation directives
- Then hasDocDirectives should return false because "<reason>"

**Detect @libar-docs in JSDoc block comment**

- Given source code with file-level "@libar-docs" opt-in
- When checking for file opt-in
- Then hasFileOptIn should return true

**Detect @libar-docs with description on same line**

- Given source code "/\*_ @libar-docs This file is documented _/"
- When checking for file opt-in
- Then hasFileOptIn should return true

**Detect @libar-docs in multi-line JSDoc**

- Given source code with @libar-docs in middle of multi-line JSDoc
- When checking for file opt-in
- Then hasFileOptIn should return true

**Detect @libar-docs anywhere in file**

- Given source code with @libar-docs after other content
- When checking for file opt-in
- Then hasFileOptIn should return true

**Detect @libar-docs combined with section tags**

- Given source code "/\*_ @libar-docs @libar-docs-core _/"
- When checking for file opt-in
- Then hasFileOptIn should return true

**Return false when only section tags present**

- Given source code with only "@libar-docs-core" section tag
- When checking for file opt-in
- Then hasFileOptIn should return false

**Return false for multiple section tags without opt-in**

- Given source code "/\*_ @libar-docs-core @libar-docs-validation _/"
- When checking for file opt-in
- Then hasFileOptIn should return false

**Return false for empty content in hasFileOptIn**

- Given empty source code
- When checking for file opt-in
- Then hasFileOptIn should return false

**Return false for @libar-docs in line comment**

- Given source code "// @libar-docs This is a line comment, not JSDoc"
- When checking for file opt-in
- Then hasFileOptIn should return false

**Not confuse @libar-docs-\* with @libar-docs opt-in**

- Given source code "/\*_ @libar-docs-event-sourcing _/"
- When checking for file opt-in
- Then hasFileOptIn should return false

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
