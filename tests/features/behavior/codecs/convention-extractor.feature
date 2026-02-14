@behavior @convention-extractor
@libar-docs-pattern:ConventionExtractorTesting
@libar-docs-product-area:Codec
Feature: Convention Extractor

  Extracts convention content from MasterDataset decision records
  tagged with @libar-docs-convention. Produces structured ConventionBundles
  with rule content, tables, and invariant/rationale metadata.

  Background:
    Given a convention extractor test context

  Rule: Empty and missing inputs produce empty results

    @happy-path @edge-case
    Scenario: Empty convention tags returns empty array
      Given an empty MasterDataset
      When extracting conventions for no tags
      Then the convention result is empty

    @edge-case
    Scenario: No matching patterns returns empty array
      Given a MasterDataset with patterns but no convention tags
      When extracting conventions for tag "fsm-rules"
      Then the convention result is empty

  Rule: Convention bundles are extracted from matching patterns

    @happy-path
    Scenario: Single pattern with one convention tag produces one bundle
      Given a pattern tagged with convention "testing-policy"
      When extracting conventions for tag "testing-policy"
      Then 1 convention bundle is returned
      And the bundle convention tag is "testing-policy"
      And the bundle has 1 rule

    @happy-path
    Scenario: Pattern with CSV conventions contributes to multiple bundles
      Given a pattern tagged with conventions "fsm-rules" and "testing-policy"
      When extracting conventions for tags "fsm-rules" and "testing-policy"
      Then 2 convention bundles are returned

    @happy-path
    Scenario: Multiple patterns with same convention merge into one bundle
      Given a pattern "ADR006" tagged with convention "fsm-rules" with rule "Transitions"
      And a pattern "ADR009" tagged with convention "fsm-rules" with rule "Protection"
      When extracting conventions for tag "fsm-rules"
      Then 1 convention bundle is returned
      And the bundle has 2 source decisions
      And the bundle has 2 rules

  Rule: Structured content is extracted from rule descriptions

    @happy-path
    Scenario: Invariant and rationale are extracted from rule description
      Given a pattern with convention "fsm-rules" and rule description:
        """
        **Invariant:** Only valid FSM transitions are allowed.

        **Rationale:** Prevents accidental state corruption.

        **Verified by:** Transition validation, State protection
        """
      When extracting conventions for tag "fsm-rules"
      Then the first rule has invariant "Only valid FSM transitions are allowed."
      And the first rule has rationale "Prevents accidental state corruption."

    @happy-path
    Scenario: Tables in rule descriptions are extracted as structured data
      Given a pattern with convention "fsm-rules" and rule description:
        """
        **Invariant:** Each status has a protection level.

        | Status | Protection |
        | --- | --- |
        | roadmap | None |
        | active | Scope-locked |
        | completed | Hard-locked |
        """
      When extracting conventions for tag "fsm-rules"
      Then the first rule has 1 table
      And the table has 3 data rows

  Rule: Code examples in rule descriptions are preserved

    @happy-path
    Scenario: Mermaid diagram in rule description is extracted as code example
      Given a convention pattern with a mermaid diagram in tag "fsm-rules"
      When extracting conventions for tag "fsm-rules"
      Then the first rule has 1 code example
      And the code example has language "mermaid"

    @happy-path
    Scenario: Rule description without code examples has no code examples field
      Given a pattern with convention "fsm-rules" and rule description:
        """
        **Invariant:** Only valid transitions allowed.

        Plain narrative text without any diagrams.
        """
      When extracting conventions for tag "fsm-rules"
      Then the first rule has no code examples
