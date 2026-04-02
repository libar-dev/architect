@architect
@architect-implements:PatternGraphAPICLI
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@behavior @pattern-graph-api
@architect-pattern:PatternGraphAPIRelationshipQueries
@architect-phase:24
@architect-product-area:DataAPI
Feature: Pattern Graph API
  Programmatic interface for querying the pattern graph and delivery process state.
  Designed for Claude Code integration and tool automation.

  **Problem:**
  - Markdown generation is not ideal for programmatic access
  - Claude Code needs structured data to answer process questions
  - Multiple queries require redundant parsing of PatternGraph

  **Solution:**
  - PatternGraphAPI wraps PatternGraph with typed query methods
  - Returns structured data suitable for programmatic consumption
  - Integrates FSM validation for transition checks

  Background:
    Given a test PatternGraph is initialized

  # ==========================================================================
  # Status Queries
  # ==========================================================================

  Rule: Status queries return correct patterns

    **Invariant:** Status queries must correctly filter by both normalized status (planned = roadmap + deferred) and FSM status (exact match).
    **Rationale:** The two-domain status convention requires separate query methods — mixing them produces incorrect filtered results.
    **Verified by:** Get patterns by normalized status, Get patterns by FSM status, Get current work returns active patterns, Get roadmap items returns roadmap and deferred, Get status counts, Get completion percentage

    @happy-path
    Scenario: Get patterns by normalized status
      Given patterns with statuses: completed, active, roadmap, deferred
      When querying patterns with normalized status "planned"
      Then the result includes roadmap and deferred patterns
      And the result does not include completed or active patterns

    @happy-path
    Scenario: Get patterns by FSM status
      Given patterns with statuses: completed, active, roadmap, deferred
      When querying patterns with FSM status "active"
      Then the result includes only active patterns

    @happy-path
    Scenario: Get current work returns active patterns
      Given patterns with statuses: completed, active, roadmap
      When querying getCurrentWork
      Then the result includes only active patterns

    @happy-path
    Scenario: Get roadmap items returns roadmap and deferred
      Given patterns with statuses: completed, active, roadmap, deferred
      When querying getRoadmapItems
      Then the result includes roadmap and deferred patterns
      And the result does not include completed or active patterns

    @happy-path
    Scenario: Get status counts
      Given patterns with statuses: completed, completed, active, roadmap
      When querying status counts
      Then completed count is 2
      And active count is 1
      And planned count is 1
      And total count is 4

    @happy-path
    Scenario: Get completion percentage
      Given patterns with 3 completed and 1 active
      When querying completion percentage
      Then the percentage is 75

  # ==========================================================================
  # Phase Queries
  # ==========================================================================

  Rule: Phase queries return correct phase data

    **Invariant:** Phase queries must return only patterns in the requested phase, with accurate progress counts and completion percentage.
    **Rationale:** Phase-level queries power the roadmap and session planning views — incorrect counts cascade into wrong progress percentages.
    **Verified by:** Get patterns by phase, Get phase progress, Get nonexistent phase returns undefined, Get active phases

    @happy-path
    Scenario: Get patterns by phase
      Given patterns in phase 14 and phase 15
      When querying patterns for phase 14
      Then the result includes only phase 14 patterns

    @happy-path
    Scenario: Get phase progress
      Given a phase 14 with 2 completed and 1 active pattern
      When querying phase progress for phase 14
      Then completed count is 2
      And active count is 1
      And completion percentage is 66

    @edge-case
    Scenario: Get nonexistent phase returns undefined
      When querying phase progress for phase 999
      Then the result is undefined

    @happy-path
    Scenario: Get active phases
      Given phase 14 with active work and phase 15 with only completed
      When querying active phases
      Then phase 14 is included
      And phase 15 is not included

  # ==========================================================================
  # FSM Queries
  # ==========================================================================

  Rule: FSM queries expose transition validation

    **Invariant:** FSM queries must validate transitions against the PDR-005 state machine and expose protection levels per status.
    **Rationale:** Programmatic FSM access enables tooling to enforce delivery process rules without reimplementing the state machine.
    **Verified by:** Check valid transition, Check invalid transition, Get valid transitions from status, Get protection info

    @happy-path
    Scenario: Check valid transition
      When checking if transition from "roadmap" to "active" is valid
      Then the transition is valid

    @edge-case
    Scenario: Check invalid transition
      When checking if transition from "roadmap" to "completed" is valid
      Then the transition is invalid

    @happy-path
    Scenario: Get valid transitions from status
      When querying valid transitions from "roadmap"
      Then valid targets include "active"
      And valid targets include "deferred"
      And valid targets include "roadmap"

    @happy-path
    Scenario: Get protection info
      When querying protection info for "completed"
      Then protection level is "hard"
      And requires unlock is true
      And can add deliverables is false

  # ==========================================================================
  # Pattern Queries
  # ==========================================================================

  Rule: Pattern queries find and retrieve pattern data

    **Invariant:** Pattern lookup must be case-insensitive by name, and category queries must return only patterns with the requested category.
    **Rationale:** Case-insensitive search reduces friction in CLI and AI agent usage where exact casing is often unknown.
    **Verified by:** Find pattern by name (case insensitive), Find nonexistent pattern returns undefined, Get patterns by category, Get all categories with counts

    @happy-path
    Scenario: Find pattern by name (case insensitive)
      Given a pattern named "CommandOrchestrator"
      When searching for pattern "commandorchestrator"
      Then the pattern is found
      And pattern name is "CommandOrchestrator"

    @edge-case
    Scenario: Find nonexistent pattern returns undefined
      When searching for pattern "NonExistentPattern"
      Then the result is undefined

    @happy-path
    Scenario: Get patterns by category
      Given patterns in categories: core, domain, projection
      When querying patterns in category "core"
      Then the result includes only core patterns

    @happy-path
    Scenario: Get all categories with counts
      Given patterns in categories: core, core, domain
      When querying all categories
      Then core has count 2
      And domain has count 1

  # ==========================================================================
  # Timeline Queries
  # ==========================================================================

  Rule: Timeline queries group patterns by time

    **Invariant:** Quarter queries must correctly filter by quarter string, and recently completed must be sorted by date descending with limit.
    **Rationale:** Timeline grouping enables quarterly reporting and session context — recent completions show delivery momentum.
    **Verified by:** Get patterns by quarter, Get all quarters, Get recently completed sorted by date

    @happy-path
    Scenario: Get patterns by quarter
      Given patterns in quarters: Q1-2026, Q2-2026
      When querying patterns for quarter "Q1-2026"
      Then the result includes only Q1-2026 patterns

    @happy-path
    Scenario: Get all quarters
      Given patterns in quarters: Q1-2026, Q2-2026, Q1-2026
      When querying all quarters
      Then Q1-2026 has 2 patterns
      And Q2-2026 has 1 pattern

    @happy-path
    Scenario: Get recently completed sorted by date
      Given completed patterns with dates: 2026-01-09, 2026-01-08, 2026-01-07
      When querying recently completed with limit 2
      Then the first pattern has date "2026-01-09"
      And the second pattern has date "2026-01-08"
      And the result has 2 patterns
