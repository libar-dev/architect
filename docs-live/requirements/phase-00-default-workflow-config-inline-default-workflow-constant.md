# 📋 DEFAULT_WORKFLOW_CONFIG — Inline Default Workflow Constant

**Purpose:** Detailed requirements for the DEFAULT_WORKFLOW_CONFIG — Inline Default Workflow Constant feature

---

## Overview

| Property     | Value         |
| ------------ | ------------- |
| Status       | planned       |
| Product Area | Configuration |

## Description

## DEFAULT_WORKFLOW_CONFIG — Inline Default Workflow Constant

Replaces the dead file-based loading path (`catalogue/workflows/6-phase-standard.json`)
with an inline constant that satisfies the existing `WorkflowConfig` type.

The constant uses only the 4 canonical statuses from `PROCESS_STATUS_VALUES`
(roadmap, active, completed, deferred) — not the stale 5-status set from
the deleted JSON (which included non-canonical `implemented` and `partial`).

DD-1: Inline constant in workflow-loader.ts, not preset integration.
DD-2: Constant satisfies existing WorkflowConfig type from workflow-config.ts.
DD-4: loadDefaultWorkflow() returns LoadedWorkflow synchronously (not Promise).

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
