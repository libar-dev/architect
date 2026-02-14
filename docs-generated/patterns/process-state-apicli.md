# ✅ Process State API CLI

**Purpose:** Detailed documentation for the Process State API CLI pattern

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Category | DDD |
| Phase | 24 |

## Description

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

## Implementations

Files that implement this pattern:

- [`process-api.ts`](../../src/cli/process-api.ts) - ## process-api - CLI Query Interface to ProcessStateAPI
- [`process-state-api.feature`](../../tests/features/api/process-state-api.feature) - Programmatic interface for querying delivery process state.
- [`process-api.feature`](../../tests/features/cli/process-api.feature) - Command-line interface for querying delivery process state via ProcessStateAPI.

## Acceptance Criteria

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

## Business Rules

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

[← Back to Pattern Registry](../PATTERNS.md)
