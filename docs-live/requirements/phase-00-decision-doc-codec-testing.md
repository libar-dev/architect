# ✅ Decision Doc Codec Testing

**Purpose:** Detailed requirements for the Decision Doc Codec Testing feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Generation |

## Description

Validates the Decision Doc Codec that parses decision documents (ADR/PDR
in .feature format) and extracts content for documentation generation.

## Acceptance Criteria

**Partition rules into ADR sections**

- Given business rules:
- When partitioning rules for decision doc
- Then context should have 1 rule
- And decision should have 1 rule
- And consequences should have 1 rule
- And other should have 0 rules

| Name                       | Description             |
| -------------------------- | ----------------------- |
| Context - Why we need this | Background explanation  |
| Decision - How it works    | Implementation approach |
| Consequences - Trade-offs  | Benefits and costs      |

**Non-standard rules go to other category**

- Given business rules:
- When partitioning rules for decision doc
- Then other should have 2 rules
- And context should have 0 rules

| Name                     | Description            |
| ------------------------ | ---------------------- |
| Proof of Concept - Demo  | Example implementation |
| Expected Output - Format | Output specification   |

**Extract single DocString**

- Given text with single DocString
- When extracting DocStrings
- Then 1 DocString should be extracted
- And first DocString should have language "bash"

**Extract multiple DocStrings**

- Given text with multiple DocStrings
- When extracting DocStrings
- Then 2 DocStrings should be extracted

**DocString without language defaults to text**

- Given text with untagged DocString
- When extracting DocStrings
- Then first DocString should have language "text"

**Parse basic source mapping table**

- Given text with source mapping table
- When parsing source mapping table
- Then 2 source mappings should be found
- And first mapping section should be "Intro"

**No source mapping returns empty**

- Given text without tables
- When parsing source mapping table
- Then 0 source mappings should be found

**Detect THIS DECISION marker**

- Given sourceFile "THIS DECISION"
- When checking if self-reference
- Then it should be a self-reference

**Detect THIS DECISION with Rule**

- Given sourceFile "THIS DECISION (Rule: Context above)"
- When checking if self-reference
- Then it should be a self-reference

**Regular file path is not self-reference**

- Given sourceFile "src/types.ts"
- When checking if self-reference
- Then it should not be a self-reference

**Parse self-reference types**

- Given sourceFile "THIS DECISION"
- When parsing self-reference
- Then self-reference type should be "document"

**Parse self-reference with rule name**

- Given sourceFile "THIS DECISION (Rule: Context above)"
- When parsing self-reference
- Then self-reference type should be "rule"

**Normalize Decision rule description**

- Given extraction method "Decision rule description"
- When normalizing extraction method
- Then normalized method should be "DECISION_RULE_DESCRIPTION"

**Normalize extract-shapes**

- Given extraction method "@extract-shapes tag"
- When normalizing extraction method
- Then normalized method should be "EXTRACT_SHAPES"

**Normalize unknown method**

- Given extraction method "some custom method"
- When normalizing extraction method
- Then normalized method should be "unknown"

**Parse complete decision document**

- Given a complete decision document
- When parsing the decision document
- Then parsed content should have 1 context rule
- And parsed content should have 1 decision rule
- And parsed content should have DocStrings

**Find rule by exact name**

- Given business rules:
- When finding rule "Context - Problem"
- Then the found rule should have name "Context - Problem"

| Name                | Description              |
| ------------------- | ------------------------ |
| Context - Problem   | The problem description  |
| Decision - Solution | The solution description |

**Find rule by partial name**

- Given business rules:
- When finding rule "Context"
- Then the found rule should have name "Context - Why we need this feature"

| Name                                   | Description |
| -------------------------------------- | ----------- |
| Context - Why we need this feature     | Background  |
| Decision - The implementation approach | Solution    |

**Rule not found returns undefined**

- Given business rules:
- When finding rule "NonExistent"
- Then no rule should be found

| Name              | Description |
| ----------------- | ----------- |
| Context - Problem | Description |

## Business Rules

**Rule blocks are partitioned by semantic prefix**

**Invariant:** Decision document rules must be partitioned into ADR sections based on their semantic prefix (e.g., "Decision:", "Context:", "Consequence:"), with non-standard rules placed in an "other" category.
**Rationale:** Semantic partitioning produces structured ADR output that follows the standard ADR format — unpartitioned rules would generate a flat, unnavigable document.
**Verified by:** Partition rules into ADR sections, Non-standard rules go to other category

_Verified by: Partition rules into ADR sections, Non-standard rules go to other category_

**DocStrings are extracted with language tags**

**Invariant:** DocStrings within rule descriptions must be extracted preserving their language tag (e.g., typescript, bash), defaulting to "text" when no language is specified.
**Rationale:** Language tags enable syntax highlighting in generated markdown code blocks — losing the tag produces unformatted code that is harder to read.
**Verified by:** Extract single DocString, Extract multiple DocStrings, DocString without language defaults to text

_Verified by: Extract single DocString, Extract multiple DocStrings, DocString without language defaults to text_

**Source mapping tables are parsed from rule descriptions**

**Invariant:** Markdown tables in rule descriptions with source mapping columns must be parsed into structured data, returning empty arrays when no table is present.
**Rationale:** Source mapping tables drive the extraction pipeline — they define which files to read and what content to extract for each decision section.
**Verified by:** Parse basic source mapping table, No source mapping returns empty

_Verified by: Parse basic source mapping table, No source mapping returns empty_

**Self-reference markers are correctly detected**

**Invariant:** The "THIS DECISION" marker must be recognized as a self-reference to the current decision document, with optional rule name qualifiers parsed correctly.
**Rationale:** Self-references enable decisions to extract content from their own rules — misdetecting them would trigger file-system lookups for a non-existent "THIS DECISION" file.
**Verified by:** Detect THIS DECISION marker, Detect THIS DECISION with Rule, Regular file path is not self-reference, Parse self-reference types, Parse self-reference with rule name

_Verified by: Detect THIS DECISION marker, Detect THIS DECISION with Rule, Regular file path is not self-reference, Parse self-reference types, Parse self-reference with rule name_

**Extraction methods are normalized to known types**

**Invariant:** Extraction method strings from source mapping tables must be normalized to canonical method names for dispatcher routing.
**Rationale:** Users may write extraction methods in various formats (e.g., "Decision rule description", "extract-shapes") — normalization ensures consistent dispatch regardless of formatting.
**Verified by:** Normalize Decision rule description, Normalize extract-shapes, Normalize unknown method

_Verified by: Normalize Decision rule description, Normalize extract-shapes, Normalize unknown method_

**Complete decision documents are parsed with all content**

**Invariant:** A complete decision document must be parseable into its constituent parts including rules, DocStrings, source mappings, and self-references in a single parse operation.
**Rationale:** Complete parsing validates that all codec features compose correctly — partial parsing could miss interactions between features.
**Verified by:** Parse complete decision document

_Verified by: Parse complete decision document_

**Rules can be found by name with partial matching**

**Invariant:** Rules must be findable by exact name match or partial (substring) name match, returning undefined when no match exists.
**Rationale:** Partial matching supports flexible cross-references between decisions — requiring exact matches would make references brittle to minor naming changes.
**Verified by:** Find rule by exact name, Find rule by partial name, Rule not found returns undefined

_Verified by: Find rule by exact name, Find rule by partial name, Rule not found returns undefined_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
