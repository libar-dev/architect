# GherkinPatternsReference

**Purpose:** Compact reference for Claude context
**Detail Level:** summary

---

## Overview

### Roadmap Spec Structure

**Context:** Roadmap specs define planned work with Problem/Solution descriptions
    and a Background deliverables table. They use the FSM status roadmap.

    **Key Elements:**

| Element | Purpose | Example |
| --- | --- | --- |
| at-libar-docs-pattern:Name | Unique identifier (required) | at-libar-docs-pattern:ProcessGuard |
| at-libar-docs-status:roadmap | FSM state | at-libar-docs-status:roadmap |
| at-libar-docs-phase:N | Phase number for timeline | at-libar-docs-phase:99 |
| Problem/Solution headers | Extracted by generators | **Problem:** / **Solution:** |
| Background deliverables | Tracks implementation progress | DataTable with Status column |

    **Structure Overview:**

    1. Tags at top: pattern name, status (roadmap), phase number
    2. Feature line with descriptive name
    3. **Problem:** section listing pain points as bullet list
    4. **Solution:** section listing approach as numbered list
    5. Background with deliverables DataTable (Deliverable, Status, Location columns)

    **Example Reference:** See specs/process-guard-linter.feature for a complete example.

### Rule Blocks for Constraints

**Context:** Use the Rule keyword to group related scenarios under a business constraint.
    Rules provide semantic grouping - generators extract them for business rules documentation.

    **Structure Overview:**

    1. Rule: line with business constraint name
    2. Optional structured annotations (Invariant, Rationale, Verified by)
    3. Related scenarios grouped under the Rule

    **Structured Rule Annotations:**

| Element | Purpose | Extracted By |
| --- | --- | --- |
| **Invariant:** | Business constraint (what must be true) | Business Rules generator |
| **Rationale:** | Business justification (why it exists) | Business Rules generator |
| **Verified by:** | Comma-separated scenario names | Traceability generator |

    **Usage Notes:**

    - Group scenarios that verify the same business constraint
    - Use Scenario Outline with Examples table for variations
    - Tag scenarios within Rules (at-happy-path, at-edge-case, etc.)
    - Rule blocks are optional - use when defining business invariants

### Scenario Outline Variations

**Context:** Use Scenario Outline with Examples table when the same pattern applies
    with different inputs. This avoids duplicating nearly-identical scenarios.

    **Structure Overview:**

    1. Scenario Outline: line with descriptive name
    2. Steps using angle-bracket placeholders: <column_name>
    3. Examples: keyword followed by DataTable
    4. Each row in Examples table runs the scenario once

    **Best Practice:**

| Condition | Recommendation |
| --- | --- |
| 3+ variations of same pattern | Use Scenario Outline |
| 1-2 variations | Separate Scenarios may be clearer |
| Different behaviors | Use separate Scenarios |
| Same behavior, different data | Use Scenario Outline |

    **Example Reference:** See tests/features/validation/fsm-transitions.feature

### DataTable Usage

**Context:** DataTables and DocStrings serve different purposes. Choose
    the right one based on your data structure.

    **Decision Table:**

| Data Type | Use | Format |
| --- | --- | --- |
| Reference data (all scenarios) | Background DataTable | Pipe-delimited rows with header |
| Test inputs (single scenario) | Scenario DataTable | Pipe-delimited rows with header |
| Code examples | DocString | Triple quotes with lang hint |
| Content with pipes | DocString | Avoids parsing issues |
| Multi-line text | DocString | Preserves formatting |

    **Background DataTable:**

    Use for data that applies to all scenarios - deliverables, definitions, configuration.
    First row is headers, subsequent rows are data.

    **Scenario DataTable:**

    Use for scenario-specific test inputs with tabular structure.
    Access in step definitions as array of objects keyed by header names.

    **DocString:**

    Use triple quotes (three double-quote characters) for multi-line content.
    Add language hint after opening quotes: typescript, bash, json, etc.
    Essential when content contains pipe characters that would break DataTables.

### Tag Conventions

**Context:** Tags organize scenarios for filtering and categorization.
    Use consistent tags across the codebase.

    **Scenario Tags:**

| Tag | Purpose | When to Use |
| --- | --- | --- |
| at-happy-path | Primary success scenario | Default behavior works |
| at-edge-case | Boundary conditions | Unusual inputs, limits |
| at-error-handling | Error recovery | Graceful degradation |
| at-validation | Input validation | Constraint checks |
| at-integration | Cross-component behavior | System boundaries |
| at-poc | Proof of concept | Experimental features |
| at-acceptance-criteria | Required for DoD | Must-pass scenarios |

    **Feature-Level Tags:**

| Tag | Purpose | Example |
| --- | --- | --- |
| at-behavior | Marks test feature file | Test feature identification |
| at-libar-docs | Opt-in for processing | Required for all processed features |
| at-libar-docs-pattern:Name | Unique pattern identifier | Pattern registry key |
| at-libar-docs-status:state | FSM state | roadmap, active, completed, deferred |
| at-libar-docs-phase:N | Timeline phase | Phase number for roadmap |

    **Combining Tags:**

    Multiple tags on same line are space-separated.
    Feature-level tags apply to all scenarios in the feature.

### Feature Description Patterns

**Context:** Feature descriptions appear in generated documentation.
    Choose headers that fit your pattern type.

    **Decision:** Three description structures are supported:

| Structure | Headers | Best For |
| --- | --- | --- |
| Problem/Solution | **Problem:** and **Solution:** | Pain point to fix |
| Value-First | **Business Value:** and **How It Works:** | TDD-style, Gherkin spirit |
| Context/Approach | **Context:** and **Approach:** | Technical patterns |

    **Notes:**

    - The **Problem/Solution** pattern is the dominant style in this codebase
    - Problem section: use bullet list for pain points
    - Solution section: use numbered list for approach steps
    - Both headers must include trailing colon and be bold

### Valid Rich Content

**Context:** Feature files support various content types. Some appear in
    generated docs, others are ignored.

    **Decision:** Content rendering by type:

| Content Type | Syntax | Appears in Docs |
| --- | --- | --- |
| Plain text | Regular paragraphs | Yes |
| Bold/emphasis | **bold** and *italic* | Yes |
| Tables | Markdown pipe tables | Yes |
| Lists | Dash item or number-dot item | Yes |
| DocStrings | Triple quotes with lang | Yes (code block) |
| Comments | Lines starting with hash | No (ignored) |

    **Code-First Principle:**

    Prefer code stubs over DocStrings for complex examples. Feature files
    should reference code, not duplicate it.

| Approach | When to Use |
| --- | --- |
| DocStrings | Brief examples (5-10 lines), current/target state |
| Code stub reference | Complex APIs, interfaces, full implementations |

    **Instead of large DocStrings, reference code files directly in Rule descriptions.**

### Syntax Notes

**Context:** Gherkin has specific syntax constraints that differ from Markdown.

    **DocStrings vs Code Fences:**

    Prefer DocStrings (triple double-quotes) over Markdown code fences for portability.
    Markdown fences (triple backticks) may not render consistently in all contexts.
    DocStrings support language hints for syntax highlighting.

    **Tag Value Constraints:**

    Tag values cannot contain spaces. Use hyphens instead:

| Invalid | Valid |
| --- | --- |
| at-unlock-reason:Fix for issue | at-unlock-reason:Fix-for-issue |
| at-libar-docs-pattern:My Pattern | at-libar-docs-pattern:MyPattern |

    **Quoted Values:**

    For values that need spaces, use the quoted-value format where supported.

### Quick Reference

**Context:** Quick lookup table for Gherkin elements and their use cases.

    **Decision:** Element usage guide:

| Element | Use For | Example Location |
| --- | --- | --- |
| Background DataTable | Deliverables, shared reference | specs/process-guard-linter.feature |
| Rule block | Group scenarios by constraint | tests/features/validation/*.feature |
| Scenario Outline | Same pattern with variations | tests/features/behavior/fsm-*.feature |
| DocString | Code examples, pipes content | tests/features/behavior/scanner-*.feature |
| Section comments | Organize large features | Most test features |
| at-happy-path | Primary success scenario | Every feature with scenarios |
| at-edge-case | Boundary conditions | Validation features |
| at-acceptance-criteria | Required for DoD | Roadmap specs |
