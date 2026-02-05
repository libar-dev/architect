@libar-docs
@libar-docs-pattern:ContentDeduplication
Feature: Content Deduplication

  **Context:** Multiple sources may extract identical content, leading to
  duplicate sections in generated documentation.

  **Approach:** Use SHA-256 fingerprinting to detect duplicates, merge based
  on source priority, and preserve original section order after deduplication.

  Background: Deduplicator setup
    Given the content deduplicator is initialized

  # ============================================================================
  # RULE 1: Fingerprint-Based Detection
  # ============================================================================

  Rule: Duplicate detection uses content fingerprinting

    **Invariant:** Content with identical normalized text must produce identical fingerprints.
    **Rationale:** Fingerprinting enables efficient duplicate detection without full text comparison.
    **Verified by:** @acceptance-criteria scenarios below.

    Content fingerprints are computed from normalized text, ignoring whitespace
    differences and minor formatting variations.

    @acceptance-criteria @unit
    Scenario: Identical content produces same fingerprint
      Given content block A with text "## Protection Levels\n\nActive specs are scope-locked."
      And content block B with text "## Protection Levels\n\nActive specs are scope-locked."
      When computing fingerprints
      Then both blocks have identical fingerprints
      And they are marked as duplicates

    @acceptance-criteria @unit
    Scenario: Whitespace differences are normalized
      Given content block A with text "## Header\n\nParagraph one."
      And content block B with text "## Header\n\n\nParagraph one."
      When computing fingerprints
      Then both blocks have identical fingerprints

    @acceptance-criteria @unit
    Scenario: Different content produces different fingerprints
      Given content block A with text "## Overview\n\nFirst version."
      And content block B with text "## Overview\n\nSecond version."
      When computing fingerprints
      Then blocks have different fingerprints
      And they are not marked as duplicates

    @acceptance-criteria @edge-case
    Scenario: Similar headers with different content are preserved
      Given content block A with header "## API" and body "REST endpoints"
      And content block B with header "## API" and body "GraphQL schema"
      When deduplicating
      Then both blocks are preserved
      And headers are differentiated as "API (from source-a)" and "API (from source-b)"

  # ============================================================================
  # RULE 2: Merge Strategy
  # ============================================================================

  Rule: Duplicates are merged based on source priority

    **Invariant:** Higher-priority sources take precedence when merging duplicate content.
    **Rationale:** TypeScript sources have richer JSDoc; feature files provide behavioral context.
    **Verified by:** @acceptance-criteria scenarios below.

    The merge strategy determines which content to keep based on source file
    priority and content richness once duplicates are detected.

    @acceptance-criteria @unit
    Scenario: TypeScript source takes priority over feature file
      Given duplicate content from "src/types.ts" with JSDoc
      And duplicate content from "tests/test.feature" without JSDoc
      When merging duplicates
      Then content from TypeScript source is kept
      And source attribution shows "src/types.ts"

    @acceptance-criteria @unit
    Scenario: Richer content takes priority when sources equal
      Given duplicate from source A with 10 lines
      And duplicate from source B with 50 lines
      When merging duplicates with equal source priority
      Then content from source B is kept
      And source attribution shows source B

    @acceptance-criteria @unit
    Scenario: Source attribution is added to merged content
      Given duplicate content merged from two sources
      When rendering the merged section
      Then output includes "Source: src/types.ts"
      And duplicate source is noted

  # ============================================================================
  # RULE 3: Section Ordering
  # ============================================================================

  Rule: Section order is preserved after deduplication

    **Invariant:** Section order matches the source mapping table order after deduplication.
    **Rationale:** Predictable ordering ensures consistent documentation structure.
    **Verified by:** @acceptance-criteria scenarios below.

    The order of sections in the source mapping table is preserved even
    after duplicates are removed.

    @acceptance-criteria @unit
    Scenario: Original order maintained after dedup
      Given source mapping order: "Intro", "Types", "Rules", "Types"
      And "Types" sections have duplicate content
      When deduplicating
      Then output order is "Intro", "Types", "Rules"
      And the first occurrence position is preserved

    @acceptance-criteria @edge-case
    Scenario: Empty sections after dedup are removed
      Given a section that becomes empty after deduplication
      When deduplicating
      Then the empty section is removed from output
      And a warning is logged about the removed section

  # ============================================================================
  # RULE 4: Integration with Source Mapper
  # ============================================================================

  Rule: Deduplicator integrates with source mapper pipeline

    **Invariant:** Deduplication runs after extraction and before document assembly.
    **Rationale:** All content must be extracted before duplicates can be identified.
    **Verified by:** @acceptance-criteria scenarios below.

    The deduplicator is called after all extractions complete but before
    the RenderableDocument is assembled.

    @acceptance-criteria @integration
    Scenario: Deduplication happens in pipeline
      Given a source mapping that extracts from multiple files
      And some files contain duplicate content
      When executing the full source mapping pipeline
      Then extraction happens first
      And deduplication processes all extracted content
      And RenderableDocument contains deduplicated sections
