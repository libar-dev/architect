@architect
@architect-pattern:GenerateDocsCli
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:DataAPI
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

    **Invariant:** The --list-generators flag must display all registered generator names without performing any generation, including config-registered reduced-surface generators.
    **Rationale:** Users need to discover available generators before specifying --generator — listing them avoids trial-and-error with invalid generator names and must reflect the project config they are running against.
    **Verified by:** List generators with --list-generators, List generators includes config-registered reduced-surface generators

    @happy-path
    Scenario: List generators with --list-generators
      When running "generate-docs --list-generators"
      Then exit code is 0
      And stdout contains "patterns"

    @happy-path
    Scenario: List generators includes config-registered reduced-surface generators
      Given an architect.config.js with reduced docs generators
      When running "generate-docs --list-generators"
      Then exit code is 0
      And stdout contains all of:
        | text               |
        | traceability       |
        | index              |

  # ============================================================================
  # RULE 4: Generate Documents
  # ============================================================================

  Rule: CLI generates documentation from source files

    **Invariant:** Given valid input patterns and a generator name, the CLI must scan sources, extract patterns, and produce markdown output files.
    **Rationale:** This is the core pipeline — the CLI is the primary entry point for transforming annotated source code into generated documentation.
    **Verified by:** Generate patterns documentation, Generate docs manifest with projection root classification, Use default generator (patterns) when not specified, Generate docs with disclosure override, Generate docs with status filter override, Generate docs with repeated status filters

    @happy-path
    Scenario: Generate patterns documentation
      Given a TypeScript file "src/pattern.ts" with pattern annotations
      When running "generate-docs -i src/pattern.ts -g patterns -o docs -f"
      Then exit code is 0
      And file "docs/PATTERNS.md" exists in working directory

    @happy-path
    Scenario: Generate docs manifest with projection root classification
      Given a TypeScript file "src/pattern.ts" with pattern annotations
      When running "generate-docs -i src/pattern.ts -g patterns -o docs -f"
      Then exit code is 0
      And file "docs/.generated-docs-manifest.json" exists in working directory
      And manifest "docs/.generated-docs-manifest.json" contains generator "patterns" with root "PATTERNS.md"

    @happy-path
    Scenario: Use default generator (patterns) when not specified
      Given a TypeScript file "src/pattern.ts" with pattern annotations
      When running "generate-docs -i src/pattern.ts -o docs -f"
      Then exit code is 0
      And stdout contains "patterns"

    @happy-path
    Scenario: Generate docs with disclosure override
      Given a TypeScript file "src/pattern.ts" with pattern annotations
      When running "generate-docs -i src/pattern.ts -g patterns -o docs -f --disclosure useful"
      Then exit code is 0
      And file "docs/PATTERNS.md" exists in working directory

    @happy-path
    Scenario: Generate docs with status filter override
      Given a TypeScript file "src/completed.ts" with completed pattern annotations
      And a TypeScript file "src/active.ts" with active pattern annotations
      When running "generate-docs -i src/completed.ts -i src/active.ts -g patterns -o docs -f --filter status=completed"
      Then exit code is 0
      And file "docs/PATTERNS.md" contains "CompletedGeneratorPattern"
      And file "docs/PATTERNS.md" does not contain "ActiveGeneratorPattern"

    # Wave 1 pruned the --maturity flag (maturity is now derived from status
    # at projection time, not authored or filterable). Filtering by status
    # remains supported and is exercised by the scenarios above and below.

    @happy-path
    Scenario: Generate docs with repeated status filters
      Given a TypeScript file "src/completed.ts" with completed pattern annotations
      And a TypeScript file "src/active.ts" with active pattern annotations
      When running "generate-docs -i src/completed.ts -i src/active.ts -g patterns -o docs -f --filter status=active --filter status=completed"
      Then exit code is 0
      And file "docs/PATTERNS.md" contains "CompletedGeneratorPattern"
      And file "docs/PATTERNS.md" also contains "ActiveGeneratorPattern"

  # ============================================================================
  # RULE 5: Unknown Options
  # ============================================================================

  Rule: CLI rejects unknown options

    **Invariant:** Unrecognized CLI flags must cause an error with a descriptive message rather than being silently ignored.
    **Rationale:** Silent flag ignoring hides typos and misconfigurations — users typing --ouput instead of --output would get unexpected default behavior without realizing their flag was ignored.
    **Verified by:** Unknown option causes error, Invalid disclosure value causes validation error, Invalid filter value causes validation error, Empty filter value causes validation error

    @validation
    Scenario: Unknown option causes error
      When running "generate-docs --unknown-flag"
      Then exit code is 1
      And output contains "Unknown option"

    @validation
    Scenario: Invalid disclosure value causes validation error
      When running "generate-docs --disclosure verbose"
      Then exit code is 2
      And output contains "--disclosure:"

    @validation
    Scenario: Invalid filter value causes validation error
      When running "generate-docs --filter status=unknown"
      Then exit code is 2
      And output contains "--filter:"

    @validation
    Scenario: Empty filter value causes validation error
      When running "generate-docs --filter status="
      Then exit code is 2
      And output contains "--filter:"
