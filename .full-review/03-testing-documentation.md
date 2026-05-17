# Phase 3: Testing & Documentation Review

Raw reports: `03a-testing-raw.md`, `03b-documentation-raw.md`.

## Headline

**Coverage is broad but campaign-critical paths are unlocked, and the docs that exist are accurate but silent about the invariants the campaign must preserve.**

Both reviews converged on a single structural finding: the 2152-LOC `render-markdown.ts` has wide *smoke* coverage but narrow *behavioral* coverage, and zero of the Phase 2 security invariants are captured in either tests OR JSDoc. The campaign will land new code through these paths and find them undocumented + under-tested. The fixes are cheap; doing them before W-DOCS-1 is high-leverage.

Notable positive finding: **the 7 unreachable projections (no doc-gen, no CLI/MCP exposure) all have behavioral feature specs** — they're alive, not dead. The campaign should plan to surface them, not delete them.

## Testing findings

### Coverage matrix headline
- **35 / 43 projections** have at least one feature spec
- **10 / 10 markdown normalizers** have smoke-level rendering validation
- **4 / 10 markdown normalizers** have dedicated behavioral scenarios
- **0 / 5 security invariants** have complete test-level enforcement
- **0 perf-gate coverage** of `renderMarkdown` end-to-end
- **1 / 12 document types** measured by the perf gate (`patterns` only)

### Critical findings

**T-C1 — No `renderMarkdown` perf gate**
- The 2152-LOC renderer is unmeasured. Campaign multiplies doc-count 5×.
- Regressions in `normalizeBusinessRuleSet`, `normalizeRequirementDigest`, and `splitOversizedDocument` will land silently.
- **Fix:** add `renderMarkdown` hot-path metrics for at least `business-rules`, `requirements-executable`, and `patterns` before W-DOCS-1.
- (Confirms Phase 2 H2 with concrete file evidence.)

**T-C2 — Security invariants I1–I5 are documented-only, zero test enforcement**
- I1 tests `javascript:` rejection but not `data:` rejection in `sanitizeMarkdownLinkTarget`.
- I2 (UI renderer's intentional URL passthrough) has no test locking the invariant.
- I3 (`TRUSTED_MARKDOWN` module-private) has no lint/test preventing import elsewhere.
- I4 (prototype-pollution guard in `isPlainObject`) has no test.
- I5 (`parseAndProject` rejects extra unknown properties via `z.strictObject`) has no test.
- **Fix:** add rejection tests for I5 (extra-property payload) and I4 (custom-prototype payload) before ContentFragment routes new code through these paths. I3 can be enforced via an ESLint `no-restricted-imports` rule.

### High-priority findings

**T-H1 — `SectionedDocumentFixture` test hack hides normalizer omission**
- Many `render-markdown` test scenarios cast `ProjectConfigSnapshot` as a fake Fragment to exercise the canonical-blocks path. A new ContentFragment normalizer accidentally left out of `MARKDOWN_NORMALIZERS` would pass every existing test.
- **Fix:** add a compile-time `satisfies Record<FragmentKind, ...>` check on the `MARKDOWN_NORMALIZERS` table. Forces TS to flag any missing entry.

**T-H2 — Perf gate only exercises `documentType: 'patterns'`**
- 11 other types, including the structurally-heavier `traceability` and `requirements-executable`, are unmeasured. Campaign adds 25+ doc types.
- **Fix:** parameterize the `documentationView` perf measurement before W-DOCS-1. One baseline per type.

**T-H3 — 6 of 10 markdown normalizers have only smoke-level coverage**
- `normalizeArchitectureDiagram`, `normalizeDecisionCatalog`, `normalizeDecisionRecord`, `normalizeTaxonomyDigest`, `normalizeTraceabilityMatrix`, `normalizeValidationRuleDigest` validated only by "no-throw + non-empty output."
- Campaign adds new normalizer peers alongside these. New normalizers will be even less covered if peer signal is "smoke is enough."
- **Fix:** one structural scenario per normalizer (assert specific heading or section content) before W-DOCS-2.

### Unreachable-projection verdict
**Not dead code.** All 7 `❌❌` projections in INVENTORY have behavioral feature specs. They are alive but unsurfaced; the campaign should treat them as `DocDefinition` targets, not deletion candidates.

## Documentation findings

### Critical findings

**D-C1 — Security invariants I1–I5 documented nowhere in the source**
- `sanitizeMarkdownLinkTarget`, the UI renderer's intentional passthrough, `TRUSTED_MARKDOWN`, `isPlainObject`'s prototype guard, `parseAndProject`'s `z.strictObject` discipline — none of these have JSDoc explaining them.
- Campaign authors writing `composeDoc` and `ContentFragment.build()` will route new content through these paths without knowing the invariants.
- **Fix:** JSDoc blocks on 5 functions/constants in `render-markdown.ts` and `render-json.ts`. Single session of work.

**D-C2 — Zero `.describe()` calls across all 135 source files**
- DEEP-DIVE's headline worked example (`extractZodSchemaFields('ProgressiveDisclosurePolicySchema')` producing the disclosure table) fails silently — returns empty — until `.describe()` is added to the 13 fields these schemas expose.
- **Highest-impact campaign-readiness finding.** The campaign's most prominent demo doesn't work today.
- **Fix:** add `.describe()` to `ProgressiveDisclosurePolicySchema`, `DisclosureSpecSchema`, and the disclosure enum schemas before W-DOCS-1 ships the new extractor. Otherwise the kitchen-sink demo produces an empty table.

### High-priority findings

**D-H1 — All 4 renderer `### When to Use` stubs carry boilerplate copied from contract files**
- Says "As a typed contract / data shape consumed by projection or render layers." Factually wrong for renderers.
- Makes `extractJSDocProse()` + planned `@architect-renderer` tag pattern useless on the 4 entry points.
- **Fix:** lift the accurate "Renderer Overview" section from `docs/MIGRATION.md` (150 lines) into per-renderer JSDoc.

**D-H2 — `DOCUMENTATION_PROJECTION_FACTORIES` table has no contributor signaling**
- The table the campaign's W-DOCS-1 will DELETE has no "do not add entries here" comment and no pointer to the replacement design.
- Most common campaign-contributor mistake will be extending it. 4-line block comment prevents this.
- **Fix:** add JSDoc citing `.pr-coordination/PROPOSED-DESIGN.md` + a TODO marker.

**D-H3 — `DisclosureSpec`, `LogicalRouteId`, `ContentRichness` enum values undocumented**
- The three types ContentFragment authors will use on every invocation. No JSDoc anywhere.
- Campaign authors in W-DOCS-2d must trace 2152 LOC of renderer logic to understand `emitChildren`, `richness`, route ID formats.
- **Fix:** JSDoc on each, with a worked example referencing the `RenderMarkdownOptions.disclosureLevel` consumer site.

### Medium-priority findings (cited from raw report — not duplicated)

D-M1 through D-M5: incomplete docs for `addRoutedDocument`, missing `@architect-pattern` on `blocks/schema.ts` and `fragments/base.ts`, README disclosure table drift, no root-level v1→v2 `MIGRATION.md`, perf-gate gap not noted in PERF.md. None block campaign start.

## Cross-cutting observation

The package documents its **shapes** (types, schemas) but not its **invariants** (what must remain true across changes). Phase 2's security audit derived 5 invariants by reading code, not comments. The doc-gen campaign is the right moment to capture these invariants as JSDoc + executable assertions — both because the campaign needs them, AND because the campaign's own generators will then surface them in the auto-generated docs.

This is the dogfooding loop: invariants captured in JSDoc → extracted by `extractJSDocProse` → rendered in `docs-live/` reference docs → reviewed by anyone touching the code → corruption detected by the same gate that generates the docs.

## Critical issues for Phase 4 context

Phase 4 reviewers (framework practices + CI/CD) should give weight to:

- **The barrel audit script** (`scripts/options-schema-barrel-audit.mjs`, run as `test:barrel-audit` ahead of typecheck) — what's it enforcing? Is it relevant to the campaign's `DocDefinition` API addition?
- **Perf gate as CI artifact** — Phase 3 confirmed the gate exists but is narrow. Phase 4 should look at how the gate runs in CI: stability of measurement environment, baseline regeneration cadence, failure surfacing.
- **`.describe()` discipline as a build-time check** — the campaign needs Zod schema fields with `.describe()` to generate doc tables. Could this be enforced by an ESLint rule + Zod-schema scanner?
- **JSDoc tag discipline** — `@architect-*` annotations are doctrine but not lint-enforced. Phase 4 should look at whether step-lint or a similar tool checks them; if not, the campaign is one renamed file away from undetected drift.
- **ESM packaging** — the `exports` map has 5 sub-entries. Phase 4 should confirm the build emits matching `.d.ts` + `.js` for each, and that the `prepack` script catches drift.
- **Test parallelism / wall clock** — vitest-cucumber suite size, perf-gate run frequency. The campaign will add tests; Phase 4 should flag any structural test-time bottleneck.
