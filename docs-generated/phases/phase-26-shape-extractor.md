# ShapeExtractor

**Purpose:** Detailed patterns for ShapeExtractor

---

## Summary

**Progress:** [████████████████████] 2/2 (100%)

| Status | Count |
| --- | --- |
| ✅ Completed | 2 |
| 🚧 Active | 0 |
| 📋 Planned | 0 |
| **Total** | 2 |

---

## ✅ Completed Patterns

### ✅ Shape Extraction

| Property | Value |
| --- | --- |
| Status | completed |
| Effort | 2d |
| Business Value | eliminates type duplication in documentation |

**Problem:**
  Documentation comments duplicate type definitions that exist in the same file.
  When interfaces change, the JSDoc examples drift. Maintaining two copies of the
  same type information violates DRY and creates documentation rot.

  **Relationship to Documentation Generation:**
  This capability is a critical enabler for ADR-021 (DocGenerationProofOfConcept).
  Shape extraction allows code to own API type documentation while decisions own
  intro/context and behavior specs own rules/examples. See the source mapping
  pattern in doc-generation-proof-of-concept.feature.

  Current pattern (duplication):
  """typescript
  /**
   * @libar-docs
   *
   * ## API
   *
   * ```typescript
   * // DUPLICATED from actual interface below
   * interface DeciderInput {
   *   state: ProcessState;
   *   changes: ChangeDetection;
   * }
   * ```
   */

  // The actual source of truth
  export interface DeciderInput {
    state: ProcessState;
    changes: ChangeDetection;
  }
  """

  **Solution:**
  New tag `@libar-docs-extract-shapes` lists type names to extract from the same file.
  The extractor pulls actual TypeScript definitions from AST and inserts them into
  generated documentation as fenced code blocks.

  Target pattern (single source):
  """typescript
  /**
   * @libar-docs
   * @libar-docs-extract-shapes DeciderInput, ValidationResult
   *
   * ## API
   *
   * (shapes inserted at generation time)
   */

  export interface DeciderInput {
    state: ProcessState;
    changes: ChangeDetection;
  }
  """

  **Why It Matters:**
  | Benefit | How |
  | Single source of truth | Types defined once, extracted for docs |
  | Always-current docs | Generated from actual code definitions |
  | Reduced maintenance | Change type once, docs update automatically |
  | API documentation | Public interfaces documented without duplication |

#### Enables

- Enables: DocGenerationProofOfConcept

#### Acceptance Criteria

**Tag registry contains extract-shapes**

- Given the tag registry is loaded
- When querying for tag "extract-shapes"
- Then the tag should exist
- And the tag format should be "csv"
- And the tag purpose should contain "type extraction"

**Extract simple interface**

- Given a TypeScript file with:
- When extracting shapes
- Then the extracted shapes contain "MyConfig"
- And the shape includes:

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes MyConfig
 */

export interface MyConfig {
  timeout: number;
  retries: number;
}
```

```typescript
interface MyConfig {
  timeout: number;
  retries: number;
}
```

**Extract interface with JSDoc**

- Given a TypeScript file with:
- When extracting shapes
- Then the shape includes the JSDoc comment "Configuration for the processor"
- And field JSDoc "Timeout in milliseconds" is preserved

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes ConfigOptions
 */

/** Configuration for the processor. */
export interface ConfigOptions {
  /** Timeout in milliseconds. */
  timeout: number;
}
```

**Extract interface with generics**

- Given a TypeScript file with:
- When extracting shapes
- Then the shape preserves generic parameters "<T, E = Error>"

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes Result
 */

export interface Result<T, E = Error> {
  value?: T;
  error?: E;
}
```

**Extract interface with extends**

- Given a TypeScript file with:
- When extracting shapes
- Then the shape includes "extends BaseConfig"

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes ExtendedConfig
 */

export interface ExtendedConfig extends BaseConfig {
  extra: string;
}
```

**Non-existent shape produces warning**

- Given a TypeScript file with:
- When extracting shapes
- Then a warning is logged: "Shape 'NonExistent' not found"
- And extraction continues without error

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes NonExistent
 */
```

**Extract union type alias**

- Given a TypeScript file with:
- When extracting shapes
- Then the extracted shapes contain "Status"
- And the shape includes:

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes Status
 */

export type Status = 'pending' | 'active' | 'completed';
```

```typescript
type Status = 'pending' | 'active' | 'completed';
```

**Extract mapped type**

- Given a TypeScript file with:
- When extracting shapes
- Then the shape preserves the mapped type syntax

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes Readonly
 */

export type Readonly<T> = { readonly [K in keyof T]: T[K] };
```

**Extract conditional type**

- Given a TypeScript file with:
- When extracting shapes
- Then the shape preserves conditional type syntax

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes Unwrap
 */

export type Unwrap<T> = T extends Promise<infer U> ? U : T;
```

**Extract string enum**

- Given a TypeScript file with:
- When extracting shapes
- Then the extracted shapes contain "Severity"
- And the shape includes all enum members

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes Severity
 */

export enum Severity {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}
```

**Extract const enum**

- Given a TypeScript file with:
- When extracting shapes
- Then the shape includes "const enum"

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes Direction
 */

export const enum Direction {
  Up,
  Down,
  Left,
  Right,
}
```

**Extract function signature**

- Given a TypeScript file with:
- When extracting shapes
- Then the extracted shapes contain "validateChanges"
- And the shape includes:
- And the function body is not included

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes validateChanges
 */

export function validateChanges(input: DeciderInput): DeciderOutput {
  // 50 lines of implementation
  return { result, events };
}
```

```typescript
function validateChanges(input: DeciderInput): DeciderOutput;
```

**Extract async function signature**

- Given a TypeScript file with:
- When extracting shapes
- Then the shape includes "async" and "Promise<T>"

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes fetchData
 */

export async function fetchData<T>(url: string): Promise<T> {
  // implementation
}
```

**Extract arrow function with type annotation**

- Given a TypeScript file with:
- When extracting shapes
- Then the shape includes the type annotation

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes createValidator
 */

export const createValidator: (rules: Rule[]) => Validator = (rules) => {
  // implementation
};
```

**Shapes appear in tag order**

- Given a TypeScript file with:
- When extracting shapes
- Then shapes appear in order: Output, Input, Options

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes Output, Input, Options
 */

export interface Input { /* first in source */ }
export interface Options { /* second in source */ }
export interface Output { /* third in source */ }
```

**Mixed shape types in specified order**

- Given a TypeScript file with:
- When extracting shapes
- Then shapes appear in order: Status (type), Config (interface), validate (function)

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes Status, Config, validate
 */

export type Status = 'ok' | 'error';
export interface Config { timeout: number; }
export function validate(input: unknown): boolean { return true; }
```

**Shapes render in claude module**

- Given a pattern with extracted shapes "Input" and "Output"
- When generating claude module
- Then the module contains:

````markdown
#### API Types

```typescript
interface Input {
  // ...
}

interface Output {
  // ...
}
```
````

**Shapes render in detailed docs**

- Given a pattern with extracted shapes
- And detailLevel is "detailed"
- When generating documentation
- Then each shape appears in its own code block
- And JSDoc comments are preserved above each shape

**Shape with imported type reference**

- Given a TypeScript file with:
- When extracting shapes
- Then the shape includes "Request" and "Response" as type references
- And imports are NOT included in extracted shape

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes MyHandler
 */

import { Request, Response } from './types.js';

export interface MyHandler {
  handle(req: Request): Response;
}
```

**Shape extraction does not follow imports**

- Given `@libar-docs-extract-shapes Request` where Request is imported
- When extracting shapes
- Then warning: "Shape 'Request' is imported, not defined in this file"
- And suggestion: "Add extract-shapes to the source file"

**Re-exported type produces same warning as import**

- Given a TypeScript file with:
- When extracting shapes for "Foo"
- Then warning: "Shape 'Foo' is re-exported, not defined in this file"
- And the shape is NOT extracted
- And suggestion: "Add @libar-docs-extract-shapes to ./types.js instead"

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes Foo
 */

// Re-export from another file
export { Foo } from './types.js';
export type { Bar } from './other.js';
```

**Extract overloaded function signatures**

- Given a TypeScript file with:
- When extracting shapes
- Then the extracted shape includes all overload signatures:
- And the implementation signature is NOT included

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes validate
 */

export function validate(input: string): boolean;
export function validate(input: number): boolean;
export function validate(input: string | number): boolean {
  return typeof input === 'string' ? input.length > 0 : input > 0;
}
```

```typescript
function validate(input: string): boolean;
function validate(input: number): boolean;
```

**Extract method overloads in interface**

- Given a TypeScript file with:
- When extracting shapes
- Then both method signatures are preserved in the interface

```typescript
/**
 * @libar-docs
 * @libar-docs-extract-shapes Parser
 */

export interface Parser {
  parse(input: string): Result;
  parse(input: Buffer): Result;
}
```

**Grouped rendering for compact output**

- Given extracted shapes "Input", "Output", "Options"
- And rendering with groupInSingleBlock: true
- When generating markdown
- Then output is:

````markdown
```typescript
interface Input { ... }

interface Output { ... }

interface Options { ... }
```
````

**Separate rendering for detailed output**

- Given extracted shapes "Input", "Output"
- And rendering with groupInSingleBlock: false
- When generating markdown
- Then output is:

````markdown
```typescript
interface Input { ... }
```

```typescript
interface Output { ... }
```
````

#### Business Rules

**extract-shapes tag is defined in registry**

**Invariant:** The `extract-shapes` tag must exist with CSV format to list
    multiple type names for extraction.

_Verified by: Tag registry contains extract-shapes_

**Interfaces are extracted from TypeScript AST**

**Invariant:** When `@libar-docs-extract-shapes` lists an interface name,
    the extractor must find and extract the complete interface definition
    including JSDoc comments, generics, and extends clauses.

_Verified by: Extract simple interface, Extract interface with JSDoc, Extract interface with generics, Extract interface with extends, Non-existent shape produces warning_

**Type aliases are extracted from TypeScript AST**

**Invariant:** Type aliases (including union types, intersection types,
    and mapped types) are extracted when listed in extract-shapes.

_Verified by: Extract union type alias, Extract mapped type, Extract conditional type_

**Enums are extracted from TypeScript AST**

**Invariant:** Both string and numeric enums are extracted with their
    complete member definitions.

_Verified by: Extract string enum, Extract const enum_

**Function signatures are extracted (body omitted)**

**Invariant:** When a function name is listed in extract-shapes, only the
    signature (parameters, return type, generics) is extracted. The function
    body is replaced with ellipsis for documentation purposes.

_Verified by: Extract function signature, Extract async function signature, Extract arrow function with type annotation_

**Multiple shapes are extracted in specified order**

**Invariant:** When multiple shapes are listed, they appear in the
    documentation in the order specified in the tag, not source order.

_Verified by: Shapes appear in tag order, Mixed shape types in specified order_

**Extracted shapes render as fenced code blocks**

**Invariant:** Codecs render extracted shapes as TypeScript fenced code
    blocks, grouped under an "API Types" or similar section.

_Verified by: Shapes render in claude module, Shapes render in detailed docs_

**Shapes can reference types from imports**

**Invariant:** Extracted shapes may reference types from imports. The
    extractor does NOT resolve imports - it extracts the shape as-is.
    Consumers understand that referenced types are defined elsewhere.

_Verified by: Shape with imported type reference, Shape extraction does not follow imports, Re-exported type produces same warning as import_

**Overloaded function signatures are all extracted**

**Invariant:** When a function has multiple overload signatures, all
    signatures are extracted together as they represent the complete API.

_Verified by: Extract overloaded function signatures, Extract method overloads in interface_

**Shape rendering supports grouping options**

**Invariant:** Codecs can render shapes grouped in a single code block
    or as separate code blocks, depending on detail level.

_Verified by: Grouped rendering for compact output, Separate rendering for detailed output_

---

### ✅ Shape Extractor

| Property | Value |
| --- | --- |
| Status | completed |

## Shape Extractor - TypeScript Type Extraction

Extracts TypeScript type definitions (interfaces, type aliases, enums,
function signatures) from source files for documentation generation.

### When to Use

- When processing @libar-docs-extract-shapes tags during extraction
- When generating documentation that needs actual type definitions
- When eliminating duplication between JSDoc examples and code

### Key Concepts

- **AST-based extraction**: Uses typescript-estree for accurate parsing
- **Preserves formatting**: Extracts exact source text, not regenerated
- **Includes JSDoc**: Type-level JSDoc comments are preserved
- **Order from tag**: Shapes appear in tag-specified order, not source order

---

[← Back to Roadmap](../ROADMAP.md)
