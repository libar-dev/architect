# ✅ Lint Process Cli

**Purpose:** Detailed requirements for the Lint Process Cli feature

---

## Overview

| Property     | Value     |
| ------------ | --------- |
| Status       | completed |
| Product Area | DataAPI   |

## Description

Command-line interface for validating changes against delivery process rules.

## Acceptance Criteria

**Display help with --help flag**

- When running "lint-process --help"
- Then exit code is 0
- And stdout contains "Usage:"

**Display help with -h flag**

- When running "lint-process -h"
- Then exit code is 0
- And stdout contains "--staged"

**Display version with --version flag**

- When running "lint-process --version"
- Then exit code is 0
- And stdout contains "lint-process"

**Display version with -v flag**

- When running "lint-process -v"
- Then exit code is 0

**Fail without git repository in staged mode**

- When running "lint-process --staged"
- Then exit code is 1
- And output contains "Command failed"

**Fail without git repository in all mode**

- When running "lint-process --all"
- Then exit code is 1
- And output contains "Command failed"

**Fail when files mode has no files**

- Given a git repository
- When running "lint-process --files"
- Then exit code is 1
- And output contains "No files specified"

**Accept file via positional argument**

- Given a git repository
- And a feature file "specs/test.feature" with status "roadmap"
- When running "lint-process specs/test.feature"
- Then exit code is 0

**Accept file via --file flag**

- Given a git repository
- And a feature file "specs/test.feature" with status "roadmap"
- When running "lint-process --file specs/test.feature"
- Then exit code is 0

**No changes detected exits successfully**

- Given a git repository
- When running "lint-process --staged"
- Then exit code is 0
- And stdout contains "No changes detected"

**JSON output format**

- Given a git repository
- When running "lint-process --staged --format json"
- Then exit code is 0

**Pretty output format is default**

- Given a git repository
- When running "lint-process --staged"
- Then exit code is 0
- And stdout contains "validating"

**Show state flag displays derived state**

- Given a git repository
- When running "lint-process --staged --show-state"
- Then exit code is 0
- And stdout contains "Derived Process State"

**Warn on unknown flag but continue**

- Given a git repository
- When running "lint-process --unknown-flag --staged"
- Then exit code is 0
- And output contains "Warning"

## Business Rules

**CLI displays help and version information**

_Verified by: Display help with --help flag, Display help with -h flag, Display version with --version flag, Display version with -v flag_

**CLI requires git repository for validation**

_Verified by: Fail without git repository in staged mode, Fail without git repository in all mode_

**CLI validates file mode input**

_Verified by: Fail when files mode has no files, Accept file via positional argument, Accept file via --file flag_

**CLI handles no changes gracefully**

_Verified by: No changes detected exits successfully_

**CLI supports multiple output formats**

_Verified by: JSON output format, Pretty output format is default_

**CLI supports debug options**

_Verified by: Show state flag displays derived state_

**CLI warns about unknown flags**

_Verified by: Warn on unknown flag but continue_

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
