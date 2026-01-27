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
| 📋 Prd Implementation Section | 3d | - |
| 📋 Process State API CLI | 2d | direct api queries for planning |
| 📋 Process State API Relationship Queries | 3d | - |
| 📋 Status Aware Eslint Suppression | 2d | - |
| 📋 Streaming Git Diff | 2d | enable process guard on large repositories |

---

## All Remaining Patterns

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

### 📋 Process State API CLI

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 2d |
| Business Value | direct api queries for planning |

**Problem:**
  The ProcessStateAPI provides 27 typed query methods for efficient state queries, but
  Claude Code sessions cannot use it directly:
  - Import paths require built packages with correct ESM resolution
  - No CLI command exposes the API for shell invocation
  - Current workaround requires regenerating markdown docs and reading them
  - Documentation claims API is "directly usable" but practical usage is blocked

  **Solution:**
  Add a CLI command `pnpm process:query` that exposes key ProcessStateAPI methods:
  - `--status active|roadmap|completed` - Filter patterns by status
  - `--phase N` - Get patterns in specific phase
  - `--progress` - Show completion percentage and counts
  - `--current-work` - Show active patterns (shorthand for --status active)
  - `--roadmap-items` - Show available items (roadmap + deferred)
  - `--format text|json` - Output format (default: text, json for AI parsing)

  **Business Value:**
  | Benefit | Impact |
  | AI-native planning | Claude Code can query state in one command vs reading markdown |
  | Reduced context usage | JSON output is 5-10x smaller than generated docs |
  | Real-time accuracy | Queries source directly, no stale documentation |
  | Session efficiency | "What's next?" answered in 100ms vs 10s regeneration |
  | Completes API promise | Makes CLAUDE.md documentation accurate |

#### Acceptance Criteria

**Query active patterns**

- Given feature files with patterns in various statuses
- When running "pnpm process:query --status active"
- Then output shows only patterns with status "active"
- And each pattern shows name, phase, and categories

**Query roadmap items**

- Given feature files with roadmap and deferred patterns
- When running "pnpm process:query --roadmap-items"
- Then output shows patterns with status "roadmap" or "deferred"
- And output excludes completed and active patterns

**Query completed patterns with limit**

- Given many completed patterns
- When running "pnpm process:query --status completed --limit 5"
- Then output shows at most 5 patterns
- And patterns are sorted by completion recency

**Query patterns in a specific phase**

- Given patterns in Phase 18 with various statuses
- When running "pnpm process:query --phase 18"
- Then output shows all patterns tagged with phase 18
- And each pattern shows its status

**Query phase progress**

- Given Phase 18 with 3 completed and 2 roadmap patterns
- When running "pnpm process:query --phase 18 --progress"
- Then output shows "Phase 18: 3/5 complete (60%)"
- And output lists pattern names by status

**List all phases**

- Given patterns across phases 14, 18, 19, 20, 21, 22
- When running "pnpm process:query --phases"
- Then output shows each phase with pattern count
- And phases are sorted numerically

**Overall progress summary**

- Given 62 completed, 3 active, 26 planned patterns
- When running "pnpm process:query --progress"
- Then output shows:

```markdown
Overall Progress: 62/91 (68%)

Status Counts:
  Completed: 62
  Active: 3
  Planned: 26
```

**Status distribution with percentages**

- Given patterns in various statuses
- When running "pnpm process:query --distribution"
- Then output shows each status with count and percentage
- And percentages sum to 100%

**JSON output format**

- Given active patterns exist
- When running "pnpm process:query --current-work --format json"
- Then output is valid JSON
- And JSON contains array of pattern objects
- And each pattern has: name, status, phase, categories

**Text output format (default)**

- Given active patterns exist
- When running "pnpm process:query --current-work"
- Then output is human-readable text
- And patterns are formatted in a table

**Invalid format flag**

- When running "pnpm process:query --format xml"
- Then command exits with error
- And error message suggests valid formats: text, json

**Lookup pattern by name**

- Given a pattern "DurableFunctionAdapters" exists
- When running "pnpm process:query --pattern DurableFunctionAdapters"
- Then output shows pattern name, status, phase
- And output shows categories and description

**Query pattern deliverables**

- Given a pattern with 4 deliverables
- When running "pnpm process:query --pattern EventStoreDurability --deliverables"
- Then output shows each deliverable with status and location

**Pattern not found**

- Given no pattern named "NonExistent"
- When running "pnpm process:query --pattern NonExistent"
- Then command exits with error
- And error message says "Pattern 'NonExistent' not found"
- And suggests using --status roadmap to see available patterns

**Help output shows all flags**

- When running "pnpm process:query --help"
- Then output lists all available flags
- And each flag has a description
- And common use cases are shown as examples

**Help shows examples**

- When running "pnpm process:query --help"
- Then output includes example commands:

```markdown
Examples:
  pnpm process:query --current-work              # What's active?
  pnpm process:query --roadmap-items             # What can I start?
  pnpm process:query --phase 18 --progress       # Phase 18 status
  pnpm process:query --pattern DCB --deliverables # Pattern details
  pnpm process:query --progress --format json    # For AI parsing
```

#### Business Rules

**CLI supports status-based pattern queries**

**Invariant:** Every ProcessStateAPI status query method is accessible via CLI.

    **Rationale:** The most common planning question is "what's the current state?"
    Status queries (active, roadmap, completed) answer this directly without reading docs.
    Without CLI access, Claude Code must regenerate markdown and parse unstructured text.

    | Flag | API Method | Use Case |
    | --status active | getCurrentWork() | "What am I working on?" |
    | --status roadmap | getRoadmapItems() | "What can I start next?" |
    | --status completed | getRecentlyCompleted() | "What's done recently?" |
    | --current-work | getCurrentWork() | Shorthand for active |
    | --roadmap-items | getRoadmapItems() | Shorthand for roadmap |

    **API:** See `@libar-dev/delivery-process/src/cli/query-state.ts`

    **Verified by:** Query active patterns, Query roadmap items, Query completed patterns with limit

_Verified by: Query active patterns, Query roadmap items, Query completed patterns with limit_

**CLI supports phase-based queries**

**Invariant:** Patterns can be filtered by phase number.

    **Rationale:** Phase 18 (Event Durability) is the current focus per roadmap priorities.
    Quick phase queries help assess progress and remaining work within a phase.
    Phase-based planning is the primary organization method for roadmap work.

    | Flag | API Method | Use Case |
    | --phase N | getPatternsByPhase(N) | "What's in Phase 18?" |
    | --phase N --progress | getPhaseProgress(N) | "How complete is Phase 18?" |
    | --phases | getAllPhases() | "List all phases with counts" |

    **API:** See `@libar-dev/delivery-process/src/cli/query-state.ts`

    **Verified by:** Query patterns in a specific phase, Query phase progress, List all phases

_Verified by: Query patterns in a specific phase, Query phase progress, List all phases_

**CLI provides progress summary queries**

**Invariant:** Overall and per-phase progress is queryable in a single command.

    **Rationale:** Planning sessions need quick answers to "where are we?" without
    reading the full PATTERNS.md generated file. Progress metrics drive prioritization
    and help identify where to focus effort.

    | Flag | API Method | Use Case |
    | --progress | getStatusCounts() + getCompletionPercentage() | Overall progress |
    | --distribution | getStatusDistribution() | Detailed status breakdown |

    **API:** See `@libar-dev/delivery-process/src/cli/query-state.ts`

    **Verified by:** Overall progress summary, Status distribution with percentages

_Verified by: Overall progress summary, Status distribution with percentages_

**CLI supports multiple output formats**

**Invariant:** JSON output is parseable by AI agents without transformation.

    **Rationale:** Claude Code can parse JSON directly. Text format is for human reading.
    JSON format enables scripting and integration with other tools. The primary use case
    is AI agent parsing where structured output reduces context and errors.

    | Flag | Output | Use Case |
    | --format text | Human-readable tables | Terminal usage |
    | --format json | Structured JSON | AI agent parsing, scripting |

    **API:** See `@libar-dev/delivery-process/src/cli/formatters/`

    **Verified by:** JSON output format, Text output format (default), Invalid format flag

_Verified by: JSON output format, Text output format (default), Invalid format flag_

**CLI supports individual pattern lookup**

**Invariant:** Any pattern can be queried by name with full details.

    **Rationale:** During implementation, Claude Code needs to check specific pattern
    status, deliverables, and dependencies without reading the full spec file.
    Pattern lookup is essential for focused implementation work.

    | Flag | API Method | Use Case |
    | --pattern NAME | getPattern(name) | "Show DCB pattern details" |
    | --pattern NAME --deliverables | getPatternDeliverables(name) | "What needs to be built?" |
    | --pattern NAME --deps | getPatternDependencies(name) | "What does this depend on?" |

    **API:** See `@libar-dev/delivery-process/src/cli/query-state.ts`

    **Verified by:** Lookup pattern by name, Query pattern deliverables, Pattern not found

_Verified by: Lookup pattern by name, Query pattern deliverables, Pattern not found_

**CLI provides discoverable help**

**Invariant:** All flags are documented via --help with examples.

    **Rationale:** Claude Code can read --help output to understand available queries
    without needing external documentation. Self-documenting CLIs reduce the need
    for Claude Code to read additional context files.

    **API:** See `@libar-dev/delivery-process/src/cli/query-state.ts`

    **Verified by:** Help output shows all flags, Help shows examples

_Verified by: Help output shows all flags, Help shows examples_

### 📋 Process State API Relationship Queries

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 3d |

**Problem:** ProcessStateAPI currently supports dependency queries (`uses`, `usedBy`, `dependsOn`,
  `enables`) but lacks implementation relationship queries. Claude Code cannot ask "what code
  implements this pattern?" or "what pattern does this file implement?"

  **Solution:** Extend ProcessStateAPI with relationship query methods that leverage the new
  `implements`/`extends` tags from PatternRelationshipModel:
  - Bidirectional traceability: spec → code and code → spec
  - Inheritance hierarchy navigation: base → specializations
  - Implementation discovery: pattern → implementing files

  **Business Value:**
  | Benefit | How |
  | Reduced context usage | Query exact relationships vs reading multiple files |
  | Faster exploration | "Show implementations" in one call vs grep + read |
  | Accurate traceability | Real-time from source annotations, not stale docs |

#### Acceptance Criteria

**Query implementations for a pattern**

- Given a pattern "EventStoreDurability" exists
- And files implement this pattern:
- When querying getImplementations("EventStoreDurability")
- Then the result should contain both file paths
- And the result should be sorted alphabetically

| File | Via Tag |
| --- | --- |
| deps/libar-dev-packages/packages/platform/store/src/outbox.ts | @libar-docs-implements:EventStoreDurability |
| deps/libar-dev-packages/packages/platform/store/src/append.ts | @libar-docs-implements:EventStoreDurability |

**Query implemented patterns for a file**

- Given a file "outbox.ts" with tag "@libar-docs-implements:EventStoreDurability, IdempotentAppend"
- When querying getImplementedPatterns("outbox.ts")
- Then the result should contain ["EventStoreDurability", "IdempotentAppend"]

**Query implementations for pattern with none**

- Given a pattern "FuturePattern" with no implementations
- When querying getImplementations("FuturePattern")
- Then the result should be an empty array

**Query extensions for a base pattern**

- Given patterns with inheritance:
- When querying getExtensions("ProjectionCategories")
- Then the result should contain ["ReactiveProjections", "CachedProjections"]

| Pattern | Extends |
| --- | --- |
| ProjectionCategories | (none) |
| ReactiveProjections | ProjectionCategories |
| CachedProjections | ProjectionCategories |

**Query base pattern**

- Given a pattern "ReactiveProjections" that extends "ProjectionCategories"
- When querying getBasePattern("ReactiveProjections")
- Then the result should be "ProjectionCategories"

**Full inheritance chain**

- Given patterns:
- When querying getInheritanceChain("ReactiveProjections")
- Then the result should be ["ReactiveProjections", "ProjectionCategories", "BaseProjection"]

| Pattern | Extends |
| --- | --- |
| BaseProjection | (none) |
| ProjectionCategories | BaseProjection |
| ReactiveProjections | ProjectionCategories |

**Get all relationships for a pattern**

- Given a pattern "DCB" with:
- When querying getAllRelationships("DCB")
- Then the result should include all relationship types
- And each type should have its values populated

| Relationship | Values |
| --- | --- |
| uses | CMSDualWrite, CommandBus |
| usedBy | CommandOrchestrator |
| implementedBy | dcb-executor.ts |
| extends | (none) |

**Filter patterns by relationship existence**

- Given multiple patterns with varying relationships
- When querying getPatternsWithImplementations()
- Then only patterns with non-empty implementedBy should be returned

**Check traceability status for well-linked pattern**

- Given a pattern "DCB" with:
- When querying getTraceabilityStatus("DCB")
- Then hasSpecs should be true
- And hasImplementations should be true
- And isSymmetric should be true

| Attribute | Value |
| --- | --- |
| executableSpecs | platform-core/tests/features/behavior/dcb |
| implementedBy | dcb-executor.ts, dcb-state.ts |

**Detect broken traceability links**

- Given patterns with asymmetric links:
- When querying getBrokenLinks()
- Then the result should include "PatternA" (missing implementations)
- And the result should include "PatternB" (missing specs)
- And the result should NOT include "PatternC"

| Pattern | Has executableSpecs | Has implementedBy |
| --- | --- | --- |
| PatternA | Yes | No |
| PatternB | No | Yes |
| PatternC | Yes | Yes |

#### Business Rules

**API provides implementation relationship queries**

**Invariant:** Every pattern with `implementedBy` entries is discoverable via the API.

    **Rationale:** Claude Code needs to navigate from abstract patterns to concrete code.
    Without this, exploration requires manual grep + file reading, wasting context tokens.

    | Query | Returns | Use Case |
    | getImplementations(pattern) | File paths implementing the pattern | "Show me the code for EventStoreDurability" |
    | getImplementedPatterns(file) | Patterns the file implements | "What patterns does outbox.ts implement?" |
    | hasImplementations(pattern) | boolean | Filter patterns with/without implementations |

    **Verified by:** Query implementations for pattern, Query implemented patterns for file

_Verified by: Query implementations for a pattern, Query implemented patterns for a file, Query implementations for pattern with none_

**API provides inheritance hierarchy queries**

**Invariant:** Pattern inheritance chains are fully navigable in both directions.

    **Rationale:** Patterns form specialization hierarchies (e.g., ReactiveProjections extends
    ProjectionCategories). Claude Code needs to understand what specializes a base pattern
    and what a specialized pattern inherits from.

    | Query | Returns | Use Case |
    | getExtensions(pattern) | Patterns extending this one | "What specializes ProjectionCategories?" |
    | getBasePattern(pattern) | Pattern this extends (or null) | "What does ReactiveProjections inherit from?" |
    | getInheritanceChain(pattern) | Full chain to root | "Show full hierarchy for CachedProjections" |

    **Verified by:** Query extensions, Query base pattern, Full inheritance chain

_Verified by: Query extensions for a base pattern, Query base pattern, Full inheritance chain_

**API provides combined relationship views**

**Invariant:** All relationship types are accessible through a unified interface.

    **Rationale:** Claude Code often needs the complete picture: dependencies AND implementations
    AND inheritance. A single call reduces round-trips and context switching.

    **API:** See `@libar-dev/delivery-process/src/api/process-state.ts`

    **Verified by:** Get all relationships, Filter by relationship type

_Verified by: Get all relationships for a pattern, Filter patterns by relationship existence_

**API supports bidirectional traceability queries**

**Invariant:** Navigation from spec to code and code to spec is symmetric.

    **Rationale:** Traceability is bidirectional by definition. If a spec links to code,
    the code should link back to the spec. The API should surface broken links.

    | Query | Returns | Use Case |
    | getTraceabilityStatus(pattern) | {hasSpecs, hasImplementations, isSymmetric} | Audit traceability completeness |
    | getBrokenLinks() | Patterns with asymmetric traceability | Find missing back-links |

    **Verified by:** Check traceability status, Detect broken links

_Verified by: Check traceability status for well-linked pattern, Detect broken traceability links_

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
| completed | hard |

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
| src/cms/dual-write.ts | completed |

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
| deps/libar-dev-packages/packages/platform/core/src/dcb/execute-with-dcb.ts |
| deps/libar-dev-packages/packages/platform/core/src/durability/types.ts |

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
    | completed | hard | Strict (error) |
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
// eslint.config.js lines 30-57
    {
      files: [
        "**/deps/libar-dev-packages/packages/platform/core/src/dcb/**",
        "**/deps/libar-dev-packages/packages/platform/core/src/durability/**",
        "**/deps/libar-dev-packages/packages/platform/core/src/ecst/**",
        // ... 7 more patterns
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

---

[← Back to Remaining Work](../REMAINING-WORK.md)
