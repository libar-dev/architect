@architect
@architect-pattern:OneSourceMultipleAudiences
@architect-status:candidate
@architect-product-area:Generation
@architect-parent:WikiDocGeneration
Feature: OneSourceMultipleAudiences - one canonical description serves audiences at different depths

  **User Story:** As a maintainer, I want to author a concept once and have multiple audiences receive appropriately-shaped versions, so that I never duplicate the source description to serve different reader contexts.

  Rule: Audience depth is a rendering choice, not a source duplication
    **Invariant:** Changing the source description of a concept updates every audience-shaped rendering of it in one regeneration pass; no audience has a separately-authored copy.
