# ✅ Shape Extraction Rendering Testing

**Purpose:** Detailed documentation for the Shape Extraction Rendering Testing pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | DDD |

## Description

Validates the shape extraction system that extracts TypeScript type
  definitions (interfaces, type aliases, enums, function signatures)
  from source files for documentation generation.

## Acceptance Criteria

**Shapes appear in tag order not source order**

- Given TypeScript source code:
- When extracting shapes "Output, Input, Options"
- Then 3 shapes should be extracted
- And shape 0 should have name "Output"
- And shape 1 should have name "Input"
- And shape 2 should have name "Options"

```markdown
export interface Input { data: string; }
export interface Options { config: boolean; }
export interface Output { result: number; }
```

**Mixed shape types in specified order**

- Given TypeScript source code:
- When extracting shapes "Status, Config, validate"
- Then 3 shapes should be extracted
- And shape 0 should have kind "type"
- And shape 1 should have kind "interface"
- And shape 2 should have kind "function"

```markdown
export type Status = 'ok' | 'error';
export interface Config { timeout: number; }
export function validate(input: unknown): boolean { return true; }
```

**Render shapes as markdown**

- Given TypeScript source code:
- When extracting shapes "Input, Output"
- And rendering shapes as markdown
- Then the markdown should contain typescript code fence
- And the markdown should contain "interface Input"
- And the markdown should contain "interface Output"

```markdown
export interface Input { data: string; }
export interface Output { result: number; }
```

**Imported shape produces warning**

- Given TypeScript source code:
- When extracting shape "Request"
- Then the extraction should have imported entry for "Request"

```markdown
import { Request } from './types.js';
export interface MyHandler {
  handle(req: Request): void;
}
```

**Re-exported shape produces re-export entry**

- Given TypeScript source code:
- When extracting shape "Foo"
- Then the extraction should have re-exported entry for "Foo" from "./types.js"

```markdown
export { Foo } from './types.js';
export type { Bar } from './other.js';
```

**Malformed TypeScript returns error**

- Given TypeScript source code:
- When extracting shape "Invalid" expecting failure
- Then extraction should fail with parse error

```markdown
export interface { broken syntax
```

**Grouped rendering in single code block**

- Given TypeScript source code:
- When extracting shapes "Input, Output"
- And rendering shapes with groupInSingleBlock true
- Then the markdown should have 1 code fence
- And the markdown should contain "interface Input"
- And the markdown should contain "interface Output"

```markdown
export interface Input { data: string; }
export interface Output { result: number; }
```

**Separate rendering with multiple code blocks**

- Given TypeScript source code:
- When extracting shapes "Input, Output"
- And rendering shapes with groupInSingleBlock false
- Then the markdown should have 2 code fences

```markdown
export interface Input { data: string; }
export interface Output { result: number; }
```

**JSDoc with only annotation tags produces no jsDoc**

- Given TypeScript source code:
- When extracting shapes "OnlyTags"
- Then the shape "OnlyTags" should have no jsDoc

```markdown
/**
 * @libar-docs
 * @libar-docs-pattern ShapeExtractor
 * @libar-docs-status completed
 */
export interface OnlyTags {
  value: string;
}
```

**Mixed JSDoc preserves standard tags and strips annotation tags**

- Given TypeScript source code:
- When extracting shapes "MixedTags"
- Then the shape "MixedTags" jsDoc should contain "Configuration for the pipeline"
- And the shape "MixedTags" jsDoc should contain "@param timeout"
- And the shape "MixedTags" jsDoc should contain "@returns"
- And the shape "MixedTags" jsDoc should not contain "@libar-docs"

```markdown
/**
 * @libar-docs
 * @libar-docs-status active
 *
 * Configuration for the pipeline.
 *
 * @param timeout - Request timeout in ms
 * @returns The configured instance
 */
export interface MixedTags {
  timeout: number;
}
```

**Single-line annotation-only JSDoc produces no jsDoc**

- Given TypeScript source code:
- When extracting shapes "SingleLine"
- Then the shape "SingleLine" should have no jsDoc

```markdown
/** @libar-docs-shape Foo */
export interface SingleLine {
  id: string;
}
```

**Consecutive empty lines after tag removal are collapsed**

- Given TypeScript source code:
- When extracting shapes "CollapsedLines"
- Then the shape "CollapsedLines" jsDoc should contain "Useful description here"
- And the shape "CollapsedLines" jsDoc should not contain consecutive empty JSDoc lines

```markdown
/**
 * @libar-docs
 * @libar-docs-status roadmap
 *
 *
 * Useful description here.
 */
export interface CollapsedLines {
  name: string;
}
```

**Source code exceeding 5MB limit returns error**

- Given TypeScript source code larger than 5MB
- When attempting to extract shapes
- Then the extraction should fail with error containing "exceeds maximum allowed"

## Business Rules

**Multiple shapes are extracted in specified order**

_Verified by: Shapes appear in tag order not source order, Mixed shape types in specified order_

**Extracted shapes render as fenced code blocks**

_Verified by: Render shapes as markdown_

**Imported and re-exported shapes are tracked separately**

_Verified by: Imported shape produces warning, Re-exported shape produces re-export entry_

**Invalid TypeScript produces error result**

_Verified by: Malformed TypeScript returns error_

**Shape rendering supports grouping options**

_Verified by: Grouped rendering in single code block, Separate rendering with multiple code blocks_

**Annotation tags are stripped from extracted JSDoc while preserving standard tags**

**Invariant:** Extracted shapes never contain @libar-docs-* annotation lines in their jsDoc field.

    **Rationale:** Shape JSDoc is rendered in documentation output. Annotation tags are metadata
    for the extraction pipeline, not user-visible documentation content.

_Verified by: JSDoc with only annotation tags produces no jsDoc, Mixed JSDoc preserves standard tags and strips annotation tags, Single-line annotation-only JSDoc produces no jsDoc, Consecutive empty lines after tag removal are collapsed_

**Large source files are rejected to prevent memory exhaustion**

_Verified by: Source code exceeding 5MB limit returns error_

---

[← Back to Pattern Registry](../PATTERNS.md)
