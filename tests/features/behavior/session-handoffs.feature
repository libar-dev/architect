@libar-docs
@libar-docs-pattern:SessionHandoffs
@libar-docs-status:completed
@libar-docs-product-area:Process
@behavior @session-handoffs
Feature: Session Handoffs and Multi-Developer Coordination
  The delivery process supports mid-phase handoffs between sessions and
  coordination across multiple developers through structured templates,
  checklists, and generated documentation.

  **Problem:**
  - Context is lost when work pauses mid-phase (LLM sessions have no memory)
  - Discoveries made during sessions are not captured for roadmap refinement
  - Multiple developers working on same phase can create conflicts
  - Resuming work requires re-reading scattered feature files

  **Solution:**
  - Discovery tags (@libar-process-discovered-*) capture learnings inline
  - SESSION-CONTEXT.md provides complete phase context for LLM planning
  - Handoff template standardizes state capture at session boundaries
  - Retrospective checklist ensures discoveries flow to findings generator
  - PROCESS_SETUP.md documents coordination patterns for parallel work

  Rule: Handoff context generation captures session state

      **Invariant:** Active phases with handoff context enabled must include session handoff sections with template and checklist links.

      **Verified by:** SESSION-CONTEXT.md includes handoff section for active phases, Discovery tags appear in handoff context section, Paused phase shows status indicator

    @happy-path @generator
    Scenario: SESSION-CONTEXT.md includes handoff section for active phases
      Given an active phase with no previous session context
      When generating SESSION-CONTEXT.md with includeHandoffContext enabled
      Then the output should include "Session Handoff Context" section
      And the output should include link to handoff template
      And the output should include link to retrospective checklist

    @happy-path @discoveries
    Scenario: Discovery tags appear in handoff context section
      Given an active phase with discovery tags
        | Tag Type    | Value                                |
        | gap         | Missing-validation-for-edge-case     |
        | improvement | Could-cache-parsed-results           |
        | learning    | Gherkin-requires-strict-indentation  |
      When generating SESSION-CONTEXT.md with includeHandoffContext enabled
      Then the handoff context should show gaps identified
      And the handoff context should show improvements suggested
      And the handoff context should show learnings captured

    @happy-path @paused-phase
    Scenario: Paused phase shows status indicator
      Given a phase that was previously paused
      And a discovery tag indicating "Session-paused-at-deliverable-3"
      When generating SESSION-CONTEXT.md with includeHandoffContext enabled
      Then the handoff context should show session status indicator

  Rule: Handoff templates and checklists contain required sections

      **Invariant:** Session handoff template and retrospective checklist must exist and contain all required sections for structured knowledge transfer.

      **Verified by:** Handoff template exists and contains required sections, Retrospective checklist exists and contains required sections

    @documentation @template
    Scenario: Handoff template exists and contains required sections
      Given the session handoff template at catalogue/templates/session-handoff.md
      Then the template should contain the following sections:
        | section |
        | When to Handoff |
        | Handoff Information Checklist |
        | State Capture Template |
        | Resume Procedure |
        | Common Pitfalls |

    @documentation @checklist
    Scenario: Retrospective checklist exists and contains required sections
      Given the session retrospective checklist at catalogue/checklists/session-retrospective.md
      Then the checklist should contain the following sections:
        | section |
        | Pre-Retrospective Tasks |
        | Progress Review |
        | Discovery Capture |
        | Handoff Preparation |
        | Session Summary |

  Rule: PROCESS_SETUP.md documents handoff and coordination protocols

      **Invariant:** PROCESS_SETUP.md must document both session handoff protocol and multi-developer coordination patterns.

      **Verified by:** PROCESS_SETUP.md documents handoff protocol, PROCESS_SETUP.md documents multi-developer coordination

    @documentation @protocol
    Scenario: PROCESS_SETUP.md documents handoff protocol
      Given the PROCESS_SETUP.md file
      Then it should contain "Session Handoff Protocol" section
      And it should document when handoffs occur
      And it should document handoff procedure
      And it should document resumption procedure

    @documentation @coordination
    Scenario: PROCESS_SETUP.md documents multi-developer coordination
      Given the PROCESS_SETUP.md file
      Then it should contain "Multi-Developer Coordination" section
      And it should document phase ownership model
      And it should document parallel work patterns
      And it should document conflict avoidance strategies

  Rule: Edge cases and acceptance criteria ensure robustness

      **Invariant:** Handoff context must degrade gracefully when no discoveries exist and must be disableable. Mid-phase handoffs, multi-developer coordination, and retrospective capture must all preserve context.

      **Verified by:** Fresh phase shows no previous context message, Handoff context can be disabled, Mid-phase handoff preserves context, Multiple developers can coordinate, Session retrospective captures learnings

    @edge-case @no-discoveries
    Scenario: Fresh phase shows no previous context message
      Given an active phase with no discovery tags
      When generating SESSION-CONTEXT.md with includeHandoffContext enabled
      Then the handoff context should show "fresh start" message
      And the output should still include template links

    @edge-case @disabled
    Scenario: Handoff context can be disabled
      Given an active phase with discovery tags
      When generating SESSION-CONTEXT.md with includeHandoffContext disabled
      Then the output should not include "Session Handoff Context" section

    @acceptance-criteria
    Scenario: Mid-phase handoff preserves context
      Given an active phase with partial completion
      When a session ends before phase completion
      Then the handoff template can capture current state
      And the next session can resume with full context from SESSION-CONTEXT.md

    @acceptance-criteria
    Scenario: Multiple developers can coordinate
      Given a phase that requires multiple developers
      When following the coordination pattern documented in PROCESS_SETUP.md
      Then work can be divided with clear boundaries
      And progress can be tracked without conflicts

    @acceptance-criteria
    Scenario: Session retrospective captures learnings
      Given a completed session
      When following the retrospective checklist
      Then learnings are captured via discovery tags
      And discoveries flow to SESSION-FINDINGS.md after regeneration
