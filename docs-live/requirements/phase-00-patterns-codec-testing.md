# ✅ Patterns Codec Testing

**Purpose:** Detailed requirements for the Patterns Codec Testing feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Generation |

## Description

The PatternsDocumentCodec transforms MasterDataset into a RenderableDocument
for generating PATTERNS.md and category detail files.

**Problem:**

- Need to generate a comprehensive pattern registry from extracted patterns
- Output should include progress tracking, navigation, and categorization

**Solution:**

- Codec transforms MasterDataset → RenderableDocument in a single decode call
- Generates main document with optional category detail files

## Acceptance Criteria

**Decode empty dataset**

- Given an empty MasterDataset
- When decoding with PatternsDocumentCodec
- Then the document title is "Pattern Registry"
- And the document has a purpose
- And the progress section shows 0 patterns

**Decode dataset with patterns - document structure**

- Given a MasterDataset with 5 patterns across 2 categories
- When decoding with PatternsDocumentCodec
- Then the document title is "Pattern Registry"
- And the document contains sections:

| heading      |
| ------------ |
| Progress     |
| Categories   |
| All Patterns |

**Progress summary shows correct counts**

- Given a MasterDataset with status distribution:
- When decoding with PatternsDocumentCodec
- Then the progress section shows:
- And the progress shows "30% complete"

| status    | count |
| --------- | ----- |
| completed | 3     |
| active    | 2     |
| planned   | 5     |

| status    | count |
| --------- | ----- |
| Completed | 3     |
| Active    | 2     |
| Planned   | 5     |
| Total     | 10    |

**Pattern table includes all patterns**

- Given a MasterDataset with 4 patterns
- When decoding with PatternsDocumentCodec
- Then the pattern table has 4 rows
- And the pattern table has columns:

| column      |
| ----------- |
| Pattern     |
| Category    |
| Status      |
| Description |

**Pattern table is sorted by status then name**

- Given a MasterDataset with patterns:
- When decoding with PatternsDocumentCodec
- Then the pattern table rows are in order:

| name  | status    |
| ----- | --------- |
| Zebra | completed |
| Alpha | roadmap   |
| Beta  | active    |
| Gamma | completed |

| name  |
| ----- |
| Gamma |
| Zebra |
| Beta  |
| Alpha |

**Category sections with pattern lists**

- Given a MasterDataset with patterns in categories:
- When decoding with PatternsDocumentCodec
- Then the document has category sections:

| category | count |
| -------- | ----- |
| core     | 3     |
| ddd      | 2     |

| category | patternCount |
| -------- | ------------ |
| core     | 3            |
| ddd      | 2            |

**Filter to specific categories**

- Given a MasterDataset with patterns in categories:
- When decoding with filterCategories "core" and "ddd"
- Then the document has 5 patterns in the table
- And the category sections include only:

| category | count |
| -------- | ----- |
| core     | 3     |
| ddd      | 2     |
| saga     | 1     |

| category |
| -------- |
| core     |
| ddd      |

**Dependency graph included when relationships exist**

- Given a MasterDataset with pattern relationships
- When decoding with default options
- Then the document contains a mermaid dependency graph

**No dependency graph when no relationships**

- Given a MasterDataset without relationships
- When decoding with default options
- Then the document does not contain a mermaid block

**Dependency graph disabled by option**

- Given a MasterDataset with pattern relationships
- When decoding with includeDependencyGraph disabled
- Then the document does not contain a mermaid block

**Generate individual pattern files when enabled**

- Given a MasterDataset with named patterns:
- When decoding with generateDetailFiles enabled
- Then the document has individual pattern files:
- And category links are anchor links
- And pattern links point to individual files

| name         | category |
| ------------ | -------- |
| Core Pattern | core     |
| Another Core | core     |
| DDD Pattern  | ddd      |

| path                     |
| ------------------------ |
| patterns/core-pattern.md |
| patterns/another-core.md |
| patterns/ddd-pattern.md  |

**No detail files when disabled**

- Given a MasterDataset with patterns in 2 categories
- When decoding with generateDetailFiles disabled
- Then the document has no additional files
- And category links are anchor links

**Individual pattern file contains full details**

- Given a MasterDataset with a pattern named "Test Pattern" in category "core"
- When decoding with generateDetailFiles enabled
- Then the "patterns/test-pattern.md" additional file exists
- And the pattern file has title containing "Test Pattern"
- And the pattern file contains an Overview section

## Business Rules

**Document structure includes progress tracking and category navigation**

**Invariant:** Every decoded document must contain a title, purpose, Progress section with status counts, and category navigation regardless of dataset size.
**Rationale:** The PATTERNS.md is the primary entry point for understanding project scope; incomplete structure would leave consumers without context.
**Verified by:** Decode empty dataset, Decode dataset with patterns - document structure, Progress summary shows correct counts

_Verified by: Decode empty dataset, Decode dataset with patterns - document structure, Progress summary shows correct counts_

**Pattern table presents all patterns sorted by status then name**

**Invariant:** The pattern table must include every pattern in the dataset with columns for Pattern, Category, Status, and Description, sorted by status priority (completed first) then alphabetically by name.
**Rationale:** Consistent ordering allows quick scanning of project progress; completed patterns at top confirm done work, while roadmap items at bottom show remaining scope.
**Verified by:** Pattern table includes all patterns, Pattern table is sorted by status then name

_Verified by: Pattern table includes all patterns, Pattern table is sorted by status then name_

**Category sections group patterns by domain**

**Invariant:** Each category in the dataset must produce an H3 section listing its patterns, and the filterCategories option must restrict output to only the specified categories.
**Verified by:** Category sections with pattern lists, Filter to specific categories

_Verified by: Category sections with pattern lists, Filter to specific categories_

**Dependency graph visualizes pattern relationships**

**Invariant:** A Mermaid dependency graph must be included when pattern relationships exist and the includeDependencyGraph option is not disabled; it must be omitted when no relationships exist or when explicitly disabled.
**Verified by:** Dependency graph included when relationships exist, No dependency graph when no relationships, Dependency graph disabled by option

_Verified by: Dependency graph included when relationships exist, No dependency graph when no relationships, Dependency graph disabled by option_

**Detail file generation creates per-pattern pages**

**Invariant:** When generateDetailFiles is enabled, each pattern must produce an individual markdown file at patterns/{slug}.md containing an Overview section; when disabled, no additional files must be generated.
**Rationale:** Detail files enable deep-linking into specific patterns from the main registry while keeping the index document scannable.
**Verified by:** Generate individual pattern files when enabled, No detail files when disabled, Individual pattern file contains full details

_Verified by: Generate individual pattern files when enabled, No detail files when disabled, Individual pattern file contains full details_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
