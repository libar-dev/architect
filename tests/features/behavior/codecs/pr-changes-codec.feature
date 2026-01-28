@libar-docs-implements:CodecBehaviorTesting
@behavior @pr-changes-codec
@libar-docs-pattern:PrChangesCodecTesting
@libar-docs-product-area:Codec
Feature: PR Changes Document Codec
  The PrChangesCodec transforms MasterDataset into RenderableDocument for
  PR-scoped documentation. It filters patterns by changed files and/or
  release version tags, groups by phase or priority, and generates
  review-focused output.

  **Problem:**
  - Need to generate PR-specific documentation from patterns
  - Filters by changed files and release version tags
  - Different grouping options (phase, priority, workflow)

  **Solution:**
  - PrChangesCodec with configurable filtering and grouping
  - Generates review checklists and dependency sections
  - OR logic for combined filters

  Background:
    Given a PR changes codec test context

  # ═══════════════════════════════════════════════════════════════════════════
  # No Changes / Empty States
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: PrChangesCodec handles empty results gracefully

    @happy-path @edge-case
    Scenario: No changes when no patterns match changedFiles filter
      Given a MasterDataset with active patterns
      When decoding with changedFiles filter for non-matching paths
      Then the document title is "Pull Request Changes"
      And the document contains "No Changes" section
      And the no changes message mentions the file filter

    @happy-path @edge-case
    Scenario: No changes when no patterns match releaseFilter
      Given a MasterDataset with active patterns
      When decoding with releaseFilter "v9.9.9"
      Then the document contains "No Changes" section
      And the no changes message mentions the release filter

    @happy-path @edge-case
    Scenario: No changes with combined filters when nothing matches
      Given a MasterDataset with active patterns
      When decoding with changedFiles and releaseFilter that match nothing
      Then the document contains "No Changes" section
      And the no changes message mentions both filters

  # ═══════════════════════════════════════════════════════════════════════════
  # Summary Section
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: PrChangesCodec generates summary with filter information

    @happy-path
    Scenario: Summary section shows pattern counts
      Given a MasterDataset with PR-relevant patterns
      When decoding with PrChangesCodec
      Then the document title is "Pull Request Changes"
      And the document contains a "Summary" section
      And the summary table shows:
        | metric        | value |
        | Patterns in PR | 3    |
        | Completed     | 1     |
        | Active        | 2     |

    @happy-path
    Scenario: Summary shows release tag when releaseFilter is set
      Given a MasterDataset with PR-relevant patterns with deliverables
      When decoding with releaseFilter "v0.2.0"
      Then the summary table includes release tag row

    @happy-path
    Scenario: Summary shows files filter count when changedFiles is set
      Given a MasterDataset with PR-relevant patterns
      When decoding with changedFiles filter for matching paths
      Then the summary table includes files filter row

  # ═══════════════════════════════════════════════════════════════════════════
  # Changes by Phase Grouping
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: PrChangesCodec groups changes by phase when sortBy is "phase"

    @happy-path
    Scenario: Changes grouped by phase with default sortBy
      Given a MasterDataset with patterns in multiple phases
      When decoding with PrChangesCodec
      Then the document contains a "Changes by Phase" section
      And the document contains phase headings:
        | heading  |
        | Phase 1  |
        | Phase 2  |

    Scenario: Pattern details shown within phase groups
      Given a MasterDataset with patterns in multiple phases
      When decoding with PrChangesCodec
      Then phase groups contain pattern headings with status emoji

  # ═══════════════════════════════════════════════════════════════════════════
  # Changes by Priority Grouping
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: PrChangesCodec groups changes by priority when sortBy is "priority"

    @happy-path
    Scenario: Changes grouped by priority
      Given a MasterDataset with patterns with different priorities
      When decoding with sortBy "priority"
      Then the document contains a "Changes by Priority" section
      And the document contains priority headings:
        | heading          |
        | High Priority    |
        | Medium Priority  |
        | Low Priority     |

    Scenario: Priority groups show correct patterns
      Given a MasterDataset with patterns with different priorities
      When decoding with sortBy "priority"
      Then high priority section contains high priority patterns
      And low priority section contains low priority patterns

  # ═══════════════════════════════════════════════════════════════════════════
  # Flat Changes List (Workflow Sort)
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: PrChangesCodec shows flat list when sortBy is "workflow"

    @happy-path
    Scenario: Flat changes list with workflow sort
      Given a MasterDataset with PR-relevant patterns
      When decoding with sortBy "workflow"
      Then the document contains a "Changes" section
      And the changes section contains pattern entries

  # ═══════════════════════════════════════════════════════════════════════════
  # Pattern Detail Rendering
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: PrChangesCodec renders pattern details with metadata and description

    @happy-path
    Scenario: Pattern detail shows metadata table
      Given a MasterDataset with a detailed pattern
      When decoding with PrChangesCodec
      Then pattern details include metadata table with:
        | property      |
        | Status        |
        | Phase         |

    Scenario: Pattern detail shows business value when available
      Given a MasterDataset with a pattern with business value
      When decoding with PrChangesCodec
      Then pattern details include metadata table with:
        | property       |
        | Business Value |

    Scenario: Pattern detail shows description
      Given a MasterDataset with a detailed pattern
      When decoding with PrChangesCodec
      Then pattern details include description text

  # ═══════════════════════════════════════════════════════════════════════════
  # Deliverables Section
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: PrChangesCodec renders deliverables when includeDeliverables is enabled

    @happy-path
    Scenario: Deliverables shown when patterns have deliverables
      Given a MasterDataset with patterns with deliverables
      When decoding with includeDeliverables enabled
      Then the document contains deliverables lists

    Scenario: Deliverables filtered by release when releaseFilter is set
      Given a MasterDataset with patterns with mixed release deliverables
      When decoding with releaseFilter "v0.2.0" and includeDeliverables
      Then only deliverables for "v0.2.0" are shown

    Scenario: No deliverables section when includeDeliverables is disabled
      Given a MasterDataset with patterns with deliverables
      When decoding with includeDeliverables disabled
      Then the document does not contain deliverables lists

  # ═══════════════════════════════════════════════════════════════════════════
  # Acceptance Criteria and Business Rules
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: PrChangesCodec renders acceptance criteria from scenarios

    @happy-path
    Scenario: Acceptance criteria rendered when patterns have scenarios
      Given a MasterDataset with patterns with scenarios
      When decoding with PrChangesCodec
      Then the document contains "Acceptance Criteria" sections

    Scenario: Acceptance criteria shows scenario steps
      Given a MasterDataset with patterns with scenarios and steps
      When decoding with PrChangesCodec
      Then acceptance criteria sections contain step lists

  Rule: PrChangesCodec renders business rules from Gherkin Rule keyword

    @happy-path
    Scenario: Business rules rendered when patterns have rules
      Given a MasterDataset with patterns with business rules
      When decoding with PrChangesCodec
      Then the document contains "Business Rules" sections

    Scenario: Business rules show rule names and verification info
      Given a MasterDataset with patterns with business rules
      When decoding with PrChangesCodec
      Then business rules sections contain rule names
      And business rules sections contain verification info

  # ═══════════════════════════════════════════════════════════════════════════
  # Review Checklist Generation
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: PrChangesCodec generates review checklist when includeReviewChecklist is enabled

    @happy-path
    Scenario: Review checklist generated with standard items
      Given a MasterDataset with PR-relevant patterns
      When decoding with includeReviewChecklist enabled
      Then the document contains a "Review Checklist" section
      And the review checklist contains standard items:
        | item                               |
        | Code follows project conventions   |
        | Tests added/updated for changes    |
        | Documentation updated if needed    |

    Scenario: Review checklist includes completed patterns item when applicable
      Given a MasterDataset with completed patterns
      When decoding with includeReviewChecklist enabled
      Then the review checklist contains "Completed patterns verified working"

    Scenario: Review checklist includes active work item when applicable
      Given a MasterDataset with active patterns
      When decoding with includeReviewChecklist enabled
      Then the review checklist contains "Active work is in a consistent state"

    Scenario: Review checklist includes dependencies item when patterns have dependencies
      Given a MasterDataset with patterns with dependencies
      When decoding with includeReviewChecklist enabled
      Then the review checklist contains "Dependencies are satisfied"

    Scenario: Review checklist includes deliverables item when patterns have deliverables
      Given a MasterDataset with patterns with deliverables
      When decoding with includeReviewChecklist enabled
      Then the review checklist contains "Deliverables tracked in feature files"

    Scenario: No review checklist when includeReviewChecklist is disabled
      Given a MasterDataset with PR-relevant patterns
      When decoding with includeReviewChecklist disabled
      Then the document does not contain a "Review Checklist" section

  # ═══════════════════════════════════════════════════════════════════════════
  # Dependencies Section
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: PrChangesCodec generates dependencies section when includeDependencies is enabled

    @happy-path
    Scenario: Dependencies section shows depends on relationships
      Given a MasterDataset with patterns with dependsOn relationships
      When decoding with includeDependencies enabled
      Then the document contains a "Dependencies" section
      And the dependencies section contains "Depends On" subsection

    Scenario: Dependencies section shows enables relationships
      Given a MasterDataset with patterns with enables relationships
      When decoding with includeDependencies enabled
      Then the dependencies section contains "Enables" subsection

    Scenario: No dependencies section when patterns have no dependencies
      Given a MasterDataset with patterns without dependencies
      When decoding with includeDependencies enabled
      Then the document does not contain a "Dependencies" section

    Scenario: No dependencies section when includeDependencies is disabled
      Given a MasterDataset with patterns with dependencies
      When decoding with includeDependencies disabled
      Then the document does not contain a "Dependencies" section

  # ═══════════════════════════════════════════════════════════════════════════
  # Filter Logic
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: PrChangesCodec filters patterns by changedFiles

    @happy-path
    Scenario: Patterns filtered by changedFiles match
      Given a MasterDataset with patterns from various files
      When decoding with changedFiles filter matching specific patterns
      Then only patterns from those files are included

    Scenario: changedFiles filter matches partial paths
      Given a MasterDataset with patterns from various files
      When decoding with changedFiles filter for a directory path
      Then patterns under that directory are included

  Rule: PrChangesCodec filters patterns by releaseFilter

    @happy-path
    Scenario: Patterns filtered by release version
      Given a MasterDataset with patterns with different release deliverables
      When decoding with releaseFilter "v0.2.0"
      Then only patterns with v0.2.0 deliverables are included

  Rule: PrChangesCodec uses OR logic for combined filters

    @happy-path
    Scenario: Combined filters match patterns meeting either criterion
      Given a MasterDataset with patterns matching file or release
      When decoding with both changedFiles and releaseFilter
      Then patterns matching either filter are included

    Scenario: Patterns matching both criteria are not duplicated
      Given a MasterDataset with a pattern matching both file and release
      When decoding with both changedFiles and releaseFilter
      Then the pattern appears only once

  # ═══════════════════════════════════════════════════════════════════════════
  # Status Filtering
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: PrChangesCodec only includes active and completed patterns

    @happy-path
    Scenario: Roadmap patterns are excluded
      Given a MasterDataset with patterns of all statuses
      When decoding with PrChangesCodec
      Then roadmap patterns are not included

    Scenario: Deferred patterns are excluded
      Given a MasterDataset with deferred patterns
      When decoding with PrChangesCodec
      Then deferred patterns are not included
