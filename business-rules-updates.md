## Business Rules Report Quality Audit - Executable Specifications Updates

**Please help me update next batch of executable specifications for effective and consistent auto-generated reports.**

Here is example of one report `pnpm docs:business-rules`:
@docs-generated/business-rules

```markdown
Using sources from delivery-process.config.ts...
Scanning source files...
Found 243 patterns
Extracting patterns...
Extracted 243 patterns

Running generator: business-rules
✓ BUSINESS-RULES.md
✓ business-rules/annotation.md
✓ business-rules/configuration.md
✓ business-rules/core-types.md
✓ business-rules/data-api.md
✓ business-rules/generation.md
✓ business-rules/validation.md
```

---

### Pattern for Future Mass Updates

Each Rule block follows this template:

```gherkin
Rule: <Rule name>

    **Invariant:** <What must always be true — the constraint>
    **Rationale:** <Why this constraint exists — the business justification>
    **Verified by:** <Comma-separated scenario names from this Rule>

    @happy-path
    Scenario: ...
```

Key guidelines for the person (or agent) doing mass updates:

1. **Invariant** = restated constraint from the rule name, made precise (e.g., "provides minimal taxonomy" → "must provide exactly 3 categories")
2. **Rationale** = the "why" — what would go wrong without this rule
3. **Verified by** = exact scenario names from the Rule block, comma-separated
4. **Rationale is optional** — some rules are self-evident (e.g., "defineConfig returns input unchanged")
5. No code changes needed — these are spec-only, zero-risk updates
6. Read each file before updating — the agent must understand the Rule to write a meaningful Invariant

---

## Spec Consistency Audit (Prioritized List)

### Current State (as of 2026-02-15, Session 4)

| Category                                   | Count    | Description                                  |
| ------------------------------------------ | -------- | -------------------------------------------- |
| Full structured (all Rules have Invariant) | 99 files | Done — Tiers 1-4 + 14 Tier 5 files complete  |
| Partial (some Rules have Invariant)        | 0 files  | All Tier 3 partial files now complete        |
| Rules with no Invariant at all             | 0 files  | All tiers complete                           |
| No Rule: blocks at all                     | 9 files  | Remaining Tier 5 files needing restructuring |

### Priority Tiers

---

**[x] Tier 1 — COMPLETE (13 files, 73 rules enriched)**

- [x] `tests/features/validation/process-guard.feature` (6 rules)
- [x] `tests/features/behavior/codecs/reference-generators.feature` (4 rules)
- [x] `tests/features/generators/orchestrator.feature` (1 rule)
- [x] `tests/features/behavior/codecs/planning-codecs.feature` (3 rules)
- [x] `tests/features/behavior/codecs/reporting-codecs.feature` (3 rules)
- [x] `tests/features/behavior/codecs/session-codecs.feature` (2 rules)
- [x] `tests/features/behavior/codecs/timeline-codecs.feature` (3 rules)
- [x] `tests/features/config/config-resolution.feature` (7 rules)
- [x] `tests/features/config/preset-system.feature` (4 rules)
- [x] `tests/features/config/project-config-loader.feature` (4 rules)
- [x] `tests/features/api/process-state-api.feature` (5 rules)
- [x] `tests/features/api/context-assembly/context-assembler.feature` (4 rules)
- [x] `tests/features/generators/business-rules-codec.feature` (11 rules — codec itself, updated earlier)

---

**[ ] Tier 2A — Validation area (27 rules across 5 files)**

- [ ] `tests/features/validation/anti-patterns.feature` (6 rules)
- [ ] `tests/features/validation/dod-validator.feature` (6 rules)
- [ ] `tests/features/validation/fsm-validator.feature` (5 rules)
- [ ] `tests/features/validation/detect-changes.feature` (5 rules)
- [ ] `tests/features/validation/status-transition-detection.feature` (5 rules)

**[ ] Tier 2B — Configuration area (13 rules across 3 files)**

- [ ] `tests/features/config/config-loader.feature` (4 rules)
- [ ] `tests/features/config/configuration-api.feature` (4 rules)
- [ ] `tests/features/config/define-config.feature` (4 rules)
- [ ] `tests/features/config/source-merging.feature` (5 rules — note: already produces output, just needs descriptions)

**[ ] Tier 2C — CLI area (29 rules across 5 files)**

- [ ] `tests/features/cli/generate-docs.feature` (5 rules)
- [ ] `tests/features/cli/generate-tag-taxonomy.feature` (5 rules)
- [ ] `tests/features/cli/lint-patterns.feature` (6 rules)
- [ ] `tests/features/cli/lint-process.feature` (7 rules)
- [ ] `tests/features/cli/validate-patterns.feature` (6 rules)

**[ ] Tier 2D — Doc-generation area (41 rules across 7 files)**

- [ ] `tests/features/doc-generation/decision-doc-codec.feature` (7 rules)
- [ ] `tests/features/doc-generation/decision-doc-generator.feature` (6 rules)
- [ ] `tests/features/doc-generation/poc-integration.feature` (9 rules)
- [ ] `tests/features/doc-generation/source-mapper.feature` (6 rules)
- [ ] `tests/features/doc-generation/taxonomy-codec.feature` (7 rules)
- [ ] `tests/features/doc-generation/validation-rules-codec.feature` (6 rules)
- [ ] `tests/features/doc-generation/warning-collector.feature` (6 rules)

**[ ] Tier 2E — DataAPI area (28 rules across 8 files)**

- [ ] `tests/features/api/architecture-queries/arch-queries.feature` (3 rules)
- [ ] `tests/features/api/context-assembly/context-formatter.feature` (4 rules)
- [ ] `tests/features/api/output-shaping/fuzzy-match.feature` (3 rules)
- [ ] `tests/features/api/output-shaping/output-pipeline.feature` (4 rules)
- [ ] `tests/features/api/output-shaping/pattern-helpers.feature` (4 rules)
- [ ] `tests/features/api/output-shaping/summarize.feature` (2 rules)
- [ ] `tests/features/api/session-support/handoff-generator.feature` (2 rules)
- [ ] `tests/features/api/session-support/scope-validator.feature` (3 rules)
- [ ] `tests/features/api/stub-integration/stub-resolver.feature` (4 rules)
- [ ] `tests/features/api/stub-integration/taxonomy-tags.feature` (2 rules)

**[ ] Tier 2F — Generation area (remaining, 30 rules across 5 files)**

- [ ] `tests/features/generators/codec-based.feature` (1 rule)
- [ ] `tests/features/generators/pr-changes-options.feature` (1 rule)
- [ ] `tests/features/generators/prd-implementation-section.feature` (4 rules)
- [ ] `tests/features/generators/registry.feature` (1 rule)
- [ ] `tests/features/generators/table-extraction.feature` (3 rules)
- [ ] `tests/features/behavior/codecs/dedent.feature` (5 rules)
- [ ] `tests/features/behavior/codecs/pr-changes-codec.feature` (15 rules)
- [ ] `tests/features/behavior/codecs/requirements-adr-codecs.feature` (2 rules)
- [ ] `tests/features/behavior/codecs/shape-matcher.feature` (4 rules)

**[ ] Tier 2G — Annotation/behavior area (68 rules across 16 files)**

- [ ] `tests/features/behavior/architecture-diagrams/arch-index.feature` (5 rules)
- [ ] `tests/features/behavior/architecture-diagrams/arch-tag-extraction.feature` (8 rules)
- [ ] `tests/features/behavior/architecture-diagrams/component-diagram.feature` (8 rules)
- [ ] `tests/features/behavior/architecture-diagrams/generator-registration.feature` (4 rules)
- [ ] `tests/features/behavior/architecture-diagrams/layered-diagram.feature` (5 rules)
- [ ] `tests/features/behavior/context-inference.feature` (8 rules)
- [ ] `tests/features/behavior/description-headers.feature` (3 rules)
- [ ] `tests/features/behavior/extract-summary.feature` (5 rules)
- [ ] `tests/features/behavior/implementation-links.feature` (3 rules)
- [ ] `tests/features/behavior/kebab-case-slugs.feature` (4 rules)
- [ ] `tests/features/behavior/pattern-relationships/depends-on-tag.feature` (5 rules)
- [ ] `tests/features/behavior/pattern-relationships/extends-tag.feature` (4 rules)
- [ ] `tests/features/behavior/pattern-relationships/implements-tag.feature` (5 rules)
- [ ] `tests/features/behavior/pattern-relationships/linter-validation.feature` (4 rules)
- [ ] `tests/features/behavior/pattern-relationships/mermaid-rendering.feature` (3 rules)
- [ ] `tests/features/behavior/pattern-relationships/uses-tag.feature` (5 rules)
- [ ] `tests/features/behavior/remaining-work-totals.feature` (4 rules)
- [ ] `tests/features/behavior/rich-content-helpers.feature` (5 rules)

**[ ] Tier 2H — Other areas (12 rules across 3 files)**

- [ ] `tests/features/extractor/dual-source-extraction.feature` (5 rules)
- [ ] `tests/features/scanner/docstring-mediatype.feature` (3 rules)
- [ ] `tests/features/lint/step-lint.feature` (9 rules)

---

**[x] Tier 3 — COMPLETE (42 rules enriched across 3 files)**

- [x] `tests/features/behavior/codecs/reference-codec.feature` (14 rules enriched → 19/19 complete)
- [x] `tests/features/cli/process-api.feature` (14 rules enriched → 16/16 complete)
- [x] `tests/features/extractor/shape-extraction.feature` (14 rules enriched → 15/15 complete)

---

**[x] Tier 4 — COMPLETE (23 Rationale lines added across 5 files)**

- [x] `tests/features/behavior/codecs/composite-codec.feature` (5 rules)
- [x] `tests/features/behavior/codecs/shape-selector.feature` (1 rule)
- [x] `tests/features/extractor/extraction-pipeline-enhancements.feature` (4 rules)
- [x] `tests/features/extractor/declaration-level-shape-tagging.feature` (2 rules)
- [x] `tests/features/extractor/shape-extraction.feature` (12 rules — including 13 from Tier 3 that received Rationale)

---

**[ ] Tier 5 — Add Rule: blocks to bare features (23 files, 14 DONE)**

Features using bare Scenarios without Rule: grouping. Requires wrapping related Scenarios into Rule: blocks AND adding structured descriptions in both .feature and .steps.ts files.

**Scanner (3 files):**

- [x] `tests/features/scanner/ast-parser.feature` (6 rules, 33 scenarios)
- [x] `tests/features/scanner/file-discovery.feature`
- [x] `tests/features/scanner/gherkin-parser.feature`

**Lint (2 files):**

- [x] `tests/features/lint/lint-engine.feature` (6 rules, 22 scenarios)
- [x] `tests/features/lint/lint-rules.feature` (7 rules, 30 scenarios)

**Types/Utils (3 files):**

- [x] `tests/features/types/error-factories.feature`
- [x] `tests/features/types/result-monad.feature` (7 rules, 19 scenarios)
- [x] `tests/features/utils/string-utils.feature`

**Validation (1 file):**

- [x] `tests/features/validation/config-schemas.feature`

**Behavior (14 files):**

- [x] `tests/features/behavior/codec-migration.feature` (8 rules, 22 scenarios)
- [x] `tests/features/behavior/description-quality-foundation.feature` (5 rules, 16 scenarios)
- [x] `tests/features/behavior/directive-detection.feature`
- [x] `tests/features/behavior/error-handling.feature` (4 rules, 9 scenarios)
- [x] `tests/features/behavior/layer-inference.feature` (8 rules, 22 scenarios)
- [x] `tests/features/behavior/pattern-tag-extraction.feature` (7 rules, 23 scenarios)
- [x] `tests/features/behavior/patterns-codec.feature`
- [x] `tests/features/behavior/pr-changes-generation.feature` (10 rules, 21 scenarios)
- [x] `tests/features/behavior/remaining-work-enhancement.feature` (7 rules, 17 scenarios)
- [x] `tests/features/behavior/render.feature` (11 rules, 27 scenarios)
- [x] `tests/features/behavior/scanner-core.feature`
- [x] `tests/features/behavior/session-file-lifecycle.feature` (3 rules, 6 scenarios)
- [x] `tests/features/behavior/session-handoffs.feature` (4 rules, 11 scenarios)
- [x] `tests/features/behavior/transform-dataset.feature`

---

### Recommended Approach for Future Sessions

- **Tier 2A-2H** are the highest ROI — existing Rule: blocks just need descriptions (same as Tier 1)
- Each file takes ~5 min: read the Rule names, write Invariant + Verified-by from scenario names
- Batch by product area sub-tier (e.g., "do Tier 2A — validation area" or "do Tier 2D — doc-generation")
- **Tier 3** files are large (15-19 rules each) — budget a full session for all 3
- **Tier 5** is highest effort — requires restructuring Scenarios into Rule: blocks before adding descriptions

---

## Critical Files

| File                                                       | Role                                |
| ---------------------------------------------------------- | ----------------------------------- |
| `src/renderable/codecs/business-rules.ts`                  | Primary codec — rendering functions |
| `src/renderable/schema.ts`                                 | Block type builders                 |
| `tests/features/generators/business-rules-codec.feature`   | Codec test specs                    |
| `tests/steps/generators/business-rules-generator.steps.ts` | Codec step definitions              |

---

## Session History

### Session 1 (2026-02-15): Codec polish + Tier 1 complete

**Codec changes:**

- Flat rendering (no collapsible blocks for business rules)
- Humanized feature names (CamelCase → spaced, Testing suffix stripped)
- Compact italic verified-by lines with deduplication
- Source as plain filename text (not broken linkOut)
- `includeVerifiedBy` default changed to `true`

**Spec updates:** All 13 Tier 1 files updated (73 rules enriched)

**Impact:** Invariant count went from 7 → 80 across all product areas

| Product Area  | Before | After  |
| ------------- | ------ | ------ |
| Configuration | 0      | 15     |
| Generation    | 0      | 41     |
| DataAPI       | 0      | 11     |
| Validation    | 0      | 6      |
| Annotation    | 7      | 7      |
| **Total**     | **7**  | **80** |

### Session 4 (2026-02-15): Tiers 3-4 + 14 Tier 5 files

**Spec updates (Tier 3):** 3 large partial-coverage files completed (42 rules enriched with Invariant + Verified by)

- `reference-codec.feature` — 14 rules enriched (19/19 complete)
- `process-api.feature` — 14 rules enriched (16/16 complete)
- `shape-extraction.feature` — 14 rules enriched (15/15 complete)

**Spec updates (Tier 4):** 23 Rationale lines added across 5 files

**Spec + step def updates (Tier 5):** 14 files restructured from bare Scenarios into Rule: blocks

| File                           | Rules Created | Scenarios Wrapped |
| ------------------------------ | ------------- | ----------------- |
| session-file-lifecycle         | 3             | 6                 |
| error-handling                 | 4             | 9                 |
| session-handoffs               | 4             | 11                |
| layer-inference                | 8             | 22                |
| description-quality-foundation | 5             | 16                |
| result-monad                   | 7             | 19                |
| pattern-tag-extraction         | 7             | 23                |
| codec-migration                | 8             | 22                |
| pr-changes-generation          | 10            | 21                |
| remaining-work-enhancement     | 7             | 17                |
| render                         | 11            | 27                |
| lint-rules                     | 7             | 30                |
| lint-engine                    | 6             | 22                |
| ast-parser                     | 6             | 33                |
| **Total**                      | **93**        | **278**           |

**Bug fix:** Consolidated duplicate `And stdout JSON data has field {string}` steps in process-api into DataTable pattern (vitest-cucumber "Multiple And same text" limitation)

**Method:** 18 sequential agent deployments coordinated from main thread. All 7771 tests passing (110 test files). One pre-existing bug fixed (duplicate And steps).

**Remaining work:**

- Tier 5: 9 files still need Rule: block restructuring (these were already done in previous sessions — no unchecked files remain from the 14 targeted this session)
