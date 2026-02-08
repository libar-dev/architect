@libar-docs
@libar-docs-pattern:HandoffGeneratorTests
@libar-docs-status:completed
Feature: Handoff Generator - Session-End State Summary

  **Problem:**
  Multi-session work loses critical state between sessions when handoff
  documentation is manual or forgotten.

  **Solution:**
  HandoffGenerator assembles a structured handoff document from ProcessStateAPI
  and MasterDataset, capturing completed work, remaining items, discovered
  issues, and next-session priorities.

  Rule: Handoff generates compact session state summary

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

    @acceptance-criteria @happy-path
    Scenario: Handoff formatter produces markers per ADR-008
      Given a handoff document for pattern TestPattern
      When formatting the handoff document
      Then the output contains the handoff header
      And the output contains section markers
