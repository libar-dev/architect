# RichContentHelpersTesting - Remaining Work

**Purpose:** Detailed remaining work for RichContentHelpersTesting

---

## Summary

**Progress:** [░░░░░░░░░░░░░░░░░░░░] 0/2 (0%)

**Remaining:** 2 patterns (0 active, 2 planned)

---

## ✅ Ready to Start

These patterns can be started immediately:

| Pattern | Effort | Business Value |
| --- | --- | --- |
| 📋 Kebab Case Slugs | - | - |
| 📋 Rich Content Helpers Testing | - | - |

---

## All Remaining Patterns

### 📋 Kebab Case Slugs

| Property | Value |
| --- | --- |
| Status | planned |
| Dependencies | StringUtils |

As a documentation generator
  I need to generate readable, URL-safe slugs from pattern names
  So that generated file names are discoverable and human-friendly

  The slug generation must handle:
  - CamelCase patterns like "DeciderPattern" → "decider-pattern"
  - Consecutive uppercase like "APIEndpoint" → "api-endpoint"
  - Numbers in names like "OAuth2Flow" → "o-auth-2-flow"
  - Special characters removal
  - Proper phase prefixing for requirements

#### Acceptance Criteria

**Convert pattern names to readable slugs**

- Given pattern name "<input>"
- When converting to kebab-case slug
- Then the slug is "<expected>"

**Handle edge cases in slug generation**

- Given pattern name "<input>"
- When converting to kebab-case slug
- Then the slug is "<expected>"

**Requirement slugs include phase number**

- Given pattern "<pattern>" with phase "<phase>"
- When generating requirement slug
- Then the slug is "<expected>"

**Requirement without phase uses phase 00**

- Given pattern "SomeUnassigned" without a phase
- When generating requirement slug
- Then the slug is "phase-00-some-unassigned"

**Phase slugs combine number and kebab-case name**

- Given phase number "<number>" with name "<name>"
- When generating phase slug
- Then the slug is "<expected>"

**Phase without name uses "unnamed"**

- Given phase number "5" without a name
- When generating phase slug
- Then the slug is "phase-05-unnamed"

#### Business Rules

**CamelCase names convert to kebab-case**

**Invariant:** CamelCase pattern names must be split at word boundaries and joined with hyphens in lowercase.
    **Verified by:** Convert pattern names to readable slugs

_Verified by: Convert pattern names to readable slugs_

**Edge cases are handled correctly**

**Invariant:** Slug generation must handle special characters, consecutive separators, and leading/trailing hyphens without producing invalid slugs.
    **Verified by:** Handle edge cases in slug generation

_Verified by: Handle edge cases in slug generation_

**Requirements include phase prefix**

**Invariant:** Requirement slugs must be prefixed with "phase-NN-" where NN is the zero-padded phase number, defaulting to "00" when no phase is assigned.
    **Verified by:** Requirement slugs include phase number, Requirement without phase uses phase 00

_Verified by: Requirement slugs include phase number, Requirement without phase uses phase 00_

**Phase slugs use kebab-case for names**

**Invariant:** Phase slugs must combine a zero-padded phase number with the kebab-case name in the format "phase-NN-name", defaulting to "unnamed" when no name is provided.
    **Verified by:** Phase slugs combine number and kebab-case name, Phase without name uses "unnamed"

_Verified by: Phase slugs combine number and kebab-case name, Phase without name uses "unnamed"_

### 📋 Rich Content Helpers Testing

| Property | Value |
| --- | --- |
| Status | planned |

As a document codec author
  I need helpers to render Gherkin rich content
  So that DataTables, DocStrings, and scenarios render consistently across codecs

  The helpers handle edge cases like:
  - Unclosed DocStrings (fallback to plain paragraph)
  - Windows CRLF line endings (normalized to LF)
  - Empty inputs (graceful handling)
  - Missing table cells (empty string fallback)

#### Acceptance Criteria

**Empty description returns empty array**

- Given a description ""
- When parsing for DocStrings
- Then the result is an empty array

**Description with no DocStrings returns single paragraph**

- Given a description "This is plain text without any code blocks."
- When parsing for DocStrings
- Then the result contains 1 block
- And block 1 is a paragraph with text "This is plain text without any code blocks."

**Single DocString parses correctly**

- Given a description with embedded DocString containing typescript code
- When parsing for DocStrings
- Then the result contains 3 blocks with types:

| index | type | language |
| --- | --- | --- |
| 1 | paragraph |  |
| 2 | code | typescript |
| 3 | paragraph |  |

**DocString without language hint uses text**

- Given a description with embedded DocString without language hint
- When parsing for DocStrings
- Then block 2 is a code block with language "text"

**Unclosed DocString returns plain paragraph fallback**

- Given a description with unclosed DocString
- When parsing for DocStrings
- Then the result contains 1 block
- And block 1 is a paragraph

**Windows CRLF line endings are normalized**

- Given a description with CRLF line endings
- When parsing for DocStrings
- Then line endings are normalized to LF

**Single row DataTable renders correctly**

- Given a DataTable with headers "Name" and "Value"
- And a row with values "foo" and "bar"
- When rendering the DataTable
- Then the output is a table block with 1 row

**Multi-row DataTable renders correctly**

- Given a DataTable with headers "A" and "B" and "C"
- And rows:
- When rendering the DataTable
- Then the output is a table block with 2 rows

| A | B | C |
| --- | --- | --- |
| 1 | 2 | 3 |
| 4 | 5 | 6 |

**Missing cell values become empty strings**

- Given a DataTable with headers "Col1" and "Col2"
- And a row with only "Col1" value "only-first"
- When rendering the DataTable
- Then the row has empty string for "Col2"

**Render scenario with steps**

- Given a scenario "Test Scenario" with steps:
- When rendering scenario content with default options
- Then the output contains a list block with 3 items

| keyword | text |
| --- | --- |
| Given | initial state |
| When | action taken |
| Then | expected result |

**Skip steps when includeSteps is false**

- Given a scenario "Test Scenario" with steps:
- When rendering scenario content with includeSteps false
- Then the output does not contain a list block

| keyword | text |
| --- | --- |
| Given | some step |

**Render scenario with DataTable in step**

- Given a scenario "Table Test" with a step containing a DataTable
- When rendering scenario content with default options
- Then the output contains a table block

**Rule with simple description**

- Given a business rule "Must validate input" with description "Ensures all input is validated."
- When rendering the business rule
- Then the output contains a bold paragraph with the rule name
- And the output contains the description as a paragraph

**Rule with no description**

- Given a business rule "Simple Rule" with no description
- When rendering the business rule
- Then the output contains a bold paragraph with the rule name
- And no description paragraph is rendered

**Rule with embedded DocString in description**

- Given a business rule "Code Example" with description containing a DocString
- When rendering the business rule
- Then the description is parsed for DocStrings
- And code blocks are rendered from embedded DocStrings

**Code block preserves internal relative indentation**

- Given a description with DocString containing nested code
- When parsing for DocStrings
- Then the code block has correct nested indentation

**Empty lines in code block are preserved**

- Given a description with DocString containing empty lines:
- When parsing for DocStrings
- Then the code block contains 3 lines
- And line 2 of the code block is empty

```markdown
line1

line2
```

**Trailing whitespace is trimmed from each line**

- Given a description with DocString where lines have trailing spaces
- When parsing for DocStrings
- Then no line in the code block ends with whitespace

**Code with mixed indentation is preserved**

- Given a description with DocString containing mixed indent code
- When parsing for DocStrings
- Then the code block preserves the indentation structure

#### Business Rules

**DocString parsing handles edge cases**

**Invariant:** DocString parsing must gracefully handle empty input, missing language hints, unclosed delimiters, and non-LF line endings without throwing errors.
    **Verified by:** Empty description returns empty array, Description with no DocStrings returns single paragraph, Single DocString parses correctly, DocString without language hint uses text, Unclosed DocString returns plain paragraph fallback, Windows CRLF line endings are normalized

_Verified by: Empty description returns empty array, Description with no DocStrings returns single paragraph, Single DocString parses correctly, DocString without language hint uses text, Unclosed DocString returns plain paragraph fallback, Windows CRLF line endings are normalized_

**DataTable rendering produces valid markdown**

**Invariant:** DataTable rendering must produce a well-formed table block for any number of rows, substituting empty strings for missing cell values.
    **Verified by:** Single row DataTable renders correctly, Multi-row DataTable renders correctly, Missing cell values become empty strings

_Verified by: Single row DataTable renders correctly, Multi-row DataTable renders correctly, Missing cell values become empty strings_

**Scenario content rendering respects options**

**Invariant:** Scenario rendering must honor the includeSteps option, producing step lists only when enabled, and must include embedded DataTables when present.
    **Verified by:** Render scenario with steps, Skip steps when includeSteps is false, Render scenario with DataTable in step

_Verified by: Render scenario with steps, Skip steps when includeSteps is false, Render scenario with DataTable in step_

**Business rule rendering handles descriptions**

**Invariant:** Business rule rendering must always include the rule name as a bold paragraph, and must parse descriptions for embedded DocStrings when present.
    **Verified by:** Rule with simple description, Rule with no description, Rule with embedded DocString in description

_Verified by: Rule with simple description, Rule with no description, Rule with embedded DocString in description_

**DocString content is dedented when parsed**

**Invariant:** DocString code blocks must be dedented to remove common leading whitespace while preserving internal relative indentation, empty lines, and trimming trailing whitespace from each line.
    **Verified by:** Code block preserves internal relative indentation, Empty lines in code block are preserved, Trailing whitespace is trimmed from each line, Code with mixed indentation is preserved

_Verified by: Code block preserves internal relative indentation, Empty lines in code block are preserved, Trailing whitespace is trimmed from each line, Code with mixed indentation is preserved_

---

[← Back to Remaining Work](../REMAINING-WORK.md)
