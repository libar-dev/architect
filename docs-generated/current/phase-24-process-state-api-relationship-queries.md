# ProcessStateAPIRelationshipQueries

**Purpose:** Active work details for ProcessStateAPIRelationshipQueries

---

## Progress

**Progress:** [░░░░░░░░░░░░░░░░░░░░] 0/2 (0%)

| Status | Count |
| --- | --- |
| ✅ Completed | 0 |
| 🚧 Active | 2 |
| 📋 Planned | 0 |
| **Total** | 2 |

---

## 🚧 Active Work

### 🚧 Process State API CLI

| Property | Value |
| --- | --- |
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

#### Deliverables

- ✅ process:query CLI command (complete)
- ✅ CLI argument parser (complete)
- ✅ JSON output formatter (complete)
- ⏸️ Text output formatter (deferred)
- ✅ Root package.json script (complete)
- ✅ CLAUDE.md documentation update (complete)

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

---

### 🚧 Process State API Relationship Queries

| Property | Value |
| --- | --- |
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

#### Deliverables

- 🔄 Implementation relationship queries (superseded)
- 🔄 Inheritance hierarchy queries (superseded)
- ✅ ProcessStateAPI type extensions (complete)
- 🔄 Relationship query step definitions (superseded)

#### Acceptance Criteria

**Query implementations for a pattern**

- Given a pattern "ProcessGuardLinter" exists
- And files implement this pattern:
- When querying getImplementations("ProcessGuardLinter")
- Then the result should contain both file paths
- And the result should be sorted alphabetically

| File | Via Tag |
| --- | --- |
| src/lint/process-guard/decider.ts | @libar-docs-implements:ProcessGuardLinter |
| src/lint/process-guard/derive-state.ts | @libar-docs-implements:ProcessGuardLinter |

**Query implemented patterns for a file**

- Given a file "decider.ts" with tag "@libar-docs-implements:ProcessGuardLinter, ProcessGuardDecider"
- When querying getImplementedPatterns("decider.ts")
- Then the result should contain ["ProcessGuardLinter", "ProcessGuardDecider"]

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

---

[← Back to Current Work](../CURRENT-WORK.md)
