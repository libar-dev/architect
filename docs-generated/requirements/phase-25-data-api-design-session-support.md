# ✅ Data API Design Session Support

**Purpose:** Detailed requirements for the Data API Design Session Support feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Product Area | DeliveryProcess |
| Business Value | automate session context compilation |
| Phase | 25 |

## Description

**Problem:**
  Starting a design or implementation session requires manually compiling
  elaborate context prompts. For example, DS-3 (LLM Integration) needs:
  - The spec to design against (agent-llm-integration.feature)
  - Dependency stubs from DS-1 and DS-2 (action-handler, event-subscription, schema)
  - Consumer specs for outside-in validation (churn-risk, admin-frontend)
  - Existing infrastructure (CommandOrchestrator, EventBus)
  - Dependency chain status and design decisions from prior sessions

  This manual compilation takes 10-15 minutes per session start and is
  error-prone (missing dependencies, stale context). Multi-session work
  requires handoff documentation that is also manually maintained.

  **Solution:**
  Add session workflow commands that automate two critical session moments:
  1. **Pre-flight check:** `scope-validate <pattern>` verifies implementation readiness
  2. **Session end:** `handoff [--pattern X]` generates handoff documentation

  Session context assembly (the "session start" moment) lives in DataAPIContextAssembly
  via `context <pattern> --session design|implement|planning`. This spec focuses on
  the validation and handoff capabilities that build on top of context assembly.

  **Business Value:**
  | Benefit | Impact |
  | 10-15 min session start -> 1 command | Eliminates manual context compilation |
  | Pre-flight catches blockers early | No wasted sessions on unready patterns |
  | Automated handoff | Consistent multi-session state tracking |

## Acceptance Criteria

**All scope validation checks pass**

- Given a pattern with all prerequisites met
- When running "process-api scope-validate MyPattern --type implement"
- Then all checklist items show green/passing
- And the output indicates "Ready for implementation session"

**Dependency blocker detected**

- Given a pattern "X" depending on "Y" with status "roadmap"
- When running "process-api scope-validate X --type implement"
- Then the dependencies check shows "BLOCKED"
- And the output identifies "Y (roadmap)" as the blocker
- And the output suggests "Complete Y first or change session type to design"

**FSM transition blocker detected**

- Given a pattern with status "completed"
- When running "process-api scope-validate CompletedPattern --type implement"
- Then the FSM check shows "BLOCKED"
- And the output indicates transition to active is not valid from completed

**Generate handoff for in-progress pattern**

- Given an active pattern with 3 completed and 2 remaining deliverables
- When running "process-api handoff --pattern MyPattern"
- Then the output shows the session summary
- And the output lists 3 completed deliverables
- And the output lists 2 remaining deliverables as next priorities
- And the output suggests the recommended order

**Handoff captures discovered items**

- Given a pattern with discovery tags in feature file comments
- When running "process-api handoff --pattern MyPattern"
- Then the output includes discovered gaps
- And the output includes discovered improvements
- And the output includes discovered learnings

## Business Rules

**Scope-validate checks implementation prerequisites before session start**

**Invariant:** Scope validation surfaces all blocking conditions before
    committing to a session, preventing wasted effort on unready patterns.

    **Rationale:** Starting implementation on a pattern with incomplete
    dependencies wastes an entire session. Starting a design session without
    prior session deliverables means working with incomplete context. Pre-flight
    validation catches these issues in seconds rather than discovering them
    mid-session.

    **Validation checklist:**
    | Check | Required For | Source |
    | Dependencies completed | implement | dependsOn chain status |
    | Stubs from dependency sessions exist | design | implementedBy lookup |
    | Deliverables defined | implement | Background table in spec |
    | FSM allows transition to active | implement | isValidTransition() |
    | Design decisions recorded | implement | PDR references in stubs |
    | Executable specs location set | implement | @executable-specs tag |

    **Verified by:** All checks pass, Dependency blocker detected, FSM blocker detected

_Verified by: All scope validation checks pass, Dependency blocker detected, FSM transition blocker detected_

**Handoff generates compact session state summary for multi-session work**

**Invariant:** Handoff documentation captures everything the next session
    needs to continue work without context loss.

    **Rationale:** Multi-session work (common for design phases spanning DS-1
    through DS-7) requires state transfer between sessions. Without automated
    handoff, critical information is lost: what was completed, what's in
    progress, what blockers were discovered, and what should happen next.
    Manual handoff documentation is inconsistent and often forgotten.

    **Handoff output:**
    | Section | Source |
    | Session summary | Pattern name, session type, date |
    | Completed | Deliverables with status "complete" |
    | In progress | Deliverables with status not "complete" and not "pending" |
    | Files modified | Git diff file list (if available) |
    | Discovered items | @discovered-gap, @discovered-improvement tags |
    | Blockers | Incomplete dependencies, open questions |
    | Next session priorities | Remaining deliverables, suggested order |

    **Verified by:** Handoff for in-progress pattern, Handoff with discoveries

_Verified by: Generate handoff for in-progress pattern, Handoff captures discovered items_

## Deliverables

- Scope validation logic (complete)
- scope-validate subcommand (complete)
- Handoff document generator (complete)
- handoff subcommand (complete)

## Implementations

Files that implement this pattern:

- [`handoff-generator.ts`](../../delivery-process/stubs/DataAPIDesignSessionSupport/handoff-generator.ts) - ## HandoffGenerator — Session-End State Summary
- [`scope-validator.ts`](../../delivery-process/stubs/DataAPIDesignSessionSupport/scope-validator.ts) - ## ScopeValidator — Pre-flight Session Readiness Checker
- [`handoff-generator.ts`](../../src/api/handoff-generator.ts) - ## HandoffGenerator — Session-End State Summary
- [`scope-validator.ts`](../../src/api/scope-validator.ts) - ## ScopeValidator — Pre-flight Session Readiness Checker

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
