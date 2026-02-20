# ✅ Reference Codec Core Testing

**Purpose:** Detailed requirements for the Reference Codec Core Testing feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Generation |

## Description

Parameterized codec factory that creates reference document codecs
from configuration objects. Core behavior including empty datasets,
conventions, detail levels, shapes, composition, and mermaid blocks.

## Acceptance Criteria

**Codec with no matching content produces fallback message**

- Given a reference config with convention tags "nonexistent" and behavior tags "nonexistent"
- And an empty MasterDataset
- When decoding at detail level "standard"
- Then the document title matches the config title
- And the document contains a no-content fallback paragraph

**Convention rules appear as H2 headings with content**

- Given a reference config with convention tags "fsm-rules" and behavior tags ""
- And a MasterDataset with a convention-tagged pattern:
- When decoding at detail level "detailed"
- Then the document has a heading "FSM Transitions"
- And the document contains text "Only valid transitions apply"

| convention | ruleName        | invariant                    |
| ---------- | --------------- | ---------------------------- |
| fsm-rules  | FSM Transitions | Only valid transitions apply |

**Convention tables are rendered in the document**

- Given a reference config with convention tags "fsm-rules" and behavior tags ""
- And a MasterDataset with a convention pattern with a table
- When decoding at detail level "detailed"
- Then the document has at least 1 table

**Summary level omits narrative and rationale**

- Given a reference config with convention tags "fsm-rules" and behavior tags ""
- And a MasterDataset with a convention pattern with narrative and rationale
- When decoding at detail level "summary"
- Then the document does not contain text "Rationale"
- And the document does not contain narrative text

**Detailed level includes rationale and verified-by**

- Given a reference config with convention tags "fsm-rules" and behavior tags ""
- And a MasterDataset with a convention pattern with narrative and rationale
- When decoding at detail level "detailed"
- Then the document contains text "Rationale"

**Behavior-tagged patterns appear in a Behavior Specifications section**

- Given a reference config with convention tags "" and behavior tags "process-guard"
- And a MasterDataset with a behavior pattern in category "process-guard"
- When decoding at detail level "standard"
- Then the document has a heading "Behavior Specifications"

**Shapes appear when source file matches shapeSources glob**

- Given a reference config with shapeSources "src/lint/\*.ts"
- And a MasterDataset with a pattern at "src/lint/rules.ts" with extracted shapes
- When decoding at detail level "detailed"
- Then the document has a heading "API Types"
- And the document contains a code block with "typescript"

**Summary level shows shapes as a compact table**

- Given a reference config with shapeSources "src/lint/\*.ts"
- And a MasterDataset with a pattern at "src/lint/rules.ts" with extracted shapes
- When decoding at detail level "summary"
- Then the document has a heading "API Types"
- And the document has at least 1 table

**No shapes when source file does not match glob**

- Given a reference config with shapeSources "src/config/\*.ts"
- And a MasterDataset with a pattern at "src/lint/rules.ts" with extracted shapes
- When decoding at detail level "detailed"
- Then the document does not have a heading "API Types"

**Both convention and behavior sections appear when data exists**

- Given a reference config with convention tags "fsm-rules" and behavior tags "process-guard"
- And a MasterDataset with both convention and behavior data
- When decoding at detail level "detailed"
- Then the document has a heading "FSM Transitions"
- And the document has a heading "Behavior Specifications"

**Convention headings appear before shapes before behaviors**

- Given a reference config with all three content sources
- And a MasterDataset with convention, shape, and behavior data
- When decoding at detail level "detailed"
- Then the heading "FSM Transitions" appears before "API Types"
- And the heading "API Types" appears before "Behavior Specifications"

**Convention with mermaid content produces mermaid block in output**

- Given a reference config with convention tags "fsm-rules" and behavior tags ""
- And a MasterDataset with a convention pattern with a mermaid diagram
- When decoding at detail level "detailed"
- Then the document contains a mermaid block

**Summary level omits convention code examples**

- Given a reference config with convention tags "fsm-rules" and behavior tags ""
- And a MasterDataset with a convention pattern with a mermaid diagram
- When decoding at detail level "summary"
- Then the document does not contain a mermaid block

## Business Rules

**Empty datasets produce fallback content**

_Verified by: Codec with no matching content produces fallback message_

**Convention content is rendered as sections**

_Verified by: Convention rules appear as H2 headings with content, Convention tables are rendered in the document_

**Detail level controls output density**

_Verified by: Summary level omits narrative and rationale, Detailed level includes rationale and verified-by_

**Behavior sections are rendered from category-matching patterns**

_Verified by: Behavior-tagged patterns appear in a Behavior Specifications section_

**Shape sources are extracted from matching patterns**

_Verified by: Shapes appear when source file matches shapeSources glob, Summary level shows shapes as a compact table, No shapes when source file does not match glob_

**Convention and behavior content compose in a single document**

_Verified by: Both convention and behavior sections appear when data exists_

**Composition order follows AD-5: conventions then shapes then behaviors**

_Verified by: Convention headings appear before shapes before behaviors_

**Convention code examples render as mermaid blocks**

_Verified by: Convention with mermaid content produces mermaid block in output, Summary level omits convention code examples_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
