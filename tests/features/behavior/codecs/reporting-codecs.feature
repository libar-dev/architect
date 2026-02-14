@libar-docs
@libar-docs-pattern:ReportingCodecTesting
@libar-docs-status:completed
@libar-docs-product-area:Generation
@libar-docs-implements:CodecBehaviorTesting
@behavior @reporting-codecs
Feature: Reporting Document Codecs
  The reporting codecs (ChangelogCodec, TraceabilityCodec, OverviewCodec)
  transform MasterDataset into RenderableDocuments for reporting outputs.

  **Problem:**
  - Need to generate changelog, traceability, and overview documents
  - Each view requires different filtering, grouping, and formatting logic

  **Solution:**
  - Three specialized codecs for different reporting perspectives
  - Keep a Changelog format for ChangelogCodec
  - Coverage statistics and gap reporting for TraceabilityCodec
  - Architecture and summary views for OverviewCodec

  Background:
    Given a reporting codec test context

  # ═══════════════════════════════════════════════════════════════════════════
  # ChangelogCodec
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: ChangelogCodec follows Keep a Changelog format

    @happy-path @edge-case
    Scenario: Decode empty dataset produces changelog header only
      Given an empty MasterDataset for changelog
      When decoding with ChangelogCodec
      Then the document title is "Changelog"
      And the document contains Keep a Changelog header

    @happy-path
    Scenario: Unreleased section shows active and vNEXT patterns
      Given a MasterDataset with unreleased patterns
      When decoding with ChangelogCodec
      Then the document contains "[Unreleased]" heading
      And the unreleased section contains active patterns
      And the unreleased section contains vNEXT patterns

    @happy-path
    Scenario: Release sections sorted by semver descending
      Given a MasterDataset with multiple releases:
        | release  | count |
        | v0.1.0   | 2     |
        | v0.2.0   | 3     |
        | v1.0.0   | 1     |
      When decoding with ChangelogCodec
      Then the release sections appear in order:
        | release  |
        | v1.0.0   |
        | v0.2.0   |
        | v0.1.0   |

    @happy-path
    Scenario: Quarter fallback for patterns without release
      Given a MasterDataset with completed patterns without release tag
      When decoding with ChangelogCodec
      Then the document contains quarterly sections
      And the quarterly sections contain patterns

    Scenario: Earlier section for undated patterns
      Given a MasterDataset with undated completed patterns
      When decoding with ChangelogCodec
      Then the document contains "[Earlier]" heading
      And the earlier section contains undated patterns

    Scenario: Category mapping to change types
      Given a MasterDataset with category-mapped patterns:
        | category   | expectedType |
        | fix        | Fixed        |
        | bugfix     | Fixed        |
        | refactor   | Changed      |
        | security   | Security     |
        | deprecated | Removed      |
      When decoding with ChangelogCodec
      Then each category maps to correct change type

    Scenario: Exclude unreleased when option disabled
      Given a MasterDataset with unreleased patterns
      When decoding with includeUnreleased disabled
      Then the document does not contain "[Unreleased]" heading

    Scenario: Change type sections follow standard order
      Given a MasterDataset with mixed change types
      When decoding with ChangelogCodec
      Then change type sections follow order:
        | type       |
        | Added      |
        | Changed    |
        | Deprecated |
        | Removed    |
        | Fixed      |
        | Security   |

  # ═══════════════════════════════════════════════════════════════════════════
  # TraceabilityCodec
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: TraceabilityCodec maps timeline patterns to behavior tests

    @happy-path @edge-case
    Scenario: No timeline patterns produces empty message
      Given a MasterDataset with no timeline patterns
      When decoding with TraceabilityCodec
      Then the document title is "Timeline → Behavior Traceability"
      And the document contains "No Timeline Patterns" heading

    @happy-path
    Scenario: Coverage statistics show totals and percentage
      Given a MasterDataset with traceability patterns:
        | name       | phase | hasBehaviorFile |
        | Pattern A  | 1     | true            |
        | Pattern B  | 1     | true            |
        | Pattern C  | 2     | false           |
      When decoding with TraceabilityCodec
      Then the coverage statistics table shows:
        | metric                 | value |
        | Timeline Phases        | 3     |
        | With Behavior Tests    | 2     |
        | Missing Behavior Tests | 1     |
        | Coverage               | 67%   |

    @happy-path
    Scenario: Coverage gaps table shows missing coverage
      Given a MasterDataset with coverage gaps
      When decoding with TraceabilityCodec
      Then the document contains "Coverage Gaps" heading
      And the gaps table shows patterns without behavior files

    @happy-path
    Scenario: Covered phases in collapsible section
      Given a MasterDataset with covered patterns
      When decoding with TraceabilityCodec
      Then the document contains covered phases collapsible
      And the covered phases table shows behavior file paths

    Scenario: Exclude gaps when option disabled
      Given a MasterDataset with coverage gaps
      When decoding with includeGaps disabled
      Then the document does not contain "Coverage Gaps" heading

    Scenario: Exclude stats when option disabled
      Given a MasterDataset with traceability patterns:
        | name       | phase | hasBehaviorFile |
        | Pattern A  | 1     | true            |
      When decoding with includeStats disabled
      Then the document does not contain "Coverage Statistics" heading

    Scenario: Exclude covered when option disabled
      Given a MasterDataset with covered patterns
      When decoding with includeCovered disabled
      Then the document does not contain covered phases collapsible

    Scenario: Verified behavior files indicated in output
      Given a MasterDataset with verified behavior files
      When decoding with TraceabilityCodec
      Then the covered patterns show verification status

  # ═══════════════════════════════════════════════════════════════════════════
  # OverviewCodec
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: OverviewCodec provides project architecture summary

    @happy-path @edge-case
    Scenario: Decode empty dataset produces minimal overview
      Given an empty MasterDataset for overview
      When decoding with OverviewCodec
      Then the document title is "Architecture Overview"
      And the document has a purpose

    @happy-path
    Scenario: Architecture section from overview-tagged patterns
      Given a MasterDataset with overview patterns
      When decoding with OverviewCodec
      Then the document contains "Architecture" heading
      And the architecture section contains overview pattern descriptions

    @happy-path
    Scenario: Patterns summary with progress bar
      Given a MasterDataset with status distribution for overview:
        | status    | count |
        | completed | 6     |
        | active    | 2     |
        | planned   | 2     |
      When decoding with OverviewCodec
      Then the document contains "Patterns Summary" heading
      And the patterns summary shows progress percentage
      And the patterns summary shows category counts table

    @happy-path
    Scenario: Timeline summary with phase counts
      Given a MasterDataset with phased patterns
      When decoding with OverviewCodec
      Then the document contains "Timeline Summary" heading
      And the timeline summary table shows:
        | metric          |
        | Total Phases    |
        | Completed Phases|
        | Active Phases   |
        | Patterns        |

    Scenario: Exclude architecture when option disabled
      Given a MasterDataset with overview patterns
      When decoding with includeArchitecture disabled
      Then the document does not contain "Architecture" heading

    Scenario: Exclude patterns summary when option disabled
      Given a MasterDataset with status distribution for overview:
        | status    | count |
        | completed | 5     |
      When decoding with includePatternsSummary disabled
      Then the document does not contain "Patterns Summary" heading

    Scenario: Exclude timeline summary when option disabled
      Given a MasterDataset with phased patterns
      When decoding with includeTimelineSummary disabled
      Then the document does not contain "Timeline Summary" heading

    Scenario: Multiple overview patterns create multiple architecture subsections
      Given a MasterDataset with multiple overview patterns:
        | name                | description              |
        | Event Store         | Core event persistence   |
        | Projection Engine   | Read model generation    |
        | Command Handler     | Write side orchestration |
      When decoding with OverviewCodec
      Then the architecture section has 3 subsections
