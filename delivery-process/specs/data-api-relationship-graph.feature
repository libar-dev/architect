@libar-docs
@libar-docs-pattern:DataAPIRelationshipGraph
@libar-docs-status:roadmap
@libar-docs-phase:25c
@libar-docs-product-area:DataAPI
@libar-docs-effort:2d
@libar-docs-priority:medium
@libar-docs-business-value:deep-dependency-analysis-and-health-checks
Feature: Data API Relationship Graph - Deep Dependency Analysis

  **Problem:**
  The current API provides flat relationship lookups (`getPatternDependencies`,
  `getPatternRelationships`) but no recursive traversal, impact analysis, or
  graph health checks. Agents cannot answer "if I change X, what breaks?",
  "what's the path from A to B?", or "which patterns have broken references?"
  without manual multi-step exploration.

  **Solution:**
  Add graph query commands that operate on the full relationship graph:
  1. `graph <pattern> [--depth N] [--direction up|down|both]` for recursive traversal
  2. `graph impact <pattern>` for transitive dependent analysis
  3. `graph path <from> <to>` for finding relationship chains
  4. `graph dangling` for broken reference detection
  5. `graph orphans` for isolated pattern detection
  6. `graph blocking` for blocked chain visualization

  **Business Value:**
  | Benefit | Impact |
  | Impact analysis | Know change blast radius before modifying |
  | Dangling references | Detect annotation errors automatically |
  | Blocking chains | Understand what prevents progress |
  | Path finding | Discover non-obvious relationships |

  **Relationship to ProcessStateAPIRelationshipQueries:**
  This spec supersedes the earlier ProcessStateAPIRelationshipQueries spec,
  which focused on implementation/inheritance convenience methods. The
  underlying data is available via getPatternRelationships(). This spec
  adds graph-level operations that traverse relationships recursively.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | Graph traversal engine | pending | src/api/graph-traversal.ts | Yes | unit |
      | graph subcommand | pending | src/cli/process-api.ts | Yes | integration |
      | Impact analysis | pending | src/api/graph-traversal.ts | Yes | unit |
      | Path finding algorithm | pending | src/api/graph-traversal.ts | Yes | unit |
      | Dangling reference detector | pending | src/api/graph-health.ts | Yes | unit |
      | Orphan pattern detector | pending | src/api/graph-health.ts | Yes | unit |

  # ============================================================================
  # RULE 1: Graph Traversal
  # ============================================================================

  Rule: Graph command traverses relationships recursively with configurable depth

    **Invariant:** Graph traversal walks both planning relationships (`dependsOn`,
    `enables`) and implementation relationships (`uses`, `usedBy`) with cycle
    detection to prevent infinite loops.

    **Rationale:** Flat lookups show direct connections. Recursive traversal shows
    the full picture: transitive dependencies, indirect consumers, and the complete
    chain from root to leaf. Depth limiting prevents overwhelming output on deeply
    connected graphs.

    **Verified by:** Recursive traversal, Depth limiting, Direction filtering

    @acceptance-criteria @happy-path
    Scenario: Recursive graph traversal
      Given a chain: A -> B -> C -> D with uses relationships
      When running "process-api graph A --depth 3 --direction down"
      Then the output shows A -> B -> C -> D as a tree
      And each node shows its status and phase

    @acceptance-criteria @happy-path
    Scenario: Bidirectional traversal with depth limit
      Given a pattern "C" in the middle of a chain
      When running "process-api graph C --depth 1 --direction both"
      Then the output shows direct parents (1 up) and direct children (1 down)
      And deeper relationships are not included

  # ============================================================================
  # RULE 2: Impact Analysis
  # ============================================================================

  Rule: Impact analysis shows transitive dependents of a pattern

    **Invariant:** Impact analysis answers "if I change X, what else is affected?"
    by walking `usedBy` + `enables` recursively.

    **Rationale:** Before modifying a completed pattern (which requires unlock),
    understanding the blast radius prevents unintended breakage. Impact analysis
    is the reverse of dependency traversal -- it looks forward, not backward.

    **Verified by:** Impact with transitive dependents, Impact with no dependents

    @acceptance-criteria @happy-path
    Scenario: Impact analysis shows transitive dependents
      Given "EventStore" is used by "Saga" which is used by "Orchestrator"
      When running "process-api graph impact EventStore"
      Then the output shows "Saga" and "Orchestrator" as affected
      And the output shows the chain of impact

    @acceptance-criteria @happy-path
    Scenario: Impact analysis for leaf pattern
      Given a pattern with no usedBy or enables relationships
      When running "process-api graph impact LeafPattern"
      Then the output indicates no downstream impact

  # ============================================================================
  # RULE 3: Path Finding
  # ============================================================================

  Rule: Path finding discovers relationship chains between two patterns

    **Invariant:** Path finding returns the shortest chain of relationships
    connecting two patterns, or indicates no path exists. Traversal considers
    all relationship types (uses, usedBy, dependsOn, enables).

    **Rationale:** Understanding how two seemingly unrelated patterns connect
    helps agents assess indirect dependencies before making changes. When
    pattern A and pattern D are connected through B and C, modifying A
    requires understanding that chain.

    **Verified by:** Path between connected patterns, No path between disconnected patterns

    @acceptance-criteria @happy-path
    Scenario: Find path between connected patterns
      Given a chain: EventStore -> Saga -> Orchestrator -> Workflow
      When running "process-api graph path EventStore Workflow"
      Then the output shows the chain: EventStore -> Saga -> Orchestrator -> Workflow
      And each hop shows the relationship type

    @acceptance-criteria @edge-case
    Scenario: No path between disconnected patterns
      Given "PatternA" and "PatternZ" with no connecting relationships
      When running "process-api graph path PatternA PatternZ"
      Then the output indicates no path exists between the patterns

  # ============================================================================
  # RULE 4: Graph Health Checks
  # ============================================================================

  Rule: Graph health commands detect broken references and isolated patterns

    **Invariant:** Dangling references (pattern names in `uses`/`dependsOn` that
    don't match any pattern definition) are detectable. Orphan patterns (no
    relationships at all) are identifiable.

    **Rationale:** The MasterDataset transformer already computes dangling
    references during Pass 3 (relationship resolution) but does not expose them
    via the API. Orphan patterns indicate missing annotations. Both are data
    quality signals that improve over time with attention.

    **Verified by:** Dangling reference detection, Orphan detection, Blocking chains

    @acceptance-criteria @happy-path
    Scenario: Detect dangling references
      Given a pattern with uses "NonExistentPattern"
      When running "process-api graph dangling"
      Then the output includes the broken reference
      And the output shows which pattern references it

    @acceptance-criteria @happy-path
    Scenario: Detect orphan patterns
      Given a pattern with no uses, usedBy, dependsOn, or enables
      When running "process-api graph orphans"
      Then the output includes the isolated pattern
      And the output suggests adding relationship tags

    @acceptance-criteria @happy-path
    Scenario: Show blocking chains
      Given patterns blocked by incomplete dependencies
      When running "process-api graph blocking"
      Then the output shows each blocked pattern with its blocker
      And the output shows the chain from blocker to blocked
      And completed dependencies are excluded from the blocked list
