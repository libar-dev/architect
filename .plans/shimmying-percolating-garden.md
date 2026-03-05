# Phase 38: GeneratedDocQuality — Implementation Plan

## Context

Four quality issues reduce usefulness of generated docs: (1) REFERENCE-SAMPLE.md duplicates convention tables in the behavior-specs section (~500 lines wasted), (2) Generation product area compact is 1.4 KB for a 233 KB area, (3) ARCHITECTURE-TYPES.md buries type definitions after convention prose, (4) large product area docs have no navigation TOC. This plan implements all 4 deliverables from the spec.

---

## Execution Sequence

### Step 0: FSM Transition (roadmap → active)

**File:** `delivery-process/specs/generated-doc-quality.feature:3`

- Change `@libar-docs-status:roadmap` → `@libar-docs-status:active`

---

### Step 1: Fix behavior-specs duplicate tables (Deliverable 1)

**File:** `src/renderable/codecs/reference.ts` lines 1032-1037

**Root cause:** `buildBehaviorSectionsFromPatterns()` calls `extractTablesFromDescription(rule.description)` and renders tables at lines 1032-1037. But `buildConventionSections()` already renders the same tables at lines 948-951. For include-tagged patterns (like REFERENCE-SAMPLE), the same pattern appears in both sections.

**Confirmed safe:** `parseBusinessRuleAnnotations()` already calls `stripMarkdownTables(remaining)` at `helpers.ts:832`, so `annotations.remainingContent` is already clean of table content.

**Fix:** Delete lines 1032-1037 (the 6 lines: `extractTablesFromDescription` call + table rendering loop). No replacement needed.

```diff
-          // Extract and render tables from Rule descriptions (Gherkin or markdown)
-          const ruleTables = extractTablesFromDescription(rule.description);
-          for (const tbl of ruleTables) {
-            const rows = tbl.rows.map((row) => tbl.headers.map((h) => row[h] ?? ''));
-            ruleBlocks.push(table([...tbl.headers], rows));
-          }
```

Also clean up the unused `extractTablesFromDescription` import if it becomes unused (check other call sites first).

---

### Step 2: Reorder ARCHITECTURE-TYPES.md — shapes first (Deliverable 3)

**Why before D2:** This is more structural and affects the decode path.

#### 2a: Add `shapesFirst` to `ReferenceDocConfig` interface

**File:** `src/renderable/codecs/reference.ts:252` (after `preamble`)

```typescript
/** When true, shapes section renders before conventions (default: false) */
readonly shapesFirst?: boolean;
```

#### 2b: Add `shapesFirst` to Zod schema

**File:** `src/config/project-config-schema.ts:172` (before closing `})`)

```typescript
shapesFirst: z.boolean().optional(),
```

Note: Schema is `.strict()` — field MUST be in schema for config validation to pass.

#### 2c: Set in config

**File:** `delivery-process.config.ts:49` (add to ARCHITECTURE-TYPES config block)

```typescript
shapesFirst: true,
```

#### 2d: Modify standard decode path

**File:** `src/renderable/codecs/reference.ts` lines 589-688

Refactor to build each layer into separate arrays, then assemble in order:

```typescript
// Build each layer independently
const conventionSections =
  conventions.length > 0 ? buildConventionSections(conventions, opts.detailLevel) : [];

const diagramSections: SectionBlock[] = [];
// ... existing diagram logic (lines 613-624) building into diagramSections ...

const shapeSections: SectionBlock[] = [];
// ... existing shape logic (lines 626-666) building into shapeSections ...

const behaviorSections: SectionBlock[] = [];
// ... existing behavior logic (lines 668-688) building into behaviorSections ...

// Assemble in configured order
if (config.shapesFirst === true) {
  sections.push(...shapeSections, ...conventionSections, ...diagramSections, ...behaviorSections);
} else {
  sections.push(...conventionSections, ...diagramSections, ...shapeSections, ...behaviorSections);
}
```

The DD-1 include logic is unaffected — all layers are still COMPUTED in the same order (conventions first, then behaviors), only the final ASSEMBLY order changes.

---

### Step 3: Add TOC to product area doc headers (Deliverable 4)

**File:** `src/renderable/codecs/reference.ts` — new helper + insertion in `decodeProductArea()`

#### 3a: Create `buildTableOfContents()` helper

After `buildBusinessRulesCompactSection()` (~line 1154), add. Note: import `HeadingBlock` type from `../schema.js` (already imported file, just add the type to existing import).

```typescript
function buildTableOfContents(sections: readonly SectionBlock[]): SectionBlock[] {
  const h2Headings = sections.filter(
    (s): s is HeadingBlock => s.type === 'heading' && s.level === 2
  );
  if (h2Headings.length < 3) return [];

  const tocItems = h2Headings.map((h) => {
    const anchor = h.text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `[${h.text}](#${anchor})`;
  });

  return [heading(2, 'Contents'), list(tocItems), separator()];
}
```

#### 3b: Insert TOC after intro in `decodeProductArea()`

After building all sections (before the empty-check at line 901), insert the TOC after the intro/key-invariants separator:

```typescript
// Insert TOC after intro section
const tocBlocks = buildTableOfContents(sections);
if (tocBlocks.length > 0) {
  // Find insertion point: after the first separator (end of intro/key-invariants)
  const firstSepIdx = sections.findIndex((s) => s.type === 'separator');
  if (firstSepIdx >= 0) {
    sections.splice(firstSepIdx + 1, 0, ...tocBlocks);
  }
}
```

---

### Step 4: Enrich Generation compact (Deliverable 2)

**File:** `src/renderable/codecs/reference.ts` lines 379-399 (`PRODUCT_AREA_META.Generation`)

Expand the `Generation` entry:

- **`intro`**: Expand from ~300 chars to ~2000+ chars covering: four pipeline stages in detail, codec inventory (reference, planning, session, reporting, timeline, traceability, requirements-adr, composite, business-rules, taxonomy), progressive disclosure (detailed/standard/summary), RenderableDocument IR, generator orchestration
- **`covers`**: Expand to `'Codecs, generators, orchestrator, rendering, diagrams, progressive disclosure, product areas, RenderableDocument IR'`
- **`keyInvariants`**: Add 2-3 more (single read model, progressive disclosure, composition order)
- **`keyPatterns`**: Add `CompositeCodec`, `RenderableDocument`, `ProductAreaOverview`

Target: compact file >= 5 KB (currently 1.4 KB, ~3.5x increase needed from meta enrichment).

---

### Step 5: Create tests

#### 5a: Feature file

**File:** `tests/features/behavior/codecs/generated-doc-quality.feature`

Structure: 4 Rules matching the spec's 4 Rules, with scenarios from the spec file. Use `@behavior @reference-codec` tags. Background: `Given a reference codec test context`.

#### 5b: Step definitions

**File:** `tests/steps/behavior/codecs/generated-doc-quality.steps.ts`

Reuse existing helpers from `tests/support/helpers/reference-codec-state.ts` (`initState`, `createTestPattern`, `createTestMasterDataset`, `findTables`, `findHeadings`, `findParagraphs`, etc.).

Key test scenarios:

1. Convention table appears once — create pattern with convention tag + rule with table, decode, count table instances = 1
2. REFERENCE-SAMPLE no duplicates — use actual REFERENCE-SAMPLE config, assert total tables match expected count
3. Generation compact >= 4 KB — decode Generation product area at summary level, render, check byte length
4. Types before conventions — config with `shapesFirst: true`, decode, verify first heading section contains type content
5. TOC generated — product area with 3+ H2 headings has Contents section with anchor links

---

### Step 6: Update deliverable statuses + FSM completion

**File:** `delivery-process/specs/generated-doc-quality.feature`

- Update all 4 deliverable statuses: `pending` → `complete`
- Change `@libar-docs-status:active` → `@libar-docs-status:completed`

---

### Step 7: Regenerate docs + update tracker

```bash
pnpm build && pnpm docs:all && pnpm test
```

Update `.plans/docs-consolidation-tracker.md` with Phase 38 session report.

Commit all changes.

---

## Critical Files

| File                                                           | Changes                                                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/renderable/codecs/reference.ts`                           | D1: remove lines 1032-1037; D2: enrich PRODUCT_AREA_META.Generation; D3: add `shapesFirst` to interface + decode logic; D4: add TOC builder |
| `src/config/project-config-schema.ts:172`                      | Add `shapesFirst: z.boolean().optional()`                                                                                                   |
| `delivery-process.config.ts:49`                                | Add `shapesFirst: true` to ARCHITECTURE-TYPES                                                                                               |
| `delivery-process/specs/generated-doc-quality.feature`         | FSM transitions + deliverable statuses                                                                                                      |
| `tests/features/behavior/codecs/generated-doc-quality.feature` | New test feature file                                                                                                                       |
| `tests/steps/behavior/codecs/generated-doc-quality.steps.ts`   | New step definitions                                                                                                                        |

## Reusable Utilities

| Utility                                              | Location                                         | Used For                                 |
| ---------------------------------------------------- | ------------------------------------------------ | ---------------------------------------- |
| `stripMarkdownTables()`                              | `src/renderable/codecs/helpers.ts:857`           | Already handles remainingContent cleanup |
| `parseBusinessRuleAnnotations()`                     | `src/renderable/codecs/helpers.ts:685`           | Already used in behavior-specs           |
| `heading()`, `paragraph()`, `list()`, `separator()`  | `src/renderable/schema.ts`                       | TOC builder                              |
| `initState()`, `createTestPattern()`, `findTables()` | `tests/support/helpers/reference-codec-state.ts` | Tests                                    |

## Verification

1. `pnpm build` — TypeScript compiles with new `shapesFirst` field
2. `pnpm test` — All existing + new tests pass
3. `pnpm docs:all` — Regenerate all docs
4. Verify `docs-live/reference/REFERENCE-SAMPLE.md` has no duplicate tables (line count under 966)
5. Verify `docs-live/reference/ARCHITECTURE-TYPES.md` first H2 is a type definition section
6. Verify `docs-live/_claude-md/generation/generation-overview.md` is >= 4 KB
7. Verify product area docs have `## Contents` section with anchor links
