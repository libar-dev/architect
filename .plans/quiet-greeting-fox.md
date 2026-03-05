# Review & Implementation Plan: ArchitectureDocRefactoring

## Context

`architecture-doc-refactoring.feature` (`@libar-docs-status:completed`) is a plan+design hybrid
that tracked the decomposition of the 1,287-line ARCHITECTURE.md into a ~320-line curated overview
with generated reference documents. All 12 deliverables are verified complete. The spec is
correctly marked `completed`.

The review reveals **three categories of issues**:

1. Missing `@libar-docs-unlock-reason` tag — Process Guard blocks all changes to `completed` specs
   without it, making items 2 and 3 impossible without it
2. Test coverage gap — 21 of 25 spec scenarios have no corresponding test implementation
3. Spec metadata drift — stale line ranges and a scenario count discrepancy in the parent spec

**Scope:** `delivery-process/specs/architecture-doc-refactoring.feature` (primary) and
`delivery-process/specs/docs-consolidation-strategy.feature` (parent, minor fix).

---

## Issues Found

### Critical

| #   | Issue                                               | Location                       | Impact                                                                   |
| --- | --------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| C1  | Missing `@libar-docs-unlock-reason` tag             | spec lines 1-9                 | Process Guard rejects any edit to a `completed` spec without it          |
| C2  | 21 of 25 spec scenarios have no test implementation | tests/features/doc-generation/ | Spec marked complete but `@acceptance-criteria` scenarios are unexecuted |

### Medium

| #   | Issue                                                            | Location                                    | Impact                                                                            |
| --- | ---------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| M1  | Section disposition table uses stale pre-refactoring line ranges | spec lines 34-49                            | Line ranges describe the OLD 1,287-line doc; current ARCHITECTURE.md is 358 lines |
| M2  | Parent spec claims "18 scenarios" but spec has 25                | docs-consolidation-strategy.feature line 35 | Minor documentation mismatch                                                      |

### Low

| #   | Issue                                                                        | Location                                                  | Impact                                                                                               |
| --- | ---------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| L1  | Known TODO: union type pipes in options tables not escaped in summary output | src/renderable/codecs/convention-extractor.ts lines 15-17 | Codecs with union enum options (e.g., `"phase" \| "priority"`) render broken tables in `_claude-md/` |

---

## Deliverable Verification (for reference, do not re-verify)

All 12 deliverables confirmed complete by the review:

- 15 codec files tagged with `@libar-docs-convention codec-registry` (spec said 14)
- ARCHITECTURE.md: 358 lines (target ~320, within 11%)
- ARCHITECTURE-CODECS.md: 601 lines at `docs-generated/docs/`
- ARCHITECTURE-TYPES.md: 426 lines at `docs-generated/docs/`
- All product area docs exist: CONFIGURATION.md, ANNOTATION.md, PROCESS.md, CORE-TYPES.md
- All pointer replacements verified present in ARCHITECTURE.md

---

## Implementation Plan

### Step 1 — Add unlock reason tag (prerequisite)

**File:** `delivery-process/specs/architecture-doc-refactoring.feature`

Add `@libar-docs-unlock-reason:Implement-test-coverage-and-fix-spec-metadata` after
`@libar-docs-status:completed` (line 3). This is a hard prerequisite — Process Guard will
reject the staged changes for steps 2-4 without it.

```gherkin
@libar-docs-status:completed
@libar-docs-unlock-reason:Implement-test-coverage-and-fix-spec-metadata
```

---

### Step 2 — Fix spec metadata drift (M1, M2)

**File 1:** `delivery-process/specs/architecture-doc-refactoring.feature` lines 34-49

The section disposition table uses original ARCHITECTURE.md line ranges. Add a parenthetical
note to the table header clarifying these are historical references:

Replace:

```
**Section Disposition (line ranges approximate -- verify before Phase 4):**
```

With:

```
**Section Disposition (line ranges from original 1,287-line pre-refactoring document):**
```

This makes clear the table is an archaeological record of the decomposition, not a current
navigation guide.

**File 2:** `delivery-process/specs/docs-consolidation-strategy.feature` line 35

Replace:

```
Phase 4 scenarios are detailed in ArchitectureDocRefactoring spec (8 Rules, 18 scenarios).
```

With:

```
Phase 4 scenarios are detailed in ArchitectureDocRefactoring spec (8 Rules, 25 scenarios).
```

---

### Step 3 — Implement missing test scenarios

This is the bulk of the work. The implementation goes in two files:

**Test feature file:** `tests/features/doc-generation/architecture-doc-refactoring.feature`
**Steps file:** `tests/steps/doc-generation/architecture-doc-refactoring.steps.ts`

The test file uses `@libar-docs-status:active` (not completed), so no unlock reason needed there.

#### 3A — Rule: Convention extraction produces ARCHITECTURE-CODECS reference document

_(Maps to spec Rules 1, 2, 3 — convention extraction end-to-end)_

**New Rule in test feature file:**

```gherkin
Rule: Convention extraction produces ARCHITECTURE-CODECS reference document

  @happy-path
  Scenario: Session codecs file produces multiple convention sections
    When reading file "docs-generated/docs/ARCHITECTURE-CODECS.md"
    Then the file contains "SessionContextCodec"
    And the file also contains "RemainingWorkCodec"
    And the file also contains "CurrentWorkCodec"

  @happy-path
  Scenario: Convention sections include output file references
    When reading file "docs-generated/docs/ARCHITECTURE-CODECS.md"
    Then the file contains "SESSION-CONTEXT.md"
    And the file also contains "CURRENT-WORK.md"

  @happy-path
  Scenario: All codec files produce substantial ARCHITECTURE-CODECS output
    When reading file "docs-generated/docs/ARCHITECTURE-CODECS.md"
    Then the file has more than 400 lines

  @happy-path
  Scenario: Session codec source file has structured JSDoc headings
    When reading file "src/renderable/codecs/session.ts"
    Then the file contains "## SessionContextCodec"
    And the file also contains "**Purpose:**"
    And the file also contains "**Output Files:**"

  @happy-path
  Scenario: Convention rule titles match source heading text
    When reading file "docs-generated/docs/ARCHITECTURE-CODECS.md"
    Then the file contains "SessionContextCodec"
    And the file contains "ValidationRulesCodec"
    And the file contains "PatternsDocumentCodec"
```

**New steps needed:**

- `When reading file {string}` → reads full file into state (new step, separate from section-based reading)
- `Then the file contains {string}` → asserts full file content (re-use existing `And file {string} contains {string}` pattern with minor refactor)
- `Then the file also contains {string}` → same assertion
- `Then the file has more than {int} lines` → count newlines + 1

#### 3B — Rule: Section disposition routes content to generated equivalents

_(Maps to spec Rule 4 — section routing validation)_

```gherkin
Rule: Section disposition routes content to generated equivalents

  @happy-path
  Scenario: Unified Transformation Architecture section is a pointer
    When reading the "Unified Transformation Architecture" section
    Then the section contains "ARCHITECTURE-TYPES.md"
    And the section does not contain "MasterDatasetSchema"

  @happy-path
  Scenario: Data Flow Diagrams section is a pointer
    When reading the "Data Flow Diagrams" section
    Then the section contains "ARCHITECTURE-TYPES.md"
    And the section does not contain "┌"

  @happy-path
  Scenario: Quick Reference section points to ARCHITECTURE-CODECS
    When reading the "Quick Reference" section
    Then the section contains "ARCHITECTURE-CODECS.md"
```

**New steps needed:**

- `Then the section does not contain {string}` → `expect(state.currentSectionContent).not.toContain(text)`

#### 3C — Rule: MasterDataset shapes appear in ARCHITECTURE-TYPES reference

_(Maps to spec Rule 6)_

```gherkin
Rule: MasterDataset shapes appear in ARCHITECTURE-TYPES reference

  @happy-path
  Scenario: Core MasterDataset types appear in ARCHITECTURE-TYPES
    When reading file "docs-generated/docs/ARCHITECTURE-TYPES.md"
    Then the file contains "MasterDataset"
    And the file also contains "RuntimeMasterDataset"
    And the file also contains "RawDataset"

  @happy-path
  Scenario: Pipeline types appear in ARCHITECTURE-TYPES reference
    When reading file "docs-generated/docs/ARCHITECTURE-TYPES.md"
    Then the file contains "PipelineOptions"
    And the file also contains "PipelineResult"

  @happy-path
  Scenario: Unified Transformation section replaced with pointer and narrative
    When reading the "Unified Transformation Architecture" section
    Then the section contains "sole read model"
    And the section contains "ARCHITECTURE-TYPES.md"
```

#### 3D — Rule: Pipeline architecture convention appears in generated reference

_(Maps to spec Rule 7)_

```gherkin
Rule: Pipeline architecture convention appears in generated reference

  @happy-path
  Scenario: Orchestrator source file has pipeline-architecture convention tag
    When reading file "src/generators/orchestrator.ts"
    Then the file contains "pipeline-architecture"

  @happy-path
  Scenario: Build-pipeline source file has pipeline-architecture convention tag
    When reading file "src/generators/pipeline/build-pipeline.ts"
    Then the file contains "pipeline-architecture"

  @happy-path
  Scenario: Data Flow Diagrams section points to ARCHITECTURE-TYPES
    When reading the "Data Flow Diagrams" section
    Then the section contains "ARCHITECTURE-TYPES.md"
    And the section does not contain "ASCII"
```

#### 3E — Rule: Editorial trimming removes tutorial sections and reduces file size

_(Maps to spec Rule 8 — remaining 4 scenarios)_

```gherkin
Rule: Editorial trimming removes tutorial sections and reduces file size

  @happy-path
  Scenario: Programmatic Usage section removed
    Then section "Programmatic Usage" is absent from ARCHITECTURE.md

  @happy-path
  Scenario: Extending the System section removed
    Then section "Extending the System" is absent from ARCHITECTURE.md

  @happy-path
  Scenario: Key Design Patterns has pointer to CORE-TYPES
    When reading the "Key Design Patterns" section
    Then the section contains "CORE-TYPES.md"

  @happy-path
  Scenario: ARCHITECTURE.md is under 400 lines after editorial trimming
    Then ARCHITECTURE.md has fewer than 400 lines
```

**New steps needed:**

- `Then section {string} is absent from ARCHITECTURE.md` → `expect(getHeadingStart(state.architectureContent, heading)).toBe(-1)`
- `Then ARCHITECTURE.md has fewer than {int} lines` → count lines

---

### Step 4 — Convention extractor pipe escaping fix (L1, optional/separate session)

**File:** `src/renderable/codecs/convention-extractor.ts`

The TODO at lines 15-17 notes that `|` characters inside table cells are not escaped in
`_claude-md/` summary output. This affects codecs with union-type options like
`"phase" | "priority"`.

**Fix approach:** In the `buildRuleContentFromText()` function or wherever table cells are
serialized for compact output, escape `|` as `\|` inside cell values. The fix is in the
serialization path for `ConventionTable` rows → compact markdown.

**Prerequisite:** Add a failing scenario to the convention-extractor unit tests before fixing
(TDD: red → green). The unit test feature file is at:
`tests/features/doc-generation/convention-extractor.feature` (needs new Rule).

---

## Critical Files

| File                                                                 | Role            | Change Type                             |
| -------------------------------------------------------------------- | --------------- | --------------------------------------- |
| `delivery-process/specs/architecture-doc-refactoring.feature`        | Primary spec    | Add unlock reason tag, fix table header |
| `delivery-process/specs/docs-consolidation-strategy.feature`         | Parent spec     | Fix scenario count (line 35)            |
| `tests/features/doc-generation/architecture-doc-refactoring.feature` | Test feature    | Add 5 new Rules with 20 scenarios       |
| `tests/steps/doc-generation/architecture-doc-refactoring.steps.ts`   | Step defs       | Add new step implementations            |
| `src/renderable/codecs/convention-extractor.ts`                      | Conv. extractor | Fix pipe escaping (Step 4, separate)    |

---

## Step Execution Order (Critical)

1. **Step 1 first** — without the unlock reason tag, Process Guard will reject all other spec file changes at pre-commit
2. **Steps 2-3 in same commit** — once unlocked, all spec + test changes can go together
3. **Step 4 separately** — convention extractor fix is a code change requiring its own test-first cycle

---

## Verification

After implementation, run:

```bash
# Verify all tests pass
pnpm test architecture-doc-refactoring

# Verify Process Guard accepts the changes
pnpm lint-process --staged --show-state

# Verify docs still regenerate cleanly
pnpm docs:all

# Verify overview still accurate
pnpm process:query -- overview
```

Expected: All 24 test scenarios pass (4 existing + 20 new). Process Guard should show
`completed` with `unlock-reason` present and accept the staged changes.

---

## New Step Function Signatures (for step defs file)

```typescript
// Read full file into state (new helper path)
When('reading file {string}', (_ctx: unknown, filePath: string) => { ... });

// Full file assertions (re-use fileContent state slot)
Then('the file contains {string}', (_ctx: unknown, text: string) => { ... });
And('the file also contains {string}', (_ctx: unknown, text: string) => { ... });
Then('the file has more than {int} lines', (_ctx: unknown, count: number) => { ... });

// Section absence check
Then('section {string} is absent from ARCHITECTURE.md', (_ctx: unknown, heading: string) => { ... });

// Section does not contain
And('the section does not contain {string}', (_ctx: unknown, text: string) => { ... });

// File line count
Then('ARCHITECTURE.md has fewer than {int} lines', (_ctx: unknown, limit: number) => { ... });
```

State interface will need a `currentFileContent: string | null` field alongside the existing
`currentSectionContent` field to support both section-level and full-file assertions in the
same test file.
