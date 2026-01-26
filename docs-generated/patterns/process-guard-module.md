# 🚧 Process Guard Module

**Purpose:** Detailed documentation for the Process Guard Module pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Lint |

## Description

:FSMValidator,DeriveProcessState,DetectChanges,ProcessGuardDecider


## ProcessGuardModule - Process Guard Linter

Enforces delivery process rules by validating changes against:
- Protection levels (completed files require unlock-reason)
- Status transitions (must follow PDR-005 FSM)
- Scope creep (active specs cannot add new deliverables)
- Session scope (modifications outside session warn)

### Architecture

```
derive-state.ts ─┐
                 ├──► decider.ts ──► ValidationResult
detect-changes.ts┘
```

### When to Use

- Pre-commit hook validation
- CI/CD pipeline validation
- Interactive validation during development

---

[← Back to Pattern Registry](../PATTERNS.md)
