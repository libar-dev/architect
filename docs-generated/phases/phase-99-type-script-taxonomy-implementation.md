# TypeScriptTaxonomyImplementation

**Purpose:** Detailed patterns for TypeScriptTaxonomyImplementation

---

## Summary

**Progress:** [███████████░░░░░░░░░] 4/7 (57%)

| Status | Count |
| --- | --- |
| ✅ Completed | 4 |
| 🚧 Active | 0 |
| 📋 Planned | 3 |
| **Total** | 7 |

---

## 📋 Planned Patterns

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

---

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

---

### 📋 Streaming Git Diff

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 2d |
| Business Value | enable process guard on large repositories |

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

#### Dependencies

- Depends on: ProcessGuardLinter

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

---

## ✅ Completed Patterns

### ✅ Mvp Workflow Implementation

| Property | Value |
| --- | --- |
| Status | completed |
| Effort | 8h |
| Business Value | align package with pdr005 fsm |

**Problem:**
  PDR-005 defines a 4-state workflow FSM (`roadmap, active, completed, deferred`)
  but the delivery-process package validation schemas and generators may still
  reference legacy status values. Need to ensure alignment.

  **Solution:**
  Implement PDR-005 status values via taxonomy module refactor:
  1. Create taxonomy module as single source of truth (src/taxonomy/status-values.ts)
  2. Update validation schemas to import from taxonomy module
  3. Update generators to use normalizeStatus() for display bucket mapping

#### Acceptance Criteria

**Scanner extracts new status values**

- Given a feature file with @libar-docs-status:roadmap
- When the scanner processes the file
- Then the status field is "roadmap"

**All four status values are valid**

- Given a feature file with @libar-docs-status:<status>
- When validating the pattern
- Then validation passes

**Roadmap and deferred appear in ROADMAP.md**

- Given patterns with status "roadmap" or "deferred"
- When generating ROADMAP.md
- Then they appear as planned work

**Active appears in CURRENT-WORK.md**

- Given patterns with status "active"
- When generating CURRENT-WORK.md
- Then they appear as active work

**Completed appears in CHANGELOG**

- Given patterns with status "completed"
- When generating CHANGELOG-GENERATED.md
- Then they appear in the changelog

#### Business Rules

**PDR-005 status values are recognized**

_Verified by: Scanner extracts new status values, All four status values are valid_

**Generators map statuses to documents**

_Verified by: Roadmap and deferred appear in ROADMAP.md, Active appears in CURRENT-WORK.md, Completed appears in CHANGELOG_

---

### ✅ Pattern Relationship Model

| Property | Value |
| --- | --- |
| Status | completed |
| Effort | 2w |

**Problem:** The delivery process lacks a comprehensive relationship model between artifacts.
  Code files, roadmap specs, executable specs, and patterns exist but their relationships
  are implicit or limited to basic dependency tracking (`uses`, `depends-on`).

  **Solution:** Implement a relationship taxonomy inspired by UML/TML modeling practices:
  - **Realization** (`implements`) - Code realizes a pattern specification
  - **Generalization** (`extends`) - Pattern extends another pattern's capabilities
  - **Dependency** (`uses`, `used-by`) - Technical dependencies between patterns
  - **Composition** (`parent`, `level`) - Hierarchical pattern organization
  - **Traceability** (`roadmap-spec`, `executable-specs`) - Cross-tier linking

  **Business Value:**
  | Benefit | How |
  | Complete dependency graphs | All relationships rendered in Mermaid with distinct arrow styles |
  | Implementation tracking | `implements` links code stubs to roadmap specs |
  | Code-sourced documentation | Generated docs pull from both .feature files AND code stubs |
  | Impact analysis | Know what code breaks when pattern spec changes |
  | Agentic workflows | Claude can navigate from pattern to implementations and back |
  | UML-grade modeling | Professional relationship semantics enable rich tooling |

#### Acceptance Criteria

**Implements tag parsed from TypeScript**

- Given a TypeScript file with annotations:
- When the scanner processes the file
- Then the file is linked to pattern "EventStoreDurability"
- And the relationship type is "implements"
- And the file's `uses` metadata is preserved

```typescript
/**
 * @libar-docs
 * @libar-docs-implements EventStoreDurability
 * @libar-docs-status roadmap
 * @libar-docs-uses idempotentAppend, Workpool
 */
```

**Multiple patterns implemented by one file**

- Given a TypeScript file with annotations:
- When the scanner processes the file
- Then the file is linked to both "EventStoreDurability" and "IdempotentAppend"
- And both patterns list this file as an implementation

```typescript
/**
 * @libar-docs
 * @libar-docs-implements EventStoreDurability, IdempotentAppend
 */
```

**No conflict with pattern definition**

- Given a roadmap spec with `@libar-docs-pattern:EventStoreDurability`
- And a TypeScript file with `@libar-docs-implements:EventStoreDurability`
- When the generator processes both
- Then no conflict error is raised
- And the implementation file is associated with the pattern

**Multiple files implement same pattern**

- Given three TypeScript files each with `@libar-docs-implements:EventStoreDurability`
- When the generator processes all files
- Then all three are listed as implementations of "EventStoreDurability"
- And each file's metadata is preserved separately

**Extends tag parsed from feature file**

- Given a roadmap spec with:
- When the scanner processes the file
- Then the pattern "ReactiveProjections" is linked to base "ProjectionCategories"
- And the relationship type is "extends"

```gherkin
@libar-docs
@libar-docs-pattern:ReactiveProjections
@libar-docs-extends:ProjectionCategories
```

**Extended-by reverse lookup computed**

- Given pattern A with `@libar-docs-extends:B`
- When the relationship index is built
- Then pattern B's `extendedBy` includes "A"

**Circular inheritance detected**

- Given pattern A with `@libar-docs-extends:B`
- And pattern B with `@libar-docs-extends:A`
- When the linter runs
- Then an error is emitted about circular inheritance

**Uses rendered as solid arrows in graph**

- Given a pattern with `@libar-docs-uses:CommandBus,EventStore`
- When the Mermaid graph is generated
- Then solid arrows point from pattern to "CommandBus" and "EventStore"

**Used-by aggregated in pattern detail**

- Given pattern A with `@libar-docs-used-by:B,C`
- When the pattern detail page is generated
- Then the "Used By" section lists "B" and "C"

**Depends-on rendered as dashed arrows**

- When the Mermaid graph is generated
- Then a dashed arrow points from pattern to "EventStoreFoundation"

**Enables is inverse of depends-on**

- When the relationship index is built
- Then pattern B's `enables` includes "A"

**Bidirectional links established**

- Given a roadmap spec with `@libar-docs-executable-specs:platform-core/tests/features/durability`
- And a package spec with `@libar-docs-roadmap-spec:EventStoreDurability`
- When the traceability index is built
- Then the roadmap spec links forward to the package location
- And the package spec links back to the pattern

**Orphan executable spec detected**

- Given a package spec with `@libar-docs-roadmap-spec:NonExistentPattern`
- When the linter runs
- Then a warning is emitted about orphan executable spec

**Parent link validated**

- Given a phase spec with `@libar-docs-parent:ProcessEnhancements`
- And an epic spec with `@libar-docs-pattern:ProcessEnhancements`
- When the hierarchy is validated
- Then the parent link is confirmed valid

**Invalid parent detected**

- Given a task spec with `@libar-docs-parent:NonExistentEpic`
- When the linter runs
- Then an error is emitted about invalid parent reference

**Graph uses distinct arrow styles**

- Given patterns with `uses`, `depends-on`, `implements`, and `extends` relationships
- When the Mermaid graph is generated
- Then `uses` renders as solid arrows (`-->`)
- And `depends-on` renders as dashed arrows (`-.->`)
- And `implements` renders as dotted arrows (`..->`)
- And `extends` renders as solid open arrows (`-->>`)

**Pattern detail page shows all relationships**

- Given a pattern with implementations, dependencies, and tests
- When the pattern detail page is generated
- Then sections appear for "Implementations", "Dependencies", "Used By", "Tests"

**Missing relationship target detected**

- Given a file with `@libar-docs-uses:NonExistentPattern`
- When the linter runs with strict mode
- Then a warning is emitted about unresolved relationship target

**Pattern tag in implements file causes error**

- Given a file with both `@libar-docs-implements:X` and `@libar-docs-pattern:X`
- When the linter runs
- Then an error is emitted about conflicting tags
- And the message explains that implements files must not define patterns

**Asymmetric traceability detected**

- Given a roadmap spec with `@libar-docs-executable-specs:path/to/tests`
- And no package spec at that path with `@libar-docs-roadmap-spec` back-link
- When the linter runs with strict mode
- Then a warning is emitted about missing back-link

#### Business Rules

**Code files declare pattern realization via implements tag**

**Invariant:** Files with `@libar-docs-implements:PatternName,OtherPattern` are linked
    to the specified patterns without causing conflicts. Pattern definitions remain in
    roadmap specs; implementation files provide supplementary metadata. Multiple files can
    implement the same pattern, and one file can implement multiple patterns.

    **Rationale:** This mirrors UML's "realization" relationship where a class implements
    an interface. Code realizes the specification. Direction is code→spec (backward link).
    CSV format allows a single implementation file to realize multiple patterns when
    implementing a pattern family (e.g., durability primitives).

    **API:** See `src/taxonomy/registry-builder.ts`

    **Verified by:** Implements tag parsed, Multiple patterns supported, No conflict with pattern definition, Multiple implementations of same pattern

_Verified by: Implements tag parsed from TypeScript, Multiple patterns implemented by one file, No conflict with pattern definition, Multiple files implement same pattern_

**Pattern inheritance uses extends relationship tag**

**Invariant:** Files with `@libar-docs-extends:BasePattern` declare that they extend
    another pattern's capabilities. This is a generalization relationship where the
    extending pattern is a specialization of the base pattern.

    **Rationale:** Pattern families exist where specialized patterns build on base patterns.
    For example, `ReactiveProjections` extends `ProjectionCategories`. The extends
    relationship enables inheritance-based documentation and validates pattern hierarchy.

    **API:** See `src/taxonomy/registry-builder.ts`

    **Verified by:** Extends tag parsed, Extended-by computed, Inheritance chain validated

_Verified by: Extends tag parsed from feature file, Extended-by reverse lookup computed, Circular inheritance detected_

**Technical dependencies use directed relationship tags**

**Invariant:** `@libar-docs-uses` declares outbound dependencies (what this
    pattern depends on). `@libar-docs-used-by` declares inbound dependencies
    (what depends on this pattern). Both are CSV format.

    **Rationale:** These represent technical coupling between patterns. The
    distinction matters for impact analysis: changing a pattern affects its
    `used-by` consumers but not its `uses` dependencies.

    **Verified by:** Uses rendered as solid arrows, Used-by aggregated correctly

_Verified by: Uses rendered as solid arrows in graph, Used-by aggregated in pattern detail_

**Roadmap sequencing uses ordering relationship tags**

**Invariant:** `@libar-docs-depends-on` declares what must be completed first
    (roadmap sequencing). `@libar-docs-enables` declares what this unlocks when
    completed. These are planning relationships, not technical dependencies.

    **Rationale:** Sequencing is about order of work, not runtime coupling.
    A pattern may depend on another being complete without using its code.

    **Verified by:** Depends-on rendered as dashed arrows, Enables is inverse

_Verified by: Depends-on rendered as dashed arrows, Enables is inverse of depends-on_

**Cross-tier linking uses traceability tags (PDR-007)**

**Invariant:** `@libar-docs-executable-specs` on roadmap specs points to test
    locations. `@libar-docs-roadmap-spec` on package specs points back to the
    pattern. These create bidirectional traceability.

    **Rationale:** Two-tier architecture (PDR-007) separates planning specs from
    executable tests. Traceability tags maintain the connection for navigation
    and completeness checking.

    **Verified by:** Bidirectional links established, Orphan detection

_Verified by: Bidirectional links established, Orphan executable spec detected_

**Epic/Phase/Task hierarchy uses parent-child relationships**

**Invariant:** `@libar-docs-level` declares the hierarchy tier (epic, phase, task).
    `@libar-docs-parent` links to the containing pattern. This enables rollup
    progress tracking.

    **Rationale:** Large initiatives decompose into phases and tasks. The hierarchy
    allows progress aggregation (e.g., "Epic 80% complete based on child phases").

    **Verified by:** Parent link validated, Progress rollup calculated

_Verified by: Parent link validated, Invalid parent detected_

**All relationships appear in generated documentation**

**Invariant:** The PATTERNS.md dependency graph renders all relationship types
    with distinct visual styles. Pattern detail pages list all related artifacts
    grouped by relationship type.

    **Rationale:** Visualization makes the relationship model accessible. Different
    arrow styles distinguish relationship semantics at a glance.

    | Relationship | Arrow Style | Direction | Description |
    | uses | --> (solid) | OUT | Technical dependency |
    | depends-on | -.-> (dashed) | OUT | Roadmap sequencing |
    | implements | ..-> (dotted) | CODE→SPEC | Realization |
    | extends | -->> (solid open) | CHILD→PARENT | Generalization |

    **Verified by:** Graph uses distinct styles, Detail page sections

_Verified by: Graph uses distinct arrow styles, Pattern detail page shows all relationships_

**Linter detects relationship violations**

**Invariant:** The pattern linter validates that all relationship targets exist,
    implements files don't have pattern tags, and bidirectional links are consistent.

    **Rationale:** Broken relationships cause confusion and incorrect generated docs.
    Early detection during linting prevents propagation of errors.

    **Verified by:** Missing target detected, Pattern conflict detected, Asymmetric link detected

_Verified by: Missing relationship target detected, Pattern tag in implements file causes error, Asymmetric traceability detected_

---

### ✅ Process Guard Linter

| Property | Value |
| --- | --- |
| Status | completed |
| Effort | 1d |
| Business Value | prevent accidental scope creep and locked file modifications |

**Problem:**
  During planning and implementation sessions, accidental modifications occur:
  - Specs outside the intended scope get modified in bulk
  - Completed/approved work gets inadvertently changed
  - No enforcement boundary between "planning what to do" and "doing it"

  The delivery process has implicit states (planning, implementing) but no
  programmatic guard preventing invalid state transitions or out-of-scope changes.

  **Solution:**
  Implement a Decider-based linter that:
  1. Derives process state from existing file annotations (no separate state file)
  2. Validates proposed changes (git diff) against derived state
  3. Enforces file protection levels per PDR-005 state machine
  4. Supports explicit session scoping via session definition files
  5. Protects taxonomy from changes that would break protected specs

  **Design Principles:**
  - State is derived from annotations, not maintained separately
  - Decider logic is pure (no I/O), enabling unit testing
  - Integrates with existing lint infrastructure (`lint-process.ts`)
  - Warnings for soft rules, errors for hard rules
  - Escape hatch via `@libar-docs-unlock-reason` annotation

  **Relationship to PDR-005:**
  Uses the phase-state-machine FSM as protection levels:
  - `roadmap`: Fully editable, no restrictions (planning phase)
  - `active`: Scope-locked, errors on new deliverables (work in progress)
  - `completed`: Hard-locked, requires explicit unlock to modify
  - `deferred`: Fully editable, no restrictions (parked work)

#### Acceptance Criteria

**Protection level from status**

- Given a feature file with @libar-docs-status:<status>
- When deriving protection level
- Then protection level is "<protection>"
- And modification restriction is "<restriction>"

**Completed file modification without unlock fails**

- Given a feature file with @libar-docs-status:completed
- When modifying the file without @libar-docs-unlock-reason
- Then linting fails with "completed-protection" violation
- And message is "Cannot modify completed spec without unlock reason"

**Completed file modification with unlock passes**

- Given a feature file with @libar-docs-status:completed
- Then linting passes
- And warning indicates "Modifying completed spec: Critical bug fix"

**Active file modification is allowed but scope-locked**

- Given a feature file with @libar-docs-status:active
- When modifying existing content
- Then linting passes
- But adding new deliverables triggers scope-creep violation

**Session file defines modification scope**

- Given a session file with @libar-docs-session-id:S-2026-01-09
- And session status is "active"
- And in-scope specs are:
- When deriving process state
- Then session "S-2026-01-09" is active
- And "mvp-workflow-implementation" is modifiable
- And "short-form-tag-migration" is review-only

| spec | intent |
| --- | --- |
| mvp-workflow-implementation | modify |
| short-form-tag-migration | review |

**Modifying spec outside active session scope warns**

- Given session "S-2026-01-09" is active with scoped specs:
- When modifying "phase-state-machine.feature"
- Then linting warns with "session-scope"
- And message contains "not in session scope"
- And suggestion is "Add to session scope or use --ignore-session flag"

| spec |
| --- |
| mvp-workflow-implementation |

**Modifying explicitly excluded spec fails**

- Given session "S-2026-01-09" explicitly excludes "cross-source-validation"
- When modifying "cross-source-validation.feature"
- Then linting fails with "session-excluded" violation
- And message is "Spec explicitly excluded from session S-2026-01-09"

**No active session allows all modifications**

- Given no session file exists with status "active"
- When modifying any spec file
- Then session scope rules do not apply
- And only protection level rules are checked

**Valid status transitions**

- Given a spec with current @libar-docs-status:<from>
- When changing status to <to>
- Then transition validation passes

**Invalid status transitions**

- Given a spec with current @libar-docs-status:<from>
- When changing status to <to>
- Then linting fails with "invalid-status-transition" violation
- And message indicates valid transitions from "<from>"

**Adding deliverable to active spec fails**

- Given a spec with @libar-docs-status:active
- And existing deliverables:
- When adding new deliverable "Task C"
- Then linting fails with "scope-creep" violation
- And message is "Cannot add deliverables to active spec"
- And suggestion is "Create new spec or revert to roadmap status"

| Deliverable | Status |
| --- | --- |
| Task A | complete |
| Task B | pending |

**Updating deliverable status in active spec passes**

- Given a spec with @libar-docs-status:active
- And existing deliverables:
- When changing Task A status to "Done"
- Then linting passes

| Deliverable | Status |
| --- | --- |
| Task A | pending |

**Removing deliverable from active spec warns**

- Given a spec with @libar-docs-status:active
- When removing a deliverable row
- Then linting warns with "deliverable-removed"
- And message is "Deliverable removed from active spec - was it completed or descoped?"

**Validate staged changes (pre-commit default)**

- When running "pnpm lint:process --staged"
- Then only git-staged files are validated
- And exit code is 1 if violations exist

**Validate all tracked files**

- When running "pnpm lint:process --all"
- Then all delivery-process files are validated
- And summary shows total violations and warnings

**Show derived state for debugging**

- When running "pnpm lint:process --show-state"
- Then output includes:

| Section | Content |
| --- | --- |
| Active Session | Session ID and status, or "none" |
| Scoped Specs | List of specs in scope |
| Protected Specs | Specs with active/completed status |

**Strict mode treats warnings as errors**

- When running "pnpm lint:process --staged --strict"
- Then warnings are promoted to errors
- And exit code is 1 if any warnings exist

**Ignore session flag bypasses session rules**

- Given an active session with limited scope
- When running "pnpm lint:process --staged --ignore-session"
- Then session scope rules are skipped
- And only protection level rules apply

**Output format matches lint-patterns**

- When lint-process reports violations
- Then output format is consistent with lint-patterns output
- And includes file path, rule name, message, and suggestion

**Can run alongside lint-patterns**

- When running "pnpm lint:all"
- Then both lint:patterns and lint:process execute
- And combined exit code reflects both results

**Session-related tags are recognized**

- Given the taxonomy includes session tags
- Then the following tags are valid:

| Tag | Format | Purpose |
| --- | --- | --- |
| session-id | value | Unique session identifier |
| session-status | enum | Session lifecycle: draft, active, closed |
| session-scope | flag | Marks file as session definition |

**Protection-related tags are recognized**

- Given the taxonomy includes protection tags
- Then the following tags are valid:

| Tag | Format | Purpose |
| --- | --- | --- |
| unlock-reason | quoted-value | Required to modify protected files |
| locked-by | value | Session ID that locked the file |

#### Business Rules

**Protection levels determine modification restrictions**

Files inherit protection from their `@libar-docs-status` tag. Higher
    protection levels require explicit unlock to modify.

_Verified by: Protection level from status, Completed file modification without unlock fails, Completed file modification with unlock passes, Active file modification is allowed but scope-locked_

**Session definition files scope what can be modified**

Optional session files (`delivery-process/sessions/*.feature`) explicitly
    declare which specs are in-scope for modification during a work session.
    When active, modifications outside scope trigger warnings or errors.

_Verified by: Session file defines modification scope, Modifying spec outside active session scope warns, Modifying explicitly excluded spec fails, No active session allows all modifications_

**Status transitions follow PDR-005 FSM**

When a file's status changes, the transition must be valid per PDR-005.
    This extends phase-state-machine.feature to the linter context.

_Verified by: Valid status transitions, Invalid status transitions_

**Active specs cannot add new deliverables**

Once a spec transitions to `active`, its deliverables table is
    considered scope-locked. Adding new rows indicates scope creep.

_Verified by: Adding deliverable to active spec fails, Updating deliverable status in active spec passes, Removing deliverable from active spec warns_

**CLI provides flexible validation modes**

_Verified by: Validate staged changes (pre-commit default), Validate all tracked files, Show derived state for debugging, Strict mode treats warnings as errors, Ignore session flag bypasses session rules_

**Integrates with existing lint infrastructure**

_Verified by: Output format matches lint-patterns, Can run alongside lint-patterns_

**New tags support process guard functionality**

The following tags are defined in the TypeScript taxonomy to support process guard:

_Verified by: Session-related tags are recognized, Protection-related tags are recognized_

---

### ✅ TypeScript Taxonomy Implementation

| Property | Value |
| --- | --- |
| Status | completed |
| Effort | 4h |
| Business Value | compile time taxonomy protection |

As a delivery-process developer
  I want taxonomy defined in TypeScript with Zod integration
  So that I get compile-time safety and runtime validation

  **Note (D12):** Implementation uses TypeScript as the single source of truth,
  with consumers importing directly rather than generating intermediate JSON files.

#### Acceptance Criteria

**Define status values as TypeScript constant**

- Given a file "src/taxonomy/status-values.ts"
- When I define the status values
- Then it exports PROCESS_STATUS_VALUES as const array
- And it exports ProcessStatusValue type inferred from the array
- And Zod schemas use z.enum() with the constant

**Invalid status value caught at compile time**

- Given code that uses ProcessStatusValue type
- When I assign an invalid value like "draft"
- Then TypeScript compilation fails
- And the error message shows valid options

**Status values match registry purpose**

- Given the package-level taxonomy
- Then PROCESS_STATUS_VALUES contains ["roadmap", "active", "completed", "deferred"]
- And the repo-level taxonomy follows PDR-005 FSM

**Define format types as TypeScript constant**

- Given a file "src/taxonomy/format-types.ts"
- When I define the format types
- Then it exports FORMAT_TYPES as const array
- And it exports FormatType type

```markdown
["value", "enum", "quoted-value", "csv", "number", "flag"]
```

**Define categories as typed array**

- Given a file "src/taxonomy/categories.ts"
- When I define the default categories
- Then each category has tag, domain, priority, description, aliases
- And categories are typed as CategoryDefinition[]
- And category tags can be extracted as a union type (CategoryTag)

**Category satisfies CategoryDefinitionSchema**

- Given a category definition in TypeScript
- When validated against CategoryDefinitionSchema
- Then it passes runtime validation
- And the TypeScript type matches the Zod inference

**Define metadata tags with typed format**

- Given the registry-builder.ts file
- When I define a metadata tag with format "enum"
- Then the values property is provided
- And the values reference TypeScript constants
- And TypeScript enforces type consistency

**Metadata tag with invalid format rejected**

- Given a metadata tag definition
- When format is "enum" but values is missing
- Then Zod runtime validation fails
- And TypeScript provides partial compile-time checking

**Build registry from TypeScript constants**

- Given all taxonomy constants are defined
- When buildRegistry() is called
- Then it returns a valid TagRegistry
- And it uses imported constants for all values
- And the result passes TagRegistrySchema validation

**Registry builder is the single source**

- Given the registry builder function
- When createDefaultTagRegistry() is called
- Then it delegates to buildRegistry()
- And no hardcoded values exist outside taxonomy/

**MetadataTagDefinitionSchema uses FORMAT_TYPES**

- Given the updated validation schema
- When defining the format field
- Then it uses z.enum(FORMAT_TYPES) not hardcoded strings
- And changes to FORMAT_TYPES propagate automatically

**Status field validation uses constant**

- Given a pattern with status field
- When validated against schema
- Then the schema references PROCESS_STATUS_VALUES
- And invalid status values are rejected

**IDE autocomplete for status values**

- Given code that accepts ProcessStatusValue parameter
- When typing the argument
- Then IDE shows autocomplete with all valid values
- And TypeScript inference provides the options

**Refactoring propagates changes**

- Given a status value "roadmap" in constants
- When I rename it to "planned" using IDE refactor
- Then all TypeScript usages are updated automatically

**buildRegistry returns expected structure**

- Given the taxonomy module
- When buildRegistry() is called
- Then it returns the expected TagRegistry structure
- And all existing generators work without modification

---

[← Back to Roadmap](../ROADMAP.md)
