# Phase 3a: Test Coverage & Test Quality Review

Reviewed: `packages/architect-projection/` test suite against the doc-generation consolidation campaign.

## Headline

**35 / 43 projections (81%) have feature coverage; 6 / 10 fragment-specific markdown normalizers have dedicated behavior scenarios.** The campaign has a solid behavioral floor, but has two campaign-blocking gaps: `renderMarkdown` has no perf gate whatsoever (H2 from Phase 2 confirmed), and the 5 security invariants are documented-only with zero test-level enforcement. A third concern — the `SectionedDocumentFixture` hack in render-markdown steps — will silently corrupt the new-normalizer test strategy the campaign needs.

---

## Coverage Matrix — 43 Projections

Legend: **Has-Feature** = at least one feature spec file imports/calls the function. **Has-Perf** = measured in `compare-baseline.mjs` gate.

| #   | Function                              | Has-Feature | Has-Perf                    | Notes                                                                    |
| --- | ------------------------------------- | ----------- | --------------------------- | ------------------------------------------------------------------------ |
| 1   | `projectArchitectureComparison`       | Y           | N                           | smoke only (renderer-smoke)                                              |
| 2   | `projectBoundedContext`               | Y           | N                           | parity + reporting                                                       |
| 3   | `projectArchitectureNeighborhood`     | Y           | N                           | architecture-neighborhood.feature                                        |
| 4   | `projectDependencyEdges`              | Y           | N                           | dependency-edges.feature                                                 |
| 5   | `parseAndProjectPatternBundle`        | **N**       | N                           | no direct test; options-validation path untested                         |
| 6   | `projectPatternBundle`                | Y           | N                           | pattern-bundle.feature                                                   |
| 7   | `parseAndProjectDependencyTree`       | Y           | N                           | dependency-tree.feature                                                  |
| 8   | `projectDependencyTree`               | **N**       | N                           | only called by #7; raw function untested                                 |
| 9   | `parseAndProjectOpenQuestionList`     | **N**       | N                           | no direct test; options-validation path untested                         |
| 10  | `projectOpenQuestionList`             | Y           | N                           | open-question-list.feature                                               |
| 11  | `projectOrphanPatternList`            | Y           | N                           | dependency-tree.feature                                                  |
| 12  | `parseAndProjectPatternCatalog`       | Y           | N                           | pattern-bundle.feature                                                   |
| 13  | `projectPatternCatalog`               | **N**       | N                           | called only via #12 wrapper                                              |
| 14  | `projectPatternDetail`                | Y           | N                           | pattern-detail.feature                                                   |
| 15  | `projectPatternSummary`               | Y           | N                           | parity + smoke                                                           |
| 16  | `parseAndProjectBusinessRuleSet`      | Y           | Y (JSON only)               | 7 feature files                                                          |
| 17  | `projectBusinessRule`                 | Y           | N                           | governance tests                                                         |
| 18  | `projectBusinessRuleSet`              | Y           | N                           | governance tests                                                         |
| 19  | `projectDecisionCatalog`              | Y           | N                           | decision-records.feature                                                 |
| 20  | `projectDecisionRecord`               | Y           | N                           | decision-records.feature                                                 |
| 21  | `parseAndProjectTaxonomyDigest`       | Y           | N                           | validation-taxonomy.feature                                              |
| 22  | `projectTaxonomyDigest`               | Y           | N                           | validation-taxonomy.feature                                              |
| 23  | `projectValidationRuleDigest`         | Y           | N                           | validation-taxonomy.feature                                              |
| 24  | `projectAnnotationCoverage`           | Y           | Y (hot-path)                | reporting.feature + perf                                                 |
| 25  | `projectOverviewDigest`               | Y           | N                           | reporting.feature + smoke                                                |
| 26  | `projectRequirementDigest`            | Y           | Y (hot-path)                | reporting.feature + perf                                                 |
| 27  | `projectRequirementExecutableDigest`  | Y           | Y (hot-path)                | reporting + parity + perf                                                |
| 28  | `projectRequirementSpecsDigest`       | Y           | N                           | reporting.feature                                                        |
| 29  | `projectRoleProfile`                  | Y           | N                           | reporting.feature                                                        |
| 30  | `projectRoleProfiles`                 | Y           | N                           | reporting.feature                                                        |
| 31  | `projectSourceInventoryDigest`        | Y           | N                           | reporting.feature                                                        |
| 32  | `projectTagUsage`                     | Y           | N                           | reporting.feature                                                        |
| 33  | `projectPhaseProgress`                | Y           | N                           | smoke + phase-progress-status                                            |
| 34  | `projectStatusDistribution`           | Y           | N                           | smoke + status-distribution                                              |
| 35  | `projectRoadmapTimeline`              | Y           | N                           | roadmap-timeline + roadmap-markdown                                      |
| 36  | `projectCompletedMilestones`          | Y           | N                           | roadmap-timeline.feature                                                 |
| 37  | `projectCurrentWork`                  | Y           | N                           | roadmap-timeline.feature                                                 |
| 38  | `projectReleaseNotesDigest`           | Y           | N                           | release-notes.feature                                                    |
| 39  | `projectTraceabilityMatrix`           | Y           | N                           | traceability-matrix.feature                                              |
| 40  | `projectDeliverable`                  | Y           | N                           | smoke only (renderer-smoke)                                              |
| 41  | `projectDeliverableManifest`          | Y           | N                           | smoke only (renderer-smoke)                                              |
| 42  | `parseAndProjectFileReadingList`      | Y           | N                           | context-session.feature                                                  |
| 43  | `projectFileReadingList`              | **N**       | N                           | called only by #42 wrapper                                               |
| 44  | `parseAndProjectHandoffRecord`        | Y           | N                           | context-session.feature                                                  |
| 45  | `projectHandoffRecord`                | **N**       | N                           | called only by #44 wrapper                                               |
| 46  | `parseAndProjectScopeReadinessReport` | Y           | Y (hot-path)                | smoke + context-session + perf                                           |
| 47  | `projectScopeReadinessReport`         | **N**       | N                           | called only by #46 wrapper                                               |
| 48  | `parseAndProjectSessionContext`       | Y           | Y (hot-path)                | 4 feature files + perf                                                   |
| 49  | `projectSessionContextBundle`         | Y           | N                           | smoke                                                                    |
| 50  | `parseAndProjectArchitectureDiagram`  | **N**       | N                           | options-validation path untested; `projectArchitectureDiagram` IS tested |
| 51  | `projectArchitectureDiagram`          | Y           | N                           | config-documentation.feature                                             |
| 52  | `parseAndProjectConfig`               | Y           | N                           | config-documentation.feature                                             |
| 53  | `projectConfig`                       | Y           | N                           | smoke only                                                               |
| 54  | `parseAndProjectDocumentationBundle`  | Y           | Y (hot-path, patterns-only) | 4 feature files; perf only exercises `patterns` type                     |
| 55  | `projectDocumentationBundle`          | Y           | N                           | smoke + config                                                           |
| 56  | `parseAndProjectPrChangeReview`       | Y           | N                           | config-documentation.feature                                             |
| 57  | `projectPrChangeReview`               | Y           | N                           | smoke only                                                               |

**Totals (INVENTORY's canonical 43):** 35 / 43 have feature coverage. 8 have none.
**Perf gate:** 7 hot-path projections measured. `renderMarkdown` is not measured for any of them.

---

## Invariant Lock Status

| ID     | Invariant                                                                         | Test Exists? | File / Gap                                                                                                                                                                                                                                                                                                                        |
| ------ | --------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I1** | `sanitizeMarkdownLinkTarget` rejects javascript:, data:, control chars            | **Partial**  | `render-markdown.feature.steps.ts` tests `javascript:` scheme in 10+ places; `data:` and `vbscript:` are NOT tested. The allowlist is enforced but the full rejection surface is not locked.                                                                                                                                      |
| **I2** | UI renderer does NOT sanitize URLs (intentional)                                  | **N**        | `render-ui.feature` has zero URL-related scenarios. No test documents or asserts this intentional asymmetry.                                                                                                                                                                                                                      |
| **I3** | `TRUSTED_MARKDOWN` is module-private; campaign's `composeDoc` must not export it  | **Partial**  | Two scenarios ("Release notes trusted markdown escapes interpolated fragment values", "Requirement digests escape interpolated trusted markdown values") assert the escape BEHAVIOR. No test asserts the symbol is unexported or that calling code outside `render-markdown.ts` cannot obtain a `TRUSTED_MARKDOWN`-tagged object. |
| **I4** | JSON renderer uses `isPlainObject` prototype check (anti-prototype-pollution)     | **N**        | `render-json.feature` tests Date/Map/Set class instances ("Forbidden runtime values produce descriptive path errors") but has no test for `Object.create(customProto)` — the prototype-chain check that `isPlainObject` actually enforces.                                                                                        |
| **I5** | `parseAndProject` rejects open-shape Zod input (all schemas use `z.strictObject`) | **Partial**  | Three scenarios reject invalid values for known required fields (wrong grouping enum, unknown session type, malformed source-glob groups). None passes an EXTRA unknown property and asserts rejection. The `z.strictObject` strictness is untested at the call boundary.                                                         |

---

## Findings (prioritized by campaign risk)

### F1 — `renderMarkdown` has no perf gate; campaign multiplies this path 5×

**Severity: Critical**

Confirmed Phase 2 H2: `tests/perf/baselines/business-rule-set.baseline.json` contains no `renderMarkdown` metric. The `compare-baseline.mjs` gate measures `project`, `renderObject` (JSON), `renderPretty` (JSON), and 7 hot-path projections via `renderJson`. The 2152-LOC markdown renderer — where the campaign's 5× doc-count fan-out lands — has no measured budget.

**Why it matters:** the campaign adds `~25` new `DocDefinition`s, most routing through `renderMarkdown`. Regressions in `normalizeBusinessRuleSet`, `normalizeRequirementDigest`, or `splitOversizedDocument` land silently.

**Recommendation:** Add `renderMarkdown` measurement to the perf report before W-DOCS-1. Parameterize over at least 3 `documentType` values (`business-rules`, `requirements-executable`, `patterns`) since each exercises a different normalizer. Extend `compare-baseline.mjs` with a `renderMarkdown` block parallel to `renderObject`/`renderPretty`.

```typescript
// In business-rule-set-report.steps.ts, extend projectionHotPaths:
renderMarkdownBusinessRules: measureProjection(
  () => renderMarkdown(parseAndProjectDocumentationBundle(projectionContext, { documentType: 'business-rules' })),
),
renderMarkdownRequirements: measureProjection(
  () => renderMarkdown(parseAndProjectDocumentationBundle(projectionContext, { documentType: 'requirements-executable' })),
),
renderMarkdownPatterns: measureProjection(
  () => renderMarkdown(parseAndProjectDocumentationBundle(projectionContext, { documentType: 'patterns' })),
),
```

```javascript
// In compare-baseline.mjs, add to HOT_PATH_BUDGETS:
renderMarkdownBusinessRules: { field: 'avgMs', budget: 20, unit: 'ms' },
renderMarkdownRequirements:  { field: 'avgMs', budget: 20, unit: 'ms' },
renderMarkdownPatterns:      { field: 'avgMs', budget: 20, unit: 'ms' },
```

---

### F2 — Security invariants I1–I5 are documented-only; campaign adds code that violates each

**Severity: Critical**

All five invariants from Phase 2 lack test-level enforcement. Concretely:

- **I1 (partial):** `data:` scheme is not tested. `sanitizeMarkdownLinkTarget` allowlists `http/https/mailto`. A test asserting `data:text/html,<script>` produces `null` would lock it.
- **I2 (none):** UI renderer intentionally skips URL sanitization. No test locks this. When multi-target output adds Studio consumers, this gap becomes exploitable. A scenario asserting `renderUi` returns an unmodified `javascript:` href (as a documented invariant, not a bug) locks the boundary.
- **I3 (partial):** Tests verify escape behavior, not module privacy. The campaign's `composeDoc` MUST NOT export or accept `TRUSTED_MARKDOWN`-tagged objects from outside the module. A static-analysis check or barrel-audit assertion that `TRUSTED_MARKDOWN` appears in exactly zero exports would lock I3.
- **I4 (none):** `isPlainObject` prototype check is not tested. `Object.create({ someProto: true })` should fail; a `Date` instance also fails, but the test only covers `Date/Map/Set`. The prototype-chain case is what the invariant actually guards.
- **I5 (partial):** `parseAndProject` strictness is tested for wrong-type and missing-field rejections, but not for extra-property rejection. A scenario that passes `{ groupedBy: 'package', unknownExtra: true }` to `parseAndProjectBusinessRuleSet` and asserts it throws locks I5.

**Why it matters:** The campaign adds `DocDefinition.build(graph)` — a new entry point that must inherit parseAndProject discipline (I5), must not accept TRUSTED_MARKDOWN from outside (I3), and will route new fragment types through `renderMarkdown` link paths (I1). Each invariant the campaign needs to respect must be a failing test before the campaign lands.

**Recommendation for I5** (one example, covers the most impactful gap):

```gherkin
# In business-rules.feature or a new invariant-locks.feature:
Scenario: parseAndProjectBusinessRuleSet rejects extra unknown properties
  Given a projection context with one pattern
  When I call parseAndProjectBusinessRuleSet with options containing an unknown "unknownExtra" property
  Then it should throw with a message matching "Invalid options"
```

```typescript
// Step implementation:
When(
  'I call parseAndProjectBusinessRuleSet with options containing an unknown "unknownExtra" property',
  () => {
    state!.error = null;
    try {
      parseAndProjectBusinessRuleSet(state!.context!, {
        groupedBy: 'package',
        unknownExtra: true,
      } as never);
    } catch (err) {
      state!.error = err;
    }
  },
);
Then('it should throw with a message matching "Invalid options"', () => {
  expect(state!.error).toBeDefined();
  expect(String(state!.error)).toMatch(/Invalid options/);
});
```

---

### F3 — `SectionedDocumentFixture` casts `ProjectConfigSnapshot as unknown as Fragment`; new normalizer tests will silently route through the wrong code path

**Severity: High**

`render-markdown.feature.steps.ts:30-43`: `documentationFixtureToFragment()` constructs a `ProjectConfigSnapshot` with `as unknown as Fragment`, so the "canonical blocks" and most "routed output" scenarios exercise `normalizeGenericFragment` — NOT any of the 10 named normalizers. This means:

1. Tests that appear to test `normalizeBusinessRuleSet` via "routed business-rules" scenarios actually do test it (those scenarios construct real `BusinessRuleSet` fragments).
2. But tests labeled "SectionedDocumentFixture" implicitly test a fake fragment kind that hits `normalizeGenericFragment`. The campaign's ContentFragment normalizers will also route through `normalizeGenericFragment` unless they add an entry to `MARKDOWN_NORMALIZERS`.

If a ContentFragment normalizer is accidentally omitted from `MARKDOWN_NORMALIZERS`, the "all nine block types render in canonical markdown" test will still pass because it never hits the missing entry.

**Why it matters:** The renderer-smoke feature (`renderer-smoke.feature`) will catch a crash (no renderer throws), but NOT a wrong rendering. A new fragment kind silently falling through to `normalizeGenericFragment` produces incorrect output without failing any test.

**Recommendation:** Add a `Feature: normalizer dispatch completeness` scenario that explicitly asserts `MARKDOWN_NORMALIZERS` contains an entry for every known `Fragment.kind` — not just that rendering doesn't throw:

```gherkin
Scenario: Every Fragment kind has an explicit markdown normalizer or is intentionally generic
  Given the complete set of Fragment kinds from FragmentSchema
  When I inspect the MARKDOWN_NORMALIZERS dispatch table
  Then every Fragment kind should either have an explicit entry or be in the documented generic-fallback set
```

Alternatively, add a compile-time `satisfies Record<FragmentKind, ...>` check on `MARKDOWN_NORMALIZERS` similar to how `DOCUMENTATION_PROJECTION_FACTORIES satisfies Record<SupportedDocumentationType, ...>` is enforced.

---

### F4 — Perf gate only exercises `documentType: 'patterns'`; 11 types have zero measurement

**Severity: High**

`business-rule-set-report.steps.ts:628-635` measures `documentationView` only with `documentType: 'patterns'`. The `DOCUMENTATION_PROJECTION_FACTORIES` dispatch table has 12 entries today; the campaign will grow it to 25+. The `documentationView` hot-path budget (8ms ceiling) covers one of the fastest projections (`projectPatternCatalog`). Doc-types that invoke heavier normalizers (`requirements-executable`, `business-rules`, `traceability`) have no measured budget.

**Why it matters:** Phase 2 M1 confirmed this. The campaign multiplies both the number of types and the frequency of rendering. A regression in `normalizeTraceabilityMatrix` or `normalizeBusinessRuleSet` is invisible to the gate until a user notices slow `docs:all` runs.

**Recommendation:** Parameterize `documentationView` measurement over a representative subset. Add at minimum `requirements-executable` (exercises `normalizeRequirementDigest` with bundle children) and `business-rules` (exercises `normalizeBusinessRuleSet` with grouping) since these are the two most structurally complex normalizers and are campaign hot-paths.

---

### F5 — 6 of 10 markdown normalizers have only smoke-level coverage in renderer tests

**Severity: High**

`renderer-smoke.feature` asserts "no renderer throws and each produces a non-empty projection" for all 43 fragment kinds. That is the only test exercising these 6 normalizers:

- `normalizeArchitectureDiagram`
- `normalizeDecisionCatalog`
- `normalizeDecisionRecord`
- `normalizeTaxonomyDigest`
- `normalizeTraceabilityMatrix`
- `normalizeValidationRuleDigest`

`normalizeRoadmapTimeline` has one scenario in `roadmap-markdown.feature` (routing check). `normalizeBusinessRuleSet`, `normalizeRequirementDigest`, and `normalizeReleaseNotesDigest` have dedicated scenarios in `render-markdown.feature`.

**Why it matters:** The campaign adds 6–10 new normalizers (one per ContentFragment type). If the smoke test is the standard of evidence, the campaign's new normalizers will be "tested" by a non-empty-string check. Any structural error in a new normalizer — wrong heading level, link injection, disclosure-level filtering — passes the smoke test.

**Recommendation:** For each of the 6 smoke-only normalizers, add at minimum one scenario asserting a structural invariant. Example for `normalizeDecisionRecord`:

```gherkin
# In decision-records.feature or renderers/render-markdown.feature:
Scenario: DecisionRecord renders with status and rationale sections
  Given a DecisionRecord fragment fixture with status "accepted" and a rationale block
  When I render the fragment as markdown
  Then the markdown output should contain a "## Status" heading with "accepted"
  And the markdown output should contain a "## Rationale" section
```

This is campaign-relevant because `projectDecisionRecord` is being wired into doc-gen for the first time (it currently has `❌` in the doc-gen column of INVENTORY).

---

### F6 — `parseAndProjectArchitectureDiagram` options-validation path is untested

**Severity: Medium**

`projectArchitectureDiagram` is tested in `config-documentation.feature` for all 4 scope values. But `parseAndProjectArchitectureDiagram` — the boundary-validated entry point — has no feature coverage (`Has-Feature: N` in coverage matrix, row 50). The scope enum validation, the `scopeValue` requirement for `bounded-context` and `product-area` scopes, and rejection of unknown options are all exercised only through the raw inner function.

**Why it matters:** The campaign's `DocDefinition.build(graph)` will call `parseAndProject*` wrappers uniformly (they are the trust boundary per Phase 1 H8). If the campaign normalizes to one call signature, the architecture-diagram entry point must be reachable via its `parseAndProject` wrapper, not its raw function. Untested options-validation creates silent regression risk.

**Recommendation:**

```gherkin
# In config-documentation.feature:
Scenario: parseAndProjectArchitectureDiagram rejects an unknown scope
  Given a Documentation Composition context with two patterns and a relationship
  When I call parseAndProjectArchitectureDiagram with scope "non-existent-scope"
  Then it should throw with a message matching "Invalid options"
```

---

### F7 — `test-graph-builder.ts` uses `as unknown as` on `ExtractedPattern['directive']` and `['source']` fields

**Severity: Medium**

`tests/support/test-graph-builder.ts:104, 113`: Two `as unknown as ExtractedPattern[...]` casts construct stub `directive` and `source` objects with fewer fields than the real schema requires. When the campaign extends `ExtractedPattern` with new fields (e.g., for ContentFragment preamble loading), these stubs will silently omit them. Any test that depends on the new fields will either fail with a confusing undefined-property error or pass incorrectly if the projection has a fallback.

**Why it matters:** The test-graph-builder is the foundation for all projection tests. If it drifts from the real schema, projection tests stop testing what the campaign ships.

**Recommendation:** Replace the `as unknown as` casts with proper typed stub builders that satisfy the Zod schema, or add a parse-time check that validates the stub against `ExtractedPatternSchema` at test setup. No mock needed — just construct the fields the schema requires.

---

### F8 — `render-markdown.feature.steps.ts` has 4 `as unknown as Fragment` casts masking schema drift

**Severity: Medium**

`render-markdown.feature.steps.ts:42, 305, 328, 335` cast constructed objects `as unknown as Fragment`. These are deliberate "fake Fragment" objects used to test renderer behavior in isolation from projection logic. They are not inherently wrong, but they will silently pass even if `FragmentSchema` adds new required fields, because the casts bypass Zod validation.

**Why it matters:** The campaign adds ContentFragment with new required fields. If a normalizer for a new ContentFragment kind is tested with a pre-campaign fake-fragment cast, the test is measuring behavior of the pre-campaign schema shape.

**Recommendation:** Add `FragmentSchema.parse(fragment)` assertions for the fake fragments used in renderer scenarios, or construct them through the real fragment builder functions used in `tests/fixtures/fragments.ts`. This is a one-time fix rather than a test redesign.

---

### F9 — All 7 truly-unreachable projections (`❌❌` from INVENTORY) have feature coverage; they are NOT dead code

**Severity: Low (informational)**

Phase 2 raised the question: are the 11 unreachable projections spec-covered (alive) or dead (deletable)? The 7 functions with both doc-gen and CLI/MCP columns as `❌` in INVENTORY are:

| Function                     | Feature coverage                                        |
| ---------------------------- | ------------------------------------------------------- |
| `projectDependencyEdges`     | `dependency-edges.feature` — behavioral scenarios       |
| `projectPatternSummary`      | `parity-bundle-shape.feature`, `renderer-smoke.feature` |
| `projectCompletedMilestones` | `roadmap-timeline.feature`                              |
| `projectBusinessRule`        | `business-rules.feature`, `renderer-smoke.feature`      |
| `projectDecisionRecord`      | `decision-records.feature`, `renderer-smoke.feature`    |
| `projectRoleProfile`         | `reporting.feature` — behavioral scenarios              |
| `projectRoleProfiles`        | `reporting.feature` — behavioral scenarios              |

All 7 are alive: tested, schema-sound, and expected to be wired as `DocDefinition` targets in the campaign. None are dead-code candidates. The 4 INVENTORY entries NOT counted in the 7 (`projectPatternSummary`, `projectCurrentWork`, `projectDeliverable`, `projectDeliverableManifest`) are either reachable via doc-gen or MCP.

**Note:** The INVENTORY's "11 unreachable" count includes `parseAndProject` wrappers for unreachable raw functions (e.g., `parseAndProjectPatternBundle`) and functions like `projectPatternSummary` which are sub-components of other projections, not standalone entry points.

---

### F10 — Perf baseline anchored to commit `ee58aac` (year-old); ~50% invisible headroom

**Severity: Medium**

Phase 2 M3 confirmed. `tests/perf/baselines/business-rule-set.baseline.json` was generated at `2026-05-08` (the file's `generatedAt` field — but the Phase 2 reviewer noted the underlying fixture was anchored at an older build). The `× 1.5` multiplier allows 50% regression before the gate trips. On a post-W1.5 build, the actual headroom is likely less visible because W1.5 may have tightened or loosened the underlying costs.

**Why it matters:** The campaign cannot inherit invisible headroom. If the baseline is already 30% above post-W1.5 reality, the gate allows a 1.8× regression before failing.

**Recommendation:** Regenerate the baseline on a clean post-W1.5 build before W-DOCS-1 starts. Run `pnpm test -- --reporter=verbose` on the perf scenario, write the evidence file, and commit that as the new `baselines/business-rule-set.baseline.json`.

---

### F11 — Fragment-schema invalid fixtures test missing-field rejection, not extra-property rejection

**Severity: Medium**

`FRAGMENT_INVALID_FIXTURES` (line 1020 of `fragments.ts`) constructs invalid fixtures primarily by including an `extraField: true` property in some cases (e.g., `PhaseProgress`) and removing a required field in others (e.g., `StatusDistribution` has no `extraField` — it's invalid because `percentages.total` may not sum correctly, or another structural reason). The actual invalidity mechanism varies per kind.

The `fragment-schemas.feature` scenario "Every fragment kind parses strictly" declares the spec asserts "reject extras" (Feature line 3), but for most kinds the invalid fixture achieves rejection through shape mismatch rather than extra-property rejection. The `z.strictObject` discipline (I5) is not uniformly tested at the fragment layer.

**Why it matters:** When ContentFragment is added as a new Fragment kind, its invalid fixture should test both missing-required-field AND extra-property rejection to confirm `z.strictObject` is in force.

**Recommendation:** For each `FRAGMENT_INVALID_FIXTURES` entry, ensure the fixture contains at least one `extraField: true` and that the scenario name or comment identifies which invalidity rule is being tested.

---

### F12 — No test prevents `_internal` module imports from tests (M2 boundary not enforced)

**Severity: Low**

Phase 1 M2 flagged the `_internal` boundary as naming-only with no enforcement. Confirmed in test files: zero imports reference `*.internal.ts` files from feature steps. However, there is no lint rule or test that would fail if a new step file added such an import. The `vitest.config.ts` does not exclude internal modules from test resolution.

**Why it matters:** As the campaign adds new `*.internal.ts` files (e.g., the replacement dispatch core), test steps may accidentally import them directly rather than going through the public API, creating coupling that survives the campaign boundary.

**Recommendation (Low):** Add an ESLint rule or a barrel-audit assertion that step files under `tests/features/` do not import from paths matching `*.internal.ts`. This is a single-rule addition to the existing barrel-audit pattern.

---

### F13 — `parseAndProjectOpenQuestionList` and `parseAndProjectPatternBundle` wrappers have no tests

**Severity: Low**

Both wrappers are exported from the public API (`src/projections/pattern-relations/index.ts`) but no feature step imports or calls them. The underlying `projectOpenQuestionList` and `projectPatternBundle` are tested, but the options-validation path added by `parseAndProject(...)` is not exercised.

**Why it matters:** `parseAndProjectOpenQuestionList` accepts `OpenQuestionListOptionsSchema` with a filter. If the schema is tightened (e.g., status filter becomes an enum), the wrapper's rejection path is silent.

**Recommendation:** One scenario each for the validated entry points — specifically the rejection path (invalid option value) to lock the schema contract:

```gherkin
# In open-question-list.feature:
Scenario: parseAndProjectOpenQuestionList rejects an unknown status filter
  Given a projection context with two patterns
  When I call parseAndProjectOpenQuestionList with status "nonexistent-status"
  Then it should throw with a message matching "Invalid options"
```

---

### F14 — Test pyramid is vitest-cucumber only; no layer below features

**Severity: Low (informational)**

There are zero `*.test.ts` / `*.spec.ts` files in the package. Every test is a vitest-cucumber feature spec. This is intentional and appropriate for a pure-function library. The test pyramid is flat: all integration/behavioral. The only risk is that feature specs test projections end-to-end, so a bug in `_internal/slug.ts` or `_internal/format-utils.ts` surfaces as a projection behavior failure (hard to isolate).

**Why it matters for campaign:** The campaign adds `DocDefinition.build(graph)` and `composeDoc()` helpers. If these are pure functions, a feature spec is the correct test vehicle. No action needed unless a low-level utility proves difficult to isolate in scenario-level debugging.

---

### F15 — Perf test timing is non-deterministic but non-flaky (perf test writes report only)

**Severity: Low (informational)**

The vitest-run perf test (`business-rule-set-report.feature`) does not assert timing thresholds — it only writes a JSON report to `.sisyphus/evidence/`. The `compare-baseline.mjs` gate is a separate CI step that fails on threshold violations. This architecture avoids flaky test failures due to CI machine variance. No change needed.

---

## Two-Table Summary

### Coverage Matrix Headline

**35 / 43 projections have at least one feature spec. 8 have no direct feature spec (though most are tested indirectly via their `parseAndProject` wrapper or as sub-functions of a tested projection).**

**10 / 10 markdown normalizers have at minimum smoke-level rendering validation. 4 / 10 have dedicated behavior scenarios. 6 / 10 are smoke-only.**

**0 / 5 security invariants have complete test-level enforcement. 2 / 5 have partial behavioral coverage. 3 / 5 have no test at all.**

**0 renderMarkdown perf measurements exist in the gate. 1 documentType (`patterns`) is measured at the projection level only.**

### Campaign-blocking gaps (must fix before W-DOCS-1)

1. **F1 (Critical):** No `renderMarkdown` perf gate. Add `renderMarkdown` hot-path measurements for `business-rules`, `requirements-executable`, `patterns` before the campaign starts.
2. **F2 (Critical):** Security invariants I1–I5 are documented-only. Add rejection tests for I5 (extra-property via `parseAndProject`), I4 (prototype-chain via `isPlainObject`), and I2 (UI renderer URL passthrough as documented invariant) before ContentFragment routes new code through these paths.
3. **F3 (High):** `SectionedDocumentFixture` cast masks which normalizer is actually under test. Add a `MARKDOWN_NORMALIZERS` completeness assertion (compile-time `satisfies` check or scenario) before the campaign adds new normalizer entries.
4. **F4 (High):** Perf gate covers only `documentType: 'patterns'`. Parameterize before W-DOCS-1.
5. **F5 (High):** 6 normalizers have smoke-only coverage. Add one structural scenario for each before the campaign adds new normalizer peers alongside them.
