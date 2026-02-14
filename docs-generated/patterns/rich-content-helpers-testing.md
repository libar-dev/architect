# 📋 Rich Content Helpers Testing

**Purpose:** Detailed documentation for the Rich Content Helpers Testing pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | DDD |
| Phase | 44 |

## Description

As a document codec author
  I need helpers to render Gherkin rich content
  So that DataTables, DocStrings, and scenarios render consistently across codecs

  The helpers handle edge cases like:
  - Unclosed DocStrings (fallback to plain paragraph)
  - Windows CRLF line endings (normalized to LF)
  - Empty inputs (graceful handling)
  - Missing table cells (empty string fallback)

## Acceptance Criteria

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

## Business Rules

**DocString parsing handles edge cases**

_Verified by: Empty description returns empty array, Description with no DocStrings returns single paragraph, Single DocString parses correctly, DocString without language hint uses text, Unclosed DocString returns plain paragraph fallback, Windows CRLF line endings are normalized_

**DataTable rendering produces valid markdown**

_Verified by: Single row DataTable renders correctly, Multi-row DataTable renders correctly, Missing cell values become empty strings_

**Scenario content rendering respects options**

_Verified by: Render scenario with steps, Skip steps when includeSteps is false, Render scenario with DataTable in step_

**Business rule rendering handles descriptions**

_Verified by: Rule with simple description, Rule with no description, Rule with embedded DocString in description_

**DocString content is dedented when parsed**

_Verified by: Code block preserves internal relative indentation, Empty lines in code block are preserved, Trailing whitespace is trimmed from each line, Code with mixed indentation is preserved_

---

[← Back to Pattern Registry](../PATTERNS.md)
