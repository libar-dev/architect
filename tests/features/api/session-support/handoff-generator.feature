@architect
@architect-pattern:HandoffGeneratorTests
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:DataAPI
Feature: Handoff Generator - Session-End State Summary

  **Problem:**
  Multi-session work loses critical state between sessions when handoff
  documentation is manual or forgotten.

  **Solution:**
  HandoffGenerator assembles a structured handoff document from PatternGraphAPI
  and PatternGraph, capturing completed work, remaining items, discovered
  issues, and next-session priorities.

  Rule: Handoff generates compact session state summary

    **Invariant:** The handoff generator must produce a compact session state summary including pattern status, discovered items, inferred session type, modified files, and dependency blockers, throwing an error for unknown patterns.
    **Rationale:** Handoff documents are the bridge between multi-session work — without compact state capture, the next session starts from scratch instead of resuming where the previous one left off.
    **Verified by:** Generate handoff for in-progress pattern, Handoff captures discovered items, Session type is inferred from status, Completed pattern infers review session type, Deferred pattern infers design session type, Files modified section included when provided, Blockers section shows incomplete dependencies, Pattern not found throws error

    @acceptance-criteria @happy-path
    Scenario: Generate handoff for in-progress pattern
      Given an active pattern with completed and remaining deliverables
      When generating a handoff document
      Then the handoff shows the session summary header
      And the handoff lists completed deliverables
      And the handoff lists in-progress deliverables
      And the handoff lists remaining deliverables as next priorities

    @acceptance-criteria @happy-path
    Scenario: Handoff captures discovered items
      Given a pattern with discovery tags
      When generating a handoff document
      Then the handoff includes discovered gaps
      And the handoff includes discovered improvements
      And the handoff includes discovered learnings

    @acceptance-criteria @edge-case
    Scenario: Session type is inferred from status
      Given a roadmap pattern
      When generating a handoff document without explicit session type
      Then the inferred session type is design

    @acceptance-criteria @edge-case
    Scenario: Completed pattern infers review session type
      Given a completed pattern
      When generating a handoff document without explicit session type
      Then the inferred session type is review

    @acceptance-criteria @edge-case
    Scenario: Deferred pattern infers design session type
      Given a deferred pattern
      When generating a handoff document without explicit session type
      Then the inferred session type is design

    @acceptance-criteria @edge-case
    Scenario: Files modified section included when provided
      Given an active pattern with completed and remaining deliverables
      When generating a handoff with modified files
      Then the handoff includes a files modified section

    @acceptance-criteria @edge-case
    Scenario: Blockers section shows incomplete dependencies
      Given a pattern with an incomplete dependency
      When generating a handoff document
      Then the handoff shows the incomplete dependency as a blocker

    @acceptance-criteria @error-handling
    Scenario: Pattern not found throws error
      Given no patterns in the dataset
      When generating a handoff for a nonexistent pattern
      Then a PATTERN_NOT_FOUND error is thrown

  Rule: Formatter produces structured text output

    **Invariant:** The handoff formatter must produce structured text output with ADR-008 section markers for machine-parseable session state.
    **Rationale:** ADR-008 markers enable the context assembler to parse handoff output programmatically — unstructured text would require fragile regex parsing.
    **Verified by:** Handoff formatter produces markers per ADR-008

    @acceptance-criteria @happy-path
    Scenario: Handoff formatter produces markers per ADR-008
      Given a handoff document for pattern TestPattern
      When formatting the handoff document
      Then the output contains the handoff header
      And the output contains section markers
