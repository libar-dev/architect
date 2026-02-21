Tests use Vitest with BDD/Gherkin integration:

- **Feature files**: `tests/features/**/*.feature`
- **Step definitions**: `tests/steps/**/*.steps.ts`
- **Fixtures**: `tests/fixtures/` - test data and factory functions
- **Support**: `tests/support/` - test helpers and setup utilities
- **Shared state helpers**: `tests/support/helpers/` - reusable state management for split test suites

Large test files are split into focused domain files with shared state extracted to helpers (e.g., `ast-parser-state.ts`, `process-api-state.ts`).

Run a single test file: `pnpm test tests/steps/scanner/file-discovery.steps.ts`

### Gherkin-Only Testing Policy

This package enforces **strict Gherkin-only testing**:

| Rule                            | Explanation                                 |
| ------------------------------- | ------------------------------------------- |
| All tests are `.feature` files  | Living documentation + executable specs     |
| No `.test.ts` files in new code | Exception-free policy                       |
| Edge cases use Scenario Outline | Examples tables replace parameterized tests |

**Rationale:** A package that generates documentation from `.feature` files should demonstrate that Gherkin IS sufficient. Having parallel `.test.ts` files undermines the "single source of truth" principle.

### Test Safety Rules (CRITICAL)

**NEVER commit code with these patterns:**

| Forbidden                   | Why                                        |
| --------------------------- | ------------------------------------------ |
| `it.skip()` / `test.skip()` | Silently disables tests, hides failures    |
| `it.only()` / `test.only()` | Runs only one test, skips entire suite     |
| `describe.skip()`           | Disables entire test suites                |
| `describe.only()`           | Runs only one suite, skips everything else |
| Commented-out test code     | Same as skip, but harder to detect         |

**If a test is flaky:** Fix the test. Do not skip it.

**If you cannot fix it:** Stop and escalate to the human. Skipping is not an option.
