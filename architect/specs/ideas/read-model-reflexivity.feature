@architect
@architect-pattern:ReadModelReflexivity
@architect-status:candidate
@architect-maturity:idea
@architect-product-area:Generation
@architect-parent:DocumentationProjection
Feature: ReadModelReflexivity - the read model carries the catalog of its own query surface

  **User Story:** As a maintainer building universal generation, I want the frozen Graph/handle contract, MCP tool registry, and config schema folded into the PatternGraph (the `@architect-shape` precedent, preserving the single read model) so that the read model is self-describing — and the docs INDEX/manifest, graph-handle help, the MCP tool list, and Studio's command palette / Taxonomy Manager / Process-Preset editor are all one `Manifest` emission over that graph-resident slice, never separately authored.

  Rule: The query-surface catalog is a graph-resident slice projected as one Manifest family
    **Invariant:** The catalog of the read model's own query surface (the frozen Graph/handle contract, MCP tools, and config schema) is a slice of the single read model, folded in the way `@architect-shape` folds TypeScript shapes into `ExtractedPattern` (ADR-006 preserved); every surface that lists that catalog — docs INDEX, graph-handle help, MCP tool list, Studio command palette — is one `Manifest` emission over the slice, so the catalog is generated once and cannot drift between surfaces. Whether to fold the schema in is the read-model-reach gating decision on the parent epic.
