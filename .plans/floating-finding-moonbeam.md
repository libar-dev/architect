# Phase 37 — DocsLiveConsolidation Implementation Plan

## Context

`docs-generated/` mixes production reference docs (ARCHITECTURE-CODECS.md, ARCHITECTURE-TYPES.md, REFERENCE-SAMPLE.md) with intermediate build artifacts (business-rules/, taxonomy/). Claude compact files (`_claude-md/architecture/`) are split across two directories. This creates ambiguity about where authoritative content lives.

**Goal:** Make `docs-live/` the single output directory for all website-published and Claude-readable content. Restrict `docs-generated/` to intermediate artifacts only.

---

## Changes (8 files)

### 1. Generator output prefix: `docs/` → `reference/`

**File:** `src/generators/built-in/reference-generators.ts`

- **Line 196:** `docs/${config.docsFilename}` → `reference/${config.docsFilename}`
- **Line 440:** `'docs'` → `'reference'` in the ternary for individual generator registration

This changes where `ReferenceDocsGenerator` places detailed docs (from `{outputDir}/docs/` to `{outputDir}/reference/`).

### 2. Add `outputDirectory` override for `reference-docs`

**File:** `delivery-process.config.ts`

- **Lines 116-118:** Add `outputDirectory: 'docs-live'` to the existing `reference-docs` override block:
  ```typescript
  'reference-docs': {
    additionalFeatures: ['delivery-process/decisions/*.feature'],
    outputDirectory: 'docs-live',
  },
  ```

Combined with change #1, reference docs land at `docs-live/reference/` and `_claude-md/architecture/` compacts land at `docs-live/_claude-md/architecture/`.

### 3. Update `.gitignore`

**File:** `.gitignore`

Add after "Build output" section:

```
# Generated intermediate artifacts (not website-published)
docs-generated/
```

### 4. Update `package.json` files array

**File:** `package.json` (line 202)

Remove `"docs-generated"` from the `files` array — it will be gitignored and shouldn't be in the npm publish manifest.

### 5. Update process guard generated-docs detection

**File:** `src/lint/process-guard/detect-changes.ts` (line 322)

Add `'docs-live/'` to the `patterns` array in `isGeneratedDocsPath()` so process guard skips generated content in `docs-live/`.

### 6. Update cross-references in `docs/ARCHITECTURE.md`

**File:** `docs/ARCHITECTURE.md` (lines 136, 183, 254, 273)

Change 4 links from `../docs-generated/docs/ARCHITECTURE-*.md` to `../docs-live/reference/ARCHITECTURE-*.md`.

### 7. Update test file paths

**File:** `tests/features/doc-generation/architecture-doc-refactoring.feature` (lines 51, 61, 67, 82, 108, 118)

Change 6 occurrences of `docs-generated/docs/` to `docs-live/reference/`.

**File:** `tests/features/behavior/codecs/reference-generators.feature` (line 90)

Change `"docs/"` to `"reference/"` in the output path assertion.

### 8. FSM transitions and deliverable statuses

**File:** `delivery-process/specs/docs-live-consolidation.feature`

- Line 3: `@libar-docs-status:roadmap` → `active` (before code) → `completed` (after all verified)
- Lines 36-39: Each deliverable `pending` → `complete`

---

## Execution Sequence

| Step | Action                                                                   | Verify                                                                         |
| ---- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| 1    | FSM: `roadmap` → `active` in spec                                        | —                                                                              |
| 2    | Edit `reference-generators.ts` (prefix change)                           | —                                                                              |
| 3    | Edit `delivery-process.config.ts` (add override)                         | —                                                                              |
| 4    | Edit `reference-generators.feature` (test path)                          | —                                                                              |
| 5    | Edit `architecture-doc-refactoring.feature` (test paths)                 | —                                                                              |
| 6    | `pnpm build && pnpm test`                                                | Tests pass                                                                     |
| 7    | Edit `.gitignore`, `package.json`, `detect-changes.ts`                   | —                                                                              |
| 8    | Edit `docs/ARCHITECTURE.md` (cross-refs)                                 | —                                                                              |
| 9    | `pnpm docs:all`                                                          | Files land in `docs-live/reference/` and `docs-live/_claude-md/architecture/`  |
| 10   | `git rm --cached -r docs-generated/`                                     | Old tracked files removed from git                                             |
| 11   | Delete `docs-generated/docs/` and `docs-generated/_claude-md/` from disk | Only `business-rules/`, `taxonomy/`, `BUSINESS-RULES.md`, `TAXONOMY.md` remain |
| 12   | Mark all 4 deliverables `complete`, FSM → `completed`                    | —                                                                              |
| 13   | `pnpm build && pnpm docs:all && pnpm test`                               | Full green                                                                     |
| 14   | Update `.plans/docs-consolidation-tracker.md` with session report        | —                                                                              |

## Verification

```bash
# Reference docs in new location
ls docs-live/reference/
# → ARCHITECTURE-CODECS.md, ARCHITECTURE-TYPES.md, REFERENCE-SAMPLE.md

# Claude compacts consolidated
ls docs-live/_claude-md/architecture/
# → architecture-codecs.md, architecture-types.md, reference-sample.md

# docs-generated has only intermediates
ls docs-generated/
# → business-rules/, taxonomy/, BUSINESS-RULES.md, TAXONOMY.md (no docs/, no _claude-md/)

# No stale cross-references
grep -r "docs-generated/docs/" docs/ docs-live/ src/ tests/ delivery-process/
# → no matches (only .plans/ and .obsidian/ may have stale refs, which are ephemeral)
```

## No New Tests Needed

The spec scenarios are integration-level filesystem checks. Existing test at `reference-generators.feature:90` already validates the output path prefix — updating it from `"docs/"` to `"reference/"` provides unit-level coverage. End-to-end verification is done by running `pnpm docs:all` and checking the output.
