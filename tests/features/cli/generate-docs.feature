@libar-docs
@libar-docs-pattern:GenerateDocsCli
@libar-docs-status:completed
@libar-docs-product-area:DataAPI
@libar-docs-implements:CliBehaviorTesting
@cli @generate-docs
Feature: generate-docs CLI
  Command-line interface for generating documentation from annotated TypeScript.

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
      When running "generate-docs --help"
      Then exit code is 0
      And stdout contains "Usage:"

    @happy-path
    Scenario: Display version with -v flag
      When running "generate-docs -v"
      Then exit code is 0

  # ============================================================================
  # RULE 2: Input Validation
  # ============================================================================

  Rule: CLI requires input patterns

    **Invariant:** The generate-docs CLI must fail with a clear error when the --input flag is not provided.
    **Rationale:** Without input source paths, the generator has nothing to scan — failing early with a clear message prevents confusing "no patterns found" errors downstream.
    **Verified by:** Fail without --input flag

    @validation
    Scenario: Fail without --input flag
      When running "generate-docs -o docs"
      Then exit code is 1
      And output contains "No source files specified"

  # ============================================================================
  # RULE 3: List Generators
  # ============================================================================

  Rule: CLI lists available generators

    **Invariant:** The --list-generators flag must display all registered generator names without performing any generation.
    **Rationale:** Users need to discover available generators before specifying --generator — listing them avoids trial-and-error with invalid generator names.
    **Verified by:** List generators with --list-generators

    @happy-path
    Scenario: List generators with --list-generators
      When running "generate-docs --list-generators"
      Then exit code is 0
      And stdout contains "patterns"

  # ============================================================================
  # RULE 4: Generate Documents
  # ============================================================================

  Rule: CLI generates documentation from source files

    **Invariant:** Given valid input patterns and a generator name, the CLI must scan sources, extract patterns, and produce markdown output files.
    **Rationale:** This is the core pipeline — the CLI is the primary entry point for transforming annotated source code into generated documentation.
    **Verified by:** Generate patterns documentation, Use default generator (patterns) when not specified

    @happy-path
    Scenario: Generate patterns documentation
      Given a TypeScript file "src/pattern.ts" with pattern annotations
      When running "generate-docs -i src/pattern.ts -g patterns -o docs -f"
      Then exit code is 0
      And file "docs/PATTERNS.md" exists in working directory

    @happy-path
    Scenario: Use default generator (patterns) when not specified
      Given a TypeScript file "src/pattern.ts" with pattern annotations
      When running "generate-docs -i src/pattern.ts -o docs -f"
      Then exit code is 0
      And stdout contains "patterns"

  # ============================================================================
  # RULE 5: Unknown Options
  # ============================================================================

  Rule: CLI rejects unknown options

    **Invariant:** Unrecognized CLI flags must cause an error with a descriptive message rather than being silently ignored.
    **Rationale:** Silent flag ignoring hides typos and misconfigurations — users typing --ouput instead of --output would get unexpected default behavior without realizing their flag was ignored.
    **Verified by:** Unknown option causes error

    @validation
    Scenario: Unknown option causes error
      When running "generate-docs --unknown-flag"
      Then exit code is 1
      And output contains "Unknown option"
