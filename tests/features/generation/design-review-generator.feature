@architect
@architect-pattern:DesignReviewGeneratorLifecycleTests
@architect-status:active
@architect-product-area:Generation
@behavior @design-review
Feature: Design Review Generator Lifecycle

  The design review generator cleans up stale markdown files when annotated
  patterns are renamed or removed from the current dataset.

  Background:
    Given a temporary design review output directory

  Rule: Orphaned design review files are scheduled for deletion

    **Invariant:** Existing markdown files in design-reviews/ that no longer map to the current sequenceIndex must be returned in filesToDelete, while current patterns remain preserved.
    **Rationale:** Renaming or removing sequence-annotated patterns otherwise leaves stale design review documents behind, which misleads readers and downstream tooling.
    **Verified by:** Renamed pattern schedules stale design review for deletion

    @acceptance-criteria @cleanup
    Scenario: Renamed pattern schedules stale design review for deletion
      Given an existing design review file "design-reviews/setup-command.md"
      And a dataset with sequence data for pattern "RenamedPattern"
      When generating design review files
      Then the generator output should include files to delete
      And the files to delete should include "design-reviews/setup-command.md"
      And the files to delete should not include "design-reviews/renamed-pattern.md"
      And the generated files should include "design-reviews/renamed-pattern.md"
