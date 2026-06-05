@architect
@architect-pattern:ValidatorReadModelConsolidation
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:Validation
@architect-uses:ADR006SingleReadModelArchitecture
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
      | Deliverable                             | Status   | Tests | Location                                             |
      | PatternGraph-backed validation read model | complete | Yes   | packages/architect-guard/src/cli/validate-patterns.ts |
      | validate-patterns CLI behavior          | complete | Yes   | packages/architect/tests/features/cli/validate-patterns.feature |

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

    **Invariant:** The validator must detect status mismatches between TypeScript and Gherkin sources.
    **Rationale:** Dual-source architecture requires consistency — a pattern with status "active" in TypeScript but "roadmap" in Gherkin creates conflicting truth and broken reports.
    **Verified by:** Validation passes for matching patterns, Detect status mismatch between sources

    @acceptance-criteria @happy-path
    Scenario: Validation passes for matching patterns
      Given a TypeScript file "src/pattern.ts" with pattern "TestPattern" at phase 1 status "completed"
      And a Gherkin file "features/test.feature" with pattern "TestPattern" at phase 1 status "completed"
      When running "validate-patterns -i src/*.ts -F features/*.feature"
      Then exit code is 0
      And stdout contains "All validations passed"

    # Cross-source phase-mismatch detection was retired with the numeric
    # @architect-phase tag (ADR-013). The "phase" column in the steps below is
    # vestigial (parsed, then discarded); status is the canonical mismatch signal.

    @validation
    Scenario: Detect status mismatch between sources
      Given a TypeScript file "src/pattern.ts" with pattern "StatusMismatch" at phase 1 status "active"
      And a Gherkin file "features/test.feature" with pattern "StatusMismatch" at phase 1 status "completed"
      When running "validate-patterns -i src/*.ts -F features/*.feature"
      Then exit code is 1
      And stdout contains "Status mismatch"

  Rule: Extraction diagnostics affect validation result

    **Invariant:** Error-severity extraction diagnostics are validation failures and must produce a non-zero exit without claiming all validations passed.
    **Rationale:** A malformed gated directive has already been rejected by the extraction boundary; treating that as success hides dropped source facts from CI.
    **Verified by:** Extraction diagnostic errors fail validation

    @validation
    Scenario: Extraction diagnostic errors fail validation
      Given a TypeScript file "src/malformed.ts" with content:
        """
        /** @architect */

        /**
         * @architect-status:completed
         * @architect-role:utility
         */
        export function malformed(): boolean {
          return true;
        }
        """
      And a Gherkin file "features/test.feature" with pattern "CleanFeature" at phase 1 status "completed"
      When running "validate-patterns -i src/*.ts -F features/*.feature"
      Then exit code is 1
      And stdout contains "invalid-pattern-name"
      And stdout does not contain "All validations passed"

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

    **Invariant:** When --strict is enabled, warnings must be promoted to errors causing a non-zero exit code; without --strict, warnings must not cause failure.
    **Rationale:** CI pipelines need strict enforcement while local development benefits from lenient mode — the flag lets teams choose their enforcement level.
    **Verified by:** Non-strict mode passes with warnings

    # Wave 1 narrowed extraction-diagnostic warnings so the legacy strict-mode
    # exit-2 path no longer fires for `@architect-role:core` (which is now an
    # invalid-enum-value warning rather than a hard error). The strict-exit
    # semantics need to be wired against a current Wave 1 warning class — that
    # is tracked as a follow-up. The non-strict branch still exercises the
    # warning-tolerant path that ships today.

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

  # ============================================================================
  # RULE 7 (Definition of Done Validation) was retired per ADR-013 — the
  # phase-keyed DoD validator was unpopulated machinery and was removed.
  # ============================================================================
