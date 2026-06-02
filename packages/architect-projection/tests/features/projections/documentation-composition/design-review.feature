@architect
@architect-pattern:DesignReviewProjectionExecutableTests
@architect-implements:DesignReviewProjection
@architect-enforces-decision:ADR010DocumentationCompositionHelpers
@architect-status:active
@architect-product-area:Generation
@architect-role:projection
@documentation-composition @design-review
Feature: DesignReviewProjection - design reviews include not-yet-implemented specs

  A design review is a component-diagram projection over the live PatternGraph
  that, unlike the production-only architecture view, includes working-state
  specs so a planned pattern's shape is reviewable before implementation. It
  reuses the ArchitectureDiagram fragment under its own heading (ADR-010 reuse)
  and is generated deterministically.

  Background:
    Given a graph with a completed production pattern, a candidate working-state spec, and a test feature

  Rule: A design review includes not-yet-implemented specs and excludes the test surface

    Scenario: the bundle root includes a working-state spec and excludes test features
      When I build the design-review bundle
      Then the bundle root kind should be "ArchitectureDiagram"
      And the bundle root presentation title should be "Design Review"
      And the bundle root patterns should include "PlannedFeature,WidgetService"
      And the bundle root patterns should exclude "WidgetServiceExecutableTests"
      And every bundle lens child should exclude "WidgetServiceExecutableTests"
      And every bundle lens child should render under a design-review heading

  Rule: A design review annotates each node with its lifecycle status so unbuilt shape is legible

    Scenario: the working-state spec node shows its status, the shipped pattern shows its own
      When I build the design-review bundle
      Then the diagram for "PlannedFeature" should be annotated with status "candidate"
      And the diagram for "WidgetService" should be annotated with status "completed"

  Rule: A design review is a deterministic projection, never a hand-maintained artifact

    Scenario: building the design-review bundle twice yields an identical bundle
      When I build the design-review bundle twice
      Then the two design-review bundles should be deeply equal

  Rule: A design review's scope is a related set, not only one central pattern

    Scenario: a scoped review narrows to one product area
      When I project a design review scoped to product-area "Generation"
      Then the scoped diagram patterns should include "PlannedFeature"
      And the scoped diagram patterns should exclude "WidgetService"
