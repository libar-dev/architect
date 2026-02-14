# ✅ Implementation Link Path Normalization

**Purpose:** Detailed requirements for the Implementation Link Path Normalization feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Product Area | Generation |

## Description

Links to implementation files in generated pattern documents should have
  correct relative paths. Repository prefixes like "libar-platform/" must
  be stripped to produce valid links from the output directory.

## Acceptance Criteria

**Strip libar-platform prefix from implementation paths**

- Given a pattern with implementation:
- When the pattern detail document is generated
- Then the implementation link path is "../../packages/core/src/handler.ts"
- And the link text is "`handler.ts`"

| file | description |
| --- | --- |
| libar-platform/packages/core/src/handler.ts | Main handler |

**Strip monorepo prefix from implementation paths**

- Given a pattern with implementation:
- When the pattern detail document is generated
- Then the implementation link path is "../../packages/api/src/client.ts"

| file | description |
| --- | --- |
| monorepo/packages/api/src/client.ts | API client |

**Preserve paths without repository prefix**

- Given a pattern with implementation:
- When the pattern detail document is generated
- Then the implementation link path is "../../packages/core/src/handler.ts"

| file | description |
| --- | --- |
| packages/core/src/handler.ts | Main handler |

**Multiple implementations with mixed prefixes**

- Given a pattern with implementations:
- When the pattern detail document is generated
- Then the implementation links should be:

| file | description |
| --- | --- |
| libar-platform/packages/core/src/a.ts | File A |
| packages/core/src/b.ts | File B |
| libar-platform/packages/api/src/c.ts | File C |

| index | path |
| --- | --- |
| 1 | ../../packages/api/src/c.ts |
| 2 | ../../packages/core/src/a.ts |
| 3 | ../../packages/core/src/b.ts |

**Strips libar-platform/ prefix**

- Given file path "libar-platform/packages/core/src/file.ts"
- When normalizeImplPath is called
- Then the result is "packages/core/src/file.ts"

**Strips monorepo/ prefix**

- Given file path "monorepo/packages/core/src/file.ts"
- When normalizeImplPath is called
- Then the result is "packages/core/src/file.ts"

**Returns unchanged path without known prefix**

- Given file path "packages/core/src/file.ts"
- When normalizeImplPath is called
- Then the result is "packages/core/src/file.ts"

**Only strips prefix at start of path**

- Given file path "packages/libar-platform/src/file.ts"
- When normalizeImplPath is called
- Then the result is "packages/libar-platform/src/file.ts"

## Business Rules

**Repository prefixes are stripped from implementation paths**

_Verified by: Strip libar-platform prefix from implementation paths, Strip monorepo prefix from implementation paths, Preserve paths without repository prefix_

**All implementation links in a pattern are normalized**

_Verified by: Multiple implementations with mixed prefixes_

**normalizeImplPath strips known prefixes**

_Verified by: Strips libar-platform/ prefix, Strips monorepo/ prefix, Returns unchanged path without known prefix, Only strips prefix at start of path_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
