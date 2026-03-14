# @libar-dev/architect

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

Both generated from the SAME annotated sources. Features are planned for **reusability across the monorepo**, not for minimal output in this package.

---

## Context Gathering Protocol

### Context Gathering Protocol (MANDATORY)

**Rule: Always query the Process Data API BEFORE using grep, explore agents, or reading files.**

The API returns structured, current data using 5-10x less context than file reads. Annotations and relationships in source files feed the API — invest in annotations, not manual notes.

#### PR / Session Start (run these FIRST)

| Step | Command                                                      | What You Get                                |
| ---- | ------------------------------------------------------------ | ------------------------------------------- |
| 1    | `pnpm architect:query -- overview`                           | Project health, active phases, blockers     |
| 2    | `pnpm architect:query -- scope-validate <pattern> <session>` | Pre-flight: FSM violations, missing deps    |
| 3    | `pnpm architect:query -- context <pattern> --session <type>` | Curated context bundle for the session      |
| 4    | `pnpm architect:query -- files <pattern> --related`          | File reading list with implementation paths |

Session types: `planning` (minimal), `design` (full: stubs + deps + deliverables), `implement` (focused: deliverables + FSM + tests).

#### When You Need More Context

| Need                    | Command (NOT grep)                          | Why                                         |
| ----------------------- | ------------------------------------------- | ------------------------------------------- |
| Find code structure     | `arch context [name]` / `arch layer [name]` | Structured by annotations, not file paths   |
| Find dependencies       | `dep-tree <pattern>`                        | Shows status of each dependency             |
| Find business rules     | `rules --pattern <name>`                    | Extracted from Gherkin Rule: blocks         |
| Find unannotated files  | `unannotated --path <dir>`                  | Catches missing @architect markers          |
| Check FSM state         | `query getProtectionInfo <status>`          | Protection level + allowed actions          |
| Check valid transitions | `query getValidTransitionsFrom <status>`    | Valid next states from current status       |
| Tag inventory           | `tags`                                      | Counts per tag and value across all sources |
| Annotation coverage     | `arch coverage`                             | Files with/without @architect annotations   |

#### Why Annotations Beat Grep

- **Structured**: `arch context` groups by bounded context; grep returns unstructured matches
- **Queryable**: `rules --only-invariants` extracts 140+ business rules; grep can't parse Rule: blocks
- **Feed generation**: Annotations produce generated docs; grep results are ephemeral
- **Discoverable**: `unannotated --path` finds gaps; grep doesn't know what's missing

**When adding new code:** Add `@architect` annotations and relationship tags (`@architect-depends-on`, `@architect-uses`) so future sessions can discover the code via API queries instead of grep.

Full CLI reference: `pnpm architect:query -- --help`

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

# Validation + Documentation
pnpm validate:all       # All validations including anti-patterns and DoD
pnpm docs:all           # Generate all doc types

# Data API (see Context Gathering Protocol above)
pnpm architect:query -- --help                              # All subcommands and options
pnpm architect:query -- context <pattern> --session design  # Session context bundle
pnpm architect:query -- overview                            # Project health summary
```

---

## Data API CLI

### Data API CLI

Query delivery process state directly from the terminal. **Use this instead of reading generated markdown or launching explore agents** — targeted queries use 5-10x less context.

**Run `pnpm architect:query -- --help` for the full command reference**, including workflow recipes, session types, architecture queries, output modifiers, and available API methods.

See the **Context Gathering Protocol** section above for mandatory session start commands and query recipes.

#### Tips

- `pattern <name>` returns ~66KB for completed patterns — prefer `context --session` for interactive sessions.
- `query getPattern <name>` shows raw JSON including `extractedShapes` — use for debugging shape extraction.
- Output modifiers (`--names-only`, `--count`, `--fields`) compose with any list/query command.
- `pnpm` outputs a banner to stdout. For clean JSON piping, use `npx tsx src/cli/process-api.ts` directly.

### MCP Server — Native AI Context Tools

When the MCP server is running, **use `architect_*` tools instead of CLI commands** (`pnpm architect:query --`). The MCP server keeps the MasterDataset in memory — tool calls dispatch in sub-milliseconds vs 2-5 seconds for CLI subprocess invocations. All 25 tools wrap the same ProcessStateAPI methods available via CLI.

#### Session Start (MCP Protocol)

Use these tools at the start of every PR or implementation session, in order:

| Step | MCP Tool                   | What You Get                                | CLI Equivalent                                      |
| ---- | -------------------------- | ------------------------------------------- | --------------------------------------------------- |
| 1    | `architect_overview`       | Project health, active phases, blockers     | `pnpm architect:query -- overview`                  |
| 2    | `architect_scope_validate` | Pre-flight: FSM violations, missing deps    | `pnpm architect:query -- scope-validate <p> <type>` |
| 3    | `architect_context`        | Curated context bundle for the session      | `pnpm architect:query -- context <p> --session <t>` |
| 4    | `architect_files`          | File reading list with implementation paths | `pnpm architect:query -- files <p> --related`       |

Steps 1-2 can run in parallel (no dependencies between them).

#### Tool Reference

**Session-Aware Tools** — text output, use for workflow:

| Tool                       | Input               | Description                                    |
| -------------------------- | ------------------- | ---------------------------------------------- |
| `architect_overview`       | _(none)_            | Progress %, active phases, blocking chains     |
| `architect_context`        | `name`, `session?`  | Curated context (planning/design/implement)    |
| `architect_files`          | `name`              | Ordered file list with roles                   |
| `architect_dep_tree`       | `name`, `maxDepth?` | Dependency chain with status per dep           |
| `architect_scope_validate` | `name`, `session`   | PASS/BLOCKED/WARN pre-flight verdict           |
| `architect_handoff`        | `name`, `session?`  | Session-end state for multi-session continuity |

**Data Query Tools** — JSON output, use for structured lookups:

| Tool                  | Input                                                    | Description                                        |
| --------------------- | -------------------------------------------------------- | -------------------------------------------------- |
| `architect_status`    | _(none)_                                                 | Pattern counts by status, completion %             |
| `architect_pattern`   | `name`                                                   | Full metadata: deliverables, relationships, shapes |
| `architect_list`      | `status?`, `phase?`, `category?`, `namesOnly?`, `count?` | Filtered pattern listing                           |
| `architect_search`    | `query`                                                  | Fuzzy name search with similarity scores           |
| `architect_rules`     | `pattern?`, `onlyInvariants?`                            | Business rules from Gherkin Rule: blocks           |
| `architect_tags`      | _(none)_                                                 | Tag usage counts across all sources                |
| `architect_sources`   | _(none)_                                                 | File inventory by type (TS, Gherkin, stubs)        |
| `architect_stubs`     | `unresolved?`                                            | Design stubs with resolution status                |
| `architect_decisions` | `name?`                                                  | AD-N/DD-N design decisions from stubs              |

**Architecture Tools** — JSON output, use for dependency and structure analysis:

| Tool                          | Input    | Description                                 |
| ----------------------------- | -------- | ------------------------------------------- |
| `architect_arch_context`      | `name?`  | Bounded contexts with member patterns       |
| `architect_arch_layer`        | `name?`  | Architecture layers with member patterns    |
| `architect_arch_neighborhood` | `name`   | Uses, used-by, same-context peers           |
| `architect_arch_blocking`     | _(none)_ | Patterns blocked by incomplete dependencies |
| `architect_arch_dangling`     | _(none)_ | Broken references to nonexistent patterns   |
| `architect_arch_coverage`     | `path?`  | Annotation coverage % and unused taxonomy   |
| `architect_unannotated`       | `path?`  | Files missing @architect annotations        |

**Server Management:**

| Tool                | Description                                            |
| ------------------- | ------------------------------------------------------ |
| `architect_rebuild` | Force dataset rebuild from current source files        |
| `architect_config`  | Show source globs, base dir, build time, pattern count |
| `architect_help`    | List all available tools with descriptions             |

#### Common Recipes

| Goal                               | Tools                                                                            |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| What patterns are blocking?        | `architect_arch_blocking`                                                        |
| Understand a pattern before coding | `architect_context` (name, session) + `architect_scope_validate` (name, session) |
| Find business rules for a feature  | `architect_rules` with `pattern` filter                                          |
| Check annotation gaps              | `architect_arch_coverage` or `architect_unannotated`                             |
| Explore a bounded context          | `architect_arch_context` with name                                               |
| Find what depends on a pattern     | `architect_arch_neighborhood` with name                                          |
| List all roadmap patterns          | `architect_list` with `status: "roadmap"`                                        |
| Search by partial name             | `architect_search` with query                                                    |

#### Configuration

The MCP server is configured via `.mcp.json` in the project root:

```json
{
  "mcpServers": {
    "architect": {
      "command": "npx",
      "args": ["architect-mcp", "--watch"]
    }
  }
}
```

For monorepo setups with explicit source globs:

```json
{
  "mcpServers": {
    "architect": {
      "command": "npx",
      "args": [
        "architect-mcp",
        "--watch",
        "--input",
        "packages/core/src/**/*.ts",
        "--input",
        "packages/api/src/**/*.ts",
        "--features",
        "specs/**/*.feature"
      ]
    }
  }
}
```

The `--watch` flag enables auto-rebuild when `.ts` or `.feature` files change (500ms debounce). Without it, use `architect_rebuild` after annotation changes.

#### Tips

- `architect_rules` without a `pattern` filter returns a compact summary (totals + rule names + per-area counts) — unfiltered output is capped to prevent context overflow.
- `architect_pattern` returns full metadata (~66KB for completed patterns) — prefer `architect_context` with a session type for interactive sessions.
- `architect_search` uses fuzzy matching — partial names work (e.g., "MCP" matches all MCP-related patterns).
- `architect_list` filters compose: `status` + `phase` + `category` narrow results cumulatively.
- Session-aware tools return formatted text (like CLI output). Data and architecture tools return JSON.

---

## Architecture

### Four-Stage Pipeline

```
CONFIG → SCANNER → EXTRACTOR → TRANSFORMER → CODEC
         (files)   (patterns)   (MasterDataset)  (Markdown)
```

1. **Scanner** (`src/scanner/`): File discovery, AST parsing, opt-in detection via `@architect` marker
2. **Extractor** (`src/extractor/`): Pattern extraction from TypeScript JSDoc and Gherkin tags
3. **Transformer** (`src/generators/pipeline/`): Builds MasterDataset with pre-computed views
4. **Codec** (`src/renderable/`): Zod 4 codecs transform MasterDataset → RenderableDocument → Markdown

### Key Design Patterns

- **Result Monad**: Explicit error handling via `Result<T, E>` in `src/types/result.ts` - functions return `Result.ok(value)` or `Result.error(err)` instead of throwing
- **Schema-First**: Zod schemas in `src/validation-schemas/` define types with runtime validation
- **Registry Pattern**: Tag registry (`src/taxonomy/`) defines categories, status values, and tag formats
- **Codec-Based Rendering**: Generators in `src/generators/` use codecs to transform data to markdown
- **Pipeline Factory**: Shared `buildMasterDataset()` in `src/generators/pipeline/build-pipeline.ts` — all consumers (orchestrator, process-api, validate-patterns) call this instead of wiring inline pipelines. Per-consumer behavior via `PipelineOptions`.
- **Single Read Model** (ADR-006): MasterDataset is the sole read model. No consumer re-derives data from raw scanner/extractor output. Anti-patterns: Parallel Pipeline, Lossy Local Type, Re-derived Relationship.

**Live module inventory:** `pnpm architect:query -- arch context` and `pnpm architect:query -- arch layer`

### Decision Specs

Architecture and process decisions are recorded as annotated Gherkin specs in `architect/decisions/`:

| Spec    | Key Decision                                                               |
| ------- | -------------------------------------------------------------------------- |
| ADR-001 | Taxonomy canonical values — tag registry is the single source of truth     |
| ADR-002 | Gherkin-only testing — no `.test.ts` files, all tests are `.feature`       |
| ADR-003 | Source-first pattern architecture — code drives docs, not the reverse      |
| ADR-005 | Codec-based markdown rendering — Zod codecs transform data to markdown     |
| ADR-006 | Single read model — MasterDataset is the sole read model for all consumers |
| PDR-001 | Session workflow commands — Process Data API CLI design decisions          |

Query decisions: `pnpm architect:query -- decisions <pattern>`

---

## Testing

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

### vitest-cucumber Quirks & Constraints

The library behaves differently than standard Cucumber.js.

| Issue                  | Description                                                                            | Fix                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Docstring stripping    | Markdown headers (`## Header`) inside docstrings may be stripped or parsed incorrectly | Hardcode complex multi-line strings in step definition TS file            |
| Feature descriptions   | Starting a description line with `Given`, `When`, or `Then` breaks the parser          | Ensure free-text descriptions do not start with reserved Gherkin keywords |
| Multiple And same text | Multiple `And` steps with identical text (different values) fail                       | Consolidate into single step with DataTable                               |
| No regex step patterns | `Then(/pattern/, ...)` throws `StepAbleStepExpressionError`                            | Use only string patterns with `{string}`, `{int}` placeholders            |

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

### Coding & Linting Standards

The project has strict linting rules. Save time by coding defensively.

| Issue                                                                            | Fix                                                                               |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Unused variables: `(_ctx, count, text)` throws lint errors if `count` isn't used | Prefix **immediately**: `(_ctx, _count, text)`                                    |
| Type safety: `ListItem` is an object, not a string. `item + '\n'` throws errors  | Check types before concatenation: `(typeof item === 'string' ? item : item.text)` |

**Deliverable statuses:** 6 values enforced by `z.enum()`: `complete`, `in-progress`, `pending`, `deferred`, `superseded`, `n/a`. Terminal: `complete`, `n/a`, `superseded` (NOT `deferred`). NEVER use freeform strings.

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

---

## Session Workflows

### SessionGuidesModuleSource

#### SESSION-GUIDES.md is the authoritative public human reference

**Invariant:** `docs/SESSION-GUIDES.md` exists and is not deleted, shortened, or replaced with a redirect. Its comprehensive checklists, CLI command examples, and session decision trees serve developers on libar.dev.

**Rationale:** Session workflow guidance requires two formats for two audiences. Public developers need comprehensive checklists with full examples. AI sessions need compact invariants they can apply without reading 389 lines.

#### CLAUDE.md session workflow content is derived, not hand-authored

**Invariant:** After Phase 39 generation deliverables complete, the "Session Workflows" section in CLAUDE.md contains no manually-authored content. It is composed from generated `_claude-md/workflow/` modules.

**Rationale:** A hand-maintained CLAUDE.md session section creates two copies of session workflow guidance with no synchronization mechanism. Regeneration from annotated source eliminates drift.

#### Session type determines artifacts and FSM changes

**Invariant:** Four session types exist, each with defined input, output, and FSM impact. Mixing outputs across session types (e.g., writing code in a planning session) violates session discipline.

**Rationale:** Session type confusion causes wasted work — a design mistake discovered mid-implementation wastes the entire session. Clear contracts prevent scope bleeding between session types.

| Session           | Input               | Output                      | FSM Change                     |
| ----------------- | ------------------- | --------------------------- | ------------------------------ |
| Planning          | Pattern brief       | Roadmap spec (.feature)     | Creates roadmap                |
| Design            | Complex requirement | Decision specs + code stubs | None                           |
| Implementation    | Roadmap spec        | Code + tests                | roadmap to active to completed |
| Planning + Design | Pattern brief       | Spec + stubs                | Creates roadmap                |

#### Planning sessions produce roadmap specs only

**Invariant:** A planning session creates a roadmap spec with metadata, deliverables table, Rule: blocks with invariants, and scenarios. It must not produce implementation code, transition to active, or prompt for implementation readiness.

**Rationale:** Planning is the cheapest session type — it produces .feature file edits, no compilation needed. Mixing implementation into planning defeats the cost advantage and introduces untested code without a locked scope.

| Do                                                  | Do NOT                     |
| --------------------------------------------------- | -------------------------- |
| Extract metadata from pattern brief                 | Create .ts implementation  |
| Create spec file with proper tags                   | Transition to active       |
| Add deliverables table in Background                | Ask Ready to implement     |
| Convert constraints to Rule: blocks                 | Write full implementations |
| Add scenarios: 1 happy-path + 1 validation per Rule |                            |

#### Design sessions produce decisions and stubs only

**Invariant:** A design session makes architectural decisions and creates code stubs with interfaces. It must not produce implementation code. Context gathering via the Process Data API must precede any explore agent usage.

**Rationale:** Design sessions resolve ambiguity before implementation begins. Code stubs in architect/stubs/ live outside src/ to avoid TypeScript compilation and ESLint issues, making them zero-risk artifacts.

| Use Design Session         | Skip Design Session |
| -------------------------- | ------------------- |
| Multiple valid approaches  | Single obvious path |
| New patterns/capabilities  | Bug fix             |
| Cross-context coordination | Clear requirements  |

#### Implementation sessions follow FSM-enforced execution order

**Invariant:** Implementation sessions must follow a strict 5-step execution order. Transition to active must happen before any code changes. Transition to completed must happen only when ALL deliverables are done. Skipping steps causes Process Guard rejection at commit time.

**Rationale:** The execution order ensures FSM state accurately reflects work state at every point. Writing code before transitioning to active means Process Guard sees changes to a roadmap spec (no scope protection). Marking completed with incomplete work creates a hard-locked state that requires unlock-reason to fix.

| Do NOT                              | Why                                     |
| ----------------------------------- | --------------------------------------- |
| Add new deliverables to active spec | Scope-locked state prevents scope creep |
| Mark completed with incomplete work | Hard-locked state cannot be undone      |
| Skip FSM transitions                | Process Guard will reject               |
| Edit generated docs directly        | Regenerate from source                  |

#### FSM errors have documented fixes

**Invariant:** Every Process Guard error code has a defined cause and fix. The error codes, causes, and fixes form a closed set — no undocumented error states exist.

**Rationale:** Undocumented FSM errors cause session-blocking confusion. A lookup table from error code to fix eliminates guesswork and prevents workarounds that bypass process integrity.

| Error                     | Cause                                          | Fix                                         |
| ------------------------- | ---------------------------------------------- | ------------------------------------------- |
| completed-protection      | File has completed status but no unlock tag    | Add libar-docs-unlock-reason tag            |
| invalid-status-transition | Skipped FSM state (e.g., roadmap to completed) | Follow path: roadmap to active to completed |
| scope-creep               | Added deliverable to active spec               | Remove deliverable OR revert to roadmap     |
| session-scope (warning)   | Modified file outside session scope            | Add to scope OR use --ignore-session        |
| session-excluded          | Modified excluded pattern during session       | Remove from exclusion OR override           |

| Situation                    | Solution              | Example                                   |
| ---------------------------- | --------------------- | ----------------------------------------- |
| Fix bug in completed spec    | Add unlock reason tag | libar-docs-unlock-reason:Fix-typo         |
| Modify outside session scope | Use ignore flag       | architect-guard --staged --ignore-session |
| CI treats warnings as errors | Use strict flag       | architect-guard --all --strict            |

#### Handoff captures session-end state for continuity

**Invariant:** Multi-session work requires handoff documentation generated from the Process Data API. Handoff output always reflects actual annotation state, not manual notes.

**Rationale:** Manual session notes drift from actual deliverable state. The handoff command derives state from annotations, ensuring the next session starts from ground truth rather than stale notes.

#### ClaudeModuleGeneration is the generation mechanism

**Invariant:** Phase 39 depends on ClaudeModuleGeneration (Phase 25). Adding `@architect-claude-module` and `@architect-claude-section:workflow` tags to this spec will cause ClaudeModuleGeneration to produce `_claude-md/workflow/` output files. The hand-written `_claude-md/workflow/` files are deleted after successful verified generation.

**Rationale:** The annotation work (Rule blocks in this spec) is immediately useful — queryable via `pnpm architect:query -- rules`. Generation deliverables cannot complete until Phase 25 ships the ClaudeModuleCodec. This sequencing is intentional: the annotation investment has standalone value regardless of whether the codec exists yet.

---

## Validation

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

### Anti-Pattern Detection

Enforces dual-source architecture ownership between TypeScript and Gherkin files.

#### Tag Location Constraints

| Tag                     | Correct Location | Wrong Location | Why                                |
| ----------------------- | ---------------- | -------------- | ---------------------------------- |
| `@architect-uses`       | TypeScript       | Feature files  | TS owns runtime dependencies       |
| `@architect-depends-on` | Feature files    | TypeScript     | Gherkin owns planning dependencies |
| `@architect-quarter`    | Feature files    | TypeScript     | Gherkin owns timeline metadata     |
| `@architect-team`       | Feature files    | TypeScript     | Gherkin owns ownership metadata    |

#### DoD Validation

For patterns with `completed` status, validates:

- All deliverables have terminal status (`complete`, `n/a`, or `superseded`) per `isDeliverableStatusTerminal()` — `deferred` is NOT terminal
- At least one `@acceptance-criteria` scenario exists in the spec

Run: `pnpm validate:all` for full validation including anti-patterns and DoD.

---

## Authoring

### Gherkin Authoring Patterns

#### Roadmap Spec Structure

```gherkin
@architect
@architect-pattern:ProcessGuardLinter
@architect-status:roadmap
@architect-phase:99
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

Tag inventory: `pnpm architect:query -- tags` (counts per tag and value across all sources).

#### Rule Block Structure (Mandatory)

Every feature file MUST use `Rule:` blocks with structured descriptions:

```gherkin
Rule: Reservations prevent race conditions

  **Invariant:** Only one reservation can exist for a given key at a time.

  **Rationale:** Check-then-create patterns have TOCTOU vulnerabilities.

  **Verified by:** Concurrent reservations, Expired reservation cleanup

  @acceptance-criteria @happy-path
  Scenario: Concurrent reservations are prevented
    Given an existing reservation for key "order-123"
    When another process attempts to reserve "order-123"
    Then the reservation fails with "already reserved"
```

| Element            | Purpose                                 | Extracted By             |
| ------------------ | --------------------------------------- | ------------------------ |
| `**Invariant:**`   | Business constraint (what must be true) | Business Rules generator |
| `**Rationale:**`   | Business justification (why it exists)  | Business Rules generator |
| `**Verified by:**` | Comma-separated scenario names          | Traceability generator   |

### Feature File Rich Content Guidelines

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

Code stubs live in `architect/stubs/{pattern-name}/` — annotated TypeScript with `throw new Error("not yet implemented")`.

#### Forbidden in Feature Descriptions

| Forbidden           | Why                             | Alternative                      |
| ------------------- | ------------------------------- | -------------------------------- |
| Code fences ` ``` ` | Not Gherkin syntax              | Use DocStrings with lang hint    |
| `@prefix` in text   | Interpreted as Gherkin tag      | Remove `@` or use `libar-dev`    |
| Nested DocStrings   | Gherkin parser error            | Reference code stub file         |
| `#` at line start   | Gherkin comment — kills parsing | Remove, use `//`, or step DocStr |

#### Tag Value Constraints

**Tag values cannot contain spaces.** Use hyphens instead:

| Invalid                         | Valid                          |
| ------------------------------- | ------------------------------ |
| `@unlock-reason:Fix for issue`  | `@unlock-reason:Fix-for-issue` |
| `@architect-pattern:My Pattern` | `@architect-pattern:MyPattern` |

---
