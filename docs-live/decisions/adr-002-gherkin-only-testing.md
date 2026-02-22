# ADR-002: ADR 002 Gherkin Only Testing

**Purpose:** Architecture decision record for ADR 002 Gherkin Only Testing

---

## Overview

| Property | Value    |
| -------- | -------- |
| Status   | accepted |
| Category | testing  |

**Context:**
A package that generates documentation from `.feature` files had dual
test approaches: 97 legacy `.test.ts` files alongside Gherkin features.
This undermined the core thesis that Gherkin IS sufficient for all testing.

**Decision:**
Enforce strict Gherkin-only testing for the delivery-process package:

- All tests must be `.feature` files with step definitions
- No new `.test.ts` files
- Edge cases use Scenario Outline with Examples tables

**Consequences:**

| Type     | Impact                                                                     |
| -------- | -------------------------------------------------------------------------- |
| Positive | Single source of truth for tests AND documentation                         |
| Positive | Demonstrates Gherkin sufficiency -- the package practices what it preaches |
| Positive | Living documentation always matches test coverage                          |
| Positive | Forces better scenario design with Examples tables                         |
| Negative | Scenario Outline syntax more verbose than parameterized tests              |

## Rules

### Source-driven process benefit

**Invariant:** Feature files serve as both executable specs and documentation source. This dual purpose is the primary benefit of Gherkin-only testing for this package.

**Rationale:** Parallel `.test.ts` files create a hidden test layer invisible to the documentation pipeline, undermining the single source of truth principle this package enforces.

| Artifact            | Without Gherkin-Only        | With Gherkin-Only                  |
| ------------------- | --------------------------- | ---------------------------------- |
| Tests               | .test.ts (hidden from docs) | .feature (visible in docs)         |
| Business rules      | Manually maintained         | Extracted from Rule blocks         |
| Acceptance criteria | Implicit in test code       | Explicit @acceptance-criteria tags |
| Traceability        | Manual cross-referencing    | @libar-docs-implements links       |

---

[← Back to All Decisions](../DECISIONS.md)
