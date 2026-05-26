# Execution Plan — WS-1 strategy & projection-pilot detail (archived)

> Archived 2026-05-26 from EXECUTION-PLAN.md sections 3-5. WS-1 (annotation
> re-enablement) is complete; this is the pilot strategy, the projection
> pipeline reference, and the per-cluster worklist as executed. Live plan
> (gates + current workstream status) -> ../EXECUTION-PLAN.md

---

## 3. WS-1 strategy

1. **Subsystem-first, not boil-the-ocean.** Pilot on the projection/doc-gen
   pipeline (49 orphans, highest density, and the subsystem most needed for the
   doc-gen vision). Prove the method, measure, then expand to core → guard →
   cli → mcp.
2. **Four enrichment dimensions, prioritized by leverage:**
   1. **Edges** (`@architect-uses`) — biggest unlock, lowest cost.
   2. **Classification** (`@architect-role`, `@architect-bounded-context`) — cheap; mostly present in projection.
   3. **Shapes** (`@architect-shape`) — high value for "what are the data contracts."
   4. **Invariants** (`Rule:` blocks in executable features) — most effort; add **only where architecturally significant** (no ceremonial rules).
3. **Additive, under the refactoring carve-out** (`architect-refactor-session`).
   Shipped code, no design specs → enrich `.ts` JSDoc additively; never move a
   behavioral pattern's identity; edges authored (reverse edges derive); No-BC;
   gates non-negotiable.
4. **Two work types, kept separate:**
   - **(A) Enrich existing patterns** — the 107 orphans. Pure additive, ~90% of effort.
   - **(B) New code-originated identity** — for genuinely un-patterned shipped
     abstractions (`ExtractedPattern`, `BlockSchema`, un-patterned codecs).
     Smaller; identity surface decided in DECISIONS D-3.

## 4. Projection pipeline reference (self-contained)

The data flow the pilot connects:

```
.ts JSDoc ─┐
           ├─► DocExtractor ─┐
.feature ──┴─► GherkinExtractor ─► DualSourceExtractor ─► ExtractedPattern (read model, ~60 fields)
                ShapeExtractor ─┘                              │
                                                               ▼
                                            42 Fragment kinds (Zod, role:contract)
                                            grouped in 6 bounded-contexts:
                                              pattern-relations · governance ·
                                              execution-context · operational-insights ·
                                              delivery-reporting · documentation-composition
                                                               │
                              ProjectionFragmentSchema (discriminated union of all kinds)
                                                               │
                          FragmentRendererDispatch (role:codec, dispatchByKind)
                                                               │
                       ┌────────────┬───────────┬──────────────┐
                  MarkdownRenderer JsonRenderer UiRenderer CompactTextRenderer
                       (each consumes the union; Markdown also renders BlockSchema primitives)

BlockSchema (blocks/schema.ts): heading·paragraph·separator·table·list·code·mermaid·link-out·collapsible
  — inline content primitives used inside prose-carrying fragments (e.g. DecisionRecord.decision: Block[])
```

## 5. WS-1 Phase 1 — projection pilot (grounded against real files)

All targets verified on HEAD. Files are under `packages/architect-projection/src/`.

### Cluster A — Renderer spine (DONE; verified edges per-file)

Edges are **per-file verified, not uniform** — `render-json.ts` serializes
generically and does NOT import `dispatchByKind`, so it must NOT declare
`FragmentRendererDispatch`. Syntax: `@architect-uses A, B` (space, no colon).

| File                               | Pattern                  | `@architect-uses`                                               |
| ---------------------------------- | ------------------------ | --------------------------------------------------------------- |
| `renderers/render-markdown.ts`     | MarkdownRenderer         | FragmentRendererDispatch, ProjectionFragmentSchema, BlockSchema |
| `renderers/render-ui.ts`           | UiRenderer               | FragmentRendererDispatch, ProjectionFragmentSchema, BlockSchema |
| `renderers/render-compact-text.ts` | CompactTextRenderer      | FragmentRendererDispatch, ProjectionFragmentSchema              |
| `renderers/render-json.ts`         | JsonRenderer             | ProjectionFragmentSchema (no dispatch)                          |
| `renderers/_shared/dispatch.ts`    | FragmentRendererDispatch | ProjectionFragmentSchema                                        |

- **Acceptance (met):** `dep-tree MarkdownRenderer` and `arch neighborhood ProjectionFragmentSchema` return a connected graph; `FragmentRendererDispatch` consumers are markdown/ui/compact (correctly **not** json).

### Cluster B — Block primitives (new code-originated identity + edges)

- `blocks/schema.ts` → add `@architect-pattern BlockSchema` (`@architect-role:contract`,
  `@architect-bounded-context:rendering`, `@architect-status:active`). (D-3 → code-originated.)
- Prose-carrying fragments (`governance/decision-record.ts` `DecisionRecord`, plus any
  fragment whose schema carries `Block[]`) → `@architect-uses:BlockSchema`.
- **Acceptance:** `pattern BlockSchema` resolves; `arch neighborhood BlockSchema` shows fragment consumers.

### Cluster C — Fragment union membership (modeling call — see D-4)

- `fragments/fragment-schema.internal.ts` (`ProjectionFragmentSchema`) is a flat
  ~44-member discriminated union.
- **Recommended (D-4): light model** — edge the union only into the renderer spine
  (Cluster A already does this); do **not** author 44 `uses` edges. Rely on
  `bounded-context` for "what fragments live in context X."

### Cluster D — Read-model bridge (optional pull-in from core)

- `architect-core/src/validation-schemas/extracted-pattern.ts` → create
  `@architect-pattern ExtractedPattern` (code-originated; `role:read-model` or `contract`).
- Edge fragments / projection functions `@architect-uses:ExtractedPattern`.
- Defer to expansion unless we want the data root connected during the pilot.

### Cluster E — Fragment kinds via producers (Session 02+, see D-7)

The ~40 orphan fragment kinds (`PatternDetail`, `BusinessRule`, …) are connected
through their **producer**, not the re-export barrel. Each `<X>Projection`
function returns `ProjectionBundle<X>` and builds `kind: 'X'`, so
`<X>Projection @architect-uses <X>` is the true producer→product edge.
**Rejected:** `<Context>FragmentContracts uses <members>` — the barrel is a pure
re-export surface; that edge inverts the dependency (D-7). One context per
session (pattern-relations first). Some functions produce >1 fragment — verify
each against the return type + `kind:` literals.
