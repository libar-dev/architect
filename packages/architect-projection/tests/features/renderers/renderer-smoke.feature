@projection
Feature: Every renderer accepts every fragment kind without throwing
  New FragmentKinds must be accepted by each of the four renderers as a valid
  ProjectionInput that produces a non-empty projection. This guards against silent
  "renderer does not handle kind X" regressions when kinds are added without updating
  a renderer.

  Background:
    Given the renderer smoke test state is initialized

  Rule: All four renderers produce a non-empty projection for every fragment kind

    @happy-path
    Scenario Outline: all four renderers accept a <kind> fragment
      Given a valid "<kind>" fragment fixture
      When I run renderCompactText, renderJson, renderMarkdown, and renderUi against the fixture
      Then no renderer throws
      And each renderer produces a non-empty projection

      Examples:
        | kind                     |
        | StatusDistribution       |
        | TraceabilityMatrix       |
        | ProjectConfigSnapshot    |
        | ArchitectureDiagram      |
        | PrChangeReview           |
        | SessionContextBundle     |
        | ScopeReadinessCheck      |
        | ScopeReadinessReport     |
        | HandoffRecord            |
        | FileReadingList          |
        | Deliverable              |
        | DeliverableManifest      |
        | DecisionRecord           |
        | DecisionCatalog          |
        | BusinessRule             |
        | BusinessRuleSet          |
        | ValidationRuleDigest     |
        | TaxonomyDigest           |
        | OverviewDigest           |
        | AnnotationCoverage       |
        | TagUsageEntry            |
        | TagUsageMatrix           |
        | SourceInventoryEntry     |
        | SourceInventoryDigest    |
        | RoleProfile              |
        | RoleProfileCollection    |
        | RequirementDigest        |
        | PatternCatalog           |
        | BoundedContext           |
        | ArchitectureComparison   |
        | PatternSummary           |
        | PatternDetail            |
        | DependencyEdge           |
        | DependencyEdgeSet        |
        | DependencyContext        |
        | ArchitectureNeighborhood |
        | OrphanPatternList        |
