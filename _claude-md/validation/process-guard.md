### Process Guard

Process Guard validates delivery workflow changes at commit time using a Decider pattern.

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
