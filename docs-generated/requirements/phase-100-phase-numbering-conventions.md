# 📋 Phase Numbering Conventions

**Purpose:** Detailed requirements for the Phase Numbering Conventions feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Product Area | DeliveryProcess |
| Business Value | prevent phase number conflicts and ensure consistent ordering |
| Phase | 100 |

## Description

**Problem:**
  Phase numbers are assigned manually without validation, leading to
  potential conflicts (duplicate numbers), gaps that confuse ordering,
  and inconsistent conventions across sources.

  **Solution:**
  Define and validate phase numbering conventions:
  - Unique phase numbers per release version
  - Gap detection and warnings
  - Cross-source consistency validation
  - Suggested next phase number

## Acceptance Criteria

**Duplicate phase numbers are detected**

- Given two phases both numbered 47
- When validating phase numbers
- Then error indicates "Duplicate phase number 47 found in files: ..."
- And both file paths are listed

**Same phase number in different releases is allowed**

- Given phase 14 in v0.2.0
- And phase 14 in v0.3.0
- When validating phase numbers
- Then validation passes (different releases)

**Large gaps trigger warnings**

- Given phases numbered 1, 2, 3, 10
- When validating phase numbers
- Then warning indicates "Gap detected: phases 4-9 missing"

**Small gaps are acceptable**

- Given phases numbered 1, 2, 4, 5
- When validating phase numbers
- Then validation passes (single gap acceptable)

**Suggest next phase number**

- Given existing phases 47, 48, 50
- When running "suggest-phase" command
- Then output suggests 49 (fills gap) or 51 (continues sequence)
- And output shows context of existing phases

## Business Rules

**Phase numbers must be unique within a release**

_Verified by: Duplicate phase numbers are detected, Same phase number in different releases is allowed_

**Phase number gaps are detected**

_Verified by: Large gaps trigger warnings, Small gaps are acceptable_

**CLI suggests next available phase number**

_Verified by: Suggest next phase number_

## Deliverables

- Phase number validator (pending)
- Duplicate detection (pending)
- Next phase suggester (pending)

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
