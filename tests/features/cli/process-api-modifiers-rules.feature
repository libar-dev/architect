@libar-docs
@libar-docs-pattern:ProcessApiCliModifiersAndRules
@libar-docs-implements:ProcessApiCli
@libar-docs-status:completed
@libar-docs-unlock-reason:'Split-from-original'
@libar-docs-product-area:DataAPI
@cli @process-api
Feature: Process API CLI - Output Modifiers and Rules
  Output modifiers, arch health, and rules subcommand.

  Background:
    Given a temporary working directory

  # ============================================================================
  # RULE 15: Output Modifier Position Independence
  # ============================================================================

  Rule: Output modifiers work when placed after the subcommand

    **Invariant:** Output modifiers (--count, --names-only, --fields) produce identical results regardless of position relative to the subcommand and its filters.

    **Rationale:** Users should not need to memorize argument ordering rules; the CLI should be forgiving.

    **Verified by:** Count modifier after list subcommand returns count, Names-only modifier after list subcommand returns names, Count modifier combined with list filter

    @happy-path
    Scenario: Count modifier after list subcommand returns count
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' list --count"
      Then exit code is 0
      And stdout JSON data is a number

    @happy-path
    Scenario: Names-only modifier after list subcommand returns names
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' list --names-only"
      Then exit code is 0
      And stdout JSON data is a string array

    @happy-path
    Scenario: Count modifier combined with list filter
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' list --status completed --count"
      Then exit code is 0
      And stdout JSON data is a number

  # ============================================================================
  # RULE 16: Graph Health Subcommands
  # ============================================================================

  Rule: CLI arch health subcommands detect graph quality issues

    **Invariant:** Health subcommands (dangling, orphans, blocking) operate on the relationship index, not the architecture index, and return results without requiring arch annotations.

    **Rationale:** Graph quality issues (broken references, isolated patterns, blocked dependencies) are relationship-level concerns that should be queryable even when no architecture metadata exists.

    **Verified by:** Arch dangling returns broken references, Arch orphans returns isolated patterns, Arch blocking returns blocked patterns

    @happy-path
    Scenario: Arch dangling returns broken references
      Given TypeScript files with a dangling reference
      When running "process-api -i 'src/**/*.ts' arch dangling"
      Then exit code is 0
      And stdout JSON data is an array
      And stdout JSON data contains an entry with field "missing"

    @happy-path
    Scenario: Arch orphans returns isolated patterns
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' arch orphans"
      Then exit code is 0
      And stdout JSON data is an array
      And stdout JSON data contains an entry with field "pattern"

    @happy-path
    Scenario: Arch blocking returns blocked patterns
      Given TypeScript files with pattern annotations
      When running "process-api -i 'src/**/*.ts' arch blocking"
      Then exit code is 0
      And stdout JSON data is an array

  # ============================================================================
  # RULE 17: Rules Subcommand
  # ============================================================================

  Rule: CLI rules subcommand queries business rules and invariants

    **Invariant:** The rules subcommand returns structured business rules extracted from Gherkin Rule: blocks, grouped by product area and phase, with parsed invariant and rationale annotations.

    **Rationale:** Live business rule queries replace static generated markdown, enabling on-demand filtering by product area, pattern, and invariant presence.

    **Verified by:** Rules returns business rules from feature files, Rules filters by product area, Rules with count modifier returns totals, Rules with names-only returns flat array

    @happy-path
    Scenario: Rules returns business rules from feature files
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "process-api -i 'src/**/*.ts' -f 'specs/**/*.feature' rules"
      Then exit code is 0
      And stdout JSON data has fields:
        | field            |
        | totalRules       |
        | totalInvariants  |
        | productAreas     |

    @happy-path
    Scenario: Rules filters by product area
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "process-api -i 'src/**/*.ts' -f 'specs/**/*.feature' rules --product-area Validation"
      Then exit code is 0
      And stdout JSON data has field "productAreas"

    @happy-path
    Scenario: Rules with count modifier returns totals
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "process-api -i 'src/**/*.ts' -f 'specs/**/*.feature' rules --count"
      Then exit code is 0
      And stdout JSON data has fields:
        | field            |
        | totalRules       |
        | totalInvariants  |

    @happy-path
    Scenario: Rules with names-only returns flat array
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "process-api -i 'src/**/*.ts' -f 'specs/**/*.feature' rules --names-only"
      Then exit code is 0
      And stdout JSON data is an array

    @validation
    Scenario: Rules filters by pattern name
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "process-api -i 'src/**/*.ts' -f 'specs/**/*.feature' rules --pattern CoreUtilsTest --count"
      Then exit code is 0
      And stdout JSON data has field values:
        | field           | value |
        | totalRules      | 2     |
        | totalInvariants | 1     |

    @validation
    Scenario: Rules with only-invariants excludes rules without invariants
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "process-api -i 'src/**/*.ts' -f 'specs/**/*.feature' rules --only-invariants --count"
      Then exit code is 0
      And stdout JSON data has field values:
        | field           | value |
        | totalRules      | 3     |
        | totalInvariants | 3     |

    @edge-case
    Scenario: Rules product area filter excludes non-matching areas
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "process-api -i 'src/**/*.ts' -f 'specs/**/*.feature' rules --product-area Validation --count"
      Then exit code is 0
      And stdout JSON data has field values:
        | field      | value |
        | totalRules | 2     |

    @edge-case
    Scenario: Rules for non-existent product area returns hint
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "process-api -i 'src/**/*.ts' -f 'specs/**/*.feature' rules --product-area NonExistent --count"
      Then exit code is 0
      And stdout JSON data has field "hint"

    @edge-case
    Scenario: Rules combines product area and only-invariants filters
      Given TypeScript files with pattern annotations
      And Gherkin feature files with business rules
      When running "process-api -i 'src/**/*.ts' -f 'specs/**/*.feature' rules --product-area CoreTypes --only-invariants --count"
      Then exit code is 0
      And stdout JSON data has field values:
        | field           | value |
        | totalRules      | 1     |
        | totalInvariants | 1     |
