@architect
@architect-adr:006
@architect-adr-status:accepted
@architect-adr-category:architecture
@architect-adr-layer:infrastructure
@architect-adr-theme:projections
@architect-pattern:ADR006SingleReadModelArchitecture
@architect-status:completed
@architect-product-area:Generation
@architect-uses:ADR005CodecBasedMarkdownRendering
@architect-see-also:PatternGraph
@architect-unlock-reason:Add-Verified-by-sections-and-acceptance-criteria
Feature: ADR-006 - Single Read Model Architecture

  **Context:**
  The Architect package applies event sourcing to itself: git is
  the event store, annotated source files are authoritative state, generated
  documentation is a projection. The PatternGraph is the read model —
  produced by a single-pass O(n) transformer with pre-computed views
  and a relationship index.

  ADR-005 established that codecs consume PatternGraph as their sole input.
  The published Graph contract and pure read kernels consume it. But the validation layer bypasses it,
  wiring its own mini-pipeline from raw scanner/extractor output. It creates
  a lossy local type that discards relationship data, then discovers it
  lacks the information needed — requiring ad-hoc re-derivation of what
  the PatternGraph already computes.

  This is the same class of problem the PatternGraph was created to solve.
  Before the single-pass transformer, each generator called `.filter()`
  independently. The PatternGraph eliminated that duplication for codecs.
  This ADR extends the same principle to all consumers.

  **Decision:**
  The PatternGraph is the single read model for all consumers. No consumer
  re-derives pattern data from raw scanner/extractor output when that data
  is available in the PatternGraph. Validators, codecs, Graph consumers,
  and pure read kernels consume the same pre-computed read model.

  **Consequences:**
  | Type | Impact |
  | Positive | Relationship resolution happens once — no consumer re-derives implements, uses, or dependsOn |
  | Positive | Eliminates lossy local types that discard fields from canonical ExtractedPattern |
  | Positive | Validation rules automatically benefit from new PatternGraph views and indices |
  | Positive | Aligns with the monorepo's own ADR-006: projections for all reads, never query aggregate state |
  | Negative | Validators that today only need stage 1-2 data will import the transformer |
  | Negative | PatternGraph schema changes affect more consumers |

  Rule: All feature consumers query the read model, not raw state

    **Invariant:** Code that needs pattern relationships, status groupings,
    cross-source resolution, or dependency information consumes the
    PatternGraph. Direct scanner/extractor imports are permitted only in
    pipeline orchestration code that builds the PatternGraph.
    **Rationale:** Bypassing the read model forces consumers to re-derive data that the PatternGraph already computes, creating duplicate logic and divergent behavior when the pipeline evolves.
    **Verified by:** Feature consumers import from PatternGraph not from raw pipeline stages

    | Layer | May Import | Examples |
    | Pipeline Orchestration | scanner/, extractor/, pipeline/ | orchestrator.ts, cli-runtime.ts pipeline setup |
    | Feature Consumption | PatternGraph, relationshipIndex | codecs, Graph, pure read kernels, validators |

    Exception: `lint-patterns.ts`, `AntiPatternDetector`, `CoverageAnalyzer`,
    and `SessionStateReader` are legitimate stage-1 consumers.

    **Negative Space Principle:** Stage-1 exceptions exist only for consumers that
    need data the PatternGraph intentionally does not model. Examples include raw
    directive placement, removed tags the scanner discards, stripped Gherkin
    comments, file-size/layout checks, and discovery of unannotated files that are
    outside PatternGraph by definition. Exceptions are not for consumers that find
    the read model inconvenient.

    | Exception | Why raw access is correct |
    | --------- | ------------------------- |
    | `lint-patterns.ts` | Directive-level validation must inspect scanned directives that may fail extraction and never appear in PatternGraph |
    | `AntiPatternDetector` | It checks raw file content, stripped comments, and removed tags that PatternGraph intentionally does not preserve |
    | `CoverageAnalyzer` | It discovers unannotated files via glob/content checks; those files are outside PatternGraph by definition |
    | `SessionStateReader` | It reads ephemeral `sessions/*.feature` workflow files that intentionally stay outside the architectural read model |

  Rule: No lossy local types

    **Invariant:** Consumers do not define local DTOs that duplicate and
    discard fields from ExtractedPattern. If a consumer needs a subset, the
    type system provides the projection — not a hand-written extraction
    function that becomes a barrier between the consumer and canonical data.
    **Rationale:** Lossy local types silently drop fields that later become needed, causing bugs that only surface when new PatternGraph capabilities are added and the local type lacks them.
    **Verified by:** Feature consumers import from PatternGraph not from raw pipeline stages

  Rule: Relationship resolution is computed once

    **Invariant:** Forward relationships (uses, dependsOn, implementsPatterns)
    and reverse lookups (usedBy, implementedBy, extendedBy) are computed in
    `transformToPatternGraph()`. No consumer re-derives these from raw
    pattern arrays or scanned file tags.
    **Rationale:** Re-deriving relationships in consumers duplicates the resolution logic and risks inconsistency when different consumers implement subtly different traversal or filtering rules.
    **Verified by:** Feature consumers import from PatternGraph not from raw pipeline stages

  Rule: Three named anti-patterns

    **Invariant:** These are recognized violations, serving as review criteria
    for new code and refactoring targets for existing code.
    **Rationale:** Without named anti-patterns, violations appear as one-off style issues rather than systematic architectural drift, making them harder to detect and communicate in code review.
    **Verified by:** Feature consumers import from PatternGraph not from raw pipeline stages

    | Anti-Pattern | Detection Signal |
    | Parallel Pipeline | Feature consumer imports from scanner/ or extractor/ |
    | Lossy Local Type | Local interface with subset of ExtractedPattern fields + dedicated extraction function |
    | Re-derived Relationship | Building Map or Set from pattern.implementsPatterns, uses, or dependsOn in consumer code |

    Naming them makes them visible in code review — including AI-assisted
    sessions where the default proposal is often "add a helper function."

    **Good vs Bad**

    """typescript
    // Good: consume the read model
    function validateCrossSource(dataset: RuntimePatternGraph): ValidationSummary {
      const rel = dataset.relationshipIndex[patternName];
      const isImplemented = rel.implementedBy.length > 0;
    }

    // Bad: re-derive from raw state (Parallel Pipeline + Re-derived Relationship)
    function buildImplementsLookup(
      gherkinFiles: readonly ScannedGherkinFile[],
      tsPatterns: readonly ExtractedPattern[]
    ): ReadonlySet<string> { ... }
    """

    **References**

    - Monorepo ADR-006: Projections for All Reads (same principle, application domain)
    - ADR-005: Codec-Based Markdown Rendering (established PatternGraph as codec input)
    - Order-management ARCHITECTURE.md: CommandOrchestrator + Read Model separation

  @acceptance-criteria
  Scenario: Feature consumers import from PatternGraph not from raw pipeline stages
    Given a feature consumer that needs pattern relationships or status groupings
    When reviewing its import statements
    Then it imports from PatternGraph or relationshipIndex
    And it does not import directly from scanner/ or extractor/ modules
