@architect
@architect-pattern:TaxonomyDocumentationCluster
@architect-status:candidate
@architect-maturity:idea
@architect-product-area:Generation
@architect-parent:DocumentationProjection
Feature: TaxonomyDocumentationCluster - the MVP proof-point: one taxonomy source, many audience-shaped documents

  **User Story:** As the maintainer building universal documentation generation, I want the taxonomy documents to be generated as one family from the single tag-registry source — a skill shape, a full reference enumeration, a normative formal-spec shape, and the live-API taxonomy context — so that this cluster validates the shared generation machinery (partial-overlap composition + per-audience progressive disclosure, no duplication) before any further document type is built.

  **Why this cluster first:** the source already generates `docs-live/TAXONOMY.md`, the audience verbosities are clear, and the cross-document drift is documented — the lowest-risk place to prove the machinery. Resulting documents need not preserve their current shapes byte-for-byte; they must carry the information and stay usable.

  **The cluster (one source → many shapes):** source = the tag registry (`architect-core`). Targets:
  - `.agents/skills/architect-base/references/taxonomy.md` — skill shape: the model + a link to live data, not the full enumeration.
  - `docs-live/TAXONOMY.md` — reference shape: the full enumerated tag tables.
  - `formal-spec/04-tag-registry.md` — spec shape: the enumeration inside normative prose.
  - the live-API taxonomy context that travels with `architect:query taxonomy` output.

  Rule: The taxonomy documents are one generation family from the tag registry
    **Invariant:** The skill, reference, formal-spec, and live-API taxonomy documents are all generated from the tag registry as one family; the tag set, counts, and per-tag metadata are emitted from the registry into each document rather than hand-restated, and the differences between documents are verbosity and style applied by progressive disclosure, not separately-authored content. A taxonomy fact cannot drift across the four because none of them is its independent author.
