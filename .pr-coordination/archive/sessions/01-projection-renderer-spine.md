# Session 01 — Projection renderer spine (WS-1, Cluster A + B)

> Paste-ready worker prompt. Execute exactly this scope; do not re-plan.
> Read `../EXECUTION-PLAN.md` §4–§8 and `../DECISIONS.md` first.

## Preamble (mandatory)

1. Load skills `architect-base` + `architect-data-api` + `architect-refactor-session`.
2. This is additive enrichment of **shipped code** (refactoring carve-out): no
   design spec exists, no `@architect-pattern` moves, edges authored not reversed,
   No-BC, gates non-negotiable.
3. Use `pnpm architect:query` for pattern state — do not file-scan to learn state.

> **STATUS: EXECUTED** (2026-05-25). Edges below are the **verified** set
> (each confirmed against real imports). Syntax note: `@architect-uses` is
> **space-separated, no colon** (`@architect-uses A, B`), unlike `@architect-role:`.

## Scope (this session only)

**Cluster A — renderer spine.** In `packages/architect-projection/src/renderers/`,
append a `@architect-uses` line after the `@architect-bounded-context:rendering`
line. **Verify edges per-file against imports — do NOT assume all renderers are
identical** (`render-json.ts` does NOT import `dispatchByKind`, so it must NOT
declare `FragmentRendererDispatch`).

| File                     | Pattern                  | `@architect-uses` (verified)                                          |
| ------------------------ | ------------------------ | --------------------------------------------------------------------- |
| `render-markdown.ts`     | MarkdownRenderer         | `FragmentRendererDispatch, ProjectionFragmentSchema, BlockSchema`     |
| `render-ui.ts`           | UiRenderer               | `FragmentRendererDispatch, ProjectionFragmentSchema, BlockSchema`     |
| `render-compact-text.ts` | CompactTextRenderer      | `FragmentRendererDispatch, ProjectionFragmentSchema`                  |
| `render-json.ts`         | JsonRenderer             | `ProjectionFragmentSchema` (serializes generically — **no dispatch**) |
| `_shared/dispatch.ts`    | FragmentRendererDispatch | `ProjectionFragmentSchema`                                            |

**Cluster B — block primitives.** In `packages/architect-projection/src/`:

- `blocks/schema.ts`: add a JSDoc identity block —
  `@architect` / `@architect-pattern BlockSchema` / `@architect-status active` /
  `@architect-role:contract` / `@architect-bounded-context:rendering`, with a 1–3
  line description of the inline content primitives.
- Fragments whose Zod schema carries `Block[]` (verified by `from '../blocks/schema'`
  import): `DecisionRecord`, `DocumentationCompositionSupporting`, `PrChangeReview`,
  `ArchitectureDiagram`, `OperationalInsightsSupporting` → add `@architect-uses BlockSchema`.
- `MarkdownRenderer` + `UiRenderer` already get `BlockSchema` via Cluster A (both import `Block`).

**Ordering:** create `BlockSchema` identity (B) **before** any edge that points at
it, or land both in the same commit — otherwise `arch dangling` trips.

## Out of scope

- Cluster C 44-member union edges (D-4 light model — skip).
- Cluster D `ExtractedPattern` (core package — later session).
- Any `Rule:`/invariant authoring. Any non-projection package.

## Gates (run before commit)

Run the full sequence in `../EXECUTION-PLAN.md §6`. Targeted slice after edits:
`pnpm --filter @libar-dev/architect-projection test && pnpm typecheck`.

## Acceptance

- `pnpm architect:query dep-tree MarkdownRenderer` shows the renderer→dispatch→schema chain.
- `pnpm architect:query arch neighborhood ProjectionFragmentSchema` shows renderer consumers.
- `pnpm architect:query pattern BlockSchema` resolves with its consumers.
- `pnpm architect:query -- arch orphans` projection count dropped by ≥6 (the spine + BlockSchema consumers).
- `arch dangling --strict` exits 0.

## On completion

Append a < 20-line entry to `../SESSION-REPORTS-AND-LEARNINGS.md` (commit sha,
any scope discovered + inline/deferred classification, rules for next session).
