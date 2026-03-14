### Process Guard

Process Guard validates delivery workflow changes at commit time using a Decider pattern.

Query validation rules: `pnpm architect:query -- rules --pattern ProcessGuard`
Query protection levels: `pnpm architect:query -- query getProtectionInfo <status>`

#### CLI Usage

```bash
# Pre-commit (default mode)
architect-guard --staged

# CI pipeline with strict mode
architect-guard --all --strict

# Debug: show derived process state
architect-guard --staged --show-state

# Override session scope checking
architect-guard --staged --ignore-session
```

#### Exit Codes

| Code | Meaning                                        |
| ---- | ---------------------------------------------- |
| `0`  | No errors (warnings allowed unless `--strict`) |
| `1`  | Errors found or warnings with `--strict`       |
