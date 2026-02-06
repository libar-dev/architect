# Documentation Annotation Guide

**Purpose:** This guide documents the approach for fixing auto-generated documentation by adding `@libar-docs-extract-shapes` annotations to TypeScript files. Use this guide when deploying agents to fix similar issues.

## Final Statistics

| Metric                          | Before | After      |
| ------------------------------- | ------ | ---------- |
| Files with `@extract-shapes`    | 18     | **36**     |
| Files with `@arch-context`      | 6      | **21**     |
| Total generated doc lines       | ~3,000 | **7,500+** |
| Docs with TypeScript extraction | 3      | **8**      |
| Architecture diagram components | 6      | **21**     |
| Bounded contexts in diagram     | 4      | **9**      |

**Documents Now Auto-Generated:**

- ARCHITECTURE-REFERENCE.md (714 lines) - TypeScript schemas extracted
- CONFIGURATION-REFERENCE.md (731 lines) - Preset/factory types extracted
- INSTRUCTIONS-REFERENCE.md (974 lines) - All 5 CLI configs extracted
- VALIDATION-REFERENCE.md (912 lines) - All validation types extracted
- TAXONOMY-REFERENCE.md (622 lines) - All taxonomy types extracted
- PROCESS-GUARD-REFERENCE.md (449 lines) - FSM + Decider types extracted, NO DUPLICATES
- DOC-GENERATION-PROOF-OF-CONCEPT.md (710 lines) - Pattern demonstration
- SESSION-GUIDES-REFERENCE.md - FSM states types extracted

**Documents Remaining Manual (Conceptual Content):**

- METHODOLOGY-REFERENCE.md (372 lines)
- SESSION-GUIDES-REFERENCE.md (543 lines)
- GHERKIN-PATTERNS-REFERENCE.md (550 lines)
- PUBLISHING-REFERENCE.md (396 lines)
- INDEX-REFERENCE.md (289 lines)

---

## Pattern 0: Architecture Annotations for Diagram Generation

**Problem:** The generated architecture diagram was sparse (only 6 components) because few files had `@libar-docs-arch-*` annotations.

**Solution:** Add architecture annotations to key files across all bounded contexts:

| Annotation                 | Purpose                              | Values                                                                           |
| -------------------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| `@libar-docs-arch-context` | Groups components by bounded context | scanner, extractor, generator, renderer, taxonomy, config, lint, validation, api |
| `@libar-docs-arch-layer`   | Architectural layer classification   | domain, application, infrastructure                                              |
| `@libar-docs-arch-role`    | Component role (optional)            | service, infrastructure                                                          |

**Files Annotated (15 new files):**

| File                                                | Context    | Layer          |
| --------------------------------------------------- | ---------- | -------------- |
| `src/renderable/codecs/patterns.ts`                 | renderer   | application    |
| `src/renderable/codecs/architecture.ts`             | renderer   | application    |
| `src/renderable/codecs/decision-doc.ts`             | renderer   | application    |
| `src/renderable/codecs/session.ts`                  | renderer   | application    |
| `src/taxonomy/registry-builder.ts`                  | taxonomy   | domain         |
| `src/taxonomy/categories.ts`                        | taxonomy   | domain         |
| `src/config/factory.ts`                             | config     | application    |
| `src/config/config-loader.ts`                       | config     | infrastructure |
| `src/lint/rules.ts`                                 | lint       | application    |
| `src/lint/process-guard/decider.ts`                 | lint       | application    |
| `src/validation/anti-patterns.ts`                   | validation | application    |
| `src/validation/dod-validator.ts`                   | validation | application    |
| `src/generators/built-in/decision-doc-generator.ts` | generator  | application    |
| `src/generators/source-mapper.ts`                   | generator  | infrastructure |
| `src/generators/content-deduplicator.ts`            | generator  | infrastructure |

**Result:** Architecture diagram now shows 21 components across 9 bounded contexts, providing an accurate visual representation of the system structure.

**Example annotation:**

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern PatternsCodec
 * @libar-docs-status completed
 * @libar-docs-arch-context renderer
 * @libar-docs-arch-layer application
 */
```

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
| ------------------ | ---------------------- |
| `MasterDataset`    | `MasterDatasetSchema`  |
| `StatusGroups`     | `StatusGroupsSchema`   |
| `PhaseGroup`       | `PhaseGroupSchema`     |

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

### Pattern 4: Section Names Must Match Rule Names (CRITICAL)

**Problem:** Duplicate sections appear when Source Mapping section names don't match Rule: block names.

**Root Cause:** The generator's fuzzy matching algorithm checks if Source Mapping section names match Rule: block names to avoid rendering the same content twice. When names don't match, both get rendered.

**Example of the problem:**

```gherkin
# Source Mapping has:
| CLI Examples | THIS DECISION (Rule: CLI Usage) | Fenced code block |

# But Rule: block is named:
Rule: CLI Usage
```

The fuzzy matcher checks:

- "cli examples" contains "cli usage"? NO
- "cli usage" contains "cli examples"? NO
- Word overlap: {"cli", "examples"} vs {"cli", "usage"} → only 1 word matches (need 2)

**Result:** Content appears TWICE in generated output.

**Solution:** Section names MUST match Rule: block names exactly:

```gherkin
# CORRECT - Section name matches Rule: name
| CLI Usage | THIS DECISION (Rule: CLI Usage) | Rule block content |
| Programmatic API | THIS DECISION (Rule: Programmatic API) | Rule block content |

# WRONG - Section name differs from Rule: name
| CLI Examples | THIS DECISION (Rule: CLI Usage) | Fenced code block |
| API Example | THIS DECISION (Rule: Programmatic API) | Fenced code block |
```

### Pattern 5: Content Ownership Boundaries

**Principle:** Each content type has one owner. Do NOT duplicate content across sources.

| Content Type              | Owner           | Extract From               | Examples                                 |
| ------------------------- | --------------- | -------------------------- | ---------------------------------------- |
| Type definitions          | TypeScript code | `@extract-shapes`          | interfaces, types, consts                |
| Const values (FSM states) | TypeScript code | `@extract-shapes`          | `PROTECTION_LEVELS`, `VALID_TRANSITIONS` |
| Human-readable tables     | Feature file    | Self-reference Rule: block | Escape Hatches, Rule Descriptions        |
| Mermaid diagrams          | Feature file    | Self-reference DocString   | FSM diagrams, architecture flows         |
| Code examples             | Feature file    | Self-reference DocString   | CLI usage, API examples                  |
| Conceptual context        | Feature file    | Self-reference Rule: block | "Why" explanations                       |

**Anti-pattern:** Don't have BOTH a hardcoded table in Rule: block AND TypeScript extraction for the same data:

```gherkin
# WRONG - duplicates FSM data in two places
Rule: Protection Levels
  | Status | Level | ... |  # Hardcoded table
  | roadmap | none | ... |

# Source Mapping also extracts from TypeScript:
| Protection Levels | src/validation/fsm/states.ts | @extract-shapes tag |
```

**Correct approach:** Extract from TypeScript (single source of truth):

```gherkin
# Source Mapping extracts from TypeScript only
| FSM Protection Levels | src/validation/fsm/states.ts | @extract-shapes tag |

# NO hardcoded Rule: block table for same data
```

### Pattern 6: All Rule: Blocks Must Be in Source Mapping

**Problem:** Rule: blocks that aren't in Source Mapping get rendered as standalone "Other rules" sections, causing duplicates when their content overlaps with Source Mapping entries.

**Solution:** Every Rule: block should have a corresponding Source Mapping entry:

```gherkin
**Source Mapping:**

| Section | Source File | Extraction Method |
| --- | --- | --- |
| FSM Diagram | THIS DECISION (Rule: FSM Diagram) | Fenced code block (Mermaid) |
| Escape Hatches | THIS DECISION (Rule: Escape Hatches) | Rule block table |
| Rule Descriptions | THIS DECISION (Rule: Rule Descriptions) | Rule block table |
| CLI Usage | THIS DECISION (Rule: CLI Usage) | Rule block content |
| Programmatic API | THIS DECISION (Rule: Programmatic API) | Rule block content |
| Architecture | THIS DECISION (Rule: Architecture) | Rule block content |
```

This ensures:

1. All Rule: content is extracted exactly once via Source Mapping
2. The fuzzy matching correctly skips rendering the same content as "Other rules"
3. No duplicate sections in generated output

### Pattern 7: Content Deduplication - TypeScript vs Feature File

**Problem:** The same data appears in both TypeScript source and Feature file Rule: blocks.

**Root Cause:** When establishing documentation recipes, authors copied tables from TypeScript
into feature files for "complete" Rule: blocks. This creates maintenance burden and drift risk.

**Example of the problem (from instructions-reference.feature):**

```gherkin
Rule: Category Tags
    **Full Category Table (21 categories):**
    | Tag | Domain | Priority | Description |
    | domain | Strategic DDD | 1 | ...
    ... (21 rows manually copied from categories.ts)
```

Meanwhile, `src/taxonomy/categories.ts` has the SAME data:

```typescript
export const CATEGORIES: readonly CategoryDefinition[] = [
  { tag: 'domain', domain: 'Strategic DDD', priority: 1, ... },
  ...
];
```

**Solution:** Apply strict content ownership:

| Content Type                                      | Single Source                    | Never Duplicate In   |
| ------------------------------------------------- | -------------------------------- | -------------------- |
| Tag definitions (name, format, purpose, example)  | TypeScript `registry-builder.ts` | Feature file tables  |
| Category definitions (tag, domain, priority)      | TypeScript `categories.ts`       | Feature file tables  |
| CLI flags and options                             | TypeScript `src/cli/*.ts`        | Feature file tables  |
| Conceptual context ("When to Use", "Why")         | Feature file Rule: blocks        | TypeScript JSDoc     |
| Supplementary tables (Source Ownership, Duration) | Feature file Rule: blocks        | N/A - unique content |
| Code examples                                     | Feature file DocStrings          | N/A                  |

**How to Fix:**

1. Check if table data exists in TypeScript with `@extract-shapes` annotation
2. If yes: REMOVE table from Rule: block, keep only context paragraph
3. If no: Keep table in Rule: block (it's unique content)
4. Update Source Mapping to reflect actual extraction sources

**Example fix applied to instructions-reference.feature:**

Before (528 lines):

```gherkin
Rule: Category Tags
    **Full Category Table (21 categories):**
    | Tag | Domain | Priority | Description |
    | domain | Strategic DDD | 1 | Bounded contexts... |
    ... (21 rows)
```

After (363 lines):

```gherkin
Rule: Category Tags
    **Context:** Category tags classify patterns by domain area.
    The full category list (21 categories) is extracted from `src/taxonomy/categories.ts`.
```

### Pattern 8: Identifying Supplementary Tables (Unique Content)

**Problem:** How do you know if a table should be kept or removed?

Some tables in Rule: blocks contain information NOT in TypeScript. These are "supplementary tables"
that provide human-written guidance rather than data that can be extracted from code.

**Supplementary tables to KEEP:**

| Table Type               | Example                                     | Why It's Unique                    |
| ------------------------ | ------------------------------------------- | ---------------------------------- |
| Source Ownership         | `uses` → TypeScript, `depends-on` → Feature | Architectural guidance not in code |
| Format Types Explanation | `flag` → Boolean presence                   | Parsing behavior explanation       |
| Hierarchy Duration       | `epic` → Multi-quarter                      | Timeline context not in TypeScript |
| Two-Tier Architecture    | Tier 1 → delivery-process/specs             | Structural guidance                |
| Escape Hatches           | CLI flags with workarounds                  | Usage guidance                     |

**Data tables to REMOVE (duplicate TypeScript):**

| Table Type           | Why Remove                                    | TypeScript Source     |
| -------------------- | --------------------------------------------- | --------------------- |
| Tag definitions      | Same columns as MetadataTagDefinition         | `registry-builder.ts` |
| Category definitions | Same structure as CATEGORIES array            | `categories.ts`       |
| Enum values          | Already in tag definition's `values` property | `registry-builder.ts` |
| CLI flags            | Already extracted via @extract-shapes         | `src/cli/*.ts`        |

**Identification Rule:** Search TypeScript for the table's data:

```bash
grep -r "first-cell-value" src/taxonomy/ src/cli/
```

If found → REMOVE the table, extract from TypeScript
If not found → KEEP the table, it's unique content

---

## File Organization

Documentation recipe files use decision document FORMAT but serve a different PURPOSE:

| Directory                     | Purpose                                       | Example                          |
| ----------------------------- | --------------------------------------------- | -------------------------------- |
| `specs/docs/`                 | Documentation recipes (Source Mapping tables) | `instructions-reference.feature` |
| `delivery-process/decisions/` | ADR/PDR documents                             | `adr-006-process-guard.feature`  |
| `delivery-process/specs/`     | Roadmap specifications                        | `phase-state-machine.feature`    |

Documentation recipes:

- Define WHICH sources feed WHICH documentation sections
- Don't record decisions made, they configure generation
- Use Rule: blocks for unique supplementary content only

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

| File                                           | Added Shapes                                                                                                     |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/validation-schemas/master-dataset.ts`     | MasterDataset, StatusGroups, StatusCounts, PhaseGroup, SourceViews, RelationshipEntry, ArchIndex                 |
| `src/renderable/schema.ts`                     | RenderableDocument, SectionBlock, HeadingBlock, TableBlock, ListBlock, CodeBlock, MermaidBlock, CollapsibleBlock |
| `src/generators/types.ts`                      | DocumentGenerator, GeneratorContext, GeneratorOutput                                                             |
| `src/generators/pipeline/transform-dataset.ts` | RuntimeMasterDataset, RawDataset, transformToMasterDataset                                                       |

---

## Results Comparison

| Metric               | Manual docs/ARCHITECTURE.md | Generated ARCHITECTURE-REFERENCE.md |
| -------------------- | --------------------------- | ----------------------------------- |
| Lines                | 1311                        | 714                                 |
| Sections             | 17                          | 13                                  |
| Has TypeScript types | No (prose descriptions)     | Yes (actual interfaces)             |
| Accuracy risk        | May drift from code         | Always accurate                     |

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

### Process Guard Documentation ✅ (Exemplar for duplicate prevention)

Feature: `specs/docs/process-guard-reference.feature`

**Key fixes applied:**

1. Added `@libar-docs-extract-shapes` to `src/validation/fsm/states.ts`:
   - `PROTECTION_LEVELS, ProtectionLevel, getProtectionLevel, isTerminalState, isFullyEditable, isScopeLocked`

2. Updated Source Mapping to extract from TypeScript instead of hardcoded Rule: blocks:
   - Protection Levels → `src/validation/fsm/states.ts`
   - Valid Transitions → `src/validation/fsm/transitions.ts`

3. Fixed Section names to match Rule: names exactly:
   - `CLI Usage` → `THIS DECISION (Rule: CLI Usage)` (not "CLI Examples")
   - `Programmatic API` → `THIS DECISION (Rule: Programmatic API)` (not "API Example")

4. Added all Rule: blocks to Source Mapping table to prevent "Other rules" duplication

**Before:** 521 lines with duplicate sections
**After:** 449 lines with NO duplicates

**Compact output:** 134 lines with actual content (was "No structured content")

---

## Agent Deployment Template

````
You are fixing auto-generated documentation for the delivery-process package.

**Feature file:** specs/docs/[NAME]-reference.feature

**Your task:**

### Step 0: Check for Content Duplication (NEW - CRITICAL)
Before fixing missing @extract-shapes, check if Rule: blocks duplicate TypeScript data.

1. For each Rule: block with a data table, search TypeScript:
   ```bash
   grep -r "first-cell-value" src/taxonomy/ src/cli/
````

2. If the table data exists in TypeScript:
   - REMOVE the table from the Rule: block
   - Keep only the context paragraph
   - Update Source Mapping to extract from TypeScript

3. If the table data does NOT exist in TypeScript:
   - KEEP the table (it's supplementary content)
   - Ensure Source Mapping references the Rule: block

**Duplication red flags:**

- Table has same columns as TypeScript interface (tag, format, purpose)
- Table values match constants in TypeScript files
- Source Mapping says "extract-shapes" but Rule: also has table

**Example fix (from instructions-reference.feature):**

BEFORE (duplicates categories.ts):

```gherkin
Rule: Category Tags
    | Tag | Domain | Priority | Description |
    | domain | Strategic DDD | 1 | Bounded contexts... |
    ... (21 rows)
```

AFTER (removed duplicate):

```gherkin
Rule: Category Tags
    **Context:** Category tags classify patterns by domain area.
    The full category list is extracted from `src/taxonomy/categories.ts`.
```

### Step 1: Analyze Source Mapping Table

Read the feature file's Source Mapping table and categorize each row:

- TypeScript extraction (`@extract-shapes tag`) → Check for missing annotations
- Self-references (`THIS DECISION`) → Verify section names match Rule: names

### Step 2: Fix TypeScript Extraction

For each row with "extract-shapes tag" extraction method:

1. Read the referenced TypeScript file
2. Check if it has `@libar-docs-extract-shapes` annotation
3. If missing, add it with key exported types
4. **IMPORTANT:** For Zod files, extract SCHEMA CONSTANTS (e.g., `MasterDatasetSchema`)
   NOT type aliases (e.g., `MasterDataset`) - schema constants show full structure

### Step 3: Fix Self-References (CRITICAL for duplicates)

For each row with `THIS DECISION (Rule: X)` reference:

1. Verify the Source Mapping section name MATCHES the Rule: block name
2. If they differ, update the Source Mapping section name to match exactly

Example fix:

```gherkin
# BEFORE (causes duplicates):
| CLI Examples | THIS DECISION (Rule: CLI Usage) |

# AFTER (no duplicates):
| CLI Usage | THIS DECISION (Rule: CLI Usage) |
```

### Step 4: Ensure All Rules Are Mapped

Every Rule: block in the feature file should have a Source Mapping entry:

- Missing Rule: → Add to Source Mapping table
- This prevents "Other rules" section duplication

### Step 5: Verify Generation

Run: `npx tsx scripts/generate-docs-auto.ts [filter]`

Check output for:

- TypeScript code blocks with actual interfaces/schemas
- NO duplicate sections (search for repeated headings)
- Zod schemas show `z.object({...})` structure
- Compact version (`_claude-md/`) has content, not "No structured content"

**Success criteria:**

- All referenced TypeScript files have @libar-docs-extract-shapes
- Source Mapping section names match Rule: block names exactly
- Every Rule: block has a Source Mapping entry
- Generated docs contain NO duplicate sections
- Compact output has essential content (~50-150 lines)

**Common issues and fixes:**
| Issue | Cause | Fix |
|-------|-------|-----|
| `z.infer<typeof X>` shown | Extracted type alias | Extract schema const (`XSchema`) instead |
| Duplicate sections | Section name ≠ Rule: name | Make Source Mapping section name match Rule: name |
| Missing shapes | No annotation | Add `@libar-docs-extract-shapes` to file |
| Empty sections | Wrong shape names | Check `grep "^export"` output for correct names |
| "Other rules" section | Rule: not in Source Mapping | Add entry to Source Mapping table |
| Compact shows "No content" | Rule: content not tables | Include tables in Rule: blocks |

**Content ownership rules:**
| Content Type | Extract From |
|--------------|--------------|
| Type definitions, const values | TypeScript `@extract-shapes` |
| Human-readable tables | Self-reference Rule: block |
| Mermaid diagrams | Self-reference DocString |
| Workflow examples | Self-reference DocString |
| Conceptual context | Self-reference Rule: block |

````

---

### Pattern 9: Property-Level JSDoc for CLI Config Interfaces

**Problem:** Extracted TypeScript interfaces show structure but lack descriptions for each property, making them less useful than hand-written tables.

**Solution:** Add JSDoc comments to every property in config interfaces. The shape extractor preserves these comments in the extracted source text.

**Example:**
```typescript
// BEFORE - properties lack descriptions
interface CLIConfig {
  input: string[];
  exclude: string[];
  output: string;
}

// AFTER - JSDoc describes each property
interface CLIConfig {
  /** Glob patterns for TypeScript input files (-i, --input). Repeatable. */
  input: string[];
  /** Glob patterns to exclude from scanning (-e, --exclude). Repeatable. */
  exclude: string[];
  /** Output directory for generated documentation (-o, --output). Default: docs/architecture */
  output: string;
}
````

**Result:** The generated documentation shows the full interface with inline JSDoc comments, providing the same information as hand-written flag tables but extracted directly from source code.

### Pattern 10: CLI Documentation Ownership

**Problem:** CLI documentation exists in both feature files (hardcoded tables) and TypeScript files (config interfaces), creating duplication.

**Solution:** Apply strict content ownership:

| Content Type                           | Owner                     | Extraction Method                               |
| -------------------------------------- | ------------------------- | ----------------------------------------------- |
| Interface structure                    | TypeScript                | `@extract-shapes`                               |
| Property descriptions                  | TypeScript JSDoc          | `@extract-shapes` (visible in extracted source) |
| Usage examples                         | Feature file DocStrings   | Self-reference                                  |
| Business rules (lint/validation rules) | Feature file tables       | Supplementary content                           |
| Context paragraphs                     | Feature file Rule: blocks | Self-reference                                  |

**What to Remove from Feature Files:**

- CLI flag tables that duplicate TypeScript interface properties
- Replace with: "Configuration interface (`CLIConfig`) extracted from `src/cli/[name].ts`."

**What to KEEP in Feature Files:**

- Supplementary tables (Lint Rules, Validation Rules, Escape Hatches)
- Usage examples in DocStrings
- Context paragraphs explaining when/why to use the CLI

---

### Pattern 11: Related Documentation Cross-References

**Problem:** Auto-generated docs lack the "Related Documentation" cross-linking that helps readers navigate between documents.

**Solution:** Add a `Rule: Related Documentation` block to recipe feature files with a table of related documents:

```gherkin
Rule: Related Documentation

    **Context:** Related documentation for deeper understanding.

| Document | Relationship | Focus |
| --- | --- | --- |
| VALIDATION-REFERENCE.md | Sibling | DoD validation, anti-pattern detection |
| SESSION-GUIDES-REFERENCE.md | Prerequisite | Planning/Implementation workflows |
| CONFIGURATION-REFERENCE.md | Reference | Presets and tag configuration |
```

**Relationship Types:**

| Type         | Meaning                      |
| ------------ | ---------------------------- |
| Sibling      | Related doc at same level    |
| Prerequisite | Should read before this doc  |
| Reference    | Lookup reference when needed |
| Background   | Conceptual foundation        |

**Don't forget** to add the Rule: to the Source Mapping table:

```gherkin
| Related Documentation | THIS DECISION (Rule: Related Documentation) | Rule block table |
```

---

### Pattern 12: Quick Start Paths for Index Documents

**Problem:** Index documents lack task-oriented navigation paths that help users find the right starting point.

**Solution:** Add a `Rule: Quick Start Paths` block with a table showing common tasks and recommended reading order:

```gherkin
Rule: Quick Start Paths

    **Context:** Common tasks with recommended documentation paths.

| Task | Start Here | Then Read |
| --- | --- | --- |
| Set up pre-commit hooks | PROCESS-GUARD.md | CONFIGURATION.md |
| Add annotations to TypeScript | INSTRUCTIONS.md | GHERKIN-PATTERNS.md |
| Run AI-assisted implementation | SESSION-GUIDES.md | PROCESS-GUARD.md |
```

---

### Pattern 13: ADR vs Documentation Recipe

**Problem:** Two document types both use Source Mapping tables but serve different purposes.

**Document Types:**

| Type    | Purpose                    | Location                      | Script           |
| ------- | -------------------------- | ----------------------------- | ---------------- |
| ADR/PDR | Record decisions (WHY)     | `delivery-process/decisions/` | `docs:decisions` |
| Recipe  | Configure generation (HOW) | `specs/docs/`                 | `docs:technical` |

**When to Use Each:**

- **ADR:** When documenting WHY a decision was made (Context/Decision/Consequences structure)
- **Recipe:** When ONLY configuring doc generation (Source Mapping + minimal Rule: blocks)

**Anti-pattern:** Having BOTH an ADR AND a Recipe that duplicate content. Choose one:

- If the ADR has good Context/Decision/Consequences → use ADR, add Source Mapping
- If you only need to aggregate TypeScript extractions → use Recipe

---

## Directory Structure

| Directory                     | Purpose                                    | Package.json Script             |
| ----------------------------- | ------------------------------------------ | ------------------------------- |
| `specs/docs/`                 | Doc generation recipes with Source Mapping | `docs:technical`                |
| `delivery-process/decisions/` | ADR/PDR decision documents                 | `docs:decisions`                |
| `delivery-process/specs/`     | Tier 1 roadmap specifications              | `docs:patterns`, `docs:roadmap` |

**Note:** `specs/docs/` is at project root (not inside `delivery-process/`) because these are recipes FOR generating documentation, not part of the delivery process itself.

---

## Agent Deployment for Fixing Generated Docs

### Pre-Flight Checklist

Before fixing a document:

1. [ ] Identify the feature file (recipe in `specs/docs/` or ADR in `delivery-process/decisions/`)
2. [ ] Check Source Mapping table exists
3. [ ] Verify Source Mapping section names match Rule: block names **EXACTLY**
4. [ ] Verify all TypeScript files have `@libar-docs-extract-shapes`

### Debugging Empty Output

When generated docs are empty or have "No structured content":

1. **Check self-reference matching:**
   - Source Mapping: `THIS DECISION (Rule: X)`
   - Must match: `Rule: X` block name exactly (case-sensitive)
   - Example: `Rule: Context above` does NOT match `Rule: Context - Why X Exists`

2. **Check external file paths:**
   - Paths relative to project root
   - Files must exist
   - TypeScript files need `@libar-docs-extract-shapes`

3. **Run with output inspection:**
   ```bash
   npx tsx scripts/generate-docs-auto.ts [pattern] 2>&1 | head -100
   ```

### Success Criteria

| Document Type                              | Expected Lines | Key Content                   |
| ------------------------------------------ | -------------- | ----------------------------- |
| TypeScript-heavy (PROCESS-GUARD-REFERENCE) | 400-500        | Code blocks with actual types |
| Conceptual (METHODOLOGY-REFERENCE)         | 300-400        | Prose in Rule: blocks         |
| Compact (\_claude-md/)                     | 50-150         | Tables only, no code blocks   |

### Systematic Fix Process

For each document to fix:

1. **Read the feature file** (recipe or ADR)
2. **Check Source Mapping table:**
   - Do section names match Rule: block names exactly?
   - Do external TypeScript files have `@libar-docs-extract-shapes`?
3. **Fix mismatches** following Pattern 4 (Section Names Must Match)
4. **Regenerate and verify** line count meets expectations

---

## Inherently Manual Docs (No Changes Needed)

These docs describe concepts/practices, not code:

- `methodology-reference.feature` - Philosophy/thesis
- `publishing-reference.feature` - Release workflow
- `gherkin-patterns-reference.feature` - Writing patterns
- `session-guides-reference.feature` - Workflow procedures
- `index-reference.feature` - Navigation

For these, the feature file Rule blocks ARE the source of truth. No TypeScript extraction is possible or needed.
