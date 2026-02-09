# 🚧 Deliverable Status Taxonomy

**Purpose:** Detailed documentation for the Deliverable Status Taxonomy pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Core |

## Description

Canonical status values for deliverables in Gherkin Background tables.

The delivery-process system uses two distinct status domains:

1. Pattern status (FSM-governed, 4 values in status-values.ts):
   roadmap, active, completed, deferred — validated by ProcessStatusSchema

2. Deliverable status (this file, 6 values):
   complete, in-progress, pending, deferred, superseded, n/a —
   validated by DeliverableSchema via z.enum(DELIVERABLE_STATUS_VALUES)

Previously, deliverable status was z.string() with 29-pattern fuzzy
matching at read-time. This caused 3 real bugs (drift campaign 10bab44).
Now enforced at schema level like pattern status.

---

[← Back to Pattern Registry](../PATTERNS.md)
