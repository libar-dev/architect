# Projection mapping — annotated source → generated docs

> **Captured:** 2026-05-17. Companion to [`MATRIX-FRAMEWORK.md`](./MATRIX-FRAMEWORK.md), grounded in the actual `architect-projection` stack (not foreign data-pipeline vocabulary).
> **Purpose:** state how an annotation reaches a generated doc, in the stack's own terms. Resolve the matrix's open questions using existing primitives wherever they already exist.

---

## 1. The stack vocabulary

The projection layer ships these primitives today (`packages/architect-projection/`):

- **`ProjectionContext`** — `{ graph }` from `buildPatternGraph()`. The single read model (ADR-006).
- **`parseAndProject*(context, options)`** — validated entry point. Runs `OptionsSchema.parse(options)` then dispatches to the matching `project*` helper.
- **`project*(context, options)`** — pure read over `context.graph`; emits a `Fragment` or `ProjectionBundle<T>`.
- **`Fragment` / `ProjectionBundle<T>`** — `{ root, children, routing? }`. The composition boundary; Zod-validated; renderer-neutral.
- **`renderCompactText | renderJson | renderMarkdown | renderUi`** — stateless serving. Read fragments only; cannot import `ProjectionContext` or `PatternGraph` (lint-enforced).
- **Six subdomain folders** — `pattern-relations`, `delivery-reporting`, `governance`, `execution-context`, `documentation-composition`, `operational-insights`. The mart-equivalent already exists as folder structure.
- **Disclosure levels** — `essential | important | useful | advanced` with policy `always | nearby | available | reference` (`disclosure/levels.ts`).
- **Logical route IDs** — `<docType>:index`, `<docType>:<stableEntityId>`, `<docType>:<stableEntityId>:<childKind>:<stableChildId>` (`routing/route-id.ts`).
- **Aggregation tags with `targetDoc`** — `@architect-decision` → `DECISIONS.md`, `@architect-overview` → `OVERVIEW.md`, `@architect-intro` → package intro. The pre-existing push-model membership pattern.

---

## 2. Mapping rule — how an annotation reaches a doc

The flow is fixed. Every doc claim travels the same path:

```
annotated source                         PatternGraph                     ProjectionBundle              materialized doc
─────────────────                        ────────────                     ─────────────────             ─────────────────
@architect-* JSDoc on TS  ─┐
Gherkin tags + Rule blocks ─┼─ buildPatternGraph ─► graph ─► parseAndProject*(ctx, opts) ─► { root, children, routing? } ─► renderMarkdown ─► docs-live/<route>.md
Zod schemas / registries  ─┘                                                                                              └► renderJson    ─► docs-live/bundles/<route>.json
                                                                                                                          └► renderUi      ─► Studio
                                                                                                                          └► renderCompactText ─► CLI / skill body
```

**Doctrine that already holds:**

- Annotations are colocated with what they describe (Source-First, ADR-003).
- The graph is the sole read model (ADR-006); projections never bypass it.
- Fragments are renderer-neutral; renderers may not import projection-side modules (`[arch-boundary:*]` lint rules in `architect-projection/README.md`).
- `parseAndProject*` validates at the trust boundary; downstream code does not re-parse (ADR-009).

**What this means for matrix work:** every "category recipe" the matrix talks about is a `project*` function in a subdomain folder, returning a `ProjectionBundle<DomainFragment>`. The substrate is already there.

---

## 3. The six matrix categories map onto existing subdomains

`MATRIX-FRAMEWORK.md` § 2.3 listed six first-class categories. They line up with subdomain folders that already exist:

| Matrix category         | Subdomain folder                                                | Notes                                                                                   |
| ----------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `reference-spec`        | new sibling under `documentation-composition/` or `governance/` | No existing home; this is genuinely new substrate                                       |
| `architecture-document` | `pattern-relations/`                                            | Edges + bounded-context views already live here                                         |
| `feature-spec`          | `execution-context/` (per-pattern bundle)                       | `bundle <Pattern> --mode <session>` already returns this shape                          |
| `decision-log`          | `governance/`                                                   | The `@architect-decision` aggregation tag already targets `DECISIONS.md`                |
| `rule-catalog`          | `operational-insights/`                                         | `rules` verb already filters by `--product-area`, `--package`, `--feature`, `--pattern` |
| `roadmap-view`          | `delivery-reporting/`                                           | Status/role/level pivots already exist                                                  |

**One genuinely new mart** — `reference-spec` (the D8 prototype's subject matter). The other five are extensions of existing subdomain coverage, not new categories.

---

## 4. Selector palette — what already exists vs. what to add

The matrix listed nine selector options. Here is the same list, marked against the stack:

| #   | Option                                                    | Status today                                                                         |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | Tag predicate (`@architect-role:x`, `…bounded-context:y`) | Available — `arch roles`, `arch bounded-context`, `list --role`, `rules --pattern`   |
| 2   | `@architect-pattern` enumeration                          | Available — `list --names-only`, `list --parent`                                     |
| 3   | Aggregation tag with `targetDoc:`                         | **Already in registry, unused at projection layer.** `decision`, `overview`, `intro` |
| 4   | `@architect-doc-inclusion:<enum>` membership tag          | Not in taxonomy; would require a Wave-5 taxonomy decision                            |
| 5   | Shape selectors (group, source path + names)              | Available — extractor reads JSDoc + path metadata                                    |
| 6   | Path-based filters (package, file glob)                   | Available — `rules --package`, `rules --feature`                                     |
| 7   | Decision-feature filters                                  | Available — `architect/decisions/**` + `@architect-adr-category`                     |
| 8   | Registry-direct selectors (taxonomy, FSM, CLI/MCP)        | Available — `taxonomy`, `query isValidTransition`, `tool-registry.ts`                |
| 9   | Diagram-scope objects (`DiagramScope[]`)                  | Not present today; was load-bearing pre-refactor                                     |

**Two genuine gaps:** option 9 (`DiagramScope[]` substrate) and the question of whether option 4 ships at all.

---

## 5. Direction on each open question

### Q1 — Doc-inclusion tag vs. predicate

**Direction:** predicate first via options 1, 2, 6, 7. **Reuse option 3** — the aggregation-tag-with-`targetDoc` mechanism already in the taxonomy — for the membership-tag use case. No new annotation carrier needed. DECISIONS.md D3'' survives; SourceCanonical survives.

The three existing aggregation tags (`decision`, `overview`, `intro`) prove the pattern works. Adding new aggregation tags with `targetDoc:` (e.g., `skill`, `skill-session-type`) is a registry edit, not a new tag-carrier kind — it stays inside the existing `aggregationTags` table.

### Q2 — Editorial framing source-of-truth

**Direction:** atomic facts → `@architect-*` JSDoc on the symbol (e.g., a per-command intent tag). Cross-cutting framing → typed seed file colocated with the consuming projection under `packages/architect-projection/src/<subdomain>/seeds/`. No external markdown doctrine file.

This stays inside the lint-enforced boundary: projection-private seeds are not renderer-imported and not cross-domain-shared. SourceCanonical reads "every doc-claim source is either annotation on the artifact or a typed seed within the projection that consumes it."

### Q3 — Lock the six categories or open the set?

**Direction:** lock the six as named exports — each is a `project*` function in its subdomain folder, registered via `src/index.ts`. Ad-hoc extension already exists via `documentation <document-type>` CLI flag and `parseAndProject*` direct calls from consumer code.

### Q4 — Single-pivot vs. multi-pivot recipes?

**Direction:** single-pivot is what `parseAndProject*` already accepts (`OptionsSchema` carries a single pivot in current bundles). Allow `pivots: PivotSpec[]` only where a category provably needs ≥2 axes (`feature-spec` per-pattern × per-status is the canonical example). Default stays single-pivot.

### Q5 — `DiagramScope[]` substrate

**Direction:** add as a sibling field on the projection options for `pattern-relations` projections only. Shape: `{ name, archContext, archLayer, patterns, include, direction, type, source }` from the pre-refactor system, plus a `name` field so multiple diagrams in one doc are addressable. Independent of body-content selector — same recipe can produce one body + N named diagrams.

### Q6 — Wave sequencing

**Direction:** follow the projection layering:

1. `DocDefinition` + `pivots: PivotSpec[]` substrate, plus `DiagramScope[]` substrate (Q5).
2. Extractor coverage for what the six categories need — narrow to actual demand; drop unused extractors.
3. Seed substrate (Q2) + any new atomic-fact JSDoc carriers.
4. The six `project*` exports as `DocDefinition` registrations, one per sub-wave.
5. Audience-tagging at fragment level if/when the third audience-shape lands.
6. Materialization atomicity + incremental rebuild keyed on graph cache age.
7. Migration: regenerate `docs/` and `formal-spec/` content from the new projections.
8. Delete the manual narrative directories per D5.

### Q7 — `docs-live/` layout

**Direction:** category at top, pivot below. Logical route IDs already encode this: `<docType>:<stableEntityId>` → `docs-live/<docType>/<entityId>.md`. The route-id substrate already settles the layout question; renderers translate route IDs to paths via `markdown-paths.ts`. Audience shape (`.agents/skills/` vs. `docs-live/`) is a renderer-target choice, not a partition.

### Q8 — Multi-target output: built-in or `DocTarget[]`?

**Direction:** `DocTarget[]` on each `DocDefinition`. Each target carries `{ audience, format, route-id template }`. Replaces the pre-refactor `docsFilename` + `claudeMdFilename` pair; symmetric with the existing four-renderer fan-out.

---

## 6. What remains a judgement call

Three items the projection stack does not auto-resolve:

1. **Exact seed-file location** — `packages/architect-projection/src/<subdomain>/seeds/` keeps seeds with the consuming projection; an alternative is `packages/<source-package>/src/projection-seeds/` to keep seeds with the source. SourceCanonical reading favours the latter; locality with the projection favours the former. Pick one in the refinement session.
2. **`decision-log` aggregate vs. per-decision** — one `DocDefinition` with two `DocTarget[]` entries (aggregate index + per-decision page) vs. two `DocDefinition`s sharing a `governance/` staging projection. Both work; the second matches dbt-style "models share a staging layer" but introduces a second `DocDefinition` per category for the first time.
3. **Whether to promote new aggregation tags (Q1 resolution) in this campaign or stage them in a follow-on taxonomy wave.** Three exist today; the matrix may want one or two more (`skill`, perhaps `reference-package`). Adding them via the registry is small; the taxonomy-campaign discipline is to batch them.

---

## 7. Recommended refinement-session output

1. **Ratification block** — accept § 2, § 3, § 4, § 5 directions or note specific overrides.
2. **Resolution of § 6** — pick the three remaining calls.
3. **Refined `04-source-canonical.feature`** — invariant now reads "annotation on the artifact OR typed seed within the consuming projection."
4. **Add a 5th candidate spec for provenance** (optional) — every `ProjectionBundle` records its source aggregates so the future `value-transfer <Pattern>` verb has the substrate it needs.
5. **Updated wave sequencing** per § 5 Q6.

Recommended skill: `architect-plan-session` for the refinement + candidate-spec deltas; `architect-design-session` for the substrate spec that follows.

---

## 8. Cross-references

- [`MATRIX-FRAMEWORK.md`](./MATRIX-FRAMEWORK.md) — the framework + nine selector options this document maps onto the live stack.
- [`proto-output/FINDINGS.md`](./proto-output/FINDINGS.md) — D8 prototype findings; this document's § 4-5 resolve its Gap A-D.
- [`packages/architect-projection/README.md`](../packages/architect-projection/README.md) — substrate doctrine and lint-enforced boundaries.
- [`packages/architect-projection/src/disclosure/levels.ts`](../packages/architect-projection/src/disclosure/levels.ts) — disclosure vocabulary already shipped.
- [`docs-live/TAXONOMY.md`](../docs-live/TAXONOMY.md) — the live tag registry; aggregation tags with `targetDoc` are the option-3 substrate.
- [`docs/PR-NOTE-TAXONOMY-CAMPAIGN.md`](../docs/PR-NOTE-TAXONOMY-CAMPAIGN.md) — campaign constraints on adding new tags.
- [`architect/specs/documentation-projection/`](../architect/specs/documentation-projection/) — the four candidate specs the refinement session edits.
