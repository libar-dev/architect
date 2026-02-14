# ✅ ADR-004: PDR 001 Session Workflow Commands

**Purpose:** Architecture decision record for PDR 001 Session Workflow Commands

---

## Overview

| Property | Value        |
| -------- | ------------ |
| Status   | accepted     |
| Category | architecture |

## Rules

### DD-1 - Text output with section markers

Both scope-validate and handoff return string from the router, using
=== SECTION === markers. Follows the dual output path where text
commands bypass JSON.stringify.

### DD-2 - Git integration is opt-in via --git flag

The handoff command accepts an optional --git flag. The CLI handler
calls git diff and passes file list to the pure generator function.
No shell dependency in domain logic.

### DD-3 - Session type inferred from FSM status

Handoff infers session type from pattern's current FSM status.
An explicit --session flag overrides inference.

    | Status | Inferred Session |
    | roadmap | design |
    | active | implement |
    | completed | review |
    | deferred | design |

### DD-4 - Severity levels match Process Guard model

Scope validation uses three severity levels:

    | Severity | Meaning |
    | PASS | Check passed |
    | BLOCKED | Hard prerequisite missing |
    | WARN | Recommendation not met |

    The --strict flag promotes WARN to BLOCKED.

### DD-5 - Current date only for handoff

Handoff always uses the current date. No --date flag.

### DD-6 - Both positional and flag forms for scope type

scope-validate accepts scope type as both positional argument
and --type flag.

### DD-7 - Co-located formatter functions

Each module (scope-validator.ts, handoff-generator.ts) exports
both the data builder and the text formatter. Simpler than the
context-assembler/context-formatter split.

---

[← Back to All Decisions](../DECISIONS.md)
