# ✅ Process State API Testing

**Purpose:** Detailed requirements for the Process State API Testing feature

---

## Overview

| Property     | Value     |
| ------------ | --------- |
| Status       | completed |
| Product Area | DataAPI   |

## Description

Programmatic interface for querying delivery process state.
Designed for Claude Code integration and tool automation.

**Problem:**

- Markdown generation is not ideal for programmatic access
- Claude Code needs structured data to answer process questions
- Multiple queries require redundant parsing of MasterDataset

**Solution:**

- ProcessStateAPI wraps MasterDataset with typed query methods
- Returns structured data suitable for programmatic consumption
- Integrates FSM validation for transition checks

## Acceptance Criteria

**Get patterns by normalized status**

- Given patterns with statuses: completed, active, roadmap, deferred
- When querying patterns with normalized status "planned"
- Then the result includes roadmap and deferred patterns
- And the result does not include completed or active patterns

**Get patterns by FSM status**

- Given patterns with statuses: completed, active, roadmap, deferred
- When querying patterns with FSM status "active"
- Then the result includes only active patterns

**Get current work returns active patterns**

- Given patterns with statuses: completed, active, roadmap
- When querying getCurrentWork
- Then the result includes only active patterns

**Get roadmap items returns roadmap and deferred**

- Given patterns with statuses: completed, active, roadmap, deferred
- When querying getRoadmapItems
- Then the result includes roadmap and deferred patterns
- And the result does not include completed or active patterns

**Get status counts**

- Given patterns with statuses: completed, completed, active, roadmap
- When querying status counts
- Then completed count is 2
- And active count is 1
- And planned count is 1
- And total count is 4

**Get completion percentage**

- Given patterns with 3 completed and 1 active
- When querying completion percentage
- Then the percentage is 75

**Get patterns by phase**

- Given patterns in phase 14 and phase 15
- When querying patterns for phase 14
- Then the result includes only phase 14 patterns

**Get phase progress**

- Given a phase 14 with 2 completed and 1 active pattern
- When querying phase progress for phase 14
- Then completed count is 2
- And active count is 1
- And completion percentage is 66

**Get nonexistent phase returns undefined**

- When querying phase progress for phase 999
- Then the result is undefined

**Get active phases**

- Given phase 14 with active work and phase 15 with only completed
- When querying active phases
- Then phase 14 is included
- And phase 15 is not included

**Check valid transition**

- When checking if transition from "roadmap" to "active" is valid
- Then the transition is valid

**Check invalid transition**

- When checking if transition from "roadmap" to "completed" is valid
- Then the transition is invalid

**Get valid transitions from status**

- When querying valid transitions from "roadmap"
- Then valid targets include "active"
- And valid targets include "deferred"
- And valid targets include "roadmap"

**Get protection info**

- When querying protection info for "completed"
- Then protection level is "hard"
- And requires unlock is true
- And can add deliverables is false

**Find pattern by name (case insensitive)**

- Given a pattern named "CommandOrchestrator"
- When searching for pattern "commandorchestrator"
- Then the pattern is found
- And pattern name is "CommandOrchestrator"

**Find nonexistent pattern returns undefined**

- When searching for pattern "NonExistentPattern"
- Then the result is undefined

**Get patterns by category**

- Given patterns in categories: core, domain, projection
- When querying patterns in category "core"
- Then the result includes only core patterns

**Get all categories with counts**

- Given patterns in categories: core, core, domain
- When querying all categories
- Then core has count 2
- And domain has count 1

**Get patterns by quarter**

- Given patterns in quarters: Q1-2026, Q2-2026
- When querying patterns for quarter "Q1-2026"
- Then the result includes only Q1-2026 patterns

**Get all quarters**

- Given patterns in quarters: Q1-2026, Q2-2026, Q1-2026
- When querying all quarters
- Then Q1-2026 has 2 patterns
- And Q2-2026 has 1 pattern

**Get recently completed sorted by date**

- Given completed patterns with dates: 2026-01-09, 2026-01-08, 2026-01-07
- When querying recently completed with limit 2
- Then the first pattern has date "2026-01-09"
- And the second pattern has date "2026-01-08"
- And the result has 2 patterns

## Business Rules

**Status queries return correct patterns**

**Invariant:** Status queries must correctly filter by both normalized status (planned = roadmap + deferred) and FSM status (exact match).
**Rationale:** The two-domain status convention requires separate query methods — mixing them produces incorrect filtered results.
**Verified by:** Get patterns by normalized status, Get patterns by FSM status, Get current work returns active patterns, Get roadmap items returns roadmap and deferred, Get status counts, Get completion percentage

_Verified by: Get patterns by normalized status, Get patterns by FSM status, Get current work returns active patterns, Get roadmap items returns roadmap and deferred, Get status counts, Get completion percentage_

**Phase queries return correct phase data**

**Invariant:** Phase queries must return only patterns in the requested phase, with accurate progress counts and completion percentage.
**Rationale:** Phase-level queries power the roadmap and session planning views — incorrect counts cascade into wrong progress percentages.
**Verified by:** Get patterns by phase, Get phase progress, Get nonexistent phase returns undefined, Get active phases

_Verified by: Get patterns by phase, Get phase progress, Get nonexistent phase returns undefined, Get active phases_

**FSM queries expose transition validation**

**Invariant:** FSM queries must validate transitions against the PDR-005 state machine and expose protection levels per status.
**Rationale:** Programmatic FSM access enables tooling to enforce delivery process rules without reimplementing the state machine.
**Verified by:** Check valid transition, Check invalid transition, Get valid transitions from status, Get protection info

_Verified by: Check valid transition, Check invalid transition, Get valid transitions from status, Get protection info_

**Pattern queries find and retrieve pattern data**

**Invariant:** Pattern lookup must be case-insensitive by name, and category queries must return only patterns with the requested category.
**Rationale:** Case-insensitive search reduces friction in CLI and AI agent usage where exact casing is often unknown.
**Verified by:** Find pattern by name (case insensitive), Find nonexistent pattern returns undefined, Get patterns by category, Get all categories with counts

_Verified by: Find pattern by name (case insensitive), Find nonexistent pattern returns undefined, Get patterns by category, Get all categories with counts_

**Timeline queries group patterns by time**

**Invariant:** Quarter queries must correctly filter by quarter string, and recently completed must be sorted by date descending with limit.
**Rationale:** Timeline grouping enables quarterly reporting and session context — recent completions show delivery momentum.
**Verified by:** Get patterns by quarter, Get all quarters, Get recently completed sorted by date

_Verified by: Get patterns by quarter, Get all quarters, Get recently completed sorted by date_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
