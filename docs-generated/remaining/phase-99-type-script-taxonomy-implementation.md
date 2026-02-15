# TypeScriptTaxonomyImplementation - Remaining Work

**Purpose:** Detailed remaining work for TypeScriptTaxonomyImplementation

---

## Summary

**Progress:** [█████████░░░░░░░░░░░] 4/9 (44%)

**Remaining:** 5 patterns (0 active, 5 planned)

---

## ✅ Ready to Start

These patterns can be started immediately:

| Pattern | Effort | Business Value |
| --- | --- | --- |
| 📋 Config Based Workflow Definition | 2h | eliminate broken workflow loading |
| 📋 Prd Implementation Section | 3d | - |
| 📋 Status Aware Eslint Suppression | 2d | - |
| 📋 Streaming Git Diff | 2d | enable process guard on large repositories |
| 📋 Test Content Blocks | - | test what generators capture |

---

## All Remaining Patterns

### 📋 Config Based Workflow Definition

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 2h |
| Business Value | eliminate broken workflow loading |
| Dependencies | MvpWorkflowImplementation |

**Problem:**
  Every `pnpm process:query` and `pnpm docs:*` invocation prints:
  `Failed to load default workflow (6-phase-standard): Workflow file not found`

  The `loadDefaultWorkflow()` function resolves to `catalogue/workflows/`
  which does not exist. The directory was deleted during monorepo extraction.
  The system already degrades gracefully (workflow = undefined), but the
  warning is noise for both human CLI use and future hook consumers (HUD).

  The old `6-phase-standard.json` conflated three concerns:
  - Taxonomy vocabulary (status names) — already in `src/taxonomy/`
  - FSM behavior (transitions) — already in `src/validation/fsm/`
  - Workflow structure (phases) — orphaned, no proper home

  **Solution:**
  Inline the default workflow as a constant in `workflow-loader.ts`, built
  from canonical taxonomy values. Make `loadDefaultWorkflow()` synchronous.
  Preserve `loadWorkflowFromPath()` for custom `--workflow <file>` overrides.

  The workflow definition uses only the 4 canonical statuses from ADR-001
  (roadmap, active, completed, deferred) — not the stale 5-status set from
  the deleted JSON (which included non-canonical `implemented` and `partial`).

  Phase definitions (Inception, Elaboration, Session, Construction,
  Validation, Retrospective) move from a missing JSON file to an inline
  constant, making the default workflow always available without file I/O.

  Design Decisions (DS-1, 2026-02-15):

  | ID | Decision | Rationale |
  | DD-1 | Inline constant in workflow-loader.ts, not preset integration | Minimal correct fix, zero type regression risk. Preset integration deferred. |
  | DD-2 | Constant satisfies existing WorkflowConfig type | Reuse createLoadedWorkflow() from workflow-config.ts. No new types needed. |
  | DD-3 | Remove dead code: getCatalogueWorkflowsPath, loadWorkflowConfig, DEFAULT_WORKFLOW_NAME | Dead since monorepo extraction. Public API break is safe (function always threw). |
  | DD-4 | loadDefaultWorkflow() returns LoadedWorkflow synchronously | Infallible constant needs no async or error handling. |
  | DD-5 | Amend ADR-001 with canonical phase definitions | Phase names are canonical values; fits existing governance in ADR-001. |

#### Acceptance Criteria

**Default workflow loads without warning**

- Given the delivery-process package with no workflow JSON file
- When the process-api runs an overview command
- Then no workflow warning appears in output
- And the overview displays progress, active phases, and blocking info

**Workflow constant uses canonical statuses only**

- Given the inline DEFAULT_WORKFLOW_CONFIG constant
- Then it defines exactly 4 statuses: roadmap, active, completed, deferred
- And it defines 6 phases with order 1 through 6
- And each status name exists in PROCESS_STATUS_VALUES from taxonomy

**Custom workflow file overrides default**

- Given a project with workflowPath set to a custom JSON file
- When the orchestrator loads workflow configuration
- Then it uses the custom workflow from the file path
- And the default inline workflow is not used

#### Business Rules

**Default workflow is built from an inline constant**

**Invariant:** `loadDefaultWorkflow()` returns a `LoadedWorkflow` without
    file system access. It cannot fail. The default workflow constant uses
    only canonical status values from `src/taxonomy/status-values.ts`.

    **Rationale:** The file-based loading path (`catalogue/workflows/`) has
    been dead code since monorepo extraction. Both callers (orchestrator,
    process-api) already handle the failure gracefully, proving the system
    works without it. Making the function synchronous and infallible removes
    the try-catch ceremony and the warning noise.

    **Verified by:** Default workflow loads without warning,
    Workflow constant uses canonical statuses only

    Implementation approach:

    | Step | Change | Impact |
    | Add DEFAULT_WORKFLOW_CONFIG constant | WorkflowConfig literal with 4 statuses, 6 phases | New code in workflow-loader.ts |
    | Change loadDefaultWorkflow() to sync | Returns createLoadedWorkflow(DEFAULT_WORKFLOW_CONFIG) | Signature: Promise to sync |
    | Remove dead code paths | Delete getCatalogueWorkflowsPath, loadWorkflowConfig, DEFAULT_WORKFLOW_NAME, dead imports | workflow-loader.ts cleanup |
    | Remove loadWorkflowConfig from public API | Update src/config/index.ts exports | Breaking change (safe: function always threw) |
    | Update orchestrator call site | Remove await and try-catch (lines 410-418) | orchestrator.ts |
    | Update process-api call site | Remove await and try-catch (lines 549-555) | process-api.ts |

_Verified by: Default workflow loads without warning, Workflow constant uses canonical statuses only_

**Custom workflow files still work via --workflow flag**

**Invariant:** `loadWorkflowFromPath()` remains available for projects
    that need custom workflow definitions. The `--workflow <file>` CLI flag
    and `workflowPath` config field continue to work.

    **Rationale:** The inline default replaces file-based *default* loading,
    not file-based *custom* loading. Projects may define custom phases or
    additional statuses via JSON files.

    **Verified by:** Custom workflow file overrides default

_Verified by: Custom workflow file overrides default_

**FSM validation and Process Guard are not affected**

**Invariant:** The FSM transition matrix, protection levels, and Process
    Guard rules remain hardcoded in `src/validation/fsm/` and
    `src/lint/process-guard/`. They do not read from `LoadedWorkflow`.

    **Rationale:** FSM and workflow are separate concerns. FSM enforces
    status transitions (4-state model from PDR-005). Workflow defines phase
    structure (6-phase USDP). The workflow JSON declared `transitionsTo` on
    its statuses, but no code ever read those values — the FSM uses its own
    `VALID_TRANSITIONS` constant. This separation is correct and intentional.

    Blast radius analysis confirmed zero workflow imports in:
    - src/validation/fsm/ (4 files)
    - src/lint/process-guard/ (5 files)
    - src/taxonomy/ (all files)

**Workflow as a configurable preset field is deferred**

Adding `workflow` as a field on `DeliveryProcessConfig` (presets) and
    `DeliveryProcessProjectConfig` (project config) is a natural next step
    but NOT required for the MVP fix.

    The inline constant in `workflow-loader.ts` resolves the warning. Moving
    workflow into the preset/config system enables:
    - Different presets with different default phases (e.g., 3-phase generic)
    - Per-project phase customization in delivery-process.config.ts
    - Phase definitions appearing in generated documentation

    See ideation artifact for design options:
    delivery-process/ideations/2026-02-15-workflow-config-and-fsm-extensibility.feature

### 📋 Prd Implementation Section

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 3d |

**Problem:** Implementation files with `@libar-docs-implements:PatternName` contain rich
  relationship metadata (`@libar-docs-uses`, `@libar-docs-used-by`, `@libar-docs-usecase`)
  that is not rendered in generated PRD documentation. This metadata provides valuable API
  guidance and dependency information.

  **Solution:** Extend the PRD generator to collect all files with `@libar-docs-implements:X`
  and render their metadata in a dedicated "## Implementations" section. This leverages the
  relationship model from PatternRelationshipModel without requiring specs to list file paths.

  **Business Value:**
  | Benefit | How |
  | PRDs include implementation context | `implements` files auto-discovered and rendered |
  | Dependency visibility | `uses`/`used-by` from implementations shown in PRD |
  | Usage guidance in docs | `usecase` annotations rendered as "When to Use" |
  | Zero manual sync | Code declares relationship, PRD reflects it |

#### Acceptance Criteria

**Implementations discovered from relationship index**

- Given a roadmap spec with `@libar-docs-pattern:EventStoreDurability`
- And three TypeScript files with `@libar-docs-implements:EventStoreDurability`
- When the PRD generator processes the pattern
- Then all three implementation files are discovered
- And no directory path is needed in the spec

**Multiple implementations aggregated**

- Given pattern "EventStoreDurability" with implementations:
- When the PRD generator runs
- Then the "## Implementations" section lists both files
- And each file's metadata is rendered separately

| File | Uses | Usecase |
| --- | --- | --- |
| outbox.ts | Workpool, ActionRetrier | "Capture external results" |
| idempotentAppend.ts | EventStore | "Prevent duplicate events" |

**Implementations section generated in PRD**

- Given a pattern with implementation files
- When the PRD generator runs
- Then the output includes "## Implementations"
- And each file is listed with its relative path

**Dependencies rendered per implementation**

- Given implementation file with `@libar-docs-uses EventStore, Workpool`
- When rendered in PRD
- Then output includes "**Dependencies:** EventStore, Workpool"

**Usecases rendered as guidance**

- Given implementation file with `@libar-docs-usecase "When event append must survive failures"`
- When rendered in PRD
- Then output includes "**When to Use:** When event append must survive failures"

**Used-by rendered for visibility**

- Given implementation file with `@libar-docs-used-by CommandOrchestrator, SagaEngine`
- When rendered in PRD
- Then output includes "**Used By:** CommandOrchestrator, SagaEngine"

**Section omitted when no implementations exist**

- Given a pattern "FuturePattern" with status "roadmap"
- And no files have `@libar-docs-implements:FuturePattern`
- When the PRD generator runs
- Then the output does not include "## Implementations"

#### Business Rules

**PRD generator discovers implementations from relationship index**

**Invariant:** When generating PRD for pattern X, the generator queries the
    relationship index for all files where `implements === X`. No explicit listing
    in the spec file is required.

    **Rationale:** The `@libar-docs-implements` tag creates a backward link from
    code to spec. The relationship index aggregates these. PRD generation simply
    queries the index rather than scanning directories.

    **Verified by:** Implementations discovered, Multiple files aggregated

_Verified by: Implementations discovered from relationship index, Multiple implementations aggregated_

**Implementation metadata appears in dedicated PRD section**

**Invariant:** The PRD output includes a "## Implementations" section listing
    all files that implement the pattern. Each file shows its `uses`, `usedBy`,
    and `usecase` metadata in a consistent format.

    **Rationale:** Developers reading PRDs benefit from seeing the implementation
    landscape alongside requirements, without cross-referencing code files.

    **Verified by:** Section generated, Dependencies rendered, Usecases rendered

_Verified by: Implementations section generated in PRD, Dependencies rendered per implementation, Usecases rendered as guidance, Used-by rendered for visibility_

**Patterns without implementations render cleanly**

**Invariant:** If no files have `@libar-docs-implements:X` for pattern X,
    the "## Implementations" section is omitted (not rendered as empty).

    **Rationale:** Planned patterns may not have implementations yet. Empty
    sections add noise without value.

    **Verified by:** Section omitted when empty

_Verified by: Section omitted when no implementations exist_

### 📋 Status Aware Eslint Suppression

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 2d |

**Problem:**
  Design artifacts (code stubs with `@libar-docs-status roadmap`) intentionally have unused
  exports that define API shapes before implementation. Current workaround uses directory-based
  ESLint exclusions which:
  - Don't account for status transitions (roadmap -> active -> completed)
  - Create tech debt when implementations land (exclusions persist)
  - Require manual maintenance as files move between statuses

  **Solution:**
  Extend the Process Guard Linter infrastructure with an ESLint integration that:
  1. Reads `@libar-docs-status` from file-level JSDoc comments
  2. Maps status to protection level using existing `deriveProcessState()`
  3. Generates dynamic ESLint configuration or filters messages at runtime
  4. Removes the need for directory-based exclusions entirely

  **Why It Matters:**
  | Benefit | How |
  | Automatic lifecycle handling | Files graduating from roadmap to completed automatically get strict linting |
  | Zero maintenance | No manual exclusion updates when files change status |
  | Consistency with Process Guard | Same status extraction logic, same protection level mapping |
  | Tech debt elimination | Removes ~20 lines of directory-based exclusions from eslint.config.js |

#### Acceptance Criteria

**Roadmap file has relaxed unused-vars rules**

- Given a TypeScript file with JSDoc containing:
- When ESLint processes the file with the status-aware processor
- Then unused exports "ReservationResult" and "reserve" are NOT reported as errors
- And if reported, severity is "warn" not "error"

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern ReservationPattern
 * @libar-docs-status roadmap
 */
export interface ReservationResult {
  reservationId: string;
}

export function reserve(): void {
  throw new Error("Not implemented");
}
```

**Completed file has strict unused-vars rules**

- Given a TypeScript file with JSDoc containing:
- When ESLint processes the file with the status-aware processor
- Then unused exports "CMSState" ARE reported as errors
- And severity is "error"

```typescript
/**
 * @libar-docs
 * @libar-docs-pattern CMSDualWrite
 * @libar-docs-status completed
 */
export interface CMSState {
  id: string;
}
```

**File without status tag has strict rules**

- Given a TypeScript file without any @libar-docs-status tag
- When ESLint processes the file with the status-aware processor
- Then unused exports ARE reported as errors
- And the default strict configuration applies

**Protection level matches Process Guard derivation**

- Given a file with @libar-docs-status:roadmap
- When Process Guard derives protection level
- And ESLint processor derives protection level
- Then both return "none"

**Status-to-protection mapping is consistent**

- Given the following status values:
- When ESLint processor maps each status
- Then all mappings match Process Guard behavior

| Status | Expected Protection |
| --- | --- |
| roadmap | none |
| deferred | none |
| active | scope |
| complete | hard |

**Processor filters messages in postprocess**

- Given ESLint reports these messages for a roadmap file:
- When the status-aware processor runs postprocess
- Then messages are filtered out (removed) or downgraded to severity 1 (warn)

| ruleId | severity | message |
| --- | --- | --- |
| @typescript-eslint/no-unused-vars | 2 | 'ReservationResult' is defined but never used |
| @typescript-eslint/no-unused-vars | 2 | 'reserve' is defined but never used |

**No source code modification occurs**

- Given a TypeScript file with @libar-docs-status:roadmap
- When the processor runs
- Then file content on disk is unchanged
- And no eslint-disable comments are present in the file

**Non-relaxed rules pass through unchanged**

- Given a roadmap file with a non-unused-vars error:
- When the status-aware processor runs postprocess
- Then the no-explicit-any error is preserved unchanged

| ruleId | severity | message |
| --- | --- | --- |
| @typescript-eslint/no-explicit-any | 2 | Unexpected any |

**CLI generates ESLint ignore file list**

- Given the codebase contains files with statuses:
- When running "pnpm lint:process --eslint-ignores"
- Then output includes "src/dcb/execute.ts"
- And output includes "src/dcb/types.ts"
- And output does NOT include "src/cms/dual-write.ts"
- And output format is glob patterns suitable for eslint.config.js

| File | Status |
| --- | --- |
| src/dcb/execute.ts | roadmap |
| src/dcb/types.ts | roadmap |
| src/cms/dual-write.ts | complete |

**JSON output mode for programmatic consumption**

- When running "pnpm lint:process --eslint-ignores --json"
- Then output is valid JSON
- And JSON contains array of file paths with protection level "none"

**Directory exclusions are removed after migration**

- Given the status-aware processor is integrated
- When reviewing eslint.config.js
- Then lines 30-57 (directory-based exclusions) are removed
- And the processor handles all status-based suppression

**Existing roadmap files still pass lint**

- Given roadmap files that previously relied on directory exclusions:
- When running "pnpm lint" after migration
- Then files pass lint (no unused-vars errors)
- And files have @libar-docs-status:roadmap annotations

| File |
| --- |
| delivery-process/stubs/reservation-pattern/reservation-pattern.ts |
| delivery-process/stubs/durability-types/durability-types.ts |

**Default configuration relaxes no-unused-vars**

- Given the processor is used with default configuration
- When processing a roadmap file
- Then @typescript-eslint/no-unused-vars is relaxed
- And all other rules are strict

**Custom rules can be configured for relaxation**

- Given processor configuration:
- When processing a roadmap file with empty interfaces
- Then both rules are relaxed for the file

```javascript
statusAwareProcessor({
  relaxedRules: [
    "@typescript-eslint/no-unused-vars",
    "@typescript-eslint/no-empty-interface",
  ],
})
```

#### Business Rules

**File status determines unused-vars enforcement**

**Invariant:** Files with `@libar-docs-status roadmap` or `deferred` have relaxed
    unused-vars rules. Files with `active`, `completed`, or no status have strict enforcement.

    **Rationale:** Design artifacts (roadmap stubs) define API shapes that are intentionally
    unused until implementation. Relaxing rules for these files prevents false positives
    while ensuring implemented code (active/completed) remains strictly checked.

    | Status | Protection Level | unused-vars Behavior |
    | roadmap | none | Relaxed (warn, ignore args) |
    | deferred | none | Relaxed (warn, ignore args) |
    | active | scope | Strict (error) |
    | complete | hard | Strict (error) |
    | (no status) | N/A | Strict (error) |

    **Verified by:** Roadmap file has relaxed rules, Completed file has strict rules, No status file has strict rules

_Verified by: Roadmap file has relaxed unused-vars rules, Completed file has strict unused-vars rules, File without status tag has strict rules_

**Reuses deriveProcessState for status extraction**

**Invariant:** Status extraction logic must be shared with Process Guard Linter.
    No duplicate parsing or status-to-protection mapping.

    **Rationale:** DRY principle - the Process Guard already has battle-tested status
    extraction from JSDoc comments. Duplicating this logic creates maintenance burden
    and potential inconsistencies between tools.

    **Current State:**

```typescript
// Process Guard already has this:
    import { deriveProcessState } from "../lint/process-guard/index.js";

    const state = await deriveProcessState(ctx, files);
    // state.files.get(path).protection -> "none" | "scope" | "hard"
```

**Target State:**

```typescript
// ESLint integration reuses the same logic:
    import { getFileProtectionLevel } from "../lint/process-guard/index.js";

    const protection = getFileProtectionLevel(filePath);
    // protection === "none" -> relax unused-vars
    // protection === "scope" | "hard" -> strict unused-vars
```

**Verified by:** Protection level from Process Guard, Consistent status mapping

_Verified by: Protection level matches Process Guard derivation, Status-to-protection mapping is consistent_

**ESLint Processor filters messages based on status**

**Invariant:** The processor uses ESLint's postprocess hook to filter or downgrade
    messages. Source code is never modified. No eslint-disable comments are injected.

    **Rationale:** ESLint processors can inspect and filter linting messages after rules
    run. This approach:
    - Requires no source code modification
    - Works with any ESLint rule (not just no-unused-vars)
    - Can be extended to other status-based behaviors

    **Verified by:** Processor filters in postprocess, No source modification

_Verified by: Processor filters messages in postprocess, No source code modification occurs, Non-relaxed rules pass through unchanged_

**CLI can generate static ESLint ignore list**

**Invariant:** Running `pnpm lint:process --eslint-ignores` outputs a list of files
    that should have relaxed linting, suitable for inclusion in eslint.config.js.

    **Rationale:** For CI environments or users preferring static configuration, a
    generated list provides an alternative to runtime processing. The list can be
    regenerated whenever status annotations change.

    **Verified by:** CLI generates file list, List includes only relaxed files

_Verified by: CLI generates ESLint ignore file list, JSON output mode for programmatic consumption_

**Replaces directory-based ESLint exclusions**

**Invariant:** After implementation, the directory-based exclusions in eslint.config.js
    (lines 30-57) are removed. All suppression is driven by @libar-docs-status annotations.

    **Rationale:** Directory-based exclusions are tech debt:
    - They don't account for file lifecycle (roadmap -> completed)
    - They require manual updates when new roadmap directories are added
    - They persist even after files are implemented

    **Current State (to be removed):**

```javascript
// eslint.config.js - directory-based exclusions pattern
    {
      files: [
        "**/delivery-process/stubs/**",
        // ... patterns for roadmap/deferred files
      ],
      rules: {
        "@typescript-eslint/no-unused-vars": ["warn", { args: "none" }],
      },
    }
```

**Target State:**

```javascript
// eslint.config.js
    import { statusAwareProcessor } from "@libar-dev/delivery-process/eslint";

    {
      files: ["**/*.ts", "**/*.tsx"],
      processor: statusAwareProcessor,
      // OR use generated ignore list:
      // files: [...generatedRoadmapFiles],
    }
```

**Verified by:** Directory exclusions removed, Processor integration added

_Verified by: Directory exclusions are removed after migration, Existing roadmap files still pass lint_

**Rule relaxation is configurable**

**Invariant:** The set of rules relaxed for roadmap/deferred files is configurable,
    defaulting to `@typescript-eslint/no-unused-vars`.

    **Rationale:** Different projects may want to relax different rules for design
    artifacts. The default covers the common case (unused exports in API stubs).

    **Verified by:** Default rules are relaxed, Custom rules can be configured

_Verified by: Default configuration relaxes no-unused-vars, Custom rules can be configured for relaxation_

### 📋 Streaming Git Diff

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 2d |
| Business Value | enable process guard on large repositories |
| Dependencies | ProcessGuardLinter |

**Problem:**
  The process guard (`lint-process --all`) fails with `ENOBUFS` error on large
  repositories. The current implementation uses `execSync` which buffers the
  entire `git diff` output in memory. When comparing against `main` in repos
  with hundreds of changed files, the diff output can exceed Node.js buffer
  limits (~1MB default), causing the pipe to overflow.

  This prevents using `--all` mode in CI/CD pipelines for production repositories.

  **Solution:**
  Replace synchronous buffered git execution with streaming approach:

  1. Use `spawn` instead of `execSync` for git diff commands
  2. Process diff output line-by-line as it streams
  3. Extract status transitions and deliverable changes incrementally
  4. Never hold full diff content in memory

  **Design Principles:**
  - Constant memory usage regardless of diff size
  - Same validation results as current implementation
  - Backward compatible - no CLI changes required
  - Async/await API for streaming operations

  **Scope:**
  Only `detect-changes.ts` requires modification. The `deriveProcessState`
  and validation logic remain unchanged - they receive the same data structures.

#### Acceptance Criteria

**Large diff does not cause memory overflow**

- Given a repository with 500+ changed files since main
- And total diff size exceeds 10MB
- When running "lint-process --all"
- Then command completes without ENOBUFS error
- And memory usage stays below 50MB

**Streaming produces same results as buffered**

- Given a repository with known status transitions
- When comparing streaming vs buffered implementation
- Then detected status transitions are identical
- And detected deliverable changes are identical

**Status transitions detected incrementally**

- Given a streaming diff with status changes in multiple files
- When processing the stream line-by-line
- Then status transitions are detected as each file section completes
- And results accumulate into final ChangeDetection structure

**Deliverable changes detected incrementally**

- Given a streaming diff with DataTable modifications
- When processing the stream line-by-line
- Then deliverable additions and removals are tracked per file
- And correlation (modification detection) happens at end of file section

**Git command failure returns Result error**

- Given git command exits with non-zero code
- When stream processing completes
- Then Result.err is returned with error message
- And partial results are discarded

**Malformed diff lines are skipped**

- Given a diff stream with unexpected line format
- When parsing encounters malformed line
- Then line is skipped without throwing
- And processing continues with next line

#### Business Rules

**Git commands stream output instead of buffering**

_Verified by: Large diff does not cause memory overflow, Streaming produces same results as buffered_

**Diff content is parsed as it streams**

_Verified by: Status transitions detected incrementally, Deliverable changes detected incrementally_

**Streaming errors are handled gracefully**

_Verified by: Git command failure returns Result error, Malformed diff lines are skipped_

### 📋 Test Content Blocks

| Property | Value |
| --- | --- |
| Status | planned |
| Business Value | test what generators capture |

This feature demonstrates what content blocks are captured and rendered
  by the PRD generator. Use this as a reference for writing rich specs.

  **Overview**

  The delivery process supports **rich Markdown** in descriptions:
  - Bullet points work
  - *Italics* and **bold** work
  - `inline code` works

  **Custom Section**

  You can create any section you want using bold headers.
  This content will appear in the PRD Description section.

#### Acceptance Criteria

**Scenario with DocString for rich content**

- Given a system in initial state
- When the user provides the following configuration:
- Then the system accepts the configuration

```markdown
**Configuration Details**

This DocString contains **rich Markdown content** that will be
rendered in the Acceptance Criteria section.

- Option A: enabled
- Option B: disabled

Use DocStrings when you need multi-line content blocks.
```

**Scenario with DataTable for structured data**

- Given the following user permissions:
- When the user attempts an action
- Then access is granted based on permissions

| Permission | Level | Description |
| --- | --- | --- |
| read | basic | Can view resources |
| write | elevated | Can modify resources |
| admin | full | Can manage all settings |

**Simple scenario under second rule**

- Given a precondition
- When an action occurs
- Then the expected outcome happens

**Scenario with examples table**

- Given a value of <input>
- When processed
- Then the result is <output>

#### Business Rules

**Business rules appear as a separate section**

Rule descriptions provide context for why this business rule exists.
    You can include multiple paragraphs here.

    This is a second paragraph explaining edge cases or exceptions.

_Verified by: Scenario with DocString for rich content, Scenario with DataTable for structured data_

**Multiple rules create multiple Business Rule entries**

Each Rule keyword creates a separate entry in the Business Rules section.
    This helps organize complex features into logical business domains.

_Verified by: Simple scenario under second rule, Scenario with examples table_

---

[← Back to Remaining Work](../REMAINING-WORK.md)
