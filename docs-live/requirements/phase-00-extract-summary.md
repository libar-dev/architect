# ✅ Extract Summary

**Purpose:** Detailed requirements for the Extract Summary feature

---

## Overview

| Property     | Value      |
| ------------ | ---------- |
| Status       | completed  |
| Product Area | Generation |

## Description

The extractSummary function transforms multi-line pattern descriptions into
concise, single-line summaries suitable for table display in generated docs.

**Key behaviors:**

- Combines multiple lines until finding a complete sentence
- Truncates at sentence boundaries when possible
- Adds "..." for incomplete text (no sentence ending)
- Skips tautological first lines (just the pattern name)
- Skips section header labels like "Problem:", "Solution:"

## Acceptance Criteria

**Complete sentence on single line**

- When I extract summary from:
- Then the summary should be "This is a complete sentence."

```markdown
This is a complete sentence.
```

**Single line without sentence ending gets ellipsis**

- When I extract summary from:
- Then the summary should be "This text has no period at the end..."

```markdown
This text has no period at the end
```

**Two lines combine into complete sentence**

- When I extract summary from:
- Then the summary should be "Problem: Events are stored in the Event Store but there's no infrastructure for routing them to subscribers."

```markdown
Problem: Events are stored in the Event Store but there's no
infrastructure for routing them to subscribers.
```

**Combines lines up to sentence boundary within limit**

- When I extract summary from:
- Then the summary should be "Events are stored in the Event Store."

```markdown
Events are stored in the Event Store.
Additional context follows here.

How It Works:

- Parse annotations in Rule descriptions
```

**Long multi-line text truncates when exceeds limit**

- When I extract summary from:
- Then the summary should end with "..."
- And the summary should be at most 120 characters

```markdown
Business Value: Provide audit-ready traceability matrices that demonstrate
test coverage for business rules without manual documentation.
```

**Multi-line without sentence ending gets ellipsis**

- When I extract summary from:
- Then the summary should be "The delivery process uses dual sources (TypeScript phase files and Gherkin feature files) that must remain consistent..."

```markdown
The delivery process uses dual sources (TypeScript phase files and Gherkin
feature files) that must remain consistent
```

**Long text truncates at sentence boundary within limit**

- When I extract summary from:
- Then the summary should be "Short first sentence."

```markdown
Short first sentence. This is a much longer second sentence that would push us over the 120 character limit if we included it in the summary output.
```

**Long text without sentence boundary truncates at word with ellipsis**

- When I extract summary from:
- Then the summary should end with "..."
- And the summary should be at most 120 characters

```markdown
This is a very long description without any sentence ending punctuation that continues on and on and on until it exceeds the maximum allowed length for summaries
```

**Skips pattern name as first line**

- When I extract summary from "EventBusRouting":
- Then the summary should be "Events are stored but there's no routing infrastructure."

```markdown
EventBusRouting
Events are stored but there's no routing infrastructure.
```

**Skips section header labels**

- When I extract summary from:
- Then the summary should be "Events are stored but there's no routing infrastructure."

```markdown
Problem:
Events are stored but there's no routing infrastructure.
```

**Skips multiple header patterns**

- When I extract summary from:
- Then the summary should be "Use a pub/sub pattern with event routing."

```markdown
Solution:
Use a pub/sub pattern with event routing.
```

**Empty description returns empty string**

- When I extract summary from:
- Then the summary should be ""

```markdown

```

**Markdown headers are stripped**

- When I extract summary from:
- Then the summary should be "This is the actual content."

```markdown
# Pattern Title

This is the actual content.
```

**Bold markdown is stripped**

- When I extract summary from:
- Then the summary should be "Problem: This is bold text that explains the issue."

```markdown
**Problem:** This is bold text that explains the issue.
```

**Multiple sentence endings - takes first complete sentence**

- When I extract summary from:
- Then the summary should be "First sentence here!"

```markdown
First sentence here! Second sentence follows. Third one too.
```

**Question mark as sentence ending**

- When I extract summary from:
- Then the summary should be "Why does this matter?"

```markdown
Why does this matter? Because it affects everything.
```

## Business Rules

**Single-line descriptions are returned as-is when complete**

_Verified by: Complete sentence on single line, Single line without sentence ending gets ellipsis_

**Multi-line descriptions are combined until sentence ending**

_Verified by: Two lines combine into complete sentence, Combines lines up to sentence boundary within limit, Long multi-line text truncates when exceeds limit, Multi-line without sentence ending gets ellipsis_

**Long descriptions are truncated at sentence or word boundaries**

_Verified by: Long text truncates at sentence boundary within limit, Long text without sentence boundary truncates at word with ellipsis_

**Tautological and header lines are skipped**

_Verified by: Skips pattern name as first line, Skips section header labels, Skips multiple header patterns_

**Edge cases are handled gracefully**

_Verified by: Empty description returns empty string, Markdown headers are stripped, Bold markdown is stripped, Multiple sentence endings - takes first complete sentence, Question mark as sentence ending_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
