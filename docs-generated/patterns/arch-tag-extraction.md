# ✅ Arch Tag Extraction

**Purpose:** Detailed documentation for the Arch Tag Extraction pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Architecture |

## Description

As a documentation generator
  I want architecture tags extracted from source code
  So that I can generate accurate architecture diagrams

## Acceptance Criteria

**arch-role tag exists with enum format**

- When querying for tag "arch-role"
- Then the tag should exist
- And the tag format should be "enum"
- And the tag purpose should mention "diagram"

**arch-role has required enum values**

- When querying for tag "arch-role"
- Then the tag values should include "command-handler"
- And the tag values should include "projection"
- And the tag values should include "saga"
- And the tag values should include "infrastructure"

**arch-context tag exists with value format**

- When querying for tag "arch-context"
- Then the tag should exist
- And the tag format should be "value"
- And the tag purpose should mention "bounded context"

**arch-layer tag exists with enum format**

- When querying for tag "arch-layer"
- Then the tag should exist
- And the tag format should be "enum"

**arch-layer has exactly three values**

- When querying for tag "arch-layer"
- Then the tag values should include "domain"
- And the tag values should include "application"
- And the tag values should include "infrastructure"
- And the tag values count should be 3

**Extract arch-role projection**

- Given TypeScript source:
- When the AST parser extracts the directive
- Then the directive archRole should be "projection"

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern MyProjection
 * @libar-docs-status completed
 * @libar-docs-arch-role projection
 */
export const myProjection = {};
```

**Extract arch-role command-handler**

- Given TypeScript source:
- When the AST parser extracts the directive
- Then the directive archRole should be "command-handler"

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern MyHandler
 * @libar-docs-status completed
 * @libar-docs-arch-role command-handler
 */
export const myHandler = {};
```

**Extract arch-context orders**

- Given TypeScript source:
- When the AST parser extracts the directive
- Then the directive archContext should be "orders"

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern OrderHandler
 * @libar-docs-status completed
 * @libar-docs-arch-context orders
 */
export const orderHandler = {};
```

**Extract arch-context inventory**

- Given TypeScript source:
- When the AST parser extracts the directive
- Then the directive archContext should be "inventory"

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern InventoryHandler
 * @libar-docs-status completed
 * @libar-docs-arch-context inventory
 */
export const inventoryHandler = {};
```

**Extract arch-layer application**

- Given TypeScript source:
- When the AST parser extracts the directive
- Then the directive archLayer should be "application"

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern MyService
 * @libar-docs-status completed
 * @libar-docs-arch-layer application
 */
export const myService = {};
```

**Extract arch-layer infrastructure**

- Given TypeScript source:
- When the AST parser extracts the directive
- Then the directive archLayer should be "infrastructure"

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern MyInfra
 * @libar-docs-status completed
 * @libar-docs-arch-layer infrastructure
 */
export const myInfra = {};
```

**Extract all three arch tags**

- Given TypeScript source:
- When the AST parser extracts the directive
- Then the directive archRole should be "command-handler"
- And the directive archContext should be "orders"
- And the directive archLayer should be "application"

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern OrderCommandHandlers
 * @libar-docs-status completed
 * @libar-docs-arch-role command-handler
 * @libar-docs-arch-context orders
 * @libar-docs-arch-layer application
 */
export const orderCommandHandlers = {};
```

**Missing arch tags are undefined**

- Given TypeScript source:
- When the AST parser extracts the directive
- Then the directive archRole should be undefined
- And the directive archContext should be undefined
- And the directive archLayer should be undefined

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern NoArchTags
 * @libar-docs-status completed
 */
export const noArchTags = {};
```

## Business Rules

**arch-role tag is defined in the registry**

Architecture roles classify components for diagram rendering.
    Valid roles: command-handler, projection, saga, process-manager,
    infrastructure, repository, decider, read-model, bounded-context.

_Verified by: arch-role tag exists with enum format, arch-role has required enum values_

**arch-context tag is defined in the registry**

Context tags group components into bounded context subgraphs.
    Format is "value" (free-form string like "orders", "inventory").

_Verified by: arch-context tag exists with value format_

**arch-layer tag is defined in the registry**

Layer tags enable layered architecture diagrams.
    Valid layers: domain, application, infrastructure.

_Verified by: arch-layer tag exists with enum format, arch-layer has exactly three values_

**AST parser extracts arch-role from TypeScript annotations**

The AST parser must extract arch-role alongside other pattern metadata.

_Verified by: Extract arch-role projection, Extract arch-role command-handler_

**AST parser extracts arch-context from TypeScript annotations**

Context values are free-form strings naming the bounded context.

_Verified by: Extract arch-context orders, Extract arch-context inventory_

**AST parser extracts arch-layer from TypeScript annotations**

Layer tags classify components by architectural layer.

_Verified by: Extract arch-layer application, Extract arch-layer infrastructure_

**AST parser handles multiple arch tags together**

Components often have role + context + layer together.

_Verified by: Extract all three arch tags_

**Missing arch tags yield undefined values**

Components without arch tags should have undefined (not null or empty).

_Verified by: Missing arch tags are undefined_

---

[← Back to Pattern Registry](../PATTERNS.md)
