# ✅ Table Extraction

**Purpose:** Detailed requirements for the Table Extraction feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Generation |

## Description

Tables in business rule descriptions should appear exactly once in output.
The extractTables() function extracts tables for proper formatting, and
stripMarkdownTables() removes them from the raw text to prevent duplicates.

## Acceptance Criteria

**Single table renders once in detailed mode**

- Given a pattern with a rule named "Command categories" and description:
- When decoding with BusinessRulesCodec in detailed mode
- Then the document contains exactly 1 table with header "Category"
- And the document does not contain raw pipe characters in text paragraphs

```markdown
Categories must be valid.

| Category  | Purpose      |
| --------- | ------------ |
| aggregate | State change |
| process   | Workflow     |
```

**Table is extracted and properly formatted**

- Given a pattern with a rule containing a markdown table with columns "Input" and "Output"
- When decoding with BusinessRulesCodec in detailed mode
- Then the document contains a table block with headers "Input" and "Output"
- And the table rows are properly aligned

**Two tables in description render as two separate tables**

- Given a pattern with a rule named "Multiple table rule" and description:
- When decoding with BusinessRulesCodec in detailed mode
- Then the document contains exactly 2 tables
- And the first table has header "A"
- And the second table has header "X"

```markdown
First table:
| A | B |
| --- | --- |
| 1 | 2 |

Second table:
| X | Y |
| --- | --- |
| 3 | 4 |
```

**Strips single table from text**

- Given text containing a markdown table:
- When stripMarkdownTables is called
- Then the result is:

```markdown
Introduction text.

| Col1 | Col2 |
| ---- | ---- |
| A    | B    |

Conclusion text.
```

```markdown
Introduction text.

Conclusion text.
```

**Strips multiple tables from text**

- Given text containing two markdown tables
- When stripMarkdownTables is called
- Then the result contains no pipe characters at line starts

**Preserves text without tables**

- Given text without any markdown tables
- When stripMarkdownTables is called
- Then the result is unchanged

## Business Rules

**Tables in rule descriptions render exactly once**

_Verified by: Single table renders once in detailed mode, Table is extracted and properly formatted_

**Multiple tables in description each render exactly once**

_Verified by: Two tables in description render as two separate tables_

**stripMarkdownTables removes table syntax from text**

_Verified by: Strips single table from text, Strips multiple tables from text, Preserves text without tables_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
