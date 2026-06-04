@architect
@architect-pattern:TaxonomyDocumentationCluster
@architect-status:roadmap
@architect-product-area:Generation
@architect-parent:DocumentationProjection
@architect-uses:RegistryBuilder,TaxonomyDigestProjection
@architect-see-also:ADR010DocumentationCompositionHelpers,OneSourceMultipleAudiences,MultiSourceComposition
Feature: TaxonomyDocumentationCluster - the MVP proof-point: one taxonomy source, many audience-shaped documents

  **User Story:** As the maintainer building universal documentation generation, I want the taxonomy documents to be generated as one family from the single tag-registry source — a skill shape, a full reference enumeration, a normative formal-spec shape, and the live-API taxonomy context — so that this cluster validates the shared generation machinery (partial-overlap composition + per-audience progressive disclosure, no duplication) before any further document type is built.

  **Why this cluster first:** the source already generates `docs-live/TAXONOMY.md`, the audience verbosities are clear, and the cross-document drift is documented — the lowest-risk place to prove the machinery. Resulting documents need not preserve their current shapes byte-for-byte; they must carry the information and stay usable.

  **The cluster (one source → many shapes):** source = the tag registry (`architect-core`, built by `RegistryBuilder`). Targets:
  - `.agents/skills/architect-base/references/taxonomy.md` — skill shape: the model + a link to live data, not the full enumeration.
  - `docs-live/TAXONOMY.md` — reference shape: the full enumerated tag tables.
  - `formal-spec/04-tag-registry.md` — spec shape: the enumeration inside normative prose.
  - the live-API taxonomy context that travels with `architect:query taxonomy` output.

  **Reuse basis (ADR-010):** the reference and live-API shapes already ship via `TaxonomyDigestProjection` (`projectTaxonomyDigest`, the flat `projectSingle` catalog). The two unbuilt audience shapes (skill, formal-spec) are added on the same single-source basis through per-audience progressive disclosure — no new framework, no facet helper (the cluster is single-slice; `buildFacetBundle` is not required and remains unratified, see the epic's composition-basis gating question).

  **Open Questions:**
  - The agent-context size budget for the skill shape is owned by `OneSourceMultipleAudiences` — resolve there, not here.
  - Skill/formal-spec *editorial framing* prose (the authored voice around the generated enumeration) is the embedding-boundary case (epic emission-mode gating question); a generatable fact embedded in that prose is still generated or linked, never hand-restated (`MultiSourceComposition`).

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location |
      | Reference shape (full enumeration) | complete | docs-live/TAXONOMY.md (`projectTaxonomyDigest`) |
      | Live-API taxonomy context | complete | `architect:query taxonomy` |
      | Skill shape (model + link-to-live) | pending | .agents/skills/architect-base/references/taxonomy.md |
      | Formal-spec shape (enumeration in normative prose) | pending | formal-spec/04-tag-registry.md |

  Rule: The taxonomy documents are one generation family from the tag registry
    **Invariant:** The skill, reference, formal-spec, and live-API taxonomy documents are all generated from the tag registry as one family; the tag set, counts, and per-tag metadata are emitted from the registry into each document rather than hand-restated, and the differences between documents are verbosity and style applied by progressive disclosure, not separately-authored content. A taxonomy fact cannot drift across the four because none of them is its independent author.

    **Rationale:** A single canonical source (the tag registry) with audience-shaped read models is the no-duplication guarantee (`MultiSourceComposition`) made concrete on the lowest-risk cluster; the determinism gate (`docs:all && git diff`) turns "no hand-restated fact" into an enforced invariant rather than a convention.

    **Verified by:** `docs-live/TAXONOMY.md` regenerates from `projectTaxonomyDigest` under the determinism gate; the live `architect:query taxonomy` emits the same tag set and counts.

    @acceptance-criteria @happy-path
    Scenario: the registry materializes the reference and live-API shapes from one source
      Given the tag registry is the single source for taxonomy content
      When the documentation projection runs
      Then the reference shape emits the full enumerated tag tables from the registry
      And the live-API taxonomy context emits the same tag set and counts from the registry
      And neither is hand-authored, so the determinism gate makes cross-shape divergence impossible

    @acceptance-criteria @happy-path
    Scenario: the skill and formal-spec shapes draw the shared enumeration from the same source
      Given the skill shape needs the model plus a link to live data
      And the formal-spec shape needs the full enumeration inside normative prose
      When those two audience shapes are generated
      Then both emit the tag set, counts, and per-tag metadata from the registry rather than a hand-restated copy
      And the only difference between them is verbosity and framing applied by progressive disclosure
