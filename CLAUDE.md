# @libar-dev/delivery-process

> **Code-first documentation and delivery process toolkit**

---

## Project Overview

### Project Overview

Code-first documentation and delivery process toolkit. Extracts patterns from TypeScript and Gherkin sources using configurable annotations, generates LLM-optimized markdown and Mermaid architecture diagrams, and validates delivery workflow via pre-commit hooks.

**Core Principle:** Code is the single source of truth. Generated documentation is a projection of annotated source code.

**Key Capabilities:**

- Pattern extraction from TypeScript JSDoc and Gherkin tags
- MasterDataset transformation with pre-computed views (O(1) access)
- Codec-based markdown generation with progressive disclosure
- FSM-enforced delivery workflow validation via pre-commit hooks

---

### Development Philosophy

**This package was extracted from a large monorepo** where it accelerates development by eliminating manually maintained documentation. It is published and consumed by that monorepo.

#### Why This Matters for Implementation Sessions

| Aspect    | Wrong Mental Model                    | Correct Mental Model                              |
| --------- | ------------------------------------- | ------------------------------------------------- |
| Scope     | "Build feature for small output here" | "Build capability for hundreds of files there"    |
| ROI       | "Over-engineered for this repo"       | "Multi-day investment saves weeks of maintenance" |
| Testing   | "Simple feature, basic tests"         | "Mission-critical infra, comprehensive tests"     |
| Shortcuts | "Good enough for this repo"           | "Must work across many annotated sources"         |

#### Reference Implementation Pattern

This package uses itself as the primary test case:

- `_claude-md/validation/process-guard.md` → compact AI context
- `docs/PROCESS-GUARD.md` → detailed human reference

Both generated from the SAME annotated sources. When the POC succeeds here, the pattern applies to the entire monorepo.

#### Session Planning Principle

Features are planned for **reusability across the monorepo**, not for minimal output in this package.

---

### Target Monorepo

**Location:** `~/dev-projects/convex-event-sourcing/libar-platform`

The package is actively used as a dev dependency. The monorepo contains:

| Component                 | Purpose                                                                    |
| ------------------------- | -------------------------------------------------------------------------- |
| `packages/platform-*`     | 6 platform packages with annotated TypeScript sources                      |
| `delivery-process/specs/` | Tier 1 roadmap specifications                                              |
| `docs-living/`            | Generated documentation output (patterns, phases, requirements, decisions) |

**Manual docs being replaced:** `~/dev-projects/convex-event-sourcing/docs/` contains 150+ manually maintained files including architecture decisions, pattern theory, roadmap phases, and project management docs—all candidates for code-first generation.

#### What Gets Generated

| Output Type                  | Purpose                                    |
| ---------------------------- | ------------------------------------------ |
| `PATTERNS.md` + detail pages | Pattern registry from annotated TypeScript |
| `ROADMAP.md` + phase files   | Roadmap from Tier 1 feature specs          |
| `REMAINING-WORK.md`          | Outstanding work summary                   |
| `CURRENT-WORK.md`            | Active work tracking                       |
| `DECISIONS.md` + ADRs        | Architecture decision records              |
| `BUSINESS-RULES.md`          | Business rules from Gherkin                |

---

### Why No Shortcuts

Every shortcut in this package ripples across:

- Multiple platform packages with annotated sources
- Many Gherkin feature specifications
- All generated documentation files

**Test rigor matches mission-critical status.** A bug in the codec system means many files generate incorrectly. A gap in the extractor means patterns are missed across source files.

The validation in this repo is a **proof of concept**. When it succeeds here, the same validation applies to the entire monorepo's delivery workflow.

---

## Common Commands

### Common Commands

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

# Process API queries (JSON output, pipeable to jq)
pnpm process:query -- status                              # Delivery status counts
pnpm process:query -- query <method> [args]               # Any ProcessStateAPI method
pnpm process:query -- pattern <name>                      # Full pattern detail
pnpm process:query -- arch context <name>                 # Architecture by bounded context
```

---

## Process API CLI

### Process API CLI

Query delivery process state directly from the terminal instead of reading generated markdown. Returns JSON, pipeable to `jq`.

**Prefer the CLI over reading `PATTERNS.md` or `ROADMAP.md`** — targeted queries use 5-10x less context than reading full documents.

#### Subcommands

```bash
# Delivery status overview
pnpm process:query -- status

# Execute any ProcessStateAPI method by name
pnpm process:query -- query getCurrentWork
pnpm process:query -- query getPatternsByCategory projection
pnpm process:query -- query getPatternsByPhase 18
pnpm process:query -- query isValidTransition roadmap active

# Full detail for one pattern (metadata + deliverables + dependencies + relationships)
pnpm process:query -- pattern OrderFulfillmentSaga

# Architecture queries (bounded contexts, layers, roles, dependency graphs)
pnpm process:query -- arch roles
pnpm process:query -- arch context scanner
pnpm process:query -- arch layer domain
pnpm process:query -- arch graph ProcessStateAPI
```

#### Session Workflows

| Session Start Task       | Command                                                        |
| ------------------------ | -------------------------------------------------------------- |
| Quick status check       | `pnpm process:query -- status`                                 |
| Find active work         | `pnpm process:query -- query getCurrentWork`                   |
| Check roadmap items      | `pnpm process:query -- query getRoadmapItems`                  |
| Validate a transition    | `pnpm process:query -- query isValidTransition roadmap active` |
| Get pattern dependencies | `pnpm process:query -- query getPatternRelationships <name>`   |
| Explore architecture     | `pnpm process:query -- arch context <name>`                    |

#### Clean JSON Piping

`pnpm` outputs a banner line to stdout (`> @libar-dev/...`). For clean JSON piping to `jq`, use `npx tsx` directly:

```bash
npx tsx src/cli/process-api.ts -i 'src/**/*.ts' --features 'delivery-process/specs/*.feature' query getPatternsByCategory projection | jq '.[].patternName'
```

See `docs/PROCESS-API.md` for the complete 27-method API reference.

---

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

| Module                    | Purpose                                                          |
| ------------------------- | ---------------------------------------------------------------- |
| `src/config/`             | Configuration factory, presets (generic, ddd-es-cqrs)            |
| `src/taxonomy/`           | Tag definitions - categories, status values, format types        |
| `src/scanner/`            | TypeScript and Gherkin file scanning                             |
| `src/extractor/`          | Pattern extraction from AST/Gherkin                              |
| `src/generators/`         | Document generators and orchestrator                             |
| `src/renderable/`         | Markdown codec system                                            |
| `src/validation/`         | FSM validation, DoD checks, anti-patterns                        |
| `src/lint/`               | Pattern linting and process guard                                |
| `src/api/`                | Process State API for programmatic access                        |
| `delivery-process/stubs/` | Design session code stubs (outside src/ for TS/ESLint isolation) |

### Three Presets

| Preset                    | Tag Prefix     | Categories | Use Case                           |
| ------------------------- | -------------- | ---------- | ---------------------------------- |
| `libar-generic` (default) | `@libar-docs-` | 3          | Simple projects (this package)     |
| `ddd-es-cqrs`             | `@libar-docs-` | 21         | DDD/Event Sourcing architectures   |
| `generic`                 | `@docs-`       | 3          | Simple projects with @docs- prefix |

---

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

### The Two-Pattern Problem (CRITICAL)

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
// WRONG - {string} does NOT work in ScenarioOutline
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

### Docstring Pattern for Pipes

Use docstrings when Gherkin content contains pipe characters:

```typescript
Then('the output contains the table:', (_ctx: unknown, docString: string) => {
  for (const line of docString.trim().split('\n')) {
    expect(state!.markdown).toContain(line.trim());
  }
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

### Gherkin Parser: Hash Comments in Descriptions (CRITICAL)

**Root Cause:** The @cucumber/gherkin parser interprets `#` at the start of a line as a Gherkin comment, even inside Feature/Rule descriptions. This terminates the description context and causes subsequent lines to fail parsing.

**Symptom:** Parse error like:

```
expected: #EOF, #Comment, #BackgroundLine, #TagLine, #ScenarioLine, #RuleLine, #Empty
got 'generate-docs --decisions ...'
```

**The Problem:**

When you embed code examples in Rule descriptions using `"""` (which becomes literal text, NOT a DocString), any `#` comment inside will break parsing:

```gherkin
Rule: My Rule

    """bash
    # This comment breaks parsing!
    generate-docs --output docs
    """
```

The parser sees:

1. `"""bash` → literal text in description
2. `# This comment...` → Gherkin comment (TERMINATES description)
3. `generate-docs...` → unexpected content (PARSE ERROR)

**Why This Happens:**

- `"""` in descriptions is NOT parsed as DocString delimiters (those only work as step arguments)
- The content becomes plain description text
- `#` at line start is ALWAYS a Gherkin comment in description context

**Workarounds:**

| Option                 | Example                                   | When to Use                        |
| ---------------------- | ----------------------------------------- | ---------------------------------- |
| Remove hash comments   | `generate-docs --output docs`             | Simple cases                       |
| Use `//` instead       | `// Generate docs`                        | When comment syntax doesn't matter |
| Move to step DocString | `Given the script: """bash...`            | When you need executable examples  |
| Manual parsing         | Regex extraction bypassing Gherkin parser | When file must contain `#`         |

**Note:** The `parseDescriptionWithDocStrings()` helper extracts `"""` blocks from description text AFTER parsing succeeds. The issue is the Gherkin parser itself failing before that helper runs.

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

---

## Session Workflows

**Core Thesis:** Git is the event store. Documentation artifacts are projections. Feature files are the single source of truth.

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

| Session           | Input               | Output                      | FSM Change                 |
| ----------------- | ------------------- | --------------------------- | -------------------------- |
| Planning          | Pattern brief       | Roadmap spec (`.feature`)   | Creates `roadmap`          |
| Design            | Complex requirement | Decision specs + code stubs | None                       |
| Implementation    | Roadmap spec        | Code + tests                | `roadmap→active→completed` |
| Planning + Design | Pattern brief       | Spec + stubs                | Creates `roadmap`          |

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

**Code Stub Pattern** — stubs go in `delivery-process/stubs/{pattern-name}/`:

```typescript
// delivery-process/stubs/{pattern-name}/my-function.ts
/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements MyPattern
 * @libar-docs-uses Workpool, EventStore
 *
 * ## My Pattern - Description
 *
 * Target: src/path/to/final/location.ts
 * See: PDR-001 (Design Decision)
 * Since: DS-1
 */
export function myFunction(args: MyArgs): Promise<MyResult> {
  throw new Error('MyPattern not yet implemented - roadmap pattern');
}
```

Stubs live outside `src/` to avoid TypeScript compilation and ESLint issues.

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

### FSM Error Messages and Fixes

| Error                       | Cause                                         | Fix                                       |
| --------------------------- | --------------------------------------------- | ----------------------------------------- |
| `completed-protection`      | File has `completed` status but no unlock tag | Add `@libar-docs-unlock-reason:'reason'`  |
| `invalid-status-transition` | Skipped FSM state (e.g., `roadmap→completed`) | Follow path: `roadmap→active→completed`   |
| `scope-creep`               | Added deliverable to `active` spec            | Remove deliverable OR revert to `roadmap` |
| `session-scope` (warning)   | Modified file outside session scope           | Add to scope OR use `--ignore-session`    |
| `session-excluded`          | Modified excluded pattern during session      | Remove from exclusion OR override         |

### Escape Hatches

| Situation                    | Solution              | Example                                  |
| ---------------------------- | --------------------- | ---------------------------------------- |
| Fix bug in completed spec    | Add unlock reason tag | `@libar-docs-unlock-reason:'Fix-typo'`   |
| Modify outside session scope | Use ignore flag       | `lint-process --staged --ignore-session` |
| CI treats warnings as errors | Use strict flag       | `lint-process --all --strict`            |

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

---

## Validation

### Process Guard

Process Guard validates delivery workflow changes at commit time using a Decider pattern.

#### 6 Validation Rules

| Rule ID                     | Severity | Description                                         |
| --------------------------- | -------- | --------------------------------------------------- |
| `completed-protection`      | error    | Completed specs require `@libar-docs-unlock-reason` |
| `invalid-status-transition` | error    | Must follow FSM path                                |
| `scope-creep`               | error    | Active specs cannot add new deliverables            |
| `session-excluded`          | error    | Cannot modify explicitly excluded files             |
| `session-scope`             | warning  | File outside session scope                          |
| `deliverable-removed`       | warning  | Deliverable was removed                             |

#### Protection Levels

| Status      | Protection   | Allowed Actions                | Blocked Actions               |
| ----------- | ------------ | ------------------------------ | ----------------------------- |
| `roadmap`   | None         | Full editing, add deliverables | -                             |
| `deferred`  | None         | Full editing, add deliverables | -                             |
| `active`    | Scope-locked | Edit existing deliverables     | Adding new deliverables       |
| `completed` | Hard-locked  | Nothing                        | Any change without unlock tag |

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

#### CLI Options

| Flag               | Description                             |
| ------------------ | --------------------------------------- |
| `--staged`         | Validate staged files only (pre-commit) |
| `--all`            | Validate all tracked files (CI)         |
| `--strict`         | Treat warnings as errors (exit 1)       |
| `--ignore-session` | Skip session scope validation           |
| `--show-state`     | Debug: show derived process state       |
| `--format json`    | Machine-readable JSON output            |

#### Exit Codes

| Code | Meaning                                        |
| ---- | ---------------------------------------------- |
| `0`  | No errors (warnings allowed unless `--strict`) |
| `1`  | Errors found or warnings with `--strict`       |

### Anti-Pattern Detection

Enforces dual-source architecture ownership between TypeScript and Gherkin files.

#### Tag Location Constraints

| Tag                      | Correct Location | Wrong Location | Why                                |
| ------------------------ | ---------------- | -------------- | ---------------------------------- |
| `@libar-docs-uses`       | TypeScript       | Feature files  | TS owns runtime dependencies       |
| `@libar-docs-depends-on` | Feature files    | TypeScript     | Gherkin owns planning dependencies |
| `@libar-docs-quarter`    | Feature files    | TypeScript     | Gherkin owns timeline metadata     |
| `@libar-docs-team`       | Feature files    | TypeScript     | Gherkin owns ownership metadata    |

#### DoD Validation

For patterns with `completed` status, validates:

- All deliverables marked complete (checkmark, "Done", "Complete")
- At least one `@acceptance-criteria` scenario exists in the spec

#### Running Validation

```bash
# Anti-pattern check only
npx validate-patterns \
  -i "src/**/*.ts" \
  -F "specs/**/*.feature" \
  --anti-patterns

# Full validation with DoD
npx validate-patterns \
  -i "src/**/*.ts" \
  -F "specs/**/*.feature" \
  --anti-patterns \
  --dod
```

---

## Authoring

### Gherkin Authoring Patterns

#### Roadmap Spec Structure

```gherkin
@libar-docs
@libar-docs-pattern:ProcessGuardLinter
@libar-docs-status:roadmap
@libar-docs-phase:99
Feature: Process Guard Linter

  **Problem:**
  During planning sessions, accidental modifications can occur.

  **Solution:**
  Implement a Decider-based linter that validates proposed changes.

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status  | Location |
      | State derivation | Pending | src/lint/derive.ts |
```

#### Feature Description Patterns

| Structure        | Headers                                    | Best For           |
| ---------------- | ------------------------------------------ | ------------------ |
| Problem/Solution | `**Problem:**`, `**Solution:**`            | Pain point to fix  |
| Value-First      | `**Business Value:**`, `**How It Works:**` | TDD-style specs    |
| Context/Approach | `**Context:**`, `**Approach:**`            | Technical patterns |

#### Tag Conventions

| Tag                    | Purpose                     |
| ---------------------- | --------------------------- |
| `@happy-path`          | Primary success scenario    |
| `@edge-case`           | Boundary conditions         |
| `@error-handling`      | Error recovery scenarios    |
| `@validation`          | Input validation rules      |
| `@acceptance-criteria` | Required for DoD validation |
| `@integration`         | Cross-component behavior    |

#### Rule Block Structure

For business constraints, use `Rule:` blocks with structured annotations:

```gherkin
Rule: Reservations prevent race conditions

  **Invariant:** Only one reservation can exist for a key.
  **Rationale:** Check-then-create has TOCTOU vulnerabilities.
  **Verified by:** @happy-path, @edge-case scenarios below.

  @acceptance-criteria @happy-path
  Scenario: Concurrent reservations are prevented
    Given an existing reservation for key "order-123"
    When another process attempts to reserve "order-123"
    Then the reservation fails with "already reserved"
```

### Feature File Rich Content

Feature files serve dual purposes: **executable specs** and **documentation source**. Content in the Feature description section appears in generated docs.

#### Code-First Principle

**Prefer code stubs over DocStrings for complex examples.** Feature files should reference code, not duplicate it.

| Approach                     | When to Use                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| DocStrings (`"""typescript`) | Brief examples (5-10 lines), current/target state comparison |
| Code stub reference          | Complex APIs, interfaces, full implementations               |

**Instead of large DocStrings:**

```gherkin
Rule: Reservations use atomic claim
  See `src/reservations/reserve.ts` for API.
```

Code stubs are annotated TypeScript files with `throw new Error("not yet implemented")`.

#### Valid Rich Content

| Content Type  | Syntax                  | Appears in Docs  |
| ------------- | ----------------------- | ---------------- |
| Plain text    | Regular paragraphs      | Yes              |
| Bold/emphasis | `**bold**`, `*italic*`  | Yes              |
| Tables        | Markdown pipe tables    | Yes              |
| Lists         | `- item` or `1. item`   | Yes              |
| DocStrings    | `"""typescript`...`"""` | Yes (code block) |
| Comments      | `# comment`             | No (ignored)     |

#### Forbidden in Feature Descriptions

| Forbidden           | Why                        | Alternative                   |
| ------------------- | -------------------------- | ----------------------------- |
| Code fences ` ``` ` | Not Gherkin syntax         | Use DocStrings with lang hint |
| `@prefix` in text   | Interpreted as Gherkin tag | Remove `@` or escape          |
| Nested DocStrings   | Gherkin parser error       | Reference code stub file      |

#### Tag Value Constraints

**Tag values cannot contain spaces.** Use hyphens instead:

| Invalid                          | Valid                           |
| -------------------------------- | ------------------------------- |
| `@unlock-reason:Fix for issue`   | `@unlock-reason:Fix-for-issue`  |
| `@libar-docs-pattern:My Pattern` | `@libar-docs-pattern:MyPattern` |

---
