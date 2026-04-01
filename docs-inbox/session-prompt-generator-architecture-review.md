# Architectural Review: Session Prompt Generation

## Executive Summary

The proposed architecture — recipe-driven prompt generation with taxonomy extensions for convention classification — is **directionally correct** but has a **fundamental tension** with the codebase's established rendering architecture. The proposal routes AI-facing output through the recipe→markdown pipeline, when the codebase has deliberately established a separate text output path (ADR-008) for exactly this purpose.

The good news: **80% of what a session prompt needs already exists** in the context-assembler + context-formatter. The remaining 20% — convention injection and session-type rules — can be added evolutionarily rather than requiring a new template engine.

---

## 1. What the Proposal Gets Right

`★ Insight ─────────────────────────────────────`
**Three strong architectural insights in the proposal:**

1. "Conventions should live in decision records" — this correctly applies the code-first principle to process knowledge itself
2. "Recipe-like declarative structure" — visible, auditable prompt composition is genuinely valuable
3. "Projections from the same source" — the USDP methodology applied to session prompts, not just docs
   `─────────────────────────────────────────────────`

The insight that **CLAUDE.md sections should be generated from decision records** is the most valuable idea here. Today CLAUDE.md is manually maintained — 400+ lines of conventions that can drift from reality. If conventions lived in tagged decision records, they'd be queryable, versionable, and composable. This is independently valuable regardless of the prompt generation approach.

---

## 2. Fundamental Architectural Tension

The codebase has **two deliberate rendering paths** established by ADR-008:

| Path           | Pipeline                                                                 | Audience                  | Format                               |
| -------------- | ------------------------------------------------------------------------ | ------------------------- | ------------------------------------ |
| **Codec path** | PatternGraph → Codec → RenderableDocument → UniversalRenderer → Markdown | Human docs / AI reference | Markdown with headers, tables, lists |
| **Text path**  | PatternGraph → Assembler → Formatter → Plain text                        | AI session context        | `=== SECTION ===` markers, compact   |

Session prompts are **AI session context** — they tell an agent what to do. Per the codebase's own architectural decisions, they belong on the text path.

**The proposal routes them through the codec path** (recipe → Source Mapping → extraction → markdown). This creates three problems:

### Problem 1: Wrong output format

Recipes produce markdown with `###` headers, pipe tables, and code fences. Session prompts need the compact `=== SECTION ===` format that the ContextFormatter already uses. You'd extract content via recipe then re-format it for text — two rendering passes.

### Problem 2: Template engine doesn't exist

The codebase uses **programmatic codecs**, not templates. Look at the architecture:

```
source-mapper.ts:647  →  executeSourceMapping() dispatches by file type
source-mapper.ts:682  →  .ts → extractFromTypeScript()
source-mapper.ts:685  →  .feature → extractFromBehaviorSpec()
source-mapper.ts:679  →  THIS DECISION → extractFromDecision()
```

There's no `→ API query` dispatch. Adding `{{pattern}}` template variables would require:

- A new template parser
- A new extraction method ("runtime API query")
- Template variable resolution context

This is a significant new subsystem that goes against the grain.

### Problem 3: Recipes are static, prompts are parameterized

Look at `process-guard-reference.feature:29-42` — every Source Mapping entry references a specific file path. Recipes produce fixed documents. A prompt recipe would need to say "run `dep-tree {{pattern}}`" — but the Source Mapping pipeline resolves file paths at extraction time (`source-mapper.ts:658-675`), not template variables.

---

## 3. What Already Exists (and How Close It Is)

The context assembler (`context-assembler.ts:285-428`) already does **exactly the right thing** for session prompts:

1. **Session-type filtering** (lines 323-383) — design gets stubs + consumers + arch neighbors; implement gets FSM + test files
2. **Parameterization** — takes pattern name as input, assembles per-pattern data
3. **Structured output** — produces typed `ContextBundle` that the formatter renders

The context formatter (`context-formatter.ts:32-122`) renders this as compact text with `=== SECTION ===` markers.

**What's missing from the current `context --session` output for a complete prompt:**

| Missing Piece               | Where It Could Come From                |
| --------------------------- | --------------------------------------- |
| Session rules (do NOT...)   | Decision records tagged as conventions  |
| Lint conventions            | Decision records tagged as conventions  |
| Testing policy              | Decision records tagged as conventions  |
| Execution order / checklist | Decision records tagged as conventions  |
| Validation checkpoints      | Already exist: `scope-validate` command |

The gap is **convention injection** — loading relevant rules from decision records into the context bundle. This is a data problem, not a rendering problem.

---

## 4. Taxonomy Extension Evaluation

### `@architect-convention` (P0) — Recommended with refinement

This is useful. Decision records already have `@architect-adr-category` (process/architecture/tooling), but that's too coarse. A convention like "Gherkin-only testing" and a convention like "FSM transition rules" both have `adr-category:process` but serve different prompt sections.

**Recommendation:** Add `@architect-convention` as `csv` format. Values like `testing-policy`, `lint-rules`, `fsm-rules`, `cli-patterns`, `pattern-naming`. This is orthogonal to `adr-category`.

### `@architect-session-type` (P1) — Recommended but optional

Filtering conventions by session type is valuable. ADR-004 (Gherkin-only testing) applies to implementation sessions but not design sessions. However, this can be computed from the convention topic rather than tagged explicitly:

| Convention       | Applies to        |
| ---------------- | ----------------- |
| `testing-policy` | implement         |
| `lint-rules`     | implement         |
| `fsm-rules`      | implement, design |
| `pattern-naming` | design, planning  |

If the mapping is stable, hardcode it in the assembler. If it changes frequently, tag it. For now, I'd hardcode it and add the tag later if needed (YAGNI).

### `@architect-prompt-section` (P2) — Not recommended

The Source Mapping system already supports `THIS DECISION (Rule: RuleName)` for extracting specific Rule blocks. This tag is redundant with existing infrastructure.

More importantly, prompt sections should be assembled **programmatically** from convention content, not marked up in source. The assembler knows what the prompt structure is — it doesn't need tags to tell it.

---

## 5. The Recommended Architecture

Instead of recipe→template→markdown, I recommend **extending the existing context assembly pipeline**:

```
PatternGraph ──→ assembleContext()      ──→ ContextBundle          ──→ formatContextBundle() ──→ text
                  (existing, + conventions)   (extended with conventions)  (extended sections)
```

### New data flow

```
Decision Records (tagged @convention) ─┐
                                       ├──→ assembleSessionPrompt() ──→ SessionPromptBundle ──→ formatSessionPrompt()
PatternGraphAPI queries ───────────────┘                                                           ↓
                                                                                              Structured text
```

### Why this is better

1. **ADR-008 aligned** — text output for AI, not markdown
2. **No new engine** — extends existing assembler + formatter pattern (same as scope-validator, handoff-generator)
3. **Parameterized by design** — pattern name is already a parameter
4. **Convention injection is pure data** — filter decision records from PatternGraph by `@convention` tag, extract Rule block content
5. **Co-located formatter** — per PDR-002 DD-7, formatters live with their data assemblers (see `scope-validator.ts:134`, `handoff-generator.ts:180`)

### What the prompt assembler does

```typescript
// Pseudocode
function assembleSessionPrompt(api, dataset, options):
  1. bundle = assembleContext(dataset, api, options)        // existing
  2. scopeResult = validateScope(api, dataset, scopeOpts)   // existing
  3. conventions = extractConventions(dataset, sessionType)  // NEW
  4. return { ...bundle, conventions, scopeResult }
```

Step 3 is the only new thing: filter `dataset.patterns` for decision records with `@architect-convention` tags, extract their Rule block content, group by convention topic.

`★ Insight ─────────────────────────────────────`
**The recipe system's real value — declarative content structure — can be preserved without using the recipe pipeline.** Define the prompt section ordering in a simple config or constant (which conventions go in which order, for which session types). This gives you the auditability of a recipe without the rendering overhead. The "recipe" is just a data structure, not a Gherkin feature file.
`─────────────────────────────────────────────────`

---

## 6. Implementation Sequence (Revised)

### Step 1: Extract conventions into decision records (same as proposed)

Create ADR-009 (Coding Conventions), ADR-010 (CLI Patterns), ADR-011 (Pattern Naming). Tag existing ADRs with `@architect-convention`.

This is independently valuable — it makes conventions queryable via `pnpm architect:query -- decisions`.

### Step 2: Add `convention` tag to taxonomy

Single entry in `registry-builder.ts`. Format: `csv`. Then tag decision records.

### Step 3: Build `assembleSessionPrompt()` + `formatSessionPrompt()`

A new file `src/api/session-prompt.ts` following the established pattern (see how `scope-validator.ts` and `handoff-generator.ts` are structured: typed data → assembler → co-located formatter).

The assembler:

- Calls existing `assembleContext()` for pattern data
- Calls existing `validateScope()` for readiness checks
- Filters decision records by `@convention` tag + session type
- Extracts Rule block content from matching decisions
- Composes into `SessionPromptBundle`

The formatter:

- Renders using `=== SECTION ===` markers
- Session rules, conventions, execution order from decision records
- Pattern context, deliverables, deps from the context bundle
- Validation checklist from scope validation

### Step 4: Wire `session-prompt` subcommand

Add to `src/cli/process-api.ts` following the established CLI pattern.

```bash
pnpm architect:query -- session-prompt DataAPIDesignSessionSupport --type implement
```

---

## 7. What About the Recipe Approach?

I don't think the recipe approach is wrong — it's premature. The recipe pipeline is powerful but it solves a different problem: generating **reference documentation** from source code. It has:

- File I/O for extraction (reads TypeScript, parses Gherkin)
- Markdown rendering
- Progressive disclosure (compact vs detailed)
- Static Source Mapping tables

Session prompts need:

- In-memory API queries (no file I/O)
- Text rendering (not markdown)
- Parameterization per pattern
- Dynamic content composition

If you find that the programmatic approach (Step 3) becomes hard to maintain — too many session types, too many convention combinations, too much logic in TypeScript — then **that's the signal** to introduce a declarative recipe layer. But start with the simpler approach and let the complexity justify itself.

### Potential future: Prompt Recipe as Configuration

If you do eventually need declarative prompt structure, consider a lighter format than Gherkin:

```typescript
// src/api/prompt-config.ts
export const IMPLEMENT_PROMPT_SECTIONS: readonly PromptSection[] = [
  { type: 'context-bundle', sessionType: 'implement' },
  { type: 'scope-validation', scopeType: 'implement' },
  { type: 'convention', topics: ['testing-policy', 'lint-rules', 'fsm-rules'] },
  { type: 'execution-order', template: 'implement-checklist' },
  { type: 'prohibitions', template: 'implement-donts' },
];
```

This is auditable, version-controlled, and doesn't require a template engine or the full recipe pipeline.

---

## 8. Risk Assessment

| Risk                       | Recipe+Template Approach                       | Extended Assembler Approach              |
| -------------------------- | ---------------------------------------------- | ---------------------------------------- |
| Architecture drift         | High — new engine against the grain            | Low — follows established patterns       |
| Implementation complexity  | High — template parser + new extraction method | Low — filter + format                    |
| Maintenance burden         | Medium — recipe files + template syntax        | Low — TypeScript config                  |
| Convention discoverability | High — visible in .feature files               | Medium — visible in TypeScript constants |
| Future flexibility         | High — declarative is composable               | Medium — but can upgrade to config later |

---

## Summary Recommendation

1. **Do** extract conventions into decision records (proposed Step 1) — this is the highest-value change
2. **Do** add `@architect-convention` to the taxonomy (proposed P0)
3. **Don't** build a template engine — extend the existing assembler/formatter pattern instead
4. **Don't** route prompts through the recipe/markdown pipeline — use the text output path (ADR-008)
5. **Do** follow the `scope-validator.ts` / `handoff-generator.ts` pattern for the new module
6. **Defer** the recipe approach until the programmatic one proves insufficient

The resulting `session-prompt` command would compose from **four existing capabilities** (context assembly, scope validation, handoff structure, decision record content) plus **one new capability** (convention extraction by tag). That's the minimum complexity for maximum leverage.
