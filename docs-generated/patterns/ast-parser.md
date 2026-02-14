# ✅ Ast Parser

**Purpose:** Detailed documentation for the Ast Parser pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Scanner |

## Description

The AST Parser extracts @libar-docs-* directives from TypeScript source files
  using the TypeScript compiler API. It identifies exports, extracts metadata,
  and validates directive structure.

## Acceptance Criteria

**Parse function export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive should have tag "@libar-docs-core"
- And the directive description should contain "Test function for authentication"
- And the first export should be:

```markdown
/**
 * @libar-docs-core
 * Test function for authentication
 */
export function authenticate(username: string, password: string): boolean {
  return username === 'admin' && password === 'secret';
}
```

| field | value |
| --- | --- |
| type | function |
| name | authenticate |

**Parse type export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive should have tags:
- And the first export should be:

```markdown
/**
 * @libar-docs-core @libar-docs-types
 * User type definition
 */
export type User = {
  id: string;
  name: string;
};
```

| value |
| --- |
| @libar-docs-core |
| @libar-docs-types |

| field | value |
| --- | --- |
| type | type |
| name | User |

**Parse interface export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export should be:

```markdown
/**
 * @libar-docs-core
 * Config interface
 */
export interface Config {
  apiUrl: string;
  timeout: number;
}
```

| field | value |
| --- | --- |
| type | interface |
| name | Config |

**Parse const export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export should be:

```markdown
/**
 * @libar-docs-core
 * API configuration
 */
export const API_CONFIG = {
  baseUrl: 'https://api.example.com',
  version: 'v1'
};
```

| field | value |
| --- | --- |
| type | const |
| name | API_CONFIG |

**Parse class export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export should be:

```markdown
/**
 * @libar-docs-core
 * User service class
 */
export class UserService {
  constructor(private db: Database) {}

  async getUser(id: string) {
    return this.db.findUser(id);
  }
}
```

| field | value |
| --- | --- |
| type | class |
| name | UserService |

**Parse enum export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export should be:
- And the directive code should contain "export enum Status"

```markdown
/**
 * @libar-docs-core
 * Enum export
 */
export enum Status {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending'
}
```

| field | value |
| --- | --- |
| type | enum |
| name | Status |

**Parse const enum export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export should be:
- And the directive code should contain "export const enum Direction"

```markdown
/**
 * @libar-docs-core
 * Const enum export
 */
export const enum Direction {
  Up = 1,
  Down = 2,
  Left = 3,
  Right = 4
}
```

| field | value |
| --- | --- |
| type | enum |
| name | Direction |

**Parse abstract class export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export should be:

```markdown
/**
 * @libar-docs-core
 * Abstract class export
 */
export abstract class BaseService {
  abstract process(): void;

  log(message: string) {
    console.log(message);
  }
}
```

| field | value |
| --- | --- |
| type | class |
| name | BaseService |

**Parse arrow function export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export should be:

```markdown
/**
 * @libar-docs-core
 * Arrow function export
 */
export const fetchData = async (url: string): Promise<Response> => {
  return fetch(url);
};
```

| field | value |
| --- | --- |
| type | const |
| name | fetchData |

**Parse async function export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export should be:
- And the directive code should contain "async function loadData"

```markdown
/**
 * @libar-docs-core
 * Async function export
 */
export async function loadData(id: string): Promise<Data> {
  const response = await fetch(`/api/data/${id}`);
  return response.json();
}
```

| field | value |
| --- | --- |
| type | function |
| name | loadData |

**Parse generic function export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export should be:
- And the directive code should contain "<T, U>"

```markdown
/**
 * @libar-docs-core
 * Generic function export
 */
export function map<T, U>(items: T[], fn: (item: T) => U): U[] {
  return items.map(fn);
}
```

| field | value |
| --- | --- |
| type | function |
| name | map |

**Parse default export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export should be:

```markdown
/**
 * @libar-docs-core
 * Default export
 */
export default function authenticate() {
  return true;
}
```

| field | value |
| --- | --- |
| type | function |
| name | default |

**Parse re-exports with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And 2 exports should be found
- And the exports should include names:

```markdown
/**
 * @libar-docs-core
 * Re-exported utilities
 */
export { foo, bar } from './utils';
```

| value |
| --- |
| foo |
| bar |

**Parse multiple exports in single statement**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And 2 exports should be found
- And the exports should include names:

```markdown
/**
 * @libar-docs-core
 * Multiple exports
 */
export const USER_ROLE = 'admin', USER_STATUS = 'active';
```

| value |
| --- |
| USER_ROLE |
| USER_STATUS |

**Parse multiple directives in same file**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 2 directives should be found
- And the directives should have details:

```markdown
/**
 * @libar-docs-core
 * First function
 */
export function first() {
  return 'first';
}

/**
 * @libar-docs-domain
 * Second function
 */
export function second() {
  return 'second';
}
```

| index | tag | exportName |
| --- | --- | --- |
| 1 | @libar-docs-core | first |
| 2 | @libar-docs-domain | second |

**Extract examples from directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive should have 2 examples
- And the examples should contain:

````markdown
/**
 * @libar-docs-core
 * Test function with examples
 *
 * @example
 * ```typescript
 * const result = test('hello');
 * console.log(result); // 'HELLO'
 * ```
 *
 * @example
 * ```typescript
 * const result = test('world');
 * ```
 */
export function test(input: string): string {
  return input.toUpperCase();
}
````

| value |
| --- |
| test('hello') |
| test('world') |

**Extract multi-line description**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive description should contain all:

```markdown
/**
 * @libar-docs-core
 *
 * This is a detailed description
 * that spans multiple lines
 * and should be captured.
 */
export function test() {
  return 'test';
}
```

| value |
| --- |
| detailed description |
| multiple lines |
| captured |

**Track line numbers correctly**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive position should be:

```markdown
// Line 1
// Line 2
/**
 * @libar-docs-core
 * Test
 */
export function test() {
  return 'test';
}
```

| field | value |
| --- | --- |
| startLine | 3 |
| endLine | 6 |

**Extract function signature information**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export signature should contain "calculate"

```markdown
/**
 * @libar-docs-core
 * Function with signature
 */
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
/**
 * @libar-docs-core
 * Test function
 *
 * @param input - The input string
 * @returns The processed output
 */
export function test(input: string): string {
  return input;
}
```

| value |
| --- |
| @param |
| @returns |

**Extract multiple tags from directive section**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive should have 3 tags
- And the directive should have tags:

```markdown
/**
 * @libar-docs-core @libar-docs-api
 * @libar-docs-overview
 *
 * This is the description.
 */
export function multiTagged() {
  return true;
}
```

| value |
| --- |
| @libar-docs-core |
| @libar-docs-api |
| @libar-docs-overview |

**Extract tag with description on same line**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive should have 1 tag
- And the directive should have tag "@libar-docs-core"

```markdown
/**
 * @libar-docs-core Brief description on same line
 */
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
/**
 * @libar-docs-core
 *
 * This function works with @libar-docs-api patterns.
 * It supports @libar-docs-saga for orchestration.
 */
export function processRequest() {
  return true;
}
```

| value |
| --- |
| @libar-docs-api |
| @libar-docs-saga |

**NOT extract tags mentioned in @example sections**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive should have 1 tag
- And the directive should have tag "@libar-docs-core"
- And the directive should not have any tags:

````markdown
/**
 * @libar-docs-core
 * Test function
 *
 * @example
 * ```typescript
 * hasTag('@libar-docs-example'); // checking for a tag
 * hasTag('@libar-docs-saga'); // another example
 * ```
 */
export function hasTag(tag: string): boolean {
  return tag.startsWith('@libar-docs');
}
````

| value |
| --- |
| @libar-docs-example |
| @libar-docs-saga |

**Extract When to Use heading format with bullet points**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive whenToUse should have 3 items
- And the directive whenToUse should contain:

```markdown
/**
 * @libar-docs-core
 *
 * ## Pattern Description
 *
 * ### When to Use
 *
 * - Command validation requires complex rules
 * - You want property-based testing
 * - Multiple handlers share logic
 */
export function decider() {
  return true;
}
```

| value |
| --- |
| Command validation requires complex rules |
| You want property-based testing |
| Multiple handlers share logic |

**Extract When to use inline format**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive whenToUse should have 1 item
- And the directive whenToUse should contain:

```markdown
/**
 * @libar-docs-core
 *
 * **When to use:** Command validation requires complex business rules.
 *
 * This is additional description.
 */
export function decider() {
  return true;
}
```

| value |
| --- |
| Command validation requires complex business rules. |

**Extract asterisk bullets in When to Use section**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive whenToUse should contain:

```markdown
/**
 * @libar-docs-core
 *
 * ## Pattern
 *
 * Description of the pattern.
 *
 * ### When to Use
 *
 * * First bullet with asterisk
 * * Second bullet with asterisk
 */
export function withAsteriskBullets() {
  return true;
}
```

| value |
| --- |
| First bullet with asterisk |
| Second bullet with asterisk |

**Not set whenToUse when section is missing**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive whenToUse should be undefined

```markdown
/**
 * @libar-docs-core
 *
 * Just a regular description without When to Use section.
 */
export function regular() {
  return true;
}
```

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

---

[← Back to Pattern Registry](../PATTERNS.md)
