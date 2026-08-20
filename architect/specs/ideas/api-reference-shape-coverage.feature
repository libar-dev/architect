@architect
@architect-pattern:ApiReferenceShapeCoverage
@architect-status:candidate
@architect-maturity:idea
@architect-product-area:Generation
@architect-parent:DocumentationProjection
Feature: ApiReferenceShapeCoverage - the api-reference doc-type documents the full exported contract surface

  **User Story:** As a maintainer or agent reading the generated API reference, I want every exported contract and codec symbol to carry an `@architect-shape` annotation, so that `API-REFERENCE.md` and its per-package children document the whole public surface rather than the subset annotated so far. The rendering substrate ships (the `api-reference` documentType over `ExtractedPattern.extractedShapes`, rendered through the shared block renderer); what is open is completing the annotated surface it reads.

  Rule: The api-reference documents exactly the annotated shape surface
    **Invariant:** The `api-reference` document type renders the exported symbols that carry `@architect-shape` and only those; a contract or codec module's public surface is documented when, and only when, its exported `interface` / `enum` / `function` and Zod-first schema `const` declarations carry the tag. Coverage of that surface is therefore a property of the annotations, not of the renderer.

  Rule: Shape annotation is additive enrichment on production code
    **Invariant:** `@architect-shape` is added directly to the exported declaration — for a Zod-first contract to the schema `const` (whose source carries the fields), never to the paired `z.infer` / `z.output` type alias; `*.internal.ts` modules are out of scope; and the pass never adds `@architect-pattern` to production TS (pattern identity stays on the feature file, split-ownership, architect-base §8).
