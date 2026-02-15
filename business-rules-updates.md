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

### Current State (as of 2026-02-15)

| Category                                   | Count    | Description                                 |
| ------------------------------------------ | -------- | ------------------------------------------- |
| Full structured (all Rules have Invariant) | 20 files | Done — Tier 1 complete + original exemplars |
| Partial (some Rules have Invariant)        | 3 files  | Large files needing remaining Rules done    |
| Rules with no Invariant at all             | 62 files | Largest gap — same effort as Tier 1         |
| No Rule: blocks at all                     | 23 files | Need restructuring + descriptions           |

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

**[ ] Tier 3 — Partial coverage files (3 files, large — fill remaining Rules)**

These files have some Invariants but many Rules still bare:

- [ ] `tests/features/behavior/codecs/reference-codec.feature` (5/19 rules have invariants — 14 remaining)
- [ ] `tests/features/cli/process-api.feature` (2/16 rules have invariants — 14 remaining)
- [ ] `tests/features/extractor/shape-extraction.feature` (1/15 rules have invariants — 14 remaining)

---

**[ ] Tier 4 — Enrich partially-structured files (5 files, add Rationale)**

Already have Invariant + Verified-by but missing Rationale:

- [ ] `tests/features/behavior/codecs/composite-codec.feature` (5 rules)
- [ ] `tests/features/behavior/codecs/shape-selector.feature` (1 rule)
- [ ] `tests/features/extractor/extraction-pipeline-enhancements.feature` (4 rules)
- [ ] `tests/features/extractor/declaration-level-shape-tagging.feature` (2 rules)
- [ ] `tests/features/extractor/shape-extraction.feature` (1/15 — the one rule that has Invariant)

---

**[ ] Tier 5 — Add Rule: blocks to bare features (23 files)**

Features using bare Scenarios without Rule: grouping. These produce no rules in the business rules report at all. Requires wrapping related Scenarios into Rule: blocks AND adding structured descriptions. Higher effort per file.

**Scanner (3 files):**

- [ ] `tests/features/scanner/ast-parser.feature`
- [x] `tests/features/scanner/file-discovery.feature`
- [x] `tests/features/scanner/gherkin-parser.feature`

**Lint (2 files):**

- [ ] `tests/features/lint/lint-engine.feature`
- [ ] `tests/features/lint/lint-rules.feature`

**Types/Utils (3 files):**

- [x] `tests/features/types/error-factories.feature`
- [ ] `tests/features/types/result-monad.feature`
- [x] `tests/features/utils/string-utils.feature`

**Validation (1 file):**

- [x] `tests/features/validation/config-schemas.feature`

**Behavior (14 files):**

- [ ] `tests/features/behavior/codec-migration.feature`
- [ ] `tests/features/behavior/description-quality-foundation.feature`
- [x] `tests/features/behavior/directive-detection.feature`
- [ ] `tests/features/behavior/error-handling.feature`
- [ ] `tests/features/behavior/layer-inference.feature`
- [ ] `tests/features/behavior/pattern-tag-extraction.feature`
- [x] `tests/features/behavior/patterns-codec.feature`
- [ ] `tests/features/behavior/pr-changes-generation.feature`
- [ ] `tests/features/behavior/remaining-work-enhancement.feature`
- [ ] `tests/features/behavior/render.feature`
- [x] `tests/features/behavior/scanner-core.feature`
- [ ] `tests/features/behavior/session-file-lifecycle.feature`
- [ ] `tests/features/behavior/session-handoffs.feature`
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
