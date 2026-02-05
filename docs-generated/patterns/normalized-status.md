# ✅ Normalized Status

**Purpose:** Detailed documentation for the Normalized Status pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Core |

## Description

The delivery-process system uses a two-level status taxonomy:

1. Raw status (PROCESS_STATUS_VALUES in status-values.ts):
   The 4 FSM states stored in data: roadmap, active, completed, deferred

2. Normalized status (this file):
   The 3 display buckets for UI presentation

This separation follows DDD principles - the domain model (raw) is
distinct from the view model (normalized).

---

[← Back to Pattern Registry](../PATTERNS.md)
