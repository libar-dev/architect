# ✅ Extraction Pipeline Enhancements Testing

**Purpose:** Detailed requirements for the Extraction Pipeline Enhancements Testing feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Annotation |

## Description

Validates extraction pipeline capabilities for ReferenceDocShowcase:
function signature surfacing, full property-level JSDoc,
param/returns/throws extraction, and auto-shape discovery mode.

## Acceptance Criteria

**Simple function signature is extracted with full types**

- Given a TypeScript file with content:
- When the AST parser extracts pattern metadata
- Then the function export "greet" has signature "function greet(name: string): string;"

```markdown
/\*_ @libar-docs _/

/\*\*

- @libar-docs-core
- Simple utility
  \*/
  export function greet(name: string): string {
  return `Hello, ${name}`;
  }
```

**Async function keeps async prefix in signature**

- Given a TypeScript file with content:
- When the AST parser extracts pattern metadata
- Then the function export "loadData" has signature "async function loadData(url: string): Promise<string>;"

```markdown
/\*_ @libar-docs _/

/\*\*

- @libar-docs-core
- Async loader
  \*/
  export async function loadData(url: string): Promise<string> {
  return fetch(url).then(r => r.text());
  }
```

**Multi-parameter function has all types in signature**

- Given a TypeScript file with content:
- When the AST parser extracts pattern metadata
- Then the function export "merge" has signature "function merge(a: string[], b: string[], unique: boolean): string[];"

```markdown
/\*_ @libar-docs _/

/\*\*

- @libar-docs-core
- Merge utility
  \*/
  export function merge(a: string[], b: string[], unique: boolean): string[] {
  return unique ? [...new Set([...a, ...b])] : [...a, ...b];
  }
```

**Function with object parameter type preserves braces**

- Given a TypeScript file with content:
- When the AST parser extracts pattern metadata
- Then the function export "configure" has signature "function configure(opts: { timeout: number; retries: number }): void;"

```markdown
/\*_ @libar-docs _/

/\*\*

- @libar-docs-core
- Config processor
  \*/
  export function configure(opts: { timeout: number; retries: number }): void {
  console.log(opts);
  }
```

**Multi-line property JSDoc is fully preserved**

- Given TypeScript source for shape extraction:
- When extracting shape "ProcessorConfig"
- Then the property "timeout" JSDoc contains all fragments:

```markdown
/\*\*

- Configuration options for the processor.
- Controls timeout behavior and retry strategy.
  \*/
  export interface ProcessorConfig {
  /\*\*
  - Maximum time to wait for a response.
  - Measured in milliseconds from request start.
  - Defaults to 30000 if not specified.
    \*/
    timeout: number;
    }
```

| fragment                                     |
| -------------------------------------------- |
| Maximum time to wait for a response.         |
| Measured in milliseconds from request start. |
| Defaults to 30000 if not specified.          |

**Single-line property JSDoc still works**

- Given TypeScript source for shape extraction:
- When extracting shape "SimpleConfig"
- Then the property "timeout" JSDoc is "Timeout in milliseconds."

```markdown
export interface SimpleConfig {
/\*_ Timeout in milliseconds. _/
timeout: number;
}
```

**Param tags are extracted from function JSDoc**

- Given TypeScript source for shape extraction:
- When extracting shape "processOrder"
- Then the shape has 2 param docs
- And the param docs match:

```markdown
/\*\*

- Process an order with validation.
- @param orderId - The unique order identifier
- @param quantity - Number of items to process
- @returns The processed order result
  \*/
  export function processOrder(orderId: string, quantity: number): OrderResult {
  throw new Error('not implemented');
  }
```

| name     | description                 |
| -------- | --------------------------- |
| orderId  | The unique order identifier |
| quantity | Number of items to process  |

**Returns tag is extracted from function JSDoc**

- Given TypeScript source for shape extraction:
- When extracting shape "calculateTotal"
- Then the shape has a returns doc with description "The total price including tax"

```markdown
/\*\*

- Calculate the total price.
- @returns The total price including tax
  \*/
  export function calculateTotal(): number {
  return 0;
  }
```

**Throws tags are extracted from function JSDoc**

- Given TypeScript source for shape extraction:
- When extracting shape "validate"
- Then the shape has 2 throws docs
- And the throws docs match:

```markdown
/\*\*

- Validate input data.
- @param data - The input to validate
- @throws {ValidationError} When input fails schema check
- @throws {TypeError} When input is not a string
  \*/
  export function validate(data: string): boolean {
  return true;
  }
```

| type            | description                   |
| --------------- | ----------------------------- |
| ValidationError | When input fails schema check |
| TypeError       | When input is not a string    |

**JSDoc params with braces type syntax are parsed**

- Given TypeScript source for shape extraction:
- When extracting shape "isValid"
- Then the shape has 2 param docs
- And the typed param docs match:
- And the shape has a returns doc with type "boolean"

```markdown
/\*\*

- Legacy-style JSDoc with types.
- @param {string} name The user name
- @param {number} age The user age
- @returns {boolean} Whether the user is valid
  \*/
  export function isValid(name: string, age: number): boolean {
  return true;
  }
```

| name | type   | description   |
| ---- | ------ | ------------- |
| name | string | The user name |
| age  | number | The user age  |

**Wildcard extracts all exported declarations**

- Given TypeScript source for wildcard extraction:
- When extracting shapes with wildcard "\*"
- Then 3 shapes are extracted
- And the extracted shapes include all:
- And the extracted shapes do not include "internal"

```markdown
export interface Config {
timeout: number;
}

export type Status = 'active' | 'inactive';

export function process(): void {}

const internal = 42;
```

| name    |
| ------- |
| Config  |
| Status  |
| process |

**Mixed wildcard and names produces warning**

- Given TypeScript source for wildcard extraction:
- When extracting shapes with tag "\*, Foo"
- Then extraction produces a warning about wildcard exclusivity
- And 0 shapes are extracted

```markdown
export interface Foo { x: number; }
```

**Same-name type and const exports produce one shape**

- Given TypeScript source for wildcard extraction:
- When extracting shapes with wildcard "\*"
- Then 1 shapes are extracted
- And the extracted shapes include all:
- And the extracted shape "Result" has kind "type"

```markdown
export type Result<T, E = Error> =
| { readonly ok: true; readonly value: T }
| { readonly ok: false; readonly error: E };

export const Result = {
ok<T>(value: T): Result<T, never> {
return { ok: true, value };
},
};
```

| name   |
| ------ |
| Result |

## Business Rules

**Function signatures surface full parameter types in ExportInfo**

**Invariant:** ExportInfo.signature shows full parameter types and
return type instead of the placeholder value.

    **Verified by:** Simple function signature, Async function keeps async prefix,
    Multi-parameter function, Function with object parameter type

_Verified by: Simple function signature is extracted with full types, Async function keeps async prefix in signature, Multi-parameter function has all types in signature, Function with object parameter type preserves braces_

**Property-level JSDoc preserves full multi-line content**

**Invariant:** Property-level JSDoc preserves full multi-line content
without first-line truncation.

    **Verified by:** Multi-line property JSDoc preserved,
    Single-line property JSDoc unchanged

_Verified by: Multi-line property JSDoc is fully preserved, Single-line property JSDoc still works_

**Param returns and throws tags are extracted from function JSDoc**

**Invariant:** JSDoc param, returns, and throws tags are extracted
and stored on ExtractedShape for function-kind shapes.

    **Verified by:** Param tags extracted, Returns tag extracted,
    Throws tags extracted, TypeScript-style params without braces

_Verified by: Param tags are extracted from function JSDoc, Returns tag is extracted from function JSDoc, Throws tags are extracted from function JSDoc, JSDoc params with braces type syntax are parsed_

**Auto-shape discovery extracts all exported types via wildcard**

**Invariant:** When extract-shapes tag value is the wildcard character,
all exported declarations are extracted without listing names.

    **Verified by:** Wildcard extracts all exports,
    Non-exported declarations excluded,
    Mixed wildcard and names rejected,
    Same-name type and const exports produce one shape

_Verified by: Wildcard extracts all exported declarations, Mixed wildcard and names produces warning, Same-name type and const exports produce one shape_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
