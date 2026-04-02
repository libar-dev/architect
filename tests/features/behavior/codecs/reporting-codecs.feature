@architect
@architect-pattern:ReportingCodecTesting
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:Generation
@architect-implements:CodecBehaviorTesting
@behavior @reporting-codecs
Feature: Reporting Document Codecs
  The reporting codecs (ChangelogCodec, TraceabilityCodec, OverviewCodec)
  transform PatternGraph into RenderableDocuments for reporting outputs.

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

    **Invariant:** Releases must be sorted by semver descending, unreleased patterns grouped under "[Unreleased]", and change types follow the standard order (Added, Changed, Deprecated, Removed, Fixed, Security).
    **Rationale:** Keep a Changelog is an industry standard format — following it ensures the output is immediately familiar to developers.
    **Verified by:** Decode empty dataset produces changelog header only, Unreleased section shows active and vNEXT patterns, Release sections sorted by semver descending, Quarter fallback for patterns without release, Earlier section for undated patterns, Category mapping to change types, Exclude unreleased when option disabled, Change type sections follow standard order

    @happy-path @edge-case
    Scenario: Decode empty dataset produces changelog header only
      Given an empty PatternGraph for changelog
      When decoding with ChangelogCodec
      Then the document title is "Changelog"
      And the document contains Keep a Changelog header

    @happy-path
    Scenario: Unreleased section shows active and vNEXT patterns
      Given a PatternGraph with unreleased patterns
      When decoding with ChangelogCodec
      Then the document contains "[Unreleased]" heading
      And the unreleased section contains active patterns
      And the unreleased section contains vNEXT patterns

    @happy-path
    Scenario: Release sections sorted by semver descending
      Given a PatternGraph with multiple releases:
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
      Given a PatternGraph with completed patterns without release tag
      When decoding with ChangelogCodec
      Then the document contains quarterly sections
      And the quarterly sections contain patterns

    Scenario: Earlier section for undated patterns
      Given a PatternGraph with undated completed patterns
      When decoding with ChangelogCodec
      Then the document contains "[Earlier]" heading
      And the earlier section contains undated patterns

    Scenario: Category mapping to change types
      Given a PatternGraph with category-mapped patterns:
        | category   | expectedType |
        | fix        | Fixed        |
        | bugfix     | Fixed        |
        | refactor   | Changed      |
        | security   | Security     |
        | deprecated | Removed      |
      When decoding with ChangelogCodec
      Then each category maps to correct change type

    Scenario: Exclude unreleased when option disabled
      Given a PatternGraph with unreleased patterns
      When decoding with includeUnreleased disabled
      Then the document does not contain "[Unreleased]" heading

    Scenario: Change type sections follow standard order
      Given a PatternGraph with mixed change types
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

    **Invariant:** Coverage statistics must show total timeline phases, those with behavior tests, those missing, and a percentage. Gaps must be surfaced prominently.
    **Rationale:** Traceability ensures every planned pattern has executable verification — gaps represent unverified claims about system behavior.
    **Verified by:** No timeline patterns produces empty message, Coverage statistics show totals and percentage, Coverage gaps table shows missing coverage, Covered phases in collapsible section, Exclude gaps when option disabled, Exclude stats when option disabled, Exclude covered when option disabled, Verified behavior files indicated in output

    @happy-path @edge-case
    Scenario: No timeline patterns produces empty message
      Given a PatternGraph with no timeline patterns
      When decoding with TraceabilityCodec
      Then the document title is "Timeline → Behavior Traceability"
      And the document contains "No Timeline Patterns" heading

    @happy-path
    Scenario: Coverage statistics show totals and percentage
      Given a PatternGraph with traceability patterns:
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
      Given a PatternGraph with coverage gaps
      When decoding with TraceabilityCodec
      Then the document contains "Coverage Gaps" heading
      And the gaps table shows patterns without behavior files

    @happy-path
    Scenario: Covered phases in collapsible section
      Given a PatternGraph with covered patterns
      When decoding with TraceabilityCodec
      Then the document contains covered phases collapsible
      And the covered phases table shows behavior file paths

    Scenario: Exclude gaps when option disabled
      Given a PatternGraph with coverage gaps
      When decoding with includeGaps disabled
      Then the document does not contain "Coverage Gaps" heading

    Scenario: Exclude stats when option disabled
      Given a PatternGraph with traceability patterns:
        | name       | phase | hasBehaviorFile |
        | Pattern A  | 1     | true            |
      When decoding with includeStats disabled
      Then the document does not contain "Coverage Statistics" heading

    Scenario: Exclude covered when option disabled
      Given a PatternGraph with covered patterns
      When decoding with includeCovered disabled
      Then the document does not contain covered phases collapsible

    Scenario: Verified behavior files indicated in output
      Given a PatternGraph with verified behavior files
      When decoding with TraceabilityCodec
      Then the covered patterns show verification status

  # ═══════════════════════════════════════════════════════════════════════════
  # OverviewCodec
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: OverviewCodec provides project architecture summary

    **Invariant:** The overview must include architecture sections from overview-tagged patterns, pattern summary with progress percentage, and timeline summary with phase counts.
    **Rationale:** The architecture overview is the primary entry point for understanding the project — it must provide a complete picture at a glance.
    **Verified by:** Decode empty dataset produces minimal overview, Architecture section from overview-tagged patterns, Patterns summary with progress bar, Timeline summary with phase counts, Exclude architecture when option disabled, Exclude patterns summary when option disabled, Exclude timeline summary when option disabled, Multiple overview patterns create multiple architecture subsections

    @happy-path @edge-case
    Scenario: Decode empty dataset produces minimal overview
      Given an empty PatternGraph for overview
      When decoding with OverviewCodec
      Then the document title is "Architecture Overview"
      And the document has a purpose

    @happy-path
    Scenario: Architecture section from overview-tagged patterns
      Given a PatternGraph with overview patterns
      When decoding with OverviewCodec
      Then the document contains "Architecture" heading
      And the architecture section contains overview pattern descriptions

    @happy-path
    Scenario: Patterns summary with progress bar
      Given a PatternGraph with status distribution for overview:
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
      Given a PatternGraph with phased patterns
      When decoding with OverviewCodec
      Then the document contains "Timeline Summary" heading
      And the timeline summary table shows:
        | metric          |
        | Total Phases    |
        | Completed Phases|
        | Active Phases   |
        | Patterns        |

    Scenario: Exclude architecture when option disabled
      Given a PatternGraph with overview patterns
      When decoding with includeArchitecture disabled
      Then the document does not contain "Architecture" heading

    Scenario: Exclude patterns summary when option disabled
      Given a PatternGraph with status distribution for overview:
        | status    | count |
        | completed | 5     |
      When decoding with includePatternsSummary disabled
      Then the document does not contain "Patterns Summary" heading

    Scenario: Exclude timeline summary when option disabled
      Given a PatternGraph with phased patterns
      When decoding with includeTimelineSummary disabled
      Then the document does not contain "Timeline Summary" heading

    Scenario: Multiple overview patterns create multiple architecture subsections
      Given a PatternGraph with multiple overview patterns:
        | name                | description              |
        | Event Store         | Core event persistence   |
        | Projection Engine   | Read model generation    |
        | Command Handler     | Write side orchestration |
      When decoding with OverviewCodec
      Then the architecture section has 3 subsections
