# ✅ Shape Extraction Testing

**Purpose:** Detailed documentation for the Shape Extraction Testing pattern

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
/** Configuration for the processor. */
export interface ConfigOptions {
  /** Timeout in milliseconds. */
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
  /** The user's unique identifier */
  id: string;
  /** The user's display name */
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
/**
 * Represents a user in the system.
 * This JSDoc belongs to the interface.
 */
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
  /** Required API key */
  apiKey: string;
  timeout: number;
  /** Optional retry count */
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

**Malformed TypeScript returns error**

- Given TypeScript source code:
- When extracting shape "Invalid" expecting failure
- Then extraction should fail with parse error

```markdown
export interface { broken syntax
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

**Source code exceeding 5MB limit returns error**

- Given TypeScript source code larger than 5MB
- When attempting to extract shapes
- Then the extraction should fail with error containing "exceeds maximum allowed"

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

**Multiple shapes are extracted in specified order**

_Verified by: Shapes appear in tag order not source order, Mixed shape types in specified order_

**Extracted shapes render as fenced code blocks**

_Verified by: Render shapes as markdown_

**Imported and re-exported shapes are tracked separately**

_Verified by: Imported shape produces warning, Re-exported shape produces re-export entry_

**Const declarations are extracted from TypeScript AST**

_Verified by: Extract const with type annotation, Extract const without type annotation_

**Invalid TypeScript produces error result**

_Verified by: Malformed TypeScript returns error_

**Non-exported shapes are extractable**

_Verified by: Extract non-exported interface, Re-export marks internal shape as exported_

**Shape rendering supports grouping options**

_Verified by: Grouped rendering in single code block, Separate rendering with multiple code blocks_

**Large source files are rejected to prevent memory exhaustion**

_Verified by: Source code exceeding 5MB limit returns error_

---

[← Back to Pattern Registry](../PATTERNS.md)
