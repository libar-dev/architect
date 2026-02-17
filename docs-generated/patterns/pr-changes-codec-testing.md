# ✅ Pr Changes Codec Testing

**Purpose:** Detailed documentation for the Pr Changes Codec Testing pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Behavior |

## Description

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

## Acceptance Criteria

**No changes when no patterns match changedFiles filter**

- Given a MasterDataset with active patterns
- When decoding with changedFiles filter for non-matching paths
- Then the document title is "Pull Request Changes"
- And the document contains "No Changes" section
- And the no changes message mentions the file filter

**No changes when no patterns match releaseFilter**

- Given a MasterDataset with active patterns
- When decoding with releaseFilter "v9.9.9"
- Then the document contains "No Changes" section
- And the no changes message mentions the release filter

**No changes with combined filters when nothing matches**

- Given a MasterDataset with active patterns
- When decoding with changedFiles and releaseFilter that match nothing
- Then the document contains "No Changes" section
- And the no changes message mentions both filters

**Summary section shows pattern counts**

- Given a MasterDataset with PR-relevant patterns
- When decoding with PrChangesCodec
- Then the document title is "Pull Request Changes"
- And the document contains a "Summary" section
- And the summary table shows:

| metric | value |
| --- | --- |
| Patterns in PR | 3 |
| Completed | 1 |
| Active | 2 |

**Summary shows release tag when releaseFilter is set**

- Given a MasterDataset with PR-relevant patterns with deliverables
- When decoding with releaseFilter "v0.2.0"
- Then the summary table includes release tag row

**Summary shows files filter count when changedFiles is set**

- Given a MasterDataset with PR-relevant patterns
- When decoding with changedFiles filter for matching paths
- Then the summary table includes files filter row

**Changes grouped by phase with default sortBy**

- Given a MasterDataset with patterns in multiple phases
- When decoding with PrChangesCodec
- Then the document contains a "Changes by Phase" section
- And the document contains phase headings:

| heading |
| --- |
| Phase 1 |
| Phase 2 |

**Pattern details shown within phase groups**

- Given a MasterDataset with patterns in multiple phases
- When decoding with PrChangesCodec
- Then phase groups contain pattern headings with status emoji

**Changes grouped by priority**

- Given a MasterDataset with patterns with different priorities
- When decoding with sortBy "priority"
- Then the document contains a "Changes by Priority" section
- And the document contains priority headings:

| heading |
| --- |
| High Priority |
| Medium Priority |
| Low Priority |

**Priority groups show correct patterns**

- Given a MasterDataset with patterns with different priorities
- When decoding with sortBy "priority"
- Then high priority section contains high priority patterns
- And low priority section contains low priority patterns

**Flat changes list with workflow sort**

- Given a MasterDataset with PR-relevant patterns
- When decoding with sortBy "workflow"
- Then the document contains a "Changes" section
- And the changes section contains pattern entries

**Pattern detail shows metadata table**

- Given a MasterDataset with a detailed pattern
- When decoding with PrChangesCodec
- Then pattern details include metadata table with:

| property |
| --- |
| Status |
| Phase |

**Pattern detail shows business value when available**

- Given a MasterDataset with a pattern with business value
- When decoding with PrChangesCodec
- Then pattern details include metadata table with:

| property |
| --- |
| Business Value |

**Pattern detail shows description**

- Given a MasterDataset with a detailed pattern
- When decoding with PrChangesCodec
- Then pattern details include description text

**Deliverables shown when patterns have deliverables**

- Given a MasterDataset with patterns with deliverables
- When decoding with includeDeliverables enabled
- Then the document contains deliverables lists

**Deliverables filtered by release when releaseFilter is set**

- Given a MasterDataset with patterns with mixed release deliverables
- When decoding with releaseFilter "v0.2.0" and includeDeliverables
- Then only deliverables for "v0.2.0" are shown

**No deliverables section when includeDeliverables is disabled**

- Given a MasterDataset with patterns with deliverables
- When decoding with includeDeliverables disabled
- Then the document does not contain deliverables lists

**Acceptance criteria rendered when patterns have scenarios**

- Given a MasterDataset with patterns with scenarios
- When decoding with PrChangesCodec
- Then the document contains "Acceptance Criteria" sections

**Acceptance criteria shows scenario steps**

- Given a MasterDataset with patterns with scenarios and steps
- When decoding with PrChangesCodec
- Then acceptance criteria sections contain step lists

**Business rules rendered when patterns have rules**

- Given a MasterDataset with patterns with business rules
- When decoding with PrChangesCodec
- Then the document contains "Business Rules" sections

**Business rules show rule names and verification info**

- Given a MasterDataset with patterns with business rules
- When decoding with PrChangesCodec
- Then business rules sections contain rule names
- And business rules sections contain verification info

**Review checklist generated with standard items**

- Given a MasterDataset with PR-relevant patterns
- When decoding with includeReviewChecklist enabled
- Then the document contains a "Review Checklist" section
- And the review checklist contains standard items:

| item |
| --- |
| Code follows project conventions |
| Tests added/updated for changes |
| Documentation updated if needed |

**Review checklist includes completed patterns item when applicable**

- Given a MasterDataset with completed patterns
- When decoding with includeReviewChecklist enabled
- Then the review checklist contains "Completed patterns verified working"

**Review checklist includes active work item when applicable**

- Given a MasterDataset with active patterns
- When decoding with includeReviewChecklist enabled
- Then the review checklist contains "Active work is in a consistent state"

**Review checklist includes dependencies item when patterns have dependencies**

- Given a MasterDataset with patterns with dependencies
- When decoding with includeReviewChecklist enabled
- Then the review checklist contains "Dependencies are satisfied"

**Review checklist includes deliverables item when patterns have deliverables**

- Given a MasterDataset with patterns with deliverables
- When decoding with includeReviewChecklist enabled
- Then the review checklist contains "Deliverables tracked in feature files"

**No review checklist when includeReviewChecklist is disabled**

- Given a MasterDataset with PR-relevant patterns
- When decoding with includeReviewChecklist disabled
- Then the document does not contain a "Review Checklist" section

**Dependencies section shows depends on relationships**

- Given a MasterDataset with patterns with dependsOn relationships
- When decoding with includeDependencies enabled
- Then the document contains a "Dependencies" section
- And the dependencies section contains "Depends On" subsection

**Dependencies section shows enables relationships**

- Given a MasterDataset with patterns with enables relationships
- When decoding with includeDependencies enabled
- Then the dependencies section contains "Enables" subsection

**No dependencies section when patterns have no dependencies**

- Given a MasterDataset with patterns without dependencies
- When decoding with includeDependencies enabled
- Then the document does not contain a "Dependencies" section

**No dependencies section when includeDependencies is disabled**

- Given a MasterDataset with patterns with dependencies
- When decoding with includeDependencies disabled
- Then the document does not contain a "Dependencies" section

**Patterns filtered by changedFiles match**

- Given a MasterDataset with patterns from various files
- When decoding with changedFiles filter matching specific patterns
- Then only patterns from those files are included

**changedFiles filter matches partial paths**

- Given a MasterDataset with patterns from various files
- When decoding with changedFiles filter for a directory path
- Then patterns under that directory are included

**Patterns filtered by release version**

- Given a MasterDataset with patterns with different release deliverables
- When decoding with releaseFilter "v0.2.0"
- Then only patterns with v0.2.0 deliverables are included

**Combined filters match patterns meeting either criterion**

- Given a MasterDataset with patterns matching file or release
- When decoding with both changedFiles and releaseFilter
- Then patterns matching either filter are included

**Patterns matching both criteria are not duplicated**

- Given a MasterDataset with a pattern matching both file and release
- When decoding with both changedFiles and releaseFilter
- Then the pattern appears only once

**Roadmap patterns are excluded**

- Given a MasterDataset with patterns of all statuses
- When decoding with PrChangesCodec
- Then roadmap patterns are not included

**Deferred patterns are excluded**

- Given a MasterDataset with deferred patterns
- When decoding with PrChangesCodec
- Then deferred patterns are not included

## Business Rules

**PrChangesCodec handles empty results gracefully**

**Invariant:** When no patterns match the applied filters, the codec must produce a valid document with a "No Changes" section describing which filters were active.
    **Rationale:** Reviewers need to distinguish "nothing matched" from "codec error" and understand why no patterns appear.
    **Verified by:** No changes when no patterns match changedFiles filter, No changes when no patterns match releaseFilter, No changes with combined filters when nothing matches

_Verified by: No changes when no patterns match changedFiles filter, No changes when no patterns match releaseFilter, No changes with combined filters when nothing matches_

**PrChangesCodec generates summary with filter information**

**Invariant:** Every PR changes document must contain a Summary section with pattern counts and active filter information.
    **Verified by:** Summary section shows pattern counts, Summary shows release tag when releaseFilter is set, Summary shows files filter count when changedFiles is set

_Verified by: Summary section shows pattern counts, Summary shows release tag when releaseFilter is set, Summary shows files filter count when changedFiles is set_

**PrChangesCodec groups changes by phase when sortBy is "phase"**

**Invariant:** When sortBy is "phase" (the default), patterns must be grouped under phase headings in ascending phase order.
    **Verified by:** Changes grouped by phase with default sortBy, Pattern details shown within phase groups

_Verified by: Changes grouped by phase with default sortBy, Pattern details shown within phase groups_

**PrChangesCodec groups changes by priority when sortBy is "priority"**

**Invariant:** When sortBy is "priority", patterns must be grouped under High/Medium/Low priority headings with correct pattern assignment.
    **Verified by:** Changes grouped by priority, Priority groups show correct patterns

_Verified by: Changes grouped by priority, Priority groups show correct patterns_

**PrChangesCodec shows flat list when sortBy is "workflow"**

**Invariant:** When sortBy is "workflow", patterns must be rendered as a flat list without phase or priority grouping.
    **Rationale:** Workflow sorting presents patterns in review order without structural grouping, suited for quick PR reviews.
    **Verified by:** Flat changes list with workflow sort

_Verified by: Flat changes list with workflow sort_

**PrChangesCodec renders pattern details with metadata and description**

**Invariant:** Each pattern entry must include a metadata table (status, phase, business value when available) and description text.
    **Verified by:** Pattern detail shows metadata table, Pattern detail shows business value when available, Pattern detail shows description

_Verified by: Pattern detail shows metadata table, Pattern detail shows business value when available, Pattern detail shows description_

**PrChangesCodec renders deliverables when includeDeliverables is enabled**

**Invariant:** Deliverables are only rendered when includeDeliverables is enabled, and when releaseFilter is set, only deliverables matching that release are shown.
    **Verified by:** Deliverables shown when patterns have deliverables, Deliverables filtered by release when releaseFilter is set, No deliverables section when includeDeliverables is disabled

_Verified by: Deliverables shown when patterns have deliverables, Deliverables filtered by release when releaseFilter is set, No deliverables section when includeDeliverables is disabled_

**PrChangesCodec renders acceptance criteria from scenarios**

**Invariant:** When patterns have associated scenarios, the codec must render an "Acceptance Criteria" section containing scenario names and step lists.
    **Verified by:** Acceptance criteria rendered when patterns have scenarios, Acceptance criteria shows scenario steps

_Verified by: Acceptance criteria rendered when patterns have scenarios, Acceptance criteria shows scenario steps_

**PrChangesCodec renders business rules from Gherkin Rule keyword**

**Invariant:** When patterns have Gherkin Rule blocks, the codec must render a "Business Rules" section containing rule names and verification information.
    **Verified by:** Business rules rendered when patterns have rules, Business rules show rule names and verification info

_Verified by: Business rules rendered when patterns have rules, Business rules show rule names and verification info_

**PrChangesCodec generates review checklist when includeReviewChecklist is enabled**

**Invariant:** When includeReviewChecklist is enabled, the codec must generate a "Review Checklist" section with standard items and context-sensitive items based on pattern state (completed, active, dependencies, deliverables). When disabled, no checklist appears.
    **Verified by:** Review checklist generated with standard items, Review checklist includes completed patterns item when applicable, Review checklist includes active work item when applicable, Review checklist includes dependencies item when patterns have dependencies, Review checklist includes deliverables item when patterns have deliverables, No review checklist when includeReviewChecklist is disabled

_Verified by: Review checklist generated with standard items, Review checklist includes completed patterns item when applicable, Review checklist includes active work item when applicable, Review checklist includes dependencies item when patterns have dependencies, Review checklist includes deliverables item when patterns have deliverables, No review checklist when includeReviewChecklist is disabled_

**PrChangesCodec generates dependencies section when includeDependencies is enabled**

**Invariant:** When includeDependencies is enabled and patterns have dependency relationships, the codec must render a "Dependencies" section with "Depends On" and "Enables" subsections. When no dependencies exist or the option is disabled, the section is omitted.
    **Verified by:** Dependencies section shows depends on relationships, Dependencies section shows enables relationships, No dependencies section when patterns have no dependencies, No dependencies section when includeDependencies is disabled

_Verified by: Dependencies section shows depends on relationships, Dependencies section shows enables relationships, No dependencies section when patterns have no dependencies, No dependencies section when includeDependencies is disabled_

**PrChangesCodec filters patterns by changedFiles**

**Invariant:** When changedFiles filter is set, only patterns whose source files match (including partial directory path matches) are included in the output.
    **Verified by:** Patterns filtered by changedFiles match, changedFiles filter matches partial paths

_Verified by: Patterns filtered by changedFiles match, changedFiles filter matches partial paths_

**PrChangesCodec filters patterns by releaseFilter**

**Invariant:** When releaseFilter is set, only patterns with deliverables matching the specified release version are included.
    **Verified by:** Patterns filtered by release version

_Verified by: Patterns filtered by release version_

**PrChangesCodec uses OR logic for combined filters**

**Invariant:** When both changedFiles and releaseFilter are set, patterns matching either criterion are included (OR logic), and patterns matching both criteria appear only once (no duplicates).
    **Rationale:** OR logic maximizes PR coverage — a change may affect files not yet assigned to a release, or a release may include patterns from unchanged files.
    **Verified by:** Combined filters match patterns meeting either criterion, Patterns matching both criteria are not duplicated

_Verified by: Combined filters match patterns meeting either criterion, Patterns matching both criteria are not duplicated_

**PrChangesCodec only includes active and completed patterns**

**Invariant:** The codec must exclude roadmap and deferred patterns, including only active and completed patterns in the PR changes output.
    **Rationale:** PR changes reflect work that is in progress or done — roadmap and deferred patterns have no code changes to review.
    **Verified by:** Roadmap patterns are excluded, Deferred patterns are excluded

_Verified by: Roadmap patterns are excluded, Deferred patterns are excluded_

---

[← Back to Pattern Registry](../PATTERNS.md)
