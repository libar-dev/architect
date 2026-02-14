@libar-docs
@libar-docs-pattern:ProcessStateAPIRelationshipQueries
@libar-docs-status:active
@libar-docs-unlock-reason:Relationships-available-via-getPatternRelationships-superseded-by-DataAPIRelationshipGraph
@libar-docs-phase:24
@libar-docs-product-area:DataAPI
@libar-docs-effort:3d
Feature: ProcessStateAPI Relationship Queries

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

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Implementation relationship queries | superseded | src/api/process-state.ts | No | N/A |
      | Inheritance hierarchy queries | superseded | src/api/process-state.ts | No | N/A |
      | ProcessStateAPI type extensions | complete | src/api/types.ts | Yes | unit |
      | Relationship query step definitions | superseded | N/A | No | N/A |

  # ═══════════════════════════════════════════════════════════════════════════════
  # RULE 1: Implementation Relationship Queries
  # ═══════════════════════════════════════════════════════════════════════════════

  Rule: API provides implementation relationship queries

    **Invariant:** Every pattern with `implementedBy` entries is discoverable via the API.

    **Rationale:** Claude Code needs to navigate from abstract patterns to concrete code.
    Without this, exploration requires manual grep + file reading, wasting context tokens.

    | Query | Returns | Use Case |
    | getImplementations(pattern) | File paths implementing the pattern | "Show me the code for EventStoreDurability" |
    | getImplementedPatterns(file) | Patterns the file implements | "What patterns does outbox.ts implement?" |
    | hasImplementations(pattern) | boolean | Filter patterns with/without implementations |

    **Verified by:** Query implementations for pattern, Query implemented patterns for file

    @acceptance-criteria @happy-path
    Scenario: Query implementations for a pattern
      Given a pattern "ProcessGuardLinter" exists
      And files implement this pattern:
        | File | Via Tag |
        | src/lint/process-guard/decider.ts | @libar-docs-implements:ProcessGuardLinter |
        | src/lint/process-guard/derive-state.ts | @libar-docs-implements:ProcessGuardLinter |
      When querying getImplementations("ProcessGuardLinter")
      Then the result should contain both file paths
      And the result should be sorted alphabetically

    @acceptance-criteria @happy-path
    Scenario: Query implemented patterns for a file
      Given a file "decider.ts" with tag "@libar-docs-implements:ProcessGuardLinter, ProcessGuardDecider"
      When querying getImplementedPatterns("decider.ts")
      Then the result should contain ["ProcessGuardLinter", "ProcessGuardDecider"]

    @acceptance-criteria @validation
    Scenario: Query implementations for pattern with none
      Given a pattern "FuturePattern" with no implementations
      When querying getImplementations("FuturePattern")
      Then the result should be an empty array

  # ═══════════════════════════════════════════════════════════════════════════════
  # RULE 2: Inheritance Hierarchy Queries
  # ═══════════════════════════════════════════════════════════════════════════════

  Rule: API provides inheritance hierarchy queries

    **Invariant:** Pattern inheritance chains are fully navigable in both directions.

    **Rationale:** Patterns form specialization hierarchies (e.g., ReactiveProjections extends
    ProjectionCategories). Claude Code needs to understand what specializes a base pattern
    and what a specialized pattern inherits from.

    | Query | Returns | Use Case |
    | getExtensions(pattern) | Patterns extending this one | "What specializes ProjectionCategories?" |
    | getBasePattern(pattern) | Pattern this extends (or null) | "What does ReactiveProjections inherit from?" |
    | getInheritanceChain(pattern) | Full chain to root | "Show full hierarchy for CachedProjections" |

    **Verified by:** Query extensions, Query base pattern, Full inheritance chain

    @acceptance-criteria @happy-path
    Scenario: Query extensions for a base pattern
      Given patterns with inheritance:
        | Pattern | Extends |
        | ProjectionCategories | (none) |
        | ReactiveProjections | ProjectionCategories |
        | CachedProjections | ProjectionCategories |
      When querying getExtensions("ProjectionCategories")
      Then the result should contain ["ReactiveProjections", "CachedProjections"]

    @acceptance-criteria @happy-path
    Scenario: Query base pattern
      Given a pattern "ReactiveProjections" that extends "ProjectionCategories"
      When querying getBasePattern("ReactiveProjections")
      Then the result should be "ProjectionCategories"

    @acceptance-criteria @happy-path
    Scenario: Full inheritance chain
      Given patterns:
        | Pattern | Extends |
        | BaseProjection | (none) |
        | ProjectionCategories | BaseProjection |
        | ReactiveProjections | ProjectionCategories |
      When querying getInheritanceChain("ReactiveProjections")
      Then the result should be ["ReactiveProjections", "ProjectionCategories", "BaseProjection"]

  # ═══════════════════════════════════════════════════════════════════════════════
  # RULE 3: Combined Relationship Queries
  # ═══════════════════════════════════════════════════════════════════════════════

  Rule: API provides combined relationship views

    **Invariant:** All relationship types are accessible through a unified interface.

    **Rationale:** Claude Code often needs the complete picture: dependencies AND implementations
    AND inheritance. A single call reduces round-trips and context switching.

    **API:** See `@libar-dev/delivery-process/src/api/process-state.ts`

    **Verified by:** Get all relationships, Filter by relationship type

    @acceptance-criteria @happy-path
    Scenario: Get all relationships for a pattern
      Given a pattern "DCB" with:
        | Relationship | Values |
        | uses | CMSDualWrite, CommandBus |
        | usedBy | CommandOrchestrator |
        | implementedBy | dcb-executor.ts |
        | extends | (none) |
      When querying getAllRelationships("DCB")
      Then the result should include all relationship types
      And each type should have its values populated

    @acceptance-criteria @happy-path
    Scenario: Filter patterns by relationship existence
      Given multiple patterns with varying relationships
      When querying getPatternsWithImplementations()
      Then only patterns with non-empty implementedBy should be returned

  # ═══════════════════════════════════════════════════════════════════════════════
  # RULE 4: Traceability Support
  # ═══════════════════════════════════════════════════════════════════════════════

  Rule: API supports bidirectional traceability queries

    **Invariant:** Navigation from spec to code and code to spec is symmetric.

    **Rationale:** Traceability is bidirectional by definition. If a spec links to code,
    the code should link back to the spec. The API should surface broken links.

    | Query | Returns | Use Case |
    | getTraceabilityStatus(pattern) | {hasSpecs, hasImplementations, isSymmetric} | Audit traceability completeness |
    | getBrokenLinks() | Patterns with asymmetric traceability | Find missing back-links |

    **Verified by:** Check traceability status, Detect broken links

    @acceptance-criteria @happy-path
    Scenario: Check traceability status for well-linked pattern
      Given a pattern "DCB" with:
        | Attribute | Value |
        | executableSpecs | platform-core/tests/features/behavior/dcb |
        | implementedBy | dcb-executor.ts, dcb-state.ts |
      When querying getTraceabilityStatus("DCB")
      Then hasSpecs should be true
      And hasImplementations should be true
      And isSymmetric should be true

    @acceptance-criteria @validation
    Scenario: Detect broken traceability links
      Given patterns with asymmetric links:
        | Pattern | Has executableSpecs | Has implementedBy |
        | PatternA | Yes | No |
        | PatternB | No | Yes |
        | PatternC | Yes | Yes |
      When querying getBrokenLinks()
      Then the result should include "PatternA" (missing implementations)
      And the result should include "PatternB" (missing specs)
      And the result should NOT include "PatternC"
