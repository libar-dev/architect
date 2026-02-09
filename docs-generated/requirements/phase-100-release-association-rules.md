# 📋 Release Association Rules

**Purpose:** Detailed requirements for the Release Association Rules feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Product Area | DeliveryProcess |
| Business Value | enforce separation of specs from release metadata |
| Phase | 100 |

## Description

**Problem:**
  PDR-002 and PDR-003 define conventions for separating specs from release
  metadata, but there's no automated enforcement. Spec files may
  inadvertently include release columns, and TypeScript phase files may
  have incorrect structure.

  **Solution:**
  Implement validation rules for:
  - Spec file compliance (no release columns in DataTables)
  - TypeScript phase file structure
  - Cross-reference validation (spec references exist)
  - Release version format (semver pattern)

## Acceptance Criteria

**Spec with release column is rejected**

- Given a feature file in delivery-process/specs/
- And the deliverables DataTable has a "Release" column
- When validating spec compliance
- Then error indicates "Spec files must not contain Release column (per PDR-003)"

**Spec without release column passes**

- Given a feature file in delivery-process/specs/
- And the deliverables DataTable has only Deliverable, Status, Tests, Location
- When validating spec compliance
- Then validation passes

**Phase file with missing required annotations**

- Given a TypeScript file in delivery-process/src/phases/
- When @libar-docs-pattern is missing
- Then validation fails with "Required: @libar-docs-pattern"

**Phase file required annotations**

- Given a TypeScript phase file
- When annotation "<annotation>" is missing
- Then validation <result>

**Valid release version formats**

- Given a release version "<version>"
- When validating release format
- Then validation <result>

## Business Rules

**Spec files must not contain release columns**

_Verified by: Spec with release column is rejected, Spec without release column passes_

**TypeScript phase files must have required annotations**

_Verified by: Phase file with missing required annotations, Phase file required annotations_

**Release version follows semantic versioning**

_Verified by: Valid release version formats_

## Deliverables

- Spec compliance validator (pending)
- TypeScript phase file validator (pending)
- Release version format validator (pending)

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
