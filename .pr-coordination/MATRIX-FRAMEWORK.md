# Documentation projection — matrix framework + options

> **Captured:** 2026-05-17. **Status:** input for the dedicated refinement session.
> **Synthesizes:** prior research (`DEEP-DIVE.md`, `INVENTORY.md`, `DECISIONS.md`, `docgen-mapping/00-synthesis.md`), two parallel fork analyses (pre-refactor delivery-process system + PM domain model), the D8 CLI prototype (`scripts/proto/cli-catalog.ts` + `proto-output/FINDINGS.md`), and lineage context from the maintainer (original doc-inclusion-tag pattern from the docgen → delivery-process → architect lineage).
>
> **Not yet:** a design-tier spec. This document captures the framework + the option set; the refinement session converts it into either (a) refinements to the four candidate-tier specs at `architect/specs/documentation-projection/`, or (b) a new design-tier spec for the matrix substrate.

---

## 1. Project lineage and origin

The project was named **docgen → delivery-process → architect** across its evolution.

In the original 2-hour Sonnet 3.5 prototype that started the docgen phase, source artifacts carried a single **doc-inclusion membership tag** with enum-or-string values driving the final filter. Concretely:

```ts
// historical shape
@architect-doc-inclusion: 'readme' | 'skills' | 'skills-session-types' | ...
```

Any source artifact (TypeScript symbol, Gherkin feature, decision file) could declare which named doc set(s) it participated in. A doc generator would consume `extractByDocInclusion('readme')` and render the set.

This pattern is **one of the selector options in § 3 below.** It is in direct tension with DECISIONS.md D3'' ("no new annotation carriers") and with `SourceCanonical` spec invariant (parallel-write-surface implications). The refinement session needs to weigh it explicitly against the alternative — deriving doc membership from existing semantic tags via a category-recipe predicate.

---

## 2. The matrix framework

### 2.1 Three structural axes

A doc generation is a cell at the intersection of three axes.

| Axis | What it is | Today |
|---|---|---|
| **Source aggregates** | What kinds of source artifacts feed docs: annotated TS shapes, Gherkin Rules, Gherkin Scenarios, Zod schemas, decision features, JSDoc prose, registry/taxonomy data, preamble files | All parsed by PatternGraph except registry/taxonomy (read directly) |
| **Category (= recipe)** | Coarse selector + content-block composition, optionally parameterized by a pivot | Was dropped in W1 refactor; needs to come back. Six first-class candidates in § 2.3 |
| **Audience shape** | Renderer that materializes the read model: human doc (markdown), agent skill (markdown), Studio UI (`renderUi`), JSON, CLI compact-text | Four renderers ship today; dual-target was built into every pre-refactor entry |

**Progressive disclosure (3-axis INPUT/OUTPUT/INDEX from DECISIONS.md D2) operates *inside* a chosen cell, not as a fourth axis.** This is the PM fork's sharpest clarification.

### 2.2 The "composition recipe" granularity

The pre-refactor system that worked did not use one config per output file. It used **composition recipes**, optionally parameterized by a pivot variable.

- `REFERENCE-SAMPLE.md` = ONE recipe with 6 diagram scopes + shape group + include tag.
- `createProductAreaConfigs()` = ONE recipe parameterized by `productArea`, producing 7 docs from one template.

This dissolves the "per-doc decision records were too granular" pain (DEEP-DIVE Q2). The unit is the recipe; per-doc materializations are pivoted instantiations of one recipe.

### 2.3 Six first-class doc categories

Cross-referenced from PM candidate categories + what pre-refactor actually shipped + the D8 prototype evidence:

| Category | Selector predicate (over existing tags) | Content blocks | Parameterization pivot | Audiences |
|---|---|---|---|---|
| **`reference-spec`** | `@architect-role:{contract,codec,projection,…}` ∪ Zod schemas + CLI/MCP registries | Type catalog, function signature, enum/const, parity table, deterministic-gate notes | optional: per-package | skill + docs + JSON |
| **`architecture-document`** | `@architect-bounded-context:X` (or whole graph) + edges (`uses`/`implements`/`extends`/`see-also`) | C4 diagram, dep graph (TB/LR), role inventory, layer map, class diagram | per-bounded-context | docs + UI |
| **`feature-spec`** | `@architect-pattern:X` (per-pattern) | User story, rules+scenarios, open questions, deps, status, files, deliverables | per-pattern | docs + UI |
| **`decision-log`** | `architect/decisions/*.feature` + `@architect-adr-category:X` filter | ADR-decomposed sections, decision table, supersedes/superseded chain | per-decision OR aggregate | docs + skill |
| **`rule-catalog`** | Gherkin `Rule:` blocks across `tests/features/**`; `@architect-product-area:X` pivot | Per-area page (rules + invariants + verified-by), aggregate index, FSM state diagrams | per-product-area | docs + skill |
| **`roadmap-view`** | `@architect-status:{roadmap,active}` × `@architect-product-area` × `@architect-level:epic` | Banded tables (Now/Next/Later), epic-by-area cross-table, dep-blocker tree | per-area OR whole graph | docs + UI + JSON |

### 2.4 Two-layer selector

A category recipe carries two independent selectors:

- **Doc-body selector** — which shapes/behaviors/conventions appear in body content
- **Diagram selector (`DiagramScope[]`)** — which patterns appear in which diagram, independent of body

This was a load-bearing affordance in the pre-refactor system. A single body-selector trying to also drive diagrams produced the messiest coupling; separating them dissolved it.

---

## 3. Selector palette — all options on the table

Nine selector options surfaced across the synthesis. Each is a way to scope content into a doc.

| # | Option | Source | Tradeoffs |
|---|---|---|---|
| 1 | **Tag predicate** (e.g., `@architect-role:codec`, `@architect-bounded-context:X`) | Already in taxonomy | Clean; SourceCanonical-compliant; semantic — but predicates can get complex for multi-axis filters |
| 2 | **`@architect-pattern` enumeration** (whole graph or filtered) | Already in taxonomy | Clean; exhaustive over a level (e.g., per-package, per-bounded-context) |
| 3 | **Aggregation tag with `targetDoc:`** (push model, e.g., `@architect-decision:X` → `DECISIONS.md`) | Already in registry, **unused** | Existing infrastructure; explicit destination; good for ADR-style "this goes into the decision log" |
| 4 | **`@architect-doc-inclusion:<enum>` membership tag** (historical pattern from § 1) | **New carrier** | Maximum flexibility; intuitive for authors — but in tension with D3'' (no new carriers) and SourceCanonical (parallel write surface) |
| 5 | **Shape selectors** (by group, by source path + names, by source path) | TS AST query over existing JSDoc + path globs | What pre-refactor used; flexible; no new tags |
| 6 | **Path-based filters** (package, file glob, exclusions) | Path metadata | No taxonomy load; useful for package-scoped reference docs |
| 7 | **Decision-feature filters** (path + `@architect-adr-category`) | Already in `architect/decisions/` | Domain-specific to ADRs; serves `decision-log` category cleanly |
| 8 | **Registry-direct selectors** (taxonomy, FSM tables, CLI/MCP registries) | Read code directly, no graph predicate | Bypasses PatternGraph; works because the registries ARE the truth |
| 9 | **Diagram-scope objects** (`{ archContext, archLayer, patterns, include, direction, type, source }`) | Composition-recipe TypeScript | Separate from body selector; necessary for non-trivial diagrams |

### 3.1 The central refinement question

**Do we add option 4 (doc-inclusion membership tag), or derive doc membership from options 1–3 + 5–9?**

Two ways the same effect is achieved:

| Approach | Mechanism for "this thing is in the readme" |
|---|---|
| **Membership-tag** (option 4) | Author writes `@architect-doc-inclusion:readme` on the symbol; recipe says `select doc-inclusion:readme` |
| **Predicate** (options 1–3) | Recipe says `select @architect-role:codec AND @architect-package:architect-projection`; symbol's existing semantic tags determine membership |

Predicate is **declarative on the recipe side**; the source carries semantic identity. Membership-tag is **declarative on the source side**; the source carries doc identity.

| Dimension | Membership-tag (option 4) | Predicate (options 1–3) |
|---|---|---|
| Author friction | Low — slap a tag | Medium — recipe author needs to know the predicate |
| Annotation drift risk | High — tag values become a parallel taxonomy that ages | Low — uses semantic tags that age with the code |
| Source-canonical compliance | **Violates** — `@architect-doc-inclusion` is a doc-side fact stored on source | Compliant — only semantic tags on source |
| Multi-doc membership | Trivial — list multiple values | Trivial — multiple recipes match the same source |
| Refactor robustness | Author must remember to update tag values when doc names change | Recipes update; source stays semantic |

**Recommendation (non-binding) for the refinement session:** lean predicate (options 1–3), reserve membership-tag for the few cases where no semantic predicate exists (e.g., editorial framing, narrative ordering hints). DECISIONS.md D3'' survives. If we adopt option 4, scope it tightly (single tag, enum-only values, owner has rationale documented).

---

## 4. Decisions already ratified — what survives

From `DECISIONS.md` D1–D12, this synthesis does NOT contradict:

- **D1** — Wiki-tree-with-index is a first-class doc shape. Survives; wiki tree is one OUTPUT axis materialization inside `architecture-document` or large `reference-spec` recipes.
- **D2** — 3-axis disclosure. Survives; reframed as "operates inside a cell" rather than "fourth axis".
- **D3''** — No new annotation carriers. Survives (lean predicate over membership-tag).
- **D4'**, **D10**, **D12** — Meta-PoC scope. Superseded by the D8 prototype (we picked richer content; the meta-PoC is no longer the gate).
- **D5** — `docs/` and `formal-spec/` are deletion targets. Survives; the matrix is what replaces them.
- **D6** — Wave sequencing. Mostly survives; W-DOCS-2 extractor catalog is now framed by the six categories' source needs rather than the original generic list.
- **D7** — Agent skills as wiki trees / multi-target output. Survives; agent skill is one audience shape per cell.
- **D8** — Index page emission is derived. Survives unchanged.
- **D9** — `@architect-usecase` retire-or-narrow. Independent; **D-1 in `PRE-WDOCS-READINESS.md` records it as retired** (commit `691da3c`).
- **D11** — Duplication mapping deferred to execution waves. Survives.

**One refinement opens up:** D4' (meta-PoC) was replaced in practice by the D8 CLI catalog prototype, which the maintainer's "use synthesis content" direction redirected to. The PoC subject matter is settled; the PoC closure criteria from D10 still apply (the four data-source kinds were exercised — see `proto-output/FINDINGS.md` § 1).

---

## 5. Open questions for the refinement session

Ranked by impact. The refinement session converges these into either spec deltas or a fresh design-tier spec.

### Q1 — Doc-inclusion tag: add it or rely on predicates?
The § 3.1 question. The matrix supports both; the refinement session picks. Refining `SourceCanonical` (spec 04) depends on this answer.

### Q2 — Editorial framing source-of-truth
The D8 prototype hand-coded intent bundles, gate purposes, parity, quirks. In production these live where? Three plausible homes:
- **A1.** Per-command JSDoc + composition-layer aggregation
- **A2.** `_shared/*.md` doctrine loaded as preamble fragments
- **A3.** TypeScript fragment files under `docs-config/` (typed, colocated with projection)

Spec 04 carves out an exception for editorial framing if A2 or A3 wins.

### Q3 — Six first-class categories: lock the set or open it?
Are these six the v1 contract, or is the set extensible per-project? If extensible, what is the registration surface (config file vs. opt-in pattern vs. discovery)?

### Q4 — Parameterization pivot: single-pivot only, or multi-pivot recipes?
`createProductAreaConfigs()` used a single pivot (`productArea`). Some categories want two (e.g., `feature-spec` per-pattern × per-status). Should the recipe shape support N-pivot product spaces, or is single-pivot enough?

### Q5 — Diagram-scope substrate
`DiagramScope[]` was load-bearing pre-refactor and must come back. New substrate-side construct or revival of the pre-refactor shape with adjustments?

### Q6 — Wave sequencing under the matrix framing
W-DOCS-2 extractor catalog now has a clearer set of must-haves (per the six categories' source needs). Re-prioritize the extractor list; possibly drop extractors that no category recipe consumes.

### Q7 — `docs-live/` layout under the matrix
The matrix produces multiple docs per category. How is `docs-live/` organized — by category, by audience, flat? Affects routing config (`output.directory` + per-recipe path overrides).

### Q8 — Multi-target output (skill + docs from one recipe) — built in or composed?
The pre-refactor system had `docsFilename` + `claudeMdFilename` as fields on every entry. Do we keep that shape, or move to a `targets: DocTarget[]` array (as PROPOSED-DESIGN.md § 1 sketched)?

---

## 6. Refinement session — agenda

### Inputs to consume

1. **This file (`MATRIX-FRAMEWORK.md`).**
2. **The four candidate specs** at `architect/specs/documentation-projection/`:
   - `00-documentation-projection.feature` (epic)
   - `01-multi-source-composition.feature`
   - `02-one-source-multiple-audiences.feature`
   - `03-goal-oriented-navigation.feature`
   - `04-source-canonical.feature`
3. **The D8 prototype output:**
   - `.agents/skills/architect-cli-overview/SKILL.md`
   - `.pr-coordination/proto-output/cli-docs/INDEX.md`
   - `.pr-coordination/proto-output/FINDINGS.md`
4. **The actual problem at hand:** `.pr-coordination/docgen-mapping/00-synthesis.md` § 2 (the 11 cross-corpus fragments matrix) and § 3 (canonical owners).
5. **Ratified context:** `DECISIONS.md`, `PROPOSED-DESIGN.md` § 7 (wave breakdown), § 10 (wiki extension), § 11 (PoC scope).
6. **Pre-refactor evidence** (read-only reference): `/Users/darkomijic/dev-projects/delivery-process/architect.config.ts` + `docs-live/reference/REFERENCE-SAMPLE.md` + `src/renderable/codecs/`.

### Outputs to produce

1. **Resolution of Q1–Q8.** Each gets a chosen answer with rationale.
2. **Spec deltas** for the four child capability specs (likely small — most needed framing already lands cleanly).
3. **Decision on whether a 5th capability spec is needed** for the matrix substrate (recommendation in earlier conversation: NO; matrix is the *answer*, not an *invariant*).
4. **Possibly:** promotion of 1–2 child specs from candidate to plan tier if the open questions are resolved enough.
5. **Updated wave sequencing** for W-DOCS-1 through W-DOCS-8 if any sub-wave shifts.

### Recommended skill

`architect-plan-session` if the output is candidate-tier refinement + minor spec deltas. `architect-design-session` if the output crosses into design-tier (deliverables, stubs, exhaustive scenarios). My read: probably `architect-plan-session` for one more refinement pass, then `architect-design-session` for a separate session that authors the design-tier spec for the matrix substrate.

### Out of scope for the refinement session

- Implementing any of the substrate — that's W-DOCS-1 work, dispatched by `architect-implement-spec` after the design-tier spec lands.
- Building more prototypes — the D8 CLI catalog gave enough signal. D1 (FSM) could be a useful second data point but is not gating.
- PM-shape carriers (`@architect-owner`, `@architect-priority`, etc.) — deferred per § 4; PM-shape docs are out of v1 scope.

---

## 7. Cross-references

- **`PROJECTION-MAPPING.md`** — companion document; maps the matrix onto the live `architect-projection` substrate (subdomain folders, `parseAndProject*`, disclosure levels, logical route IDs, aggregation tags with `targetDoc`) and proposes resolutions for Q1–Q8 above. **Read alongside this file in the refinement session.**
- `README.md` — orientation for this folder
- `DECISIONS.md` D1–D12 — ratified design decisions; § 4 above maps them to current status
- `PROPOSED-DESIGN.md` — sketches; § 1 type sketches and § 7 wave breakdown remain useful
- `docgen-mapping/00-synthesis.md` — cross-corpus duplication map; the 11-fragment matrix is the concrete problem the framework above must solve
- `NEXT-SESSION.md` — pre-W-DOCS-1 cleanup record (done); maturity classification of files in this folder
- `proto-output/FINDINGS.md` — D8 prototype lessons that grounded § 5 questions
- `architect/specs/documentation-projection/*.feature` — the four candidate-tier specs the refinement session will edit
