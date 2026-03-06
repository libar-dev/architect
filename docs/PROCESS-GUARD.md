# Process Guard

> **Generated Reference Available:** Comprehensive error guide with rationale,
> alternatives, and integration recipes is generated at
> `docs-live/reference/PROCESS-GUARD-REFERENCE.md`. Run `pnpm docs:all` to regenerate.

> **Quick reference for `lint-process` validation rules, error fixes, and escape hatches.**

Process Guard validates delivery workflow changes at commit time. For FSM concepts and state definitions, see [METHODOLOGY.md](./METHODOLOGY.md#fsm-enforced-workflow).

---

## Quick Reference

### Protection Levels

| Status      | Level | Allowed                    | Blocked                               |
| ----------- | ----- | -------------------------- | ------------------------------------- |
| `roadmap`   | none  | Full editing               | -                                     |
| `deferred`  | none  | Full editing               | -                                     |
| `active`    | scope | Edit existing deliverables | Adding new deliverables               |
| `completed` | hard  | Nothing                    | Any change without `@*-unlock-reason` |

### Valid Transitions

| From        | To                     | Notes                           |
| ----------- | ---------------------- | ------------------------------- |
| `roadmap`   | `active`, `deferred`   | Start work or postpone          |
| `active`    | `completed`, `roadmap` | Finish or regress if blocked    |
| `deferred`  | `roadmap`              | Resume planning                 |
| `completed` | _(none)_               | Terminal — use unlock to modify |

### Escape Hatches

| Situation                     | Solution                           | Example                                       |
| ----------------------------- | ---------------------------------- | --------------------------------------------- |
| Fix bug in completed spec     | Add `@*-unlock-reason:'reason'`    | `@libar-docs-unlock-reason:'Fix typo'`        |
| Modify outside session scope  | `--ignore-session` flag            | `lint-process --staged --ignore-session`      |
| CI treats warnings as errors  | `--strict` flag                    | `lint-process --all --strict`                 |
| Skip workflow (legacy import) | Multiple transitions in one commit | Set `roadmap` then `completed` in same commit |

---

## Error Messages and Fixes

### `completed-protection`

**Error:**

```text
[ERROR] specs/phase-state-machine.feature
  Cannot modify completed spec without unlock reason
  Suggestion: Add @libar-docs-unlock-reason:'reason for modification'
```

**Cause:** File has `@libar-docs-status:completed` but no unlock annotation.

**Fix:** Add unlock reason explaining why modification is necessary:

```gherkin
@libar-docs
@libar-docs-pattern:PhaseStateMachine
@libar-docs-status:completed
@libar-docs-unlock-reason:'Fix incorrect FSM diagram in documentation'
Feature: Phase State Machine
```

**Unlock reason requirements:**

- Minimum **10 characters** (short reasons like "fix" are rejected)
- Cannot be a placeholder: `test`, `xxx`, `bypass`, `temp`, `todo`, `fixme`
- If the reason is invalid, the error still fires — Process Guard treats it as no unlock reason

**Alternative:** If this should be new work, create a new spec instead of modifying completed work.

---

### `invalid-status-transition`

**Error:**

```text
[ERROR] specs/my-feature.feature
  Invalid status transition: roadmap -> completed
  Suggestion: Valid transitions from roadmap: active, deferred
```

**Cause:** Attempted to skip `active` phase.

**Fix:** Follow the FSM path:

```gherkin
# Step 1: Move to active
@libar-docs-status:active

# Step 2: After implementation complete, move to completed
@libar-docs-status:completed
```

**Common invalid transitions:**

| Attempted             | Why Invalid                  | Valid Path                             |
| --------------------- | ---------------------------- | -------------------------------------- |
| `roadmap->completed`  | Must go through `active`     | `roadmap->active->completed`           |
| `deferred->active`    | Must return to roadmap first | `deferred->roadmap->active`            |
| `deferred->completed` | Cannot skip two states       | `deferred->roadmap->active->completed` |
| `completed->*`        | Terminal state               | Use `@*-unlock-reason` to modify       |

---

### `scope-creep`

**Error:**

```text
[ERROR] specs/process-guard-linter.feature
  Cannot add deliverables to active spec: "New unplanned feature"
  Suggestion: Remove new deliverable or revert status to roadmap
```

**Cause:** Added a row to the deliverables table while status is `active`.

**Fix options:**

1. **Remove the new deliverable** — Keep scope locked during implementation
2. **Revert to roadmap** — If scope genuinely needs to expand:
   ```gherkin
   @libar-docs-status:roadmap  # Temporarily revert
   # Add deliverable, then:
   @libar-docs-status:active   # Resume implementation
   ```

**Why this rule exists:** Prevents scope creep during implementation. Plan fully before starting; implement what was planned.

---

### `session-scope` (Warning)

**Warning:**

```text
[WARN] specs/unrelated-feature.feature
  File not in active session scope
  Suggestion: Add to session scope or use --ignore-session
```

**Cause:** Modifying a file not listed in the current session's `scopedSpecs`.

**Fix options:**

1. **Add to session scope** — If this file should be in scope
2. **Use `--ignore-session`** — For intentional out-of-scope changes:
   ```bash
   lint-process --staged --ignore-session
   ```

---

### `session-excluded`

**Error:**

```text
[ERROR] specs/legacy-feature.feature
  File is explicitly excluded from session
  Suggestion: Remove from exclusion list or use --ignore-session
```

**Cause:** File is in the session's `excludedSpecs` list.

**Fix options:**

1. **Remove from exclusion list** — If exclusion was a mistake
2. **Use `--ignore-session`** — For emergency changes:
   ```bash
   lint-process --staged --ignore-session
   ```

---

### `deliverable-removed` (Warning)

**Warning:**

```text
[WARN] specs/active-feature.feature
  Deliverable removed: "Unit tests"
  Suggestion: Document if descoped or completed elsewhere
```

**Cause:** A deliverable was removed from an active spec.

**Fix:** This is informational. If intentional, no action needed. Consider documenting why in a commit message.

---

## CLI Usage

```bash
lint-process [options]
```

### Modes

| Flag       | Description                       | Use Case           |
| ---------- | --------------------------------- | ------------------ |
| `--staged` | Validate staged changes (default) | Pre-commit hooks   |
| `--all`    | Validate all changes vs main      | CI/CD pipelines    |
| `--files`  | Validate specific files           | Development checks |

### Options

| Flag                | Description                            |
| ------------------- | -------------------------------------- |
| `--strict`          | Treat warnings as errors (exit 1)      |
| `--ignore-session`  | Skip session scope rules               |
| `--show-state`      | Debug: show derived process state      |
| `--format json`     | Machine-readable output                |
| `-f, --file <path>` | Specific file to validate (repeatable) |
| `-b, --base-dir`    | Base directory for file resolution     |

### Exit Codes

| Code | Meaning                                      |
| ---- | -------------------------------------------- |
| `0`  | No errors (warnings allowed unless --strict) |
| `1`  | Errors found                                 |

### Examples

```bash
# Pre-commit hook (recommended)
lint-process --staged

# CI pipeline with strict mode
lint-process --all --strict

# Validate specific file
lint-process --file specs/my-feature.feature

# Debug: see what state was derived
lint-process --staged --show-state

# Override session scope for emergency fix
lint-process --staged --ignore-session
```

---

## Pre-commit Setup

### Husky

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-process --staged
```

### package.json

```json
{
  "scripts": {
    "lint:process": "lint-process --staged",
    "lint:process:ci": "lint-process --all --strict"
  }
}
```

---

## Programmatic API

```typescript
import {
  deriveProcessState,
  detectStagedChanges,
  validateChanges,
  hasErrors,
  summarizeResult,
} from '@libar-dev/delivery-process/lint';

// 1. Derive state from annotations
const state = (await deriveProcessState({ baseDir: '.' })).value;

// 2. Detect changes
const changes = detectStagedChanges('.').value;

// 3. Validate
const { result } = validateChanges({
  state,
  changes,
  options: { strict: false, ignoreSession: false },
});

// 4. Handle results
if (hasErrors(result)) {
  console.log(summarizeResult(result));
  for (const v of result.violations) {
    console.log(`[${v.rule}] ${v.file}: ${v.message}`);
    if (v.suggestion) console.log(`  Fix: ${v.suggestion}`);
  }
  process.exit(1);
}
```

### API Functions

| Category | Function                    | Description                       |
| -------- | --------------------------- | --------------------------------- |
| State    | `deriveProcessState(cfg)`   | Build state from file annotations |
| Changes  | `detectStagedChanges(dir)`  | Parse staged git diff             |
| Changes  | `detectBranchChanges(dir)`  | Parse all changes vs main         |
| Changes  | `detectFileChanges(dir, f)` | Parse specific files              |
| Validate | `validateChanges(input)`    | Run all validation rules          |
| Results  | `hasErrors(result)`         | Check for blocking errors         |
| Results  | `hasWarnings(result)`       | Check for warnings                |
| Results  | `summarizeResult(result)`   | Human-readable summary            |

---

## Architecture

Process Guard uses the **Decider pattern**: pure functions with no I/O.

```
deriveProcessState() ─┐
                      ├─► validateChanges() ─► ValidationResult
detectChanges()  ─────┘
```

State is derived from file annotations — there is no separate state file to maintain.

---

## Related Documentation

| Document                           | Content                         |
| ---------------------------------- | ------------------------------- |
| [METHODOLOGY.md](./METHODOLOGY.md) | FSM concepts, state definitions |
| [README.md](../README.md)          | Package overview, quick start   |
| [TAXONOMY.md](./TAXONOMY.md)       | Tag taxonomy concepts and API   |
