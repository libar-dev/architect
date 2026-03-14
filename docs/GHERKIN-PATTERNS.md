# Gherkin Patterns Guide

> **Deprecated:** This document is superseded by the auto-generated [Gherkin Authoring Guide](../docs-live/reference/GHERKIN-AUTHORING-GUIDE.md). This file is preserved for reference only.

Practical patterns for writing Gherkin specs that work with `delivery-process` generators.

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

## Quick Reference

| Element              | Use For                                | Example Location                                         |
| -------------------- | -------------------------------------- | -------------------------------------------------------- |
| Background DataTable | Deliverables, shared reference data    | `delivery-process/specs/process-guard-linter.feature`    |
| Rule:                | Group scenarios by business constraint | `tests/features/validation/*.feature`                    |
| Scenario Outline     | Same pattern with variations           | `tests/features/validation/fsm-validator.feature`        |
| DocString `"""`      | Code examples, content with pipes      | `tests/features/behavior/scanner-*.feature`              |
| Section comments `#` | Organize large feature files           | Most test features                                       |
| `lint-steps`         | Catch vitest-cucumber traps statically | [VALIDATION.md — lint-steps](./VALIDATION.md#lint-steps) |

---

## Related Documentation

| Document                                     | Purpose                                 |
| -------------------------------------------- | --------------------------------------- |
| [ANNOTATION-GUIDE.md](./ANNOTATION-GUIDE.md) | Annotation mechanics and tag reference  |
| [TAXONOMY.md](./TAXONOMY.md)                 | Tag taxonomy concepts and API           |
| [CONFIGURATION.md](./CONFIGURATION.md)       | Preset and tag prefix configuration     |
| [VALIDATION.md](./VALIDATION.md)             | Full validation tool suite and CI setup |
