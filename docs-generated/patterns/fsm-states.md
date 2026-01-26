# 🚧 FSM States

**Purpose:** Detailed documentation for the FSM States pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Validation |

## Description

:PDR005MvpWorkflow


## FSM States - Process Status States and Protection Levels

Defines the 4-state FSM from PDR-005 MVP Workflow:
- roadmap: Planned work (fully editable)
- active: Work in progress (scope-locked)
- completed: Done (hard-locked, requires unlock)
- deferred: On hold (fully editable)

### When to Use

- Use `getProtectionLevel()` to determine modification restrictions
- Use `isTerminalState()` to check if state allows transitions
- Use `PROTECTION_LEVELS` for direct lookups

---

[← Back to Pattern Registry](../PATTERNS.md)
