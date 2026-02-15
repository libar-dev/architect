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

---

## Spec Consistency Audit (Prioritized List)

### Current State

| Category                                              | Count     | Description             |
| ----------------------------------------------------- | --------- | ----------------------- |
| Full structured (Invariant + Rationale + Verified-by) | 6 files   | Best-practice exemplars |
| Partial (Invariant + Verified-by, missing Rationale)  | 5 files   | Close to ideal          |
| Rule: blocks, no structured descriptions              | 76 files  | Largest gap             |
| No Rule: blocks at all                                | ~22 files | Need restructuring      |

### Priority Tiers for Future Updates

**[x] Tier 1 — High-value, improve generated output immediately (13 files)**

These features have many rules but no structured descriptions. Adding Invariant/Verified-by would have the biggest impact on business rules report quality.

- [x] `tests/features/validation/process-guard.feature` (6 rules, 0 invariants — validation area)
- [x] `tests/features/behavior/codecs/reference-generators.feature` (generation area)
- [x] `tests/features/generators/business-rules-codec.feature` (generation area)
- [x] `tests/features/generators/orchestrator.feature` (generation area)
- [x] `tests/features/behavior/codecs/planning-codecs.feature` (generation area)
- [x] `tests/features/behavior/codecs/reporting-codecs.feature` (generation area)
- [x] `tests/features/behavior/codecs/session-codecs.feature` (generation area)
- [x] `tests/features/behavior/codecs/timeline-codecs.feature` (generation area)
- [x] `tests/features/config/config-resolution.feature` (configuration area)
- [x] `tests/features/config/preset-system.feature` (configuration area)
- [x] `tests/features/config/project-config-loader.feature` (configuration area)
- [x] `tests/features/api/process-state-api.feature` (DataAPI area)
- [x] `tests/features/api/context-assembly/context-assembler.feature` (DataAPI area)

**[ ] Tier 2 — Add Rule: blocks to bare features (22 files)**

Features using bare Scenarios without Rule: grouping. These produce no rules in the business rules report at all.

- [ ] `tests/features/scanner/ast-parser.feature`
- [ ] `tests/features/scanner/file-discovery.feature`
- [ ] `tests/features/scanner/gherkin-parser.feature`
- [ ] `tests/features/behavior/pattern-tag-extraction.feature`
- [ ] `tests/features/behavior/scanner-core.feature`
- [ ] `tests/features/behavior/directive-detection.feature`
- [ ] `tests/features/behavior/patterns-codec.feature`
- [ ] `tests/features/behavior/render.feature`
- [ ] `tests/features/behavior/transform-dataset.feature`
- [ ] `tests/features/types/error-factories.feature`
- [ ] `tests/features/types/result-monad.feature`
- [ ] `tests/features/utils/string-utils.feature`
- [ ] `tests/features/validation/config-schemas.feature`
- [ ] `tests/features/lint/lint-engine.feature`
- [ ] `tests/features/lint/lint-rules.feature`
- Plus ~7 more behavior/ files

**[ ] Tier 3 — Enrich partially-structured files (5 files)**

Already have Invariant + Verified-by but missing Rationale:

- [ ] `tests/features/behavior/codecs/composite-codec.feature`
- [ ] `tests/features/behavior/codecs/shape-selector.feature`
- [ ] `tests/features/extractor/extraction-pipeline-enhancements.feature`
- [ ] `tests/features/extractor/declaration-level-shape-tagging.feature`
- [ ] `tests/features/extractor/shape-extraction.feature`

### Recommended Approach for Future Sessions

- Process Tier 1 files first (highest ROI — existing Rule: blocks just need descriptions)
- Each file takes ~5 min: read the Rule names, write Invariant + Verified-by from scenario names
- Rationale is optional — many rules don't need a "why" beyond the invariant
- Batch by product area for focused sessions (e.g., "add structured descriptions to all Generation specs")

---

## Critical Files

| File                                                       | Role                                                              |
| ---------------------------------------------------------- | ----------------------------------------------------------------- |
| `src/renderable/codecs/business-rules.ts`                  | Primary codec — modify rendering functions                        |
| `src/renderable/codecs/reference.ts:824-894`               | Reference pattern for collapsible + verified-by                   |
| `src/renderable/schema.ts`                                 | Block type builders (`collapsible`, `list`)                       |
| `tests/features/generators/business-rules-codec.feature`   | Add new test Rules                                                |
| `tests/steps/generators/business-rules-generator.steps.ts` | Add new step definitions                                          |
| `tests/support/helpers/document-assertions.ts`             | Existing helpers: `findCollapsibles`, `findLinkOuts`, `findLists` |

---

### Session 1 Report

`★ Insight ─────────────────────────────────────`
**Before vs After — Configuration area:**

- Header stat changed from "0 rules have explicit invariants" → **"11 rules have explicit invariants"** (Config Resolution 7 + Preset System 4)
- Config Resolution section: previously just rule titles + bare verified-by → now each rule has **Invariant** + **Rationale** + verified-by, making the business constraints self-documenting
- Config Loader, Configuration API, Define Config, Project Config Loader, Source Merging: still show the old format (just titles + verified-by) — these are the remaining Tier 1 updates

**Before vs After — Validation area:**

- Header stat changed from "0 rules have explicit invariants" → **"6 rules have explicit invariants"** (all 6 Process Guard rules)
- Process Guard section is now the richest in the validation area — every rule clearly states its constraint and justification
- The contrast with Anti Pattern Detector and FSM Validator (still bare format) makes the improvement visually obvious
  `─────────────────────────────────────────────────`

### Summary of what we've established as templates

| File                        | Area          | Rules Updated | Purpose as Exemplar                                                              |
| --------------------------- | ------------- | ------------- | -------------------------------------------------------------------------------- |
| `config-resolution.feature` | Configuration | 7 rules       | Simple, focused rules with clear defaults-oriented invariants                    |
| `process-guard.feature`     | Validation    | 6 rules       | Complex rules with FSM/security-oriented invariants and longer verified-by lists |
| `preset-system.feature`     | Configuration | 4 rules       | Medium complexity with taxonomy-oriented invariants                              |
