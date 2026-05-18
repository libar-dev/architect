@architect
@architect-pattern:DocSourceFidelity
@architect-status:candidate
@architect-product-area:Generation
@architect-parent:WikiDocGeneration
Feature: DocSourceFidelity - generated documents stay accurate to source without manual edits

  **User Story:** As a maintainer, I want documents to regenerate correctly when code or specs change, so that I never hand-edit a document to keep it consistent with the system it describes.

  Rule: New, removed, or renamed source items propagate to every consuming document
    **Invariant:** A change to a source item (tag, lifecycle state, role, declared concept) appears in every document that references that kind of item, in one regeneration pass, without any manual edit to those documents.
