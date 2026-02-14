# ✅ Patterns Codec Testing

**Purpose:** Detailed requirements for the Patterns Codec Testing feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
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

| heading |
| --- |
| Progress |
| Categories |
| All Patterns |

**Progress summary shows correct counts**

- Given a MasterDataset with status distribution:
- When decoding with PatternsDocumentCodec
- Then the progress section shows:
- And the progress shows "30% complete"

| status | count |
| --- | --- |
| completed | 3 |
| active | 2 |
| planned | 5 |

| status | count |
| --- | --- |
| Completed | 3 |
| Active | 2 |
| Planned | 5 |
| Total | 10 |

**Pattern table includes all patterns**

- Given a MasterDataset with 4 patterns
- When decoding with PatternsDocumentCodec
- Then the pattern table has 4 rows
- And the pattern table has columns:

| column |
| --- |
| Pattern |
| Category |
| Status |
| Description |

**Pattern table is sorted by status then name**

- Given a MasterDataset with patterns:
- When decoding with PatternsDocumentCodec
- Then the pattern table rows are in order:

| name | status |
| --- | --- |
| Zebra | completed |
| Alpha | roadmap |
| Beta | active |
| Gamma | completed |

| name |
| --- |
| Gamma |
| Zebra |
| Beta |
| Alpha |

**Category sections with pattern lists**

- Given a MasterDataset with patterns in categories:
- When decoding with PatternsDocumentCodec
- Then the document has category sections:

| category | count |
| --- | --- |
| core | 3 |
| ddd | 2 |

| category | patternCount |
| --- | --- |
| core | 3 |
| ddd | 2 |

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

**Filter to specific categories**

- Given a MasterDataset with patterns in categories:
- When decoding with filterCategories "core" and "ddd"
- Then the document has 5 patterns in the table
- And the category sections include only:

| category | count |
| --- | --- |
| core | 3 |
| ddd | 2 |
| saga | 1 |

| category |
| --- |
| core |
| ddd |

**Generate individual pattern files when enabled**

- Given a MasterDataset with named patterns:
- When decoding with generateDetailFiles enabled
- Then the document has individual pattern files:
- And category links are anchor links
- And pattern links point to individual files

| name | category |
| --- | --- |
| Core Pattern | core |
| Another Core | core |
| DDD Pattern | ddd |

| path |
| --- |
| patterns/core-pattern.md |
| patterns/another-core.md |
| patterns/ddd-pattern.md |

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

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
