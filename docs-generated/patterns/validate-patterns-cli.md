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

_Verified by: Display help with --help flag, Display help with -h flag, Display version with --version flag, Display version with -v flag_

**CLI requires input and feature patterns**

_Verified by: Fail without --input flag, Fail without --features flag_

**CLI validates patterns across TypeScript and Gherkin sources**

_Verified by: Validation passes for matching patterns, Detect phase mismatch between sources, Detect status mismatch between sources_

**CLI supports multiple output formats**

_Verified by: JSON output format, Pretty output format is default_

**Strict mode treats warnings as errors**

_Verified by: Strict mode exits with code 2 on warnings, Non-strict mode passes with warnings_

**CLI warns about unknown flags**

_Verified by: Warn on unknown flag but continue_

---

[← Back to Pattern Registry](../PATTERNS.md)
