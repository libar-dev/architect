@architect
@architect-pattern:LintPatternsCli
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:DataAPI
@architect-implements:CliBehaviorTesting
@cli @lint-patterns
Feature: lint-patterns CLI
  Command-line interface for validating pattern annotation quality.

  Background:
    Given a temporary working directory

  # ============================================================================
  # RULE 1: Help and Version
  # ============================================================================

  Rule: CLI displays help and version information

    **Invariant:** The --help and -v flags must produce usage/version output and exit successfully without requiring other arguments.
    **Rationale:** Help and version are universal CLI conventions — they must work standalone so users can discover usage without reading external documentation.
    **Verified by:** Display help with --help flag, Display version with -v flag

    @happy-path
    Scenario: Display help with --help flag
      When running "lint-patterns --help"
      Then exit code is 0
      And stdout contains "Usage:"

    @happy-path
    Scenario: Display version with -v flag
      When running "lint-patterns -v"
      Then exit code is 0

  # ============================================================================
  # RULE 2: Input Validation
  # ============================================================================

  Rule: CLI requires input patterns

    **Invariant:** The lint-patterns CLI must fail with a clear error when the --input flag is not provided.
    **Rationale:** Without input paths, the linter has nothing to validate — failing early prevents confusing "no violations" output that falsely implies clean annotations.
    **Verified by:** Fail without --input flag

    @validation
    Scenario: Fail without --input flag
      When running "lint-patterns"
      Then exit code is 1
      And output contains "No input patterns"

  # ============================================================================
  # RULE 3: Lint Passes
  # ============================================================================

  Rule: Lint passes for valid patterns

    **Invariant:** Fully annotated patterns with all required tags must pass linting with zero violations.
    **Rationale:** False positives erode developer trust in the linter — valid annotations must always pass to maintain the tool's credibility.
    **Verified by:** Lint passes for complete annotations

    @happy-path
    Scenario: Lint passes for complete annotations
      Given a TypeScript file "src/pattern.ts" with complete annotations
      When running "lint-patterns -i src/pattern.ts"
      Then exit code is 0
      And stdout contains "No issues found"

  # ============================================================================
  # RULE 4: Lint Rule Enforcement
  # ============================================================================

  Rule: Lint detects violations in incomplete patterns

    **Invariant:** Patterns with missing or incomplete annotations must produce specific violation reports identifying what is missing.
    **Rationale:** Actionable violation messages guide developers to fix annotations — generic "lint failed" messages without specifics waste debugging time.
    **Verified by:** Report violations for incomplete annotations

    @validation
    Scenario: Report violations for incomplete annotations
      Given a TypeScript file "src/missing.ts" without pattern name
      When running "lint-patterns -i src/missing.ts"
      Then exit code is 1
      And stdout contains "error"

  # ============================================================================
  # RULE 5: Output Formats
  # ============================================================================

  Rule: CLI supports multiple output formats

    **Invariant:** The CLI must support JSON and pretty (human-readable) output formats, with pretty as the default.
    **Rationale:** Pretty format serves interactive use while JSON format enables CI/CD pipeline integration and programmatic consumption of lint results.
    **Verified by:** JSON output format, Pretty output format is default

    @happy-path
    Scenario: JSON output format
      Given a TypeScript file "src/pattern.ts" with complete annotations
      When running "lint-patterns -i src/pattern.ts --format json"
      Then exit code is 0
      And stdout is valid JSON

    @happy-path
    Scenario: Pretty output format is default
      Given a TypeScript file "src/pattern.ts" with complete annotations
      When running "lint-patterns -i src/pattern.ts"
      Then exit code is 0
      And stdout contains "No issues found"

  # ============================================================================
  # RULE 6: Strict Mode
  # ============================================================================

  Rule: Strict mode treats warnings as errors

    **Invariant:** When --strict is enabled, warnings must be promoted to errors causing a non-zero exit code; without --strict, warnings must not cause failure.
    **Rationale:** CI pipelines need strict enforcement while local development benefits from lenient mode — the flag lets teams choose their enforcement level.
    **Verified by:** Strict mode fails on warnings, Non-strict mode passes with warnings

    @validation
    Scenario: Strict mode fails on warnings
      Given a TypeScript file "src/warning.ts" with missing status
      When running "lint-patterns -i src/warning.ts --strict"
      Then exit code is 1

    @happy-path
    Scenario: Non-strict mode passes with warnings
      Given a TypeScript file "src/warning.ts" with missing status
      When running "lint-patterns -i src/warning.ts"
      Then exit code is 0
