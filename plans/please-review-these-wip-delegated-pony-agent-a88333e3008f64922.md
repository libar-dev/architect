# Cluster review: block-vocab-reconciliation (IA-findings R8 / ADR-010 consequence)

Read-only verification. No edits beyond this plan file.

## Verdict: claim HOLDS

Two genuinely distinct block vocabularies coexist today; reconciliation to one (No-BC) is a
real prerequisite the spec correctly scopes to the composition-layer refactor (carve-out),
not to a capability member.

### Vocab A — architect-core config `SectionBlock`

- `packages/architect-core/src/config/section-block.ts:62` (`SectionBlock`),
  `:144` (`SectionBlockSchema` = top-level `z.union`).
- Plain UNTRACKED type — no `@architect` annotations. Not a PatternGraph pattern.
- `code.language: z.string().optional()` — NO regex (`section-block.ts:121`).
- Consumers (core-internal only): `config/presentation-contracts.ts:43,57,64`
  (`preamble`/`epilogue` on ReferenceDocConfig + IndexCodecOptionsContract),
  `config/index.ts:43`, `index.ts:64` (re-export), `utils/markdown-parser.ts`
  (`parseMarkdownToBlocks` emits `SectionBlock[]`).

### Vocab B — architect-projection `BlockSchema`

- `packages/architect-projection/src/blocks/schema.ts:211` (`BlockSchema` = `z.discriminatedUnion('type', ...)`),
  `:181` (`Block`), `:229` (`BlockType`), `:237` (`BLOCK_TYPES`), `:257` (`isBlock`),
  9 constructor helpers (`:274`-`:388`).
- Annotated `@architect-pattern BlockSchema` (role:contract, bounded-context:rendering, status:active, maturity:design).
- `code.language` regex `/^[A-Za-z0-9_+\-.]*$/u` + `.max(64)` (`schema.ts:123-127`).
- API: enables/usedBy 7 patterns — ArchitectureDiagram, DecisionRecord,
  DocumentationCompositionSupporting, MarkdownRenderer, OperationalInsightsSupporting,
  PrChangeReview, UiRenderer.

### Distinct, not re-exported — confirmed

- Discriminants identical (9 variants, same `type` literals).
- Projection NEVER imports core's `SectionBlock`; core NEVER imports projection's `BlockSchema`.
  Two fully separate definitions. Divergences: name, `z.union` vs `z.discriminatedUnion`,
  `code.language` regex/max present only on projection, richer projection surface
  (constructors/guard/BLOCK_TYPES vs none on core).

### Reconciliation surface

- Core side: 1 schema + 1 parser + 2 presentation-contract option types + 2 barrel re-exports.
- Projection side: 1 contract (BlockSchema) feeding 7 patterns via fragments/renderers.
- Cross-package: zero coupling today, so this is an additive de-duplication (collapse core onto
  the richer projection contract, or hoist one shared contract), NOT a wide blast radius.
- Genuinely a precondition for the shared block renderer the composition members build on —
  but the members (taxonomy/CLI proof points) are not blocked from PLAN/DESIGN authoring;
  the block reconciliation blocks the IMPLEMENTATION that lands on the shared renderer.

### API coverage

Mixed. API nailed vocab B (pattern + relationships + role/context). Vocab A is invisible to the
API (untracked plain type) — required grep + source reads to find, compare shapes, and prove
the two trees are isolated.
