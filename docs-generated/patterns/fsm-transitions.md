# 🚧 FSM Transitions

**Purpose:** Detailed documentation for the FSM Transitions pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Validation |

## Description

:PDR005MvpWorkflow


## FSM Transitions - Valid State Transition Matrix

Defines valid transitions between FSM states per PDR-005:

```
roadmap ──→ active ──→ completed
   │          │
   │          ↓
   │       roadmap (blocked/regressed)
   │
   ↓
deferred ──→ roadmap
```

### When to Use

- Use `isValidTransition()` to validate proposed status changes
- Use `getValidTransitionsFrom()` to show available options

---

[← Back to Pattern Registry](../PATTERNS.md)
