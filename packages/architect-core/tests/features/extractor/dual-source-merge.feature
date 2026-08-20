@architect
@architect-pattern:DualSourceMergeIntegration
@architect-implements:DualSourceExtractor
@architect-status:completed
@architect-unlock-reason:De-orphan-implements-edge-WS1-session-08
@architect-product-area:Annotation
@behavior @extractor
Feature: Dual-source merge integration
  combineSources() and validateDualSource() must preserve the boundary between
  annotation-only work, spec-only work, merged work, and cross-source conflicts.

  Background:
    Given a dual-source merge integration context

  Rule: Dual-source merge outcomes stay explicit across roadmap and validation paths

    **Invariant:** Annotation-only and spec-only roadmap patterns remain visible as unmatched sources, and matching names merge into one combined pattern carrying its process metadata and deliverables.
    **Rationale:** The dual-source pipeline is useful only if it preserves source provenance and reports drift instead of silently hiding it.
    **Verified by:** Annotation-only roadmap pattern warns about missing feature coverage, Spec-only roadmap pattern warns about missing code coverage, Matching code and feature merge process metadata and deliverables

    @happy-path
    Scenario: Annotation-only roadmap pattern warns about missing feature coverage
      Given an annotation-only roadmap pattern "OrderSaga"
      When I combine and validate the dual-source inputs
      Then 0 combined patterns are produced
      And 1 annotation-only patterns remain
      And validation reports 1 missing feature warning

    @happy-path
    Scenario: Spec-only roadmap pattern warns about missing code coverage
      Given a spec-only roadmap feature for pattern "PaymentSaga"
      When I combine and validate the dual-source inputs
      Then 0 combined patterns are produced
      And 1 spec-only patterns remain
      And validation reports 1 missing code warning

    @happy-path
    Scenario: Matching code and feature merge process metadata and deliverables
      Given a code pattern "SharedKernel"
      And a feature file for pattern "SharedKernel" with deliverable "Integrate shared abstractions"
      When I combine and validate the dual-source inputs
      Then 1 combined patterns are produced
      And combined pattern "SharedKernel" has process metadata
      And combined pattern "SharedKernel" has 1 deliverable
      And validation passes without errors
