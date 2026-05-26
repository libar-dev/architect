@architect
@architect-pattern:DocumentationProjection
@architect-status:candidate
@architect-product-area:Generation
@architect-level:epic
Feature: DocumentationProjection - documentation is a derived read model over the architect source-of-truth

  **User Story:** As a maintainer of the architect platform, I want documentation to be a derived read model over the same source artifacts the CLI, MCP, and Studio project from — annotated TypeScript, executable Gherkin, Zod schemas, decision features — so that no parallel write side exists for docs and no hand edit is ever needed to keep them consistent with shipped behavior.

  **Members:**
  - MultiSourceComposition
  - OneSourceMultipleAudiences
  - GoalOrientedNavigation
  - SourceCanonical

  **Open Questions:**
  - Which classes of artifact are out of scope for projection — release-note narratives, external essays, marketing copy that does not describe shipped behavior?
  - Editorial framing prose (positioning, narrative intros, "why this exists") — is it an exception to the no-write-side rule, or does it also originate in a source artifact and ride through the projection?
  - The CLI/MCP already project the same source; what is the relationship between the documentation read model and those read models — same projection composed differently, or distinct projections sharing extractors?
  - For the highest-leverage cross-corpus topics (four-tier ladder, rule-block template, annotation ownership) there is no code source aggregate — is the projection "generation" or merely content-routing for those, and does routing alone justify the substrate? (See architect/design-reviews/universal-docgen-direction.md §3.2.)
  - Implementation scope — a bounded generated-insert + extractor core, or the full DocDefinition / ContentFragment / WikiIndex framework? The 2026-05 skills consolidation already solved the skills-dedup target the framework was sized against; re-baseline the corpus before committing. (See universal-docgen-direction.md §3.1, §4–5.)

  Rule: Documentation has no independent write side
    **Invariant:** Every claim a generated document makes about shipped architect behavior originates in a source artifact (annotated code, executable spec, decision record); no parallel narrative file is authored, and the maintainer never edits the generated output to reconcile it with source that changed.
