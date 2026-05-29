@projection
Feature: Fragment schema mirror
  Every projection FragmentKind must parse strictly, reject extras, and survive
  JSON round-trips. The parametric runner iterates the same contract over every
  fragment kind so schema discipline stays uniform across subdomains.

  Background:
    Given the Fragment schema test state is initialized

  Rule: Every fragment kind parses strictly and survives JSON round-trips

    @happy-path
    Scenario Outline: <kind> accepts a valid fragment
      Given a valid "<kind>" fragment fixture
      When I parse it with the "<kind>" schema
      Then the schema parse should succeed
      And the parsed fragment should equal the original fixture

      Examples:
        | kind                     |
        | PhaseProgress            |
        | StatusDistribution       |
        | ReleaseNotesDigest       |
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
        | OpenQuestionList         |
        | OrphanPatternList        |

    @validation
    Scenario Outline: <kind> rejects an invalid fragment
      Given an invalid "<kind>" fragment fixture
      When I safe-parse it with the "<kind>" schema
      Then the schema parse should fail

      Examples:
        | kind                     |
        | PhaseProgress            |
        | StatusDistribution       |
        | ReleaseNotesDigest       |
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
        | OpenQuestionList         |
        | OrphanPatternList        |

    @round-trip
    Scenario Outline: <kind> survives JSON round-trip identity
      Given a valid "<kind>" fragment fixture
      When I JSON round-trip it with the "<kind>" schema
      Then the round-tripped fragment should equal the original fixture

      Examples:
        | kind                     |
        | PhaseProgress            |
        | StatusDistribution       |
        | ReleaseNotesDigest       |
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
        | OpenQuestionList         |
        | OrphanPatternList        |

  Rule: Fragment schemas enforce structural invariants beyond the generic trio

    @enum
    Scenario: ArchitectureDiagram scope enum enforced
      Given an "ArchitectureDiagram" fragment fixture with an invalid scope enum
      When I safe-parse it with the "ArchitectureDiagram" schema
      Then the schema parse should fail

  Rule: FragmentSchema discriminated union narrows on the kind tag

    @validation
    Scenario: FragmentSchema rejects an unknown kind
      Given a fragment-shaped object whose kind is "NotARealKind"
      When I safe-parse it with the FragmentSchema discriminated union
      Then the schema parse should fail

    @happy-path
    Scenario: FragmentSchema accepts a known kind
      Given a valid "PatternCatalog" fragment fixture
      When I safe-parse it with the FragmentSchema discriminated union
      Then the discriminated-union parse should succeed
