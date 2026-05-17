@architect
@architect-pattern:WikiDocGeneration
@architect-status:candidate
@architect-product-area:Generation
@architect-level:epic
Feature: WikiDocGeneration - generate documentation from code and specs without manual sync

  **User Story:** As a maintainer of the architect platform, we want documentation that derives from code and executable specs, so that we never edit docs by hand to keep them consistent with what ships.

  **Members:**
  - DocSourceFidelity
  - OneSourceMultipleAudiences
  - GoalOrientedNavigation
  - SourceCanonical

  Rule: Capabilities compose without conflict
    **Invariant:** The four member capabilities deliver together; partial delivery is not the campaign outcome.
