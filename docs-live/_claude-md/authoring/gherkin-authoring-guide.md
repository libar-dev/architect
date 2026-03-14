### Gherkin Authoring Guide

#### Essential Patterns

##### Roadmap Spec Structure

Roadmap specs define planned work with Problem/Solution descriptions and a Background deliverables table.

```gherkin
@libar-docs
@libar-docs-pattern:ProcessGuardLinter
@libar-docs-status:roadmap
@libar-docs-phase:99
Feature: Process Guard Linter

  **Problem:**
  During planning and implementation sessions, accidental modifications occur:
  - Specs outside the intended scope get modified in bulk
  - Completed/approved work gets inadvertently changed

  **Solution:**
  Implement a Decider-based linter that:
  1. Derives process state from existing file annotations
  2. Validates proposed changes against derived state
  3. Enforces file protection levels per PDR-005

  Background: Deliverables
    Given the following deliverables:
      | Deliverable                   | Status  | Location                           |
      | State derivation              | Pending | src/lint/process-guard/derive.ts   |
      | Git diff change detection     | Pending | src/lint/process-guard/detect.ts   |
      | CLI integration               | Pending | src/cli/lint-process.ts            |
```

**Key elements:**

- `@libar-docs` -- bare opt-in marker (required)
- `@libar-docs-pattern:Name` -- unique identifier (required)
- `@libar-docs-status:roadmap` -- FSM state
- `**Problem:**` / `**Solution:**` -- extracted by generators
- Background deliverables table -- tracks implementation progress

##### Rule Blocks for Business Constraints

Use `Rule:` to group related scenarios under a business constraint.

```gherkin
Rule: Status transitions must follow PDR-005 FSM

  **Invariant:** Only valid FSM transitions are allowed.

  **Rationale:** The FSM enforces deliberate progression through planning, implementation, and completion.

  **Verified by:** Valid transitions pass, Invalid transitions fail

  @happy-path
  Scenario Outline: Valid transitions pass validation
    Given a file with status "<from>"
    When the status changes to "<to>"
    Then validation passes

    Examples:
      | from     | to        |
      | roadmap  | active    |
      | roadmap  | deferred  |
      | active   | completed |
      | deferred | roadmap   |
```

| Element            | Purpose                                 | Extracted By                                |
| ------------------ | --------------------------------------- | ------------------------------------------- |
| `**Invariant:**`   | Business constraint (what must be true) | Business Rules generator                    |
| `**Rationale:**`   | Business justification (why it exists)  | Business Rules generator                    |
| `**Verified by:**` | Comma-separated scenario names          | Multiple codecs (Business Rules, Reference) |

##### Scenario Outline for Variations

When the same pattern applies with different inputs, use `Scenario Outline` with an `Examples` table:

```gherkin
Scenario Outline: Protection levels by status
  Given a file with status "<status>"
  When checking protection level
  Then protection is "<protection>"
  And unlock required is "<unlock>"

  Examples:
    | status    | protection | unlock |
    | roadmap   | none       | no     |
    | active    | scope      | no     |
    | completed | hard       | yes    |
    | deferred  | none       | no     |
```

##### Executable Test Features

Test features focus on behavior verification with section dividers for organization.

```gherkin
@behavior @scanner-core
@libar-docs-pattern:ScannerCore
Feature: Scanner Core Integration

  Background:
    Given a scanner integration context with temp directory

  @happy-path
  Scenario: Scan files and extract directives
    Given a file "src/auth.ts" with valid content
    When scanning with pattern "src/**/*.ts"
    Then the scan should succeed with 1 file
```

Section comments (`# ====`) improve readability in large feature files.

#### DataTable and DocString Usage

##### Background DataTable (Reference Data)

Use for data that applies to all scenarios -- deliverables, definitions, etc.

```gherkin
Background: Deliverables
  Given the following deliverables:
    | Deliverable        | Status  | Location               | Tests |
    | Category types     | Done    | src/types.ts           | Yes   |
    | Validation logic   | Pending | src/validate.ts        | Yes   |
```

##### Scenario DataTable (Test Data)

Use for scenario-specific test inputs.

```gherkin
Scenario: Session file defines modification scope
  Given a session file with in-scope specs:
    | spec                        | intent |
    | mvp-workflow-implementation | modify |
    | short-form-tag-migration    | review |
  When deriving process state
  Then "mvp-workflow-implementation" is modifiable
```

##### DocString for Code Examples

Use `"""typescript` for code blocks. Essential when content contains pipes or special characters.

```gherkin
Scenario: Extract directive from TypeScript
  Given a file with content:
    """typescript
    /** @libar-docs */
    export function authenticate() {}
    """
  When scanning the file
  Then directive should have tag "@libar-docs-core"
```

#### Tag Conventions

##### Semantic Tags (Extracted by Generators)

| Tag                    | Purpose                                           |
| ---------------------- | ------------------------------------------------- |
| `@acceptance-criteria` | Required for DoD validation of completed patterns |
| `@happy-path`          | Primary success scenario                          |
| `@validation`          | Input validation, constraint checks               |
| `@business-rule`       | Business invariant verification                   |
| `@business-failure`    | Expected business failure scenario                |
| `@edge-case`           | Boundary conditions, unusual inputs               |
| `@error-handling`      | Error recovery, graceful degradation              |

#### Feature Description Patterns

Choose headers that fit your pattern:

| Structure        | Headers                                    | Best For                  |
| ---------------- | ------------------------------------------ | ------------------------- |
| Problem/Solution | `**Problem:**`, `**Solution:**`            | Pain point to fix         |
| Value-First      | `**Business Value:**`, `**How It Works:**` | TDD-style, Gherkin spirit |
| Context/Approach | `**Context:**`, `**Approach:**`            | Technical patterns        |

The **Problem/Solution** pattern is the dominant style in this codebase.

#### Feature File Rich Content

Feature files serve dual purposes: **executable specs** and **documentation source**. Content in the Feature description section appears in generated docs.

##### Code-First Principle

**Prefer code stubs over DocStrings for complex examples.** Feature files should reference code, not duplicate it.

| Approach                     | When to Use                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| DocStrings (`"""typescript`) | Brief examples (5-10 lines), current/target state comparison |
| Code stub reference          | Complex APIs, interfaces, full implementations               |

Code stubs are annotated TypeScript files with `throw new Error("not yet implemented")`, located in `delivery-process/stubs/{pattern-name}/`.

##### Valid Rich Content

| Content Type  | Syntax                  | Appears in Docs  |
| ------------- | ----------------------- | ---------------- |
| Plain text    | Regular paragraphs      | Yes              |
| Bold/emphasis | `**bold**`, `*italic*`  | Yes              |
| Tables        | Markdown pipe tables    | Yes              |
| Lists         | `- item` or `1. item`   | Yes              |
| DocStrings    | `"""typescript`...`"""` | Yes (code block) |
| Comments      | `# comment`             | No (ignored)     |

#### Syntax Notes and Gotchas

##### Forbidden in Feature Descriptions

| Forbidden                     | Why                              | Alternative                         |
| ----------------------------- | -------------------------------- | ----------------------------------- |
| Code fences (triple backtick) | Not Gherkin syntax               | Use DocStrings with lang hint       |
| `@prefix` in free text        | Interpreted as Gherkin tag       | Remove `@` or use `libar-dev`       |
| Nested DocStrings             | Gherkin parser error             | Reference code stub file            |
| `#` at line start             | Gherkin comment -- kills parsing | Remove, use `//`, or step DocString |

##### Tag Value Constraints

**Tag values cannot contain spaces.** Use hyphens:

| Invalid                          | Valid                           |
| -------------------------------- | ------------------------------- |
| `@unlock-reason:Fix for issue`   | `@unlock-reason:Fix-for-issue`  |
| `@libar-docs-pattern:My Pattern` | `@libar-docs-pattern:MyPattern` |

For values with spaces, use the `quoted-value` format where supported:

```gherkin
@libar-docs-usecase "When handling command failures"
```

#### Quick Reference

| Element              | Use For                                | Example                             |
| -------------------- | -------------------------------------- | ----------------------------------- |
| Background DataTable | Deliverables, shared reference data    | Deliverables table in roadmap specs |
| Rule:                | Group scenarios by business constraint | Invariant + Rationale + Verified by |
| Scenario Outline     | Same pattern with variations           | Examples tables with multiple rows  |
| DocString `"""`      | Code examples, content with pipes      | TypeScript/Gherkin code blocks      |
| Section comments `#` | Organize large feature files           | `# ========= Section ==========`    |
