# ✅ Reference Codec Detail Rendering

**Purpose:** Detailed requirements for the Reference Codec Detail Rendering feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Generation |

## Description

Standard detail level behavior, deep behavior rendering with structured
annotations, shape JSDoc prose, param/returns/throws documentation,
collapsible blocks, link-out blocks, and include tags.

## Acceptance Criteria

**Standard level includes narrative but omits rationale**

- Given a reference config with convention tags "fsm-rules" and behavior tags ""
- And a MasterDataset with a convention pattern with narrative and rationale
- When decoding at detail level "standard"
- Then the document contains narrative text
- And the document does not contain text "Rationale"

**Detailed level renders structured behavior rules**

- Given a reference config with convention tags "" and behavior tags "process-guard"
- And a MasterDataset with a behavior pattern with structured rules
- When decoding at detail level "detailed"
- Then the document has a heading "Invariant Rule"
- And the document contains text "Must follow FSM transitions"
- And the rendered output includes rationale "Prevents state corruption"
- And the document contains a verified-by list with "Scenario A" and "Scenario B"

**Standard level renders behavior rules without rationale**

- Given a reference config with convention tags "" and behavior tags "process-guard"
- And a MasterDataset with a behavior pattern with structured rules
- When decoding at detail level "standard"
- Then the document has a heading "Invariant Rule"
- And the document contains text "Must follow FSM transitions"
- And the document does not contain text "Prevents state corruption"

**Summary level shows behavior rules as truncated table**

- Given a reference config with convention tags "" and behavior tags "process-guard"
- And a MasterDataset with a behavior pattern with structured rules
- When decoding at detail level "summary"
- Then the document has at least 1 table
- And the document does not have a heading "Invariant Rule"

**Scenario names and verifiedBy merge as deduplicated list**

- Given a reference config with convention tags "" and behavior tags "process-guard"
- And a MasterDataset with a behavior pattern with overlapping scenarioNames and verifiedBy
- When decoding at detail level "detailed"
- Then the document contains a verified-by list with 3 unique entries

**Standard level includes JSDoc in code blocks**

- Given a reference config with shapeSources "src/lint/\*.ts"
- And a MasterDataset with a shape pattern with JSDoc
- When decoding at detail level "standard"
- Then the document contains text "Input to the process guard decider function"

**Detailed level includes JSDoc in code block and property table**

- Given a reference config with shapeSources "src/lint/\*.ts"
- And a MasterDataset with a shape pattern with JSDoc and property docs
- When decoding at detail level "detailed"
- Then the document contains text "Input to the process guard decider function"
- And the document has at least 1 table

**Shapes without JSDoc render code blocks only**

- Given a reference config with shapeSources "src/lint/\*.ts"
- And a MasterDataset with a shape pattern without JSDoc
- When decoding at detail level "standard"
- Then the document does not contain text "Input to the process guard"
- And the document contains a code block with "typescript"

**Detailed level renders param table for function shapes**

- Given a reference config with shapeSources "src/lint/\*.ts"
- And a MasterDataset with a function shape with param docs
- When decoding at detail level "detailed"
- Then the document has a table with columns "Parameter" and "Type" and "Description"
- And the table contains param "orderId" with description "The unique order identifier"

**Detailed level renders returns and throws documentation**

- Given a reference config with shapeSources "src/lint/\*.ts"
- And a MasterDataset with a function shape with returns and throws docs
- When decoding at detail level "detailed"
- Then the rendered output contains returns paragraph with type and description
- And the document has a table with columns "Exception" and "Description"

**Standard level renders param table without throws**

- Given a reference config with shapeSources "src/lint/\*.ts"
- And a MasterDataset with a function shape with param and throws docs
- When decoding at detail level "standard"
- Then the document has a table with columns "Parameter" and "Type" and "Description"
- And the document does not have a table with column "Exception"

**Shapes without param docs skip param table**

- Given a reference config with shapeSources "src/lint/\*.ts"
- And a MasterDataset with a shape pattern with JSDoc
- When decoding at detail level "detailed"
- Then the document does not have a table with column "Parameter"

**Behavior pattern with many rules uses collapsible blocks at detailed level**

- Given a reference config with convention tags "" and behavior tags "process-guard"
- And a MasterDataset with a behavior pattern with 3 structured rules
- When decoding at detail level "detailed"
- Then the document contains at least 1 collapsible block
- And each collapsible block summary includes a rule name

**Behavior pattern with few rules does not use collapsible blocks**

- Given a reference config with convention tags "" and behavior tags "process-guard"
- And a MasterDataset with a behavior pattern with 2 structured rules
- When decoding at detail level "detailed"
- Then the document does not contain collapsible blocks

**Summary level never produces collapsible blocks**

- Given a reference config with convention tags "" and behavior tags "process-guard"
- And a MasterDataset with a behavior pattern with 3 structured rules
- When decoding at detail level "summary"
- Then the document does not contain collapsible blocks

**Behavior pattern includes source file link-out at detailed level**

- Given a reference config with convention tags "" and behavior tags "process-guard"
- And a MasterDataset with a behavior pattern in category "process-guard"
- When decoding at detail level "detailed"
- Then the document contains at least 1 link-out block
- And the link-out path references a source file

**Standard level includes source file link-out**

- Given a reference config with convention tags "" and behavior tags "process-guard"
- And a MasterDataset with a behavior pattern in category "process-guard"
- When decoding at detail level "standard"
- Then the document contains at least 1 link-out block

**Summary level omits link-out blocks**

- Given a reference config with convention tags "" and behavior tags "process-guard"
- And a MasterDataset with a behavior pattern in category "process-guard"
- When decoding at detail level "summary"
- Then the document does not contain link-out blocks

**Include-tagged pattern appears in behavior section**

- Given a reference config with includeTags "reference-sample"
- And a MasterDataset with a pattern that has include "reference-sample"
- When decoding at detail level "standard"
- Then the document has a heading "Behavior Specifications"
- And the document contains text "IncludedPattern"

**Include-tagged pattern is additive with category-selected patterns**

- Given a reference config with behavior tags "lint" and includeTags "reference-sample"
- And a MasterDataset with a category pattern and an include-tagged pattern
- When decoding at detail level "standard"
- Then the document contains text "LintPattern"
- And the document contains text "IncludedPattern"

**Pattern without matching include tag is excluded**

- Given a reference config with includeTags "reference-sample"
- And a MasterDataset with a pattern that has include "other-doc"
- When decoding at detail level "standard"
- Then the document does not have a heading "Behavior Specifications"

## Business Rules

**Standard detail level includes narrative but omits rationale**

_Verified by: Standard level includes narrative but omits rationale_

**Deep behavior rendering with structured annotations**

_Verified by: Detailed level renders structured behavior rules, Standard level renders behavior rules without rationale, Summary level shows behavior rules as truncated table, Scenario names and verifiedBy merge as deduplicated list_

**Shape JSDoc prose renders at standard and detailed levels**

_Verified by: Standard level includes JSDoc in code blocks, Detailed level includes JSDoc in code block and property table, Shapes without JSDoc render code blocks only_

**Shape sections render param returns and throws documentation**

_Verified by: Detailed level renders param table for function shapes, Detailed level renders returns and throws documentation, Standard level renders param table without throws, Shapes without param docs skip param table_

**Collapsible blocks wrap behavior rules for progressive disclosure**

**Invariant:** When a behavior pattern has 3 or more rules and detail level
is not summary, each rule's content is wrapped in a collapsible block with the
rule name and scenario count in the summary. Patterns with fewer than 3 rules
render rules flat. Summary level never produces collapsible blocks.

    **Rationale:** Behavior sections with many rules produce substantial content at
    detailed level. Collapsible blocks enable progressive disclosure so readers can
    expand only the rules they need.

    **Verified by:** Many rules use collapsible at detailed level,
    Few rules render flat,
    Summary level suppresses collapsible

_Verified by: Behavior pattern with many rules uses collapsible blocks at detailed level, Behavior pattern with few rules does not use collapsible blocks, Summary level never produces collapsible blocks_

**Link-out blocks provide source file cross-references**

**Invariant:** At standard and detailed levels, each behavior pattern includes
a link-out block referencing its source file path. At summary level, link-out
blocks are omitted for compact output.

    **Rationale:** Cross-reference links enable readers to navigate from generated
    documentation to the annotated source files, closing the loop between generated
    docs and the single source of truth.

    **Verified by:** Detailed level includes source link-out,
    Standard level includes source link-out,
    Summary level omits link-out

_Verified by: Behavior pattern includes source file link-out at detailed level, Standard level includes source file link-out, Summary level omits link-out blocks_

**Include tags route cross-cutting content into reference documents**

**Invariant:** Patterns with matching include tags appear alongside
category-selected patterns in the behavior section. The merging
is additive (OR semantics).

    **Verified by:** Include-tagged pattern appears in behavior section,
    Include-tagged pattern is additive with category-selected patterns,
    Pattern without matching include tag is excluded

_Verified by: Include-tagged pattern appears in behavior section, Include-tagged pattern is additive with category-selected patterns, Pattern without matching include tag is excluded_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
