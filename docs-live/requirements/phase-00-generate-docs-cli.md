# ✅ Generate Docs Cli

**Purpose:** Detailed requirements for the Generate Docs Cli feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Product Area | DataAPI |

## Description

Command-line interface for generating documentation from annotated TypeScript.

## Acceptance Criteria

**Display help with --help flag**

- When running "generate-docs --help"
- Then exit code is 0
- And stdout contains "Usage:"

**Display version with -v flag**

- When running "generate-docs -v"
- Then exit code is 0

**Fail without --input flag**

- When running "generate-docs -o docs"
- Then exit code is 1
- And output contains "No source files specified"

**List generators with --list-generators**

- When running "generate-docs --list-generators"
- Then exit code is 0
- And stdout contains "patterns"

**Generate patterns documentation**

- Given a TypeScript file "src/pattern.ts" with pattern annotations
- When running "generate-docs -i src/pattern.ts -g patterns -o docs -f"
- Then exit code is 0
- And file "docs/PATTERNS.md" exists in working directory

**Use default generator (patterns) when not specified**

- Given a TypeScript file "src/pattern.ts" with pattern annotations
- When running "generate-docs -i src/pattern.ts -o docs -f"
- Then exit code is 0
- And stdout contains "patterns"

**Unknown option causes error**

- When running "generate-docs --unknown-flag"
- Then exit code is 1
- And output contains "Unknown option"

## Business Rules

**CLI displays help and version information**

_Verified by: Display help with --help flag, Display version with -v flag_

**CLI requires input patterns**

_Verified by: Fail without --input flag_

**CLI lists available generators**

_Verified by: List generators with --list-generators_

**CLI generates documentation from source files**

_Verified by: Generate patterns documentation, Use default generator (patterns) when not specified_

**CLI rejects unknown options**

_Verified by: Unknown option causes error_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
