# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Code-first documentation and delivery process toolkit. Extracts patterns from TypeScript and Gherkin sources using configurable annotations, generates LLM-optimized markdown and Mermaid architecture diagrams, and validates delivery workflow via pre-commit hooks. Code is the single source of truth.

## Common Commands

```bash
# Build and development
pnpm build              # Compile TypeScript
pnpm dev                # Watch mode compilation
pnpm typecheck          # Type check without emit

# Testing
pnpm test               # Run all Vitest tests
pnpm test <pattern>     # Run tests matching pattern (e.g., pnpm test scanner)

# Linting
pnpm lint               # ESLint on src and tests
pnpm lint:fix           # Auto-fix lint issues
pnpm lint-patterns      # Lint pattern annotations in src/**/*.ts

# Validation
pnpm validate:patterns  # Cross-source pattern validation
pnpm validate:dod       # Definition of Done validation
pnpm validate:all       # All validations including anti-patterns

# Documentation generation
pnpm docs:patterns      # Generate pattern docs
pnpm docs:all           # Generate all doc types (patterns, roadmap, remaining, changelog)
```

## Architecture

### Four-Stage Pipeline

```
CONFIG → SCANNER → EXTRACTOR → TRANSFORMER → CODEC
         (files)   (patterns)   (MasterDataset)  (Markdown)
```

1. **Scanner** (`src/scanner/`): File discovery, AST parsing, opt-in detection via `@libar-docs` marker
2. **Extractor** (`src/extractor/`): Pattern extraction from TypeScript JSDoc and Gherkin tags
3. **Transformer** (`src/generators/pipeline/`): Builds MasterDataset with pre-computed views
4. **Codec** (`src/renderable/`): Zod 4 codecs transform MasterDataset → RenderableDocument → Markdown

### Key Design Patterns

- **Result Monad**: Explicit error handling via `Result<T, E>` in `src/types/result.ts` - functions return `Result.ok(value)` or `Result.error(err)` instead of throwing
- **Schema-First**: Zod schemas in `src/validation-schemas/` define types with runtime validation
- **Registry Pattern**: Tag registry (`src/taxonomy/`) defines categories, status values, and tag formats
- **Codec-Based Rendering**: Generators in `src/generators/` use codecs to transform data to markdown

### Module Structure

| Module            | Purpose                                                   |
| ----------------- | --------------------------------------------------------- |
| `src/config/`     | Configuration factory, presets (generic, ddd-es-cqrs)     |
| `src/taxonomy/`   | Tag definitions - categories, status values, format types |
| `src/scanner/`    | TypeScript and Gherkin file scanning                      |
| `src/extractor/`  | Pattern extraction from AST/Gherkin                       |
| `src/generators/` | Document generators and orchestrator                      |
| `src/renderable/` | Markdown codec system                                     |
| `src/validation/` | FSM validation, DoD checks, anti-patterns                 |
| `src/lint/`       | Pattern linting and process guard                         |
| `src/api/`        | Process State API for programmatic access                 |

### Two Presets

| Preset                  | Tag Prefix     | Categories | Use Case                         |
| ----------------------- | -------------- | ---------- | -------------------------------- |
| `ddd-es-cqrs` (default) | `@libar-docs-` | 21         | DDD/Event Sourcing architectures |
| `generic`               | `@docs-`       | 3          | Simple projects                  |

## Testing

Tests use Vitest with BDD/Gherkin integration:

- **Feature files**: `tests/features/**/*.feature`
- **Step definitions**: `tests/steps/**/*.steps.ts`
- **Fixtures**: `tests/fixtures/` - test data and factory functions
- **Support**: `tests/support/` - test helpers and setup utilities

Run a single test file: `pnpm test tests/steps/scanner.steps.ts`

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

### vitest-cucumber: The Two-Pattern Problem (CRITICAL)

vitest-cucumber uses **TWO COMPLETELY DIFFERENT patterns** depending on scenario type:

| Scenario Type     | Step Pattern                               | Parameter Access                         |
| ----------------- | ------------------------------------------ | ---------------------------------------- |
| `Scenario`        | `{string}`, `{int}` (Cucumber expressions) | Function params: `(_ctx, value: string)` |
| `ScenarioOutline` | `<columnName>` (literal placeholders)      | Variables object: `variables.columnName` |

**Scenario (uses {string}):**

```typescript
Scenario('Create order', ({ Given }) => {
  Given('a customer {string}', async (_ctx: unknown, customerId: string) => {
    state!.customerId = customerId; // customerId captured from {string}
  });
});
```

**ScenarioOutline (uses variables object):**

```typescript
ScenarioOutline(
  'Validate quantity',
  ({ When, Then }, variables: { quantity: string; valid: string }) => {
    When('I set quantity to <quantity>', () => {
      state!.qty = parseInt(variables.quantity); // Access via variables object
    });
    Then('validation returns <valid>', () => {
      expect(state!.isValid).toBe(variables.valid === 'true');
    });
  }
);
```

**Common Mistake (WRONG):**

```typescript
// ❌ WRONG - {string} does NOT work in ScenarioOutline
ScenarioOutline('...', ({ When }) => {
  When('I set quantity to {string}', (_ctx, qty: string) => {
    /* FAILS! */
  });
});
```

### vitest-cucumber Rules (CRITICAL)

| Rule                              | Why                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| String patterns only — NO RegExp  | Use `"value {int}"` NOT `/value (\d+)/`. Cucumber expressions: `{int}`, `{string}` |
| Rule: keyword requires Rule()     | Feature with `Rule:` blocks needs `Rule()` + `RuleScenario()` in step defs         |
| DataTable first row = headers     | `\| title \| type \|` then `\| Doc \| guide \|` → `[{title:"Doc", type:"guide"}]`  |
| `\|` escaping is broken           | Use docstrings `"""..."""` for content with pipes                                  |
| `$` in patterns fails             | Avoid `$` character in step text — causes matching issues                          |
| ScenarioOutline needs variables   | `({ Given }, variables: { col: string })` — NOT `{string}` params                  |
| Steps are per-Scenario            | Each `Scenario()` block defines its own steps                                      |
| Multiple `And` same pattern fails | Consolidate into single step with DataTable/docstring                              |

### Quick Reference

| Context           | Pattern       | Access                     | Example                    |
| ----------------- | ------------- | -------------------------- | -------------------------- |
| `Scenario`        | `{string}`    | Function param             | `(_ctx, id: string)`       |
| `Scenario`        | `{int}`       | Function param             | `(_ctx, count: number)`    |
| `ScenarioOutline` | `<column>`    | `variables.column`         | `variables.orderId`        |
| `Rule:` block     | Same as above | Wrap with `RuleScenario()` | See pattern below          |
| DataTable         | N/A           | `(_ctx, table: Row[])`     | First row = headers        |
| Docstring         | N/A           | `(_ctx, doc: string)`      | Use for content with pipes |

**Rule keyword pattern:**

```typescript
// When feature has Rule: blocks, use this pattern:
describeFeature(feature, ({ Background, Rule }) => {
  Rule('Rule name from feature', ({ RuleScenario, RuleScenarioOutline }) => {
    RuleScenario('Scenario name', ({ Given, When, Then }) => {
      // steps with {string}, {int}
    });
    RuleScenarioOutline('Outline name', ({ When }, variables: { col: string }) => {
      // steps with <col>, access via variables.col
    });
  });
});
```

### vitest-cucumber Quirks & Constraints

The library behaves differently than standard Cucumber.js.

| Issue                    | Description                                                                                    | Fix                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Repeated Step Patterns   | Using exact same step pattern twice in one scenario fails to match or overwrites registrations | Avoid generic regex steps if reused. Use strict string matching. Consolidate assertions into DataTables |
| `{phrase}` not supported | vitest-cucumber does not support `{phrase}` type                                               | Use `{string}` and wrap value in quotes in Feature file                                                 |
| Docstring stripping      | Markdown headers (`## Header`) inside docstrings may be stripped or parsed incorrectly         | Hardcode complex multi-line strings in step definition TS file                                          |
| Feature descriptions     | Starting a description line with `Given`, `When`, or `Then` breaks the parser                  | Ensure free-text descriptions do not start with reserved Gherkin keywords                               |
| Multiple And same text   | Multiple `And` steps with identical text (different values) fail                               | Consolidate into single step with DataTable                                                             |
| No regex step patterns   | `Then(/pattern/, ...)` throws `StepAbleStepExpressionError`                                    | Use only string patterns with `{string}`, `{int}` placeholders                                          |

### Common Test Implementation Issues

Issues discovered during step definition implementation:

| Issue                             | Description                                                  | Fix                                                                                               |
| --------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Pattern not in `bySource.gherkin` | TraceabilityCodec shows "No Timeline Patterns"               | Set `filePath: '...feature'` in `createTestPattern()` - source categorization uses file extension |
| Business value not found          | REMAINING-WORK.md business value is in `additionalFiles`     | Check detail files via `doc.additionalFiles` not main document sections                           |
| Codec output mismatch             | Spec says "Next Actionable table" but codec uses list format | Debug actual output with `console.log(JSON.stringify(doc.sections))` then align test expectations |
| `behaviorFileVerified` undefined  | Patterns created without explicit verification status        | Add `behaviorFileVerified: true/false` to `createTestPattern()` when testing traceability         |
| Discovery tags missing            | SessionFindingsCodec shows "No Findings"                     | Pass `discoveredGaps`, `discoveredImprovements`, `discoveredLearnings` to factory                 |

### Codec vs. Spec Reality Gap

Tier 1 specs are often idealistic drafts. The code is the reality.

| Issue                     | Description                                                                                                   | Fix                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Output Structure Mismatch | Spec expects "Phase 1" but Codec outputs derived name, or Spec expects table that Codec suppresses when empty | Run debug script to dump actual `RenderableDocument` JSON structure. Align Feature file to Codec's actual behavior        |
| Data Normalization        | Feature files use plain language (`planned`, `p1`) vs. Schema requirements (`roadmap`, `pattern-00...`)       | Implement helper functions: `normalizeStatus(str)` maps 'planned' → 'roadmap'. `generatePatternId(n)` generates valid IDs |

### Coding & Linting Standards

The project has strict linting rules. Save time by coding defensively.

| Issue                                                                            | Fix                                                                               |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Unused variables: `(_ctx, count, text)` throws lint errors if `count` isn't used | Prefix **immediately**: `(_ctx, _count, text)`                                    |
| Type safety: `ListItem` is an object, not a string. `item + '\n'` throws errors  | Check types before concatenation: `(typeof item === 'string' ? item : item.text)` |

### Efficient Debugging Strategy

- **Don't** try to debug by running the full test suite repeatedly.
- **Do** create a temporary standalone script (e.g., `debug-codec.ts`) using `npx tsx` to inspect the Codec output:

```typescript
// debug-codec.ts
import { RemainingWorkCodec } from './src/renderable/codecs/session.js';
import { createTestMasterDataset } from './tests/fixtures/dataset-factories.js';

const dataset = createTestMasterDataset({ ... });
const doc = RemainingWorkCodec.decode(dataset);
console.log(JSON.stringify(doc.sections, null, 2));
```

- **Do** use `pnpm test remaining-work` (or specific filename) to run focused tests.

### Implementation Workflow Checklist

1. [ ] **Read Feature File:** identify Scenario counts and data types
2. [ ] **Check Factories:** Ensure `pattern-factories.ts` supports the fields needed (e.g., `phase`, `priority`)
3. [ ] **Prototype:** Run a `tsx` script to see what the Codec actually outputs for given inputs
4. [ ] **Adjust Spec:** Update Feature file to match Codec reality (e.g., quotes for lists, valid status names)
5. [ ] **Write Steps:** Implement steps with `_` prefixes for unused args
6. [ ] **Verify:** Run specific test file → Run related group → Run full suite

## Session Workflows

For detailed guides, see [SESSION-GUIDES.md](./docs/SESSION-GUIDES.md).

### Session Decision Tree

```
Starting from pattern brief?
├── Yes → Need code stubs now? → Yes → Planning + Design
│                              → No  → Planning
└── No  → Ready to code? → Yes → Complex decisions? → Yes → Design first
                                                    → No  → Implementation
                        → No  → Planning
```

| Session           | Input               | Output                    | FSM Change                 |
| ----------------- | ------------------- | ------------------------- | -------------------------- |
| Planning          | Pattern brief       | Roadmap spec (`.feature`) | Creates `roadmap`          |
| Design            | Complex requirement | Design doc + code stubs   | None                       |
| Implementation    | Roadmap spec        | Code + tests              | `roadmap→active→completed` |
| Planning + Design | Pattern brief       | Spec + stubs              | Creates `roadmap`          |

### Planning Session

**Goal:** Create a roadmap spec. Do NOT write implementation code.

| Do                                                        | Do NOT                      |
| --------------------------------------------------------- | --------------------------- |
| Extract metadata from pattern brief                       | Create `.ts` implementation |
| Create spec file with proper tags                         | Transition to `active`      |
| Add deliverables table in Background                      | Ask "Ready to implement?"   |
| Convert constraints to `Rule:` blocks                     | Write full implementations  |
| Add scenarios: 1 `@happy-path` + 1 `@validation` per Rule |                             |

### Design Session

**Goal:** Make architectural decisions. Create code stubs with interfaces. Do NOT implement.

| Use Design Session         | Skip Design Session |
| -------------------------- | ------------------- |
| Multiple valid approaches  | Single obvious path |
| New patterns/capabilities  | Bug fix             |
| Cross-context coordination | Clear requirements  |

**Code Stub Pattern:**

```typescript
/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-uses Workpool, EventStore
 *
 * ## My Pattern - Description
 */
export function myFunction(args: MyArgs): Promise<MyResult> {
  throw new Error('MyPattern not yet implemented - roadmap pattern');
}
```

### Implementation Session

**Goal:** Write code. The roadmap spec is the source of truth.

**Execution Order (CRITICAL):**

1. **Transition to `active` FIRST** — before any code changes
2. **Create executable spec stubs** — if `@libar-docs-executable-specs` present
3. **For each deliverable:** implement, test, update status to `completed`
4. **Transition to `completed`** — only when ALL deliverables done
5. **Regenerate docs:** `pnpm docs:all`

| Do NOT                                | Why                                     |
| ------------------------------------- | --------------------------------------- |
| Add new deliverables to `active` spec | Scope-locked state prevents scope creep |
| Mark `completed` with incomplete work | Hard-locked state cannot be undone      |
| Skip FSM transitions                  | Process Guard will reject               |
| Edit generated docs directly          | Regenerate from source                  |

### FSM Protection Quick Reference

| State       | Protection   | Can Add Deliverables | Needs Unlock |
| ----------- | ------------ | -------------------- | ------------ |
| `roadmap`   | None         | Yes                  | No           |
| `active`    | Scope-locked | No                   | No           |
| `completed` | Hard-locked  | No                   | Yes          |
| `deferred`  | None         | Yes                  | No           |

**Valid FSM Transitions:**

```
roadmap ──→ active ──→ completed (terminal)
    │          │
    │          ↓
    │       roadmap (blocked/regressed)
    ↓
deferred ──→ roadmap
```

### Handoff Documentation

For multi-session work, capture state at session boundaries:

```markdown
## Session State

- **Last completed:** Phase 1 - Core types
- **In progress:** Phase 2 - Validation
- **Blockers:** None

### Files Modified

- `src/types.ts` - Added core types
- `src/validate.ts` - Started validation (incomplete)

## Next Session

1. **FIRST:** Complete validation in `src/validate.ts`
2. Add integration tests
3. Update deliverable statuses
```

## Annotation System

Files must opt-in with a marker to be scanned:

```typescript
/** @libar-docs */

/**
 * @libar-docs-pattern PatternName
 * @libar-docs-status completed
 * @libar-docs-core
 * @libar-docs-uses OtherPattern
 *
 * ## Description in markdown
 */
export class MyClass { ... }
```

Key tags: `pattern`, `status` (roadmap/active/completed/deferred), `uses`, `used-by`, `phase`, `release`, category tags (`core`, `api`, `infra`, etc.)

## CLI Commands

- `generate-docs` - Generate documentation from annotated sources
- `lint-patterns` - Validate annotation quality
- `lint-process` - FSM validation for delivery process
- `validate-patterns` - Cross-source validation with DoD checks
- `generate-tag-taxonomy` - Generate tag reference from TypeScript

## ProcessStateAPI

For Claude Code sessions, use ProcessStateAPI instead of reading generated documentation:

```typescript
import {
  generators,
  api as apiModule,
  createDefaultTagRegistry,
} from '@libar-dev/delivery-process';

// Build dataset from extracted patterns
const tagRegistry = createDefaultTagRegistry();
const dataset = generators.transformToMasterDataset({
  patterns: extractedPatterns, // From scanPatterns + extractPatterns
  tagRegistry,
});
const api = apiModule.createProcessStateAPI(dataset);

// Common queries
api.getCurrentWork(); // Active patterns
api.getRoadmapItems(); // Available to start
api.getPatternsByPhase(19); // All Phase 19 patterns
api.isValidTransition('roadmap', 'active'); // Can we start?
api.getPattern('BddTestingInfrastructure'); // Full pattern details
api.getPhaseProgress(19); // Phase completion metrics
```

**Benefits over generated docs:**

- Low context cost — typed queries vs. reading markdown
- Real-time accuracy — direct from source, not snapshot
- Instant queries — no regeneration required

## Using Generated Documentation as Context

When adding features, consult generated documentation for current state:

```bash
pnpm docs:patterns    # Creates PATTERNS.md with all patterns
pnpm docs:all         # Creates roadmap, remaining work, changelog
```

Generated files are in `docs-generated/`:

- `PATTERNS.md` - Pattern registry with completion status
- `ROADMAP.md` - Development roadmap by phase
- `REMAINING-WORK.md` - Incomplete work summary
- `CURRENT-WORK.md` - Active work summary
