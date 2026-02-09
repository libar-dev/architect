# ProcessStateAPIRelationshipQueries

**Purpose:** Active work details for ProcessStateAPIRelationshipQueries

---

## Progress

**Progress:** [██████████░░░░░░░░░░] 1/2 (50%)

| Status | Count |
| --- | --- |
| ✅ Completed | 1 |
| 🚧 Active | 1 |
| 📋 Planned | 0 |
| **Total** | 2 |

---

## 🚧 Active Work

### 🚧 Process State API Relationship Queries

| Property | Value |
| --- | --- |
| Effort | 3d |

**Problem:** ProcessStateAPI currently supports dependency queries (`uses`, `usedBy`, `dependsOn`,
  `enables`) but lacks implementation relationship queries. Claude Code cannot ask "what code
  implements this pattern?" or "what pattern does this file implement?"

  **Solution:** Extend ProcessStateAPI with relationship query methods that leverage the new
  `implements`/`extends` tags from PatternRelationshipModel:
  - Bidirectional traceability: spec → code and code → spec
  - Inheritance hierarchy navigation: base → specializations
  - Implementation discovery: pattern → implementing files

  **Business Value:**
  | Benefit | How |
  | Reduced context usage | Query exact relationships vs reading multiple files |
  | Faster exploration | "Show implementations" in one call vs grep + read |
  | Accurate traceability | Real-time from source annotations, not stale docs |

#### Deliverables

- 🔄 Implementation relationship queries (superseded)
- 🔄 Inheritance hierarchy queries (superseded)
- ✅ ProcessStateAPI type extensions (complete)
- 🔄 Relationship query step definitions (superseded)

#### Acceptance Criteria

**Query implementations for a pattern**

- Given a pattern "ProcessGuardLinter" exists
- And files implement this pattern:
- When querying getImplementations("ProcessGuardLinter")
- Then the result should contain both file paths
- And the result should be sorted alphabetically

| File | Via Tag |
| --- | --- |
| src/lint/process-guard/decider.ts | @libar-docs-implements:ProcessGuardLinter |
| src/lint/process-guard/derive-state.ts | @libar-docs-implements:ProcessGuardLinter |

**Query implemented patterns for a file**

- Given a file "decider.ts" with tag "@libar-docs-implements:ProcessGuardLinter, ProcessGuardDecider"
- When querying getImplementedPatterns("decider.ts")
- Then the result should contain ["ProcessGuardLinter", "ProcessGuardDecider"]

**Query implementations for pattern with none**

- Given a pattern "FuturePattern" with no implementations
- When querying getImplementations("FuturePattern")
- Then the result should be an empty array

**Query extensions for a base pattern**

- Given patterns with inheritance:
- When querying getExtensions("ProjectionCategories")
- Then the result should contain ["ReactiveProjections", "CachedProjections"]

| Pattern | Extends |
| --- | --- |
| ProjectionCategories | (none) |
| ReactiveProjections | ProjectionCategories |
| CachedProjections | ProjectionCategories |

**Query base pattern**

- Given a pattern "ReactiveProjections" that extends "ProjectionCategories"
- When querying getBasePattern("ReactiveProjections")
- Then the result should be "ProjectionCategories"

**Full inheritance chain**

- Given patterns:
- When querying getInheritanceChain("ReactiveProjections")
- Then the result should be ["ReactiveProjections", "ProjectionCategories", "BaseProjection"]

| Pattern | Extends |
| --- | --- |
| BaseProjection | (none) |
| ProjectionCategories | BaseProjection |
| ReactiveProjections | ProjectionCategories |

**Get all relationships for a pattern**

- Given a pattern "DCB" with:
- When querying getAllRelationships("DCB")
- Then the result should include all relationship types
- And each type should have its values populated

| Relationship | Values |
| --- | --- |
| uses | CMSDualWrite, CommandBus |
| usedBy | CommandOrchestrator |
| implementedBy | dcb-executor.ts |
| extends | (none) |

**Filter patterns by relationship existence**

- Given multiple patterns with varying relationships
- When querying getPatternsWithImplementations()
- Then only patterns with non-empty implementedBy should be returned

**Check traceability status for well-linked pattern**

- Given a pattern "DCB" with:
- When querying getTraceabilityStatus("DCB")
- Then hasSpecs should be true
- And hasImplementations should be true
- And isSymmetric should be true

| Attribute | Value |
| --- | --- |
| executableSpecs | platform-core/tests/features/behavior/dcb |
| implementedBy | dcb-executor.ts, dcb-state.ts |

**Detect broken traceability links**

- Given patterns with asymmetric links:
- When querying getBrokenLinks()
- Then the result should include "PatternA" (missing implementations)
- And the result should include "PatternB" (missing specs)
- And the result should NOT include "PatternC"

| Pattern | Has executableSpecs | Has implementedBy |
| --- | --- | --- |
| PatternA | Yes | No |
| PatternB | No | Yes |
| PatternC | Yes | Yes |

#### Business Rules

**API provides implementation relationship queries**

**Invariant:** Every pattern with `implementedBy` entries is discoverable via the API.

    **Rationale:** Claude Code needs to navigate from abstract patterns to concrete code.
    Without this, exploration requires manual grep + file reading, wasting context tokens.

    | Query | Returns | Use Case |
    | getImplementations(pattern) | File paths implementing the pattern | "Show me the code for EventStoreDurability" |
    | getImplementedPatterns(file) | Patterns the file implements | "What patterns does outbox.ts implement?" |
    | hasImplementations(pattern) | boolean | Filter patterns with/without implementations |

    **Verified by:** Query implementations for pattern, Query implemented patterns for file

_Verified by: Query implementations for a pattern, Query implemented patterns for a file, Query implementations for pattern with none_

**API provides inheritance hierarchy queries**

**Invariant:** Pattern inheritance chains are fully navigable in both directions.

    **Rationale:** Patterns form specialization hierarchies (e.g., ReactiveProjections extends
    ProjectionCategories). Claude Code needs to understand what specializes a base pattern
    and what a specialized pattern inherits from.

    | Query | Returns | Use Case |
    | getExtensions(pattern) | Patterns extending this one | "What specializes ProjectionCategories?" |
    | getBasePattern(pattern) | Pattern this extends (or null) | "What does ReactiveProjections inherit from?" |
    | getInheritanceChain(pattern) | Full chain to root | "Show full hierarchy for CachedProjections" |

    **Verified by:** Query extensions, Query base pattern, Full inheritance chain

_Verified by: Query extensions for a base pattern, Query base pattern, Full inheritance chain_

**API provides combined relationship views**

**Invariant:** All relationship types are accessible through a unified interface.

    **Rationale:** Claude Code often needs the complete picture: dependencies AND implementations
    AND inheritance. A single call reduces round-trips and context switching.

    **API:** See `@libar-dev/delivery-process/src/api/process-state.ts`

    **Verified by:** Get all relationships, Filter by relationship type

_Verified by: Get all relationships for a pattern, Filter patterns by relationship existence_

**API supports bidirectional traceability queries**

**Invariant:** Navigation from spec to code and code to spec is symmetric.

    **Rationale:** Traceability is bidirectional by definition. If a spec links to code,
    the code should link back to the spec. The API should surface broken links.

    | Query | Returns | Use Case |
    | getTraceabilityStatus(pattern) | {hasSpecs, hasImplementations, isSymmetric} | Audit traceability completeness |
    | getBrokenLinks() | Patterns with asymmetric traceability | Find missing back-links |

    **Verified by:** Check traceability status, Detect broken links

_Verified by: Check traceability status for well-linked pattern, Detect broken traceability links_

---

## ✅ Recently Completed

| Pattern | Description |
| --- | --- |
| ✅ Process State API CLI | The ProcessStateAPI provides 27 typed query methods for efficient state queries, but Claude Code sessions cannot use... |

---

[← Back to Current Work](../CURRENT-WORK.md)
