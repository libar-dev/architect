# 📋 PDR 001 Session Workflow Commands

**Purpose:** Detailed requirements for the PDR 001 Session Workflow Commands feature

---

## Overview

| Property     | Value   |
| ------------ | ------- |
| Status       | planned |
| Product Area | DataAPI |

## Description

**Context:**
DataAPIDesignSessionSupport adds `scope-validate` (pre-flight session
readiness check) and `handoff` (session-end state summary) CLI subcommands.
Seven design decisions affect how these commands behave.

**Decision:**
Seven design decisions (DD-1 through DD-7) captured as Rules below.

## Acceptance Criteria

**scope-validate outputs structured text**

- Given the CLI receives "scope-validate MyPattern --type implement"
- When the handler returns a formatted string
- Then main() outputs the string directly to stdout

**Active pattern infers implement session**

- Given a pattern with status "active"
- When running "process-api handoff --pattern MyPattern"
- Then the session summary shows session type "implement"

## Business Rules

**DD-1 - Text output with section markers**

Both scope-validate and handoff return string from the router, using
=== SECTION === markers. Follows the dual output path where text
commands bypass JSON.stringify.

**DD-2 - Git integration is opt-in via --git flag**

The handoff command accepts an optional --git flag. The CLI handler
calls git diff and passes file list to the pure generator function.
No shell dependency in domain logic.

**DD-3 - Session type inferred from FSM status**

Handoff infers session type from pattern's current FSM status.
An explicit --session flag overrides inference.

    | Status | Inferred Session |
    | roadmap | design |
    | active | implement |
    | completed | review |
    | deferred | design |

**DD-4 - Severity levels match Process Guard model**

Scope validation uses three severity levels:

    | Severity | Meaning |
    | PASS | Check passed |
    | BLOCKED | Hard prerequisite missing |
    | WARN | Recommendation not met |

    The --strict flag promotes WARN to BLOCKED.

**DD-5 - Current date only for handoff**

Handoff always uses the current date. No --date flag.

**DD-6 - Both positional and flag forms for scope type**

scope-validate accepts scope type as both positional argument
and --type flag.

**DD-7 - Co-located formatter functions**

Each module (scope-validator.ts, handoff-generator.ts) exports
both the data builder and the text formatter. Simpler than the
context-assembler/context-formatter split.

_Verified by: scope-validate outputs structured text, Active pattern infers implement session_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
