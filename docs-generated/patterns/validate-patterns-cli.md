# ✅ Validate Patterns Cli

**Purpose:** Detailed documentation for the Validate Patterns Cli pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | Cli |

## Description

Command-line interface for cross-validating TypeScript patterns vs Gherkin feature files.

## Acceptance Criteria

**Display help with --help flag**

- When running "validate-patterns --help"
- Then exit code is 0
- And stdout contains "Usage:"

**Display help with -h flag**

- When running "validate-patterns -h"
- Then exit code is 0
- And stdout contains "--input"

**Display version with --version flag**

- When running "validate-patterns --version"
- Then exit code is 0
- And stdout contains "validate-patterns"

**Display version with -v flag**

- When running "validate-patterns -v"
- Then exit code is 0

**Fail without --input flag**

- When running "validate-patterns -F features/*.feature"
- Then exit code is 1
- And stderr contains "No TypeScript sources specified"

**Fail without --features flag**

- When running "validate-patterns -i src/*.ts"
- Then exit code is 1
- And stderr contains "No feature files specified"

**Validation passes for matching patterns**

- Given a TypeScript file "src/pattern.ts" with pattern "TestPattern" at phase 1 status "completed"
- And a Gherkin file "features/test.feature" with pattern "TestPattern" at phase 1 status "completed"
- When running "validate-patterns -i src/*.ts -F features/*.feature"
- Then exit code is 0
- And stdout contains "All validations passed"

**Detect phase mismatch between sources**

- Given a TypeScript file "src/pattern.ts" with pattern "MismatchPattern" at phase 1 status "active"
- And a Gherkin file "features/test.feature" with pattern "MismatchPattern" at phase 2 status "active"
- When running "validate-patterns -i src/*.ts -F features/*.feature"
- Then exit code is 1
- And stdout contains "Phase mismatch"

**Detect status mismatch between sources**

- Given a TypeScript file "src/pattern.ts" with pattern "StatusMismatch" at phase 1 status "active"
- And a Gherkin file "features/test.feature" with pattern "StatusMismatch" at phase 1 status "completed"
- When running "validate-patterns -i src/*.ts -F features/*.feature"
- Then exit code is 1
- And stdout contains "Status mismatch"

**JSON output format**

- Given a TypeScript file "src/pattern.ts" with pattern "JsonTest" at phase 1 status "completed"
- And a Gherkin file "features/test.feature" with pattern "JsonTest" at phase 1 status "completed"
- When running "validate-patterns -i src/*.ts -F features/*.feature --format json"
- Then exit code is 0
- And stdout is valid JSON

**Pretty output format is default**

- Given a TypeScript file "src/pattern.ts" with pattern "PrettyTest" at phase 1 status "completed"
- And a Gherkin file "features/test.feature" with pattern "PrettyTest" at phase 1 status "completed"
- When running "validate-patterns -i src/*.ts -F features/*.feature"
- Then exit code is 0
- And stdout contains "Pattern Validation Summary"

**Strict mode exits with code 2 on warnings**

- Given a TypeScript file "src/pattern.ts" with pattern "StrictTest" at phase 1 status "active"
- When running "validate-patterns -i src/*.ts -F features/*.feature --strict"
- Then exit code is 2

**Non-strict mode passes with warnings**

- Given a TypeScript file "src/pattern.ts" with pattern "NonStrictTest" at phase 1 status "active"
- When running "validate-patterns -i src/*.ts -F features/*.feature"
- Then exit code is 0

**Warn on unknown flag but continue**

- Given a TypeScript file "src/pattern.ts" with pattern "UnknownFlagTest" at phase 1 status "completed"
- And a Gherkin file "features/test.feature" with pattern "UnknownFlagTest" at phase 1 status "completed"
- When running "validate-patterns --unknown-flag -i src/*.ts -F features/*.feature"
- Then exit code is 0
- And output contains "Warning"

## Business Rules

**CLI displays help and version information**

**Invariant:** The --help/-h and --version/-v flags must produce usage/version output and exit successfully without requiring other arguments.
    **Rationale:** Help and version are universal CLI conventions — both short and long flag forms must work for discoverability and scripting compatibility.
    **Verified by:** Display help with --help flag, Display help with -h flag, Display version with --version flag, Display version with -v flag

_Verified by: Display help with --help flag, Display help with -h flag, Display version with --version flag, Display version with -v flag_

**CLI requires input and feature patterns**

**Invariant:** The validate-patterns CLI must fail with clear errors when either --input or --features flags are missing.
    **Rationale:** Cross-source validation requires both TypeScript and Gherkin inputs — running with only one source would produce incomplete validation that misses cross-source mismatches.
    **Verified by:** Fail without --input flag, Fail without --features flag

_Verified by: Fail without --input flag, Fail without --features flag_

**CLI validates patterns across TypeScript and Gherkin sources**

**Invariant:** The validator must detect mismatches between TypeScript and Gherkin sources including phase and status discrepancies.
    **Rationale:** Dual-source architecture requires consistency — a pattern with status "active" in TypeScript but "roadmap" in Gherkin creates conflicting truth and broken reports.
    **Verified by:** Validation passes for matching patterns, Detect phase mismatch between sources, Detect status mismatch between sources

_Verified by: Validation passes for matching patterns, Detect phase mismatch between sources, Detect status mismatch between sources_

**CLI supports multiple output formats**

**Invariant:** The CLI must support JSON and pretty (human-readable) output formats, with pretty as the default.
    **Rationale:** Pretty format serves interactive use while JSON format enables CI/CD pipeline integration and programmatic consumption of validation results.
    **Verified by:** JSON output format, Pretty output format is default

_Verified by: JSON output format, Pretty output format is default_

**Strict mode treats warnings as errors**

**Invariant:** When --strict is enabled, warnings must be promoted to errors causing a non-zero exit code (exit 2); without --strict, warnings must not cause failure.
    **Rationale:** CI pipelines need strict enforcement while local development benefits from lenient mode — the flag lets teams choose their enforcement level.
    **Verified by:** Strict mode exits with code 2 on warnings, Non-strict mode passes with warnings

_Verified by: Strict mode exits with code 2 on warnings, Non-strict mode passes with warnings_

**CLI warns about unknown flags**

**Invariant:** Unrecognized CLI flags must produce a warning message but allow execution to continue.
    **Rationale:** Pattern validation is non-destructive — warning without failing is more user-friendly than hard errors for minor flag typos, while still surfacing the issue.
    **Verified by:** Warn on unknown flag but continue

_Verified by: Warn on unknown flag but continue_

---

[← Back to Pattern Registry](../PATTERNS.md)
