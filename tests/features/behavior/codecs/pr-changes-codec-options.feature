@architect
@architect-pattern:PrChangesCodecOptionsTesting
@architect-implements:PrChangesCodec
@architect-status:completed
@architect-unlock-reason:'Split-from-original'
@architect-product-area:Generation
@behavior @pr-changes-codec
Feature: PR Changes Codec - Options and Filters
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
  # Review Checklist Generation
  # ═══════════════════════════════════════════════════════════════════════════

  Rule: PrChangesCodec generates review checklist when includeReviewChecklist is enabled

    **Invariant:** When includeReviewChecklist is enabled, the codec must generate a "Review Checklist" section with standard items and context-sensitive items based on pattern state (completed, active, dependencies, deliverables). When disabled, no checklist appears.
    **Rationale:** A context-sensitive checklist prevents reviewers from missing state-specific concerns (e.g., verifying completed patterns still work, or that dependencies are satisfied) that a static checklist would not cover.
    **Verified by:** Review checklist generated with standard items, Review checklist includes completed patterns item when applicable, Review checklist includes active work item when applicable, Review checklist includes dependencies item when patterns have dependencies, Review checklist includes deliverables item when patterns have deliverables, No review checklist when includeReviewChecklist is disabled

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

    **Invariant:** When includeDependencies is enabled and patterns have dependency relationships, the codec must render a "Dependencies" section with "Depends On" and "Enables" subsections. When no dependencies exist or the option is disabled, the section is omitted.
    **Rationale:** Dependency visibility in PR reviews prevents merging changes that break upstream or downstream patterns, which would otherwise only surface during integration.
    **Verified by:** Dependencies section shows depends on relationships, Dependencies section shows enables relationships, No dependencies section when patterns have no dependencies, No dependencies section when includeDependencies is disabled

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

    **Invariant:** When changedFiles filter is set, only patterns whose source files match (including partial directory path matches) are included in the output.
    **Rationale:** Filtering by changed files scopes the PR document to only the patterns actually touched, preventing reviewers from wading through unrelated patterns.
    **Verified by:** Patterns filtered by changedFiles match, changedFiles filter matches partial paths

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

    **Invariant:** When releaseFilter is set, only patterns with deliverables matching the specified release version are included.
    **Rationale:** Release filtering isolates the patterns scheduled for a specific version, enabling targeted release reviews without noise from other versions' deliverables.
    **Verified by:** Patterns filtered by release version

    @happy-path
    Scenario: Patterns filtered by release version
      Given a MasterDataset with patterns with different release deliverables
      When decoding with releaseFilter "v0.2.0"
      Then only patterns with v0.2.0 deliverables are included

  Rule: PrChangesCodec uses OR logic for combined filters

    **Invariant:** When both changedFiles and releaseFilter are set, patterns matching either criterion are included (OR logic), and patterns matching both criteria appear only once (no duplicates).
    **Rationale:** OR logic maximizes PR coverage — a change may affect files not yet assigned to a release, or a release may include patterns from unchanged files.
    **Verified by:** Combined filters match patterns meeting either criterion, Patterns matching both criteria are not duplicated

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

    **Invariant:** The codec must exclude roadmap and deferred patterns, including only active and completed patterns in the PR changes output.
    **Rationale:** PR changes reflect work that is in progress or done — roadmap and deferred patterns have no code changes to review.
    **Verified by:** Roadmap patterns are excluded, Deferred patterns are excluded

    @happy-path
    Scenario: Roadmap patterns are excluded
      Given a MasterDataset with patterns of all statuses
      When decoding with PrChangesCodec
      Then roadmap patterns are not included

    Scenario: Deferred patterns are excluded
      Given a MasterDataset with deferred patterns
      When decoding with PrChangesCodec
      Then deferred patterns are not included
