# ProcessGuardReference

**Purpose:** Compact reference for Claude context
**Detail Level:** summary

---

## Overview

### Protection Levels

**Context:** Different FSM states have different protection levels.

    **Decision:** Protection levels are derived from status:

| Status | Level | Allowed | Blocked |
| --- | --- | --- | --- |
| roadmap | none | Full editing | - |
| deferred | none | Full editing | - |
| active | scope | Edit existing deliverables | Adding new deliverables |
| completed | hard | Nothing | Any change without unlock-reason |

### Valid Transitions

**Context:** Status transitions must follow the FSM to maintain process integrity.

| From | To | Notes |
| --- | --- | --- |
| roadmap | active, deferred | Start work or postpone |
| active | completed, roadmap | Finish or regress if blocked |
| deferred | roadmap | Resume planning |
| completed | (none) | Terminal - use unlock to modify |

    **FSM Diagram:**

    """mermaid
    stateDiagram-v2
        [*] --> roadmap
        roadmap --> active : Start work
        roadmap --> deferred : Postpone
        active --> completed : Finish
        active --> roadmap : Regress (blocked)
        deferred --> roadmap : Resume
        completed --> [*]

        note right of completed : Terminal state
        note right of active : Scope-locked
    """

### Validation Rules

- `ProcessGuardRule` - type
- `DeciderInput` - interface
- `ValidationResult` - interface
- `ProcessViolation` - interface
- `FileState` - interface

### Decider Function

- `validateChanges` - function

### CLI Config

- `ProcessGuardCLIConfig` - interface

### FSM Transitions

- `VALID_TRANSITIONS` - const
- `isValidTransition` - function
- `getValidTransitionsFrom` - function
- `getTransitionErrorMessage` - function

### CLI Examples

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

### API Example

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
