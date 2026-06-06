@architect
@architect-pattern:GenerateDocsCli
@architect-status:completed
@architect-unlock-reason:Retroactive-completion-during-rebrand
@architect-product-area:DataAPI
@architect-uses:MarkdownRenderer
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
    **Verified by:** Generate patterns documentation, Generate docs manifest with projection root classification, Use default generator (patterns) when not specified, Generate docs with disclosure override, Generate docs with status filter override, Generate docs with repeated status filters, --all runs every registered generator plus index

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

    @happy-path
    Scenario: --all runs every registered generator plus index
      Given an architect.config.js mapping sources to a package
      And a TypeScript file "src/pattern.ts" with pattern annotations
      When running "generate-docs --all -o docs -f"
      Then exit code is 0
      And the working directory contains files:
        | path                  |
        | docs/PATTERNS.md      |
        | docs/API-REFERENCE.md |
        | docs/ARCHITECTURE.md  |
        | docs/INDEX.md         |

  # ============================================================================
  # RULE 4b: Determinism check (--check)
  # ============================================================================

  Rule: CLI verifies determinism with --check

    **Invariant:** With --check the CLI re-renders every requested generator and diffs the result against the on-disk files **and the generated-docs manifest**, writing nothing — it exits 0 when they match and non-zero (reporting drift) when an on-disk file or the manifest is absent or stale.
    **Rationale:** The git-based determinism gate (`docs:all && git diff --exit-code`) conflates an uncommitted changeset with a non-deterministic generator and is useless on a dirty tree; --check proves idempotency against the working tree independent of git state. It must cover the manifest too, or a manifest-only drift (a changed root classification / file set) would pass --check yet fail the git gate.
    **Verified by:** Check passes when generated docs match the working tree, Check reports drift when a generated doc is absent, Check reports drift when only the manifest is stale

    @happy-path
    Scenario: Check passes when generated docs match the working tree
      Given a TypeScript file "src/pattern.ts" with pattern annotations
      When running "generate-docs -i src/pattern.ts -g patterns -o docs -f"
      And running "generate-docs -i src/pattern.ts -g patterns -o docs --check"
      Then exit code is 0
      And output contains "no drift"

    @validation
    Scenario: Check reports drift when a generated doc is absent
      Given a TypeScript file "src/pattern.ts" with pattern annotations
      When running "generate-docs -i src/pattern.ts -g patterns -o docs --check"
      Then exit code is 1
      And output contains "not up to date"

    @validation
    Scenario: Check reports drift when only the manifest is stale
      Given a TypeScript file "src/pattern.ts" with pattern annotations
      When running "generate-docs -i src/pattern.ts -g patterns -o docs -f"
      And the generated docs manifest in "docs" is emptied
      And running "generate-docs -i src/pattern.ts -g patterns -o docs --check"
      Then exit code is 1
      And output contains ".generated-docs-manifest.json"

  # ============================================================================
  # RULE 4c: Embedded-region host generation + gate
  # ============================================================================

  Rule: CLI generates and gates embedded-region hosts

    **Invariant:** An embedded-region generator rewrites only the marker-bounded regions of an authored host `.md` that lives OUTSIDE the output directory, preserving the authored prose. A host that is present but missing its markers fails loud (named host + region, no partial write); a host absent in this project is skipped under `--all` so the run stays portable, but an explicit `-g` request for an absent host fails loud (a named host is requested on purpose, so a silent skip there would let a bad path exit 0 with nothing written); a hand-edited region is caught by `--check` even though the host is out of tree. Authored hosts are written LAST — after every regenerable step and after every routed host has rendered — so a validation failure (missing/malformed markers) aborts the run before any host is committed, leaving every authored host byte-untouched. The commit itself replaces each host by an atomic rename of a fully-staged temp (never a truncating in-place write), so a host is never observed half-written; the batch is staged-then-renamed and idempotent, so an interrupted commit completes on re-run rather than being rolled back (it does NOT guarantee every host stays untouched once renames begin).
    **Rationale:** Embedded hosts carry hand-authored, non-regenerable prose, so the engine's promises (fail-loud, never-partial, region-scoped drift, commit-last + atomic-per-host rename) must hold at the CLI boundary — this is what closes the `docs-live`-only coverage hole without ever risking an authored file.
    **Verified by:** An embedded host present but missing its markers fails loudly, An embedded host absent in the project is skipped under --all, An explicit -g request for an absent host fails loud, A hand-edited region in an out-of-tree host fails the determinism gate, A validation failure aborts before any embedded host is committed

    @validation
    Scenario: An embedded host present but missing its markers fails loudly
      Given a TypeScript file "src/pattern.ts" with pattern annotations
      And an embedded host "formal-spec/04-tag-registry.md" with no managed-region markers
      When running "generate-docs -i src/pattern.ts -g taxonomy-formal-spec -f"
      Then exit code is 1
      And output contains all of:
        | text                           |
        | taxonomy-classification        |
        | formal-spec/04-tag-registry.md |

    @boundary
    Scenario: An embedded host absent in the project is skipped under --all
      Given an architect.config.js mapping sources to a package
      And a TypeScript file "src/pattern.ts" with pattern annotations
      When running "generate-docs --all -o docs -f"
      Then exit code is 0
      And output contains "Skipping embedded generator"
      And file "docs/PATTERNS.md" exists in working directory

    @error
    Scenario: An explicit -g request for an absent host fails loud
      Given a TypeScript file "src/pattern.ts" with pattern annotations
      When running "generate-docs -i src/pattern.ts -g taxonomy-formal-spec -f"
      Then exit code is 1
      And output contains "not found"

    @validation
    Scenario: A hand-edited region in an out-of-tree host fails the determinism gate
      Given a TypeScript file "src/pattern.ts" with pattern annotations
      And an embedded host "formal-spec/04-tag-registry.md" with an empty "taxonomy-classification" region
      And running "generate-docs -i src/pattern.ts -g taxonomy-formal-spec -f"
      And the "taxonomy-classification" region in "formal-spec/04-tag-registry.md" is hand-edited
      When running "generate-docs -i src/pattern.ts -g taxonomy-formal-spec --check"
      Then exit code is 1
      And output contains all of:
        | text                           |
        | region drift                   |
        | formal-spec/04-tag-registry.md |

    @boundary
    Scenario: A validation failure aborts before any embedded host is committed
      Given a TypeScript file "src/pattern.ts" with pattern annotations
      And an embedded host "formal-spec/04-tag-registry.md" with an empty "taxonomy-classification" region
      And an embedded host ".agents/skills/architect-base/references/taxonomy.md" with no managed-region markers
      When running "generate-docs -i src/pattern.ts -g taxonomy-formal-spec -g taxonomy-skill -f"
      Then exit code is 1
      And the embedded host "formal-spec/04-tag-registry.md" was left unwritten by the failed run

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
