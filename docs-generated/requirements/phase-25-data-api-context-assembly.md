# ✅ Data API Context Assembly

**Purpose:** Detailed requirements for the Data API Context Assembly feature

---

## Overview

| Property | Value |
| --- | --- |
| Status | completed |
| Product Area | DeliveryProcess |
| Business Value | replace explore agents with one command |
| Phase | 25 |

## Description

**Problem:**
  Starting a Claude Code design or implementation session requires assembling
  30-100KB of curated, multi-source context from hundreds of annotated files.
  Today this requires either manual context compilation by the user or 5-10
  explore agents burning context and time. The delivery-process pipeline already
  has rich data (MasterDataset with archIndex, relationshipIndex, byPhase,
  byStatus views) but no command combines data from multiple indexes around
  a focal pattern into a compact, session-oriented context bundle.

  **Solution:**
  Add context assembly subcommands that answer "what should I read next?"
  rather than "what data exists?":
  1. `context <pattern>` assembles metadata + spec path + stub paths +
     dependency chain + related patterns into ~1.5KB of file paths
  2. `files <pattern>` returns only file paths organized by relevance
  3. `dep-tree <pattern>` walks dependency chains recursively with status
  4. `overview` gives executive project summary
  5. Session type tailoring via `--session planning|design|implement`

  Implementation readiness checks (`scope-validate`) live in DataAPIDesignSessionSupport.

  **Business Value:**
  | Benefit | Impact |
  | Replace 5-10 explore agents | One command provides curated context |
  | 1.5KB vs 100KB context | 98% reduction in context assembly tokens |
  | Session-type tailoring | Right context for the right workflow |
  | Dependency chain visibility | Know blocking status before starting |

## Acceptance Criteria

**Assemble design session context**

- Given a pattern "AgentLLMIntegration" with dependencies and stubs
- When running "process-api context AgentLLMIntegration --session design"
- Then the output contains the pattern metadata section
- And the output contains the spec file path
- And the output contains dependency stubs with target paths
- And the output contains consumer specs for outside-in validation
- And the output contains the architecture neighborhood
- And the output contains the dependency chain with status markers

**Assemble planning session context**

- Given a pattern "AgentLLMIntegration" with dependencies
- When running "process-api context AgentLLMIntegration --session planning"
- Then the output contains pattern metadata and status
- And the output contains the dependency chain with status
- And the output does NOT contain stubs or architecture details
- And the output is under 500 bytes

**Assemble implementation session context**

- Given a pattern "ProcessGuardLinter" with completed deliverables
- When running "process-api context ProcessGuardLinter --session implement"
- Then the output contains the spec file path
- And the output contains the deliverables checklist with status
- And the output contains FSM state and valid transitions
- And the output contains test file locations

**Context for nonexistent pattern returns error with suggestion**

- Given a pattern "AgentLLMIntegration" exists
- When running "process-api context NonExistentPattern --session design"
- Then the command fails with a pattern-not-found error
- And the error message suggests similar pattern names

**File reading list with related patterns**

- Given a pattern "OrderSaga" with uses and usedBy relationships
- When running "process-api files OrderSaga --related"
- Then the output lists primary files first
- And the output lists completed dependency files
- And the output lists architecture neighbor files
- And each file path is relative to the base directory

**File reading list without related patterns**

- Given a pattern "OrderSaga" exists
- When running "process-api files OrderSaga"
- Then the output lists only the primary spec and stub files
- And no dependency or neighbor files are included

**Files for pattern with no resolvable paths returns minimal output**

- Given a pattern "MinimalPattern" with no stubs or dependencies
- When running "process-api files MinimalPattern --related"
- Then the output lists only the primary spec file
- And the completed, roadmap, and neighbor sections are empty

**Dependency tree with status markers**

- Given a dependency chain: A (completed) -> B (completed) -> C (roadmap)
- When running "process-api dep-tree C --status"
- Then the output shows the tree with completion markers
- And completed dependencies are marked as such
- And the focal pattern is highlighted

**Dependency tree with depth limit**

- Given a deep dependency chain with 5 levels
- When running "process-api dep-tree C --depth 2"
- Then the output shows at most 2 levels of dependencies
- And truncated branches are indicated

**Dependency tree handles circular dependencies safely**

- Given patterns A depends on B and B depends on A
- When running "process-api dep-tree A"
- Then the output shows the cycle without infinite recursion
- And the visited node is marked to indicate a cycle

**Multi-pattern context merges dependencies**

- Given patterns "AgentLLM" and "AgentCommand" sharing dependency "AgentBC"
- When running "process-api context AgentLLM AgentCommand --session design"
- Then shared dependencies appear once with a "shared" marker
- And unique dependencies are listed per pattern
- And the combined context is smaller than two separate calls

**Multi-pattern context with one invalid name reports error**

- Given a pattern "AgentLLM" exists but "InvalidName" does not
- When running "process-api context AgentLLM InvalidName --session design"
- Then the command fails with a pattern-not-found error for "InvalidName"
- And no partial context is returned

**Executive overview**

- Given 36 completed, 3 active, and 30 planned patterns
- When running "process-api overview"
- Then the output shows "69 patterns (36 completed, 3 active, 30 planned) = 52%"
- And the output lists active phases with counts
- And the output shows blocking relationships

**Overview with empty pipeline returns zero-state summary**

- Given the pipeline has 0 patterns
- When running "process-api overview"
- Then the output shows "0 patterns (0 completed, 0 active, 0 planned) = 0%"
- And the active phases section is empty
- And the blocking section is empty

## Business Rules

**Context command assembles curated context for a single pattern**

**Invariant:** Given a pattern name, `context` returns everything needed to
    start working on that pattern: metadata, file locations, dependency status,
    and architecture position -- in ~1.5KB of structured text.

    **Rationale:** This is the core value proposition. The command crosses five
    gaps simultaneously: it assembles data from multiple MasterDataset indexes,
    shapes it compactly, resolves file paths from pattern names, discovers stubs
    by convention, and tailors output by session type.

    **Assembly steps:**
    1. Find pattern in MasterDataset via `getPattern()`
    2. Resolve spec file from `pattern.filePath`
    3. Find stubs via `implementedBy` in relationshipIndex
    4. Walk `dependsOn` chain with status for each dependency
    5. Find consumers via `usedBy`
    6. Get architecture neighborhood from `archIndex.byContext`
    7. Resolve all references to file paths
    8. Format as structured text sections

    **Session type tailoring:**
    | Session | Includes | Typical Size |
    | planning | Brief + deps + status | ~500 bytes |
    | design | Spec + stubs + deps + architecture + consumers | ~1.5KB |
    | implement | Spec + stubs + deliverables + FSM + tests | ~1KB |

    **Verified by:** Design session context, Planning session context, Implementation context

_Verified by: Assemble design session context, Assemble planning session context, Assemble implementation session context, Context for nonexistent pattern returns error with suggestion_

**Files command returns only file paths organized by relevance**

**Invariant:** `files` returns the most token-efficient output possible --
    just file paths that Claude Code can read directly.

    **Rationale:** Most context tokens are spent reading actual files, not
    metadata. The `files` command tells Claude Code *which* files to read,
    organized by importance. Claude Code then reads what it needs. This is
    more efficient than `context` when the agent already knows the pattern
    and just needs the file list.

    **Organization:**
    | Section | Contents |
    | Primary | Spec file, stub files |
    | Dependencies (completed) | Implementation files of completed deps |
    | Dependencies (roadmap) | Spec files of incomplete deps |
    | Architecture neighbors | Same-context patterns |

    **Verified by:** Files with related patterns, Files without related

_Verified by: File reading list with related patterns, File reading list without related patterns, Files for pattern with no resolvable paths returns minimal output_

**Dep-tree command shows recursive dependency chain with status**

**Invariant:** The dependency tree walks both `dependsOn`/`enables` (planning)
    and `uses`/`usedBy` (implementation) relationships with configurable depth.

    **Rationale:** Before starting work on a pattern, agents need to know the
    full dependency chain: what must be complete first, what this unblocks, and
    where the current pattern sits in the sequence. A tree visualization with
    status markers makes blocking relationships immediately visible.

    **Output format:**
    ```
    AgentAsBoundedContext (22, completed)
      -> AgentBCComponentIsolation (22a, completed)
           -> AgentLLMIntegration (22b, roadmap)
                -> [*] AgentCommandInfrastructure (22c, roadmap) <- YOU ARE HERE
                     -> AgentChurnRiskCompletion (22d, roadmap)
    ```

    **Verified by:** Dep-tree with status, Dep-tree with depth limit

_Verified by: Dependency tree with status markers, Dependency tree with depth limit, Dependency tree handles circular dependencies safely_

**Context command supports multiple patterns with merged output**

**Invariant:** Multi-pattern context deduplicates shared dependencies and
    highlights overlap between patterns.

    **Rationale:** Design sessions often span multiple related patterns
    (e.g., reviewing DS-2 through DS-5 together). Separate `context` calls
    would duplicate shared dependencies. Merged context shows the union of
    all dependencies with overlap analysis.

    **Verified by:** Multi-pattern context

_Verified by: Multi-pattern context merges dependencies, Multi-pattern context with one invalid name reports error_

**Overview provides executive project summary**

**Invariant:** `overview` returns project-wide health in one command.

    **Rationale:** Planning sessions start with "where are we?" This command
    answers that question without needing to run multiple queries and mentally
    aggregate results. Implementation readiness checks for specific patterns
    live in DataAPIDesignSessionSupport's `scope-validate` command.

    **Overview output** (uses normalizeStatus display aliases: planned = roadmap + deferred):
    | Section | Content |
    | Progress | N patterns (X completed, Y active, Z planned) = P% |
    | Active phases | Currently in-progress phases with pattern counts |
    | Blocking | Patterns that cannot proceed due to incomplete deps |

    **Verified by:** Executive overview

_Verified by: Executive overview, Overview with empty pipeline returns zero-state summary_

## Deliverables

- ContextBundle type (complete)
- Context assembler (complete)
- context subcommand (complete)
- files subcommand (complete)
- dep-tree subcommand (complete)
- overview subcommand (complete)
- Context text renderer (complete)

## Implementations

Files that implement this pattern:

- [`context-assembler.ts`](../../delivery-process/stubs/data-api-context-assembly/context-assembler.ts) - ## ContextAssembler — Session-Oriented Context Bundle Builder
- [`context-formatter.ts`](../../delivery-process/stubs/data-api-context-assembly/context-formatter.ts) - ## ContextFormatter — Plain Text Renderer for Context Bundles
- [`context-assembler.ts`](../../src/api/context-assembler.ts) - ## ContextAssembler — Session-Oriented Context Bundle Builder
- [`context-formatter.ts`](../../src/api/context-formatter.ts) - ## ContextFormatter — Plain Text Renderer for Context Bundles

---

[← Back to Product Requirements](../PRODUCT-REQUIREMENTS.md)
