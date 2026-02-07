### Feature File Rich Content Guidelines

Feature files serve dual purposes: **executable specs** and **documentation source**. Content in the Feature description section appears in generated docs.

#### Code-First Principle

**Prefer code stubs over DocStrings for complex examples.** Feature files should reference code, not duplicate it.

| Approach                     | When to Use                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| DocStrings (`"""typescript`) | Brief examples (5-10 lines), current/target state comparison |
| Code stub reference          | Complex APIs, interfaces, full implementations               |

**Instead of large DocStrings:**

```gherkin
Rule: Reservations use atomic claim
  See `src/reservations/reserve.ts` for API.
```

Code stubs live in `delivery-process/stubs/{pattern-name}/` — annotated TypeScript with `throw new Error("not yet implemented")`.

#### Rule Block Structure (Mandatory)

Every feature file MUST use `Rule:` blocks with structured descriptions:

```gherkin
Rule: Reservations prevent race conditions

  **Invariant:** Only one reservation can exist for a given key at a time.

  **Rationale:** Check-then-create patterns have TOCTOU vulnerabilities.

  **Verified by:** Concurrent reservations, Expired reservation cleanup

  @acceptance-criteria @happy-path
  Scenario: Concurrent reservations
    ...
```

| Element            | Purpose                                 | Extracted By             |
| ------------------ | --------------------------------------- | ------------------------ |
| `**Invariant:**`   | Business constraint (what must be true) | Business Rules generator |
| `**Rationale:**`   | Business justification (why it exists)  | Business Rules generator |
| `**Verified by:**` | Comma-separated scenario names          | Traceability generator   |

#### Feature Description Structure

Choose headers that fit your pattern (flexible, not rigid):

| Structure        | Headers                                    | Best For                  |
| ---------------- | ------------------------------------------ | ------------------------- |
| Problem/Solution | `**Problem:**`, `**Solution:**`            | Pain point to fix         |
| Value-First      | `**Business Value:**`, `**How It Works:**` | TDD-style, Gherkin spirit |
| Context/Approach | `**Context:**`, `**Approach:**`            | Technical patterns        |

Always include a benefits table:

```gherkin
**Business Value:**
| Benefit | Impact |
| ... | ... |
```

#### Valid Rich Content

| Content Type  | Syntax                  | Appears in Docs  |
| ------------- | ----------------------- | ---------------- |
| Plain text    | Regular paragraphs      | Yes              |
| Bold/emphasis | `**bold**`, `*italic*`  | Yes              |
| Tables        | Markdown pipe tables    | Yes              |
| Lists         | `- item` or `1. item`   | Yes              |
| DocStrings    | `"""typescript`...`"""` | Yes (code block) |
| Comments      | `# comment`             | No (ignored)     |

#### Forbidden in Feature Descriptions

| Forbidden           | Why                             | Alternative                      |
| ------------------- | ------------------------------- | -------------------------------- |
| Code fences ` ``` ` | Not Gherkin syntax              | Use DocStrings with lang hint    |
| `@prefix` in text   | Interpreted as Gherkin tag      | Remove `@` or use `libar-dev`    |
| Nested DocStrings   | Gherkin parser error            | Reference code stub file         |
| `#` at line start   | Gherkin comment — kills parsing | Remove, use `//`, or step DocStr |

#### Description `"""` Blocks vs Step DocStrings (CRITICAL)

**`"""` inside Feature/Rule descriptions is plain text, NOT a DocString.** Only `"""` as step arguments (Given/When/Then) creates real DocStrings. This means description content between `"""` is subject to Gherkin parser rules — including `#` = comment.

**Symptom:** `expected: #EOF, #BackgroundLine... got 'some-content'`

```gherkin
Rule: My Rule

    """bash
    # This breaks! Parser sees Gherkin comment, terminates description
    generate-docs --output docs
    """
```

**Workarounds:**

| Approach                    | When to Use                        |
| --------------------------- | ---------------------------------- |
| Remove `#` lines            | Simple cases                       |
| Use `//` for comments       | When comment syntax doesn't matter |
| Move to step DocString      | When you need code with `#`        |
| Reference stub file instead | Complex examples (preferred)       |

**Safe pattern — step DocString (content is real DocString, `#` is safe):**

```gherkin
  Scenario: Example usage
    Given the following script:
      """bash
      # This is safe — real DocString, not description text
      generate-docs --output docs
      """
```

#### Tag Value Constraints

**Tag values cannot contain spaces.** Use hyphens instead:

| Invalid                          | Valid                           |
| -------------------------------- | ------------------------------- |
| `@unlock-reason:Fix for issue`   | `@unlock-reason:Fix-for-issue`  |
| `@libar-docs-pattern:My Pattern` | `@libar-docs-pattern:MyPattern` |
