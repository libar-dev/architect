@architect
@architect-pattern:SourceCanonical
@architect-status:candidate
@architect-product-area:Generation
@architect-parent:WikiDocGeneration
Feature: SourceCanonical - annotations and executable specs are the documentation source

  **User Story:** As a maintainer, I want documentation content to live alongside the code or specs it describes, so that no parallel narrative file can silently drift from the actual behavior.

  Rule: Documented behavior is asserted behavior
    **Invariant:** A behavior described in a generated document is also referenced by an assertion that executes in CI; breaking the assertion surfaces as a failing test, never as silent documentation drift.
