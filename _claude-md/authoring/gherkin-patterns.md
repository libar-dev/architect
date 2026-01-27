### Gherkin Authoring Patterns

#### Roadmap Spec Structure

```gherkin
@libar-docs-pattern:ProcessGuardLinter
@libar-docs-status:roadmap
@libar-docs-phase:99
Feature: Process Guard Linter

  **Problem:**
  During planning sessions, accidental modifications can occur.

  **Solution:**
  Implement a Decider-based linter that validates proposed changes.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status  | Location |
      | State derivation | Pending | src/lint/derive.ts |
```

#### Feature Description Patterns

| Structure        | Headers                                    | Best For           |
| ---------------- | ------------------------------------------ | ------------------ |
| Problem/Solution | `**Problem:**`, `**Solution:**`            | Pain point to fix  |
| Value-First      | `**Business Value:**`, `**How It Works:**` | TDD-style specs    |
| Context/Approach | `**Context:**`, `**Approach:**`            | Technical patterns |

#### Tag Conventions

| Tag                    | Purpose                     |
| ---------------------- | --------------------------- |
| `@happy-path`          | Primary success scenario    |
| `@edge-case`           | Boundary conditions         |
| `@error-handling`      | Error recovery scenarios    |
| `@validation`          | Input validation rules      |
| `@acceptance-criteria` | Required for DoD validation |
| `@integration`         | Cross-component behavior    |

#### Rule Block Structure

For business constraints, use `Rule:` blocks with structured annotations:

```gherkin
Rule: Reservations prevent race conditions

  **Invariant:** Only one reservation can exist for a key.
  **Rationale:** Check-then-create has TOCTOU vulnerabilities.
  **Verified by:** @happy-path, @edge-case scenarios below.

  @acceptance-criteria @happy-path
  Scenario: Concurrent reservations are prevented
    Given an existing reservation for key "order-123"
    When another process attempts to reserve "order-123"
    Then the reservation fails with "already reserved"
```
