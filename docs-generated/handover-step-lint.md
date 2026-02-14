# Handover: Step Lint — Gherkin Test Implementation

## Session State

- **Completed:** Full implementation of `lint-steps` CLI (8 files, 8 rules, all passing)
- **In progress:** None
- **Next:** Gherkin executable specs + step definitions for the 8 lint rules
- **Blockers:** None

## What Was Built

A `lint-steps` CLI that statically detects vitest-cucumber compatibility issues before tests run. No new dependencies — regex-based scanning, reuses existing `LintViolation`/`LintSummary` from the lint engine.

### Architecture

```
src/lint/steps/
  types.ts              — 8 rule definitions (StepLintRule + STEP_LINT_RULES)
  feature-checks.ts     — 3 checks on .feature files
  step-checks.ts        — 2 checks on .steps.ts files
  cross-checks.ts       — 3 checks on paired .feature + .steps.ts
  pair-resolver.ts      — extracts loadFeature() paths, supports resolve() variant
  runner.ts             — orchestrator: glob discovery → pairing → checks → LintSummary
  index.ts              — barrel exports

src/cli/lint-steps.ts   — CLI entry point (same pattern as lint-process.ts)
```

### Current State

- `pnpm typecheck` — passes
- `pnpm lint` — passes
- `pnpm build` — passes
- `pnpm test` — 108/108 test files pass, 7569/7569 tests pass
- `pnpm lint:steps` — 0 errors, 2 warnings ($schema in codec-migration.feature)
- `pnpm lint:steps -- --format json` — JSON output works

### Files Modified

- `package.json` — added `bin.lint-steps`, `scripts.lint:steps`
- `src/lint/index.ts` — added re-exports for step lint module

### Spec

- `delivery-process/specs/step-lint-vitest-cucumber.feature` — roadmap spec with 9 Rules, 16 acceptance scenarios

## What Needs Testing

The spec at `delivery-process/specs/step-lint-vitest-cucumber.feature` defines 16 scenarios across 9 Rules. Tests should go in:

- **Feature file:** `tests/features/lint/step-lint.feature`
- **Step defs:** `tests/steps/lint/step-lint.steps.ts`

### Test Strategy

All 8 check functions are **pure functions** that take `(content: string, filePath: string)` and return `readonly LintViolation[]`. This makes them trivially testable — construct input strings inline, assert on violation count, rule ID, and line number.

The cross-file checks take `(featureContent, stepContent, stepFilePath)` — also pure.

### Key Functions to Test

| Function | File | Signature |
|----------|------|-----------|
| `checkHashInDescription` | `src/lint/steps/feature-checks.ts` | `(content, filePath) → LintViolation[]` |
| `checkDuplicateAndSteps` | `src/lint/steps/feature-checks.ts` | `(content, filePath) → LintViolation[]` |
| `checkDollarInStepText` | `src/lint/steps/feature-checks.ts` | `(content, filePath) → LintViolation[]` |
| `checkRegexStepPatterns` | `src/lint/steps/step-checks.ts` | `(content, filePath) → LintViolation[]` |
| `checkPhraseUsage` | `src/lint/steps/step-checks.ts` | `(content, filePath) → LintViolation[]` |
| `checkScenarioOutlineFunctionParams` | `src/lint/steps/cross-checks.ts` | `(featureContent, stepContent, stepFilePath) → LintViolation[]` |
| `checkMissingAndDestructuring` | `src/lint/steps/cross-checks.ts` | `(featureContent, stepContent, stepFilePath) → LintViolation[]` |
| `checkMissingRuleWrapper` | `src/lint/steps/cross-checks.ts` | `(featureContent, stepContent, stepFilePath) → LintViolation[]` |
| `extractFeaturePath` | `src/lint/steps/pair-resolver.ts` | `(stepFileContent) → string \| null` |

### Test Implementation Notes

1. **Step defs will construct inline strings** as test input — no fixture files needed. Example:

```typescript
Given('a feature file with a Rule description containing a """ block with #', () => {
  state.featureContent = [
    'Feature: Test',
    '',
    '  Rule: My Rule',
    '',
    '    """bash',
    '    # This should be flagged',
    '    some-command',
    '    """',
    '',
    '  Scenario: Test scenario',
    '    Given something',
  ].join('\n');
});

When('the step linter checks the file', () => {
  state.violations = checkHashInDescription(state.featureContent, 'test.feature');
});

Then('a hash-in-description error is reported', () => {
  expect(state.violations).toHaveLength(1);
  expect(state.violations[0].rule).toBe('hash-in-description');
});
```

2. **The spec has `Rule:` blocks** — step defs must use `Rule()` + `RuleScenario()` pattern (the very pattern this linter validates!)

3. **Cross-file scenarios** need both `featureContent` and `stepContent` in state — the Given steps build both, the When step calls the cross-check function with both.

4. **vitest-cucumber `And` steps** are used in several scenarios — destructure `And` from callbacks.

### Edge Cases Worth Covering

Beyond what the spec defines:

| Edge Case | Expected Behavior |
|-----------|-------------------|
| Empty feature file | No violations |
| Step file with no loadFeature() | pair-resolver warning, cross-checks skipped |
| Feature with Scenario Outline but step file uses Scenario() | Not flagged (different check — step may be correct) |
| `#` in a step DocString (real DocString) | Not flagged (only description context matters) |
| Multiple `"""` blocks in one Rule description | Both tracked correctly |
| ScenarioOutline with variables object (correct usage) | Not flagged |

## Next Session

1. **FIRST:** Review the spec at `delivery-process/specs/step-lint-vitest-cucumber.feature` — adjust scenario wording, add edge cases
2. **Create feature file:** `tests/features/lint/step-lint.feature` (can mirror the spec scenarios)
3. **Implement step defs:** `tests/steps/lint/step-lint.steps.ts`
4. **Run:** `pnpm test step-lint`
5. **Update deliverable status:** Mark "Gherkin executable specs" as complete in the spec
