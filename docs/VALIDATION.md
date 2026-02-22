# Validation Tools

Quick reference for choosing and running the right validation command.

---

## Which Command Do I Run?

```
Need to check annotation quality?
├─ Yes → lint-patterns
│
Need to check vitest-cucumber compatibility?
├─ Yes → lint-steps
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

| Command             | Purpose                           | When to Use                                   |
| ------------------- | --------------------------------- | --------------------------------------------- |
| `lint-patterns`     | Annotation quality                | Ensure patterns have required tags            |
| `lint-steps`        | vitest-cucumber compatibility     | After writing/modifying feature or step files |
| `lint-process`      | FSM workflow enforcement          | Pre-commit hooks, CI pipelines                |
| `validate-patterns` | Cross-source + DoD + anti-pattern | Release validation, comprehensive             |

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

| Rule                             | Severity | What It Checks                                     |
| -------------------------------- | -------- | -------------------------------------------------- |
| `missing-pattern-name`           | error    | Must have `@<prefix>-pattern`                      |
| `invalid-status`                 | error    | Status must be valid FSM value                     |
| `tautological-description`       | error    | Description cannot just repeat name                |
| `pattern-conflict-in-implements` | error    | Pattern cannot implement itself (circular ref)     |
| `missing-relationship-target`    | warning  | Relationship targets must reference known patterns |
| `missing-status`                 | warning  | Should have status tag                             |
| `missing-when-to-use`            | warning  | Should have "When to Use" section                  |
| `missing-relationships`          | info     | Consider adding uses/used-by                       |

---

## lint-steps

Static analyzer for vitest-cucumber feature/step compatibility. Catches mismatches that cause cryptic runtime failures.

```bash
# Standard check
pnpm lint:steps

# Strict mode (CI)
pnpm lint:steps --strict
```

**What it validates:**

- Feature file syntax traps (`#` in descriptions, keywords in descriptions, duplicate And steps)
- Step definition anti-patterns (regex patterns, `{phrase}` usage, repeated registrations)
- Cross-file mismatches (ScenarioOutline param pattern, missing And/Rule destructuring)

12 rules across 3 categories (8 error, 4 warning).

**Detailed rules and examples:** See [GHERKIN-PATTERNS.md — Step Linting](./GHERKIN-PATTERNS.md#step-linting)

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
| `--strict`                  |       | Treat warnings as errors (exit 2)                | false    |
| `--verbose`                 |       | Show info-level messages                         | false    |
| `--format`                  | `-f`  | Output: `pretty` or `json`                       | `pretty` |
| `--dod`                     |       | Enable Definition of Done validation             | false    |
| `--phase`                   |       | Validate specific phase (repeatable)             | -        |
| `--anti-patterns`           |       | Enable anti-pattern detection                    | false    |
| `--scenario-threshold`      |       | Max scenarios per feature                        | 30       |
| `--mega-feature-threshold`  |       | Max lines per feature                            | 750      |
| `--magic-comment-threshold` |       | Max magic comments                               | 5        |

### Checks Available

| Flag              | What It Validates                             |
| ----------------- | --------------------------------------------- |
| (always runs)     | Cross-source Feature/TypeScript consistency   |
| `--dod`           | Completed patterns have all deliverables done |
| `--anti-patterns` | Dual-source ownership rules not violated      |

### Architecture Note (ADR-006)

Cross-source validation now consumes the `MasterDataset` via the shared pipeline factory (`buildMasterDataset()`) with `mergeConflictStrategy: 'concatenate'`. This enables implements-aware matching through `relationshipIndex.implementedBy` — the validator no longer re-derives cross-source relationships from raw scanner output.

Raw scans are retained only for DoD and anti-pattern detection, which are stage-1 consumers that validate annotation syntax directly on scanned files (no relationship resolution needed).

### Anti-Pattern Detection

Detects process metadata tags that belong in feature files but appear in TypeScript code (`process-in-code`):

| Tag Suffix (Feature-Only) | What It Tracks       |
| ------------------------- | -------------------- |
| `@<prefix>-quarter`       | Timeline metadata    |
| `@<prefix>-team`          | Ownership metadata   |
| `@<prefix>-effort`        | Estimation metadata  |
| `@<prefix>-effort-actual` | Actual effort        |
| `@<prefix>-workflow`      | Workflow metadata    |
| `@<prefix>-completed`     | Completion timestamp |

Additional anti-pattern checks:

| ID                | Severity | What It Detects                     |
| ----------------- | -------- | ----------------------------------- |
| `process-in-code` | error    | Feature-only tags found in TS code  |
| `magic-comments`  | warning  | Generator hints in feature files    |
| `scenario-bloat`  | warning  | Too many scenarios per feature file |
| `mega-feature`    | warning  | Feature file exceeds line threshold |

### DoD Validation

For patterns with `completed` status, checks:

- All deliverables are in a terminal state (`complete`, `n/a`, or `superseded`)
- At least one `@acceptance-criteria` scenario exists in the spec

---

## CI/CD Integration

### Recommended package.json Scripts

Add these scripts to your project's `package.json`:

```json
{
  "scripts": {
    "lint:patterns": "lint-patterns -i 'src/**/*.ts'",
    "lint:steps": "lint-steps",
    "lint:steps:ci": "lint-steps --strict",
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

- name: Lint steps
  run: npx lint-steps --strict

- name: Validate patterns
  run: npx validate-patterns -i "src/**/*.ts" -F "specs/**/*.feature" --dod --anti-patterns
```

---

## Exit Codes

| Code | `lint-patterns` / `lint-steps` / `lint-process` | `validate-patterns`                   |
| ---- | ----------------------------------------------- | ------------------------------------- |
| `0`  | No errors (warnings allowed unless `--strict`)  | No issues found                       |
| `1`  | Errors found (or warnings with `--strict`)      | Errors found                          |
| `2`  | —                                               | Warnings found (with `--strict` only) |

---

## Programmatic API

All validation tools expose programmatic APIs. Import from subpaths:

```typescript
// Pattern linting
import { lintFiles, hasFailures } from '@libar-dev/delivery-process/lint';

// Step linting
import { runStepLint, STEP_LINT_RULES } from '@libar-dev/delivery-process/lint';

// Process guard
import { deriveProcessState, validateChanges } from '@libar-dev/delivery-process/lint';

// Anti-patterns and DoD
import { detectAntiPatterns, validateDoD } from '@libar-dev/delivery-process/validation';
```

`validatePatterns()` now accepts a `RuntimeMasterDataset`. Build one via `buildMasterDataset()` from `@libar-dev/delivery-process/generators`.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed API documentation.

---

## Related Documentation

| Document                                     | Content                               |
| -------------------------------------------- | ------------------------------------- |
| [GHERKIN-PATTERNS.md](./GHERKIN-PATTERNS.md) | Step linting rules, examples, and CLI |
| [PROCESS-GUARD.md](./PROCESS-GUARD.md)       | FSM rules, error fixes, escapes       |
| [TAXONOMY.md](./TAXONOMY.md)                 | Tag taxonomy concepts and API         |
| [ARCHITECTURE.md](./ARCHITECTURE.md)         | Programmatic API details              |
