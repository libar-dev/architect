# ✅ Prd Implementation Section Testing

**Purpose:** Detailed requirements for the Prd Implementation Section Testing feature

---

## Overview

| Property     | Value     |
| ------------ | --------- |
| Status       | completed |
| Product Area | Generator |

## Description

Tests the Implementations section rendering in pattern documents.
Verifies that code stubs with @libar-docs-implements tags appear in pattern docs
with working links to the source files.

## Acceptance Criteria

**Implementations section renders with file links**

- Given a pattern "EventStoreDurability" defined with:
- And a TypeScript file "durability/outbox.ts" that implements "EventStoreDurability" with:
- When generating the pattern document for "EventStoreDurability"
- Then the document contains heading "Implementations"
- And the document contains file link to "durability/outbox.ts"
- And the document contains implementation description "Action results captured"

| Field    | Value          |
| -------- | -------------- |
| status   | roadmap        |
| category | event-sourcing |

| Field       | Value                                           |
| ----------- | ----------------------------------------------- |
| name        | OutboxPattern                                   |
| description | Action results captured via onComplete mutation |

**Implementation includes description when available**

- Given a pattern "TestPattern" defined with:
- And a TypeScript file "impl/test-impl.ts" that implements "TestPattern" with:
- When generating the pattern document for "TestPattern"
- Then the document contains implementation description "This implementation provides core functionality"

| Field    | Value  |
| -------- | ------ |
| status   | active |
| category | core   |

| Field       | Value                                           |
| ----------- | ----------------------------------------------- |
| name        | TestImpl                                        |
| description | This implementation provides core functionality |

**Multiple implementations sorted by file path**

- Given a pattern "MultiImplPattern" defined with:
- And TypeScript files that implement "MultiImplPattern":
- When generating the pattern document for "MultiImplPattern"
- Then implementations appear in file path order:

| Field    | Value  |
| -------- | ------ |
| status   | active |
| category | core   |

| File                           | Name               |
| ------------------------------ | ------------------ |
| durability/outbox.ts           | OutboxPattern      |
| durability/publication.ts      | PublicationPattern |
| durability/idempotentAppend.ts | IdempotentAppend   |

| File                           |
| ------------------------------ |
| durability/idempotentAppend.ts |
| durability/outbox.ts           |
| durability/publication.ts      |

**No implementations section when none exist**

- Given a pattern "NoImplPattern" defined with:
- And no TypeScript files implement "NoImplPattern"
- When generating the pattern document for "NoImplPattern"
- Then the document does not contain heading "Implementations"

| Field    | Value   |
| -------- | ------- |
| status   | roadmap |
| category | core    |

**Links are relative from patterns directory**

- Given a pattern "LinkTestPattern" defined with:
- And a TypeScript file "packages/@libar-dev/platform-core/src/durability/outbox.ts" that implements "LinkTestPattern" with:
- When generating the pattern document for "LinkTestPattern"
- Then the implementation link path starts with "../"
- And the implementation link path contains "outbox.ts"

| Field    | Value  |
| -------- | ------ |
| status   | active |
| category | infra  |

| Field       | Value                 |
| ----------- | --------------------- |
| name        | Outbox                |
| description | Outbox implementation |

## Business Rules

**Implementation files appear in pattern docs via @libar-docs-implements**

_Verified by: Implementations section renders with file links, Implementation includes description when available_

**Multiple implementations are listed alphabetically**

_Verified by: Multiple implementations sorted by file path_

**Patterns without implementations omit the section**

_Verified by: No implementations section when none exist_

**Implementation references use relative file links**

_Verified by: Links are relative from patterns directory_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
