# 🚧 Process Guard Decider

**Purpose:** Detailed documentation for the Process Guard Decider pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Lint |

## Description

:FSMValidator,DeriveProcessState,DetectChanges


## ProcessGuardDecider - Pure Validation Logic

Pure function that validates changes against process rules.
Follows the Decider pattern from platform-core: no I/O, no side effects.

### Design Principles

- **Pure Function**: (state, changes, options) => result
- **No I/O**: All data passed in, no file reads
- **Composable Rules**: Rules are separate functions combined in decider
- **Testable**: Easy to unit test with mock data

### Rules Implemented

1. **Protection Level** - Completed files require unlock-reason
2. **Status Transition** - Transitions must follow PDR-005 FSM
3. **Scope Creep** - Active specs cannot add new deliverables
4. **Session Scope** - Modifications outside session scope warn

---

[← Back to Pattern Registry](../PATTERNS.md)
