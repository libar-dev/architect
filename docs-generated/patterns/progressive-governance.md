# 📋 Progressive Governance

**Purpose:** Detailed documentation for the Progressive Governance pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | planned |
| Category | Opportunity 6 |
| Phase | 100 |

## Description

**Problem:**
  Enterprise governance patterns applied everywhere create overhead.
  Simple utility patterns don't need risk tables and stakeholder approvals.
  No way to filter views by governance level.

  **Solution:**
  Enable governance as a lens, not a mandate:
  - Default: Lightweight (no risk/compliance tags required)
  - Opt-in: Rich governance for high-risk patterns only

  Use risk metadata to:
  - Filter roadmap views by risk level
  - Require additional metadata only for high-risk patterns
  - Generate risk-focused dashboards when requested

  Implements Convergence Opportunity 6: Progressive Governance.

  Note: This is lower priority because simple --filter "risk=high" on
  existing generators achieves 80% of the value. This phase adds polish.

## Acceptance Criteria

**Filter roadmap by risk level**

- Given TypeScript phase files with varying risk levels
- When generating roadmap with --filter "risk=high"
- Then only high-risk phases appear in output
- And risk level is prominently displayed

**Lint rules for high-risk patterns**

- Given a pattern with high risk level
- When running lint validation
- Then warning is emitted if risk mitigation is not documented
- And suggestion to add Background risk table is shown

**Generate risk summary view**

- Given phases with risk metadata across the roadmap
- When generating risk summary
- Then patterns are grouped by risk level
- And high-risk items show mitigation status

---

[← Back to Pattern Registry](../PATTERNS.md)
