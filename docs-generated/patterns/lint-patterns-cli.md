# ✅ Lint Patterns Cli

**Purpose:** Detailed documentation for the Lint Patterns Cli pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Cli |

## Description

Command-line interface for validating pattern annotation quality.

## Acceptance Criteria

**Display help with --help flag**

- When running "lint-patterns --help"
- Then exit code is 0
- And stdout contains "Usage:"

**Display version with -v flag**

- When running "lint-patterns -v"
- Then exit code is 0

**Fail without --input flag**

- When running "lint-patterns"
- Then exit code is 1
- And output contains "No input patterns"

**Lint passes for complete annotations**

- Given a TypeScript file "src/pattern.ts" with complete annotations
- When running "lint-patterns -i src/pattern.ts"
- Then exit code is 0
- And stdout contains "No issues found"

**Report violations for incomplete annotations**

- Given a TypeScript file "src/missing.ts" without pattern name
- When running "lint-patterns -i src/missing.ts"
- Then exit code is 1
- And stdout contains "error"

**JSON output format**

- Given a TypeScript file "src/pattern.ts" with complete annotations
- When running "lint-patterns -i src/pattern.ts --format json"
- Then exit code is 0
- And stdout is valid JSON

**Pretty output format is default**

- Given a TypeScript file "src/pattern.ts" with complete annotations
- When running "lint-patterns -i src/pattern.ts"
- Then exit code is 0
- And stdout contains "No issues found"

**Strict mode fails on warnings**

- Given a TypeScript file "src/warning.ts" with missing status
- When running "lint-patterns -i src/warning.ts --strict"
- Then exit code is 1

**Non-strict mode passes with warnings**

- Given a TypeScript file "src/warning.ts" with missing status
- When running "lint-patterns -i src/warning.ts"
- Then exit code is 0

## Business Rules

**CLI displays help and version information**

_Verified by: Display help with --help flag, Display version with -v flag_

**CLI requires input patterns**

_Verified by: Fail without --input flag_

**Lint passes for valid patterns**

_Verified by: Lint passes for complete annotations_

**Lint detects violations in incomplete patterns**

_Verified by: Report violations for incomplete annotations_

**CLI supports multiple output formats**

_Verified by: JSON output format, Pretty output format is default_

**Strict mode treats warnings as errors**

_Verified by: Strict mode fails on warnings, Non-strict mode passes with warnings_

---

[← Back to Pattern Registry](../PATTERNS.md)
