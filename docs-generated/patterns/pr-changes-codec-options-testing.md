# ✅ Pr Changes Codec Options Testing

**Purpose:** Detailed documentation for the Pr Changes Codec Options Testing pattern

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
