@architect
@architect-adr:010
@architect-adr-status:accepted
@architect-adr-category:architecture
@architect-adr-layer:refinement
@architect-adr-theme:projections
@architect-pattern:ADR010DocumentationCompositionHelpers
@architect-status:completed
@architect-unlock-reason:Decision-record-born-accepted-documents-already-shipped-helpers
@architect-see-also:ADR005CodecBasedMarkdownRendering,ADR006SingleReadModelArchitecture,ADR009ProjectionTrustBoundary
Feature: ADR-010 - Documentation Composition via Reusable Helpers, not a Doc Framework

  **Context:**
  The DocumentationProjection direction needs a composition layer above the
  typed projections: compose partially-overlapping source aggregates into
  multiple documents and vary verbosity/style per audience (the
  DocumentationProjection candidate epic). Two framework-shaped approaches were
  evaluated against the live tree and rejected with evidence.

  A rich-document framework (DocDefinition / ContentFragment /
  WikiIndexDefinition) rebuilds the reference / block-composition machinery
  deliberately removed in the monorepo-to-subpackage refactor; zero residue of
  it remains in the current tree, so reintroducing it re-adds the exact
  complexity that refactor existed to cut.

  A declarative projection-kind engine (defineGroupedRoutedDocType) was
  prototyped on api-reference — byte-identical output, all gates green — then
  reverted. It added 67 lines of indirection over the direct helper call with
  zero per-type reduction. The per-type leaf (a fragment Zod schema, its
  renderer normalizer, and its MARKDOWN_NORMALIZERS kind-dispatch entry) is
  irreducible: a config that owned its renderer would import render-markdown.ts's
  renderer-private trusted-markdown machinery while render-markdown.ts imports
  the config — an import cycle that inverts the ADR-005 renderer-to-projection
  layering.

  **Decision:**
  Documentation composition extends the existing pipeline through composable
  helpers (buildGroupedRoutedBundle in projections/_shared, buildChildRouteLinks
  in render-markdown.ts) over the single read model (ADR-006) and the shared
  block renderer (ADR-005). No DocDefinition / ContentFragment / WikiIndex
  authoring framework and no projection-kind config engine is introduced;
  "universal" means a small set of reusable bundle shapes (the flat catalog and
  the grouped routed bundle), not one engine.

  A fact with a canonical code or schema source (the tag registry, CLI schema,
  MCP registry, ExtractedPattern, the FSM table) is generated wherever it
  appears. Hand-authored doctrine with no code source is content-routed, not
  generated. Routing reuses the shipped targetDoc aggregation-tag primitive
  (architect-core taxonomy/registry-builder.ts) rather than introducing a new
  membership carrier.

  **Consequences:**
  | Type | Impact |
  | Positive | One read model and one renderer; composition is helpers, so no second authoring model is introduced (upholds ADR-006's anti-parallel-pipeline) |
  | Positive | A new fitting document type reuses buildGroupedRoutedBundle; there is no framework tower to maintain |
  | Positive | Content routing has a shipped substrate (targetDoc), not a rebuild |
  | Negative | Each genuinely new structured document kind still needs its own leaf schema, renderer normalizer, and kind-dispatch entry — irreducible under the ADR-005 layering |
  | Negative | Before the composition layer builds further on the block renderer, the two block vocabularies (architect-core config SectionBlock and architect-projection BlockSchema) must be reconciled to one (No-BC) |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Decision spec | complete | architect/decisions/adr-010-documentation-composition-helpers.feature |

  Rule: Documentation composition reuses helpers over the single read model

    **Invariant:** A documentation document type is assembled from the shared
    block renderer and the composable bundle helpers reading the PatternGraph;
    no DocDefinition / ContentFragment / WikiIndex authoring framework and no
    projection-kind config engine is introduced. A fact with a canonical
    code or schema source is generated wherever it appears; doctrine with no
    code source is routed via the existing targetDoc primitive.

    **Rationale:** A framework either rebuilds deliberately-removed machinery or
    relocates the irreducible per-type leaf behind indirection the ADR-005
    renderer-to-projection layering forbids — measured at +67 LOC, zero
    reduction, with a provable import cycle. Composable helpers capture the real
    generalization (the grouped-routed-bundle shape) without a parallel
    authoring model, upholding ADR-006.

    @acceptance-criteria @contract
    Scenario: a new fitting document type composes through the helpers
      Given a new documentation document type whose shape is a grouped routed bundle
      When it is added to the projection pipeline
      Then it is assembled via buildGroupedRoutedBundle over the read model and rendered by the shared block renderer
      And no document-authoring framework or projection-kind config engine is introduced
