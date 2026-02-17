# 📋 Architecture Delta

**Purpose:** Detailed requirements for the Architecture Delta feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Product Area | Generation |
| Business Value | document release changes automatically |
| Phase | 100 |

## Description

**Problem:**
  Architecture evolution is not visible between releases.
  Breaking changes are not clearly documented.
  New constraints introduced by phases are hard to track.
  No automated way to generate "what changed" for a release.

  **Solution:**
  Generate ARCH-DELTA.md showing changes since last release:
  - New patterns introduced (with ADR references)
  - Deprecated patterns (with replacement guidance)
  - New constraints (with rationale)
  - Breaking changes (with migration notes)

  Uses git tags to determine release boundaries.
  Uses @libar-docs-decision, @libar-docs-replaces annotations.

  Implements Convergence Opportunity 5: Architecture Change Control.

## Acceptance Criteria

**Generate delta between releases**

- Given patterns annotated with decision tags
- And git tags marking release versions
- When running architecture delta generator for v0.2.0
- Then report shows new patterns since v0.1.0
- And deprecated patterns are listed with replacements
- And ADR references are included

**Highlight breaking changes**

- Given patterns with replaces annotations
- When generating architecture delta
- Then breaking changes section is populated
- And migration guidance is included where available

**Show new constraints by phase**

- Given phases introducing new constraints
- When generating architecture delta
- Then constraints are listed with introducing phase
- And rationale from ADRs is summarized

## Deliverables

- Release boundary detector (git tags) (pending)
- Pattern diff analyzer (pending)
- Architecture delta section renderer (pending)
- arch-delta generator config (pending)

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
