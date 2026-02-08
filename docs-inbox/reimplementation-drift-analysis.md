# Reimplementation Drift: Root Cause Analysis and Inventory

> **Status:** All categories fixed. P0 in commit `3fb1fac`, P1-P3 in commits `8542680`–`1096cae` (2026-02-08).

## The Root Issue

When a codebase has canonical helpers for a concept (status matching, name resolution, tag parsing), new code sometimes reimplements the same logic inline instead of calling the canonical function. The reimplementation "looks right" but subtly diverges — matching fewer patterns, using different case sensitivity, or skipping normalization.

This creates **silent correctness bugs** that are hard to detect because:

1. Both implementations individually appear correct
2. Tests pass because they use the same narrow inputs
3. The divergence only surfaces with edge-case inputs (emoji statuses, unusual casing, legacy aliases)

### Why AI-Authored Code Amplifies This

AI agents implement from the immediate context (function signature, variable types) rather than searching for existing helpers. When a stub says `filter deliverables by status`, the AI writes a filter — it does not first search `src/validation/types.ts` for `isStatusComplete()`. Three specific failure modes:

| Failure Mode                  | Example                                                                       | Root Cause                                    |
| ----------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------- |
| **Dual-implementation drift** | `isDeliverableComplete` in both `dod-validator.ts` and `context-formatter.ts` | AI implements a helper it doesn't know exists |
| **Typo propagation**          | `checkDeliverablesDefinied` from stub through implementation and tests        | AI treats stubs as approved API surface       |
| **Partial DD implementation** | `--strict` flag described in DD-4 but omitted in first implementation pass    | Design decisions buried in prose get missed   |

### Mitigations Already Applied (2026-02-08)

- `isStatusComplete()` and `isStatusPending()` added to `src/validation/types.ts` as canonical helpers
- `isDeliverableComplete()` in `dod-validator.ts` now delegates to `isStatusComplete()`
- Duplicate `isDeliverableComplete()` removed from `context-formatter.ts`
- `VALID_STATUSES` sets derived from `PROCESS_STATUS_VALUES` instead of hardcoded
- CLAUDE.md updated with "Canonical Status Helpers" section and DD verification checklist

---

## Drift Inventory

### Category 1: Deliverable Status Emoji Rendering (5 sites, REAL BUGS) — FIXED in `3fb1fac`

These codec files check `d.status === 'complete'` with exact string matching, bypassing `isStatusComplete()` which supports 12 patterns (including `Done`, `Completed`, `finished`, `yes`, `✓`, `✔`, `✅`, `☑`).

**Impact:** A deliverable with status `"Done"` or `"Completed"` renders with the wrong emoji — `📋` (not started) instead of `✅` (done).

| File                                  | Line | Code                                                                        | Should Use                                |
| ------------------------------------- | ---- | --------------------------------------------------------------------------- | ----------------------------------------- |
| `src/renderable/codecs/planning.ts`   | 352  | `d.status === 'complete' ? '✅' : '- [ ]'`                                  | `isStatusComplete(d.status)`              |
| `src/renderable/codecs/planning.ts`   | 470  | `d.status === 'complete' ? '✅' : d.status === 'in-progress' ? '🚧' : '📋'` | `isStatusComplete` + `isStatusInProgress` |
| `src/renderable/codecs/timeline.ts`   | 1088 | Same ternary pattern                                                        | Same fix                                  |
| `src/renderable/codecs/timeline.ts`   | 1273 | Same ternary pattern                                                        | Same fix                                  |
| `src/renderable/codecs/pr-changes.ts` | 489  | Same ternary pattern                                                        | Same fix                                  |

**Recommended fix:** Create `getDeliverableStatusEmoji(status: string): string` in `src/validation/types.ts` using `isStatusComplete()` and a new `isStatusInProgress()` helper. All 5 sites delegate to it.

---

### Category 2: Inline `getPatternName()` (~40 sites, DRY violations) — FIXED in `c178a82`

The canonical `getPatternName(p)` in `src/api/pattern-helpers.ts` returns `p.patternName ?? p.name`. Approximately 40 call sites across 12 files reimplement this inline instead of importing the helper.

**Impact:** If `getPatternName()` ever adds normalization (trim, alias resolution), these 40 sites silently diverge.

| File                                           | Inline Sites | Risk                   |
| ---------------------------------------------- | ------------ | ---------------------- |
| `src/generators/pipeline/transform-dataset.ts` | 5            | High — core pipeline   |
| `src/cli/validate-patterns.ts`                 | 11           | High — validation CLI  |
| `src/renderable/codecs/architecture.ts`        | 10           | Medium — display layer |
| `src/renderable/codecs/requirements.ts`        | 4            | Medium                 |
| `src/renderable/codecs/planning.ts`            | 2            | Medium                 |
| `src/renderable/codecs/patterns.ts`            | 2            | Low                    |
| `src/generators/orchestrator.ts`               | 2            | Low                    |
| `src/api/summarize.ts`                         | 1            | Low                    |
| `src/cli/output-pipeline.ts`                   | 1            | Low                    |
| `src/extractor/gherkin-extractor.ts`           | 2            | Low                    |
| `src/extractor/dual-source-extractor.ts`       | 1            | Low                    |

**Related divergence:** `getDisplayName()` in `src/renderable/utils.ts` adds title priority and CamelCase conversion — intentionally different for display. The risk is someone using `getDisplayName()` for matching or `getPatternName()` for display.

---

### Category 3: Hardcoded FSM Pattern Status Comparisons (10 sites, DRY violations) — FIXED in `8542680`

These compare `pattern.status` directly against raw FSM values (`'completed'`, `'active'`, `'roadmap'`) instead of using canonical helpers or `normalizeStatus()`.

**Acceptable (post-normalization):** Sites that call `normalizeStatus()` first, then compare:

- `src/validation/dod-validator.ts:170` — `normalizeStatus` then `=== 'completed'`
- `src/cli/validate-patterns.ts:453` — same
- `src/generators/pipeline/transform-dataset.ts:680` — same

**Should fix (direct raw comparison):**

| File                                | Line(s)       | Pattern                                             | Should Use                                                                          |
| ----------------------------------- | ------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `src/api/process-state.ts`          | 547-549       | `p.status === 'completed'`, `p.status === 'active'` | `normalizeStatus()` first                                                           |
| `src/api/context-assembler.ts`      | 602, 674, 681 | `depPattern.status === 'completed'`                 | `normalizeStatus()` or FSM helper                                                   |
| `src/api/handoff-generator.ts`      | 149           | `depPattern.status !== 'completed'`                 | Same file uses `isStatusComplete` for deliverables but hardcodes for pattern status |
| `src/api/scope-validator.ts`        | 192           | `status !== 'completed'`                            | Inconsistent with `VALID_STATUSES` set in same file                                 |
| `src/lint/process-guard/decider.ts` | 186           | `to === 'completed'`                                | `isTerminalState()` from FSM module                                                 |

---

### Category 4: `DEFAULT_STATUS` Not Used (3 sites, DRY violations) — FIXED in `1096cae`

The canonical `DEFAULT_STATUS = 'roadmap'` lives in `src/taxonomy/status-values.ts`. Three files hardcode `'roadmap'` as the default instead.

| File                                       | Line(s)  | Code                     |
| ------------------------------------------ | -------- | ------------------------ |
| `src/lint/process-guard/derive-state.ts`   | 190      | `return 'roadmap'`       |
| `src/lint/process-guard/detect-changes.ts` | 474, 479 | `fromStatus = 'roadmap'` |
| `src/extractor/dual-source-extractor.ts`   | 112      | `?? 'roadmap'`           |

---

### Category 5: `DEFAULT_TAG_PREFIX` Hardcoded (3 sites, DRY violations) — FIXED in `1096cae`

The canonical `DEFAULT_TAG_PREFIX = '@libar-docs-'` is exported from `src/config/defaults.ts`. Three FSM/lint modules define their own copy:

| File                                | Line |
| ----------------------------------- | ---- |
| `src/validation/fsm/transitions.ts` | 39   |
| `src/validation/fsm/validator.ts`   | 38   |
| `src/lint/process-guard/decider.ts` | 57   |

---

### Category 6: Deliverable Extraction Reimplemented in Process Guard (1 site, MEDIUM-HIGH risk) — FIXED in `8542680`

`src/lint/process-guard/derive-state.ts:197-221` reimplements deliverable extraction differently from the canonical `extractDeliverables()` in `src/extractor/dual-source-extractor.ts`.

| Aspect                       | Canonical                                                              | Reimplementation                                                         |
| ---------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Column lookup                | Case-insensitive via `headers.findIndex(h => h.toLowerCase() === ...)` | Case-sensitive with fallback: `row['Deliverable'] ?? row['deliverable']` |
| Return type                  | `readonly Deliverable[]` (full objects)                                | `readonly string[]` (names only)                                         |
| Schema validation            | `DeliverableSchema.safeParse()`                                        | None                                                                     |
| Handles `DELIVERABLE` header | Yes                                                                    | No                                                                       |

**Impact:** A Background table with header `DELIVERABLE` (all caps) or `deliverables` (plural) would be parsed by the canonical extractor but silently return empty from the process guard.

---

### Category 7: Two `extractFirstSentence` Functions (MEDIUM risk) — FIXED in `8d13587`

Two functions with the same name exist in different files with different behavior:

| Aspect                   | `src/utils/string-utils.ts:272` | `src/renderable/utils.ts:188` |
| ------------------------ | ------------------------------- | ----------------------------- |
| Strips markdown headers? | No                              | Yes                           |
| maxLength parameter?     | No (unbounded)                  | Yes (default 120)             |
| Used by                  | API context assembler           | All renderable codecs         |

Additionally, `src/renderable/codecs/helpers.ts:654` re-exports the `string-utils.ts` version into the codec layer, where `business-rules.ts` imports it — using the non-stripping version while all sibling codecs use the stripping version from `renderable/utils.ts`.

---

### Category 8: Legacy Status Values in Lint Error Messages (LOW risk) — FIXED in `1096cae`

`src/lint/rules.ts:177-183` hardcodes legacy status aliases (`implemented`, `partial`, `in-progress`, `planned`) alongside `PROCESS_STATUS_VALUES`. These should be derived from `STATUS_NORMALIZATION_MAP` keys in `src/taxonomy/normalized-status.ts`. The validation behavior is correct — only the error message would be incomplete if new aliases are added.

---

## Priority Summary

| Priority | Category                                   | Sites | Risk            | Fix Complexity                                             |
| -------- | ------------------------------------------ | ----- | --------------- | ---------------------------------------------------------- |
| **P0**   | 1. Deliverable status emoji                | 5     | FIXED `3fb1fac` | `getDeliverableStatusEmoji()` helper                       |
| **P1**   | 6. Deliverable extraction in process guard | 1     | FIXED `8542680` | Reuse canonical `extractDeliverables()`                    |
| **P1**   | 3. Raw FSM status comparisons              | 7     | FIXED `8542680` | `normalizeStatus()` + `isTerminalState()`                  |
| **P2**   | 2. Inline getPatternName                   | 43    | FIXED `c178a82` | 13 files, also `firstImplements()` + `findPatternByName()` |
| **P2**   | 7. Dual extractFirstSentence               | 2     | FIXED `8d13587` | Renamed to `extractFirstSentenceRaw`                       |
| **P3**   | 4. DEFAULT_STATUS hardcoded                | 4     | FIXED `1096cae` | Import from `taxonomy/status-values`                       |
| **P3**   | 5. DEFAULT_TAG_PREFIX hardcoded            | 3     | FIXED `1096cae` | Import from `config/defaults`                              |
| **P3**   | 8. Legacy status in lint messages          | 1     | FIXED `1096cae` | Derive from `STATUS_NORMALIZATION_MAP` keys                |

---

## Fix Strategy

### Immediate (P0): Deliverable Status Emoji

Add to `src/validation/types.ts`:

```typescript
export function isStatusInProgress(status: string): boolean { ... }

export function getDeliverableStatusEmoji(status: string): string {
  if (isStatusComplete(status)) return '✅';
  if (isStatusInProgress(status)) return '🚧';
  if (isStatusPending(status)) return '📋';
  return '📋';
}
```

Update all 5 codec sites to call `getDeliverableStatusEmoji(d.status)`.

### Incremental (P1-P3): Import Swaps

Each remaining category is an independent import-swap refactor. They can be done one at a time as part of regular development — no urgency since the current behavior is correct (just fragile).

The `getPatternName` cleanup (P2, ~40 sites) is the largest effort but also the highest leverage — it makes the codebase resilient to any future pattern name resolution changes.

---

## Prevention Checklist

These are now documented in CLAUDE.md and SESSION-GUIDES.md:

- [ ] Before implementing status matching: search `src/validation/types.ts` for existing helpers
- [ ] Before implementing pattern name resolution: import `getPatternName` from `src/api/pattern-helpers.ts`
- [ ] Before implementing tag parsing: check if `src/scanner/ast-parser.ts` or tag registry covers it
- [ ] Design stubs list canonical helpers in `@libar-docs-uses`
- [ ] Verify stub identifier spelling before committing
- [ ] After implementing: run `decisions <pattern>` and verify each DD-N has a `// DD-N:` comment
