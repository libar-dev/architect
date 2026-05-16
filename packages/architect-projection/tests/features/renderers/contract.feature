@projection
Feature: Renderer and progressive disclosure contract
  The Wave 3 contract locks bundle routing and renderer signatures before any renderer bodies or projection bodies land.

  Background:
    Given the renderer contract test state is initialized

  Rule: Single-fragment helpers stay minimal and discriminable

    **Invariant:** A projection can always wrap a single fragment without inventing child files, and callers can distinguish bundles from bare fragments structurally.
    **Rationale:** Later waves depend on one stable bundle shape instead of per-projection special cases.

    @happy-path
    Scenario: projectSingle wraps a single fragment correctly
      Given a PatternSummary fragment fixture
      When I wrap the fragment with projectSingle
      Then the bundle should keep the fragment as its root
      And the bundle should start with no children
      And the bundle should not define routing

    @type-guard
    Scenario: isBundle discriminates bundles from bare fragments
      Given a bare fragment fixture and a routed bundle fixture
      When I inspect both values with isBundle
      Then only the routed bundle should be identified as a bundle
      And bundle discrimination should expose the bundle root kind

    @dispatch
    Scenario: dispatchByKind falls back when a kind has no direct renderer
      Given a PatternSummary fragment fixture
      When I dispatch the fragment with and without a matching kind handler
      Then dispatchByKind should use the direct handler when present
      And dispatchByKind should use the fallback when the kind handler is omitted

  Rule: Renderer contracts stay format-specific without implementation coupling

    **Invariant:** Markdown may expand routed bundles into file records, while compact text stays scalar and JSON/UI stay structured.
    **Rationale:** Wave 3 defines the pure interfaces so Wave 4 can implement each renderer independently.

    @contract
    Scenario: renderer signature types stay locked to the bundle contract
      When I assert the renderer contract types
      Then the renderer contract assertions should compile

    @routing
    Scenario: bundle child routing defines markdown record paths
      Given a routed bundle fixture with two children
      When I materialize the markdown routing contract
      Then the markdown record should include the routed root and child paths
      And every routed markdown path should be unique

  Rule: Progressive disclosure decisions remain explicit in the architecture doc

    **Invariant:** Delivery-reporting view splitting, markdown-only oversize splitting, and markdown-only flattening must stay documented because later renderer and projection tasks build on them.
    **Rationale:** The contract is the gate for every later renderer and projection-body task.

    @documentation
    Scenario: Delivery-reporting view splitting keeps roadmap internal but retained views public
      Given the progressive disclosure contract document
      When I inspect the delivery-reporting splitting decision
      Then the document should name the retained public delivery-reporting projection entrypoints
      And the document should keep roadmap generation inside documentation composition

    @documentation
    Scenario: Oversized document splitting is markdown-only
      Given the progressive disclosure contract document
      When I inspect the split semantics decision
      Then the document should mark oversized splitting as markdown-only
      And the document should list compact text, JSON, and UI as non-splitting renderers

    @documentation
    Scenario: Additional files flatten only for markdown
      Given the progressive disclosure contract document
      When I inspect the additional files decision
      Then the document should describe markdown output as a file-path record
      And the document should keep JSON and UI outputs structured
