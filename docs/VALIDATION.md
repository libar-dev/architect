# Validation Tools

Quick reference for choosing and running the right validation command.

---

## Which Command Do I Run?

```
Need to check annotation quality?
├─ Yes → lint-patterns
│
Need FSM workflow validation?
├─ Yes → lint-process
│
Need cross-source or DoD validation?
├─ Yes → validate-patterns
│
Running pre-commit hook?
└─ lint-process --staged (default)
```

## Command Summary

| Command             | Purpose                           | When to Use                        |
| ------------------- | --------------------------------- | ---------------------------------- |
| `lint-patterns`     | Annotation quality                | Ensure patterns have required tags |
| `lint-process`      | FSM workflow enforcement          | Pre-commit hooks, CI pipelines     |
| `validate-patterns` | Cross-source + DoD + anti-pattern | Release validation, comprehensive  |

---

## lint-patterns

Validates `@<prefix>-*` annotation quality in TypeScript files.

```bash
# Basic usage
npx lint-patterns -i "src/**/*.ts"

# Strict mode (CI)
npx lint-patterns -i "src/**/*.ts" --strict
```

### CLI Flags

| Flag                     | Short | Description                         | Default  |
| ------------------------ | ----- | ----------------------------------- | -------- |
| `--input <pattern>`      | `-i`  | Glob pattern (required, repeatable) | required |
| `--exclude <pattern>`    | `-e`  | Exclude pattern (repeatable)        | -        |
| `--base-dir <dir>`       | `-b`  | Base directory                      | cwd      |
| `--strict`               |       | Treat warnings as errors            | false    |
| `--format <type>`        | `-f`  | Output: `pretty` or `json`          | `pretty` |
| `--quiet`                | `-q`  | Only show errors                    | false    |
| `--min-severity <level>` |       | `error`, `warning`, `info`          | -        |

### Rules

| Rule                       | Severity | What It Checks                      |
| -------------------------- | -------- | ----------------------------------- |
| `missing-pattern-name`     | error    | Must have `@<prefix>-pattern`       |
| `invalid-status`           | error    | Status must be valid FSM value      |
| `tautological-description` | error    | Description cannot just repeat name |
| `missing-status`           | warning  | Should have status tag              |
| `missing-when-to-use`      | warning  | Should have "When to Use" section   |
| `missing-relationships`    | info     | Consider adding uses/used-by        |

---

## lint-process

FSM validation for delivery workflow (PDR-005). Enforces status transitions and protection levels.

```bash
# Pre-commit (default)
npx lint-process --staged

# CI pipeline
npx lint-process --all --strict
```

**What it validates:**

- Status transitions follow FSM (`roadmap` -> `active` -> `completed`)
- Completed specs require unlock reason to modify
- Active specs cannot add new deliverables (scope protection)
- Session scope rules (optional)

**Detailed rules and escape hatches:** See [PROCESS-GUARD.md](./PROCESS-GUARD.md)

---

## validate-patterns

Cross-source validator combining multiple checks.

```bash
# Full validation suite
npx validate-patterns \
  -i "src/**/*.ts" \
  -F "specs/**/*.feature" \
  --dod \
  --anti-patterns
```

### CLI Flags

| Flag                        | Short | Description                                      | Default  |
| --------------------------- | ----- | ------------------------------------------------ | -------- |
| `--input`                   | `-i`  | Glob for TypeScript files (required, repeatable) | required |
| `--features`                | `-F`  | Glob for Gherkin files (required, repeatable)    | required |
| `--exclude`                 | `-e`  | Exclude pattern (repeatable)                     | -        |
| `--base-dir`                | `-b`  | Base directory                                   | cwd      |
| `--strict`                  |       | Treat warnings as errors                         | false    |
| `--format`                  | `-f`  | Output: `pretty` or `json`                       | `pretty` |
| `--dod`                     |       | Enable Definition of Done validation             | false    |
| `--phase`                   |       | Validate specific phase (repeatable)             | -        |
| `--anti-patterns`           |       | Enable anti-pattern detection                    | false    |
| `--scenario-threshold`      |       | Max scenarios per feature                        | 20       |
| `--mega-feature-threshold`  |       | Max lines per feature                            | 500      |
| `--magic-comment-threshold` |       | Max magic comments                               | 5        |

### Checks Available

| Flag              | What It Validates                             |
| ----------------- | --------------------------------------------- |
| `--dod`           | Completed patterns have all deliverables done |
| `--anti-patterns` | Dual-source ownership rules not violated      |
| `--cross-source`  | Feature/TypeScript metadata consistency       |

### Architecture Note (ADR-006)

Cross-source validation now consumes the `MasterDataset` via the shared pipeline factory (`buildMasterDataset()`) with `mergeConflictStrategy: 'concatenate'`. This enables implements-aware matching through `relationshipIndex.implementedBy` — the validator no longer re-derives cross-source relationships from raw scanner output.

Raw scans are retained only for DoD and anti-pattern detection, which are stage-1 consumers that validate annotation syntax directly on scanned files (no relationship resolution needed).

### Anti-Pattern Detection

Enforces dual-source architecture ownership:

| Tag Type               | Correct Location | Wrong Location  |
| ---------------------- | ---------------- | --------------- |
| `@<prefix>-uses`       | TypeScript code  | Feature files   |
| `@<prefix>-depends-on` | Feature files    | TypeScript code |
| `@<prefix>-quarter`    | Feature files    | TypeScript code |
| `@<prefix>-team`       | Feature files    | TypeScript code |

### DoD Validation

For patterns with `completed` status, checks:

- All deliverables marked complete (checkmark, "Done", "Complete")
- At least one `@acceptance-criteria` scenario exists

---

## CI/CD Integration

### Recommended package.json Scripts

```json
{
  "scripts": {
    "lint:patterns": "lint-patterns -i 'src/**/*.ts'",
    "lint:process": "lint-process --staged",
    "lint:process:ci": "lint-process --all --strict",
    "validate:all": "validate-patterns -i 'src/**/*.ts' -F 'specs/**/*.feature' --dod --anti-patterns"
  }
}
```

### Pre-commit Hook

```bash
# .husky/pre-commit
npx lint-process --staged
```

### GitHub Actions

```yaml
- name: Lint annotations
  run: npx lint-patterns -i "src/**/*.ts" --strict

- name: Validate patterns
  run: npx validate-patterns -i "src/**/*.ts" -F "specs/**/*.feature" --dod --anti-patterns
```

---

## Exit Codes

All commands follow the same convention:

| Code | Meaning                                        |
| ---- | ---------------------------------------------- |
| `0`  | No errors (warnings allowed unless `--strict`) |
| `1`  | Errors found (or warnings with `--strict`)     |

---

## Programmatic API

All validation tools expose programmatic APIs. Import from subpaths:

```typescript
// Pattern linting
import { lintFiles, hasFailures } from '@libar-dev/delivery-process/lint';

// Process guard
import { deriveProcessState, validateChanges } from '@libar-dev/delivery-process/lint';

// Anti-patterns and DoD
import { detectAntiPatterns, validateDoD } from '@libar-dev/delivery-process/validation';
```

`validatePatterns()` now accepts a `RuntimeMasterDataset`. Build one via `buildMasterDataset()` from `@libar-dev/delivery-process/generators/pipeline`.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed API documentation.

---

## Related Documentation

| Document                               | Content                         |
| -------------------------------------- | ------------------------------- |
| [PROCESS-GUARD.md](./PROCESS-GUARD.md) | FSM rules, error fixes, escapes |
| [TAXONOMY.md](./TAXONOMY.md)           | Tag taxonomy concepts and API   |
| [ARCHITECTURE.md](./ARCHITECTURE.md)   | Programmatic API details        |
