@libar-docs
@libar-docs-adr:004
@libar-docs-adr-status:accepted
@libar-docs-adr-category:architecture
@libar-docs-pattern:PDR001SessionWorkflowCommands
@libar-docs-status:roadmap
@libar-docs-product-area:DataAPI
@libar-docs-depends-on:DataAPIDesignSessionSupport
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

    Both scope-validate and handoff return string from the router, using
    === SECTION === markers. Follows the dual output path where text
    commands bypass JSON.stringify.

  # ===========================================================================
  # RULE 2: DD-2 - Git Integration Is Opt-In
  # ===========================================================================

  Rule: DD-2 - Git integration is opt-in via --git flag

    The handoff command accepts an optional --git flag. The CLI handler
    calls git diff and passes file list to the pure generator function.
    No shell dependency in domain logic.

  # ===========================================================================
  # RULE 3: DD-3 - Session Type Inferred From FSM Status
  # ===========================================================================

  Rule: DD-3 - Session type inferred from FSM status

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

    Handoff always uses the current date. No --date flag.

  # ===========================================================================
  # RULE 6: DD-6 - Both Positional And Flag Forms
  # ===========================================================================

  Rule: DD-6 - Both positional and flag forms for scope type

    scope-validate accepts scope type as both positional argument
    and --type flag.

  # ===========================================================================
  # RULE 7: DD-7 - Co-Located Formatter Functions
  # ===========================================================================

  Rule: DD-7 - Co-located formatter functions

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
    When running "process-api handoff --pattern MyPattern"
    Then the session summary shows session type "implement"
