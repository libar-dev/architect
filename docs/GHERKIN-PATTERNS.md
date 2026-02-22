# Gherkin Patterns Guide

Practical patterns for writing Gherkin specs that work with `delivery-process` generators.

> **Tag Reference:** Run `npx generate-tag-taxonomy -o TAG_TAXONOMY.md -f` for the complete tag list. See [TAXONOMY.md](./TAXONOMY.md) for concepts.

---

## Essential Patterns

### 1. Roadmap Spec Structure

Roadmap specs define planned work with Problem/Solution descriptions and a Background deliverables table.

```gherkin
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

- `@libar-docs-pattern:Name` - Unique identifier (required)
- `@libar-docs-status:roadmap` - FSM state
- `**Problem:**` / `**Solution:**` - Extracted by generators
- Background deliverables table - Tracks implementation progress

### 2. Rule Blocks for Business Constraints

Use `Rule:` to group related scenarios under a business constraint.

```gherkin
Rule: Status transitions must follow PDR-005 FSM

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

  @edge-case
  Scenario Outline: Invalid transitions fail validation
    Given a file with status "<from>"
    When the status changes to "<to>"
    Then validation fails with "invalid-status-transition"

    Examples:
      | from      | to        |
      | roadmap   | completed |
      | deferred  | active    |
      | completed | roadmap   |
```

Rules provide semantic grouping - generators extract them for business rules documentation.

### 3. Scenario Outline for Variations

When the same pattern applies with different inputs, use `Scenario Outline` with an `Examples` table.

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

### 4. Executable Test Feature

Test features focus on behavior verification with section dividers for organization.

```gherkin
@behavior @scanner-core
@libar-docs-pattern:ScannerCore
Feature: Scanner Core Integration
  The scanPatterns function orchestrates file discovery and AST parsing.

  **Problem:**
  - Need to scan codebases for documentation directives efficiently
  - Files without @libar-docs opt-in should be skipped

  **Solution:**
  - Two-phase filtering: quick regex check, then file opt-in validation
  - Result monad pattern captures errors without failing entire scan

  Background:
    Given a scanner integration context with temp directory

  # ==========================================================================
  # Basic Scanning
  # ==========================================================================

  @happy-path
  Scenario: Scan files and extract directives
    Given a file "src/auth.ts" with content:
      """
      /** @libar-docs */

      /** @libar-docs-core */
      export function authenticate() {}
      """
    When scanning with pattern "src/**/*.ts"
    Then the scan should succeed with 1 file

  # ==========================================================================
  # Error Handling
  # ==========================================================================

  @error-handling
  Scenario: Collect errors for files that fail to parse
    Given a file "src/valid.ts" with valid content
    And a file "src/invalid.ts" with syntax errors
    When scanning with pattern "src/**/*.ts"
    Then the scan should succeed with 1 file
    And the scan should have 1 error
```

Section comments (`# ===`) improve readability in large feature files.

---

## DataTable and DocString Usage

### Background DataTable (Reference Data)

Use for data that applies to all scenarios - deliverables, definitions, etc.

```gherkin
Background: Deliverables
  Given the following deliverables:
    | Deliverable        | Status  | Location               | Tests |
    | Category types     | Done    | src/types.ts           | Yes   |
    | Validation logic   | Pending | src/validate.ts        | Yes   |
```

### Scenario DataTable (Test Data)

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

### DocString for Code Examples

Use `"""typescript` for code blocks. Essential when content contains pipes or special characters.

```gherkin
Scenario: Extract directive from TypeScript
  Given a file with content:
    """typescript
    /** @libar-docs */

    /**
     * @libar-docs-core
     * Authentication utilities
     */
    export function authenticate() {}
    """
  When scanning the file
  Then directive should have tag "@libar-docs-core"
```

---

## Tag Conventions

### Semantic Tags (Extracted by Generators)

These tags are recognized by the extractor and appear in generated documentation:

| Tag                    | Purpose                                           |
| ---------------------- | ------------------------------------------------- |
| `@acceptance-criteria` | Required for DoD validation of completed patterns |
| `@happy-path`          | Primary success scenario                          |
| `@validation`          | Input validation, constraint checks               |
| `@business-rule`       | Business invariant verification                   |
| `@business-failure`    | Expected business failure scenario                |
| `@compensation`        | Compensating action scenario                      |
| `@idempotency`         | Idempotency verification                          |
| `@expiration`          | Expiration/timeout behavior                       |
| `@workflow-state`      | Workflow state transition scenario                |

### Convention Tags (Organizational)

These tags are not extracted by generators but are used by convention for organizing feature files:

| Tag               | Purpose                              |
| ----------------- | ------------------------------------ |
| `@edge-case`      | Boundary conditions, unusual inputs  |
| `@error-handling` | Error recovery, graceful degradation |
| `@integration`    | Cross-component behavior             |
| `@poc`            | Proof of concept, experimental       |

### Combining Tags

Combine scenario-level tags with feature-level tags for filtering:

```gherkin
@behavior @scanner-core
@libar-docs-pattern:ScannerCore
Feature: Scanner Core Integration
```

---

## Feature File Rich Content

Feature files serve dual purposes: **executable specs** and **documentation source**. Content in the Feature description section appears in generated docs.

### Code-First Principle

**Prefer code stubs over DocStrings for complex examples.** Feature files should reference code, not duplicate it.

| Approach                     | When to Use                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| DocStrings (`"""typescript`) | Brief examples (5-10 lines), current/target state comparison |
| Code stub reference          | Complex APIs, interfaces, full implementations               |

**Instead of large DocStrings:**

```gherkin
Rule: Reservations use atomic claim
  See `@libar-dev/platform-core/src/reservations/reserve.ts` for API.
```

Code stubs are annotated TypeScript files with `throw new Error("not yet implemented")`.

### Rule Block Structure (Recommended)

For features that define business constraints, use `Rule:` blocks with structured descriptions:

```gherkin
Rule: Reservations prevent race conditions

  **Invariant:** Only one reservation can exist for a given key at a time.

  **Rationale:** Check-then-create patterns have TOCTOU vulnerabilities.

  **Verified by:** Concurrent reservations, Expired reservation cleanup

  @acceptance-criteria @happy-path
  Scenario: Concurrent reservations
    ...
```

| Element            | Purpose                                 | Extracted By                                |
| ------------------ | --------------------------------------- | ------------------------------------------- |
| `**Invariant:**`   | Business constraint (what must be true) | Business Rules generator                    |
| `**Rationale:**`   | Business justification (why it exists)  | Business Rules generator                    |
| `**Verified by:**` | Comma-separated scenario names          | Multiple codecs (Business Rules, Reference) |

> **Note:** Rule blocks are optional. Use them when the feature defines business invariants that benefit from structured documentation.

### Feature Description Patterns

Choose headers that fit your pattern:

| Structure        | Headers                                    | Best For                  |
| ---------------- | ------------------------------------------ | ------------------------- |
| Problem/Solution | `**Problem:**`, `**Solution:**`            | Pain point → fix          |
| Value-First      | `**Business Value:**`, `**How It Works:**` | TDD-style, Gherkin spirit |
| Context/Approach | `**Context:**`, `**Approach:**`            | Technical patterns        |

The **Problem/Solution** pattern is the dominant style in this codebase.

### Valid Rich Content

| Content Type  | Syntax                  | Appears in Docs  |
| ------------- | ----------------------- | ---------------- |
| Plain text    | Regular paragraphs      | Yes              |
| Bold/emphasis | `**bold**`, `*italic*`  | Yes              |
| Tables        | Markdown pipe tables    | Yes              |
| Lists         | `- item` or `1. item`   | Yes              |
| DocStrings    | `"""typescript`...`"""` | Yes (code block) |
| Comments      | `# comment`             | No (ignored)     |

### Syntax Notes

**Prefer DocStrings over code fences for portability:**

```gherkin
# Preferred - DocStrings with language hint
Given the following code:
  """typescript
  const x = 1;
  """

# Avoid - markdown fences in descriptions may not render consistently
```

**Tag values cannot contain spaces.** Use hyphens:

| Invalid                          | Valid                           |
| -------------------------------- | ------------------------------- |
| `@unlock-reason:Fix for issue`   | `@unlock-reason:Fix-for-issue`  |
| `@libar-docs-pattern:My Pattern` | `@libar-docs-pattern:MyPattern` |

For values with spaces, use the `quoted-value` format where supported:

```gherkin
@libar-docs-usecase "When handling command failures"
```

---

## Step Linting

`lint-steps` is a static analyzer that catches vitest-cucumber compatibility issues **before tests run**. It uses regex-based state machines (not the `@cucumber/gherkin` parser) to detect patterns that cause cryptic runtime failures. Run it after writing or modifying any `.feature` or `.steps.ts` file:

```bash
pnpm lint:steps
```

12 rules across 3 categories (8 error, 4 warning). For the full validation tool suite, see [VALIDATION.md](./VALIDATION.md).

### Feature File Rules

These rules scan `.feature` files without needing a Gherkin parser:

| Rule ID                  | Severity | What It Catches                                                          |
| ------------------------ | -------- | ------------------------------------------------------------------------ |
| `hash-in-description`    | error    | `#` at line start inside `"""` block in description — terminates parsing |
| `keyword-in-description` | error    | Description line starting with Given/When/Then/And/But — breaks parser   |
| `duplicate-and-step`     | error    | Multiple `And` steps with identical text in same scenario                |
| `dollar-in-step-text`    | warning  | `$` in step text (outside quotes) causes matching issues                 |
| `hash-in-step-text`      | warning  | Mid-line `#` in step text (outside quotes) silently truncates the step   |

**`hash-in-description` — the most surprising trap:**

```gherkin
# BAD — # inside """ block in description terminates parsing
Rule: My Rule
    """bash
    # This breaks the parser — Gherkin sees a comment, not code
    generate-docs --output docs
    """

# GOOD — move code to a step DocString (safe context)
Scenario: Example usage
  Given the following script:
    """bash
    # Safe inside a real DocString
    generate-docs --output docs
    """
```

**`keyword-in-description`:**

```gherkin
# BAD — starts with "Given", parser interprets as a step
Rule: Authentication
  Given a valid session, the system should...

# GOOD — rephrase to avoid reserved keywords at line start
Rule: Authentication
  A valid session enables the system to...
```

### Step Definition Rules

These rules scan `.steps.ts` files:

| Rule ID                   | Severity | What It Catches                                            |
| ------------------------- | -------- | ---------------------------------------------------------- |
| `regex-step-pattern`      | error    | Regex pattern in step registration — use string patterns   |
| `unsupported-phrase-type` | error    | `{phrase}` in step string — use `{string}` instead         |
| `repeated-step-pattern`   | error    | Same pattern registered twice — second silently overwrites |

**`regex-step-pattern`:**

```typescript
// BAD — regex pattern throws StepAbleStepExpressionError
Given(/a user with id (\d+)/, (_ctx, id) => { ... });

// GOOD — string pattern with Cucumber expression
Given('a user with id {int}', (_ctx, id: number) => { ... });
```

### Cross-File Rules

These rules pair `.feature` and `.steps.ts` files and cross-check them:

| Rule ID                            | Severity | What It Catches                                                      |
| ---------------------------------- | -------- | -------------------------------------------------------------------- |
| `scenario-outline-function-params` | error    | Function params in ScenarioOutline callback (should use variables)   |
| `missing-and-destructuring`        | error    | Feature has `And` steps but step file does not destructure `And`     |
| `missing-rule-wrapper`             | error    | Feature has `Rule:` blocks but step file does not destructure `Rule` |
| `outline-quoted-values`            | warning  | Quoted values in Outline steps instead of `<placeholder>` syntax     |

**The Two-Pattern Problem** — `scenario-outline-function-params` + `outline-quoted-values` form a pair:

```gherkin
# Feature file — BAD (outline-quoted-values)
Scenario Outline: Validate quantity
  When I set quantity to "<quantity>"
  # Should be: When I set quantity to <quantity>

  Examples:
    | quantity |
    | 5        |
```

```typescript
// Step file — BAD (scenario-outline-function-params)
ScenarioOutline('Validate quantity', ({ When }) => {
  When('I set quantity to {string}', (_ctx, qty: string) => {
    // qty is undefined at runtime — {string} does NOT work in ScenarioOutline
  });
});

// GOOD — use variables object
ScenarioOutline('Validate quantity', ({ When }, variables: { quantity: string }) => {
  When('I set quantity to <quantity>', () => {
    const qty = variables.quantity;
  });
});
```

**`missing-and-destructuring`:**

```typescript
// BAD — And not destructured, causes StepAbleUnknowStepError
describeFeature(feature, ({ Given, When, Then }) => { ... });

// GOOD — And is available for feature And steps
describeFeature(feature, ({ Given, When, Then, And }) => { ... });
```

### CLI Reference

| Flag               | Short | Description                | Default  |
| ------------------ | ----- | -------------------------- | -------- |
| `--strict`         |       | Treat warnings as errors   | false    |
| `--format <type>`  |       | Output: `pretty` or `json` | `pretty` |
| `--base-dir <dir>` | `-b`  | Base directory for paths   | cwd      |

**Scan scope** (hardcoded defaults):

```
Feature files:  tests/features/**/*.feature
                delivery-process/specs/**/*.feature
                delivery-process/decisions/**/*.feature
Step files:     tests/steps/**/*.steps.ts
```

**Exit codes:**

| Code | Meaning                                        |
| ---- | ---------------------------------------------- |
| `0`  | No errors (warnings allowed unless `--strict`) |
| `1`  | Errors found (or warnings with `--strict`)     |

---

## Quick Reference

| Element              | Use For                                | Example Location                                      |
| -------------------- | -------------------------------------- | ----------------------------------------------------- |
| Background DataTable | Deliverables, shared reference data    | `delivery-process/specs/process-guard-linter.feature` |
| Rule:                | Group scenarios by business constraint | `tests/features/validation/*.feature`                 |
| Scenario Outline     | Same pattern with variations           | `tests/features/validation/fsm-validator.feature`     |
| DocString `"""`      | Code examples, content with pipes      | `tests/features/behavior/scanner-*.feature`           |
| Section comments `#` | Organize large feature files           | Most test features                                    |
| `lint-steps`         | Catch vitest-cucumber traps statically | `pnpm lint:steps`                                     |

---

## Related Documentation

| Document                                     | Purpose                                 |
| -------------------------------------------- | --------------------------------------- |
| [ANNOTATION-GUIDE.md](./ANNOTATION-GUIDE.md) | Annotation mechanics and tag reference  |
| [TAXONOMY.md](./TAXONOMY.md)                 | Tag taxonomy concepts and API           |
| [CONFIGURATION.md](./CONFIGURATION.md)       | Preset and tag prefix configuration     |
| [VALIDATION.md](./VALIDATION.md)             | Full validation tool suite and CI setup |
