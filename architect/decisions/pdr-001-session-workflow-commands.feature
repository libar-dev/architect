@architect
@architect-adr:004
@architect-adr-status:accepted
@architect-adr-category:architecture
@architect-pattern:PDR001SessionWorkflowCommands
@architect-status:roadmap
@architect-product-area:DataAPI
@architect-depends-on:DataAPIDesignSessionSupport
Feature: PDR-001 - Session Workflow Commands Design Decisions

  **Context:**
  DataAPIDesignSessionSupport adds `scope-validate` (pre-flight session
  readiness check) and `handoff` (session-end state summary) CLI subcommands.
  Seven design decisions affect how these commands behave.

  **Decision:**
  Seven design decisions (DD-1 through DD-7) captured as Rules below.

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

    Both scope-validate and handoff return string from the router, using
    === SECTION === markers. Follows the dual output path where text
    commands bypass JSON.stringify.

  # ===========================================================================
  # RULE 2: DD-2 - Git Integration Is Opt-In
  # ===========================================================================

  Rule: DD-2 - Git integration is opt-in via --git flag

    **Invariant:** Domain logic must never invoke shell commands or depend on git directly.
    **Rationale:** Shell dependencies in domain logic make functions untestable without git fixtures and break deterministic behavior.
    **Verified by:** N/A — no-shell constraint verified by code review (no exec/spawn calls in domain logic)

    The handoff command accepts an optional --git flag. The CLI handler
    calls git diff and passes file list to the pure generator function.
    No shell dependency in domain logic.

  # ===========================================================================
  # RULE 3: DD-3 - Session Type Inferred From FSM Status
  # ===========================================================================

  Rule: DD-3 - Session type inferred from FSM status

    **Invariant:** Every FSM status must map to exactly one default session type, overridable by an explicit --session flag.
    **Rationale:** Ambiguous or missing inference forces users to always specify --session manually, defeating the ergonomic benefit of status-based defaults.
    **Verified by:** N/A — full mapping table (4 statuses) verified by code review; active→implement example in "Active pattern infers implement session"

    Handoff infers session type from pattern's current FSM status.
    An explicit --session flag overrides inference.

    | Status | Inferred Session |
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
    **Verified by:** N/A — three severity levels defined as type-system enum; verified by code review

    Scope validation uses three severity levels:

    | Severity | Meaning |
    | PASS | Check passed |
    | BLOCKED | Hard prerequisite missing |
    | WARN | Recommendation not met |

    The --strict flag promotes WARN to BLOCKED.

  # ===========================================================================
  # RULE 5: DD-5 - Current Date Only For Handoff
  # ===========================================================================

  Rule: DD-5 - Current date only for handoff

    **Invariant:** Handoff must always use the current system date with no override mechanism.
    **Rationale:** A --date flag enables backdating handoff timestamps, which breaks audit trail integrity for multi-session work.
    **Verified by:** N/A — no --date flag by design; verified by code review and CLI arg inventory

    Handoff always uses the current date. No --date flag.

  # ===========================================================================
  # RULE 6: DD-6 - Both Positional And Flag Forms
  # ===========================================================================

  Rule: DD-6 - Both positional and flag forms for scope type

    **Invariant:** scope-validate must accept scope type as both a positional argument and a --type flag.
    **Rationale:** Supporting only one form creates inconsistency with CLI conventions and forces users to remember which form each subcommand uses.
    **Verified by:** N/A — dual-form acceptance verified by code review (both positional and --type flag parsed in CLI handler)

    scope-validate accepts scope type as both positional argument
    and --type flag.

  # ===========================================================================
  # RULE 7: DD-7 - Co-Located Formatter Functions
  # ===========================================================================

  Rule: DD-7 - Co-located formatter functions

    **Invariant:** Each module must export both its data builder and text formatter as co-located functions.
    **Rationale:** Splitting builder and formatter across files increases coupling surface and makes it harder to trace data flow through the module.
    **Verified by:** N/A — co-location is a module structure decision; verified by code review of scope-validator.ts and handoff-generator.ts exports

    Each module (scope-validator.ts, handoff-generator.ts) exports
    both the data builder and the text formatter. Simpler than the
    context-assembler/context-formatter split.

  # ===========================================================================
  # ACCEPTANCE CRITERIA
  # ===========================================================================

  @acceptance-criteria @happy-path
  Scenario: scope-validate outputs structured text
    Given the CLI receives "scope-validate MyPattern --type implement"
    When the handler returns a formatted string
    Then main() outputs the string directly to stdout

  @acceptance-criteria @happy-path
  Scenario: Active pattern infers implement session
    Given a pattern with status "active"
    When running "pattern-graph-cli handoff --pattern MyPattern"
    Then the session summary shows session type "implement"
