@architect
@architect-pattern:ValidatorReadModelConsolidation
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-phase:100
@architect-product-area:Validation
@architect-depends-on:ADR006SingleReadModelArchitecture
@architect-implements:CliBehaviorTesting
@cli @validate-patterns
Feature: Validator Read Model Consolidation — validate-patterns CLI

  **Problem:**
  `validate-patterns.ts` was the only feature consumer that bypassed the
  PatternGraph. It wired its own mini-pipeline (scan + extract + ad-hoc
  matching), created a lossy local type (`GherkinPatternInfo`) that discarded
  relationship data, and failed to resolve architect-implements links.

  **Solution:**
  Refactored `validate-patterns.ts` to consume the PatternGraph as its
  data source for cross-source validation. The validator became a feature
  consumer like codecs and the PatternGraphAPI — querying pre-computed
  views and the relationship index instead of building its own maps.

  Command-line interface for cross-validating TypeScript patterns vs Gherkin feature files.

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
      When running "validate-patterns --help"
      Then exit code is 0
      And stdout contains "Usage:"

    @happy-path
    Scenario: Display help with -h flag
      When running "validate-patterns -h"
      Then exit code is 0
      And stdout contains "--input"

    @happy-path
    Scenario: Display version with --version flag
      When running "validate-patterns --version"
      Then exit code is 0
      And stdout contains "architect-validate"

    @happy-path
    Scenario: Display version with -v flag
      When running "validate-patterns -v"
      Then exit code is 0

  # ============================================================================
  # RULE 2: Input Validation
  # ============================================================================

  Rule: CLI requires input and feature patterns

    **Invariant:** The validate-patterns CLI must fail with clear errors when either --input or --features flags are missing.
    **Rationale:** Cross-source validation requires both TypeScript and Gherkin inputs — running with only one source would produce incomplete validation that misses cross-source mismatches.
    **Verified by:** Fail without --input flag, Fail without --features flag

    @validation
    Scenario: Fail without --input flag
      When running "validate-patterns -F features/*.feature"
      Then exit code is 1
      And stderr contains "No TypeScript sources specified"

    @validation
    Scenario: Fail without --features flag
      When running "validate-patterns -i src/*.ts"
      Then exit code is 1
      And stderr contains "No feature files specified"

  # ============================================================================
  # RULE 3: Cross-Source Validation
  # ============================================================================

  Rule: CLI validates patterns across TypeScript and Gherkin sources

    **Invariant:** The validator must detect mismatches between TypeScript and Gherkin sources including phase and status discrepancies.
    **Rationale:** Dual-source architecture requires consistency — a pattern with status "active" in TypeScript but "roadmap" in Gherkin creates conflicting truth and broken reports.
    **Verified by:** Validation passes for matching patterns, Detect phase mismatch between sources, Detect status mismatch between sources

    @happy-path
    Scenario: Validation passes for matching patterns
      Given a TypeScript file "src/pattern.ts" with pattern "TestPattern" at phase 1 status "completed"
      And a Gherkin file "features/test.feature" with pattern "TestPattern" at phase 1 status "completed"
      When running "validate-patterns -i src/*.ts -F features/*.feature"
      Then exit code is 0
      And stdout contains "All validations passed"

    @validation
    Scenario: Detect phase mismatch between sources
      Given a TypeScript file "src/pattern.ts" with pattern "MismatchPattern" at phase 1 status "active"
      And a Gherkin file "features/test.feature" with pattern "MismatchPattern" at phase 2 status "active"
      When running "validate-patterns -i src/*.ts -F features/*.feature"
      Then exit code is 1
      And stdout contains "Phase mismatch"

    @validation
    Scenario: Detect status mismatch between sources
      Given a TypeScript file "src/pattern.ts" with pattern "StatusMismatch" at phase 1 status "active"
      And a Gherkin file "features/test.feature" with pattern "StatusMismatch" at phase 1 status "completed"
      When running "validate-patterns -i src/*.ts -F features/*.feature"
      Then exit code is 1
      And stdout contains "Status mismatch"

  # ============================================================================
  # RULE 4: Output Formats
  # ============================================================================

  Rule: CLI supports multiple output formats

    **Invariant:** The CLI must support JSON and pretty (human-readable) output formats, with pretty as the default.
    **Rationale:** Pretty format serves interactive use while JSON format enables CI/CD pipeline integration and programmatic consumption of validation results.
    **Verified by:** JSON output format, Pretty output format is default

    @happy-path
    Scenario: JSON output format
      Given a TypeScript file "src/pattern.ts" with pattern "JsonTest" at phase 1 status "completed"
      And a Gherkin file "features/test.feature" with pattern "JsonTest" at phase 1 status "completed"
      When running "validate-patterns -i src/*.ts -F features/*.feature --format json"
      Then exit code is 0
      And stdout is valid JSON

    @happy-path
    Scenario: Pretty output format is default
      Given a TypeScript file "src/pattern.ts" with pattern "PrettyTest" at phase 1 status "completed"
      And a Gherkin file "features/test.feature" with pattern "PrettyTest" at phase 1 status "completed"
      When running "validate-patterns -i src/*.ts -F features/*.feature"
      Then exit code is 0
      And stdout contains "Pattern Validation Summary"

  # ============================================================================
  # RULE 5: Strict Mode
  # ============================================================================

  Rule: Strict mode treats warnings as errors

    **Invariant:** When --strict is enabled, warnings must be promoted to errors causing a non-zero exit code (exit 2); without --strict, warnings must not cause failure.
    **Rationale:** CI pipelines need strict enforcement while local development benefits from lenient mode — the flag lets teams choose their enforcement level.
    **Verified by:** Strict mode exits with code 2 on warnings, Non-strict mode passes with warnings

    @validation
    Scenario: Strict mode exits with code 2 on warnings
      Given a TypeScript file "src/pattern.ts" with pattern "StrictTest" at phase 1 status "active"
      When running "validate-patterns -i src/*.ts -F features/*.feature --strict"
      Then exit code is 2

    @happy-path
    Scenario: Non-strict mode passes with warnings
      Given a TypeScript file "src/pattern.ts" with pattern "NonStrictTest" at phase 1 status "active"
      When running "validate-patterns -i src/*.ts -F features/*.feature"
      Then exit code is 0

  # ============================================================================
  # RULE 6: Unknown Flags
  # ============================================================================

  Rule: CLI warns about unknown flags

    **Invariant:** Unrecognized CLI flags must produce a warning message but allow execution to continue.
    **Rationale:** Pattern validation is non-destructive — warning without failing is more user-friendly than hard errors for minor flag typos, while still surfacing the issue.
    **Verified by:** Warn on unknown flag but continue

    @validation
    Scenario: Warn on unknown flag but continue
      Given a TypeScript file "src/pattern.ts" with pattern "UnknownFlagTest" at phase 1 status "completed"
      And a Gherkin file "features/test.feature" with pattern "UnknownFlagTest" at phase 1 status "completed"
      When running "validate-patterns --unknown-flag -i src/*.ts -F features/*.feature"
      Then exit code is 0
      And output contains "Warning"
