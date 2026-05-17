# Phase 4: Best Practices & Standards

Raw reports: `04a-framework-raw.md`, `04b-cicd-raw.md`, `04c-duplication-raw.md`.

Per user direction, CI/CD findings are summarized but de-emphasized — they're real ops gaps but the duplication audit surfaced higher-leverage campaign-readiness work.

## Headline

**Baseline is unusually clean** — zero `eslint-disable`, zero `@ts-ignore`, zero `@deprecated`, zero `z.object(` (113 `z.strictObject` instead), zero `as any`/`as unknown`/non-null assertions, 128 `z.infer` sites, ESM-correct dist output across all 5 sub-entries. The campaign starts from a code-doctrine surface that is genuinely well-maintained.

**The campaign-blockers cluster in two areas**, both load-bearing for the headline demo:

1. **Zod schemas lack `.describe()` and aren't fully `z.infer`'d** — three independent findings (Framework F2, F3, F4 + Phase 3 D-C2) describe the same root cause. The campaign's worked example (`extractZodSchemaFields('ProgressiveDisclosurePolicySchema')`) returns an empty table today.
2. **Genuine duplication exists in schemas and helpers** — but **not** at the projection-entry-point level the INVENTORY first suggested. The 43 projections are mostly intentional structure; the real consolidation is in 2 schemas, 1 renderer module, and the JSDoc corpus.

## Framework & language findings

### High-priority

**F-H1 — `sideEffects: false` is broken by 12-pass Zod parse + `Object.freeze` cascade**

- **File:** `src/projections/documentation-composition/documentation-types.ts:342-344`
- The package declares `sideEffects: false` but module-load work performs validation and freezing. Bundlers won't tree-shake despite the code being safe to drop.
- **Why it matters:** also touches Phase 1 C2's "decompose `documentation-types.ts`" — the side-effectful initialization is one symptom of the mega-module problem.
- **Fix:** move validation to a test (`tests/features/documentation-types.feature.steps.ts` asserting the registry shape). No code change to runtime behavior.

**F-H2 — `Block` types and `SupportedDocumentationType` derived from literals/interfaces, not `z.infer`'d**

- **File:** `src/blocks/schema.ts` + `documentation-types.ts`
- Direct Zod-first doctrine inversion. Schema is the canonical definition; hand-written types diverge silently. Phase 1 H1 surfaced this at the registry; this confirms it goes deeper into block schemas.
- **Why it matters for the campaign:** `extractZodSchemaFields` walks `.shape` of the SCHEMA. If types are inverted, the extractor reads from the wrong source.
- **Fix:** invert — schemas are canonical, types are `z.infer<typeof X>`.

**F-H3 — Zero `.describe()` across the entire package (P0: 23 fields in 6 schemas)**

- **Files:** `src/projections/documentation-composition/progressive-disclosure.ts`, `disclosure-spec.ts` + the 4 disclosure-related enum schemas
- The campaign's headline demo (`extractZodSchemaFields('ProgressiveDisclosurePolicySchema')`) renders empty until these descriptions land. One session of work.
- **Why it matters for the campaign:** campaign cannot ship the demo without this.
- **Fix:** add `.describe('...')` to each of the 23 P0 fields. See `04a-framework-raw.md` for the full P0 table.

### Medium-priority

**F-M1 — Convention-only boundaries should become lint-enforced**

- 4 separate findings (F5 + F7 + F8 + F11 in raw): `LogicalRouteId` not branded; renderer reaches into projection registry; `TRUSTED_MARKDOWN` private only by export discipline; `*.internal` not enforced.
- All four can be encoded as ESLint `no-restricted-imports` / `no-restricted-syntax` rules within the existing flat config.
- Closes Phase 2 invariant I3 (TRUSTED_MARKDOWN) at lint-time.
- **Fix:** one PR adding the four rules; minimal risk.

**F-M2 — `MARKDOWN_NORMALIZERS` is `Partial<Record<FragmentKind, …>>`**

- **File:** `src/renderers/render-markdown.ts`
- Campaign-added normalizers can be silently omitted. Phase 3 T-H1 surfaced the test-side hole; this is the type-side hole.
- **Fix:** switch to `satisfies CompleteKindTable<FragmentKind, …>` once ContentFragment stabilises. Defer to when the new fragment-kind enum lands.

### Notable absences (do not need fixing)

- Dev-dep versions uniform across the 5 publishable packages.
- ESM dist output correct for all 5 sub-entries.
- No `@ts-ignore` / `eslint-disable` anywhere. Build is clean under strict mode.
- The barrel audit script (`scripts/options-schema-barrel-audit.mjs`) does enforce something useful, but only over `*OptionsSchema` names — should generalize to `*Definition` once the campaign lands (cross-referenced with CI/CD finding 5).

## Duplication & simplification findings (the high-leverage section)

This audit reframed apparent duplication through the campaign's progressive-disclosure lens. Most surface duplication turned out to be intentional structure; the real wins are in **2 schemas, 1 renderer module, and the JSDoc corpus**, not in the 43 projection entry points.

### Variation-type taxonomy (new framing this review introduced)

| Variation type                                                         | Today               | Under campaign                                   | Verdict                                                            |
| ---------------------------------------------------------------------- | ------------------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| Depth variation (Summary/Detail)                                       | Two projections     | Schema composition + ContentFragment-pair naming | **Keep projections separate; fix schema; name as disclosure pair** |
| Filter variation (RoadmapTimeline / CompletedMilestones / CurrentWork) | Three projections   | Spec-locked dispatch surfaces                    | Keep — spec coverage locks contracts                               |
| Cardinality variation (Rule / RuleSet)                                 | Two projections     | Two fragment shapes (set has aggregation)        | Keep — structurally distinct                                       |
| True duplication (same input, same output, twice)                      | Multiple call sites | Consolidate to one impl                          | Fix unconditionally                                                |

The synthesis: the user's intuition that "progressive disclosure means fewer projections" is partially right at the **consumer level** (ContentFragment callers see one named pair, not two arbitrary projections) and wrong at the **producer level** (the two projections stay because feature specs lock them). The schema-composition fix (`.extend()`) and ContentFragment-pair naming together deliver the simplification without breaking specs.

### Critical findings (safe to act on under no-BC + Phase 3 spec coverage)

**D-C1 — `PatternDetailSchema` re-declares every `PatternSummary` field instead of extending it**

- **Files:** `src/fragments/pattern-relations/pattern-summary.ts`, `pattern-detail.ts`
- The projection that produces `PatternDetail` literally `...spreads summary` at runtime, proving the subset relationship that the schema fails to express.
- **Variation type:** depth variation — _the_ canonical disclosure-pair candidate.
- **Why it matters:** this is the ContentFragment proposal's worked example. The campaign will use this pair as the proof case. The schema duplication is the wrong starting point.
- **Fix:** `PatternDetailSchema = PatternSummarySchema.extend({ additionalFields })`. One line. Then name the pair at the ContentFragment layer above when the campaign lands.

**D-C2 — Two parallel `DeliverableSchema` / `DeliverableManifestSchema` shapes coexist**

- **Files:** `src/fragments/execution-context/deliverable.ts`, `deliverable-manifest.ts` (with `kind` literal) AND `src/fragments/pattern-relations/supporting.ts` (without)
- Both exported from the package barrel — consumer can't tell which to use.
- **Variation type:** true duplication.
- **Why it matters:** the campaign's `DocDefinition` API will import from the barrel; ambiguous symbols cause silent wrong-type usage.
- **Fix:** consolidate to one canonical definition; remove the duplicate.

**D-C3 — `slugForFilename` byte-identical to `toKebabCase` with a third degraded copy `createSlug`**

- **Files:** `src/_internal/slug.ts` ≡ `src/renderers/render-markdown.ts:2135-2142`; degraded copy in `src/projections/delivery-reporting/index.ts:658-672`
- Three identical functions across `_internal`, `render-markdown`, `delivery-reporting`.
- **Variation type:** true duplication.
- **Why it matters:** routing decisions depend on slug consistency; the degraded copy will produce divergent paths.
- **Fix:** one canonical implementation in `_internal/slug.ts`, callers import.

### High-priority findings

**D-H1 — 39× identical "As a typed contract..." JSDoc boilerplate**

- This is Phase 3 D-H1's framework-level confirmation: the boilerplate is everywhere, not just the 4 renderer entry points.
- Elevates to High because the campaign's headline demo is JSDoc-prose extraction.
- **Fix:** delete the boilerplate from fragment files (a batch sed-equivalent edit); replace with per-fragment one-sentence prose. The dispatcher script can ensure no fragment escapes without prose.

**D-H2 — Renderer-helper duplication in `render-markdown.ts:657-732`**

- The decision-record and decision-catalog normalizers share helpers via copy-paste, not extraction.
- **Variation type:** related to depth variation (record = single, catalog = set) but the helpers are genuinely duplicated regardless.
- **Why it matters:** ContentFragment will add similar peer pairs; the helper-extraction pattern needs to be settled first.
- **Fix:** extract shared helpers to `src/renderers/_shared/decision-formatting.ts`.

### Verdict-flipping reframes (Lens 2 protected against bad campaign actions)

These would have been "merge / delete" findings under Lens 1, and would have broken locked feature-spec contracts. Lens 2 flipped them:

- **F5** (RoadmapTimeline triplet): `projectRoadmapTimeline` / `projectCompletedMilestones` / `projectCurrentWork` look mergeable but each has its own feature-spec. Lens 1 verdict: collapse. Lens 2 verdict: keep — these are spec-locked dispatch surfaces.
- **F6** (RequirementDigest pair): same pattern.
- **F10** (singular/collection pairs across 6 fragment families): cardinality variation, kept.
- **F1/F7**: would have been "merge to one projection," reframed to "schema composition + ContentFragment-pair naming."

## CI/CD findings (de-emphasized per user direction)

Summarized for completeness. None of these are blockers in the same sense as the framework/duplication findings, but the first two compound directly with Phase 2 H2 and Phase 3 T-C1.

- **`pnpm docs:all` not gated in CI** — `docs-live/` is gitignored; the only signal docs are healthy is `docs:all` exit code, and that's not checked. Campaign's whole output is unverifiable.
- **Perf baseline anchored to ~year-old commit `ee58aac`** — `× 1.5` ceiling carries invisible slack. Compounds with Phase 2 H2 (no `renderMarkdown` coverage) and Phase 3 T-H2 (only `patterns` doctype measured).
- **Barrel audit too narrow** — only `*OptionsSchema` patterns. Campaign adds `DocDefinition`; audit won't catch malformed exports. (Framework finding F-M1 above already covers the broader lint-enforcement gap.)

Full CI/CD report is `04b-cicd-raw.md` for reference, but the framework + duplication findings cover the same ground in a more campaign-actionable form.

## Cross-phase synthesis preview

The four phases converged on a single picture: the campaign cannot land as a layer on top; it needs three structural pre-fixes that each carry independent value:

1. **Decompose `documentation-types.ts`** — Phase 1 C2, Phase 4 F-H1 (side-effect), Phase 4 F-H2 (type derivation)
2. **Add `.describe()` to 23 fields in 6 schemas** — Phase 3 D-C2, Phase 4 F-H3
3. **Express the Pattern/Decision schema composition + JSDoc cleanup** — Phase 4 D-C1, D-H1

These three together unblock the headline ContentFragment demo. Without them, the campaign ships its proof case as a broken example.
