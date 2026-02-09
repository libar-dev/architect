@libar-docs
@libar-docs-pdr:002
@libar-docs-adr-status:accepted
@libar-docs-adr-category:architecture
@libar-docs-pattern:PDR002SessionWorkflowCommands
@libar-docs-status:roadmap
@libar-docs-product-area:DeliveryProcess
@libar-docs-depends-on:DataAPIDesignSessionSupport
Feature: PDR-002 - Session Workflow Commands Design Decisions

  **Context:**
  DataAPIDesignSessionSupport adds two CLI subcommands: `scope-validate`
  (pre-flight session readiness check) and `handoff` (session-end state
  summary). The context assembly command (`context --session design|implement`)
  already handles session start. These commands complete the session lifecycle.

  **Problem:**
  Several design decisions affect how these commands behave: output format,
  git integration, session type inference, severity levels, formatter
  architecture, date handling, and CLI syntax flexibility.

  **Decision:**
  Seven design decisions (DD-1 through DD-7) are captured below as Rules.

  Background: Decision Context
    Given the following options were considered:
      | Option | Approach | Impact |
      | DD-1a | JSON output | Adds wrapping overhead for AI-consumption commands |
      | DD-1b | Text output with markers | Consistent with context, overview, dep-tree |
      | DD-2a | Always run git diff | Adds shell dependency to pure function |
      | DD-2b | Opt-in git via flag | Keeps core logic pure and testable |
      | DD-3a | Always require session flag | Verbose when FSM state implies session type |
      | DD-3b | Infer from status with override | Ergonomic default, explicit escape hatch |

  Rule: DD-1 - Text output with section markers per ADR-008

    Both scope-validate and handoff return string from the router, using
    === SECTION === markers. This follows the dual output path established
    by ADR-008. Both commands are AI-consumption focused — JSON wrapping
    adds overhead without benefit.

    @acceptance-criteria @happy-path
    Scenario: scope-validate outputs structured text
      Given the CLI receives "scope-validate MyPattern --type implement"
      When the handler returns a formatted string
      Then main() outputs the string directly to stdout
      And the output contains === SCOPE VALIDATION === and === CHECKLIST === markers

    @acceptance-criteria @happy-path
    Scenario: handoff outputs structured text
      Given the CLI receives "handoff --pattern MyPattern"
      When the handler returns a formatted string
      Then main() outputs the string directly to stdout
      And the output contains === HANDOFF === and === COMPLETED === markers

  Rule: DD-2 - Git integration is opt-in via --git flag

    The handoff command accepts an optional --git flag. When present, the
    CLI handler calls git diff and passes the file list to the pure
    generator function. The generator receives modifiedFiles as an optional
    readonly string array — no shell dependency in the domain logic.

    **Rationale:** Pure functions are testable without mocking child_process.
    The git call stays in the CLI handler (I/O boundary), not the generator.

    @acceptance-criteria @happy-path
    Scenario: Handoff without git flag omits files section
      Given a pattern "MyPattern" with active status
      When running "process-api handoff --pattern MyPattern"
      Then the output does not contain === FILES MODIFIED === section

    @acceptance-criteria @happy-path
    Scenario: Handoff with git flag includes modified files
      Given a pattern "MyPattern" with active status
      And git diff reports 3 modified files
      When running "process-api handoff --pattern MyPattern --git"
      Then the output contains === FILES MODIFIED === section
      And the section lists 3 file paths

  Rule: DD-3 - Session type inferred from FSM status

    The handoff command infers session type from the pattern's current
    FSM status. An explicit --session flag overrides inference.

    | Status | Inferred Session |
    | roadmap | design |
    | active | implement |
    | completed | review |
    | deferred | design |

    @acceptance-criteria @happy-path
    Scenario: Active pattern infers implement session
      Given a pattern with status "active"
      When running "process-api handoff --pattern MyPattern"
      Then the session summary shows session type "implement"

  Rule: DD-4 - Severity levels match Process Guard model

    Scope validation uses three severity levels. BLOCKED prevents session
    start. WARN indicates suboptimal readiness but does not block.

    | Severity | Meaning | Example |
    | PASS | Check passed | All dependencies completed |
    | BLOCKED | Hard prerequisite missing | Dependency not completed |
    | WARN | Recommendation not met | No PDR references found |

    The --strict flag (consistent with lint-process) promotes WARN to BLOCKED.

    @acceptance-criteria @happy-path
    Scenario: Missing PDR references produce WARN not BLOCKED
      Given a pattern with no PDR references in stubs
      When running "process-api scope-validate MyPattern --type implement"
      Then the design-decisions check shows "WARN"
      And the verdict is "READY" (warnings do not block)

  Rule: DD-5 - Current date only for handoff

    The handoff command always uses the current date. No --date flag.
    Handoff is run at session end; backdating is a rare edge case not
    worth the API surface area.

  Rule: DD-6 - Both positional and flag forms for scope type

    scope-validate accepts the scope type as either a positional argument
    or a --type flag: both "scope-validate MyPattern implement" and
    "scope-validate MyPattern --type implement" work.

    This matches how dep-tree accepts --depth as both positional and flag.

    @acceptance-criteria @happy-path
    Scenario: Positional scope type works
      Given the CLI receives "scope-validate MyPattern implement"
      Then the scope type is parsed as "implement"

    @acceptance-criteria @happy-path
    Scenario: Flag scope type works
      Given the CLI receives "scope-validate MyPattern --type implement"
      Then the scope type is parsed as "implement"

  Rule: DD-7 - Co-located formatter functions

    Each new module (scope-validator.ts, handoff-generator.ts) exports
    both the data builder and the text formatter. Unlike the
    context-assembler/context-formatter split (justified by ContextBundle
    complexity), these commands are simpler and benefit from co-location.

    **Rationale:** Avoids file proliferation. The formatter for scope
    validation is ~30 lines; separating it into its own file adds
    overhead without benefit. If complexity grows, the split can happen
    later.
