@architect
@architect-pattern:ArchIndexDataset
@architect-status:completed
@architect-implements:ArchitectureDiagramGeneration
@architect-product-area:Generation
@architecture
Feature: Architecture Index in MasterDataset

  As a documentation generator
  I want an archIndex built during dataset transformation
  So that I can efficiently look up patterns by role, context, and layer

  Background: Dataset transformation setup
    Given a tag registry is loaded

  # ============================================================================
  # ArchIndex Grouping Rules
  # ============================================================================

  Rule: archIndex groups patterns by arch-role

    **Invariant:** Every pattern with an arch-role tag must appear in the archIndex.byRole map under its role key.
    **Rationale:** Diagram generators need O(1) lookup of patterns by role to render role-based groupings efficiently.
    **Verified by:** Group patterns by role

    The archIndex.byRole map groups patterns by their architectural role
    (command-handler, projection, saga, etc.) for efficient lookup.

    @acceptance-criteria @happy-path
    Scenario: Group patterns by role
      Given patterns with arch annotations:
        | name     | archRole        | archContext | archLayer   |
        | Handler1 | command-handler | orders      | application |
        | Handler2 | command-handler | inventory   | application |
        | Proj1    | projection      | orders      | application |
      When transformToMasterDataset runs
      Then archIndex byRole for "command-handler" should contain 2 patterns
      And archIndex byRole for "projection" should contain 1 pattern

  Rule: archIndex groups patterns by arch-context

    **Invariant:** Every pattern with an arch-context tag must appear in the archIndex.byContext map under its context key.
    **Rationale:** Component diagrams render bounded context subgraphs and need patterns grouped by context.
    **Verified by:** Group patterns by context

    The archIndex.byContext map groups patterns by bounded context
    for subgraph rendering in component diagrams.

    @acceptance-criteria @happy-path
    Scenario: Group patterns by context
      Given patterns with arch annotations:
        | name          | archRole        | archContext | archLayer   |
        | OrderHandler  | command-handler | orders      | application |
        | OrderProj     | projection      | orders      | application |
        | InvHandler    | command-handler | inventory   | application |
      When transformToMasterDataset runs
      Then archIndex byContext for "orders" should contain 2 patterns
      And archIndex byContext for "inventory" should contain 1 pattern

  Rule: archIndex groups patterns by arch-layer

    **Invariant:** Every pattern with an arch-layer tag must appear in the archIndex.byLayer map under its layer key.
    **Rationale:** Layered diagrams render layer subgraphs and need patterns grouped by architectural layer.
    **Verified by:** Group patterns by layer

    The archIndex.byLayer map groups patterns by architectural layer
    (domain, application, infrastructure) for layered diagram rendering.

    @acceptance-criteria @happy-path
    Scenario: Group patterns by layer
      Given patterns with arch annotations:
        | name     | archRole        | archContext | archLayer      |
        | Decider1 | decider         | orders      | domain         |
        | Handler1 | command-handler | orders      | application    |
        | Infra1   | infrastructure  | -           | infrastructure |
      When transformToMasterDataset runs
      Then archIndex byLayer should have counts:
        | layer          | count |
        | domain         | 1     |
        | application    | 1     |
        | infrastructure | 1     |

  Rule: archIndex.all contains all patterns with any arch tag

    **Invariant:** archIndex.all must contain exactly the set of patterns that have at least one arch tag (role, context, or layer).
    **Rationale:** Consumers iterating over all architectural patterns need a single canonical list; omitting partially-tagged patterns would silently drop them from diagrams.
    **Verified by:** archIndex.all includes all annotated patterns

    The archIndex.all array contains all patterns that have at least
    one arch tag (role, context, or layer). Patterns without any arch
    tags are excluded.

    @acceptance-criteria @happy-path
    Scenario: archIndex.all includes all annotated patterns
      Given patterns with arch annotations:
        | name        | archRole        | archContext | archLayer   |
        | WithAll     | projection      | orders      | application |
        | WithRole    | saga            | -           | -           |
        | WithContext | -               | inventory   | -           |
      And a pattern without arch annotations:
        | name       |
        | NoArchTags |
      When transformToMasterDataset runs
      Then archIndex all should contain 3 patterns
      And archIndex all should not contain pattern "NoArchTags"

  Rule: Patterns without arch tags are excluded from archIndex

    **Invariant:** Patterns lacking all three arch tags (role, context, layer) must not appear in any archIndex view.
    **Rationale:** Including non-architectural patterns would pollute diagrams with irrelevant components.
    **Verified by:** Non-annotated patterns excluded

    Patterns that have no arch-role, arch-context, or arch-layer are
    not included in the archIndex at all.

    @acceptance-criteria @validation
    Scenario: Non-annotated patterns excluded
      Given patterns with arch annotations:
        | name     | archRole   | archContext | archLayer   |
        | Annotated | projection | orders      | application |
      And a pattern without arch annotations:
        | name          |
        | NotAnnotated1 |
        | NotAnnotated2 |
      When transformToMasterDataset runs
      Then archIndex all should contain 1 pattern
      And archIndex all should contain pattern "Annotated"

