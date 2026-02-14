# ✅ Arch Index Dataset

**Purpose:** Detailed requirements for the Arch Index Dataset feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Product Area | Generation |

## Description

As a documentation generator
  I want an archIndex built during dataset transformation
  So that I can efficiently look up patterns by role, context, and layer

## Acceptance Criteria

**Group patterns by role**

- Given patterns with arch annotations:
- When transformToMasterDataset runs
- Then archIndex byRole for "command-handler" should contain 2 patterns
- And archIndex byRole for "projection" should contain 1 pattern

| name | archRole | archContext | archLayer |
| --- | --- | --- | --- |
| Handler1 | command-handler | orders | application |
| Handler2 | command-handler | inventory | application |
| Proj1 | projection | orders | application |

**Group patterns by context**

- Given patterns with arch annotations:
- When transformToMasterDataset runs
- Then archIndex byContext for "orders" should contain 2 patterns
- And archIndex byContext for "inventory" should contain 1 pattern

| name | archRole | archContext | archLayer |
| --- | --- | --- | --- |
| OrderHandler | command-handler | orders | application |
| OrderProj | projection | orders | application |
| InvHandler | command-handler | inventory | application |

**Group patterns by layer**

- Given patterns with arch annotations:
- When transformToMasterDataset runs
- Then archIndex byLayer should have counts:

| name | archRole | archContext | archLayer |
| --- | --- | --- | --- |
| Decider1 | decider | orders | domain |
| Handler1 | command-handler | orders | application |
| Infra1 | infrastructure | - | infrastructure |

| layer | count |
| --- | --- |
| domain | 1 |
| application | 1 |
| infrastructure | 1 |

**archIndex.all includes all annotated patterns**

- Given patterns with arch annotations:
- And a pattern without arch annotations:
- When transformToMasterDataset runs
- Then archIndex all should contain 3 patterns
- And archIndex all should not contain pattern "NoArchTags"

| name | archRole | archContext | archLayer |
| --- | --- | --- | --- |
| WithAll | projection | orders | application |
| WithRole | saga | - | - |
| WithContext | - | inventory | - |

| name |
| --- |
| NoArchTags |

**Non-annotated patterns excluded**

- Given patterns with arch annotations:
- And a pattern without arch annotations:
- When transformToMasterDataset runs
- Then archIndex all should contain 1 pattern
- And archIndex all should contain pattern "Annotated"

| name | archRole | archContext | archLayer |
| --- | --- | --- | --- |
| Annotated | projection | orders | application |

| name |
| --- |
| NotAnnotated1 |
| NotAnnotated2 |

## Business Rules

**archIndex groups patterns by arch-role**

The archIndex.byRole map groups patterns by their architectural role
    (command-handler, projection, saga, etc.) for efficient lookup.

_Verified by: Group patterns by role_

**archIndex groups patterns by arch-context**

The archIndex.byContext map groups patterns by bounded context
    for subgraph rendering in component diagrams.

_Verified by: Group patterns by context_

**archIndex groups patterns by arch-layer**

The archIndex.byLayer map groups patterns by architectural layer
    (domain, application, infrastructure) for layered diagram rendering.

_Verified by: Group patterns by layer_

**archIndex.all contains all patterns with any arch tag**

The archIndex.all array contains all patterns that have at least
    one arch tag (role, context, or layer). Patterns without any arch
    tags are excluded.

_Verified by: archIndex.all includes all annotated patterns_

**Patterns without arch tags are excluded from archIndex**

Patterns that have no arch-role, arch-context, or arch-layer are
    not included in the archIndex at all.

_Verified by: Non-annotated patterns excluded_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
