@libar-docs
@behavior @reference-codec
@libar-docs-pattern:ReferenceCodecDiagramTesting
@libar-docs-status:completed
@libar-docs-unlock-reason:'Split-from-original'
@libar-docs-implements:ReferenceDocShowcase
@libar-docs-product-area:Generation
Feature: Reference Codec - Diagram Scoping

  Scoped diagram generation from diagramScope and diagramScopes config,
  including archContext, include, archLayer, patterns filters, and
  multiple diagram scope composition.

  Background:
    Given a reference codec test context

  Rule: Scoped diagrams are generated from diagramScope config

    **Invariant:** Diagram content is determined exclusively by diagramScope filters (archContext, include, archLayer, patterns), and filters compose via OR — a pattern matching any single filter appears in the diagram.
    **Rationale:** Without filter-driven scoping, diagrams would include all patterns regardless of relevance, producing unreadable visualizations that obscure architectural boundaries.

    @happy-path
    Scenario: Config with diagramScope produces mermaid block at detailed level
      Given a reference config with diagramScope archContext "lint"
      And a MasterDataset with arch-annotated patterns in context "lint"
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the document has a heading "Component Overview"

    @happy-path
    Scenario: Neighbor patterns appear in diagram with distinct style
      Given a reference config with diagramScope archContext "lint"
      And a MasterDataset with arch patterns where lint uses validation
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content contains "neighbor"
      And the mermaid diagram includes a Related subgraph
      And the mermaid diagram includes dashed neighbor styling

    @happy-path
    Scenario: include filter selects patterns by include tag membership
      Given a reference config with diagramScope include "pipeline-stages"
      And a MasterDataset with patterns in include "pipeline-stages"
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content contains "PatternScanner"

    @edge-case
    Scenario: Self-contained scope produces no Related subgraph
      Given a reference config with diagramScope archContext "lint"
      And a MasterDataset with self-contained lint patterns
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content does not contain "Related"

    @edge-case
    Scenario: Multiple filter dimensions OR together
      Given a reference config with diagramScope combining archContext and include
      And a MasterDataset where one pattern matches archContext and another matches include
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content contains both "LintRules" and "DocExtractor"

    @happy-path
    Scenario: Explicit pattern names filter selects named patterns
      Given a reference config with diagramScope patterns "LintRules"
      And a MasterDataset with multiple arch-annotated patterns
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content contains "LintRules"
      And the mermaid content does not contain "DocExtractor"

    @edge-case
    Scenario: Config without diagramScope produces no diagram section
      Given a reference config with convention tags "fsm-rules" and behavior tags ""
      And a MasterDataset with arch-annotated patterns in context "lint"
      When decoding at detail level "detailed"
      Then the document does not have a heading "Component Overview"

    @happy-path
    Scenario: archLayer filter selects patterns by architectural layer
      Given a reference config with diagramScope archLayer "domain"
      And a MasterDataset with patterns in domain and infrastructure layers
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content contains "DomainPattern"
      And the mermaid content does not contain "InfraPattern"

    @happy-path
    Scenario: archLayer and archContext compose via OR
      Given a reference config with diagramScope archLayer "domain" and archContext "shared"
      And a MasterDataset with a domain-layer pattern and a shared-context pattern
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content contains both "DomainPattern" and "SharedPattern"

    @happy-path
    Scenario: Summary level omits scoped diagram
      Given a reference config with diagramScope archContext "lint"
      And a MasterDataset with arch-annotated patterns in context "lint"
      When decoding at detail level "summary"
      Then the document does not contain a mermaid block

  Rule: Hardcoded diagram sources render deterministic output

    **Invariant:** Hardcoded diagram sources render without relationship-scoping input and emit stable, source-specific Mermaid content.
    **Rationale:** Domain diagrams such as pipeline and MasterDataset fan-out encode canonical architecture views that should not depend on ad-hoc test dataset shape.
    **Verified by:** master-dataset-views source renders expected fan-out nodes

    @happy-path
    Scenario: master-dataset-views source produces MasterDataset fan-out diagram
      Given a reference config with diagramScope source "master-dataset-views"
      And a MasterDataset with arch-annotated patterns in context "lint"
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content contains "graph TB"
      And the mermaid content contains all of "MasterDataset", "byStatus", "byPhase", and "relationshipIndex"

  Rule: Multiple diagram scopes produce multiple mermaid blocks

    **Invariant:** Each entry in the diagramScopes array produces an independent Mermaid block with its own title and direction, and legacy singular diagramScope remains supported as a fallback.
    **Rationale:** Product areas require multiple architectural views (e.g., system overview and data flow) from a single configuration, and breaking backward compatibility with the singular diagramScope would silently remove diagrams from existing consumers.

    @happy-path
    Scenario: Config with diagramScopes array produces multiple diagrams
      Given a reference config with two diagramScopes
      And a MasterDataset with patterns in two different include groups
      When decoding at detail level "detailed"
      Then the document contains 2 mermaid blocks
      And the document has headings "Codec Transformation" and "Pipeline Data Flow"

    @happy-path
    Scenario: Diagram direction is reflected in mermaid output
      Given a reference config with LR direction diagramScope
      And a MasterDataset with patterns in include "pipeline-stages"
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the mermaid content contains "graph LR"

    @edge-case
    Scenario: Legacy diagramScope still works when diagramScopes is absent
      Given a reference config with diagramScope archContext "lint"
      And a MasterDataset with arch-annotated patterns in context "lint"
      When decoding at detail level "detailed"
      Then the document contains a mermaid block
      And the document has a heading "Component Overview"
