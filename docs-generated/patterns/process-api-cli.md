# ✅ Process Api Cli

**Purpose:** Detailed documentation for the Process Api Cli pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Cli |

## Description

Command-line interface for querying delivery process state via ProcessStateAPI.

## Acceptance Criteria

**Display help with --help flag**

- When running "process-api --help"
- Then exit code is 0
- And stdout contains "Usage:"

**Display version with -v flag**

- When running "process-api -v"
- Then exit code is 0

**No subcommand shows help**

- When running "process-api -i 'src/**/*.ts'"
- Then exit code is 1
- And output contains "Usage:"

**Fail without --input flag when running status**

- When running "process-api status"
- Then exit code is 1
- And output contains "--input"

**Reject unknown options**

- When running "process-api --unknown-flag"
- Then exit code is 1
- And output contains "Unknown option"

**Status shows counts and completion percentage**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' status"
- Then exit code is 0
- And stdout is valid JSON with key "success"

**Query getStatusCounts returns count object**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' query getStatusCounts"
- Then exit code is 0
- And stdout is valid JSON

**Query isValidTransition with arguments**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' query isValidTransition roadmap active"
- Then exit code is 0
- And stdout is valid JSON

**Unknown API method shows error**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' query nonExistentMethod"
- Then exit code is 1
- And output contains "Unknown"

**Pattern lookup returns full detail**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' pattern CompletedPattern"
- Then exit code is 0
- And stdout is valid JSON
- And stdout contains "CompletedPattern"

**Pattern not found shows error**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' pattern NonExistent"
- Then exit code is 1
- And output contains "not found"

**Arch roles lists roles with counts**

- Given TypeScript files with architecture annotations
- When running "process-api -i 'src/**/*.ts' arch roles"
- Then exit code is 0
- And stdout is valid JSON

**Arch context filters to bounded context**

- Given TypeScript files with architecture annotations
- When running "process-api -i 'src/**/*.ts' arch context testctx"
- Then exit code is 0
- And stdout is valid JSON

**Arch layer lists layers with counts**

- Given TypeScript files with architecture annotations
- When running "process-api -i 'src/**/*.ts' arch layer"
- Then exit code is 0
- And stdout is valid JSON

**Query without method name shows error**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' query"
- Then exit code is 1
- And output contains "Usage:"

**Pattern without name shows error**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' pattern"
- Then exit code is 1
- And output contains "Usage:"

**Unknown subcommand shows error**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' foobar"
- Then exit code is 1
- And output contains "Unknown subcommand"

**Integer arguments are coerced for phase queries**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' query getPatternsByPhase 1"
- Then exit code is 0

**Double-dash separator is handled gracefully**

- When running "process-api -- --help"
- Then exit code is 0

**List all patterns returns JSON array**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' list"
- Then exit code is 0
- And stdout is valid JSON with key "success"

**List with invalid phase shows error**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' list --phase abc"
- Then exit code is 1
- And output contains "Invalid --phase"

**Search returns matching patterns**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' search Completed"
- Then exit code is 0
- And stdout is valid JSON
- And stdout contains "CompletedPattern"

**Search without query shows error**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' search"
- Then exit code is 1
- And output contains "Usage:"

**Context returns curated text bundle**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' context CompletedPattern"
- Then exit code is 0
- And stdout is non-empty
- And stdout contains "CompletedPattern"

**Context without pattern name shows error**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' context"
- Then exit code is 1
- And output contains "Usage:"

**Overview returns executive summary text**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' overview"
- Then exit code is 0
- And stdout is non-empty
- And stdout contains "PROGRESS"

**Dep-tree returns dependency tree text**

- Given TypeScript files with architecture annotations and dependencies
- When running "process-api -i 'src/**/*.ts' dep-tree ScannerService"
- Then exit code is 0
- And stdout is non-empty

**Tags returns tag usage counts**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' tags"
- Then exit code is 0
- And stdout is valid JSON with key "data"

**Sources returns file inventory**

- Given TypeScript files with pattern annotations
- When running "process-api -i 'src/**/*.ts' sources"
- Then exit code is 0
- And stdout is valid JSON

**Arch neighborhood returns pattern relationships**

- Given TypeScript files with architecture annotations and dependencies
- When running "process-api -i 'src/**/*.ts' arch neighborhood ScannerService"
- Then exit code is 0
- And stdout is valid JSON
- And stdout contains "ScannerService"

**Arch compare returns context comparison**

- Given TypeScript files with two architecture contexts
- When running "process-api -i 'src/**/*.ts' arch compare scanner codec"
- Then exit code is 0
- And stdout is valid JSON

**Arch coverage returns annotation coverage**

- Given TypeScript files with architecture annotations
- When running "process-api -i 'src/**/*.ts' arch coverage"
- Then exit code is 0
- And stdout is valid JSON

**Unannotated finds files missing libar-docs marker**

- Given TypeScript files with mixed annotations
- When running "process-api -i 'src/**/*.ts' unannotated"
- Then exit code is 0
- And stdout is valid JSON

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

## Business Rules

**CLI displays help and version information**

_Verified by: Display help with --help flag, Display version with -v flag, No subcommand shows help_

**CLI requires input flag for subcommands**

_Verified by: Fail without --input flag when running status, Reject unknown options_

**CLI status subcommand shows delivery state**

_Verified by: Status shows counts and completion percentage_

**CLI query subcommand executes API methods**

_Verified by: Query getStatusCounts returns count object, Query isValidTransition with arguments, Unknown API method shows error_

**CLI pattern subcommand shows pattern detail**

_Verified by: Pattern lookup returns full detail, Pattern not found shows error_

**CLI arch subcommand queries architecture**

_Verified by: Arch roles lists roles with counts, Arch context filters to bounded context, Arch layer lists layers with counts_

**CLI shows errors for missing subcommand arguments**

_Verified by: Query without method name shows error, Pattern without name shows error, Unknown subcommand shows error_

**CLI handles argument edge cases**

_Verified by: Integer arguments are coerced for phase queries, Double-dash separator is handled gracefully_

**CLI list subcommand filters patterns**

_Verified by: List all patterns returns JSON array, List with invalid phase shows error_

**CLI search subcommand finds patterns by fuzzy match**

_Verified by: Search returns matching patterns, Search without query shows error_

**CLI context assembly subcommands return text output**

_Verified by: Context returns curated text bundle, Context without pattern name shows error, Overview returns executive summary text, Dep-tree returns dependency tree text_

**CLI tags and sources subcommands return JSON**

_Verified by: Tags returns tag usage counts, Sources returns file inventory_

**CLI extended arch subcommands query architecture relationships**

_Verified by: Arch neighborhood returns pattern relationships, Arch compare returns context comparison, Arch coverage returns annotation coverage_

**CLI unannotated subcommand finds files without annotations**

_Verified by: Unannotated finds files missing libar-docs marker_

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

---

[← Back to Pattern Registry](../PATTERNS.md)
