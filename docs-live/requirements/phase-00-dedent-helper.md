# ✅ Dedent Helper

**Purpose:** Detailed requirements for the Dedent Helper feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Generation |

## Description

The dedent helper function normalizes indentation in code blocks extracted
from DocStrings. It handles various whitespace patterns including tabs,
mixed indentation, and edge cases.

**Problem:**

- DocStrings in Gherkin files have consistent indentation for alignment
- Tab characters vs spaces create inconsistent indentation calculation
- Edge cases like empty lines, all-empty input, single lines need handling

**Solution:**

- Normalize tabs to spaces before calculating minimum indentation
- Handle edge cases gracefully without throwing errors
- Preserve relative indentation after removing common prefix

## Acceptance Criteria

**Tab-indented code is properly dedented**

- Given input text with tab indentation:
- When dedenting the text
- Then the output is:

```markdown
    	const x = 1;
    	const y = 2;
```

```markdown
const x = 1;
const y = 2;
```

**Mixed tabs and spaces are normalized**

- Given input text with mixed indentation:
- When dedenting the text
- Then the output has no leading whitespace on first non-empty line

```markdown
      const x = 1;
      const y = 2;
```

**Empty lines with trailing spaces are preserved**

- Given input text:
- When dedenting the text
- Then empty lines remain in output
- And the output preserves relative indentation

```markdown
    function foo() {

      return 42;
    }
```

**All empty lines returns original text**

- Given input with only empty lines
- When dedenting the text
- Then the output equals the input

**Single line with indentation is dedented**

- Given input text " const x = 1;"
- When dedenting the text
- Then the output is "const x = 1;"

**Single line without indentation is unchanged**

- Given input text "const x = 1;"
- When dedenting the text
- Then the output is "const x = 1;"

**Non-breaking space is treated as content**

- Given input text with non-breaking spaces in content
- When dedenting the text
- Then the output preserves non-breaking spaces in content

**Nested code blocks preserve relative indentation**

- Given input text:
- When dedenting the text
- Then the output is:

```markdown
    function foo() {
      if (true) {
        return 42;
      }
    }
```

```markdown
function foo() {
if (true) {
return 42;
}
}
```

**Mixed indentation levels are preserved relatively**

- Given input text:
- When dedenting the text
- Then the output is:

```markdown
    level0
      level1
        level2
      level1
    level0
```

```markdown
level0
level1
level2
level1
level0
```

## Business Rules

**Tabs are normalized to spaces before dedent**

**Invariant:** Tab characters must be converted to spaces before calculating the minimum indentation level.
**Rationale:** Mixing tabs and spaces produces incorrect indentation calculations — normalizing first ensures consistent dedent depth.
**Verified by:** Tab-indented code is properly dedented, Mixed tabs and spaces are normalized

_Verified by: Tab-indented code is properly dedented, Mixed tabs and spaces are normalized_

**Empty lines are handled correctly**

**Invariant:** Empty lines (including lines with only whitespace) must not affect the minimum indentation calculation and must be preserved in output.
**Verified by:** Empty lines with trailing spaces are preserved, All empty lines returns original text

_Verified by: Empty lines with trailing spaces are preserved, All empty lines returns original text_

**Single line input is handled**

**Invariant:** Single-line input must have its leading whitespace removed without errors or unexpected transformations.
**Verified by:** Single line with indentation is dedented, Single line without indentation is unchanged

_Verified by: Single line with indentation is dedented, Single line without indentation is unchanged_

**Unicode whitespace is handled**

**Invariant:** Non-breaking spaces and other Unicode whitespace characters must be treated as content, not as indentation to be removed.
**Verified by:** Non-breaking space is treated as content

_Verified by: Non-breaking space is treated as content_

**Relative indentation is preserved**

**Invariant:** After removing the common leading whitespace, the relative indentation between lines must remain unchanged.
**Verified by:** Nested code blocks preserve relative indentation, Mixed indentation levels are preserved relatively

_Verified by: Nested code blocks preserve relative indentation, Mixed indentation levels are preserved relatively_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
