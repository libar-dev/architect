### Validation Tools Guide

#### Which Command Do I Run?

```text
Need to check annotation quality?
  Yes -> lint-patterns

Need to check vitest-cucumber compatibility?
  Yes -> lint-steps

Need FSM workflow validation?
  Yes -> lint-process

Need cross-source or DoD validation?
  Yes -> validate-patterns

Running pre-commit hook?
  architect-guard --staged (default)
```

#### Command Summary

| Command                   | Purpose                           | When to Use                                   |
| ------------------------- | --------------------------------- | --------------------------------------------- |
| `architect-lint-patterns` | Annotation quality                | Ensure patterns have required tags            |
| `architect-lint-steps`    | vitest-cucumber compatibility     | After writing/modifying feature or step files |
| `architect-guard`         | FSM workflow enforcement          | Pre-commit hooks, CI pipelines                |
| `architect-validate`      | Cross-source + DoD + anti-pattern | Release validation, comprehensive             |

#### lint-patterns

Validates `@<prefix>-*` annotation quality in TypeScript files.

```bash
npx lint-patterns -i "src/**/*.ts"
npx lint-patterns -i "src/**/*.ts" --strict   # CI
```

##### CLI Flags

| Flag                     | Short | Description                         | Default  |
| ------------------------ | ----- | ----------------------------------- | -------- |
| `--input <pattern>`      | `-i`  | Glob pattern (required, repeatable) | required |
| `--exclude <pattern>`    | `-e`  | Exclude pattern (repeatable)        | -        |
| `--base-dir <dir>`       | `-b`  | Base directory                      | cwd      |
| `--strict`               |       | Treat warnings as errors            | false    |
| `--format <type>`        | `-f`  | Output: `pretty` or `json`          | `pretty` |
| `--quiet`                | `-q`  | Only show errors                    | false    |
| `--min-severity <level>` |       | `error`, `warning`, `info`          | -        |

##### Rules

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

#### lint-steps

Static analyzer for vitest-cucumber feature/step compatibility. Catches mismatches that cause cryptic runtime failures.

```bash
pnpm lint:steps              # Standard check
pnpm lint:steps --strict     # CI
```

12 rules across 3 categories (9 error, 3 warning).

##### Feature File Rules

| Rule ID                  | Severity | What It Catches                                                           |
| ------------------------ | -------- | ------------------------------------------------------------------------- |
| `hash-in-description`    | error    | `#` at line start inside `"""` block in description -- terminates parsing |
| `keyword-in-description` | error    | Description line starting with Given/When/Then/And/But -- breaks parser   |
| `duplicate-and-step`     | error    | Multiple `And` steps with identical text in same scenario                 |
| `dollar-in-step-text`    | warning  | `$` in step text (outside quotes) causes matching issues                  |
| `hash-in-step-text`      | warning  | Mid-line `#` in step text (outside quotes) silently truncates the step    |

##### Step Definition Rules

| Rule ID                   | Severity | What It Catches                                             |
| ------------------------- | -------- | ----------------------------------------------------------- |
| `regex-step-pattern`      | error    | Regex pattern in step registration -- use string patterns   |
| `unsupported-phrase-type` | error    | `{phrase}` in step string -- use `{string}` instead         |
| `repeated-step-pattern`   | error    | Same pattern registered twice -- second silently overwrites |

##### Cross-File Rules

| Rule ID                            | Severity | What It Catches                                                      |
| ---------------------------------- | -------- | -------------------------------------------------------------------- |
| `scenario-outline-function-params` | error    | Function params in ScenarioOutline callback (should use variables)   |
| `missing-and-destructuring`        | error    | Feature has `And` steps but step file does not destructure `And`     |
| `missing-rule-wrapper`             | error    | Feature has `Rule:` blocks but step file does not destructure `Rule` |
| `outline-quoted-values`            | warning  | Quoted values in Outline steps instead of `<placeholder>` syntax     |

##### CLI Reference

| Flag               | Short | Description                | Default  |
| ------------------ | ----- | -------------------------- | -------- |
| `--strict`         |       | Treat warnings as errors   | false    |
| `--format <type>`  |       | Output: `pretty` or `json` | `pretty` |
| `--base-dir <dir>` | `-b`  | Base directory for paths   | cwd      |

#### lint-process

FSM validation for delivery workflow. Enforces status transitions and protection levels.

```bash
npx architect-guard --staged          # Pre-commit (default)
npx architect-guard --all --strict    # CI pipeline
```

**What it validates:**

- Status transitions follow FSM (`roadmap` -> `active` -> `completed`)
- Completed specs require unlock reason to modify
- Active specs cannot add new deliverables (scope protection)
- Session scope rules (optional)

For detailed rules, escape hatches, and error fixes, see the [Process Guard Reference](PROCESS-GUARD-REFERENCE.md).

#### validate-patterns

Cross-source validator combining multiple checks.

```bash
npx validate-patterns \
  -i "src/**/*.ts" \
  -F "specs/**/*.feature" \
  --dod \
  --anti-patterns
```

##### CLI Flags

| Flag              | Short | Description                                      | Default  |
| ----------------- | ----- | ------------------------------------------------ | -------- |
| `--input`         | `-i`  | Glob for TypeScript files (required, repeatable) | required |
| `--features`      | `-F`  | Glob for Gherkin files (required, repeatable)    | required |
| `--exclude`       | `-e`  | Exclude pattern (repeatable)                     | -        |
| `--base-dir`      | `-b`  | Base directory                                   | cwd      |
| `--strict`        |       | Treat warnings as errors (exit 2)                | false    |
| `--verbose`       |       | Show info-level messages                         | false    |
| `--format`        | `-f`  | Output: `pretty` or `json`                       | `pretty` |
| `--dod`           |       | Enable Definition of Done validation             | false    |
| `--anti-patterns` |       | Enable anti-pattern detection                    | false    |

##### Anti-Pattern Detection

Detects process metadata tags that belong in feature files but appear in TypeScript code:

| Tag Suffix (Feature-Only) | What It Tracks       |
| ------------------------- | -------------------- |
| `@<prefix>-quarter`       | Timeline metadata    |
| `@<prefix>-team`          | Ownership metadata   |
| `@<prefix>-effort`        | Estimation metadata  |
| `@<prefix>-completed`     | Completion timestamp |

Additional checks:

| ID                | Severity | What It Detects                     |
| ----------------- | -------- | ----------------------------------- |
| `process-in-code` | error    | Feature-only tags found in TS code  |
| `magic-comments`  | warning  | Generator hints in feature files    |
| `scenario-bloat`  | warning  | Too many scenarios per feature file |
| `mega-feature`    | warning  | Feature file exceeds line threshold |

##### DoD Validation

For patterns with `completed` status, checks:

- All deliverables are in a terminal state (`complete`, `n/a`, or `superseded`)
- At least one `@acceptance-criteria` scenario exists in the spec

#### CI/CD Integration

##### Recommended package.json Scripts

```json
{
  "scripts": {
    "lint:patterns": "lint-patterns -i 'src/**/*.ts'",
    "lint:steps": "lint-steps",
    "lint:steps:ci": "lint-steps --strict",
    "lint:process": "architect-guard --staged",
    "lint:process:ci": "architect-guard --all --strict",
    "validate:all": "validate-patterns -i 'src/**/*.ts' -F 'specs/**/*.feature' --dod --anti-patterns"
  }
}
```

##### Pre-commit Hook

```bash
npx architect-guard --staged
```

##### GitHub Actions

```yaml
- name: Lint annotations
  run: npx lint-patterns -i "src/**/*.ts" --strict

- name: Lint steps
  run: npx lint-steps --strict

- name: Validate patterns
  run: npx validate-patterns -i "src/**/*.ts" -F "specs/**/*.feature" --dod --anti-patterns
```

#### Exit Codes

| Code | lint-patterns / lint-steps / lint-process    | validate-patterns                   |
| ---- | -------------------------------------------- | ----------------------------------- |
| `0`  | No errors (warnings allowed unless --strict) | No issues found                     |
| `1`  | Errors found (or warnings with --strict)     | Errors found                        |
| `2`  | --                                           | Warnings found (with --strict only) |

#### Programmatic API

All validation tools expose programmatic APIs:

```typescript
// Pattern linting
import { lintFiles, hasFailures } from '@libar-dev/architect/lint';

// Step linting
import { runStepLint, STEP_LINT_RULES } from '@libar-dev/architect/lint';

// Process guard
import { deriveProcessState, validateChanges } from '@libar-dev/architect/lint';

// Anti-patterns and DoD
import { detectAntiPatterns, validateDoD } from '@libar-dev/architect/validation';
```
