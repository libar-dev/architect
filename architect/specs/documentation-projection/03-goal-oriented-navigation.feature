@architect
@architect-pattern:GoalOrientedNavigation
@architect-status:candidate
@architect-product-area:Generation
@architect-parent:DocumentationProjection
Feature: GoalOrientedNavigation - navigation surfaces are projections of the read model's index

  **User Story:** As a reader of the documentation read model, I want to state my goal in plain language and reach the relevant slice without knowing the filename, directory, or section structure of the output, so that the projected shape is not a prerequisite for finding what I need — the navigation surface itself is a projection over what the read model contains.

  **Open Questions:**
  - For single-document read models (sub-300-line topics), do we still project a goal-shaped navigation surface, or is the document alone enough?
  - A reader stating "my goal" — is that a literal text-search interface over the navigation projections, a fixed catalog of intents declared at the source, or both?
  - When two goals legitimately route to the same slice, do we deduplicate the listing or surface both intents pointing at it?

  Rule: Nontrivial topics expose a projected goal-shaped navigation surface
    **Invariant:** A documentation read model spanning multiple pages carries a navigation surface that is itself a projection — goal-to-page, named-thing-to-page, and a recommended reading order for common goals — so that a reader who knows their goal reaches the right page without traversing the file tree.

  @acceptance-criteria @happy-path
  Scenario: a reader names a goal and lands on the right page
    Given a multi-page read model with N child pages and declared reader intents
    When the topic index is projected
    Then each declared intent maps to a numbered path of child pages with rationale per step
