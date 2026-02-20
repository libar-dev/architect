# ✅ Process Api Cli Modifiers And Rules

**Purpose:** Detailed documentation for the Process Api Cli Modifiers And Rules pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Cli |

## Description

Output modifiers, arch health, and rules subcommand.

## Acceptance Criteria

**Count modifier after list subcommand returns count**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' list --count"
- Then exit code is 0
- And stdout JSON data is a number

**Names-only modifier after list subcommand returns names**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' list --names-only"
- Then exit code is 0
- And stdout JSON data is a string array

**Count modifier combined with list filter**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' list --status completed --count"
- Then exit code is 0
- And stdout JSON data is a number

**Arch dangling returns broken references**

- Given TypeScript files with a dangling reference
- When running "process-api -i 'src/**/*.ts' arch dangling"
- Then exit code is 0
- And stdout JSON data is an array
- And stdout JSON data contains an entry with field "missing"

**Arch orphans returns isolated patterns**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' arch orphans"
- Then exit code is 0
- And stdout JSON data is an array
- And stdout JSON data contains an entry with field "pattern"

**Arch blocking returns blocked patterns**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' arch blocking"
- Then exit code is 0
- And stdout JSON data is an array

**Rules returns business rules from feature files**

- Given TypeScript files with pattern annotations
- And Gherkin feature files with business rules
- When running "process-api -i 'src/**/*.ts' -f 'specs/**/*.feature' rules"
- Then exit code is 0
- And stdout JSON data has fields:

| field |
| --- |
| totalRules |
| totalInvariants |
| productAreas |

**Rules filters by product area**

- Given TypeScript files with pattern annotations
- And Gherkin feature files with business rules
- When running "process-api -i 'src/**/*.ts' -f 'specs/**/*.feature' rules --product-area Validation"
- Then exit code is 0
- And stdout JSON data has field "productAreas"

**Rules with count modifier returns totals**

- Given TypeScript files with pattern annotations
- And Gherkin feature files with business rules
- When running "process-api -i 'src/**/*.ts' -f 'specs/**/*.feature' rules --count"
- Then exit code is 0
- And stdout JSON data has fields:

| field |
| --- |
| totalRules |
| totalInvariants |

**Rules with names-only returns flat array**

- Given TypeScript files with pattern annotations
- And Gherkin feature files with business rules
- When running "process-api -i 'src/**/*.ts' -f 'specs/**/*.feature' rules --names-only"
- Then exit code is 0
- And stdout JSON data is an array

**Rules filters by pattern name**

- Given TypeScript files with pattern annotations
- And Gherkin feature files with business rules
- When running "process-api -i 'src/**/*.ts' -f 'specs/**/*.feature' rules --pattern CoreUtilsTest --count"
- Then exit code is 0
- And stdout JSON data has field values:

| field | value |
| --- | --- |
| totalRules | 2 |
| totalInvariants | 1 |

**Rules with only-invariants excludes rules without invariants**

- Given TypeScript files with pattern annotations
- And Gherkin feature files with business rules
- When running "process-api -i 'src/**/*.ts' -f 'specs/**/*.feature' rules --only-invariants --count"
- Then exit code is 0
- And stdout JSON data has field values:

| field | value |
| --- | --- |
| totalRules | 3 |
| totalInvariants | 3 |

**Rules product area filter excludes non-matching areas**

- Given TypeScript files with pattern annotations
- And Gherkin feature files with business rules
- When running "process-api -i 'src/**/*.ts' -f 'specs/**/*.feature' rules --product-area Validation --count"
- Then exit code is 0
- And stdout JSON data has field values:

| field | value |
| --- | --- |
| totalRules | 2 |

**Rules for non-existent product area returns hint**

- Given TypeScript files with pattern annotations
- And Gherkin feature files with business rules
- When running "process-api -i 'src/**/*.ts' -f 'specs/**/*.feature' rules --product-area NonExistent --count"
- Then exit code is 0
- And stdout JSON data has field "hint"

**Rules combines product area and only-invariants filters**

- Given TypeScript files with pattern annotations
- And Gherkin feature files with business rules
- When running "process-api -i 'src/**/*.ts' -f 'specs/**/*.feature' rules --product-area CoreTypes --only-invariants --count"
- Then exit code is 0
- And stdout JSON data has field values:

| field | value |
| --- | --- |
| totalRules | 1 |
| totalInvariants | 1 |

## Business Rules

**Output modifiers work when placed after the subcommand**

**Invariant:** Output modifiers (--count, --names-only, --fields) produce identical results regardless of position relative to the subcommand and its filters.

    **Rationale:** Users should not need to memorize argument ordering rules; the CLI should be forgiving.

    **Verified by:** Count modifier after list subcommand returns count, Names-only modifier after list subcommand returns names, Count modifier combined with list filter

_Verified by: Count modifier after list subcommand returns count, Names-only modifier after list subcommand returns names, Count modifier combined with list filter_

**CLI arch health subcommands detect graph quality issues**

**Invariant:** Health subcommands (dangling, orphans, blocking) operate on the relationship index, not the architecture index, and return results without requiring arch annotations.

    **Rationale:** Graph quality issues (broken references, isolated patterns, blocked dependencies) are relationship-level concerns that should be queryable even when no architecture metadata exists.

    **Verified by:** Arch dangling returns broken references, Arch orphans returns isolated patterns, Arch blocking returns blocked patterns

_Verified by: Arch dangling returns broken references, Arch orphans returns isolated patterns, Arch blocking returns blocked patterns_

**CLI rules subcommand queries business rules and invariants**

**Invariant:** The rules subcommand returns structured business rules extracted from Gherkin Rule: blocks, grouped by product area and phase, with parsed invariant and rationale annotations.

    **Rationale:** Live business rule queries replace static generated markdown, enabling on-demand filtering by product area, pattern, and invariant presence.

    **Verified by:** Rules returns business rules from feature files, Rules filters by product area, Rules with count modifier returns totals, Rules with names-only returns flat array

_Verified by: Rules returns business rules from feature files, Rules filters by product area, Rules with count modifier returns totals, Rules with names-only returns flat array, Rules filters by pattern name, Rules with only-invariants excludes rules without invariants, Rules product area filter excludes non-matching areas, Rules for non-existent product area returns hint, Rules combines product area and only-invariants filters_

---

[← Back to Pattern Registry](../PATTERNS.md)
