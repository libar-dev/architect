### Process Guard

Process Guard validates delivery workflow changes at commit time using a Decider pattern.

Query validation rules: `pnpm process:query -- rules --pattern ProcessGuard`
Query protection levels: `pnpm process:query -- query getProtectionInfo <status>`

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

#### Exit Codes

| Code | Meaning                                        |
| ---- | ---------------------------------------------- |
| `0`  | No errors (warnings allowed unless `--strict`) |
| `1`  | Errors found or warnings with `--strict`       |
