# ✅ ADR-002: ADR 002 Gherkin Only Testing

**Purpose:** Architecture decision record for ADR 002 Gherkin Only Testing

---

## Overview

| Property | Value    |
| -------- | -------- |
| Status   | accepted |
| Category | testing  |

## Rules

### Source-driven process benefit

**Invariant:** Feature files serve as both executable specs and
documentation source. This dual purpose is the primary benefit
of Gherkin-only testing for this package.

    | Artifact | Without Gherkin-Only | With Gherkin-Only |
    | Tests | .test.ts (hidden from docs) | .feature (visible in docs) |
    | Business rules | Manually maintained | Extracted from Rule blocks |
    | Acceptance criteria | Implicit in test code | Explicit @acceptance-criteria tags |
    | Traceability | Manual cross-referencing | @libar-docs-implements links |

---

[← Back to All Decisions](../DECISIONS.md)
