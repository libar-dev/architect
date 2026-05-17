# Documentation projection — problem definition

> **Captured:** 2026-05-17. **Audience:** any fresh session that needs to ground itself in what we are solving and why, without re-reading the entire `.pr-coordination/` corpus.
> **Pairs with:** [`MAPPING-CONTEXT.md`](./MAPPING-CONTEXT.md) — the working context for the parallel mapping session that produces empirical input for substrate design.

---

## 1. The problem in one paragraph

The architect repo currently maintains ~14,000 lines of hand-authored markdown across `docs/`, `formal-spec/`, and `.agents/skills/_shared/` describing shipped architect behavior. Every one of those documents is a **parallel write side** for facts that already exist in source: annotated TypeScript JSDoc, executable Gherkin rules and scenarios, Zod schemas, decision feature files. The duplication produces drift (the cross-corpus map in `docgen-mapping/00-synthesis.md` § 2 catalogues 11 topics that repeat verbatim across 3+ corpora), maintenance burden (a behavior change requires editing 3-9 doc sites by hand), and a violation of the architecture's own load-bearing rule: ADR-006 Single Read Model, whose canonical anti-pattern is the "Parallel Pipeline". This campaign makes documentation the markdown arm of the same `PatternGraph → project*() → Fragment → renderer → output` pipeline that already feeds CLI text, MCP JSON, and Studio UI — so docs join the existing four-renderer fan-out instead of running their own parallel write side.

## 2. Why now

The substrate matured this quarter:

- **Pattern graph + projection pipeline are stable** (W1.5 lift complete; perf gate green; ADR-006 boundary lint-enforced; `parseAndProject*` trust-boundary discipline holds).
- **The four-renderer split is in place** — `renderCompactText`, `renderJson`, `renderMarkdown`, `renderUi`. Markdown is *already* a renderer; the missing piece is the `DocDefinition` / composition surface that turns existing fragments into doc shapes.
- **The cross-corpus duplication map is concrete** — `docgen-mapping/00-synthesis.md` enumerates the 11 highest-leverage fragments (D1 FSM, D2 tag registry, D3 four-tier ladder, …) and assigns canonical owners.
- **The D8 CLI catalog prototype** (`scripts/proto/cli-catalog.ts` + `proto-output/FINDINGS.md`) proved the design holds at small scale and surfaced four concrete substrate gaps (A-D) before any production code lands.

## 3. Success criteria

The campaign is done when:

1. **Every claim in every generated doc traces to a source aggregate** — annotated TS JSDoc, executable Gherkin rule/scenario, Zod schema description, decision feature record, or a tightly-scoped editorial-framing carve-out (see § 5).
2. **`docs/` and `formal-spec/` can be deleted** once their content migrates to projections (per `DECISIONS.md` D5). The on-disk hand-authored count drops from ~14,000 lines to the editorial-framing carve-out + the `_shared/` kernel doctrine.
3. **Adding a new pattern emits new doc claims with no doc-side edit.** Author the source; rerun the pipeline; the read models update.
4. **The three-axis progressive disclosure model (`DECISIONS.md` D2 — INPUT / OUTPUT / INDEX) survives empirical pressure.** Prototype evidence (FINDINGS § 3) shows INPUT holds at small scale; OUTPUT + INDEX need to be exercised by at least one wiki-tree-shaped topic (e.g., D1 FSM per-rule pages) without forcing redesign.
5. **No "Parallel Pipeline"** — every renderer materialization of a documented behavior reads from `PatternGraph` via `project*` only. Lint-enforced today; the new `DocDefinition` surface honors the same boundary.

## 4. Load-bearing constraints

These are doctrine; deviations require an explicit campaign-level decision and a recorded rationale.

| Constraint | Where it lives | What it forbids |
|---|---|---|
| **No new annotation carriers** | `DECISIONS.md` D3'' | Inventing tags like `@architect-doc-inclusion` to drive doc membership — the campaign honors selector options 1, 2, 3, 5–9 (see `MATRIX-FRAMEWORK.md` § 3) over a new carrier. Reopening D3'' requires explicit decision. |
| **SourceCanonical** | `architect/specs/documentation-projection/04-source-canonical.feature` | Parallel-tree narrative files that own claims about shipped behavior. Editorial framing carve-out (if any) must be tightly scoped. |
| **ADR-006 Single Read Model** | `architect/decisions/`; lint-enforced via `[arch-boundary:*]` | Any consumer that re-derives pattern data outside `PatternGraph`. New `DocDefinition` substrate honors the same boundary. |
| **No-BC doctrine** | Root `AGENTS.md` § "Engineering doctrine" | Backward-compat shims, aliases, `@deprecated` markers, `eslint-disable` / `ts-ignore`. The campaign produces clean breaks; migration is hard cuts with `MIGRATION.md` updates. |
| **Zod-first boundaries** | Root `AGENTS.md` § "Engineering doctrine" | Hand-written TypeScript type mirrors for cross-package contracts. New `DocDefinition` shapes are Zod-derived; types flow from schemas. |

## 5. Scope

### In scope

- All documents that describe shipped architect behavior, irrespective of audience:
  - `docs/*.md` (manual reference)
  - `formal-spec/*.md` (the methodology RFC content)
  - `.agents/skills/_shared/*.md` (kernel doctrine — sources of canonical truth, not deletion targets; they become ContentFragment sources)
  - `.agents/skills/architect-*/SKILL.md` (per-session skills)
  - Package READMEs (`packages/architect-*/README.md` where present or planned)
  - The two campaign-relevant docs `docs/ARCHITECTURE.md`, `docs/METHODOLOGY.md`
- The matrix substrate (`DocDefinition`, composition recipes, `DiagramScope[]`, selector palette) per `MATRIX-FRAMEWORK.md` + `PROJECTION-MAPPING.md`
- Editorial framing carve-out — small, tightly scoped, source-located via JSDoc + TypeScript fragment files (per FINDINGS Gap A recommendation A1+A3 mix)

### Out of scope

- Release-note narratives (`architect/releases/*.feature`) — already projected as decision-style features; not part of this campaign
- External-facing marketing copy (`libar.ai`, `apps/web/` in studio repo)
- PM / business artifacts (`packages/context/` in studio repo)
- Generic deep-research synthesis (`packages/context/ideation/22-market-research-deep-research/`)
- The `architect-spec` package's RFC text where it describes intent rather than shipped behavior (carve-out resolved at design tier)
- `value-transfer` CLI verb mechanization — future work; out of this campaign

## 6. What the campaign explicitly does NOT do

Carved out per `DECISIONS.md` and the cross-corpus map:

- Does not introduce new `@architect-*` tag carriers (D3'')
- Does not add fields to `MetadataTagDefinition` (D3b)
- Does not rely on `@architect-usecase` for any new wiring (D9; tag retired per `PRE-WDOCS-READINESS.md` D-1)
- Does not touch the existing four-renderer split — markdown rendering already works; the campaign adds composition surface, not new renderers
- Does not duplicate the read-model — `PatternGraph` stays the single source per ADR-006

## 7. Definition of "done" for the parallel mapping session

The mapping session produces empirical input for substrate design decisions. It is **done** when:

1. Each of the input docs in [`MAPPING-CONTEXT.md`](./MAPPING-CONTEXT.md) § "Inputs" has a per-doc mapping file enumerating every distinct content piece, classified by type and source candidate.
2. An aggregate summary lists: (a) content types already covered by existing extractors, (b) content types requiring new extractors with a count of sites each unlocks, (c) content with no clear source aggregate (editorial-framing candidates).
3. The output enables the design-tier session to commit to: which extractors W-DOCS-2 ships first, what the editorial-framing carve-out shape is, whether option 4 (membership tag) is genuinely needed for any case the predicate options can't cover.

Mapping is research, not implementation. No substrate code lands as part of this session.

## 8. Cross-references

- [`MAPPING-CONTEXT.md`](./MAPPING-CONTEXT.md) — working context for the parallel mapping session
- [`MATRIX-FRAMEWORK.md`](./MATRIX-FRAMEWORK.md) — three structural axes, six first-class doc categories, nine selector options
- [`PROJECTION-MAPPING.md`](./PROJECTION-MAPPING.md) — same matrix grounded in the live `architect-projection` stack vocabulary
- [`proto-output/FINDINGS.md`](./proto-output/FINDINGS.md) — D8 CLI catalog prototype lessons; § 2 lists the four substrate gaps the mapping will validate or expand
- [`docgen-mapping/00-synthesis.md`](./docgen-mapping/00-synthesis.md) — cross-corpus duplication map; 11 fragments × site count is the leverage axis
- [`DECISIONS.md`](./DECISIONS.md) — D1-D12 ratified design decisions; § 4 above references the load-bearing ones
- [`architect/specs/documentation-projection/`](../architect/specs/documentation-projection/) — the four candidate-tier capability specs the campaign delivers against
