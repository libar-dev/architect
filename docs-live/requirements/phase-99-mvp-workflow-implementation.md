# ✅ Mvp Workflow Implementation

**Purpose:** Detailed requirements for the Mvp Workflow Implementation feature

---

## Overview

| Property       | Value                         |
| -------------- | ----------------------------- |
| Status         | completed                     |
| Product Area   | Process                       |
| Business Value | align package with pdr005 fsm |
| Phase          | 99                            |

## Description

**Problem:**
PDR-005 defines a 4-state workflow FSM (`roadmap, active, completed, deferred`)
but the delivery-process package validation schemas and generators may still
reference legacy status values. Need to ensure alignment.

**Solution:**
Implement PDR-005 status values via taxonomy module refactor:

1. Create taxonomy module as single source of truth (src/taxonomy/status-values.ts)
2. Update validation schemas to import from taxonomy module
3. Update generators to use normalizeStatus() for display bucket mapping

## Acceptance Criteria

**Scanner extracts new status values**

- Given a feature file with @libar-docs-status:roadmap
- When the scanner processes the file
- Then the status field is "roadmap"

**All four status values are valid**

- Given a feature file with @libar-docs-status:<status>
- When validating the pattern
- Then validation passes

**Roadmap and deferred appear in ROADMAP.md**

- Given patterns with status "roadmap" or "deferred"
- When generating ROADMAP.md
- Then they appear as planned work

**Active appears in CURRENT-WORK.md**

- Given patterns with status "active"
- When generating CURRENT-WORK.md
- Then they appear as active work

**Completed appears in CHANGELOG**

- Given patterns with status "completed"
- When generating CHANGELOG-GENERATED.md
- Then they appear in the changelog

## Business Rules

**PDR-005 status values are recognized**

_Verified by: Scanner extracts new status values, All four status values are valid_

**Generators map statuses to documents**

_Verified by: Roadmap and deferred appear in ROADMAP.md, Active appears in CURRENT-WORK.md, Completed appears in CHANGELOG_

## Deliverables

- Taxonomy module as single source of truth (complete)
- Update DefaultPatternStatusSchema (complete)
- Update ProcessMetadataSchema status (complete)
- Update generator status mapping (complete)
- Fix type errors from status change (complete)
- Run pnpm typecheck (complete)
- Run pnpm test (complete)

## Implementations

Files that implement this pattern:

- [`doc-directive.ts`](../../src/validation-schemas/doc-directive.ts) - ## DocDirectiveSchema - Parsed JSDoc Directive Validation
- [`dual-source.ts`](../../src/validation-schemas/dual-source.ts) - ## DualSourceSchemas - Dual-Source Extraction Type Validation

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
