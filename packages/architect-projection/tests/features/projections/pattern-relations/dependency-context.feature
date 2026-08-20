@architect
@architect-pattern:DependencyContextProjectionExecutableTests
@architect-implements:DependencyContextProjection
@architect-status:completed
@architect-product-area:Projection
@architect-role:projection
@pattern-relations
Feature: Dependency context projection

  **Business Value:** Consumers receive a single focal-rooted, bidirectional
  dependency view for any pattern: `upstream` (what the focal needs, its
  prerequisites) and `downstream` (what needs the focal, its blast radius),
  each expanded transitively with a precomputed summary. The consumer never
  specifies a direction and never reasons about graph internals, so UI trees,
  MCP tools, and docs read both directions without re-implementing traversal.

  **How It Works:** The projection delegates to the kernel's cycle-safe
  transitive-closure accessor `getDependencyContext`. The focal pattern is the
  root of both forests and never appears as a node. The upstream closure walks
  `dependsOn`∪`uses`; the downstream closure walks `usedBy`∪`enables`. Both
  honour `maxDepth`, flag a node `truncated: true` when it still has unexpanded
  edges in its direction, and stop at cycles. A pattern with no relationship
  entry yields empty `upstream`/`downstream` with a zeroed summary.

  Background:
    Given the Pattern Relations dependency context state is initialized
    And the following deliverables:
      | Deliverable             | Status   | Location |
      | Executable test feature | complete | packages/architect-projection/tests/features/projections/pattern-relations/dependency-context.feature |

  Rule: Dependency context is focal-rooted and bidirectional

    **Invariant:** The fragment emits the stable `DependencyContext` shape with
    `{focal, upstream, downstream, summary, options}`; the focal pattern is the
    root of both forests and never a node; `upstream` is the transitive
    `dependsOn`∪`uses` closure and `downstream` the transitive `usedBy`∪`enables`
    closure; `maxDepth` stops recursion and sets `truncated` when unexpanded
    edges remain; cycles never recurse; and a pattern with no relationship entry
    yields empty forests with a zeroed summary.

    **Rationale:** A consumer must answer both "what does X need" and "what
    breaks if X changes" from one focal-rooted response without reasoning about
    graph internals — a re-rooted single tree or a per-node focal flag would
    bury the focal and force the consumer to reconstruct direction.

    **Verified by:** focal is the root of both forests, upstream lists the transitive dependsOn closure, downstream lists the transitive dependents, maxDepth truncates both directions with markers, cycles stop recursion in both directions without malformed output, a pattern with no relationship entry yields empty forests

    @acceptance-criteria
    Scenario: focal is the root of both forests
      Given a dependency context with a three-level chain rooted at "MiddleService"
      When I project the dependency context for "MiddleService" with max depth 10
      Then the dependency context focal should be "MiddleService"
      And no node should carry a focal flag

    Scenario: upstream lists the transitive dependsOn closure
      Given a dependency context with a three-level chain rooted at "MiddleService"
      When I project the dependency context for "LeafConsumer" with max depth 10
      Then the dependency context upstream should expand "MiddleService" then "RootLib"
      And the dependency context summary should report 1 direct and 2 transitive upstream

    Scenario: downstream lists the transitive dependents
      Given a dependency context with a three-level chain rooted at "MiddleService"
      When I project the dependency context for "RootLib" with max depth 10
      Then the dependency context downstream should expand "MiddleService" then "LeafConsumer"
      And the dependency context summary should report 1 direct and 2 transitive downstream

    Scenario: maxDepth truncates both directions with markers
      Given a dependency context with a three-level chain rooted at "MiddleService"
      When I project the dependency context for "LeafConsumer" with max depth 1
      Then the dependency context upstream should truncate at "MiddleService"

    Scenario: cycles stop recursion in both directions without malformed output
      Given a dependency context with a dependency cycle
      When I project the dependency context for "CycleRoot" with max depth 5
      Then the dependency context upstream should not revisit "CycleRoot"

    Scenario: a pattern with no relationship entry yields empty forests
      Given a dependency context without a relationship index
      When I project the dependency context for "SoloPattern" with max depth 3
      Then the dependency context should have empty upstream and downstream
      And the dependency context summary should be zeroed

  Rule: Decision patterns surface their see-also governance chain upstream

    **Invariant:** The kernel context carries no dependency implication for
    see-also, so a decision pattern (one bearing `@architect-adr`) would
    otherwise read as isolated. For decision focals only, the projection grafts
    the see-also governance chain into the `upstream` forest, following only
    edges that lead to other decision patterns, bounded by `maxDepth`. The
    `upstream` summary counts grow to cover the grafted decisions; non-decision
    see-also links are never followed, and non-decision focals are unaffected.

    **Rationale:** A decision's structured lineage lives entirely in its
    see-also cross-links to the decisions it stands beside; surfacing that chain
    lets `getDependencyContext` and the `architect_dep_tree` MCP tool answer
    "what decisions does this build on" instead of showing an isolated node,
    while the adr→adr scoping keeps traversal small
    enough to stay clear of the perf gate.

    **Verified by:** a decision focal expands its see-also decision chain upstream, non-decision see-also links are not followed for a decision focal, a decision focal with a dependency chain also grafts its see-also lineage

    @acceptance-criteria
    Scenario: a decision focal expands its see-also decision chain upstream
      Given a dependency context with a three-decision governance chain
      When I project the dependency context for "ADR009ProjectionTrustBoundary" with max depth 10
      Then the dependency context upstream should expand "ADR006SingleReadModelArchitecture" then "ADR005CodecBasedMarkdownRendering"
      And the dependency context summary should report 1 direct and 2 transitive upstream

    Scenario: non-decision see-also links are not followed for a decision focal
      Given a dependency context with a three-decision governance chain
      When I project the dependency context for "ADR009ProjectionTrustBoundary" with max depth 10
      Then the dependency context upstream should not include "McpOutputSchemaValidation"

    Scenario: a decision focal with a dependency chain also grafts its see-also lineage
      Given a dependency context with a three-level chain and a three-decision governance chain
      When I project the dependency context for "ADR009ProjectionTrustBoundary" with max depth 10
      Then the dependency context upstream should expand the chain "MiddleService" then "RootLib" and the graft "ADR006SingleReadModelArchitecture" then "ADR005CodecBasedMarkdownRendering"
      And the dependency context summary should report 2 direct and 4 transitive upstream
