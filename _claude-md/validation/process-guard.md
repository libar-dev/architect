### Process Guard

Process Guard validates delivery workflow changes at commit time using a Decider pattern.

#### 7 Validation Rules

| Rule ID                       | Severity | Description                                         |
| ----------------------------- | -------- | --------------------------------------------------- |
| `completed-protection`        | error    | Completed specs require `@libar-docs-unlock-reason` |
| `invalid-status-transition`   | error    | Must follow FSM path                                |
| `scope-creep`                 | error    | Active specs cannot add new deliverables            |
| `session-excluded`            | error    | Cannot modify explicitly excluded files             |
| `missing-relationship-target` | warning  | Relationship target pattern not found               |
| `session-scope`               | warning  | File outside session scope                          |
| `deliverable-removed`         | warning  | Deliverable was removed                             |

#### Protection Levels

| Status      | Protection   | Allowed Actions                | Blocked Actions               |
| ----------- | ------------ | ------------------------------ | ----------------------------- |
| `roadmap`   | None         | Full editing, add deliverables | -                             |
| `deferred`  | None         | Full editing, add deliverables | -                             |
| `active`    | Scope-locked | Edit existing deliverables     | Adding new deliverables       |
| `completed` | Hard-locked  | Nothing                        | Any change without unlock tag |

#### CLI Usage

```bash
# Pre-commit (default mode)
lint-process --staged

# CI pipeline with strict mode
lint-process --all --strict

# Debug: show derived process state
lint-process --staged --show-state

# Override session scope checking
lint-process --staged --ignore-session
```

#### CLI Options

| Flag               | Description                             |
| ------------------ | --------------------------------------- |
| `--staged`         | Validate staged files only (pre-commit) |
| `--all`            | Validate all tracked files (CI)         |
| `--strict`         | Treat warnings as errors (exit 1)       |
| `--ignore-session` | Skip session scope validation           |
| `--show-state`     | Debug: show derived process state       |
| `--format json`    | Machine-readable JSON output            |

#### Exit Codes

| Code | Meaning                                        |
| ---- | ---------------------------------------------- |
| `0`  | No errors (warnings allowed unless `--strict`) |
| `1`  | Errors found or warnings with `--strict`       |
