@architect
@architect-pattern:DependencyTreeProjectionExecutableTests
@architect-implements:DependencyTreeProjection
@architect-status:completed
@architect-phase:49
@architect-product-area:Projection
@architect-role:projection
@pattern-relations
Feature: Dependency tree projection

  **Business Value:** Consumers receive a rooted dependency tree for any focal
  pattern, with focal highlighting, truncation markers, and a preserved
  traversal semantics carried over from the legacy query, so UI trees, MCP
  tools, and docs can render hierarchies without re-implementing traversal.

  **How It Works:** The projection walks upward from the focal pattern to find
  the tree root, then recursively expands children through the relationship
  index while honouring `maxDepth`, detecting cycles to avoid repeated
  expansion, and flagging nodes with `truncated: true` when more children
  exist beyond the depth bound. Missing relationship indices collapse the
  tree to the focal node only.

  Background:
    Given the Pattern Relations dependency tree state is initialized
    And the following deliverables:
      | Deliverable             | Status   | Location |
      | Executable test feature | complete | packages/architect-projection/tests/features/projections/pattern-relations/dependency-tree.feature |

  Rule: Dependency trees keep the fragment contract while preserving legacy traversal semantics

    **Invariant:** Trees emit the stable `DependencyTree` fragment with
    `{root, nodes, options}`, honour `maxDepth` by stopping recursion and
    setting `truncated` when more children exist, never recurse through a
    cycle, and fall back to a single-node tree rooted at the focal pattern
    when the relationship index is absent.

    **Rationale:** Consumers depend on a shape-stable tree with explicit
    truncation and cycle handling — silent infinite recursion, malformed
    output, or hidden truncation would break UI rendering and MCP tooling.

    **Verified by:** maxDepth truncates deep dependency chains, dependency cycles stop recursion without malformed output, missing relationship indices fall back to a single focal root

    @acceptance-criteria
    Scenario: maxDepth truncates deep dependency chains
      Given a dependency tree context with a five-level chain rooted at "PatternGraph"
      When I project the dependency tree for "PatternGraphSearch" with max depth 2
      Then the dependency tree should truncate descendants at depth 2

    Scenario: dependency cycles stop recursion without malformed output
      Given a dependency tree context with a dependency cycle
      When I project the dependency tree for "CycleRoot" with max depth 5
      Then the dependency tree should keep the cycle leaf childless

    Scenario: missing relationship indices fall back to a single focal root
      Given a dependency tree context without a relationship index
      When I project the dependency tree for "SoloPattern" with max depth 3
      Then the dependency tree should keep only the focal root node
