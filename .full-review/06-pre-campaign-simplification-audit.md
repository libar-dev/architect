# Projection package — pre-campaign simplification audit

**Reviewed:** 2026-05-17 (branch `campaign/docs-and-skills-consolidation`)
**Target:** `packages/architect-projection/src/`
**Anchor report:** `.full-review/05-final-report.md`
**Scope guard:** only `packages/architect-projection/src/` and `tests/`; `architect/` design-time folder excluded by repo doctrine.

The substrate-prep commits (`269971e`, `a1917de`) closed most of the load-bearing P0/P1 items, but the closed dispatch table is still alive, the perf gate is still mono-typed, the dispatch tables are still `Partial<Record<…>>` instead of `satisfies`-checked, and `Deliverable*` still ship as paired schemas. None of that blocks the campaign starting, but several items will silently widen the campaign's blast radius if left.

---

## 1. Completion audit — findings 1–15

| #   | Verdict      | Citation                                                                                                          | Note                                                                                                                                                                                                                                  |
| --- | ------------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **PARTIAL**  | `src/projections/documentation-composition/documentation-type-registry.ts:58,208`                                 | Closed dispatch and module-load `Object.freeze` chain (incl. `freezeDisclosureMatrix`) still run at import; renamed from `documentation-types.ts` but not decomposed along the four campaign axes. JSDoc warning at line 49–57 added. |
| 2   | **PARTIAL**  | `src/projections/documentation-composition/documentation-type-registry.ts` (242 LOC, was 517)                     | Lifecycle markers gone (no `'dropped'` survives), but identity + routing + disclosure policy + CLI surface still co-located in one file/one schema.                                                                                   |
| 3   | **PARTIAL**  | `src/disclosure/spec.ts:11-54`, `src/disclosure/levels.ts:16-40`                                                  | `ProgressiveDisclosurePolicySchema` and `DisclosureSpecSchema` now have full `.describe()` coverage (the headline-demo target). Spot-check elsewhere: 16 `.describe()` calls in only 3 files — the other ~20 P0 fields are untouched.  |
| 4   | **DONE**     | `src/fragments/fragment-schema.internal.ts:117`, `src/projections/documentation-composition/...:206`              | `Fragment = z.infer<typeof FragmentSchema>`, `SupportedDocumentationType = ...Metadata['key']`. Block types in `src/blocks/schema.ts` are all `z.infer`. Schemas are canonical.                                                       |
| 5   | **PARTIAL**  | `src/renderers/render-markdown.ts:88-94,1961-1965`, `src/renderers/render-ui.ts:9-12`, `eslint.config.mjs:93-170` | I1 (sanitize) + I2 (UI passthrough) + I3 (TRUSTED_MARKDOWN firewall) have JSDoc and the lint rule. I4 (`isPlainObject` prototype guard) and I5 (parseAndProject single chokepoint) have JSDoc but no rejection test for I5.            |
| 6   | **DONE**     | `src/fragments/pattern-relations/pattern-detail.ts:24`                                                            | `PatternDetailSchema = PatternSummarySchema.extend({...})`. Note: `kind` is re-declared as `z.literal('PatternDetail')`, overriding the parent's literal (Zod extend allows this).                                                    |
| 7   | **DONE**     | `src/renderers/render-markdown.ts` (no `getDocumentationTypeMetadata` import), `documentation-bundle.internal.ts:107-120` | All doc-type metadata pushed onto `bundle.routing` (`disclosureSpec`, `markdownRootTarget`, `markdownChildDirectory`, `entityPathLayout`). Renderer is doc-type-blind.                                                                 |
| 8   | **NOT DONE** | `tests/perf/baselines/business-rule-set.baseline.json`, `tests/features/perf/business-rule-set-report.feature`    | Perf gate still single-fragment (BusinessRuleSet only). No `renderMarkdown` end-to-end metric, no parameterization across doc types, baseline not regenerated.                                                                         |
| 9   | **PARTIAL**  | `src/renderers/render-markdown.ts:311-338`                                                                        | Non-split path now reuses the rendered parent (saves 1 render/doc). Split path still renders parent twice (line 317 + line 333) plus 1 per sub-file. Roughly N+1 / 2(N+1) instead of 2N+2. No memoization on `(fragment, options)`.    |
| 10  | **DONE**     | `src/disclosure/spec.ts`, `src/disclosure/levels.ts`, `src/routing/route-id.ts`                                   | `disclosure/` and `routing/` are top-level peer concerns; documentation-composition imports them, not the other way around.                                                                                                           |
| 11  | **DONE**     | `grep "As a typed contract" src/` → 0                                                                             | Boilerplate purged across all fragment files.                                                                                                                                                                                         |
| 12  | **PARTIAL**  | `src/fragments/pattern-relations/supporting.ts:51`, `src/fragments/execution-context/deliverable.ts:12`           | The pattern-relations copy is now derived (`ExecutionContextDeliverableSchema.omit({ kind: true })`). One canonical-ish definition, but the *exported* surface still ships two `DeliverableSchema` names from the barrel.              |
| 13  | **DONE**     | `src/_internal/slug.ts`                                                                                           | Single canonical impl. All callers import `slugForFilename` / `slugForRouteSegment` / `slugForAnchor` from `_internal/slug.ts`. `createSlug` deleted.                                                                                  |
| 14  | **DONE**     | `src/renderers/render-markdown.ts:1-18`, `src/renderers/render-ui.ts:1-19`, `src/renderers/render-json.ts`, `src/renderers/render-compact-text.ts` | Renderer entry points carry accurate "Renderer Overview"-style JSDoc.                                                                                                                                                                 |
| 15  | **DONE**     | `src/projections/documentation-composition/documentation-bundle.internal.ts:63-68`, `documentation-type-registry.ts:49-57` | "Do not add entries" JSDoc with `.pr-coordination/PROPOSED-DESIGN.md` pointer in both the factory table and the registry table.                                                                                                       |

**Summary:** 7 DONE, 6 PARTIAL, 2 NOT DONE. The headline-demo enabler (#3, #6) works; the substrate decomposition (#1, #2) and the perf gate (#8) are the remaining campaign blockers.

---

## 2. New consolidation opportunities

Ranked by **campaign leverage**, not LOC. The campaign's worked example is `PatternDetail ⇄ PatternSummary` as a ContentFragment pair; anything that warps that shape is high-leverage.

### 2.1 `DeliverableManifestSchema` is the *second* duplicated pair the report missed

`src/fragments/execution-context/deliverable-manifest.ts:14` and `src/fragments/pattern-relations/supporting.ts:53` both export `DeliverableManifestSchema`. The exec-context version is a `Fragment` (has `kind: 'DeliverableManifest'`) and is in `FragmentSchema`'s discriminated union; the pattern-relations one is a structural helper without `kind`. **Both are exported from the package barrel** (`src/fragments/index.ts`), reproducing the exact ambiguity finding 12 flagged for `DeliverableSchema`. Same fix pattern: `.omit({ kind: true })`.

### 2.2 `kind` literal re-declaration in extended schemas

`PatternDetailSchema.extend({ kind: z.literal('PatternDetail'), ... })` overwrites the parent's `kind: z.literal('PatternSummary')`. This works at runtime, but the campaign's ContentFragment extractor (the headline demo's cousin) will walk `.shape` of both schemas — and a naive `extractZodSchemaFields(PatternSummarySchema)` will return rows including `kind: 'PatternSummary'` while a `PatternDetail` instance has `kind: 'PatternDetail'`. Document the override pattern (one-line JSDoc on the `.extend`) or factor `PatternIdentitySchema = PatternSummarySchema.omit({ kind: true })` and extend that for both leaves.

### 2.3 `isPlainObject` lives in two places with identical implementations

`src/fragments/base.ts:102` and `src/renderers/render-json.ts:209`. Both enforce the prototype guard (I4). Two copies = two places to break the invariant. Promote to `_internal/is-plain-object.ts`. Add an ESLint `no-restricted-syntax` rule banning local re-implementations of `Object.getPrototypeOf` for guard purposes.

### 2.4 `routeId.split(':')` happens in two places

`src/renderers/markdown-paths.ts:59` and `src/routing/route-id.ts:53`. The `routing/` module exports `parse*` helpers — `markdown-paths` should use them rather than re-parsing. The campaign's `DocTarget[]` axis will add more route-id consumers; today is the cheap moment to centralize.

### 2.5 `MARKDOWN_NORMALIZERS` (and peer dispatch tables) typed as `Partial<Record<FragmentKind, …>>`

`src/renderers/_shared/dispatch.ts:14-17` defines `KindTable<Out, Options>` with `?:` (optional per kind). `MARKDOWN_NORMALIZERS` at `render-markdown.ts:190` ships 10 entries out of 43 `FragmentKind`s. This is the type-side hole finding 17/18 flagged. When the campaign adds 6–10 new normalizers, leaving one off the table will pass the type-checker silently. Switch to `satisfies Record<FragmentKind, …>` once the FragmentKind union is reshaped, OR keep `Partial` but add a `satisfies Record<FragmentKind, ...>` exhaustiveness assertion on a sibling `EXHAUSTIVE_NORMALIZERS` const so the omission shows up at build time.

### 2.6 `documentation-type-registry.ts` runs `Object.freeze` at module load

Line 208–214. The chain `SUPPORTED_DOCUMENTATION_TYPE_REGISTRY → freezeSupportedDocumentationTypeMetadata → freezeDisclosureMatrix` mutates 12 entries × N nested objects on import. Breaks `"sideEffects": false` and bloats the campaign's tree-shaking. Move the freeze to a guarded helper used by tests; or accept it but document explicitly in `package.json` `"sideEffects": ["./dist/projections/documentation-composition/documentation-type-registry.js"]`.

### 2.7 Decision normalizers still co-resident in `render-markdown.ts`

`normalizeDecisionCatalog` (line 670) and `normalizeDecisionRecord` (line 706) share helpers in the same 2171-LOC file. Finding 22 flagged this; the renderer is still ~2152 LOC. Extracting these two into `src/renderers/_shared/decision-formatting.ts` is a precondition for the campaign's "per-doctype normalizer module" target shape.

---

## 3. Pre-campaign red flags

Each anchored to file:line and the campaign mechanism it fights.

### 3.1 `documentation-type-registry.ts` is still the closed gate

`src/projections/documentation-composition/documentation-type-registry.ts:58-201` — the 12-entry registry literal, side-effect-frozen at module load, with the closed `'architecture' | 'decisions' | ...` union derived from `as const`.

**Why it bites the campaign:** the headline campaign change is "delete this table, replace with `DocDefinition.build(graph)`." The renaming + JSDoc warning helps contributors not add to it, but the *shape* of `DocDefinition` has to be co-derived from this entry shape (key, displayTitle, rootRouteId, markdownRootTarget, childDirectory, entityPathLayout, defaultDisclosureLevel, disclosureMatrix, generatorName, aliases). Today, that shape is fused into one Zod schema. Decomposing it before W-DOCS-1 (Identity / Output-routing / Disclosure / CLI-surface) lets `DocDefinition` reuse the parts. Not decomposing it forces the campaign to redo the split inside its own type and migrate the registry contents twice.

### 3.2 Perf gate measures one fragment

`tests/features/perf/business-rule-set-report.feature` — only `BusinessRuleSet` is benched. Baseline anchored to a single fixture in `tests/perf/baselines/`.

**Why it bites the campaign:** the campaign's 5× doc fan-out and ContentFragment introduction land squarely in `renderMarkdown`. Without a `renderMarkdown` end-to-end metric across ≥3 doc types, a 30% renderer regression will pass CI. The perf gate currently catches projection-side regressions; renderer-side regressions are invisible. The repo doctrine ("`baseline × 1.5` ceiling") is being applied to the wrong measurement.

### 3.3 `KindTable` is `Partial<Record<FragmentKind, …>>`

`src/renderers/_shared/dispatch.ts:14-17`.

**Why it bites the campaign:** ContentFragment introduces new `FragmentKind` values. Adding `ContentFragment` to the union without wiring a `ContentFragment: normalizeContentFragment` row in `MARKDOWN_NORMALIZERS` will type-check fine, fall through to `normalizeGenericFragment`, and produce subtly wrong output. The campaign authors have no compiler-side signal. This is the same hole finding 17/18 flagged on the test fixture, surfacing in the production type itself.

### 3.4 `PatternDetailSchema.extend` overrides `kind`

`src/fragments/pattern-relations/pattern-detail.ts:24-25`.

**Why it bites the campaign:** the headline demo `extractZodSchemaFields('PatternSummarySchema')` returns a row for `kind: 'PatternSummary'`. The next demo step — "now show PatternDetail's superset" — will produce a row collision on `kind`. The campaign's docstring extractor needs to know whether to dedupe by field name or by `(fieldName, parentSchema)`. The cleanest fix is `PatternIdentitySchema = PatternSummarySchema.omit({ kind: true })`, extending it from both leaves with their own `kind` literal. Cheap to do now; impossible to do silently mid-campaign.

### 3.5 Two `DeliverableManifestSchema` exports

`src/fragments/execution-context/deliverable-manifest.ts:14` + `src/fragments/pattern-relations/supporting.ts:53`, both re-exported from `src/fragments/index.ts`.

**Why it bites the campaign:** `extractZodSchemaFields('DeliverableManifestSchema')` is ambiguous — which one? The barrel will pick one (the export order matters) and the demo will silently document the wrong schema. Same fix pattern as Deliverable: derive one from the other via `.omit({ kind: true })` and barrel-export only the canonical name.

### 3.6 `extractZodSchemaFields` does not yet exist

`grep -rn extractZod src/ → 0`. The headline demo's main verb is absent.

**Why it bites the campaign:** not a fight per se — but the demo will be built against the current describe() coverage on day one. If `.describe()` coverage is only on the two disclosure schemas (which it is — 16 calls across 3 files), the demo's *second* table (e.g. PatternSummary fields) will be blank. Either add `.describe()` to the rest of the P0 23-field list before the demo lands, or scope the demo to the disclosure pair only.

---

## 4. Recommended ordering

### Before W-DOCS-1 (substrate prep, 1–2 days)

1. **Decompose `documentation-type-registry.ts` along Identity / Output-routing / Disclosure / CLI-surface** (3.1). Pre-split, don't retrofit. Enables `DocDefinition` to reuse parts.
2. **Regenerate the perf baseline + add `renderMarkdown` end-to-end metric across 3 doc types** (3.2 / finding 8). The campaign's 5× fan-out lands here.
3. **`PatternIdentitySchema = PatternSummarySchema.omit({ kind: true })`** + both leaves extend it (3.4). One commit; unlocks clean extractor behavior on the headline demo.
4. **Consolidate the second `DeliverableManifestSchema` pair** (3.5). Same shape as the already-fixed `Deliverable` pair; finish the job.
5. **Add `.describe()` to remaining P0 fields beyond the disclosure pair** (3.6 / finding 3 PARTIAL). The 23-field list in `04a-framework-raw.md` is still the target.

### During W-DOCS-1 (campaign-window cleanups)

6. **Switch `KindTable` to `satisfies Record<FragmentKind, …>` exhaustiveness** (3.3 / finding 17–18). Best done alongside the ContentFragment introduction so the compiler catches every new kind from day one.
7. **Memoize `addRoutedDocument` split-path rendering** (finding 9 PARTIAL). Split-path still re-renders the parent; cache on `(document, options)`.
8. **Promote `isPlainObject` to `_internal/`** (2.3) + add ESLint rule. I4 enforcement.
9. **Centralize `routeId` parsing** in `routing/route-id.ts` and remove the `markdown-paths.ts` duplicate (2.4).

### Backlog (W-DOCS-2)

10. Extract decision normalizers from `render-markdown.ts` to `src/renderers/_shared/decision-formatting.ts` (2.7 / finding 22).
11. Add a rejection test for I5 (extra-property options payload) on `parseAndProject`.
12. Filter memoization (`WeakMap<Graph, Map<predicateKey, filtered[]>>`) per finding 20.
13. Structural test scenarios for the 6 smoke-only normalizers (finding 16).
14. Decide on the `Object.freeze`-at-module-load tradeoff for the doc-type registry (2.6) — accept and document `sideEffects`, or move to a lazy/guarded freeze.

### Do not touch before campaign

- `src/blocks/schema.ts` discriminated union — campaign-ready as-is.
- `src/projections/_shared/parse-and-project.internal.ts` — clean trust boundary.
- `BundleRouting` / `ProjectionBundle` fan-out — the new `DocTarget[]` axis layers on this.
- The `.ts ⟷ .internal.ts` pair convention — convention is already lint-enforced for renderers (`eslint.config.mjs:136`), works as-is.
- `BlockSchema.code.language` regex + length cap — finding 25 closed; do not loosen.

---

**Bottom line:** the package is meaningfully closer to campaign-ready than the volume of findings suggests. The two highest-leverage moves before W-DOCS-1 are (a) decomposing the doc-type registry along the four campaign axes, and (b) extending the perf gate to cover `renderMarkdown` across multiple doc types. The two highest-leverage moves *during* W-DOCS-1 are (c) `satisfies`-checking the dispatch tables and (d) fixing the `kind`-override pattern in PatternDetail. Everything else is cleanup that won't block the campaign but will widen its blast radius if it's done in-flight.
