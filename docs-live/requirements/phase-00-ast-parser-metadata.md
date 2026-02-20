# ✅ Ast Parser Metadata

**Purpose:** Detailed requirements for the Ast Parser Metadata feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Annotation |

## Description

The AST Parser extracts @libar-docs-\* directives from TypeScript source files
using the TypeScript compiler API. It identifies exports, extracts metadata,
and validates directive structure.

## Acceptance Criteria

**Extract examples from directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive should have 2 examples
- And the examples should contain:

````markdown
/\*\*

- @libar-docs-core
- Test function with examples
-
- @example
- ```typescript

  ```

- const result = test('hello');
- console.log(result); // 'HELLO'
- ```

  ```

-
- @example
- ```typescript

  ```

- const result = test('world');
- ```
   */
  export function test(input: string): string {
    return input.toUpperCase();
  }
  ```
````

| value         |
| ------------- |
| test('hello') |
| test('world') |

**Extract multi-line description**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive description should contain all:

```markdown
/\*\*

- @libar-docs-core
-
- This is a detailed description
- that spans multiple lines
- and should be captured.
  \*/
  export function test() {
  return 'test';
  }
```

| value                |
| -------------------- |
| detailed description |
| multiple lines       |
| captured             |

**Track line numbers correctly**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive position should be:

```markdown
// Line 1
// Line 2
/\*\*

- @libar-docs-core
- Test
  \*/
  export function test() {
  return 'test';
  }
```

| field     | value |
| --------- | ----- |
| startLine | 3     |
| endLine   | 6     |

**Extract function signature information**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export signature should contain "calculate"

```markdown
/\*\*

- @libar-docs-core
- Function with signature
  \*/
  export function calculate(a: number, b: number, c: string): number {
  return a + b;
  }
```

**Ignore @param and @returns in description**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive description should be "Test function"
- And the directive description should not contain any:

```markdown
/\*\*

- @libar-docs-core
- Test function
-
- @param input - The input string
- @returns The processed output
  \*/
  export function test(input: string): string {
  return input;
  }
```

| value    |
| -------- |
| @param   |
| @returns |

**Extract multiple tags from directive section**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive should have 3 tags
- And the directive should have tags:

```markdown
/\*\*

- @libar-docs-core @libar-docs-api
- @libar-docs-overview
-
- This is the description.
  \*/
  export function multiTagged() {
  return true;
  }
```

| value                |
| -------------------- |
| @libar-docs-core     |
| @libar-docs-api      |
| @libar-docs-overview |

**Extract tag with description on same line**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive should have 1 tag
- And the directive should have tag "@libar-docs-core"

```markdown
/\*\*

- @libar-docs-core Brief description on same line
  \*/
  export function inlineDesc() {
  return true;
  }
```

**NOT extract tags mentioned in description**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive should have 1 tag
- And the directive should have tag "@libar-docs-core"
- And the directive should not have any tags:

```markdown
/\*\*

- @libar-docs-core
-
- This function works with @libar-docs-api patterns.
- It supports @libar-docs-saga for orchestration.
  \*/
  export function processRequest() {
  return true;
  }
```

| value            |
| ---------------- |
| @libar-docs-api  |
| @libar-docs-saga |

**NOT extract tags mentioned in @example sections**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive should have 1 tag
- And the directive should have tag "@libar-docs-core"
- And the directive should not have any tags:

````markdown
/\*\*

- @libar-docs-core
- Test function
-
- @example
- ```typescript

  ```

- hasTag('@libar-docs-example'); // checking for a tag
- hasTag('@libar-docs-saga'); // another example
- ```
   */
  export function hasTag(tag: string): boolean {
    return tag.startsWith('@libar-docs');
  }
  ```
````

| value               |
| ------------------- |
| @libar-docs-example |
| @libar-docs-saga    |

**Extract When to Use heading format with bullet points**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive whenToUse should have 3 items
- And the directive whenToUse should contain:

```markdown
/\*\*

- @libar-docs-core
-
- ## Pattern Description
-
- ### When to Use
-
- - Command validation requires complex rules
- - You want property-based testing
- - Multiple handlers share logic
    \*/
    export function decider() {
    return true;
    }
```

| value                                     |
| ----------------------------------------- |
| Command validation requires complex rules |
| You want property-based testing           |
| Multiple handlers share logic             |

**Extract When to use inline format**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive whenToUse should have 1 item
- And the directive whenToUse should contain:

```markdown
/\*\*

- @libar-docs-core
-
- **When to use:** Command validation requires complex business rules.
-
- This is additional description.
  \*/
  export function decider() {
  return true;
  }
```

| value                                               |
| --------------------------------------------------- |
| Command validation requires complex business rules. |

**Extract asterisk bullets in When to Use section**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive whenToUse should contain:

```markdown
/\*\*

- @libar-docs-core
-
- ## Pattern
-
- Description of the pattern.
-
- ### When to Use
-
- - First bullet with asterisk
- - Second bullet with asterisk
    \*/
    export function withAsteriskBullets() {
    return true;
    }
```

| value                       |
| --------------------------- |
| First bullet with asterisk  |
| Second bullet with asterisk |

**Not set whenToUse when section is missing**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive whenToUse should be undefined

```markdown
/\*\*

- @libar-docs-core
-
- Just a regular description without When to Use section.
  \*/
  export function regular() {
  return true;
  }
```

## Business Rules

**Metadata is correctly extracted from JSDoc comments**

**Invariant:** Examples, multi-line descriptions, line numbers, function signatures, and standard JSDoc tags are all correctly parsed and separated.
**Verified by:** Extract examples from directive, Extract multi-line description, Track line numbers correctly, Extract function signature information, Ignore @param and @returns in description

_Verified by: Extract examples from directive, Extract multi-line description, Track line numbers correctly, Extract function signature information, Ignore @param and @returns in description_

**Tags are extracted only from the directive section, not from description or examples**

**Invariant:** Only tags appearing in the directive section (before the description) are extracted. Tags mentioned in description prose or example code blocks are ignored.
**Verified by:** Extract multiple tags from directive section, Extract tag with description on same line, NOT extract tags mentioned in description, NOT extract tags mentioned in @example sections

_Verified by: Extract multiple tags from directive section, Extract tag with description on same line, NOT extract tags mentioned in description, NOT extract tags mentioned in @example sections_

**When to Use sections are extracted in all supported formats**

**Invariant:** When to Use content is extracted from heading format with bullet points, inline bold format, and asterisk bullet format. When no When to Use section exists, the field is undefined.
**Verified by:** Extract When to Use heading format with bullet points, Extract When to use inline format, Extract asterisk bullets in When to Use section, Not set whenToUse when section is missing

_Verified by: Extract When to Use heading format with bullet points, Extract When to use inline format, Extract asterisk bullets in When to Use section, Not set whenToUse when section is missing_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
