@architect
@architect-pattern:DualSourceMergeIntegration
@architect-status:completed
@architect-product-area:Annotation
@behavior @extractor
Feature: Dual-source merge integration
  combineSources() and validateDualSource() must preserve the boundary between
  annotation-only work, spec-only work, merged work, and cross-source conflicts.

  Background:
    Given a dual-source merge integration context

  Rule: Dual-source merge outcomes stay explicit across roadmap and validation paths

    **Invariant:** Annotation-only and spec-only roadmap patterns remain visible as unmatched sources, matching names merge into one combined pattern, and phase conflicts surface validation errors without dropping the combined pattern.
    **Rationale:** The dual-source pipeline is useful only if it preserves source provenance and reports drift instead of silently hiding it.
    **Verified by:** Annotation-only roadmap pattern warns about missing feature coverage, Spec-only roadmap pattern warns about missing code coverage, Matching code and feature merge process metadata and deliverables, Phase mismatch reports a validation error while keeping the merged pattern

    @happy-path
    Scenario: Annotation-only roadmap pattern warns about missing feature coverage
      Given an annotation-only roadmap pattern "OrderSaga"
      When I combine and validate the dual-source inputs
      Then 0 combined patterns are produced
      And 1 annotation-only patterns remain
      And validation reports 1 missing feature warning

    @happy-path
    Scenario: Spec-only roadmap pattern warns about missing code coverage
      Given a spec-only roadmap feature for pattern "PaymentSaga" in phase 22
      When I combine and validate the dual-source inputs
      Then 0 combined patterns are produced
      And 1 spec-only patterns remain
      And validation reports 1 missing code warning

    @happy-path
    Scenario: Matching code and feature merge process metadata and deliverables
      Given a code pattern "SharedKernel" in phase 14
      And a feature file for pattern "SharedKernel" in phase 14 with deliverable "Integrate shared abstractions"
      When I combine and validate the dual-source inputs
      Then 1 combined patterns are produced
      And combined pattern "SharedKernel" has process phase 14
      And combined pattern "SharedKernel" has 1 deliverable
      And validation passes without errors

    @edge-case
    Scenario: Phase mismatch reports a validation error while keeping the merged pattern
      Given a code pattern "MismatchSaga" in phase 10
      And a feature file for pattern "MismatchSaga" in phase 20
      When I combine and validate the dual-source inputs
      Then 1 combined patterns are produced
      And 1 phase validation error exists
      And validation fails with 1 error
