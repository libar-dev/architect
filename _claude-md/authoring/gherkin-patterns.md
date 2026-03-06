### Gherkin Authoring Patterns

#### Roadmap Spec Structure

```gherkin
@libar-docs
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

Tag inventory: `pnpm process:query -- tags` (counts per tag and value across all sources).

#### Rule Block Structure (Mandatory)

Every feature file MUST use `Rule:` blocks with structured descriptions:

```gherkin
Rule: Reservations prevent race conditions

  **Invariant:** Only one reservation can exist for a given key at a time.

  **Rationale:** Check-then-create patterns have TOCTOU vulnerabilities.

  **Verified by:** Concurrent reservations, Expired reservation cleanup

  @acceptance-criteria @happy-path
  Scenario: Concurrent reservations are prevented
    Given an existing reservation for key "order-123"
    When another process attempts to reserve "order-123"
    Then the reservation fails with "already reserved"
```

| Element            | Purpose                                 | Extracted By             |
| ------------------ | --------------------------------------- | ------------------------ |
| `**Invariant:**`   | Business constraint (what must be true) | Business Rules generator |
| `**Rationale:**`   | Business justification (why it exists)  | Business Rules generator |
| `**Verified by:**` | Comma-separated scenario names          | Traceability generator   |
