# 🚧 FSM Validator

**Purpose:** Detailed documentation for the FSM Validator pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Validation |

## Description

:PDR005MvpWorkflow


## FSM Validator - Pure Validation Functions

Pure validation functions following the Decider pattern:
- No I/O, no side effects
- Return structured results, never throw
- Composable and testable

### When to Use

- Use `validateStatus()` to validate status values before processing
- Use `validateTransition()` to check proposed status changes
- Use `validateCompletionMetadata()` to enforce completed state requirements

---

[← Back to Pattern Registry](../PATTERNS.md)
