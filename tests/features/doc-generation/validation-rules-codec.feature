@architect
@architect-pattern:ErrorGuideCodec
@architect-implements:ValidationRulesCodec
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-phase:35
@architect-product-area:Generation
Feature: Validation Rules Document Codec

  **Problem:**
  `docs/PROCESS-GUARD.md` (341 lines) is manually maintained with per-error-code
  diagnosis guides, escape hatch documentation, pre-commit setup instructions, and
  programmatic API examples. When validation rules change in `src/lint/`, the manual
  doc drifts. The existing `ValidationRulesCodec` generates `docs-live/validation/`
  files (error-catalog.md, fsm-transitions.md, protection-levels.md) covering ~35%
  of PROCESS-GUARD.md content, but these lack fix rationale, alternative approaches,
  integration recipes, and the programmatic API.

  **Solution:**
  Enhance the `ValidationRulesCodec` to generate error diagnosis guide content by
  extending its options, annotating error-handling source files with convention tags,
  and composing preamble content for Husky/CI setup that cannot come from annotations.

  Validates the Validation Rules Codec that transforms PatternGraph into a
  RenderableDocument for Process Guard validation rules reference (VALIDATION-RULES.md).

  Background: Codec setup
    Given the validation rules codec is initialized

  # ============================================================================
  # RULE 1: Document Metadata
  # ============================================================================

  Rule: Document metadata is correctly set

    **Invariant:** The validation rules document must have the title "Validation Rules", a purpose describing Process Guard, and a detail level reflecting the generateDetailFiles option.
    **Rationale:** Accurate metadata ensures the validation rules document is correctly indexed in the generated documentation site.
    **Verified by:** Document title is Validation Rules, Document purpose describes Process Guard, Detail level reflects generateDetailFiles option

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

    **Invariant:** All 6 Process Guard validation rules must appear in the rules table with their correct severity levels (error or warning).
    **Rationale:** The rules table is the primary reference for understanding what Process Guard enforces — missing rules would leave developers surprised by undocumented validation failures.
    **Verified by:** All 6 rules appear in table, Rules have correct severity levels

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

    **Invariant:** When includeFSMDiagram is enabled, a Mermaid state diagram showing all 4 FSM states and their transitions must be generated; when disabled, the diagram section must be omitted.
    **Rationale:** The state diagram is the most intuitive representation of allowed transitions — it answers "where can I go from here?" faster than a text table.
    **Verified by:** Mermaid diagram generated when includeFSMDiagram enabled, Diagram includes all 4 states, FSM diagram excluded when includeFSMDiagram disabled

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

    **Invariant:** When includeProtectionMatrix is enabled, a matrix showing all 4 statuses with their protection levels must be generated; when disabled, the section must be omitted.
    **Rationale:** The protection matrix explains why certain edits are blocked — without it, developers encounter cryptic "scope-creep" or "completed-protection" errors without understanding the underlying model.
    **Verified by:** Matrix shows all 4 statuses with protection levels, Protection matrix excluded when includeProtectionMatrix disabled

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

    **Invariant:** When includeCLIUsage is enabled, the document must include CLI example code, all 6 options, and exit code documentation; when disabled, the section must be omitted.
    **Rationale:** CLI documentation in the validation rules doc provides a single reference for both the rules and how to run them — separate docs would fragment the developer experience.
    **Verified by:** CLI example code block included, All 6 CLI options documented, Exit codes documented, CLI section excluded when includeCLIUsage disabled

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

    **Invariant:** When includeEscapeHatches is enabled, all 3 escape hatch mechanisms must be documented; when disabled, the section must be omitted.
    **Rationale:** Escape hatches prevent the validation system from becoming a blocker — developers need to know how to safely bypass rules for legitimate exceptions.
    **Verified by:** All 3 escape hatches documented, Escape hatches section excluded when includeEscapeHatches disabled

    @acceptance-criteria @unit
    Scenario: All 3 escape hatches documented
      When decoding with default options
      Then the Escape Hatches section should have a table
      And all escape hatches should be documented

    @acceptance-criteria @unit
    Scenario: Escape hatches section excluded when includeEscapeHatches disabled
      When decoding with includeEscapeHatches disabled
      Then a section with heading "Escape Hatches" should not exist
