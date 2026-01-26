# 🚧 Process Guard Types

**Purpose:** Detailed documentation for the Process Guard Types pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | active |
| Category | Lint |

## Description

:FSMValidator


## ProcessGuardTypes - Type Definitions for Process Guard Linter

Defines types for the process guard linter including:
- Process state derived from file annotations
- Git diff change detection results
- Validation results (violations and warnings)
- Session scoping types

### Design Principles

- Types enable pure Decider pattern (no I/O in validation)
- State is derived, not stored
- Protection levels from PDR-005 FSM

---

[← Back to Pattern Registry](../PATTERNS.md)
