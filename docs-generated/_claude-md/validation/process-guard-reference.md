# ProcessGuardReference

**Purpose:** Compact reference for Claude context
**Detail Level:** summary

---

## Overview

### FSM Protection Levels

- `PROTECTION_LEVELS` - const
- `ProtectionLevel` - type
- `getProtectionLevel` - function
- `isTerminalState` - function
- `isFullyEditable` - function
- `isScopeLocked` - function

### FSM Valid Transitions

- `VALID_TRANSITIONS` - const
- `isValidTransition` - function
- `getValidTransitionsFrom` - function
- `getTransitionErrorMessage` - function

### Validation Rules Types

- `ProcessGuardRule` - type
- `DeciderInput` - interface
- `ValidationResult` - interface
- `ProcessViolation` - interface
- `FileState` - interface

### Decider Function

- `validateChanges` - function

### CLI Config

- `ProcessGuardCLIConfig` - interface

### Escape Hatches

**Context:** Sometimes process rules need to be bypassed for legitimate reasons.

    **Decision:** These escape hatches are available:

| Situation | Solution | Example |
| --- | --- | --- |
| Fix bug in completed spec | Add unlock-reason tag | @libar-docs-unlock-reason:'Fix-typo' |
| Modify outside session scope | Use --ignore-session flag | lint-process --staged --ignore-session |
| CI treats warnings as errors | Use --strict flag | lint-process --all --strict |

### Rule Descriptions

Process Guard validates 6 rules (types extracted from TypeScript):

| Rule | Severity | Human Description |
| --- | --- | --- |
| completed-protection | error | Cannot modify completed specs without unlock-reason |
| invalid-status-transition | error | Status transition must follow FSM |
| scope-creep | error | Cannot add deliverables to active specs |
| session-excluded | error | Cannot modify files excluded from session |
| session-scope | warning | File not in active session scope |
| deliverable-removed | warning | Deliverable was removed (informational) |

### CLI Usage

Process Guard is invoked via the lint-process CLI command.

| Flag | Description | Use Case |
| --- | --- | --- |
| --staged | Validate staged changes (default) | Pre-commit hooks |
| --all | Validate all changes vs main | CI/CD pipelines |
| --strict | Treat warnings as errors | CI enforcement |
| --ignore-session | Skip session scope rules | Emergency changes |
| --show-state | Show derived process state | Debugging |
| --format json | Machine-readable output | CI integration |

    **CLI Examples:**

    """bash
    lint-process --staged
    lint-process --all --strict
    lint-process --file specs/my-feature.feature
    lint-process --staged --show-state
    lint-process --staged --ignore-session
    """

### Programmatic API

Process Guard can be used programmatically for custom integrations.

    **Usage Example:**

    """typescript
    import {
      deriveProcessState,
      detectStagedChanges,
      validateChanges,
      hasErrors,
      summarizeResult,
    } from '@libar-dev/delivery-process/lint';

    const state = (await deriveProcessState({ baseDir: '.' })).value;
    const changes = detectStagedChanges('.').value;
    const { result } = validateChanges({
      state,
      changes,
      options: { strict: false, ignoreSession: false },
    });

    if (hasErrors(result)) {
      console.log(summarizeResult(result));
      for (const v of result.violations) {
        console.log(`[${v.rule}] ${v.file}: ${v.message}`);
      }
      process.exit(1);
    }
    """

    **API Functions:**

| Category | Function | Description |
| --- | --- | --- |
| State | deriveProcessState(cfg) | Build state from file annotations |
| Changes | detectStagedChanges(dir) | Parse staged git diff |
| Changes | detectBranchChanges(dir) | Parse all changes vs main |
| Changes | detectFileChanges(dir, f) | Parse specific files |
| Validate | validateChanges(input) | Run all validation rules |
| Results | hasErrors(result) | Check for blocking errors |
| Results | hasWarnings(result) | Check for warnings |
| Results | summarizeResult(result) | Human-readable summary |
