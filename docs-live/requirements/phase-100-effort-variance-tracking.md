# 📋 Effort Variance Tracking

**Purpose:** Detailed requirements for the Effort Variance Tracking feature

---

## Overview

| Property       | Value                                   |
| -------------- | --------------------------------------- |
| Status         | planned                                 |
| Product Area   | DeliveryProcess                         |
| Business Value | track planned vs actual effort variance |
| Phase          | 100                                     |

## Description

**Problem:**
No systematic way to track planned vs actual effort.
Cannot learn from estimation accuracy patterns.
No visibility into "where time goes" across workflows.

**Solution:**
Generate EFFORT-ANALYSIS.md report showing:

- Phase burndown (planned vs actual per phase)
- Estimation accuracy trends over time
- Time distribution by workflow type (design, implementation, testing, docs)

Uses effort and effort-actual metadata from TypeScript phase files.
Uses workflow metadata for time distribution analysis.

Implements Convergence Opportunity 3: Earned-Value Tracking (lightweight).

## Acceptance Criteria

**Generate phase variance report**

- Given TypeScript phase files with effort and effort-actual metadata
- When running effort analysis generator
- Then report shows variance per phase (planned - actual)
- And variance percentage is calculated
- And overall accuracy trend is shown

**Generate workflow time distribution**

- Given TypeScript phase files with workflow metadata
- When running effort analysis generator
- Then report shows effort breakdown by workflow type
- And percentages show where time is spent

## Deliverables

- Effort variance section renderer (pending)
- Workflow distribution analyzer (pending)
- effort-analysis generator config (pending)

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
