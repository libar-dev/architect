@libar-docs
@libar-docs-pattern:LintProcessCli
@libar-docs-status:completed
@libar-docs-product-area:DataAPI
@libar-docs-implements:CliBehaviorTesting
@cli @lint-process
Feature: lint-process CLI
  Command-line interface for validating changes against delivery process rules.

  Background:
    Given a temporary working directory

  # ============================================================================
  # RULE 1: Help and Version
  # ============================================================================

  Rule: CLI displays help and version information

    **Invariant:** The --help/-h and --version/-v flags must produce usage/version output and exit successfully without requiring other arguments.
    **Rationale:** Help and version are universal CLI conventions — both short and long flag forms must work for discoverability and scripting compatibility.
    **Verified by:** Display help with --help flag, Display help with -h flag, Display version with --version flag, Display version with -v flag

    @happy-path
    Scenario: Display help with --help flag
      When running "lint-process --help"
      Then exit code is 0
      And stdout contains "Usage:"

    @happy-path
    Scenario: Display help with -h flag
      When running "lint-process -h"
      Then exit code is 0
      And stdout contains "--staged"

    @happy-path
    Scenario: Display version with --version flag
      When running "lint-process --version"
      Then exit code is 0
      And stdout contains "lint-process"

    @happy-path
    Scenario: Display version with -v flag
      When running "lint-process -v"
      Then exit code is 0

  # ============================================================================
  # RULE 2: Mode Selection
  # ============================================================================

  Rule: CLI requires git repository for validation

    **Invariant:** The lint-process CLI must fail with a clear error when run outside a git repository in both staged and all modes.
    **Rationale:** Process guard validation depends on git diff for change detection — running without git produces undefined behavior rather than useful validation results.
    **Verified by:** Fail without git repository in staged mode, Fail without git repository in all mode

    @validation
    Scenario: Fail without git repository in staged mode
      When running "lint-process --staged"
      Then exit code is 1
      And output contains "Command failed"

    @validation
    Scenario: Fail without git repository in all mode
      When running "lint-process --all"
      Then exit code is 1
      And output contains "Command failed"

  # ============================================================================
  # RULE 3: File Mode Validation
  # ============================================================================

  Rule: CLI validates file mode input

    **Invariant:** In file mode, the CLI must require at least one file path via positional argument or --file flag, and fail with a clear error when none is provided.
    **Rationale:** File mode is for targeted validation of specific files — accepting zero files would silently produce a "no violations" result that falsely implies the files are valid.
    **Verified by:** Fail when files mode has no files, Accept file via positional argument, Accept file via --file flag

    @validation
    Scenario: Fail when files mode has no files
      Given a git repository
      When running "lint-process --files"
      Then exit code is 1
      And output contains "No files specified"

    @happy-path
    Scenario: Accept file via positional argument
      Given a git repository
      And a feature file "specs/test.feature" with status "roadmap"
      When running "lint-process specs/test.feature"
      Then exit code is 0

    @happy-path
    Scenario: Accept file via --file flag
      Given a git repository
      And a feature file "specs/test.feature" with status "roadmap"
      When running "lint-process --file specs/test.feature"
      Then exit code is 0

  # ============================================================================
  # RULE 4: No Changes Handling
  # ============================================================================

  Rule: CLI handles no changes gracefully

    **Invariant:** When no relevant changes are detected (empty diff), the CLI must exit successfully with a zero exit code.
    **Rationale:** No changes means no violations are possible — failing on empty diffs would break CI pipelines on commits that only modify non-spec files.
    **Verified by:** No changes detected exits successfully

    @happy-path
    Scenario: No changes detected exits successfully
      Given a git repository
      When running "lint-process --staged"
      Then exit code is 0
      And stdout contains "No changes detected"

  # ============================================================================
  # RULE 5: Output Formats
  # ============================================================================

  Rule: CLI supports multiple output formats

    **Invariant:** The CLI must support JSON and pretty (human-readable) output formats, with pretty as the default.
    **Rationale:** Pretty format serves interactive pre-commit use while JSON format enables CI/CD pipeline integration and automated violation processing.
    **Verified by:** JSON output format, Pretty output format is default

    @happy-path
    Scenario: JSON output format
      Given a git repository
      When running "lint-process --staged --format json"
      Then exit code is 0

    @happy-path
    Scenario: Pretty output format is default
      Given a git repository
      When running "lint-process --staged"
      Then exit code is 0
      And stdout contains "validating"

  # ============================================================================
  # RULE 6: Debug Options
  # ============================================================================

  Rule: CLI supports debug options

    **Invariant:** The --show-state flag must display the derived process state (FSM states, protection levels, deliverables) without affecting validation behavior.
    **Rationale:** Process guard decisions are derived from complex state — exposing the intermediate state helps developers understand why a specific validation passed or failed.
    **Verified by:** Show state flag displays derived state

    @happy-path
    Scenario: Show state flag displays derived state
      Given a git repository
      When running "lint-process --staged --show-state"
      Then exit code is 0
      And stdout contains "Derived Process State"

  # ============================================================================
  # RULE 7: Unknown Flags
  # ============================================================================

  Rule: CLI warns about unknown flags

    **Invariant:** Unrecognized CLI flags must produce a warning message but allow execution to continue.
    **Rationale:** Process validation is critical-path at commit time — hard-failing on a typo in an optional flag would block commits unnecessarily when the core validation would succeed.
    **Verified by:** Warn on unknown flag but continue

    @validation
    Scenario: Warn on unknown flag but continue
      Given a git repository
      When running "lint-process --unknown-flag --staged"
      Then exit code is 0
      And output contains "Warning"
