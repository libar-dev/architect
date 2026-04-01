@architect
@architect-pattern:IndexCodecTesting
@architect-implements:IndexCodec
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-regression-safety-net
@architect-product-area:Generation
Feature: Index Document Codec

  Validates the Index Codec that transforms MasterDataset into a
  RenderableDocument for the main documentation navigation index (INDEX.md).

  Background: Codec setup
    Given the index codec is initialized

  # ============================================================================
  # RULE 1: Document Metadata
  # ============================================================================

  Rule: Document metadata is correctly set

    **Invariant:** The index document must have the title "Documentation Index", a purpose string referencing @libar-dev/architect, and all sections enabled when using default options.
    **Rationale:** Document metadata drives navigation and table of contents generation — incorrect titles or missing purpose strings produce broken index pages in generated doc sites.
    **Verified by:** Document title is Documentation Index, Document purpose references @libar-dev/architect, Default options produce all sections

    @acceptance-criteria @unit
    Scenario: Document title is Documentation Index
      When decoding with default options
      Then document title should be "Documentation Index"

    @acceptance-criteria @unit
    Scenario: Document purpose references @libar-dev/architect
      When decoding with default options
      Then document purpose should contain "architect"

    @acceptance-criteria @unit
    Scenario: Default options produce all sections
      When decoding with default options
      Then all expected default sections should exist:
        | heading                  |
        | Package Metadata         |
        | Product Area Statistics  |
        | Phase Progress           |
        | Regeneration             |

  # ============================================================================
  # RULE 2: Package Metadata Section
  # ============================================================================

  Rule: Package metadata section renders correctly

    **Invariant:** The Package Metadata section must always render a table with hardcoded fields: Package (@libar-dev/architect), Purpose, Patterns count derived from dataset, Product Areas count derived from dataset, and License (MIT).
    **Rationale:** Package metadata provides readers with an instant snapshot of the project — hardcoded fields ensure consistent branding while dataset-derived counts stay accurate.
    **Verified by:** Package name shows @libar-dev/architect, Purpose shows context engineering platform description, License shows MIT, Pattern counts reflect dataset, Product area count reflects dataset, Package metadata section can be disabled

    @acceptance-criteria @unit
    Scenario: Package name shows @libar-dev/architect
      When decoding with default options
      Then the Package Metadata table should contain "@libar-dev/architect"

    @acceptance-criteria @unit
    Scenario: Purpose shows context engineering platform description
      When decoding with default options
      Then the Package Metadata table should contain "Context engineering platform"

    @acceptance-criteria @unit
    Scenario: License shows MIT
      When decoding with default options
      Then the Package Metadata table should contain "MIT"

    @acceptance-criteria @unit
    Scenario: Pattern counts reflect dataset
      When decoding with a dataset containing 3 completed and 2 active patterns
      Then the Package Metadata table should contain "5 tracked"

    @acceptance-criteria @unit
    Scenario: Product area count reflects dataset
      When decoding with a dataset containing patterns in 2 product areas
      Then the Package Metadata table product areas row should show "2"

    @acceptance-criteria @unit
    Scenario: Package metadata section can be disabled
      When decoding with includePackageMetadata disabled
      Then a section with heading "Package Metadata" should not exist

  # ============================================================================
  # RULE 3: Document Inventory Section
  # ============================================================================

  Rule: Document inventory groups entries by topic

    **Invariant:** When documentEntries is non-empty and includeDocumentInventory is true, entries must be grouped by topic with one H3 sub-heading and one table per topic group. When entries are empty, no inventory section is rendered.
    **Rationale:** A flat list of all documents becomes unnavigable beyond a small count — topic grouping gives readers a structured entry point into the documentation set.
    **Verified by:** Empty entries produces no inventory section, Entries grouped by topic produce per-topic tables, Inventory section can be disabled

    @acceptance-criteria @unit
    Scenario: Empty entries produces no inventory section
      When decoding with no document entries
      Then a section with heading "Document Inventory" should not exist

    @acceptance-criteria @unit
    Scenario: Entries grouped by topic produce per-topic tables
      When decoding with document entries in topic "Architecture"
      Then a section with heading "Document Inventory" should exist
      And a subsection with heading "Architecture" should exist

    @acceptance-criteria @unit
    Scenario: Inventory section can be disabled
      When decoding with includeDocumentInventory disabled and document entries provided
      Then a section with heading "Document Inventory" should not exist

  # ============================================================================
  # RULE 4: Product Area Statistics Section
  # ============================================================================

  Rule: Product area statistics are computed from dataset

    **Invariant:** The Product Area Statistics table must list each product area alphabetically with Patterns, Completed, Active, Planned, and Progress columns, plus a bolded Total row aggregating all areas. The progress column must contain a visual progress bar and percentage.
    **Rationale:** Product area statistics give team leads a cross-cutting view of work distribution — alphabetical order and a total row enable fast scanning and aggregate assessment.
    **Verified by:** Product area table includes all areas alphabetically, Total row aggregates all areas, Progress bar and percentage are computed, Product area stats can be disabled

    @acceptance-criteria @unit
    Scenario: Product area table includes all areas alphabetically
      When decoding with a dataset containing patterns in product areas "Generation" and "Analysis"
      Then the Product Area Statistics table should list "Analysis" before "Generation"

    @acceptance-criteria @unit
    Scenario: Total row aggregates all areas
      When decoding with a dataset containing patterns in 2 product areas
      Then the Product Area Statistics table should have a Total row

    @acceptance-criteria @unit
    Scenario: Progress bar and percentage are computed
      When decoding with a dataset containing 4 completed patterns in one product area
      Then the Product Area Statistics table should contain a progress bar

    @acceptance-criteria @unit
    Scenario: Product area stats can be disabled
      When decoding with includeProductAreaStats disabled
      Then a section with heading "Product Area Statistics" should not exist

  # ============================================================================
  # RULE 5: Phase Progress Section
  # ============================================================================

  Rule: Phase progress summarizes pattern status

    **Invariant:** The Phase Progress section must render a summary paragraph with total, completed, active, and planned counts, a status distribution table with Status/Count/Percentage columns, and — when patterns have phase numbers — a "By Phase" sub-section with a per-phase breakdown table.
    **Rationale:** Phase progress is the primary indicator of delivery health — the summary paragraph provides instant context while the distribution table enables deeper analysis.
    **Verified by:** Phase progress shows total counts, Status distribution table shows completed/active/planned, Per-phase breakdown appears when phases exist, Phase progress can be disabled

    @acceptance-criteria @unit
    Scenario: Phase progress shows total counts
      When decoding with a dataset containing 3 completed and 2 active patterns
      Then the Phase Progress section should contain a paragraph with pattern counts

    @acceptance-criteria @unit
    Scenario: Status distribution table shows completed/active/planned
      When decoding with default options
      Then the Phase Progress section should have a table with columns "Status", "Count", "Percentage"

    @acceptance-criteria @unit
    Scenario: Per-phase breakdown appears when phases exist
      When decoding with a dataset containing patterns with phase numbers
      Then the Phase Progress section should have a "By Phase" sub-section

    @acceptance-criteria @unit
    Scenario: Phase progress can be disabled
      When decoding with includePhaseProgress disabled
      Then a section with heading "Phase Progress" should not exist

  # ============================================================================
  # RULE 6: Regeneration Footer
  # ============================================================================

  Rule: Regeneration footer contains commands

    **Invariant:** The Regeneration section must always be present (it is not optional), must contain the heading "Regeneration", and must include at least one code block with pnpm commands.
    **Rationale:** The regeneration footer ensures consumers always know how to rebuild the docs — it is unconditional so it cannot be accidentally omitted.
    **Verified by:** Regeneration section has heading "Regeneration", Code blocks contain pnpm commands

    @acceptance-criteria @unit
    Scenario: Regeneration section has heading "Regeneration"
      When decoding with default options
      Then a section with heading "Regeneration" should exist

    @acceptance-criteria @unit
    Scenario: Code blocks contain pnpm commands
      When decoding with default options
      Then the Regeneration section should contain a code block with "pnpm docs:all"

  # ============================================================================
  # RULE 7: Section Ordering Follows Layout Contract
  # ============================================================================

  Rule: Section ordering follows layout contract

    **Invariant:** Sections must appear in this fixed order: Package Metadata, preamble (if any), Document Inventory (if any), Product Area Statistics, Phase Progress, Regeneration. Separators must appear after each non-final section group. This order is the layout contract for INDEX.md.
    **Rationale:** Consumers depend on a predictable INDEX.md structure for navigation links — reordering sections would break existing bookmarks and tool-generated cross-references.
    **Verified by:** Default layout order is metadata, stats, progress, regeneration, Preamble appears after metadata and before inventory, Separators appear between sections

    @acceptance-criteria @unit
    Scenario: Default layout order is metadata, stats, progress, regeneration
      When decoding with default options
      Then section ordering should be correct:
        | first                   | second                  |
        | Package Metadata        | Product Area Statistics |
        | Product Area Statistics | Phase Progress          |
        | Phase Progress          | Regeneration            |

    @acceptance-criteria @unit
    Scenario: Preamble appears after metadata and before inventory
      When decoding with a preamble section and document entries in topic "Guides"
      Then section ordering should be correct:
        | first            | second                  |
        | Package Metadata | Document Inventory      |
        | Document Inventory | Product Area Statistics |
      And the preamble paragraph appears between "Package Metadata" and "Document Inventory"

    @acceptance-criteria @unit
    Scenario: Separators appear between sections
      When decoding with default options
      Then a separator should appear after the "Package Metadata" heading

  # ============================================================================
  # RULE 8: Custom Purpose Text
  # ============================================================================

  Rule: Custom purpose text overrides default

    **Invariant:** When purposeText is set to a non-empty string, the document purpose must use that string instead of the auto-generated default. When purposeText is empty or omitted, the auto-generated purpose is used.
    **Rationale:** Consumers with different documentation sets need to customize the navigation purpose without post-processing the generated output.
    **Verified by:** purposeText replaces auto-generated purpose, Empty purposeText uses auto-generated purpose

    @acceptance-criteria @unit
    Scenario: purposeText replaces auto-generated purpose
      When decoding with purposeText "Custom navigation guide"
      Then document purpose should be "Custom navigation guide"

    @acceptance-criteria @unit
    Scenario: Empty purposeText uses auto-generated purpose
      When decoding with empty purposeText
      Then document purpose should contain "Navigate the full documentation set"

  # ============================================================================
  # RULE 9: Epilogue Replaces Regeneration Footer
  # ============================================================================

  Rule: Epilogue replaces regeneration footer

    **Invariant:** When epilogue sections are provided, they completely replace the built-in regeneration footer. When epilogue is empty, the regeneration footer is rendered as before.
    **Rationale:** Consumers may need a custom footer (e.g., links to CI, contribution guides) that has nothing to do with regeneration commands.
    **Verified by:** Epilogue replaces built-in footer, Empty epilogue preserves regeneration footer

    @acceptance-criteria @unit
    Scenario: Epilogue replaces built-in footer
      When decoding with epilogue sections
      Then a section with heading "Regeneration" should not exist
      And the epilogue heading should be present

    @acceptance-criteria @unit
    Scenario: Empty epilogue preserves regeneration footer
      When decoding with empty epilogue
      Then a section with heading "Regeneration" should exist

  # ============================================================================
  # RULE 10: Package Metadata Overrides
  # ============================================================================

  Rule: Package metadata overrides work

    **Invariant:** When packageMetadataOverrides provides a value for name, purpose, or license, that value replaces the corresponding default or projectMetadata value in the Package Metadata table. Unset override keys fall through to the default chain.
    **Rationale:** Consumers reusing the IndexCodec for different packages need to override individual metadata fields without providing a full projectMetadata object.
    **Verified by:** Name override replaces package name, Purpose override replaces purpose, License override replaces license, Unset overrides fall through to defaults

    @acceptance-criteria @unit
    Scenario: Name override replaces package name
      When decoding with packageMetadataOverrides name "my-package"
      Then the Package Metadata table should show "my-package" as the package name

    @acceptance-criteria @unit
    Scenario: Purpose override replaces purpose
      When decoding with packageMetadataOverrides purpose "A custom purpose"
      Then the Package Metadata table should contain "A custom purpose"

    @acceptance-criteria @unit
    Scenario: License override replaces license
      When decoding with packageMetadataOverrides license "Apache-2.0"
      Then the Package Metadata table should contain "Apache-2.0"

    @acceptance-criteria @unit
    Scenario: Unset overrides fall through to defaults
      When decoding with packageMetadataOverrides name "my-package"
      Then the Package Metadata table should contain "MIT"
