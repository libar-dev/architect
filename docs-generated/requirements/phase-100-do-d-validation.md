# 📋 DoD Validation

**Purpose:** Detailed requirements for the DoD Validation feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Product Area | DeliveryProcess |
| Business Value | enable machine checkable phase completion |
| Phase | 100 |

## Description

**Problem:**
  Phase completion is currently subjective ("done when we feel it").
  No objective criteria validation, easy to miss deliverables.
  Cannot gate CI/releases on DoD compliance.

  **Solution:**
  Implement `pnpm validate:dod --phase N` CLI command that:
  - Checks all deliverables have status "Complete"/"Done"
  - Verifies at least one @acceptance-criteria scenario exists
  - Warns if effort-actual is missing for completed phases
  - Returns exit code for CI gating

  Implements Convergence Opportunity 2: DoD as Machine-Checkable.

  See: docs/ideation-convergence/01-delivery-process-opportunities.md

## Acceptance Criteria

**Validate DoD for completed phase**

- Given a phase with all deliverables marked "Complete"
- And at least one @acceptance-criteria scenario exists
- When running pnpm validate:dod --phase N
- Then exit code is 0
- And report shows "DoD met"

**Detect incomplete DoD**

- Given a phase marked "completed" with incomplete deliverables
- When running pnpm validate:dod --phase N
- Then exit code is 1
- And report lists incomplete deliverables

**Warn on missing effort-actual**

- Given a completed phase without effort-actual metadata
- When running pnpm validate:dod --phase N
- Then warning is emitted for missing variance data
- But exit code is still 0 (warning, not error)

## Deliverables

- validate:dod CLI command (pending)
- Deliverable status parser (pending)
- Acceptance criteria checker (pending)
- CI integration documentation (pending)

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
