# Comprehensive Code Review — `packages/architect-projection/`

**Reviewed:** 2026-05-17
**Target:** the fragment-based projection pipeline of `@libar-dev/architect-projection` v2.0.0-pre.1
**Context:** preparing for the doc-generation consolidation campaign drafted in `.pr-coordination/`

## Executive summary

The package is in **better shape than the volume of findings might suggest**. Doctrine adherence is exemplary (zero `eslint-disable`, zero `@ts-ignore`, zero `@deprecated`, zero `z.object(`, 113 `z.strictObject`, zero `as any`/`as unknown`). The markdown trust boundary is unusually well-defended for 2152 LOC of renderer. Test coverage is broad. The architecture has more "welcomes" for the campaign than "fights."

The findings cluster around **one structural problem and three preparation gaps**, each with concrete fixes that are small in scope and high in campaign leverage:

|       | Finding cluster                                                                                                                                                                      | Phase sources              | Effort | Campaign leverage                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- | ------ | ------------------------------------------------------------------------------------ |
| **1** | The closed dispatch core in `documentation-composition/` is the campaign's substrate, not an obstacle around it                                                                      | 1-C1, 1-C2, 4-F-H1, 4-F-H2 | Days   | Critical — campaign cannot land as a layer on top                                    |
| **2** | Zod schemas need `.describe()` + `z.infer`'d types for the campaign's headline demo to work on day one                                                                               | 3-D-C2, 4-F-H3             | Hours  | Critical — demo silently produces an empty table without this                        |
| **3** | Security invariants (5) and load-bearing conventions (`TRUSTED_MARKDOWN`, single options chokepoint) need JSDoc + lint enforcement so the campaign doesn't accidentally violate them | 2-I1–I5, 3-D-C1, 4-F-M1    | Hours  | Critical — invariants are invisible today; a refactor breaks them silently           |
| **4** | Schema-composition + duplication cleanup (Pattern/Decision pairs, slug functions, JSDoc boilerplate)                                                                                 | 4-D-C1–C3, 4-D-H1          | Hours  | High — the pairs are the campaign's worked example; fixing them sets the right shape |

Nothing in the review describes a production bug or a security exposure. Every Critical/High finding describes **substrate work the campaign needs done before W-DOCS-1**, not patches to ship today.

## Findings by priority

### Critical (P0 — fix before W-DOCS-1)

1. **The closed dispatch in `documentation-bundle.internal.ts:64` IS the campaign's substrate** (Phase 1 C1 + Architecture F1 + Framework F1)
   `DOCUMENTATION_PROJECTION_FACTORIES` is statically typed against a closed `SupportedDocumentationType` union, plus `documentation-types.ts` performs validation + `Object.freeze` at module load (breaks `sideEffects: false`).
   **Action:** decompose `documentation-types.ts` along the campaign's four orthogonal layers (Extractors / Routing / Composition / Output-routing) BEFORE introducing `DocDefinition`. Pre-split, don't retrofit.

2. **`documentation-types.ts` (517 LOC) conflates identity, output routing, disclosure policy, CLI surface** (Phase 1 C2 + Architecture F2 + Framework F-H1)
   One Zod object holds every doc-level concern plus dead `'dropped'` lifecycle markers (no-BC violation). Campaign's three orthogonal layers cannot land cleanly.
   **Action:** part of (1) — decompose along layer lines, delete the `'dropped'` shim.

3. **Zero `.describe()` calls across all 135 source files** (Phase 3 D-C2 + Framework F-H3, with a concrete P0 table of 23 fields in 6 schemas)
   The DEEP-DIVE worked example — `extractZodSchemaFields('ProgressiveDisclosurePolicySchema')` producing the disclosure table — returns empty until these annotations land. **The campaign ships its headline demo as a broken example without this fix.**
   **Action:** add `.describe()` to the 23 P0 fields. One session. See `04a-framework-raw.md` for the exact list.

4. **Block types and `SupportedDocumentationType` derived from literals, not `z.infer`'d** (Phase 1 H1 + Framework F-H2)
   `extractZodSchemaFields` walks `.shape` of the schema. If types are inverted (interface-first, schema-derived from `as const`), the extractor reads from the wrong source.
   **Action:** invert — schema is canonical, types are `z.infer<typeof X>`.

5. **Security invariants I1–I5 documented nowhere in source, enforced by no tests** (Phase 2 invariants + Phase 3 D-C1 + Phase 3 T-C2)
   `sanitizeMarkdownLinkTarget` as single link-href chokepoint, UI renderer's intentional URL passthrough, `TRUSTED_MARKDOWN` module-private discipline, `isPlainObject` prototype guard, `parseAndProject` as single options-parsing entry. Campaign authors will route new content through these paths without knowing the invariants. None are exploitable today.
   **Action:** JSDoc blocks on 5 functions/constants + 2 rejection tests (extra-property payload for I5, custom-prototype for I4) + 1 ESLint `no-restricted-imports` rule for I3.

### High (P1 — fix during W-DOCS-1 or before the headline demo)

6. **`PatternDetailSchema` re-declares every `PatternSummary` field instead of `.extend()`-ing it** (Phase 4 D-C1)
   The runtime projection `...spreads summary`, proving the subset relationship. Schema doesn't express it. This pair is the campaign's worked example for ContentFragments.
   **Action:** `PatternDetailSchema = PatternSummarySchema.extend({ additionalFields })`.

7. **`render-markdown.ts` is 2152 LOC, with renderer-side doc-type awareness** (Phase 1 H3, H5 + Architecture F4 + Phase 4 D-H2)
   Renderers call `getDocumentationTypeMetadata()` at render time and parse `routing.rootRouteId.split(':')[0]` to derive doc-type behavior. ADR-005/009 violation. ContentFragment will add 6–10 more normalizers; the leak gets worse.
   **Action:** push disclosure onto `bundle.routing.disclosureSpec` at projection time; renderer trusts the bundle. Extract fragment-specific normalizers to fragment-owned modules with `toMarkdownBlocks(fragment)` contract.

8. **No `renderMarkdown` perf-gate coverage; baseline anchored to ~year-old commit** (Phase 2 H2, M3 + Phase 3 T-C1, T-H2 + CI/CD finding 7)
   The 2152-LOC renderer where the campaign's 5× doc fan-out lands has no perf gate. Only `documentType: 'patterns'` is measured. Baseline is from initial multi-package split (commit `ee58aac`); `× 1.5` ceiling carries ~50% invisible slack.
   **Action:** before W-DOCS-1: regenerate baseline + parameterize perf test over 3 representative doc types + add `renderMarkdown` end-to-end metric. Adds ~30 min runtime; one PR.

9. **`addRoutedDocument` re-renders each split document 2N+2 times** (Phase 2 H1)
   `shouldSplit` pre-render + per-subdoc line-count render in `splitOversizedDocument` + final parent render + sub-file renders. Today's wasted rendering becomes a hot spot at 40-doc fan-out.
   **Action:** render once, cache block stream, take size/split decisions on cached output. Memoize on `(fragment, options)`.

10. **Disclosure vocabulary lives inside `documentation-composition/` but is package-wide** (Architecture F5, F17, F18)
    `DisclosureSpec`, `LogicalRouteId`, disclosure enum imported from a single projection domain into `src/renderers/types.ts`. Layering inversion that the campaign's input-side axis exacerbates.
    **Action:** promote to `src/disclosure/` + `src/routing/` as peer concerns before adding the input-side axis.

11. **39× identical "As a typed contract..." JSDoc boilerplate across fragment files** (Phase 3 D-H1 + Phase 4 D-H1)
    Boilerplate is everywhere, not just renderers. Campaign extracts JSDoc prose for README content; boilerplate fills every section with the same wrong sentence.
    **Action:** delete the boilerplate; replace with per-fragment one-sentence prose. Dispatcher script to enforce.

12. **Two parallel `DeliverableSchema` shapes coexist** (Phase 4 D-C2)
    `src/fragments/execution-context/deliverable.ts` (with `kind` literal) and `src/fragments/pattern-relations/supporting.ts` (without). Both exported from the package barrel.
    **Action:** consolidate to one canonical definition; remove the duplicate.

13. **`slugForFilename` ≡ `toKebabCase`, with a degraded third copy `createSlug`** (Phase 4 D-C3)
    Three identical-ish functions across `_internal`, `render-markdown`, `delivery-reporting`. Routing decisions diverge silently.
    **Action:** one canonical implementation in `_internal/slug.ts`; callers import.

14. **Renderer `### When to Use` stubs carry wrong boilerplate ("As a typed contract...")** (Phase 3 D-H1)
    Factually wrong on the 4 renderer entry points. Makes `extractJSDocProse` useless on them.
    **Action:** lift the accurate "Renderer Overview" section from `docs/MIGRATION.md` into per-renderer JSDoc.

15. **`DOCUMENTATION_PROJECTION_FACTORIES` table has no "do not add entries here" signaling** (Phase 3 D-H2)
    The table the campaign W-DOCS-1 will DELETE has no contributor comment. Most common campaign-contributor mistake will be extending it.
    **Action:** 4-line JSDoc block with TODO marker and pointer to `.pr-coordination/PROPOSED-DESIGN.md`.

### Medium (P2 — plan into W-DOCS-2 / cleanup waves)

16. **6 of 10 markdown normalizers have only smoke-level test coverage** (Phase 3 T-H3)
    Validated by "no-throw + non-empty output." Campaign adds new normalizer peers; smoke-level signal teaches the wrong lesson.
    **Action:** one structural scenario per normalizer (assert specific heading or section content).

17. **`SectionedDocumentFixture` test hack hides normalizer omission** (Phase 3 T-H1)
    Tests cast `ProjectConfigSnapshot` as fake Fragment. New ContentFragment normalizer left out of `MARKDOWN_NORMALIZERS` would pass every existing test.
    **Action:** `satisfies Record<FragmentKind, ...>` on the table forces TS to flag omissions.

18. **`MARKDOWN_NORMALIZERS` typed as `Partial<Record<…>>`** (Framework F-M2)
    Type-side hole matching the test-side hole in (17).
    **Action:** switch to `satisfies` once ContentFragment kinds stabilize.

19. **Convention-only boundaries → lint rules** (Framework F-M1)
    `LogicalRouteId` not branded, `*.internal` not lint-enforced. Four ESLint rules close all four conventions at lint time.
    **Action:** one PR adding four `no-restricted-*` rules. Low risk.

20. **Repeated filter passes; no projection-context memoization** (Phase 2 M2)
    `src/projections/_shared/filter.ts` callers walk the graph each invocation. Compounds linearly with `DocDefinition` count.
    **Action:** `WeakMap<Graph, Map<predicateKey, filtered[]>>` cache; invalidate on rebuild.

21. **Hardcoded doc-type strings outside the registry** (Phase 1 H4)
    `markdown-paths.ts`, `delivery-reporting/index.ts` use string literals at routing decision points.
    **Action:** registry-mediated; remove the string-level decisions when (1) lands.

22. **Renderer-helper duplication in decision-record / decision-catalog** (Phase 4 D-H2)
    Helpers copy-pasted between the two normalizers.
    **Action:** extract to `src/renderers/_shared/decision-formatting.ts`.

23. **`Fragment` is a closed 43-variant discriminated union on `kind`** (Architecture F9, F19)
    `ContentFragment` and `RenderableDocument` don't have a `kind` and shouldn't.
    **Action:** `RenderInput = ProjectionBundle<Fragment> | RenderableDocument`; dispatch at top.

### Low (P3 — track in backlog)

24. **Code-fence escalation bounded at 4 backticks** (Phase 2 L1) — not exploitable today; activates if campaign sources unconstrained text.
25. **`CodeBlock.language` is `z.string().optional()`** (Phase 2 L2) — newline breaks fence. Same activation profile as (24).
26. **`status: 'dropped'` registry entries** (Phase 1 H2) — verify deletion doesn't break CI scripts. Will be removed in (1)/(2).
27. **Incomplete `addRoutedDocument` docs** (Phase 4 raw) — campaign authors will need to read this code path.
28. **README disclosure table drift from `PROGRESSIVE_DISCLOSURE_POLICY` data** (Phase 4 raw) — fixed automatically once (3) lands and the table becomes generated.

## Findings by category

| Category      | Critical | High | Medium | Low | Total                        |
| ------------- | -------- | ---- | ------ | --- | ---------------------------- |
| Code Quality  | 2        | 4    | 1      | 0   | 7                            |
| Architecture  | 1        | 3    | 2      | 1   | 7                            |
| Security      | 0        | 0    | 0      | 2   | 2 (+5 invariants documented) |
| Performance   | 0        | 2    | 3      | 0   | 5                            |
| Testing       | 1        | 2    | 2      | 0   | 5                            |
| Documentation | 2        | 3    | 0      | 1   | 6                            |
| Framework     | 0        | 3    | 2      | 0   | 5                            |
| Duplication   | 1        | 2    | 1      | 0   | 4                            |

(Single root causes counted in their primary phase; cross-phase confirmations referenced in the body.)

## Recommended action plan

**Pre-W-DOCS-1 substrate (1–2 days):**

1. **Decompose `documentation-types.ts`** along Extractors / Routing / Composition / Output-routing — delete the `'dropped'` entries, move side-effectful validation into a test. (Findings 1, 2, framework F-H1) — _enables Critical 1, 2, and 8._
2. **Invert types → schemas** — `Block` types and `SupportedDocumentationType` become `z.infer<typeof X>`. (Finding 4) — _enables Critical 3 to actually work._
3. **Add `.describe()` to 23 P0 fields** — see `04a-framework-raw.md` for the exact list. (Finding 3) — _the campaign's headline demo starts working._
4. **JSDoc + tests for security invariants I1–I5** — 5 JSDoc blocks + 2 rejection tests + 1 ESLint rule. (Finding 5) — _campaign authors can no longer accidentally violate them._

**Pre-headline-demo prep (½ day each):**

5. `PatternDetailSchema.extend(PatternSummarySchema)` + name as ContentFragment pair when campaign lands (6).
6. Add `renderMarkdown` perf gate + regenerate baseline + parameterize over 3 doc types (8).
7. Delete the 39× boilerplate JSDoc; replace per fragment (11, 14).
8. Consolidate the duplicate `Deliverable` schema (12) and `slug` functions (13).

**During W-DOCS-1:**

9. Promote disclosure vocabulary to `src/disclosure/` + `src/routing/` (10).
10. Push disclosure onto `bundle.routing` so renderers trust the bundle (7).
11. Memoize `addRoutedDocument` to fix 2N+2 over-rendering (9).
12. Add 4 ESLint `no-restricted-*` rules for convention boundaries (19).

**Backlog (W-DOCS-2 cleanup):**

13. Structural test scenarios for the 6 smoke-only normalizers (16).
14. `satisfies` typing on `MARKDOWN_NORMALIZERS` once ContentFragment kinds stabilize (17, 18).
15. Filter memoization (20), remaining hardcoded doc-type strings (21), decision-formatting helper extraction (22), top-level Fragment dispatch (23).

## What NOT to touch (campaign welcomes)

Five places where the current architecture is well-positioned for the campaign — leave these alone:

1. **`BlockSchema` discriminated union** (`src/blocks/schema.ts`) — 9-block-type substrate. Hosts ContentFragment-emitted blocks without redesign.
2. **`parseAndProject` trust-boundary helper** — clean ADR-009 implementation; reuse for new extractors.
3. **`ProjectionBundle` / `BundleRouting` / `LogicalRouteId` fan-out machinery** — already does multi-target routing; campaign's `DocTarget[]` layers on top.
4. **The `*.ts` ⟷ `*.internal.ts` paired-module pattern** — uniform convention; just needs lint enforcement (covered by finding 19).
5. **OUTPUT-side disclosure already wired through `renderMarkdown`** via `splitOversizedDocument`. The campaign's INPUT-side axis composes orthogonally; don't refactor the output side.

Plus the singular/collection projection pairs (`BusinessRule`/`BusinessRuleSet`, `DecisionRecord`/`DecisionCatalog`, the RoadmapTimeline triplet, the RequirementDigest pair): these LOOK like duplication but are spec-locked dispatch surfaces. The Lens-2 reframe specifically protected them from a wave of breaking deletions.

## Review metadata

- **Phases:** 5 (Quality+Architecture / Security+Performance / Testing+Documentation / Best-practices+Duplication / Final report)
- **Agents launched:** 9 specialized + 1 simplifier
- **Findings consolidated:** 28 P0–P3 from 9 raw reports
- **Repo doctrine compliance verified:** zero `eslint-disable`, zero `@ts-ignore`, zero `@deprecated`, zero `z.object(`, 113 `z.strictObject`, 128 `z.infer`, zero `as any`/`as unknown`/non-null assertions
- **Flags applied:** performance-critical (perf gate review prioritized)
- **De-emphasized per user direction:** CI/CD review (Phase 4B) — findings retained for reference in `04b-cicd-raw.md` and the consolidated `04-best-practices.md`

## Raw reports

- `00-scope.md` — review scope + repo doctrine
- `01a-code-quality-raw.md` + `01b-architecture-raw.md` → `01-quality-architecture.md`
- `02a-security-raw.md` + `02b-performance-raw.md` → `02-security-performance.md`
- `03a-testing-raw.md` + `03b-documentation-raw.md` → `03-testing-documentation.md`
- `04a-framework-raw.md` + `04b-cicd-raw.md` + `04c-duplication-raw.md` → `04-best-practices.md`
- `05-final-report.md` — this document
