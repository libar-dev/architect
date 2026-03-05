@libar-docs
@behavior @reference-codec
@libar-docs-pattern:GeneratedDocQualityTests
@libar-docs-status:active
@libar-docs-implements:GeneratedDocQuality
@libar-docs-product-area:Generation
Feature: Generated Documentation Quality Improvements

  Tests for the four quality fixes in GeneratedDocQuality (Phase 38):
  duplicate table removal, Generation compact enrichment, types-first
  ordering, and product area TOC generation.

  Background:
    Given a reference codec test context

  Rule: Behavior-specs renderer does not duplicate convention table content

    **Invariant:** Convention tables appear exactly once in the output — in the convention section. The behavior-specs section shows only metadata.
    **Rationale:** DD-4: Duplicate tables waste 500+ lines and agent context tokens.

    @acceptance-criteria @happy-path
    Scenario: Convention rule table appears exactly once in generated output
      Given a reference config with convention tag "test-conv" and include tag "test-include"
      And a pattern with convention content and a table in its rule description
      When decoding at detail level "detailed"
      Then the table appears exactly once in the document
      And the behavior-specs section contains invariant text
      And the behavior-specs section does not contain the table

    @acceptance-criteria @validation
    Scenario: Behavior-specs show rule metadata without tables
      Given a reference config with convention tag "test-conv" and include tag "test-include"
      And a pattern with convention content and a table in its rule description
      When decoding at detail level "standard"
      Then the convention section renders the table
      And no table rows are duplicated in the document

  Rule: ARCHITECTURE-TYPES leads with type definitions

    **Invariant:** When shapesFirst is true, shapes render before conventions.
    **Rationale:** ARCHITECTURE-TYPES.md should open with type definitions, not orchestrator prose.

    @acceptance-criteria @happy-path
    Scenario: Shapes section appears before conventions when shapesFirst is true
      Given a reference config with shapesFirst enabled
      And a dataset with both convention content and shape content
      When decoding at detail level "detailed"
      Then the first heading after the title is from the shapes section
      And the convention heading appears after the shapes section

  Rule: Product area docs have a generated table of contents

    **Invariant:** Product area docs with 3+ H2 headings include a Contents section with anchor links.
    **Rationale:** Large product area docs need browser-navigable TOC for human developers.

    @acceptance-criteria @happy-path
    Scenario: Product area doc with multiple sections gets a TOC
      Given a product area config for "Generation"
      And a dataset with multiple patterns in the Generation area
      When decoding at detail level "detailed"
      Then the document contains a heading "Contents"
      And the Contents section is a list with anchor links
      And the Contents heading appears after the intro separator

  Rule: Generation compact is self-sufficient

    **Invariant:** The Generation compact contains codec inventory and pipeline summary at 4+ KB.
    **Rationale:** DD-2: A 1.4 KB compact for the largest area means agents have no usable summary.

    @acceptance-criteria @happy-path
    Scenario: Generation compact contains enriched content
      Given a product area config for "Generation"
      And a dataset with Generation area patterns
      When decoding at detail level "summary"
      Then the rendered output contains all expected terms:
        | Term |
        | Scanner |
        | Codec |
        | MasterDataset |
        | RenderableDocument |
