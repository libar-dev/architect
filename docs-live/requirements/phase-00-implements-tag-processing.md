# ✅ Implements Tag Processing

**Purpose:** Detailed requirements for the Implements Tag Processing feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Product Area | Annotation |

## Description

Tests for the @libar-docs-implements tag which links implementation files
  to their corresponding roadmap pattern specifications.

## Acceptance Criteria

**Implements tag exists in registry**

- Given the tag registry is loaded
- When querying for tag "implements"
- Then the tag should exist
- And the tag format should be "csv"
- And the tag purpose should mention "realization"

**Parse implements with single pattern**

- Given a TypeScript file with content:
- When the AST parser extracts metadata
- Then the directive should have implements ["EventStoreDurability"]

```typescript
/**
 * @libar-docs
 * @libar-docs-implements EventStoreDurability
 * @libar-docs-status roadmap
 */
export function outbox() {}
```

**Implements preserved through extraction pipeline**

- Given a scanned file with implements "EventStoreDurability"
- When the extractor builds ExtractedPattern
- Then the pattern should have implementsPatterns ["EventStoreDurability"]

**Parse implements with multiple patterns**

- Given a TypeScript file with content:
- When the AST parser extracts metadata
- Then the directive should have implements ["EventStoreDurability", "IdempotentAppend"]

```typescript
/**
 * @libar-docs
 * @libar-docs-implements EventStoreDurability, IdempotentAppend
 */
export function durabilityPrimitive() {}
```

**CSV values are trimmed**

- Given a TypeScript file with implements " Pattern1 , Pattern2 "
- When the AST parser extracts metadata
- Then the directive should have implements ["Pattern1", "Pattern2"]

**Single implementation creates reverse lookup**

- Given patterns:
- And a pattern "EventStoreDurability" exists
- When the relationship index is built
- Then "EventStoreDurability" should have implementedBy ["outbox.ts"]

| name | implementsPatterns |
| --- | --- |
| outbox.ts | EventStoreDurability |

**Multiple implementations aggregate**

- Given patterns:
- And a pattern "EventStoreDurability" exists
- When the relationship index is built
- Then "EventStoreDurability" should have implementedBy containing all three files

| name | implementsPatterns |
| --- | --- |
| outbox.ts | EventStoreDurability |
| publication.ts | EventStoreDurability |
| idempotentAppend.ts | EventStoreDurability |

**DocDirective schema accepts implements**

- Given a DocDirective with implementsPatterns ["Pattern1"]
- When validating against DocDirectiveSchema
- Then validation should pass

**RelationshipEntry schema accepts implementedBy**

- Given a RelationshipEntry with implementedBy ["file1.ts", "file2.ts"]
- When validating against RelationshipEntrySchema
- Then validation should pass

## Business Rules

**Implements tag is defined in taxonomy registry**

The tag registry defines `implements` with CSV format, enabling the
    data-driven AST parser to automatically extract it.

_Verified by: Implements tag exists in registry_

**Files can implement a single pattern**

_Verified by: Parse implements with single pattern, Implements preserved through extraction pipeline_

**Files can implement multiple patterns using CSV format**

_Verified by: Parse implements with multiple patterns, CSV values are trimmed_

**Transform builds implementedBy reverse lookup**

_Verified by: Single implementation creates reverse lookup, Multiple implementations aggregate_

**Schemas validate implements field correctly**

_Verified by: DocDirective schema accepts implements, RelationshipEntry schema accepts implementedBy_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
