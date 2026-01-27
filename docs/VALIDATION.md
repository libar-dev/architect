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

### Rules

| Rule                       | Severity | What It Checks                      |
| -------------------------- | -------- | ----------------------------------- |
| `missing-pattern-name`     | error    | Must have `@<prefix>-pattern`       |
| `invalid-status`           | error    | Status must be valid FSM value      |
| `tautological-description` | error    | Description cannot just repeat name |
| `missing-status`           | warning  | Should have status tag              |
| `missing-when-to-use`      | warning  | Should have "When to Use" section   |
| `missing-relationships`    | info     | Consider adding uses/used-by        |

**Full CLI reference:** See [INSTRUCTIONS.md](../INSTRUCTIONS.md#lint-patterns)

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

**Full CLI reference:** See [INSTRUCTIONS.md](../INSTRUCTIONS.md#lint-process)

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

### Checks Available

| Flag              | What It Validates                             |
| ----------------- | --------------------------------------------- |
| `--dod`           | Completed patterns have all deliverables done |
| `--anti-patterns` | Dual-source ownership rules not violated      |
| `--cross-source`  | Feature/TypeScript metadata consistency       |

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

**Full CLI reference:** See [INSTRUCTIONS.md](../INSTRUCTIONS.md#validate-patterns)

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

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed API documentation.

---

## Related Documentation

| Document                               | Content                         |
| -------------------------------------- | ------------------------------- |
| [PROCESS-GUARD.md](./PROCESS-GUARD.md) | FSM rules, error fixes, escapes |
| [INSTRUCTIONS.md](../INSTRUCTIONS.md)  | Full CLI reference              |
| [ARCHITECTURE.md](./ARCHITECTURE.md)   | Programmatic API details        |
