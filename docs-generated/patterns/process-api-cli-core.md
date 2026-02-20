# ✅ Process Api Cli Core

**Purpose:** Detailed documentation for the Process Api Cli Core pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Cli |

## Description

Core CLI infrastructure: help, version, input validation, status, query, pattern, arch basics, missing args, edge cases.

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

---

[← Back to Pattern Registry](../PATTERNS.md)
