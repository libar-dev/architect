# Process Guard

The Process Guard is an FSM (Finite State Machine) validation system that enforces delivery process rules. It validates changes against protection levels, status transitions, and session scope.

## Overview

Process Guard validates changes before they're committed, ensuring:

- **Completed specs remain stable** (require explicit unlock to modify)
- **Status transitions follow the FSM** (can't skip `active` to reach `completed`)
- **Active specs don't expand scope** (no new deliverables during implementation)
- **Session scoping is respected** (optional workflow constraint)

## Quick Reference: Escape Hatches

When you need to override the normal workflow:

| Situation                      | Escape Hatch                        | When Appropriate                  |
| ------------------------------ | ----------------------------------- | --------------------------------- |
| Fix bug in completed spec      | `@<prefix>-unlock-reason:'reason'`  | Critical bug, documentation error |
| Emergency hotfix outside scope | `--ignore-session`                  | Production incident               |
| Retroactive completion         | Set status directly + unlock-reason | Discovered work was already done  |
| Skip workflow for legacy code  | Multiple transitions in one commit  | Migration from unmanaged codebase |
| CI/CD strict validation        | `--strict`                          | Treat warnings as errors          |

See [Escape Hatches](#escape-hatches) section below for detailed explanations.

---

## Architecture

Process Guard uses the **Decider pattern** from DDD: pure functions with no I/O or side effects.

```
derive-state.ts ──┐
                  ├──► decider.ts ──► ValidationResult
detect-changes.ts─┘
```

| Component           | Purpose                                                |
| ------------------- | ------------------------------------------------------ |
| `derive-state.ts`   | Scans files to build `ProcessState` from annotations   |
| `detect-changes.ts` | Parses git diff to find modified files and transitions |
| `decider.ts`        | Pure validation: `(state, changes, options) → result`  |

**Key insight:** State is derived from file annotations—there's no separate state file to maintain.

---

## Protection Levels

Each status has an associated protection level that determines what modifications are allowed:

| Status      | Protection | What's Allowed             | Restriction                        |
| ----------- | ---------- | -------------------------- | ---------------------------------- |
| `roadmap`   | `none`     | Full editing               | -                                  |
| `active`    | `scope`    | Edit existing deliverables | Cannot add new deliverables        |
| `completed` | `hard`     | Read only                  | Requires `@<prefix>-unlock-reason` |
| `deferred`  | `none`     | Full editing               | -                                  |

**Protection enforcement:**

- **none** — No restrictions, fully editable
- **scope** — Scope-locked, prevents adding new deliverables to prevent scope creep
- **hard** — Hard-locked, requires explicit unlock reason annotation to modify

---

## Validation Rules

Process Guard enforces 6 validation rules:

### Error Rules (Block Commit)

| Rule                        | Description                                          | Fix                                           |
| --------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| `completed-protection`      | Cannot modify completed specs without unlock         | Add `@<prefix>-unlock-reason:'reason'`        |
| `invalid-status-transition` | Status transition must follow FSM                    | Use valid transition path                     |
| `scope-creep`               | Cannot add deliverables to active specs              | Remove new deliverable or revert to `roadmap` |
| `session-excluded`          | Cannot modify files explicitly excluded from session | Remove from exclusion list                    |

### Warning Rules (Informational)

| Rule                  | Description                       | Fix                                            |
| --------------------- | --------------------------------- | ---------------------------------------------- |
| `session-scope`       | File not in active session scope  | Add to session scope or use `--ignore-session` |
| `deliverable-removed` | Deliverable was removed from spec | Document if descoped or completed              |

---

## FSM Transition Matrix

Valid transitions follow this state machine:

```
roadmap ──→ active ──→ completed
   │          │
   │          ↓
   │       roadmap (if blocked/regressed)
   ↓
deferred ──→ roadmap
```

**Transition rules:**

| From        | Valid Targets                   | Notes                               |
| ----------- | ------------------------------- | ----------------------------------- |
| `roadmap`   | `active`, `deferred`, `roadmap` | Can start, defer, or stay           |
| `active`    | `completed`, `roadmap`          | Can finish or regress if blocked    |
| `completed` | _(none)_                        | Terminal state—use unlock to modify |
| `deferred`  | `roadmap`                       | Must reactivate through roadmap     |

**Invalid transitions (will fail):**

- `roadmap` → `completed` — Must go through `active` first
- `deferred` → `active` — Must go through `roadmap` first
- `deferred` → `completed` — Must go through `roadmap` → `active`
- `completed` → anything — Terminal state

---

## Session Scoping

Sessions optionally constrain which files can be modified during a work session. This prevents accidental modifications to unrelated specs.

### Session State

```typescript
interface SessionState {
  id: string; // Session identifier
  status: SessionStatus; // "draft" | "active" | "closed"
  scopedSpecs: string[]; // Files allowed to be modified
  excludedSpecs: string[]; // Files explicitly forbidden
  sessionFile: string; // Path to session definition
}
```

### Session Rules

- **Scoped specs:** Files in `scopedSpecs` can be modified without warnings
- **Excluded specs:** Files in `excludedSpecs` trigger errors (cannot modify)
- **Out of scope:** Other files trigger warnings (can use `--ignore-session` to bypass)

---

## CLI Usage

```bash
lint-process [options] [files...]
```

### Modes

| Flag       | Description                         | Use Case           |
| ---------- | ----------------------------------- | ------------------ |
| `--staged` | Validate staged changes (default)   | Pre-commit hooks   |
| `--all`    | Validate all changes vs main branch | CI/CD pipelines    |
| `--files`  | Validate specific files             | Development checks |

### Options

| Flag                   | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| `-f, --file <path>`    | File to validate (repeatable, implies `--files` mode) |
| `-b, --base-dir <dir>` | Base directory for paths (default: cwd)               |
| `--strict`             | Treat warnings as errors (exit 1 on warnings)         |
| `--ignore-session`     | Ignore session scope rules                            |
| `--show-state`         | Show derived process state (debugging)                |
| `--format <type>`      | Output format: `pretty` (default) or `json`           |
| `-h, --help`           | Show help message                                     |
| `-v, --version`        | Show version number                                   |

### Exit Codes

| Code | Meaning                                        |
| ---- | ---------------------------------------------- |
| `0`  | No errors (warnings allowed unless `--strict`) |
| `1`  | Errors found (or warnings with `--strict`)     |

### Examples

```bash
# Pre-commit hook (default)
lint-process --staged

# CI/CD pipeline (strict mode)
lint-process --all --strict

# Validate specific files
lint-process --file specs/my-feature.feature

# Debugging - show derived state
lint-process --staged --show-state

# JSON output for tooling
lint-process --staged --format json

# Ignore session scope
lint-process --staged --ignore-session
```

---

## Programmatic API

### Basic Usage

```typescript
import {
  deriveProcessState,
  detectStagedChanges,
  detectBranchChanges,
  detectFileChanges,
  validateChanges,
  hasErrors,
  hasWarnings,
  summarizeResult,
} from '@libar-dev/delivery-process/lint';

// 1. Derive state from file annotations
const stateResult = await deriveProcessState({ baseDir: '/path/to/repo' });
if (!stateResult.ok) {
  throw stateResult.error;
}
const state = stateResult.value;

// 2. Detect changes from git
const changesResult = detectStagedChanges('/path/to/repo');
// Or: detectBranchChanges(baseDir) for all changes vs main
// Or: detectFileChanges(baseDir, ["path/to/file.feature"])
if (!changesResult.ok) {
  throw changesResult.error;
}
const changes = changesResult.value;

// 3. Validate
const output = validateChanges({
  state,
  changes,
  options: { strict: false, ignoreSession: false },
});

// 4. Handle results
if (!output.result.valid) {
  console.log(summarizeResult(output.result));
  for (const v of output.result.violations) {
    console.log(`[${v.rule}] ${v.file}: ${v.message}`);
    if (v.suggestion) {
      console.log(`  Fix: ${v.suggestion}`);
    }
  }
}
```

### API Reference

**State Derivation:**

| Function                             | Description                                 |
| ------------------------------------ | ------------------------------------------- |
| `deriveProcessState(config)`         | Derive `ProcessState` from file annotations |
| `getFileState(state, path)`          | Get state for a specific file               |
| `getFilesByProtection(state, level)` | Get files with specific protection level    |
| `isInSessionScope(state, path)`      | Check if file is in session scope           |
| `isSessionExcluded(state, path)`     | Check if file is explicitly excluded        |

**Change Detection:**

| Function                            | Description                        |
| ----------------------------------- | ---------------------------------- |
| `detectStagedChanges(baseDir)`      | Detect staged git changes          |
| `detectBranchChanges(baseDir)`      | Detect all changes vs main branch  |
| `detectFileChanges(baseDir, files)` | Detect changes in specific files   |
| `hasChanges(changes)`               | Check if any changes were detected |
| `getAllChangedFiles(changes)`       | Get all changed file paths         |

**Validation:**

| Function                            | Description                      |
| ----------------------------------- | -------------------------------- |
| `validateChanges(input)`            | Run all validation rules         |
| `hasErrors(result)`                 | Check if result has any errors   |
| `hasWarnings(result)`               | Check if result has any warnings |
| `getAllIssues(result)`              | Get all violations and warnings  |
| `getViolationsByRule(result, rule)` | Filter violations by rule        |
| `summarizeResult(result)`           | Create summary string            |

---

## Pre-commit Integration

Add Process Guard to your git hooks using Husky or similar:

### Husky Setup

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run process guard on staged changes
npx lint-process --staged
```

### package.json Scripts

```json
{
  "scripts": {
    "lint:process": "lint-process --staged",
    "lint:process:ci": "lint-process --all --strict"
  }
}
```

---

## Escape Hatches

### Unlocking Completed Specs

To modify a completed spec, add the unlock reason annotation:

```gherkin
@<prefix>
@<prefix>-pattern:MyPattern
@<prefix>-status:completed
@<prefix>-unlock-reason:'Fixing critical bug in documentation'
Feature: My Pattern
```

The unlock reason should document why the completed spec is being modified.

### Ignoring Session Scope

Use `--ignore-session` flag when you intentionally need to modify files outside the current session scope:

```bash
lint-process --staged --ignore-session
```

### Strict Mode

Use `--strict` in CI/CD to treat warnings as errors:

```bash
lint-process --all --strict
```

---

## Troubleshooting

### "Cannot modify completed spec without unlock reason"

**Cause:** Attempting to modify a file with `@<prefix>-status:completed`.

**Fix:** Add `@<prefix>-unlock-reason:'your reason'` to the file, or consider if the change should go into a new spec instead.

### "Invalid status transition"

**Cause:** Attempting a disallowed status change (e.g., `roadmap` → `completed`).

**Fix:** Follow the FSM path. To mark something completed, first set it to `active`, then to `completed`.

### "Cannot add deliverables to active spec"

**Cause:** Adding new rows to the deliverables table while status is `active`.

**Fix:** Either remove the new deliverable, or revert status to `roadmap` to expand scope.

### "File not in session scope"

**Cause:** Modifying a file not listed in the active session's scope.

**Fix:** Either add the file to the session scope, or use `--ignore-session` if this is intentional.
