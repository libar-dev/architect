# Validation Tools

> **Deprecated:** This document is superseded by the auto-generated [Validation Tools Guide](../docs-live/reference/VALIDATION-TOOLS-GUIDE.md). This file is preserved for reference only.

Quick reference for choosing and running the right validation command.

---

## Which Command Do I Run?

```text
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
└─ architect-guard --staged (default)
```

## Command Summary

| Command                   | Purpose                           | When to Use                                   |
| ------------------------- | --------------------------------- | --------------------------------------------- |
| `architect-lint-patterns` | Annotation quality                | Ensure patterns have required tags            |
| `architect-lint-steps`    | vitest-cucumber compatibility     | After writing/modifying feature or step files |
| `architect-guard`         | FSM workflow enforcement          | Pre-commit hooks, CI pipelines                |
| `architect-validate`      | Cross-source + DoD + anti-pattern | Release validation, comprehensive             |

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

12 rules across 3 categories (9 error, 3 warning). For the full validation tool suite overview, see [Which Command Do I Run?](#which-command-do-i-run) above.

### Feature File Rules

These rules scan `.feature` files without needing a Gherkin parser:

| Rule ID                  | Severity | What It Catches                                                          |
| ------------------------ | -------- | ------------------------------------------------------------------------ |
| `hash-in-description`    | error    | `#` at line start inside `"""` block in description — terminates parsing |
| `keyword-in-description` | error    | Description line starting with Given/When/Then/And/But — breaks parser   |
| `duplicate-and-step`     | error    | Multiple `And` steps with identical text in same scenario                |
| `dollar-in-step-text`    | warning  | `$` in step text (outside quotes) causes matching issues                 |
| `hash-in-step-text`      | warning  | Mid-line `#` in step text (outside quotes) silently truncates the step   |

**`hash-in-description` — the most surprising trap:**

```gherkin
# BAD — # inside """ block in description terminates parsing
Rule: My Rule
    """bash
    # This breaks the parser — Gherkin sees a comment, not code
    generate-docs --output docs
    """

# GOOD — move code to a step DocString (safe context)
Scenario: Example usage
  Given the following script:
    """bash
    # Safe inside a real DocString
    generate-docs --output docs
    """
```

**`keyword-in-description`:**

```gherkin
# BAD — starts with "Given", parser interprets as a step
Rule: Authentication
  Given a valid session, the system should...

# GOOD — rephrase to avoid reserved keywords at line start
Rule: Authentication
  A valid session enables the system to...
```

### Step Definition Rules

These rules scan `.steps.ts` files:

| Rule ID                   | Severity | What It Catches                                            |
| ------------------------- | -------- | ---------------------------------------------------------- |
| `regex-step-pattern`      | error    | Regex pattern in step registration — use string patterns   |
| `unsupported-phrase-type` | error    | `{phrase}` in step string — use `{string}` instead         |
| `repeated-step-pattern`   | error    | Same pattern registered twice — second silently overwrites |

**`regex-step-pattern`:**

```typescript
// BAD — regex pattern throws StepAbleStepExpressionError
Given(/a user with id (\d+)/, (_ctx, id) => { ... });

// GOOD — string pattern with Cucumber expression
Given('a user with id {int}', (_ctx, id: number) => { ... });
```

### Cross-File Rules

These rules pair `.feature` and `.steps.ts` files and cross-check them:

| Rule ID                            | Severity | What It Catches                                                      |
| ---------------------------------- | -------- | -------------------------------------------------------------------- |
| `scenario-outline-function-params` | error    | Function params in ScenarioOutline callback (should use variables)   |
| `missing-and-destructuring`        | error    | Feature has `And` steps but step file does not destructure `And`     |
| `missing-rule-wrapper`             | error    | Feature has `Rule:` blocks but step file does not destructure `Rule` |
| `outline-quoted-values`            | warning  | Quoted values in Outline steps instead of `<placeholder>` syntax     |

**The Two-Pattern Problem** — `scenario-outline-function-params` + `outline-quoted-values` form a pair:

```gherkin
# Feature file — BAD (outline-quoted-values)
Scenario Outline: Validate quantity
  When I set quantity to "<quantity>"
  # Should be: When I set quantity to <quantity>

  Examples:
    | quantity |
    | 5        |
```

```typescript
// Step file — BAD (scenario-outline-function-params)
ScenarioOutline('Validate quantity', ({ When }) => {
  When('I set quantity to {string}', (_ctx, qty: string) => {
    // qty is undefined at runtime — {string} does NOT work in ScenarioOutline
  });
});

// GOOD — use variables object
ScenarioOutline('Validate quantity', ({ When }, variables: { quantity: string }) => {
  When('I set quantity to <quantity>', () => {
    const qty = variables.quantity;
  });
});
```

**`missing-and-destructuring`:**

```typescript
// BAD — And not destructured, causes StepAbleUnknowStepError
describeFeature(feature, ({ Given, When, Then }) => { ... });

// GOOD — And is available for feature And steps
describeFeature(feature, ({ Given, When, Then, And }) => { ... });
```

### CLI Reference

| Flag               | Short | Description                | Default  |
| ------------------ | ----- | -------------------------- | -------- |
| `--strict`         |       | Treat warnings as errors   | false    |
| `--format <type>`  |       | Output: `pretty` or `json` | `pretty` |
| `--base-dir <dir>` | `-b`  | Base directory for paths   | cwd      |

**Scan scope** (hardcoded defaults):

```
Feature files:  tests/features/**/*.feature
                architect/specs/**/*.feature
                architect/decisions/**/*.feature
Step files:     tests/steps/**/*.steps.ts
```

**Exit codes:**

| Code | Meaning                                        |
| ---- | ---------------------------------------------- |
| `0`  | No errors (warnings allowed unless `--strict`) |
| `1`  | Errors found (or warnings with `--strict`)     |

---

## lint-process

FSM validation for delivery workflow (PDR-005). Enforces status transitions and protection levels.

```bash
# Pre-commit (default)
npx architect-guard --staged

# CI pipeline
npx architect-guard --all --strict
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

Cross-source validation now consumes the `PatternGraph` via the shared pipeline factory (`buildPatternGraph()`) with `mergeConflictStrategy: 'concatenate'`. This enables implements-aware matching through `relationshipIndex.implementedBy` — the validator no longer re-derives cross-source relationships from raw scanner output.

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
    "lint:process": "architect-guard --staged",
    "lint:process:ci": "architect-guard --all --strict",
    "validate:all": "validate-patterns -i 'src/**/*.ts' -F 'specs/**/*.feature' --dod --anti-patterns"
  }
}
```

### Pre-commit Hook

```bash
# .husky/pre-commit
npx architect-guard --staged
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

| Code | `architect-lint-patterns` / `architect-lint-steps` / `architect-guard` | `architect-validate`                  |
| ---- | ---------------------------------------------------------------------- | ------------------------------------- |
| `0`  | No errors (warnings allowed unless `--strict`)                         | No issues found                       |
| `1`  | Errors found (or warnings with `--strict`)                             | Errors found                          |
| `2`  | —                                                                      | Warnings found (with `--strict` only) |

---

## Programmatic API

All validation tools expose programmatic APIs. Import from subpaths:

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

`validatePatterns()` now accepts a `RuntimePatternGraph`. Build one via `buildPatternGraph()` from `@libar-dev/architect/generators`.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed API documentation.

---

## Related Documentation

| Document                                     | Content                                      |
| -------------------------------------------- | -------------------------------------------- |
| [GHERKIN-PATTERNS.md](./GHERKIN-PATTERNS.md) | Gherkin authoring patterns and writing guide |
| [PROCESS-GUARD.md](./PROCESS-GUARD.md)       | FSM rules, error fixes, escapes              |
| [TAXONOMY.md](./TAXONOMY.md)                 | Tag taxonomy concepts and API                |
| [ARCHITECTURE.md](./ARCHITECTURE.md)         | Programmatic API details                     |
