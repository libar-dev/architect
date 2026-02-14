@libar-docs
@libar-docs-pattern:ValidationRulesCodecTesting
@libar-docs-implements:ValidationRulesCodec
@libar-docs-status:completed
@libar-docs-product-area:Generation
Feature: Validation Rules Document Codec

  Validates the Validation Rules Codec that transforms MasterDataset into a
  RenderableDocument for Process Guard validation rules reference (VALIDATION-RULES.md).

  Background: Codec setup
    Given the validation rules codec is initialized

  # ============================================================================
  # RULE 1: Document Metadata
  # ============================================================================

  Rule: Document metadata is correctly set

    The validation rules document has standard metadata fields for title,
    purpose, and detail level.

    @acceptance-criteria @unit
    Scenario: Document title is Validation Rules
      When decoding with default options
      Then document title should be "Validation Rules"

    @acceptance-criteria @unit
    Scenario: Document purpose describes Process Guard
      When decoding with default options
      Then document purpose should contain "validation"

    @acceptance-criteria @unit
    Scenario: Detail level reflects generateDetailFiles option
      When decoding with generateDetailFiles disabled
      Then document detailLevel should be "Compact summary"

  # ============================================================================
  # RULE 2: Validation Rules Table
  # ============================================================================

  Rule: All validation rules are documented in a table

    The rules table includes all 6 Process Guard validation rules with
    their severity levels and descriptions.

    @acceptance-criteria @unit
    Scenario: All 6 rules appear in table
      When decoding with default options
      Then the Validation Rules section should have a table
      And the table should contain all 6 validation rules

    @acceptance-criteria @unit
    Scenario: Rules have correct severity levels
      When decoding with default options
      Then error rules and warning rules should have correct severity

  # ============================================================================
  # RULE 3: FSM State Diagram
  # ============================================================================

  Rule: FSM state diagram is generated from transitions

    The Mermaid diagram shows all valid state transitions for the
    Process Guard FSM.

    @acceptance-criteria @unit
    Scenario: Mermaid diagram generated when includeFSMDiagram enabled
      When decoding with includeFSMDiagram enabled
      Then a mermaid block should exist

    @acceptance-criteria @unit
    Scenario: Diagram includes all 4 states
      When decoding with default options
      Then the mermaid diagram should contain all 4 FSM states

    @acceptance-criteria @unit
    Scenario: FSM diagram excluded when includeFSMDiagram disabled
      When decoding with includeFSMDiagram disabled
      Then a mermaid block should not exist

  # ============================================================================
  # RULE 4: Protection Level Matrix
  # ============================================================================

  Rule: Protection level matrix shows status protections

    The protection matrix documents which statuses have which protection
    levels (none, scope-locked, hard-locked).

    @acceptance-criteria @unit
    Scenario: Matrix shows all 4 statuses with protection levels
      When decoding with default options
      Then the Protection Levels section should have a table
      And all protection levels should be correctly documented

    @acceptance-criteria @unit
    Scenario: Protection matrix excluded when includeProtectionMatrix disabled
      When decoding with includeProtectionMatrix disabled
      Then a section with heading "Protection Levels" should not exist

  # ============================================================================
  # RULE 5: CLI Usage Section
  # ============================================================================

  Rule: CLI usage is documented with options and exit codes

    The CLI section shows how to invoke the Process Guard linter
    with various options.

    @acceptance-criteria @unit
    Scenario: CLI example code block included
      When decoding with default options
      Then the CLI Usage section should have a code block

    @acceptance-criteria @unit
    Scenario: All 6 CLI options documented
      When decoding with default options
      Then all CLI options should be documented

    @acceptance-criteria @unit
    Scenario: Exit codes documented
      When decoding with default options
      Then both exit codes should be documented

    @acceptance-criteria @unit
    Scenario: CLI section excluded when includeCLIUsage disabled
      When decoding with includeCLIUsage disabled
      Then a section with heading "CLI Usage" should not exist

  # ============================================================================
  # RULE 6: Escape Hatches
  # ============================================================================

  Rule: Escape hatches are documented for special cases

    The escape hatches section documents how to override Process Guard
    validation for legitimate use cases.

    @acceptance-criteria @unit
    Scenario: All 3 escape hatches documented
      When decoding with default options
      Then the Escape Hatches section should have a table
      And all escape hatches should be documented

    @acceptance-criteria @unit
    Scenario: Escape hatches section excluded when includeEscapeHatches disabled
      When decoding with includeEscapeHatches disabled
      Then a section with heading "Escape Hatches" should not exist
