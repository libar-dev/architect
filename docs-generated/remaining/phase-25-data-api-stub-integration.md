# DataAPIStubIntegration - Remaining Work

**Purpose:** Detailed remaining work for DataAPIStubIntegration

---

## Summary

**Progress:** [██████████░░░░░░░░░░] 5/10 (50%)

**Remaining:** 5 patterns (1 active, 4 planned)

---

## 🚧 In Progress

| Pattern | Effort | Business Value |
| --- | --- | --- |
| 🚧 Pattern Helpers Tests | - | - |

---

## ✅ Ready to Start

These patterns can be started immediately:

| Pattern | Effort | Business Value |
| --- | --- | --- |
| 📋 Claude Module Generation | 1.5d | automated claude md modules from source |
| 📋 Data API CLI Ergonomics | 2d | fast interactive cli for repeated queries |
| 📋 Data API Platform Integration | 3d | native claude code integration and monorepo support |
| 📋 Data API Relationship Graph | 2d | deep dependency analysis and health checks |

---

## All Remaining Patterns

### 📋 Claude Module Generation

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 1.5d |
| Business Value | automated claude md modules from source |
| Dependencies | ArchitectureDiagramGeneration |

**Problem:** CLAUDE.md modules are hand-written markdown files that drift from source
  code over time. When behavior specs or implementation details change, module content
  becomes stale. Manual synchronization is tedious and error-prone. Different consumers
  need different detail levels (compact for AI context, detailed for human reference).

  **Solution:** Generate CLAUDE.md modules directly from behavior spec feature files using
  dedicated `claude-*` tags. The same source generates both:
  - Compact modules for `_claude-md/` (AI context optimized)
  - Detailed documentation for `docs/` (human reference, progressive disclosure)

  Three tags control module generation:
  - `@libar-docs-claude-module` - Module identifier (becomes filename)
  - `@libar-docs-claude-section` - Target section directory in `_claude-md/`
  - `@libar-docs-claude-tags` - Tags for variation filtering in modular-claude-md

  **Why It Matters:**
  | Benefit | How |
  | Single source of truth | Behavior specs ARE the module content |
  | Always-current modules | Generated on each docs build |
  | Progressive disclosure | Same source → compact module + detailed docs |
  | Preserves Rule structure | `Rule:` blocks become module sections |
  | Extracts decision tables | `Scenario Outline Examples:` become lookup tables |
  | CLI integration | `pnpm docs:claude-modules` via generator registry |

  **Prototype Example:**
  The Process Guard behavior spec (`tests/features/validation/process-guard.feature`)
  generates both `_claude-md/delivery-process/process-guard.md` and detailed docs.

#### Acceptance Criteria

**Tag registry contains claude-module**

- Given the tag registry is loaded
- When querying for tag "claude-module"
- Then the tag should exist
- And the tag format should be "value"
- And the tag purpose should contain "filename"

**Tag registry contains claude-section**

- Given the tag registry is loaded
- When querying for tag "claude-section"
- Then the tag should exist
- And the tag format should be "enum"
- And the tag should have values including "core", "delivery-process", "testing", "infrastructure"

**Tag registry contains claude-tags**

- Given the tag registry is loaded
- When querying for tag "claude-tags"
- Then the tag should exist
- And the tag format should be "csv"
- And the tag purpose should contain "variation filtering"

**Extract claude-module from feature tags**

- Given a feature file with tags:
- When the Gherkin extractor processes the file
- Then the pattern should have claudeModule "process-guard"

```gherkin
@libar-docs-claude-module:process-guard
@libar-docs-claude-section:delivery-process
Feature: Process Guard
```

**Extract claude-section from feature tags**

- Given a feature file with tags:
- When the Gherkin extractor processes the file
- Then the pattern should have claudeSection "testing"

```gherkin
@libar-docs-claude-module:fsm-validator
@libar-docs-claude-section:testing
Feature: FSM Validator
```

**Extract claude-tags as array**

- Given a feature file with tags:
- When the Gherkin extractor processes the file
- Then the pattern should have claudeTags ["core-mandatory", "delivery-process", "platform-packages"]

```gherkin
@libar-docs-claude-tags:core-mandatory,delivery-process,platform-packages
Feature: Multi-tag Example
```

**Patterns without claude tags are not module candidates**

- Given a feature file without claude-module tag
- When the Gherkin extractor processes the file
- Then the pattern should have claudeModule undefined
- And the pattern should not be included in module generation

**Feature description becomes module introduction**

- Given a feature file with description:
- When generating the claude module
- Then the module should start with "### Process Guard"
- And the module should contain the Problem section
- And the module should contain the Solution section

```gherkin
Feature: Process Guard
  Pure validation for enforcing delivery process rules.

  **Problem:**
  - Completed specs modified without unlock reason
  - Invalid status transitions

  **Solution:**
  - checkProtectionLevel() enforces unlock-reason
  - checkStatusTransitions() validates FSM
```

**Rule blocks become module sections**

- Given a feature file with rules:
- When generating the claude module
- Then the module should contain "#### Completed files require unlock-reason to modify"
- And the module should contain the invariant statement
- And the module should contain the rationale

```gherkin
Rule: Completed files require unlock-reason to modify

  **Invariant:** Modification of completed spec requires explicit unlock.

  **Rationale:** Prevents accidental changes to approved work.
```

**Scenario Outline Examples become decision tables**

- Given a feature file with scenario outline:
- When generating the claude module
- Then the module should contain a markdown table with headers "status" and "protection"
- And the table should have 3 data rows

```gherkin
Scenario Outline: Protection level from status
  Given a file with status "<status>"
  Then protection level is "<protection>"

  Examples:
    | status    | protection |
    | completed | hard       |
    | active    | scope      |
    | roadmap   | none       |
```

**Scenarios without Examples tables are not extracted**

- Given a feature file with only simple scenarios (no Examples)
- When generating the claude module
- Then the scenarios are not included in output
- And only Rule descriptions and Examples tables appear

**Module uses correct heading levels**

- Given a pattern with claude-module "process-guard"
- When generating the claude module
- Then the module title should use "###" (H3)
- And rule sections should use "####" (H4)

**Tables from rule descriptions are preserved**

- Given a rule with embedded markdown table:
- When generating the claude module
- Then the table should appear in output unchanged

```markdown
| From | To | Valid |
| roadmap | active | Yes |
| roadmap | complete | No |
```

**Code blocks in descriptions are preserved**

- Given a feature description with code block:
- When generating the claude module
- Then the code block should appear in output with language tag

````markdown
```bash
pnpm lint-process --staged
```
````

**See-also link to full documentation is included**

- Given a pattern with claude-module "process-guard"
- And the fullDocsPath option is "docs/PROCESS-GUARD.md"
- When generating the claude module
- Then the module should end with "**See:** [Full Documentation](docs/PROCESS-GUARD.md)"

**Output path uses section as directory**

- Given a pattern with:
- And output directory is "_claude-md"
- When the generator runs
- Then file should be written to "_claude-md/delivery-process/process-guard.md"

| Tag | Value |
| --- | --- |
| claude-module | process-guard |
| claude-section | delivery-process |

**Multiple modules generated from single run**

- Given patterns with different claude-section values:
- When the generator runs
- Then 3 module files should be created
- And "_claude-md/delivery-process/process-guard.md" should exist
- And "_claude-md/testing/fsm-validator.md" should exist
- And "_claude-md/testing/layer-inference.md" should exist

| Pattern | claude-module | claude-section |
| --- | --- | --- |
| ProcessGuard | process-guard | delivery-process |
| FsmValidator | fsm-validator | testing |
| LayerInference | layer-inference | testing |

**Generator skips patterns without claude-module tag**

- Given 5 patterns where only 2 have claude-module tags
- When the generator runs
- Then only 2 module files should be created
- And non-claude patterns should be ignored

**Generator creates section directories if missing**

- Given claude-section "new-section" does not exist
- When generating a module with claude-section "new-section"
- Then directory "_claude-md/new-section" should be created
- And the module file should be written inside it

**Generator is registered with name "claude-modules"**

- Given the generator registry
- When listing available generators
- Then "claude-modules" should be in the list

**CLI command generates modules**

- When running:
- Then command exits successfully
- And module files are written to _claude-md subdirectories

```bash
generate-docs \
  --features 'tests/features/behavior/**/*.feature' \
  --generators claude-modules \
  --output _claude-md
```

**Generator supports fullDocsPath option**

- When running with option "--full-docs-path docs/"
- Then generated modules include See-also links with that path prefix

**Detailed mode includes scenario descriptions**

- Given detailLevel is "detailed"
- When generating documentation
- Then individual scenario titles should appear
- And scenario steps should be summarized

**Summary mode produces compact output for modules**

- Given detailLevel is "summary"
- When generating the claude module
- Then only Rules and Examples tables should appear
- And individual scenarios should be omitted

**Standard mode is default for module generation**

- Given no detailLevel is specified
- When generating the claude module
- Then output should use standard detail level
- And Rules with Invariant/Rationale should appear
- And Examples tables should appear

#### Business Rules

**Claude module tags exist in the tag registry**

**Invariant:** Three claude-specific tags (`claude-module`, `claude-section`,
    `claude-tags`) must exist in the tag registry with correct format and values.

    **Rationale:** Module generation requires metadata to determine output path,
    section placement, and variation filtering. Standard tag infrastructure enables
    consistent extraction via the existing Gherkin parser.

    **Verified by:** Tag registry contains claude-module, Tag registry contains
    claude-section, Tag registry contains claude-tags, claude-section has enum values

_Verified by: Tag registry contains claude-module, Tag registry contains claude-section, Tag registry contains claude-tags_

**Gherkin parser extracts claude module tags from feature files**

**Invariant:** The Gherkin extractor must extract `claude-module`, `claude-section`,
    and `claude-tags` from feature file tags into ExtractedPattern objects.

    **Rationale:** Behavior specs are the source of truth for CLAUDE.md module content.
    Parser must extract module metadata alongside existing pattern metadata.

    **Verified by:** Extract claude-module from feature tags, Extract claude-section
    from feature tags, Extract claude-tags as array, Handle missing claude tags gracefully

_Verified by: Extract claude-module from feature tags, Extract claude-section from feature tags, Extract claude-tags as array, Patterns without claude tags are not module candidates_

**Module content is extracted from feature file structure**

**Invariant:** The codec must extract content from standard feature file elements:
    Feature description (Problem/Solution), Rule blocks, and Scenario Outline Examples.

    **Rationale:** Behavior specs already contain well-structured, prescriptive content.
    The extraction preserves structure rather than flattening to prose.

    **Verified by:** Feature description becomes intro, Rule names become section headers,
    Rule descriptions become content, Scenario Outline Examples become tables

_Verified by: Feature description becomes module introduction, Rule blocks become module sections, Scenario Outline Examples become decision tables, Scenarios without Examples tables are not extracted_

**ClaudeModuleCodec produces compact markdown modules**

**Invariant:** The codec transforms patterns with claude tags into markdown files
    suitable for the `_claude-md/` directory structure.

    **Rationale:** CLAUDE.md modules must be compact and actionable. The codec
    produces ready-to-use markdown without truncation (let modular-claude-md
    handle token budget warnings).

    **Verified by:** Output uses H3 for title, Output uses H4 for rules, Tables are
    preserved, Code blocks in descriptions are preserved, See-also link is included

_Verified by: Module uses correct heading levels, Tables from rule descriptions are preserved, Code blocks in descriptions are preserved, See-also link to full documentation is included_

**Claude module generator writes files to correct locations**

**Invariant:** The generator must write module files to `{outputDir}/{section}/{module}.md`
    based on the `claude-section` and `claude-module` tags.

    **Rationale:** Output path structure must match modular-claude-md expectations.
    The `claude-section` determines the subdirectory, `claude-module` determines filename.

    **Verified by:** Output path uses section as directory, Output filename uses module name,
    Multiple modules from single run, Generator respects --overwrite flag

_Verified by: Output path uses section as directory, Multiple modules generated from single run, Generator skips patterns without claude-module tag, Generator creates section directories if missing_

**Claude module generator is registered with generator registry**

**Invariant:** A "claude-modules" generator must be registered with the generator
    registry to enable `pnpm docs:claude-modules` via the existing CLI.

    **Rationale:** Consistent with architecture-diagram-generation pattern. New
    generators register with the orchestrator rather than creating separate commands.

    **Verified by:** Generator is registered, CLI command works, Generator options supported

_Verified by: Generator is registered with name "claude-modules", CLI command generates modules, Generator supports fullDocsPath option_

**Same source generates detailed docs with progressive disclosure**

**Invariant:** When running with `detailLevel: "detailed"`, the codec produces
    expanded documentation including all Rule content, code examples, and scenario details.

    **Rationale:** Single source generates both compact modules (AI context) and
    detailed docs (human reference). Progressive disclosure is already a codec capability.

    **Verified by:** Detailed mode includes scenarios, Detailed mode includes code examples,
    Summary mode produces compact output

_Verified by: Detailed mode includes scenario descriptions, Summary mode produces compact output for modules, Standard mode is default for module generation_

### 📋 Data API CLI Ergonomics

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 2d |
| Business Value | fast interactive cli for repeated queries |

**Problem:**
  The process-api CLI runs the full pipeline (scan, extract, transform) on every
  invocation, taking 2-5 seconds. During design sessions with 10-20 queries, this
  adds up to 1-2 minutes of waiting. There is no way to keep the pipeline loaded
  between queries. Per-subcommand help is missing -- `process-api context --help`
  does not work. FSM-only queries (like `isValidTransition`) run the full pipeline
  even though FSM rules are static.

  **Solution:**
  Add performance and ergonomic improvements:
  1. **Pipeline caching** -- Cache MasterDataset to temp file with mtime invalidation
  2. **REPL mode** -- `process-api repl` keeps pipeline loaded for interactive queries
  3. **FSM short-circuit** -- FSM queries skip the scan pipeline entirely
  4. **Per-subcommand help** -- `process-api <subcommand> --help` with examples
  5. **Dry-run mode** -- `--dry-run` shows what would be scanned without running
  6. **Validation summary** -- Include pipeline health in response metadata

  **Business Value:**
  | Benefit | Impact |
  | Cached queries | 2-5s to <100ms for repeated queries |
  | REPL mode | Interactive exploration during sessions |
  | FSM short-circuit | Instant transition checks |
  | Per-subcommand help | Self-documenting for AI agents |

#### Acceptance Criteria

**Second query uses cached dataset**

- Given a previous query has cached the MasterDataset
- And no source files have been modified since
- When running "process-api status"
- Then the query completes in under 200ms
- And the response metadata indicates cache hit

**Cache invalidated on source file change**

- Given a cached MasterDataset exists
- And a source TypeScript file has been modified
- When running "process-api status"
- Then the pipeline runs fresh (cache miss)
- And the new dataset is cached for subsequent queries

**REPL accepts multiple queries**

- Given REPL mode is started with "process-api repl"
- When entering "status" then "pattern OrderSaga" then "dep-tree OrderSaga"
- Then each query returns results without pipeline re-initialization
- And "quit" exits the REPL

**REPL reloads on source change notification**

- Given REPL mode is running with loaded dataset
- When entering "reload"
- Then the pipeline is re-run with fresh source files
- And subsequent queries use the new dataset

**Per-subcommand help output**

- When running "process-api context --help"
- Then the output shows the context subcommand usage
- And the output lists available flags (--session, --related)
- And the output includes example commands

**Dry-run shows pipeline scope**

- When running "process-api --dry-run status"
- Then the output shows the number of files that would be scanned
- And the output shows the config file being used
- And the output shows input glob patterns
- And no actual pipeline processing occurs

**Validation summary in response metadata**

- Given the pipeline detects 2 dangling references
- When running "process-api status"
- Then the response metadata includes pattern count
- And the response metadata includes dangling reference count
- And the response metadata includes any pipeline warnings

#### Business Rules

**MasterDataset is cached between invocations with file-change invalidation**

**Invariant:** Cache is automatically invalidated when any source file
    (TypeScript or Gherkin) has a modification time newer than the cache.

    **Rationale:** The pipeline (scan -> extract -> transform) runs fresh on every
    invocation (~2-5 seconds). Most queries during a session don't need fresh data
    -- the source files haven't changed between queries. Caching the MasterDataset
    to a temp file with file-modification-time invalidation makes subsequent
    queries instant while ensuring staleness is impossible.

    **Verified by:** Cache hit on unchanged files, Cache invalidation on file change

_Verified by: Second query uses cached dataset, Cache invalidated on source file change_

**REPL mode keeps pipeline loaded for interactive multi-query sessions**

**Invariant:** REPL mode loads the pipeline once and accepts multiple queries
    on stdin, with optional tab completion for pattern names and subcommands.

    **Rationale:** Design sessions often involve 10-20 exploratory queries in
    sequence (check status, look up pattern, check deps, look up another pattern).
    REPL mode eliminates per-query pipeline overhead entirely.

    **Verified by:** REPL multi-query session, REPL with reload

_Verified by: REPL accepts multiple queries, REPL reloads on source change notification_

**Per-subcommand help and diagnostic modes aid discoverability**

**Invariant:** Every subcommand supports `--help` with usage, flags, and
    examples. Dry-run shows pipeline scope without executing.

    **Rationale:** AI agents read `--help` output to discover available
    commands and flags. Without per-subcommand help, agents must read external
    documentation. Dry-run mode helps diagnose "why no patterns found?" issues
    by showing what would be scanned.

    **Verified by:** Subcommand help, Dry-run output, Validation summary

_Verified by: Per-subcommand help output, Dry-run shows pipeline scope, Validation summary in response metadata_

### 📋 Data API Platform Integration

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 3d |
| Business Value | native claude code integration and monorepo support |

**Problem:**
  The process-api CLI requires subprocess invocation for every query, adding
  shell overhead and preventing stateful interaction. Claude Code's native tool
  integration mechanism is Model Context Protocol (MCP), which the process API
  does not support. Additionally, in the monorepo context, queries must specify
  input paths for each package manually -- there is no cross-package view or
  package-scoped filtering.

  **Solution:**
  Two integration capabilities:
  1. **MCP Server Mode** -- Expose ProcessStateAPI as an MCP server that Claude
     Code connects to directly. Eliminates CLI overhead and enables stateful
     queries (pipeline loaded once, multiple queries without re-scanning).
  2. **Monorepo Support** -- Cross-package dependency views, package-scoped
     filtering, multi-package presets, and per-package coverage reports.

  **Business Value:**
  | Benefit | Impact |
  | MCP integration | Claude Code calls API as native tool |
  | Stateful queries | No re-scanning between calls |
  | Cross-package views | Understand monorepo-wide dependencies |
  | Package-scoped queries | Focus on specific packages |

#### Acceptance Criteria

**MCP server exposes ProcessStateAPI tools**

- Given the MCP server is started with input globs
- When Claude Code requests tool listing
- Then all ProcessStateAPI methods appear as MCP tools
- And each tool has typed input and output schemas

**MCP tool invocation returns structured result**

- Given the MCP server is running with loaded dataset
- When Claude Code invokes the "getCurrentWork" tool
- Then the response contains active patterns in summary format
- And the response includes metadata (pattern count, cache status)

**MCP tool invocation with invalid parameters returns error**

- Given the MCP server is running with loaded dataset
- When Claude Code invokes a tool with invalid parameters
- Then the response contains a structured error with code and message
- And the MCP server remains operational for subsequent requests

**Generate CLAUDE.md context layer for bounded context**

- Given annotated patterns in the "orders" bounded context
- When running "process-api generate-context-layer --context orders"
- Then a CLAUDE.md section is generated with pattern metadata
- And the section includes relationship summaries
- And the section includes a file reading list

**Context layer reflects current process state**

- Given a pattern transitioned from "roadmap" to "active"
- When regenerating the context layer
- Then the CLAUDE.md section shows the updated status
- And the session workflow section reflects the new state

**Context layer for bounded context with no annotations**

- Given a bounded context directory with no @libar-docs annotations
- When running "process-api generate-context-layer --context empty-context"
- Then the output indicates no patterns found in the context
- And the CLAUDE.md section contains a placeholder with discovery guidance

**Cross-package dependency view**

- Given patterns across "platform-core" and "platform-bc" packages
- When running "process-api cross-package"
- Then the output shows which packages depend on which patterns
- And completed vs roadmap dependencies are distinguished

**Package-scoped query filtering**

- Given patterns from multiple packages in the dataset
- When running "process-api list --package platform-core --status active"
- Then only patterns from "platform-core" are returned
- And the package filter composes with other filters

**Query for non-existent package returns empty result**

- Given patterns from "platform-core" and "platform-bc" packages
- When running "process-api list --package non-existent-package"
- Then the output is an empty result set
- And no error is raised

**Pre-commit validates annotation consistency**

- Given a staged file adds a uses tag referencing "NonExistentPattern"
- When the pre-commit hook runs
- Then validation fails with "dangling reference" error
- And the error identifies the invalid reference

**Watch mode re-generates on file change**

- Given watch mode is running with "process-api watch --generate architecture"
- When a source file is modified
- Then the architecture docs are regenerated automatically
- And only affected doc sections are updated

**Pre-commit on clean commit with no annotation changes**

- Given staged files contain no @libar-docs annotations
- When the pre-commit hook runs
- Then validation passes without errors
- And no annotation warnings are emitted

#### Business Rules

**ProcessStateAPI is accessible as an MCP server for Claude Code**

**Invariant:** The MCP server exposes all ProcessStateAPI methods as MCP tools
    with typed input/output schemas. The pipeline is loaded once on server start
    and refreshed on source file changes.

    **Rationale:** MCP is Claude Code's native tool integration protocol. An MCP
    server eliminates the CLI subprocess overhead (2-5s per query) and enables
    Claude Code to call process queries as naturally as it calls other tools.
    Stateful operation means the pipeline loads once and serves many queries.

    **MCP configuration:**
    ```
    // .mcp.json or claude_desktop_config.json
    {
      "mcpServers": {
        "delivery-process": {
          "command": "npx",
          "args": ["tsx", "src/mcp/server.ts", "--input", "src/**/*.ts", ...]
        }
      }
    }
    ```

    **Verified by:** MCP server starts, MCP tool invocation, Auto-refresh on change

_Verified by: MCP server exposes ProcessStateAPI tools, MCP tool invocation returns structured result, MCP tool invocation with invalid parameters returns error_

**Process state can be auto-generated as CLAUDE.md context sections**

**Invariant:** Generated CLAUDE.md sections are additive layers that provide
    pattern metadata, relationships, and reading lists for specific scopes.

    **Rationale:** CLAUDE.md is the primary mechanism for providing persistent
    context to Claude Code sessions. Auto-generating CLAUDE.md sections from
    process state ensures the context is always fresh and consistent with the
    source annotations. This applies the "code-first documentation" principle
    to AI context itself.

    **Verified by:** Generate context layer, Context layer is up-to-date

_Verified by: Generate CLAUDE.md context layer for bounded context, Context layer reflects current process state, Context layer for bounded context with no annotations_

**Cross-package views show dependencies spanning multiple packages**

**Invariant:** Cross-package queries aggregate patterns from multiple
    input sources and resolve cross-package relationships.

    **Rationale:** In the monorepo, patterns in `platform-core` are used by
    patterns in `platform-bc`, which are used by the example app. Understanding
    these cross-package dependencies is essential for release planning and
    impact analysis. Currently each package must be queried independently
    with separate input globs.

    **Verified by:** Cross-package dependency view, Package-scoped filtering

_Verified by: Cross-package dependency view, Package-scoped query filtering, Query for non-existent package returns empty result_

**Process validation integrates with git hooks and file watching**

**Invariant:** Pre-commit hooks validate annotation consistency. Watch mode
    re-generates docs on source changes.

    **Rationale:** Git hooks catch annotation errors at commit time (e.g., new
    `uses` reference to non-existent pattern, invalid `arch-role` value, stub
    `@target` to non-existent directory). Watch mode enables live documentation
    regeneration during implementation sessions.

    **Verified by:** Pre-commit annotation validation, Watch mode re-generation

_Verified by: Pre-commit validates annotation consistency, Watch mode re-generates on file change, Pre-commit on clean commit with no annotation changes_

### 📋 Data API Relationship Graph

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 2d |
| Business Value | deep dependency analysis and health checks |

**Problem:**
  The current API provides flat relationship lookups (`getPatternDependencies`,
  `getPatternRelationships`) but no recursive traversal, impact analysis, or
  graph health checks. Agents cannot answer "if I change X, what breaks?",
  "what's the path from A to B?", or "which patterns have broken references?"
  without manual multi-step exploration.

  **Solution:**
  Add graph query commands that operate on the full relationship graph:
  1. `graph <pattern> [--depth N] [--direction up|down|both]` for recursive traversal
  2. `graph impact <pattern>` for transitive dependent analysis
  3. `graph path <from> <to>` for finding relationship chains
  4. `graph dangling` for broken reference detection
  5. `graph orphans` for isolated pattern detection
  6. `graph blocking` for blocked chain visualization

  **Business Value:**
  | Benefit | Impact |
  | Impact analysis | Know change blast radius before modifying |
  | Dangling references | Detect annotation errors automatically |
  | Blocking chains | Understand what prevents progress |
  | Path finding | Discover non-obvious relationships |

  **Relationship to ProcessStateAPIRelationshipQueries:**
  This spec supersedes the earlier ProcessStateAPIRelationshipQueries spec,
  which focused on implementation/inheritance convenience methods. The
  underlying data is available via getPatternRelationships(). This spec
  adds graph-level operations that traverse relationships recursively.

#### Acceptance Criteria

**Recursive graph traversal**

- Given a chain: A -> B -> C -> D with uses relationships
- When running "process-api graph A --depth 3 --direction down"
- Then the output shows A -> B -> C -> D as a tree
- And each node shows its status and phase

**Bidirectional traversal with depth limit**

- Given a pattern "C" in the middle of a chain
- When running "process-api graph C --depth 1 --direction both"
- Then the output shows direct parents (1 up) and direct children (1 down)
- And deeper relationships are not included

**Impact analysis shows transitive dependents**

- Given "EventStore" is used by "Saga" which is used by "Orchestrator"
- When running "process-api graph impact EventStore"
- Then the output shows "Saga" and "Orchestrator" as affected
- And the output shows the chain of impact

**Impact analysis for leaf pattern**

- Given a pattern with no usedBy or enables relationships
- When running "process-api graph impact LeafPattern"
- Then the output indicates no downstream impact

**Find path between connected patterns**

- Given a chain: EventStore -> Saga -> Orchestrator -> Workflow
- When running "process-api graph path EventStore Workflow"
- Then the output shows the chain: EventStore -> Saga -> Orchestrator -> Workflow
- And each hop shows the relationship type

**No path between disconnected patterns**

- Given "PatternA" and "PatternZ" with no connecting relationships
- When running "process-api graph path PatternA PatternZ"
- Then the output indicates no path exists between the patterns

**Detect dangling references**

- Given a pattern with uses "NonExistentPattern"
- When running "process-api graph dangling"
- Then the output includes the broken reference
- And the output shows which pattern references it

**Detect orphan patterns**

- Given a pattern with no uses, usedBy, dependsOn, or enables
- When running "process-api graph orphans"
- Then the output includes the isolated pattern
- And the output suggests adding relationship tags

**Show blocking chains**

- Given patterns blocked by incomplete dependencies
- When running "process-api graph blocking"
- Then the output shows each blocked pattern with its blocker
- And the output shows the chain from blocker to blocked
- And completed dependencies are excluded from the blocked list

#### Business Rules

**Graph command traverses relationships recursively with configurable depth**

**Invariant:** Graph traversal walks both planning relationships (`dependsOn`,
    `enables`) and implementation relationships (`uses`, `usedBy`) with cycle
    detection to prevent infinite loops.

    **Rationale:** Flat lookups show direct connections. Recursive traversal shows
    the full picture: transitive dependencies, indirect consumers, and the complete
    chain from root to leaf. Depth limiting prevents overwhelming output on deeply
    connected graphs.

    **Verified by:** Recursive traversal, Depth limiting, Direction filtering

_Verified by: Recursive graph traversal, Bidirectional traversal with depth limit_

**Impact analysis shows transitive dependents of a pattern**

**Invariant:** Impact analysis answers "if I change X, what else is affected?"
    by walking `usedBy` + `enables` recursively.

    **Rationale:** Before modifying a completed pattern (which requires unlock),
    understanding the blast radius prevents unintended breakage. Impact analysis
    is the reverse of dependency traversal -- it looks forward, not backward.

    **Verified by:** Impact with transitive dependents, Impact with no dependents

_Verified by: Impact analysis shows transitive dependents, Impact analysis for leaf pattern_

**Path finding discovers relationship chains between two patterns**

**Invariant:** Path finding returns the shortest chain of relationships
    connecting two patterns, or indicates no path exists. Traversal considers
    all relationship types (uses, usedBy, dependsOn, enables).

    **Rationale:** Understanding how two seemingly unrelated patterns connect
    helps agents assess indirect dependencies before making changes. When
    pattern A and pattern D are connected through B and C, modifying A
    requires understanding that chain.

    **Verified by:** Path between connected patterns, No path between disconnected patterns

_Verified by: Find path between connected patterns, No path between disconnected patterns_

**Graph health commands detect broken references and isolated patterns**

**Invariant:** Dangling references (pattern names in `uses`/`dependsOn` that
    don't match any pattern definition) are detectable. Orphan patterns (no
    relationships at all) are identifiable.

    **Rationale:** The MasterDataset transformer already computes dangling
    references during Pass 3 (relationship resolution) but does not expose them
    via the API. Orphan patterns indicate missing annotations. Both are data
    quality signals that improve over time with attention.

    **Verified by:** Dangling reference detection, Orphan detection, Blocking chains

_Verified by: Detect dangling references, Detect orphan patterns, Show blocking chains_

### 🚧 Pattern Helpers Tests

| Property | Value |
| --- | --- |
| Status | active |

#### Acceptance Criteria

**Returns patternName when set**

- Given a pattern with name "FooImpl" and patternName "Foo"
- When I get the pattern name
- Then the result is "Foo"

**Falls back to name when patternName is absent**

- Given a pattern with name "BarImpl" and no patternName
- When I get the pattern name
- Then the result is "BarImpl"

**Exact case match**

- Given patterns "Alpha" and "Beta"
- When I find pattern by name "Alpha"
- Then the found pattern name is "Alpha"

**Case-insensitive match**

- Given patterns "Alpha" and "Beta"
- When I find pattern by name "alpha"
- Then the found pattern name is "Alpha"

**No match returns undefined**

- Given patterns "Alpha" and "Beta"
- When I find pattern by name "Gamma"
- Then no pattern is found

**Exact key match in relationship index**

- Given a dataset with relationship entry for "OrderSaga"
- When I get relationships for "OrderSaga"
- Then relationships are found

**Case-insensitive fallback match**

- Given a dataset with relationship entry for "OrderSaga"
- When I get relationships for "ordersaga"
- Then relationships are found

**Missing relationship index returns undefined**

- Given a dataset without relationship index
- When I get relationships for "OrderSaga"
- Then no relationships are found

**Suggests close match**

- Given candidate names "AgentCommandInfra" and "EventStore"
- When I suggest a pattern for "AgentCommand"
- Then the suggestion contains "AgentCommandInfra"

**No close match returns empty**

- Given candidate names "AgentCommandInfra" and "EventStore"
- When I suggest a pattern for "zzNonexistent"
- Then the suggestion is empty

#### Business Rules

**getPatternName uses patternName tag when available**

**Invariant:** getPatternName must return the patternName tag value when set, falling back to the pattern's name field when the tag is absent.
    **Rationale:** The patternName tag allows human-friendly display names — without the fallback, patterns missing the tag would display as undefined.
    **Verified by:** Returns patternName when set, Falls back to name when patternName is absent

_Verified by: Returns patternName when set, Falls back to name when patternName is absent_

**findPatternByName performs case-insensitive matching**

**Invariant:** findPatternByName must match pattern names case-insensitively, returning undefined when no match exists.
    **Rationale:** Case-insensitive matching prevents frustrating "not found" errors when developers type "processguard" instead of "ProcessGuard" — both clearly refer to the same pattern.
    **Verified by:** Exact case match, Case-insensitive match, No match returns undefined

_Verified by: Exact case match, Case-insensitive match, No match returns undefined_

**getRelationships looks up with case-insensitive fallback**

**Invariant:** getRelationships must first try exact key lookup in the relationship index, then fall back to case-insensitive matching, returning undefined when no match exists.
    **Rationale:** Exact-first with case-insensitive fallback balances performance (O(1) exact lookup) with usability (tolerates case mismatches in cross-references).
    **Verified by:** Exact key match in relationship index, Case-insensitive fallback match, Missing relationship index returns undefined

_Verified by: Exact key match in relationship index, Case-insensitive fallback match, Missing relationship index returns undefined_

**suggestPattern provides fuzzy suggestions**

**Invariant:** suggestPattern must return fuzzy match suggestions for close pattern names, returning empty results when no close match exists.
    **Rationale:** Fuzzy suggestions power "did you mean?" UX in the CLI — without them, typos produce unhelpful "pattern not found" messages.
    **Verified by:** Suggests close match, No close match returns empty

_Verified by: Suggests close match, No close match returns empty_

---

[← Back to Remaining Work](../REMAINING-WORK.md)
