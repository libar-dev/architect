# 🚧 Uses Tag Testing

**Purpose:** Detailed requirements for the Uses Tag Testing feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Product Area | Annotation |

## Description

Tests extraction and processing of @libar-docs-uses and @libar-docs-used-by
  relationship tags from TypeScript files.

## Acceptance Criteria

**Uses tag exists in registry**

- Given the tag registry is loaded
- When querying for tag "uses"
- Then the tag should exist
- And the tag format should be "csv"
- And the tag purpose should mention "depends"

**Used-by tag exists in registry**

- Given the tag registry is loaded
- When querying for tag "used-by"
- Then the tag should exist
- And the tag format should be "csv"
- And the tag purpose should mention "depend"

**Single uses value extracted**

- Given a TypeScript file with content:
- When the AST parser extracts metadata
- Then the directive should have uses "ServiceB"

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern ServiceA
 * @libar-docs-status active
 * @libar-docs-uses ServiceB
 */
export class ServiceA {}
```

**Multiple uses values extracted as CSV**

- Given a TypeScript file with content:
- When the AST parser extracts metadata
- Then the directive should have uses "ServiceA, ServiceB, ServiceC"

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern Orchestrator
 * @libar-docs-status active
 * @libar-docs-uses ServiceA, ServiceB, ServiceC
 */
export class Orchestrator {}
```

**Single used-by value extracted**

- Given a TypeScript file with content:
- When the AST parser extracts metadata
- Then the directive should have usedBy "HighLevelOrchestrator"

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern CoreService
 * @libar-docs-status active
 * @libar-docs-used-by HighLevelOrchestrator
 */
export class CoreService {}
```

**Multiple used-by values extracted as CSV**

- Given a TypeScript file with content:
- When the AST parser extracts metadata
- Then the directive should have usedBy "ServiceA, ServiceB"

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern Foundation
 * @libar-docs-status active
 * @libar-docs-used-by ServiceA, ServiceB
 */
export class Foundation {}
```

**Uses relationships stored in relationship index**

- Given patterns with uses relationships:
- And a pattern "ServiceB" exists
- When the relationship index is built
- Then "ServiceA" should have uses containing "ServiceB"
- And "ServiceC" should have uses containing "ServiceB"

| name | uses |
| --- | --- |
| ServiceA | ServiceB |
| ServiceC | ServiceB |

**UsedBy relationships stored explicitly**

- Given a pattern "ServiceB" with usedBy "ServiceA, ServiceC"
- When the relationship index is built
- Then "ServiceB" should have usedBy containing "ServiceA"
- And "ServiceB" should have usedBy containing "ServiceC"

**DocDirective schema accepts uses**

- Given a DocDirective with uses "Pattern1, Pattern2"
- When validating against DocDirectiveSchema
- Then validation should pass

**RelationshipEntry schema accepts usedBy**

- Given a RelationshipEntry with usedBy "Pattern1, Pattern2"
- When validating against RelationshipEntrySchema
- Then validation should pass

## Business Rules

**Uses tag is defined in taxonomy registry**

_Verified by: Uses tag exists in registry, Used-by tag exists in registry_

**Uses tag is extracted from TypeScript files**

_Verified by: Single uses value extracted, Multiple uses values extracted as CSV_

**Used-by tag is extracted from TypeScript files**

_Verified by: Single used-by value extracted, Multiple used-by values extracted as CSV_

**Uses relationships are stored in relationship index**

The relationship index stores uses and usedBy relationships directly
    from pattern metadata. Unlike implements, these are explicit declarations.

_Verified by: Uses relationships stored in relationship index, UsedBy relationships stored explicitly_

**Schemas validate uses field correctly**

_Verified by: DocDirective schema accepts uses, RelationshipEntry schema accepts usedBy_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
