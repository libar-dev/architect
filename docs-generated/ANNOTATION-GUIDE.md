# Documentation Annotation Guide

**Purpose:** This guide documents the approach for fixing auto-generated documentation by adding `@libar-docs-extract-shapes` annotations to TypeScript files. Use this guide when deploying agents to fix similar issues.

## Final Statistics

| Metric | Before | After |
|--------|--------|-------|
| Files with `@extract-shapes` | 18 | **35** |
| Total generated doc lines | ~3,000 | **7,397** |
| Docs with TypeScript extraction | 3 | **7** |

**Documents Now Auto-Generated:**
- ARCHITECTURE-REFERENCE.md (714 lines) - TypeScript schemas extracted
- CONFIGURATION-REFERENCE.md (731 lines) - Preset/factory types extracted
- INSTRUCTIONS-REFERENCE.md (974 lines) - All 5 CLI configs extracted
- VALIDATION-REFERENCE.md (912 lines) - All validation types extracted
- TAXONOMY-REFERENCE.md (622 lines) - All taxonomy types extracted
- PROCESS-GUARD-REFERENCE.md (438 lines) - Decider types extracted
- DOC-GENERATION-PROOF-OF-CONCEPT.md (710 lines) - Pattern demonstration

**Documents Remaining Manual (Conceptual Content):**
- METHODOLOGY-REFERENCE.md (372 lines)
- SESSION-GUIDES-REFERENCE.md (543 lines)
- GHERKIN-PATTERNS-REFERENCE.md (550 lines)
- PUBLISHING-REFERENCE.md (396 lines)
- INDEX-REFERENCE.md (289 lines)

---

## Fix Patterns Discovered (Exemplar Work)

These patterns were discovered while perfecting the `ARCHITECTURE-REFERENCE.md` exemplar.

### Pattern 1: Zod Schema Extraction

**Problem:** Extracting type aliases like `MasterDataset` shows unhelpful output:
```typescript
export type MasterDataset = z.infer<typeof MasterDatasetSchema>;
```

**Solution:** Extract the schema constant (with `Schema` suffix) instead:

| Wrong (Type Alias) | Correct (Schema Const) |
|--------------------|------------------------|
| `MasterDataset` | `MasterDatasetSchema` |
| `StatusGroups` | `StatusGroupsSchema` |
| `PhaseGroup` | `PhaseGroupSchema` |

**Why it works:** Schema constants contain the actual `z.object({...})` definition with all fields visible. Type aliases are just inferred wrappers.

**Example annotation:**
```typescript
// WRONG - shows z.infer<> wrapper
* @libar-docs-extract-shapes MasterDataset, StatusGroups

// CORRECT - shows full z.object({}) definition
* @libar-docs-extract-shapes MasterDatasetSchema, StatusGroupsSchema
```

### Pattern 2: Duplicate Sections Prevention

**Problem:** Content appeared twice in generated docs - once in "Implementation Details" (from Source Mapping) and again in "Other rules" section.

**Root Cause:** The decision doc generator rendered Rule: blocks as standalone sections even when they were already covered by Source Mapping entries.

**Solution:** The generator now performs fuzzy word matching to skip "Other rules" that are covered by Source Mapping section names:

1. Build set of section names from Source Mapping table
2. For each Rule: block, extract significant words (3+ chars)
3. Skip the rule if any Source Mapping section has:
   - Exact name match
   - Substring match
   - 2+ overlapping significant words

**This is now implemented in** `src/generators/built-in/decision-doc-generator.ts` (lines ~365-400).

### Pattern 3: Source Mapping Self-References

**Problem:** Source Mapping entries can reference either external files OR the current decision document itself.

**Self-reference syntax:**
| Reference | Meaning |
|-----------|---------|
| `THIS DECISION` | Extract from current document's description |
| `THIS DECISION (Rule: Context)` | Extract from specific Rule: block |

**External file syntax:**
| Reference | Meaning |
|-----------|---------|
| `src/path/file.ts` | Extract from TypeScript file |
| `specs/path/file.feature` | Extract from Gherkin file |

**Generator behavior:**
- Self-references: Content rendered inline (parsed from feature file)
- External files: Content extracted via `@extract-shapes` annotation

---

## Problem Statement

The `specs/docs/*.feature` files have **Source Mapping tables** that reference TypeScript files:

```
| MasterDataset Schema | src/validation-schemas/master-dataset.ts | extract-shapes tag |
```

But many TypeScript files **lack the `@libar-docs-extract-shapes` annotation**, so no types are extracted.

---

## The Fix Pattern

### Step 1: Read the Feature File Source Mapping

Look at the **Source Mapping** table in the feature file:

```gherkin
| Section | Source File | Extraction Method |
| --- | --- | --- |
| MasterDataset Schema | src/validation-schemas/master-dataset.ts | extract-shapes tag |
| RenderableDocument | src/renderable/schema.ts | extract-shapes tag |
```

Identify which rows have `extract-shapes tag` as the extraction method.

### Step 2: Check if TypeScript File Has Annotation

Search for `@libar-docs-extract-shapes` in the TypeScript file:

```bash
grep "@libar-docs-extract-shapes" src/validation-schemas/master-dataset.ts
```

If no match, the annotation is missing.

### Step 3: Add the Annotation

Add `@libar-docs-extract-shapes` to the file's JSDoc block, listing key exported types:

**Before:**
```typescript
/**
 * @libar-docs
 * @libar-docs-pattern MasterDataset
 * @libar-docs-status completed
 * ...
 */
```

**After:**
```typescript
/**
 * @libar-docs
 * @libar-docs-pattern MasterDataset
 * @libar-docs-status completed
 * @libar-docs-extract-shapes MasterDataset, StatusGroups, PhaseGroup, RelationshipEntry
 * ...
 */
```

### Step 4: Choose Which Types to Extract

Run `grep "^export"` on the file to see all exports:

```bash
grep "^export" src/validation-schemas/master-dataset.ts
```

Prioritize:
1. **Main types** - The primary interface/type the file defines
2. **Key supporting types** - Types that users of the API need to understand
3. **Skip internal types** - Types that are implementation details

### Step 5: Verify Generation

Run the generator and check output:

```bash
npx tsx scripts/generate-docs-auto.ts [pattern-name]
cat docs-generated/docs/[PATTERN]-REFERENCE.md | grep -A 20 "### [Section Name]"
```

The extracted types should appear in code blocks.

---

## Annotation Patterns by File Type

### Zod Schema Files

```typescript
/**
 * @libar-docs-extract-shapes MasterDataset, StatusGroups, PhaseGroup
 */
// For Zod files, list the inferred type names (without "Schema" suffix)
```

### Interface Files

```typescript
/**
 * @libar-docs-extract-shapes DocumentGenerator, GeneratorContext, GeneratorOutput
 */
// For interface files, list the interface names
```

### Function/Service Files

```typescript
/**
 * @libar-docs-extract-shapes transformToMasterDataset, RuntimeMasterDataset, RawDataset
 */
// For function files, include main function + related types
```

---

## Files Fixed in Architecture Pattern

| File | Added Shapes |
|------|-------------|
| `src/validation-schemas/master-dataset.ts` | MasterDataset, StatusGroups, StatusCounts, PhaseGroup, SourceViews, RelationshipEntry, ArchIndex |
| `src/renderable/schema.ts` | RenderableDocument, SectionBlock, HeadingBlock, TableBlock, ListBlock, CodeBlock, MermaidBlock, CollapsibleBlock |
| `src/generators/types.ts` | DocumentGenerator, GeneratorContext, GeneratorOutput |
| `src/generators/pipeline/transform-dataset.ts` | RuntimeMasterDataset, RawDataset, transformToMasterDataset |

---

## Results Comparison

| Metric | Manual docs/ARCHITECTURE.md | Generated ARCHITECTURE-REFERENCE.md |
|--------|----------------------------|-------------------------------------|
| Lines | 1311 | 714 |
| Sections | 17 | 13 |
| Has TypeScript types | No (prose descriptions) | Yes (actual interfaces) |
| Accuracy risk | May drift from code | Always accurate |

**Key trade-off:** Generated docs are smaller but include actual type definitions that are guaranteed to match the code. Manual docs have more narrative but risk drift.

---

## Completed Fixes (All Done)

### Architecture Documentation ✅

Feature: `specs/docs/architecture-reference.feature`

Files fixed:
- `src/validation-schemas/master-dataset.ts` - Added annotation
- `src/renderable/schema.ts` - Added annotation
- `src/generators/types.ts` - Added annotation
- `src/generators/pipeline/transform-dataset.ts` - Added annotation

**Generated:** 714 lines

### Configuration Documentation ✅

Feature: `specs/docs/configuration-reference.feature`

Files fixed:
- `src/config/presets.ts` - Expanded shape list
- `src/config/config-loader.ts` - Expanded shape list

**Generated:** 731 lines

### Instructions Documentation ✅

Feature: `specs/docs/instructions-reference.feature`

Files fixed:
- `src/cli/generate-docs.ts` - Added annotation
- `src/cli/lint-patterns.ts` - Added annotation
- `src/cli/validate-patterns.ts` - Added annotation
- `src/cli/generate-tag-taxonomy.ts` - Added annotation

**Generated:** 974 lines

### Validation Documentation ✅

Feature: `specs/docs/validation-reference.feature`

Files fixed:
- `src/lint/rules.ts` - Expanded from 3 to 13 shapes
- `src/validation/anti-patterns.ts` - Expanded from 6 to 8 shapes
- `src/validation/types.ts` - Expanded from 6 to 11 shapes
- `src/validation/dod-validator.ts` - Expanded from 4 to 6 shapes

**Generated:** 912 lines

---

## Agent Deployment Template

```
You are fixing auto-generated documentation for the delivery-process package.

**Feature file:** specs/docs/[NAME]-reference.feature

**Your task:**
1. Read the feature file's Source Mapping table
2. For each row with "extract-shapes tag" extraction method:
   - Read the referenced TypeScript file
   - Check if it has @libar-docs-extract-shapes annotation
   - If missing, add it with key exported types
   - **IMPORTANT:** For Zod files, extract SCHEMA CONSTANTS (e.g., `MasterDatasetSchema`)
     NOT type aliases (e.g., `MasterDataset`) - schema constants show full structure
3. Run: npx tsx scripts/generate-docs-auto.ts [filter]
4. Verify the generated output:
   - Contains TypeScript code blocks with actual interfaces/schemas
   - No duplicate sections (same content appearing twice)
   - Zod schemas show `z.object({...})` structure, NOT `z.infer<typeof ...>`

**Success criteria:**
- All referenced TypeScript files have @libar-docs-extract-shapes
- Generation completes without "No shapes extracted" warnings
- Generated docs contain TypeScript code blocks with full type definitions
- No duplicate content between "Implementation Details" and standalone sections

**Common issues and fixes:**
| Issue | Cause | Fix |
|-------|-------|-----|
| `z.infer<typeof X>` shown | Extracted type alias | Extract schema const (`XSchema`) instead |
| Duplicate sections | Rule block + Source Mapping overlap | Already fixed in generator |
| Missing shapes | No annotation | Add `@libar-docs-extract-shapes` to file |
| Empty sections | Wrong shape names | Check `grep "^export"` output for correct names |
```

---

## Inherently Manual Docs (No Changes Needed)

These docs describe concepts/practices, not code:

- `methodology-reference.feature` - Philosophy/thesis
- `publishing-reference.feature` - Release workflow
- `gherkin-patterns-reference.feature` - Writing patterns
- `session-guides-reference.feature` - Workflow procedures
- `index-reference.feature` - Navigation

For these, the feature file Rule blocks ARE the source of truth. No TypeScript extraction is possible or needed.
