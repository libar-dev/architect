@libar-docs
@libar-docs-pattern:CliBehaviorTesting
@libar-docs-status:roadmap
@libar-docs-phase:101
@libar-docs-effort:3d
@libar-docs-product-area:DeliveryProcess
@libar-docs-business-value:ensure-cli-commands-work-correctly-with-all-argument-combinations
@libar-docs-priority:high
@libar-docs-executable-specs:tests/features/cli
Feature: CLI Behavior Testing

  **Problem:**
  All 5 CLI commands (generate-docs, lint-patterns, lint-process, validate-patterns,
  generate-tag-taxonomy) have zero behavior specs. These are user-facing interfaces
  that need comprehensive testing for argument parsing, error handling, and output formats.

  **Solution:**
  Create behavior specs for each CLI command covering:
  - Argument parsing (all flags and combinations)
  - Error handling (missing/invalid input)
  - Output format validation (JSON, pretty)
  - Exit code behavior

  **Business Value:**
  | Benefit | How |
  | Reliability | CLI commands work correctly in all scenarios |
  | User Experience | Clear error messages for invalid usage |
  | CI/CD Integration | Predictable exit codes for automation |

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Tests | Test Type | Location |
      | generate-docs CLI tests | pending | Yes | integration | tests/features/cli/generate-docs.feature |
      | lint-patterns CLI tests | pending | Yes | integration | tests/features/cli/lint-patterns.feature |
      | lint-process CLI tests | pending | Yes | integration | tests/features/cli/lint-process.feature |
      | validate-patterns CLI tests | pending | Yes | integration | tests/features/cli/validate-patterns.feature |
      | generate-tag-taxonomy CLI tests | pending | Yes | unit | tests/features/cli/generate-tag-taxonomy.feature |
      | CLI test step definitions | pending | Yes | - | tests/steps/cli/ |

  # ============================================================================
  # RULE 1: generate-docs CLI
  # ============================================================================

  Rule: generate-docs handles all argument combinations correctly

    **Invariant:** Invalid arguments produce clear error messages with usage hints.
    Valid arguments produce expected output files.

    **API:** See `src/cli/generate-docs.ts`

    **Verified by:** Argument parsing, Generator selection, Output file creation

    @acceptance-criteria @happy-path
    Scenario: Generate specific document type
      Given TypeScript files with @libar-docs annotations
      And feature files with pattern metadata
      When running "generate-docs -g patterns -o docs"
      Then PATTERNS.md is created in docs directory
      And exit code is 0

    @acceptance-criteria @happy-path
    Scenario: Generate multiple document types
      Given source files with pattern metadata
      When running "generate-docs -g patterns,roadmap,remaining -o docs"
      Then PATTERNS.md, ROADMAP.md, and REMAINING-WORK.md are created
      And exit code is 0

    @acceptance-criteria @validation
    Scenario: Unknown generator name fails with helpful error
      Given source files with pattern metadata
      When running "generate-docs -g invalid-generator -o docs"
      Then exit code is 1
      And error message contains "Unknown generator: invalid-generator"
      And available generators are listed

    @acceptance-criteria @validation
    Scenario: Missing required input fails with usage hint
      When running "generate-docs -g patterns"
      Then exit code is 1
      And error message contains "missing required"

  # ============================================================================
  # RULE 2: lint-patterns CLI
  # ============================================================================

  Rule: lint-patterns validates annotation quality with configurable strictness

    **Invariant:** Lint violations are reported with file, line, and severity.
    Exit codes reflect violation presence based on strictness setting.

    **API:** See `src/cli/lint-patterns.ts`

    **Verified by:** Lint execution, Strict mode, Output formats

    @acceptance-criteria @happy-path
    Scenario: Lint passes for valid annotations
      Given TypeScript files with complete @libar-docs annotations
      When running "lint-patterns -i 'src/**/*.ts'"
      Then exit code is 0
      And output indicates "No violations found"

    @acceptance-criteria @validation
    Scenario: Lint fails for missing pattern name
      Given TypeScript file with @libar-docs but no @libar-docs-pattern
      When running "lint-patterns -i 'src/**/*.ts'"
      Then exit code is 1
      And output contains "missingPatternName" violation

    @acceptance-criteria @happy-path
    Scenario: JSON output format
      Given TypeScript files with lint violations
      When running "lint-patterns -i 'src/**/*.ts' --format json"
      Then output is valid JSON
      And JSON includes violations array with severity, message, file, line

    @acceptance-criteria @validation
    Scenario: Strict mode treats warnings as errors
      Given TypeScript files with warning-level violations only
      When running "lint-patterns -i 'src/**/*.ts' --strict"
      Then exit code is 1

  # ============================================================================
  # RULE 3: validate-patterns CLI
  # ============================================================================

  Rule: validate-patterns performs cross-source validation with DoD checks

    **Invariant:** DoD and anti-pattern violations are reported per phase.
    Exit codes reflect validation state.

    **API:** See `src/cli/validate-patterns.ts`

    **Verified by:** DoD validation, Anti-pattern detection, Phase filtering

    @acceptance-criteria @happy-path
    Scenario: DoD validation for specific phase
      Given feature files with phase 15 deliverables
      When running "validate-patterns --dod --phase 15"
      Then output shows DoD completion for phase 15
      And deliverable status is summarized

    @acceptance-criteria @validation
    Scenario: Anti-pattern detection
      Given feature files with scenario bloat (>15 scenarios)
      When running "validate-patterns --anti-patterns"
      Then output includes "scenarioBloat" violation
      And affected feature files are listed

    @acceptance-criteria @happy-path
    Scenario: Combined validation modes
      When running "validate-patterns --dod --anti-patterns"
      Then both DoD and anti-pattern results are shown
      And exit code reflects combined status

  # ============================================================================
  # RULE 4: Error handling consistency
  # ============================================================================

  Rule: All CLIs handle errors consistently with DocError pattern

    **Invariant:** Errors include type, file, line (when applicable), and reason.
    Unknown errors are caught and formatted safely.

    **Verified by:** Error formatting, Unknown error handling

    @acceptance-criteria @validation
    Scenario: File not found error includes path
      When running "generate-docs -i 'nonexistent/**/*.ts' -g patterns -o docs"
      Then error message contains file path
      And exit code is 1

    @acceptance-criteria @validation
    Scenario: Parse error includes line number
      Given TypeScript file with invalid JSDoc syntax
      When running "lint-patterns -i 'src/**/*.ts'"
      Then error includes file path and line number

