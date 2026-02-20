# ✅ Ast Parser Exports

**Purpose:** Detailed requirements for the Ast Parser Exports feature

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

**Parse function export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive should have tag "@libar-docs-core"
- And the directive description should contain "Test function for authentication"
- And the first export should be:

```markdown
/\*\*

- @libar-docs-core
- Test function for authentication
  \*/
  export function authenticate(username: string, password: string): boolean {
  return username === 'admin' && password === 'secret';
  }
```

| field | value        |
| ----- | ------------ |
| type  | function     |
| name  | authenticate |

**Parse type export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the directive should have tags:
- And the first export should be:

```markdown
/\*\*

- @libar-docs-core @libar-docs-types
- User type definition
  \*/
  export type User = {
  id: string;
  name: string;
  };
```

| value             |
| ----------------- |
| @libar-docs-core  |
| @libar-docs-types |

| field | value |
| ----- | ----- |
| type  | type  |
| name  | User  |

**Parse interface export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export should be:

```markdown
/\*\*

- @libar-docs-core
- Config interface
  \*/
  export interface Config {
  apiUrl: string;
  timeout: number;
  }
```

| field | value     |
| ----- | --------- |
| type  | interface |
| name  | Config    |

**Parse const export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export should be:

```markdown
/\*\*

- @libar-docs-core
- API configuration
  \*/
  export const API_CONFIG = {
  baseUrl: 'https://api.example.com',
  version: 'v1'
  };
```

| field | value      |
| ----- | ---------- |
| type  | const      |
| name  | API_CONFIG |

**Parse class export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export should be:

```markdown
/\*\*

- @libar-docs-core
- User service class
  \*/
  export class UserService {
  constructor(private db: Database) {}

async getUser(id: string) {
return this.db.findUser(id);
}
}
```

| field | value       |
| ----- | ----------- |
| type  | class       |
| name  | UserService |

**Parse enum export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export should be:
- And the directive code should contain "export enum Status"

```markdown
/\*\*

- @libar-docs-core
- Enum export
  \*/
  export enum Status {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending'
  }
```

| field | value  |
| ----- | ------ |
| type  | enum   |
| name  | Status |

**Parse const enum export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export should be:
- And the directive code should contain "export const enum Direction"

```markdown
/\*\*

- @libar-docs-core
- Const enum export
  \*/
  export const enum Direction {
  Up = 1,
  Down = 2,
  Left = 3,
  Right = 4
  }
```

| field | value     |
| ----- | --------- |
| type  | enum      |
| name  | Direction |

**Parse abstract class export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export should be:

```markdown
/\*\*

- @libar-docs-core
- Abstract class export
  \*/
  export abstract class BaseService {
  abstract process(): void;

log(message: string) {
console.log(message);
}
}
```

| field | value       |
| ----- | ----------- |
| type  | class       |
| name  | BaseService |

**Parse arrow function export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export should be:

```markdown
/\*\*

- @libar-docs-core
- Arrow function export
  \*/
  export const fetchData = async (url: string): Promise<Response> => {
  return fetch(url);
  };
```

| field | value     |
| ----- | --------- |
| type  | const     |
| name  | fetchData |

**Parse async function export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export should be:
- And the directive code should contain "async function loadData"

```markdown
/\*\*

- @libar-docs-core
- Async function export
  \*/
  export async function loadData(id: string): Promise<Data> {
  const response = await fetch(`/api/data/${id}`);
  return response.json();
  }
```

| field | value    |
| ----- | -------- |
| type  | function |
| name  | loadData |

**Parse generic function export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export should be:
- And the directive code should contain "<T, U>"

```markdown
/\*\*

- @libar-docs-core
- Generic function export
  \*/
  export function map<T, U>(items: T[], fn: (item: T) => U): U[] {
  return items.map(fn);
  }
```

| field | value    |
| ----- | -------- |
| type  | function |
| name  | map      |

**Parse default export with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And the first export should be:

```markdown
/\*\*

- @libar-docs-core
- Default export
  \*/
  export default function authenticate() {
  return true;
  }
```

| field | value    |
| ----- | -------- |
| type  | function |
| name  | default  |

**Parse re-exports with directive**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And 2 exports should be found
- And the exports should include names:

```markdown
/\*\*

- @libar-docs-core
- Re-exported utilities
  \*/
  export { foo, bar } from './utils';
```

| value |
| ----- |
| foo   |
| bar   |

**Parse multiple exports in single statement**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 1 directive should be found
- And 2 exports should be found
- And the exports should include names:

```markdown
/\*\*

- @libar-docs-core
- Multiple exports
  \*/
  export const USER_ROLE = 'admin', USER_STATUS = 'active';
```

| value       |
| ----------- |
| USER_ROLE   |
| USER_STATUS |

**Parse multiple directives in same file**

- Given a TypeScript file with content:
- When the file is parsed for directives
- Then 2 directives should be found
- And the directives should have details:

```markdown
/\*\*

- @libar-docs-core
- First function
  \*/
  export function first() {
  return 'first';
  }

/\*\*

- @libar-docs-domain
- Second function
  \*/
  export function second() {
  return 'second';
  }
```

| index | tag                | exportName |
| ----- | ------------------ | ---------- |
| 1     | @libar-docs-core   | first      |
| 2     | @libar-docs-domain | second     |

## Business Rules

**Export types are correctly identified from TypeScript declarations**

**Invariant:** Every exported TypeScript declaration type (function, type, interface, const, class, enum, abstract class, arrow function, async function, generic function, default export, re-export) is correctly classified.
**Verified by:** Parse function export with directive, Parse type export with directive, Parse interface export with directive, Parse const export with directive, Parse class export with directive, Parse enum export with directive, Parse const enum export with directive, Parse abstract class export with directive, Parse arrow function export with directive, Parse async function export with directive, Parse generic function export with directive, Parse default export with directive, Parse re-exports with directive, Parse multiple exports in single statement, Parse multiple directives in same file

_Verified by: Parse function export with directive, Parse type export with directive, Parse interface export with directive, Parse const export with directive, Parse class export with directive, Parse enum export with directive, Parse const enum export with directive, Parse abstract class export with directive, Parse arrow function export with directive, Parse async function export with directive, Parse generic function export with directive, Parse default export with directive, Parse re-exports with directive, Parse multiple exports in single statement, Parse multiple directives in same file_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
