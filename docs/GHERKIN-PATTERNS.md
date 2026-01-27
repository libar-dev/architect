# Gherkin Patterns Guide

Practical patterns for writing Gherkin specs that work with `delivery-process` generators.

> **Tag Reference:** For the complete tag list, see [INSTRUCTIONS.md](../INSTRUCTIONS.md#category-tags).

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

| Tag               | Purpose                              |
| ----------------- | ------------------------------------ |
| `@happy-path`     | Primary success scenario             |
| `@edge-case`      | Boundary conditions, unusual inputs  |
| `@error-handling` | Error recovery, graceful degradation |
| `@validation`     | Input validation, constraint checks  |
| `@integration`    | Cross-component behavior             |
| `@poc`            | Proof of concept, experimental       |

Combine with feature-level tags for filtering:

```gherkin
@behavior @scanner-core
@libar-docs-pattern:ScannerCore
Feature: Scanner Core Integration
```

---

## Quick Reference

| Element              | Use For                                | Example Location                            |
| -------------------- | -------------------------------------- | ------------------------------------------- |
| Background DataTable | Deliverables, shared reference data    | `specs/process-guard-linter.feature`        |
| Rule:                | Group scenarios by business constraint | `tests/features/validation/*.feature`       |
| Scenario Outline     | Same pattern with variations           | `tests/features/behavior/fsm-*.feature`     |
| DocString `"""`      | Code examples, content with pipes      | `tests/features/behavior/scanner-*.feature` |
| Section comments `#` | Organize large feature files           | Most test features                          |

---

## Related Documentation

| Document                                    | Purpose                             |
| ------------------------------------------- | ----------------------------------- |
| [INSTRUCTIONS.md](../INSTRUCTIONS.md)       | Complete tag reference and CLI      |
| [docs/CONFIGURATION.md](./CONFIGURATION.md) | Preset and tag prefix configuration |
