That is a very clean, technical aesthetic. Using `- [x]` (GitHub-flavored markdown for "checked task") effectively communicates that these are **passing tests** derived from the Gherkin scenarios, without the visual noise of emojis.

Here is the revised style guide and the updated prompt for your AI coding partner.

### Part 1: The "Clean Technical" Style

Here is how the report looks with standard Markdown formatting and task lists:

---

# Annotation Business Rules

> **Purpose:** Business rules for the Annotation product area

| Total Rules | Features | Invariants |
| ----------- | -------- | ---------- |
| **67**      | 14       | 18         |

---

## Context Inference

_Source: `context-inference.feature_`

### Patterns in standard directories (`src/validation/`, `src/scanner/`) should...

#### matchPattern supports recursive wildcard `**`

**Verified by:**

- [x] Recursive wildcard matches nested paths

#### inferContext applies first matching rule

**Verified by:**

- [x] Single matching rule infers context
- [x] First matching rule wins when multiple could match

---

## Declaration Level Shape Tagging

_Source: `declaration-level-shape-tagging.feature_`

### Tests the `discoverTaggedShapes` function that scans TypeScript source

#### Declarations opt in via `libar-docs-shape` tag

> **Invariant:** Only declarations with the `@libar-docs-shape` tag in their immediately preceding JSDoc are collected as tagged shapes.

**Verified by:**

- [x] Tagged declaration is extracted as shape
- [x] Untagged exported declaration is not extracted
- [x] Group name is captured from tag value
- [x] Bare tag works without group name
- [x] Non-exported tagged declaration is extracted

---

### Part 2: Updated Instructions for your AI Partner

Use this prompt to instruct your coding partner. It specifically enforces the removal of emojis and the implementation of the checklist format.

```markdown
You are a Technical Documentation Specialist. I need you to reformat a Markdown report generated from Gherkin feature files. The current output is too dense and hard to scan.

Please rewrite the markdown using the following **Strict Style Rules**:

### 1. General Formatting

- **No Emojis:** Do not use emojis anywhere in the document. Keep the tone strictly technical.
- **Header:** Present the "Purpose" as a blockquote under the main H1. Convert summary statistics into a Markdown Table.
- **Technical Terms:** Identify code artifacts (paths like `src/`, tags like `@libar-docs`, wildcards `**`) and wrap them in backticks `` ` ``.

### 2. Feature Sections (H2)

- Format the Feature Name as `## [Feature Name]`.
- Immediately below the H2, place the filename in italics: `*Source: filename.feature*`.
- Add a horizontal rule (`---`) _after_ the last rule of a feature, before the next H2 starts.

### 3. Invariants and Rationales

- If a description contains "Invariant:", "Rationale:", or "Note:", format it as a blockquote (`>`) to make it visually distinct.
- Bold the label (e.g., `> **Invariant:** ...`).

### 4. Verification Lists (Crucial)

- The current input lists verification steps as comma-separated text: `_Verified by: Test A, Test B, Test C_`.
- **Transform this into a Task List:**
  1.  Remove the underscores/italics.
  2.  Add a bold header: `**Verified by:**`.
  3.  Split the comma-separated tests into individual lines.
  4.  Prefix each line with `- [x] ` to indicate a passing test case.

**Example Input:**
_Verified by: Tagged declaration is extracted as shape, Untagged exported declaration is not extracted_

**Example Output:**
**Verified by:**

- [x] Tagged declaration is extracted as shape
- [x] Untagged exported declaration is not extracted

**Apply these rules to the provided markdown content.**
```
