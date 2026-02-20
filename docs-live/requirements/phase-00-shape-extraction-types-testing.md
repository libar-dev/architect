# ✅ Shape Extraction Types Testing

**Purpose:** Detailed requirements for the Shape Extraction Types Testing feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Annotation |

## Description

Validates the shape extraction system that extracts TypeScript type
definitions (interfaces, type aliases, enums, function signatures)
from source files for documentation generation.

## Acceptance Criteria

**Tag registry contains extract-shapes with correct format**

- Given the tag registry is loaded
- Then the tag "extract-shapes" should exist with format "csv"

**Extract simple interface**

- Given TypeScript source code:
- When extracting shape "MyConfig"
- Then the shape should be extracted with kind "interface"
- And the shape source should contain "timeout: number"

```markdown
export interface MyConfig {
timeout: number;
retries: number;
}
```

**Extract interface with JSDoc**

- Given TypeScript source code:
- When extracting shape "ConfigOptions"
- Then the shape should be extracted with kind "interface"
- And the shape JSDoc should contain "Configuration for the processor"

```markdown
/** Configuration for the processor. \*/
export interface ConfigOptions {
/** Timeout in milliseconds. \*/
timeout: number;
}
```

**Extract interface with generics**

- Given TypeScript source code:
- When extracting shape "Result"
- Then the shape should be extracted with kind "interface"
- And the shape source should contain "<T, E = Error>"

```markdown
export interface Result<T, E = Error> {
value?: T;
error?: E;
}
```

**Extract interface with extends**

- Given TypeScript source code:
- When extracting shape "ExtendedConfig"
- Then the shape should be extracted with kind "interface"
- And the shape source should contain "extends BaseConfig"

```markdown
interface BaseConfig { base: string; }
export interface ExtendedConfig extends BaseConfig {
extra: string;
}
```

**Non-existent shape produces not-found entry**

- Given TypeScript source code:
- When extracting shape "NonExistent"
- Then the extraction should have not-found entry for "NonExistent"

```markdown
export interface Exists { x: number; }
```

**Extract properties with adjacent JSDoc**

- Given TypeScript source code:
- When extracting shape "User"
- Then the shape should have property docs for "id"
- And the property "id" JSDoc should contain "unique identifier"
- And the shape should have property docs for "name"
- And the property "name" JSDoc should contain "display name"

```markdown
export interface User {
/** The user's unique identifier \*/
id: string;
/** The user's display name \*/
name: string;
}
```

**Interface JSDoc not attributed to first property**

- Given TypeScript source code:
- When extracting shape "User"
- Then the shape JSDoc should contain "Represents a user"
- And the shape should not have property docs for "id"
- And the shape should not have property docs for "name"

```markdown
/\*\*

- Represents a user in the system.
- This JSDoc belongs to the interface.
  \*/
  export interface User {
  id: string;
  name: string;
  }
```

**Mixed documented and undocumented properties**

- Given TypeScript source code:
- When extracting shape "Config"
- Then the shape should have property docs for "apiKey"
- And the shape should not have property docs for "timeout"
- And the shape should have property docs for "retries"

```markdown
export interface Config {
/** Required API key \*/
apiKey: string;
timeout: number;
/** Optional retry count \*/
retries: number;
}
```

**Extract union type alias**

- Given TypeScript source code:
- When extracting shape "Status"
- Then the shape should be extracted with kind "type"
- And the shape source should contain "'pending' | 'active' | 'completed'"

```markdown
export type Status = 'pending' | 'active' | 'completed';
```

**Extract mapped type**

- Given TypeScript source code:
- When extracting shape "Readonly"
- Then the shape should be extracted with kind "type"
- And the shape source should contain "[K in keyof T]"

```markdown
export type Readonly<T> = { readonly [K in keyof T]: T[K] };
```

**Extract conditional type**

- Given TypeScript source code:
- When extracting shape "Unwrap"
- Then the shape should be extracted with kind "type"
- And the shape source should contain "extends Promise<infer U>"

```markdown
export type Unwrap<T> = T extends Promise<infer U> ? U : T;
```

**Extract string enum**

- Given TypeScript source code:
- When extracting shape "Severity"
- Then the shape should be extracted with kind "enum"
- And the shape source should contain "Error = 'error'"

```markdown
export enum Severity {
Error = 'error',
Warning = 'warning',
Info = 'info',
}
```

**Extract const enum**

- Given TypeScript source code:
- When extracting shape "Direction"
- Then the shape should be extracted with kind "enum"
- And the shape source should contain "const enum"

```markdown
export const enum Direction {
Up,
Down,
Left,
Right,
}
```

**Extract function signature**

- Given TypeScript source code:
- When extracting shape "validateChanges"
- Then the shape should be extracted with kind "function"
- And the shape source should contain "function validateChanges"
- And the shape source should not contain "return"

```markdown
export function validateChanges(input: DeciderInput): DeciderOutput {
return { result: true, events: [] };
}
```

**Extract async function signature**

- Given TypeScript source code:
- When extracting shape "fetchData"
- Then the shape should be extracted with kind "function"
- And the shape source should contain "async function fetchData"

```markdown
export async function fetchData<T>(url: string): Promise<T> {
const response = await fetch(url);
return response.json();
}
```

**Extract const with type annotation**

- Given TypeScript source code:
- When extracting shape "API_VERSION"
- Then the shape should be extracted with kind "const"
- And the shape source should contain "const API_VERSION: string"

```markdown
export const API_VERSION: string = 'v1.0.0';
```

**Extract const without type annotation**

- Given TypeScript source code:
- When extracting shape "MAX_RETRIES"
- Then the shape should be extracted with kind "const"
- And the shape source should contain "MAX_RETRIES = 3"

```markdown
export const MAX_RETRIES = 3;
```

**Extract non-exported interface**

- Given TypeScript source code:
- When extracting shape "InternalConfig"
- Then the shape should be extracted with kind "interface"
- And the shape should have exported false

```markdown
interface InternalConfig {
secret: string;
}
```

**Re-export marks internal shape as exported**

- Given TypeScript source code:
- When extracting shape "Config"
- Then the shape should be extracted with kind "interface"
- And the shape should have exported true

```markdown
interface Config { value: number; }
export { Config };
```

## Business Rules

**extract-shapes tag exists in registry with CSV format**

_Verified by: Tag registry contains extract-shapes with correct format_

**Interfaces are extracted from TypeScript AST**

_Verified by: Extract simple interface, Extract interface with JSDoc, Extract interface with generics, Extract interface with extends, Non-existent shape produces not-found entry_

**Property-level JSDoc is extracted for interface properties**

The extractor uses strict adjacency (gap = 1 line) to prevent
interface-level JSDoc from being misattributed to the first property.

_Verified by: Extract properties with adjacent JSDoc, Interface JSDoc not attributed to first property, Mixed documented and undocumented properties_

**Type aliases are extracted from TypeScript AST**

_Verified by: Extract union type alias, Extract mapped type, Extract conditional type_

**Enums are extracted from TypeScript AST**

_Verified by: Extract string enum, Extract const enum_

**Function signatures are extracted with body omitted**

_Verified by: Extract function signature, Extract async function signature_

**Const declarations are extracted from TypeScript AST**

_Verified by: Extract const with type annotation, Extract const without type annotation_

**Non-exported shapes are extractable**

_Verified by: Extract non-exported interface, Re-export marks internal shape as exported_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
