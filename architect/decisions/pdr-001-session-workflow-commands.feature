@architect
@architect-adr:001
@architect-adr-status:accepted
@architect-adr-category:process
@architect-adr-layer:refinement
@architect-adr-theme:commands
@architect-pattern:PDR001SessionWorkflowCommands
@architect-status:completed
@architect-unlock-reason:Correct-accepted-decision-status-from-roadmap-to-completed
@architect-product-area:DataAPI
Feature: PDR-001 - Session Workflow Commands Design Decisions

  **Context:**
  DataAPIDesignSessionSupport adds scope validation (pre-flight session
  readiness check) and handoff (session-end state summary). Since ADR-014
  the carriers are the `projectScopeReadinessReport` / `projectHandoffRecord`
  projections and their `architect_scope_validate` / `architect_handoff` MCP
  tools (the CLI-subcommand form was retired with the verb CLI).

  **Decision:**
  Design decisions DD-1 through DD-7 captured as Rules below (DD-6, which
  governed the retired CLI argument forms, was retired with the verb CLI).

  # ===========================================================================
  # DECISION CONTEXT
  # ===========================================================================

  Background: Decision Context
    Given the following options were considered:
      | Option | Approach | Impact |
      | DD-1b | Text output with markers | Consistent with context, overview, dep-tree |
      | DD-2b | Opt-in git via flag | Keeps core logic pure and testable |
      | DD-3b | Infer from status with override | Ergonomic default, explicit escape hatch |

  # ===========================================================================
  # RULE 1: DD-1 - Text Output With Section Markers
  # ===========================================================================

  Rule: DD-1 - Text output with section markers

    **Invariant:** scope-validate and handoff must return plain text with === SECTION === markers, never JSON.
    **Rationale:** Inconsistent output formats force consumers to detect and branch on format type, breaking the dual output path contract.
    **Verified by:** scope-validate outputs structured text

    Both scope-validate and handoff render plain text with === SECTION ===
    markers (today: the MCP tools' rendered-text channel alongside the typed
    projection bundle).

  # ===========================================================================
  # RULE 2: DD-2 - Git Integration Is Opt-In
  # ===========================================================================

  Rule: DD-2 - Git integration is opt-in

    **Invariant:** Domain logic must never invoke shell commands or depend on git directly.
    **Rationale:** Shell dependencies in domain logic make functions untestable without git fixtures and break deterministic behavior.
    **Verified by:** Verified by code review (no executable scenario)

    The handoff surface accepts an opt-in git input. The tool handler
    calls git diff and passes the file list to the pure generator function.
    No shell dependency in domain logic.

  # ===========================================================================
  # RULE 3: DD-3 - Session Type Inferred From FSM Status
  # ===========================================================================

  Rule: DD-3 - Session type inferred from status

    **Invariant:** Every accepted status value must map to exactly one default session type, overridable by an explicit session input.
    **Rationale:** Ambiguous or missing inference forces callers to always specify the session type manually, defeating the ergonomic benefit of status-based defaults.
    **Verified by:** Active pattern infers implement session

    Handoff infers session type from pattern's current status.
    An explicit session input overrides inference.

    | Status | Inferred Session |
    | candidate | planning |
    | roadmap | design |
    | active | implement |
    | completed | review |
    | deferred | design |

  # ===========================================================================
  # RULE 4: DD-4 - Severity Levels Match Process Guard
  # ===========================================================================

  Rule: DD-4 - Severity levels match Process Guard model

    **Invariant:** Scope validation must use exactly three severity levels (PASS, BLOCKED, WARN) consistent with Process Guard.
    **Rationale:** Divergent severity models cause confusion when the same violation appears in both systems with different severity classifications.
    **Verified by:** Verified by code review (no executable scenario)

    Scope validation uses three severity levels:

    | Severity | Meaning |
    | PASS | Check passed |
    | BLOCKED | Hard prerequisite missing |
    | WARN | Recommendation not met |

    The strict option promotes WARN to BLOCKED.

  # ===========================================================================
  # RULE 5: DD-5 - Current Date Only For Handoff
  # ===========================================================================

  Rule: DD-5 - Current date only for handoff

    **Invariant:** Handoff must always use the current system date with no override mechanism.
    **Rationale:** A --date flag enables backdating handoff timestamps, which breaks audit trail integrity for multi-session work.
    **Verified by:** Verified by code review (no executable scenario)

    Handoff always uses the current date. No --date flag.

  # ===========================================================================
  # RULE 7: DD-7 - Co-Located Formatter Functions
  # ===========================================================================

  Rule: DD-7 - Co-located formatter functions

    **Invariant:** Each module must export both its data builder and text formatter as co-located functions.
    **Rationale:** Splitting builder and formatter across files increases coupling surface and makes it harder to trace data flow through the module.
    **Verified by:** Verified by code review (no executable scenario)

    Each module (scope-validator.ts, handoff-generator.ts) exports
    both the data builder and the text formatter. Simpler than the
    earlier context-assembler/text-renderer split.

  # ===========================================================================
  # ACCEPTANCE CRITERIA
  # ===========================================================================

  @acceptance-criteria @happy-path
  Scenario: scope-validate outputs structured text
    Given the architect_scope_validate tool receives pattern "MyPattern" and scope type "implement"
    When the handler returns a formatted string
    Then the rendered-text channel carries the string with === SECTION === markers

  @acceptance-criteria @happy-path
  Scenario: Active pattern infers implement session
    Given a pattern with status "active"
    When the architect_handoff tool runs for pattern "MyPattern"
    Then the session summary shows session type "implement"
