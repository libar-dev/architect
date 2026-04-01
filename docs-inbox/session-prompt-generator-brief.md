# Pattern Brief: Session Prompt Generator

> **Status:** Ready for Planning Session
> **Scope:** New capability for `@libar-dev/architect`
> **Phase:** TBD (after DataAPIDesignSessionSupport)
> **Depends on:** DataAPIDesignSessionSupport (completed), PatternGraphAPI (completed)

---

## Problem Statement

Session prompts for design and implementation sessions are manually crafted each time. This is:

1. **Time-consuming** — assembling pattern context, conventions, rules, and execution checklists takes 5-10 minutes per session start
2. **Error-prone** — conventions drift between CLAUDE.md, MEMORY.md, and decision records
3. **Inconsistent** — different sessions get different levels of context depending on what the human remembers to include
4. **Unscalable** — grows linearly worse as the monorepo adds packages and patterns

The Process API already solves the _dynamic data_ half of this problem (`context --session`, `scope-validate`, `dep-tree`, `stubs`). What's missing is the _static convention_ half: testing policy, lint rules, FSM rules, CLI patterns, execution checklists, and session-type-specific prohibitions.

## Proposed Solution

Generate complete session prompts by composing:

- **Dynamic pattern data** from PatternGraphAPI (already exists)
- **Static conventions** from tagged decision records (new capability)
- **Session-type rules** that filter conventions by applicability (new capability)

Expose via a new CLI subcommand:

```bash
pnpm architect:query -- session-prompt <pattern> --type implement
pnpm architect:query -- session-prompt <pattern> --type design
```

---

## Architectural Analysis

### Two Rendering Paths (ADR-008)

The codebase has two deliberate rendering architectures:

| Path           | Pipeline                                                | Audience                  | Format                    |
| -------------- | ------------------------------------------------------- | ------------------------- | ------------------------- |
| **Codec path** | PatternGraph -> Codec -> RenderableDocument -> Markdown | Human docs / AI reference | Markdown                  |
| **Text path**  | PatternGraph -> Assembler -> Formatter -> Plain text    | AI session context        | `=== SECTION ===` markers |

Session prompts are AI session context. They belong on the **text path**.

### Approach Considered: Recipe + Template Engine

A recipe-based approach was evaluated where:

- Prompt structure is defined as a Gherkin `.feature` file with Source Mapping tables
- `{{variable}}` template substitution injects pattern-specific data
- Decision records supply convention content via Source Mapping extraction

**Why this was rejected:**

| Issue                          | Detail                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Wrong output format            | Recipes produce markdown; prompts need compact text (ADR-008)                                          |
| No template system exists      | Codebase uses programmatic codecs, not templates                                                       |
| Recipes are static             | Source Mapping tables reference fixed file paths; prompts need runtime parameterization                |
| New extraction method required | Source Mapping dispatches by file type (.ts, .feature, THIS DECISION) — no "API query" dispatch exists |
| Two rendering passes           | Would extract via recipe then re-format to text                                                        |

The recipe pipeline is powerful for reference documentation but solves a different problem.

### Recommended Approach: Extended Assembler (Text Path)

Follow the established pattern from `scope-validator.ts` and `handoff-generator.ts`:

```
Decision Records (tagged @convention) ---+
                                         +--> assembleSessionPrompt() --> SessionPromptBundle --> formatSessionPrompt()
PatternGraphAPI queries -----------------+                                                            |
                                                                                                Structured text
```

**Why this approach:**

1. **ADR-008 aligned** — text output for AI, not markdown
2. **No new engine** — extends existing assembler + formatter pattern
3. **Parameterized by design** — pattern name is already a parameter
4. **Convention injection is pure data** — filter decision records by `@convention` tag, extract Rule block content
5. **Co-located formatter** — per PDR-002 DD-7, formatters live with their data assemblers

**Existing infrastructure reused:**

| Component               | Already Exists | Used For                                           |
| ----------------------- | -------------- | -------------------------------------------------- |
| `assembleContext()`     | Yes            | Pattern metadata, stubs, deps, deliverables, FSM   |
| `validateScope()`       | Yes            | Pre-flight readiness checks                        |
| `generateHandoff()`     | Yes            | Session-end state summary                          |
| `formatContextBundle()` | Yes            | Text rendering with `=== SECTION ===` markers      |
| PatternGraph patterns   | Yes            | Decision records are already extracted as patterns |

**Only truly new piece:** Convention extraction — filter `dataset.patterns` for decision records with `@architect-convention` tags, extract their Rule block content, group by topic.

---

## Taxonomy Extension

### Required: `@architect-convention` (csv format)

Classifies decision records as convention sources. Orthogonal to existing `@architect-adr-category` (which is too coarse — "process" covers both testing policy and FSM rules).

**Values:** `testing-policy`, `lint-rules`, `fsm-rules`, `cli-patterns`, `pattern-naming`, `session-workflow`, `output-format`

**Example on existing decision records:**

```gherkin
@architect-adr:004
@architect-convention:testing-policy
Feature: ADR-004 Gherkin-Only Testing
```

```gherkin
@architect-adr:008
@architect-convention:output-format
Feature: ADR-008 Text Output Path
```

### Deferred: `@architect-session-type` (csv format)

Filtering conventions by session type. Can be hardcoded initially since the mapping is stable:

| Convention         | Applies to        |
| ------------------ | ----------------- |
| `testing-policy`   | implement         |
| `lint-rules`       | implement         |
| `fsm-rules`        | implement, design |
| `cli-patterns`     | implement         |
| `pattern-naming`   | design, planning  |
| `session-workflow` | all               |
| `output-format`    | design, implement |

If this mapping changes frequently, promote to a taxonomy tag. Until then, YAGNI.

### Not Recommended: `@architect-prompt-section`

Redundant with existing Source Mapping `THIS DECISION (Rule: RuleName)` extraction. The assembler knows prompt structure programmatically — it doesn't need tags to discover it.

---

## Convention Migration Plan

Static conventions currently scattered across CLAUDE.md and MEMORY.md should move to decision records. This is independently valuable even without prompt generation.

### Existing Decision Records to Tag

| Decision Record              | Convention Tag   | Content to Extract                                         |
| ---------------------------- | ---------------- | ---------------------------------------------------------- |
| ADR-004 Gherkin-Only Testing | `testing-policy` | Test safety rules, forbidden patterns, Gherkin-only policy |
| ADR-006 Process Guard        | `fsm-rules`      | FSM transitions, protection levels, escape hatches         |
| ADR-008 Text Output Path     | `output-format`  | Text vs markdown decision, `=== SECTION ===` format        |

### New Decision Records to Create

| Decision                           | Convention Tag   | Content                                                                                                               |
| ---------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| ADR-009 Coding Conventions         | `lint-rules`     | strict-boolean-expressions, no-non-null-assertion, array-type, consistent-type-imports, explicit-function-return-type |
| ADR-010 CLI Patterns               | `cli-patterns`   | Manual arg parsing, handleCliError, printVersionAndExit, `--` separator handling                                      |
| ADR-011 Pattern Naming Conventions | `pattern-naming` | Feature file vs TypeScript pattern names, `@implements` requirement, naming conflict avoidance                        |
| ADR-012 vitest-cucumber Patterns   | `testing-policy` | Two-pattern problem (Scenario vs ScenarioOutline), And steps, Rule keyword pattern, DataTable/DocString access        |

### What Stays in CLAUDE.md

CLAUDE.md retains its role as the entry point, but convention sections become **generated from decision records** rather than manually maintained. The raw project structure, common commands, and architecture overview remain hand-authored.

---

## Deliverables (Draft)

### Phase A: Convention Infrastructure

| Deliverable                             | Location                                                       | Tests              |
| --------------------------------------- | -------------------------------------------------------------- | ------------------ |
| Add `convention` tag to taxonomy        | `src/taxonomy/registry-builder.ts`                             | Yes (unit)         |
| Tag existing ADRs with convention       | `architect/decisions/adr-004,006,008.feature`                  | No (metadata only) |
| Create ADR-009 Coding Conventions       | `architect/decisions/adr-009-coding-conventions.feature`       | No (spec only)     |
| Create ADR-010 CLI Patterns             | `architect/decisions/adr-010-cli-patterns.feature`             | No (spec only)     |
| Create ADR-011 Pattern Naming           | `architect/decisions/adr-011-pattern-naming.feature`           | No (spec only)     |
| Create ADR-012 vitest-cucumber Patterns | `architect/decisions/adr-012-vitest-cucumber-patterns.feature` | No (spec only)     |

### Phase B: Convention Extraction

| Deliverable                                          | Location                                                | Tests      |
| ---------------------------------------------------- | ------------------------------------------------------- | ---------- |
| Convention extractor (filter by tag + extract Rules) | `src/api/convention-extractor.ts`                       | Yes (unit) |
| Convention type definitions                          | `src/api/convention-extractor.ts` (co-located)          | N/A        |
| Convention text formatter                            | `src/api/convention-extractor.ts` (co-located per DD-7) | Yes (unit) |

### Phase C: Session Prompt Assembly

| Deliverable                     | Location                                          | Tests             |
| ------------------------------- | ------------------------------------------------- | ----------------- |
| Session prompt assembler        | `src/api/session-prompt.ts`                       | Yes (unit)        |
| Session prompt text formatter   | `src/api/session-prompt.ts` (co-located per DD-7) | Yes (unit)        |
| `session-prompt` CLI subcommand | `src/cli/process-api.ts`                          | Yes (integration) |

---

## Design Decisions Log

### DD-1: Text Path Over Recipe Pipeline

**Decision:** Use the assembler/formatter text path (ADR-008), not the recipe/Source Mapping/markdown pipeline.

**Rationale:** Session prompts are AI session context. The codebase has a deliberate separation between markdown docs (codec path) and AI context (text path). Routing prompts through the recipe pipeline would require a template engine, a new extraction method, and two rendering passes.

**Alternatives considered:** Recipe + `{{variable}}` template engine. Rejected because it introduces a new subsystem against the architectural grain and the output format doesn't match.

### DD-2: Convention Tags Over Session-Type Tags

**Decision:** Add `@architect-convention` taxonomy tag. Defer `@architect-session-type` — hardcode the convention-to-session mapping initially.

**Rationale:** The convention→session mapping is stable and small (7 conventions x 3 session types). A taxonomy tag adds maintenance burden for a mapping that rarely changes. Promote to a tag if the mapping grows or changes frequently.

### DD-3: Decision Records as Convention Source

**Decision:** Conventions live in decision records (ADR/PDR), not in a separate convention format.

**Rationale:** Decision records already exist, are already extracted by the pipeline, already support Rule blocks with structured content, and are already queryable via `pnpm architect:query -- decisions`. No new file format or extraction path needed.

### DD-4: Co-located Formatter Pattern

**Decision:** Session prompt formatter lives in the same file as the assembler, following PDR-002 DD-7.

**Rationale:** Established by `scope-validator.ts` (line 134) and `handoff-generator.ts` (line 180). Pure function that takes structured data and produces text. No reason to separate.

### DD-5: Incremental Value at Each Phase

**Decision:** Three phases (convention infrastructure → extraction → prompt assembly) where each is independently valuable.

**Rationale:**

- Phase A alone makes conventions queryable via `decisions` command
- Phase A + B enables `pnpm architect:query -- conventions --topic lint-rules`
- Phase A + B + C enables the full `session-prompt` subcommand

No phase depends on all previous phases being perfect.

---

## Expected Output Format

```
=== SESSION PROMPT: DataAPIDesignSessionSupport (implement) ===
Pattern: DataAPIDesignSessionSupport | Phase: 44 | Status: active
4 deliverables (2 completed, 2 remaining)

=== SCOPE VALIDATION ===
[PASS] Dependencies completed: 3/3
[PASS] Deliverables defined: 4 deliverable(s) found
[PASS] FSM allows transition: roadmap -> active is valid
[PASS] Design decisions recorded: 7 decision(s) in 2 stub(s)
[WARN] Executable specs location set: No @executable-specs tag found

=== CONTEXT ===
[existing context bundle output]

=== CONVENTIONS: testing-policy ===
- All tests must be .feature files (Gherkin-only policy)
- No .test.ts files in new code
- Edge cases use Scenario Outline with Examples tables
- And is a SEPARATE function: destructure ({ Given, When, Then, And })
- Scenario uses {string}/{int} params; ScenarioOutline uses <column> variables

=== CONVENTIONS: lint-rules ===
- strict-boolean-expressions: use `arg?.startsWith('-') === true`
- no-non-null-assertion: use explicit undefined checks
- array-type: readonly T[] for simple, ReadonlyArray<T> for complex
- consistent-type-imports: no inline import() — use separate import type
- explicit-function-return-type: required on exported functions

=== CONVENTIONS: fsm-rules ===
- Transition to active FIRST before any code changes
- Valid path: roadmap -> active -> completed
- Active = scope-locked (no new deliverables)
- Completed = hard-locked (needs @unlock-reason)

=== EXECUTION ORDER ===
1. Transition spec to active
2. Implement deliverables in dependency order
3. For each: implement, write Gherkin test, update deliverable status
4. Transition to completed when ALL done
5. Regenerate docs: pnpm docs:all
6. Verify: pnpm lint && pnpm test

=== DO NOT ===
- Add new deliverables to active spec (scope-locked)
- Update generated docs manually (regenerate from source)
- Create .test.ts files (Gherkin-only policy)
- Mark completed with incomplete work (hard-locked, cannot undo)
- Skip FSM transitions (Process Guard will reject)
```

---

## Validation Criteria

When this feature is complete, the following should be true:

1. `pnpm architect:query -- session-prompt <pattern> --type implement` produces a complete implementation prompt
2. `pnpm architect:query -- session-prompt <pattern> --type design` produces a complete design prompt
3. Convention content comes from decision records, not hardcoded strings
4. Adding a new convention = creating/tagging a decision record (no code changes to prompt generator)
5. Output uses `=== SECTION ===` text format (ADR-008 aligned)
6. All conventions currently in CLAUDE.md are traceable to a decision record

---

## Session Workflow

This brief is ready for a **Planning Session** to create the roadmap spec:

```
architect/specs/SessionPromptGenerator.feature
```

If the design decisions above are accepted, the design session can be skipped (DD-1 through DD-5 cover the major architectural choices). If any decisions need revision, run a design session first to explore alternatives.

**Recommended path:**

```
This Brief -> Planning Session -> Implementation Session (Phase A)
                                -> Implementation Session (Phase B)
                                -> Implementation Session (Phase C)
```

**Context gathering for the planning session:**

```bash
pnpm architect:query -- overview
pnpm architect:query -- arch coverage
pnpm architect:query -- tags
pnpm architect:query -- decisions DataAPIDesignSessionSupport
```
