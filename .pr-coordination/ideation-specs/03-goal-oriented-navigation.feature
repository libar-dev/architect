@architect
@architect-pattern:GoalOrientedNavigation
@architect-status:candidate
@architect-product-area:Generation
@architect-parent:WikiDocGeneration
Feature: GoalOrientedNavigation - readers find content by intent, not by file structure

  **User Story:** As a reader, I want to reach the relevant page by stating my goal in plain language, so that I do not need to know the directory layout or filename conventions of the documentation.

  Rule: Every nontrivial documentation topic exposes goal-shaped navigation
    **Invariant:** A documentation topic of nontrivial size carries generated navigation surfaces — intent to page, named thing to page, visual aid to page, recommended order for common goals — so that a reader can reach the right page in a small number of steps from the topic index.
