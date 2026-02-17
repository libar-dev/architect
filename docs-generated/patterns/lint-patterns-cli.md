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

**Invariant:** The --help and -v flags must produce usage/version output and exit successfully without requiring other arguments.
    **Rationale:** Help and version are universal CLI conventions — they must work standalone so users can discover usage without reading external documentation.
    **Verified by:** Display help with --help flag, Display version with -v flag

_Verified by: Display help with --help flag, Display version with -v flag_

**CLI requires input patterns**

**Invariant:** The lint-patterns CLI must fail with a clear error when the --input flag is not provided.
    **Rationale:** Without input paths, the linter has nothing to validate — failing early prevents confusing "no violations" output that falsely implies clean annotations.
    **Verified by:** Fail without --input flag

_Verified by: Fail without --input flag_

**Lint passes for valid patterns**

**Invariant:** Fully annotated patterns with all required tags must pass linting with zero violations.
    **Rationale:** False positives erode developer trust in the linter — valid annotations must always pass to maintain the tool's credibility.
    **Verified by:** Lint passes for complete annotations

_Verified by: Lint passes for complete annotations_

**Lint detects violations in incomplete patterns**

**Invariant:** Patterns with missing or incomplete annotations must produce specific violation reports identifying what is missing.
    **Rationale:** Actionable violation messages guide developers to fix annotations — generic "lint failed" messages without specifics waste debugging time.
    **Verified by:** Report violations for incomplete annotations

_Verified by: Report violations for incomplete annotations_

**CLI supports multiple output formats**

**Invariant:** The CLI must support JSON and pretty (human-readable) output formats, with pretty as the default.
    **Rationale:** Pretty format serves interactive use while JSON format enables CI/CD pipeline integration and programmatic consumption of lint results.
    **Verified by:** JSON output format, Pretty output format is default

_Verified by: JSON output format, Pretty output format is default_

**Strict mode treats warnings as errors**

**Invariant:** When --strict is enabled, warnings must be promoted to errors causing a non-zero exit code; without --strict, warnings must not cause failure.
    **Rationale:** CI pipelines need strict enforcement while local development benefits from lenient mode — the flag lets teams choose their enforcement level.
    **Verified by:** Strict mode fails on warnings, Non-strict mode passes with warnings

_Verified by: Strict mode fails on warnings, Non-strict mode passes with warnings_

---

[← Back to Pattern Registry](../PATTERNS.md)
