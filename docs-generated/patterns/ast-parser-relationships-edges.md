# ✅ Ast Parser Relationships Edges

**Purpose:** Detailed documentation for the Ast Parser Relationships Edges pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | DDD |

## Description

The AST Parser extracts @libar-docs-* directives from TypeScript source files
  using the TypeScript compiler API. It identifies exports, extracts metadata,
  and validates directive structure.

## Acceptance Criteria

**Extract @libar-docs-uses with single value**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive uses should contain:

```markdown
/**
 * @libar-docs-core
 * @libar-docs-uses FSM Types
 *
 * Pattern that uses another pattern.
 */
export function pattern() {
  return true;
}
```

| value |
| --- |
| FSM Types |

**Extract @libar-docs-uses with comma-separated values**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive uses should have 3 items
- And the directive uses should contain:

```markdown
/**
 * @libar-docs-core
 * @libar-docs-uses FSM Types, Invariant Error, CMS Types
 *
 * Pattern that uses multiple patterns.
 */
export function pattern() {
  return true;
}
```

| value |
| --- |
| FSM Types |
| Invariant Error |
| CMS Types |

**Extract @libar-docs-used-by with single value**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive usedBy should contain:

```markdown
/**
 * @libar-docs-core
 * @libar-docs-used-by createDeciderHandler Factory
 *
 * Pattern used by another pattern.
 */
export function pattern() {
  return true;
}
```

| value |
| --- |
| createDeciderHandler Factory |

**Extract @libar-docs-used-by with comma-separated values**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive usedBy should have 2 items
- And the directive usedBy should contain:

```markdown
/**
 * @libar-docs-core
 * @libar-docs-used-by defineFSM Factory, Decider Types
 *
 * Pattern used by multiple patterns.
 */
export function pattern() {
  return true;
}
```

| value |
| --- |
| defineFSM Factory |
| Decider Types |

**Extract both uses and usedBy from same directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive uses should contain:
- And the directive usedBy should contain:

```markdown
/**
 * @libar-docs-core
 * @libar-docs-uses FSM Types
 * @libar-docs-used-by createDeciderHandler Factory
 *
 * Pattern with both uses and used-by relationships.
 */
export function pattern() {
  return true;
}
```

| value |
| --- |
| FSM Types |

| value |
| --- |
| createDeciderHandler Factory |

**NOT capture uses/usedBy values in description**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive description should start with "## Decider Pattern"
- And the directive description should not start with any:
- And the directive uses should contain:
- And the directive usedBy should contain:

```markdown
/**
 * @libar-docs-core
 * @libar-docs-uses FSM Types
 * @libar-docs-used-by createDeciderHandler Factory
 *
 * ## Decider Pattern - Pure Domain Decision Logic
 *
 * The Decider pattern separates pure business logic.
 */
export function pattern() {
  return true;
}
```

| value |
| --- |
| createDeciderHandler Factory |
| FSM Types |

| value |
| --- |
| FSM Types |

| value |
| --- |
| createDeciderHandler Factory |

**Not set uses/usedBy when no relationship tags exist**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive uses should be undefined
- And the directive usedBy should be undefined

```markdown
/**
 * @libar-docs-core
 *
 * Pattern without relationship tags.
 */
export function pattern() {
  return true;
}
```

**Skip comments without @libar-docs-* tags**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 0 directives should be found

```markdown
/**
 * Regular JSDoc comment
 * @param foo - parameter
 * @returns result
 */
export function regular(foo: string) {
  return foo;
}
```

**Skip invalid directive with incomplete tag**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 0 directives should be found

```markdown
/**
 * @libar-docs-
 */
export function invalid() {
  return 'invalid';
}
```

**Handle malformed TypeScript gracefully**

- Given a TypeScript file with malformed content:
- When the file is parsed for directives
- Then parsing should fail with error
- And the parse error should contain the file path

```markdown
/**
 * @libar-docs-core
 * This will fail to parse
 */
export function broken(
  // Missing closing parenthesis and function body
```

**Handle empty file gracefully**

- Given an empty TypeScript file
- When the file is parsed for directives
- Then 0 directives should be found

**Handle whitespace-only file**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 0 directives should be found

```markdown



```

**Handle file with only comments and no exports**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 0 directives should be found

```markdown
/**
 * @libar-docs-core
 * This is a comment with no following export
 */

// Some other comment
```

**Skip inline comments (non-block)**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 0 directives should be found

```markdown
// @libar-docs-core - This is an inline comment
export function test() {
  return 'test';
}
```

**Handle unicode characters in descriptions**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive description should contain all:

```markdown
/**
 * @libar-docs-core
 * Funcion de autenticacion con emojis
 */
export function autenticar() {
  return true;
}
```

| value |
| --- |
| Funcion |
| emojis |

## Business Rules

**Relationship tags extract uses and usedBy dependencies**

**Invariant:** The uses and usedBy relationship arrays are populated from directive tags, not from description content. When no relationship tags exist, the fields are undefined.
      **Verified by:** Extract @libar-docs-uses with single value, Extract @libar-docs-uses with comma-separated values, Extract @libar-docs-used-by with single value, Extract @libar-docs-used-by with comma-separated values, Extract both uses and usedBy from same directive, NOT capture uses/usedBy values in description, Not set uses/usedBy when no relationship tags exist

_Verified by: Extract @libar-docs-uses with single value, Extract @libar-docs-uses with comma-separated values, Extract @libar-docs-used-by with single value, Extract @libar-docs-used-by with comma-separated values, Extract both uses and usedBy from same directive, NOT capture uses/usedBy values in description, Not set uses/usedBy when no relationship tags exist_

**Edge cases and malformed input are handled gracefully**

**Invariant:** The parser never crashes on invalid input. Files without directives return empty results. Malformed TypeScript returns a structured error with the file path.
      **Verified by:** Skip comments without @libar-docs-* tags, Skip invalid directive with incomplete tag, Handle malformed TypeScript gracefully, Handle empty file gracefully, Handle whitespace-only file, Handle file with only comments and no exports, Skip inline comments (non-block), Handle unicode characters in descriptions

_Verified by: Skip comments without @libar-docs-* tags, Skip invalid directive with incomplete tag, Handle malformed TypeScript gracefully, Handle empty file gracefully, Handle whitespace-only file, Handle file with only comments and no exports, Skip inline comments (non-block), Handle unicode characters in descriptions_

---

[← Back to Pattern Registry](../PATTERNS.md)
