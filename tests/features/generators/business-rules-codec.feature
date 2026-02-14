@libar-docs
@libar-docs-pattern:BusinessRulesDocumentCodec
@libar-docs-status:completed
@libar-docs-product-area:Generator
@libar-docs-implements:BusinessRulesGenerator
Feature: Business Rules Document Codec

  Tests the BusinessRulesCodec transformation from MasterDataset to RenderableDocument.
  Verifies rule extraction, organization by domain/phase, and progressive disclosure.

  Background: Business rules codec test context
    Given a business rules codec test context

  # ===========================================================================
  # Rule 1: Extracts Rule blocks with Invariant and Rationale
  # ===========================================================================

  Rule: Extracts Rule blocks with Invariant and Rationale

    Scenario: Extracts annotated Rule with Invariant and Rationale
      Given a pattern with a rule containing:
        | Field | Value |
        | name | Reservations prevent race conditions |
        | invariant | Only one reservation can exist for a given key at a time |
        | rationale | Check-then-create patterns have TOCTOU vulnerabilities |
        | verifiedBy | Concurrent reservations scenario |
      When decoding with BusinessRulesCodec in detailed mode
      Then the document contains rule "Reservations prevent race conditions"
      And the document contains invariant text "Only one reservation can exist"
      And the document contains rationale text "Check-then-create patterns"
      And the document contains verified by link to "Concurrent reservations scenario"

    Scenario: Extracts unannotated Rule without showing not specified
      Given a pattern with a rule containing:
        | Field | Value |
        | name | Events are immutable |
        | description | Events cannot be modified after creation |
      When decoding with BusinessRulesCodec in detailed mode
      Then the document contains rule "Events are immutable"
      And the document contains description "Events cannot be modified"
      And the document does not contain "not specified"

  # ===========================================================================
  # Rule 2: Organizes rules by domain category and phase
  # ===========================================================================

  Rule: Organizes rules by product area and phase

    Scenario: Groups rules by product area and phase
      Given patterns with rules in these categories:
        | Category | Rule Name |
        | ddd | Reservations prevent race conditions |
        | event-sourcing | Events are immutable |
        | cqrs | Projections must declare category |
      When decoding with BusinessRulesCodec in standard mode
      Then the document has product area sections with phases

    Scenario: Orders rules by phase within domain
      Given patterns with rules in these phases:
        | Phase | Rule Name |
        | 16 | DCB enables cross-entity validation |
        | 20 | Events contain full context |
        | 20 | Reservations prevent race conditions |
      When decoding with BusinessRulesCodec in standard mode
      Then phase 16 content appears before phase 20 content

  # ===========================================================================
  # Rule 3: Summary mode generates compact output
  # ===========================================================================

  Rule: Summary mode generates compact output

    Scenario: Summary mode includes statistics line
      Given multiple patterns with a total of 5 rules
      When decoding with BusinessRulesCodec in summary mode
      Then the document has a summary line with rule count 5

    Scenario: Summary mode excludes detailed sections
      Given multiple patterns with a total of 5 rules
      When decoding with BusinessRulesCodec in summary mode
      Then the document does not have detailed rule headings

  # ===========================================================================
  # Rule 4: Code examples and tables
  # ===========================================================================

  Rule: Preserves code examples and tables in detailed mode

    Scenario: Code examples included in detailed mode
      Given a pattern with a rule containing code examples
      When decoding with BusinessRulesCodec in detailed mode with code examples enabled
      Then the document contains code blocks

    Scenario: Code examples excluded in standard mode
      Given a pattern with a rule containing code examples
      When decoding with BusinessRulesCodec in standard mode
      Then the document does not contain code blocks with language hints

  # ===========================================================================
  # Rule 5: Traceability links
  # ===========================================================================

  Rule: Generates scenario traceability links

    Scenario: Verification links include file path
      Given a pattern with scenarios in "reservation-pattern.feature" at line 42
      When decoding with BusinessRulesCodec in detailed mode with verification enabled
      Then the verification links include "reservation-pattern.feature"
