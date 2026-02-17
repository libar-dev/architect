# DataAPIStubIntegration

**Purpose:** Detailed patterns for DataAPIStubIntegration

---

## Summary

**Progress:** [██████████░░░░░░░░░░] 5/10 (50%)

| Status | Count |
| --- | --- |
| ✅ Completed | 5 |
| 🚧 Active | 1 |
| 📋 Planned | 4 |
| **Total** | 10 |

---

## 🚧 Active Patterns

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

## 📋 Planned Patterns

### 📋 Claude Module Generation

| Property | Value |
| --- | --- |
| Status | planned |
| Effort | 1.5d |
| Business Value | automated claude md modules from source |

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

#### Dependencies

- Depends on: ArchitectureDiagramGeneration

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

---

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

---

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

---

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

---

## ✅ Completed Patterns

### ✅ Data API Architecture Queries

| Property | Value |
| --- | --- |
| Status | completed |
| Effort | 2d |
| Business Value | deep architecture exploration for design sessions |

**Problem:**
  The current `arch` subcommand provides basic queries (roles, context, layer, graph)
  but lacks deeper analysis needed for design sessions: pattern neighborhoods (what's
  directly connected), cross-context comparison, annotation coverage gaps, and
  taxonomy discovery. Agents exploring architecture must make multiple queries and
  mentally assemble the picture, wasting context tokens.

  **Solution:**
  Extend the `arch` subcommand and add new discovery commands:
  1. `arch neighborhood <pattern>` shows 1-hop relationships (direct uses/usedBy)
  2. `arch compare <ctx1> <ctx2>` shows shared deps and integration points
  3. `arch coverage` reports annotation completeness with gaps
  4. `tags` lists all tags in use with counts
  5. `sources` shows file inventory by type
  6. `unannotated [--path glob]` finds files without the libar-docs opt-in marker

  **Business Value:**
  | Benefit | Impact |
  | Pattern neighborhoods | Understand local architecture in one call |
  | Coverage gaps | Find unannotated files that need attention |
  | Taxonomy discovery | Know what tags and categories are available |
  | Cross-context analysis | Compare bounded contexts for integration |

#### Dependencies

- Depends on: DataAPIOutputShaping

#### Acceptance Criteria

**Pattern neighborhood shows direct connections**

- Given a pattern "OrderSaga" in the "orders" context
- And "OrderSaga" uses "CommandBus" and "EventStore"
- And "OrderSaga" is used by "SagaRouter"
- When running "process-api arch neighborhood OrderSaga"
- Then the output shows "Uses: CommandBus, EventStore"
- And the output shows "Used by: SagaRouter"
- And the output shows sibling patterns in the "orders" context

**Cross-context comparison**

- Given contexts "orders" and "inventory" with some shared dependencies
- When running "process-api arch compare orders inventory"
- Then the output shows shared dependencies between contexts
- And the output shows unique dependencies per context
- And the output identifies integration points

**Neighborhood for nonexistent pattern returns error**

- Given no pattern named "NonExistent" exists
- When running "process-api arch neighborhood NonExistent"
- Then the command fails with a pattern-not-found error
- And the error message suggests checking the pattern name

**Architecture coverage report**

- Given 41 annotated files out of 50 scannable files
- When running "process-api arch coverage"
- Then the output shows "41/50 files annotated (82%)"
- And the output lists the 9 unannotated files
- And the output shows unused taxonomy values

**Find unannotated files with path filter**

- Given some TypeScript files without the libar-docs opt-in marker
- When running "process-api unannotated --path 'src/generators/**/*.ts'"
- Then the output lists only unannotated files matching the glob
- And each file shows its location relative to base directory

**Coverage with no scannable files returns zero coverage**

- Given the input globs match 0 files
- When running "process-api arch coverage"
- Then the output shows "0/0 files annotated (0%)"
- And the unannotated files list is empty

**List all tags with usage counts**

- Given patterns with various tags applied
- When running "process-api tags"
- Then the output lists each tag name with its usage count
- And category tags show their value distribution
- And status tags show their value distribution

**Source file inventory**

- Given TypeScript, Gherkin, and stub files in the pipeline
- When running "process-api sources"
- Then the output shows file counts by type
- And the output shows location patterns for each type
- And the total matches the pipeline scan count

**Tags listing with no patterns returns empty report**

- Given the pipeline has 0 patterns
- When running "process-api tags"
- Then the output shows an empty tag report with 0 pattern count
- And no tag entries are listed

#### Business Rules

**Arch subcommand provides neighborhood and comparison views**

**Invariant:** Architecture queries resolve pattern names to concrete
    relationships and file paths, not just abstract names.

    **Rationale:** The current `arch graph <pattern>` returns dependency and
    relationship names but not the full picture of what surrounds a pattern.
    Design sessions need to understand: "If I'm working on X, what else is
    directly connected?" and "How do contexts A and B relate?"

    **Neighborhood output:**
    | Section | Content |
    | Triggered by | Patterns whose `usedBy` includes this pattern |
    | Uses | Patterns this calls directly |
    | Used by | Patterns that call this directly |
    | Same context | Sibling patterns in the same bounded context |

    **Verified by:** Neighborhood view, Cross-context comparison

_Verified by: Pattern neighborhood shows direct connections, Cross-context comparison, Neighborhood for nonexistent pattern returns error_

**Coverage analysis reports annotation completeness with gaps**

**Invariant:** Coverage reports identify unannotated files that should have
    the libar-docs opt-in marker based on their location and content.

    **Rationale:** Annotation completeness directly impacts the quality of all
    generated documentation and API queries. Files without the opt-in marker are
    invisible to the pipeline. Coverage gaps mean missing patterns in the
    registry, incomplete dependency graphs, and blind spots in architecture views.

    **Coverage output:**
    | Metric | Source |
    | Annotated files | Files with libar-docs opt-in |
    | Total scannable files | All .ts files in input globs |
    | Coverage percentage | annotated / total |
    | Missing files | Scannable files without annotations |
    | Unused roles/categories | Values defined in taxonomy but not used |

    **Verified by:** Coverage report, Unannotated file discovery

_Verified by: Architecture coverage report, Find unannotated files with path filter, Coverage with no scannable files returns zero coverage_

**Tags and sources commands provide taxonomy and inventory views**

**Invariant:** All tag values in use are discoverable without reading
    configuration files. Source file inventory shows the full scope of
    annotated and scanned content.

    **Rationale:** Agents frequently need to know "what categories exist?"
    or "how many feature files are there?" without reading taxonomy
    configuration. These are meta-queries about the annotation system itself,
    essential for writing new annotations correctly and understanding scope.

    **Tags output:**
    | Tag | Count | Example Values |
    | libar-docs-status | 69 | completed(36), roadmap(30), active(3) |
    | libar-docs-category | 41 | projection(6), saga(4), handler(5) |

    **Sources output:**
    | Source Type | Count | Location Pattern |
    | TypeScript (annotated) | 47 | src/**/*.ts |
    | Gherkin (feature files) | 37 | specs/**/*.feature |
    | Stub files | 22 | stubs/**/*.ts |
    | Decision files | 13 | decisions/**/*.feature |

    **Verified by:** Tags listing, Sources inventory

_Verified by: List all tags with usage counts, Source file inventory, Tags listing with no patterns returns empty report_

---

### ✅ Data API Context Assembly

| Property | Value |
| --- | --- |
| Status | completed |
| Effort | 3d |
| Business Value | replace explore agents with one command |

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

#### Dependencies

- Depends on: DataAPIOutputShaping
- Depends on: DataAPIStubIntegration

#### Acceptance Criteria

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

#### Business Rules

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

---

### ✅ Data API Design Session Support

| Property | Value |
| --- | --- |
| Status | completed |
| Effort | 1d |
| Business Value | automate session context compilation |

**Problem:**
  Starting a design or implementation session requires manually compiling
  elaborate context prompts. For example, DS-3 (LLM Integration) needs:
  - The spec to design against (agent-llm-integration.feature)
  - Dependency stubs from DS-1 and DS-2 (action-handler, event-subscription, schema)
  - Consumer specs for outside-in validation (churn-risk, admin-frontend)
  - Existing infrastructure (CommandOrchestrator, EventBus)
  - Dependency chain status and design decisions from prior sessions

  This manual compilation takes 10-15 minutes per session start and is
  error-prone (missing dependencies, stale context). Multi-session work
  requires handoff documentation that is also manually maintained.

  **Solution:**
  Add session workflow commands that automate two critical session moments:
  1. **Pre-flight check:** `scope-validate <pattern>` verifies implementation readiness
  2. **Session end:** `handoff [--pattern X]` generates handoff documentation

  Session context assembly (the "session start" moment) lives in DataAPIContextAssembly
  via `context <pattern> --session design|implement|planning`. This spec focuses on
  the validation and handoff capabilities that build on top of context assembly.

  **Business Value:**
  | Benefit | Impact |
  | 10-15 min session start -> 1 command | Eliminates manual context compilation |
  | Pre-flight catches blockers early | No wasted sessions on unready patterns |
  | Automated handoff | Consistent multi-session state tracking |

#### Dependencies

- Depends on: DataAPIContextAssembly
- Depends on: DataAPIStubIntegration

#### Acceptance Criteria

**All scope validation checks pass**

- Given a pattern with all prerequisites met
- When running "process-api scope-validate MyPattern --type implement"
- Then all checklist items show green/passing
- And the output indicates "Ready for implementation session"

**Dependency blocker detected**

- Given a pattern "X" depending on "Y" with status "roadmap"
- When running "process-api scope-validate X --type implement"
- Then the dependencies check shows "BLOCKED"
- And the output identifies "Y (roadmap)" as the blocker
- And the output suggests "Complete Y first or change session type to design"

**FSM transition blocker detected**

- Given a pattern with status "completed"
- When running "process-api scope-validate CompletedPattern --type implement"
- Then the FSM check shows "BLOCKED"
- And the output indicates transition to active is not valid from completed

**Generate handoff for in-progress pattern**

- Given an active pattern with 3 completed and 2 remaining deliverables
- When running "process-api handoff --pattern MyPattern"
- Then the output shows the session summary
- And the output lists 3 completed deliverables
- And the output lists 2 remaining deliverables as next priorities
- And the output suggests the recommended order

**Handoff captures discovered items**

- Given a pattern with discovery tags in feature file comments
- When running "process-api handoff --pattern MyPattern"
- Then the output includes discovered gaps
- And the output includes discovered improvements
- And the output includes discovered learnings

#### Business Rules

**Scope-validate checks implementation prerequisites before session start**

**Invariant:** Scope validation surfaces all blocking conditions before
    committing to a session, preventing wasted effort on unready patterns.

    **Rationale:** Starting implementation on a pattern with incomplete
    dependencies wastes an entire session. Starting a design session without
    prior session deliverables means working with incomplete context. Pre-flight
    validation catches these issues in seconds rather than discovering them
    mid-session.

    **Validation checklist:**
    | Check | Required For | Source |
    | Dependencies completed | implement | dependsOn chain status |
    | Stubs from dependency sessions exist | design | implementedBy lookup |
    | Deliverables defined | implement | Background table in spec |
    | FSM allows transition to active | implement | isValidTransition() |
    | Design decisions recorded | implement | PDR references in stubs |
    | Executable specs location set | implement | @executable-specs tag |

    **Verified by:** All checks pass, Dependency blocker detected, FSM blocker detected

_Verified by: All scope validation checks pass, Dependency blocker detected, FSM transition blocker detected_

**Handoff generates compact session state summary for multi-session work**

**Invariant:** Handoff documentation captures everything the next session
    needs to continue work without context loss.

    **Rationale:** Multi-session work (common for design phases spanning DS-1
    through DS-7) requires state transfer between sessions. Without automated
    handoff, critical information is lost: what was completed, what's in
    progress, what blockers were discovered, and what should happen next.
    Manual handoff documentation is inconsistent and often forgotten.

    **Handoff output:**
    | Section | Source |
    | Session summary | Pattern name, session type, date |
    | Completed | Deliverables with status "complete" |
    | In progress | Deliverables with status not "complete" and not "pending" |
    | Files modified | Git diff file list (if available) |
    | Discovered items | @discovered-gap, @discovered-improvement tags |
    | Blockers | Incomplete dependencies, open questions |
    | Next session priorities | Remaining deliverables, suggested order |

    **Verified by:** Handoff for in-progress pattern, Handoff with discoveries

_Verified by: Generate handoff for in-progress pattern, Handoff captures discovered items_

---

### ✅ Data API Output Shaping

| Property | Value |
| --- | --- |
| Status | completed |
| Effort | 4d |
| Business Value | compact output for ai agents |

**Problem:**
  The ProcessStateAPI CLI returns raw `ExtractedPattern` objects via `JSON.stringify`.
  List queries (e.g., `getCurrentWork`) produce ~594KB of JSON because each pattern
  includes full `directive` (raw JSDoc AST), `code` (source text), and dozens of
  empty/null fields. AI agents waste context tokens parsing verbose output that is
  99% noise. There is no way to request compact summaries, filter fields, or get
  counts without downloading the full dataset.

  **Solution:**
  Add an output shaping pipeline that transforms raw API responses into compact,
  AI-optimized formats:
  1. `summarizePattern()` projects patterns to ~100 bytes (vs ~3.5KB raw)
  2. Global output modifiers: `--names-only`, `--count`, `--fields`
  3. Format control: `--format compact|json` with empty field stripping
  4. `list` subcommand with composable filters (`--status`, `--phase`, `--category`)
  5. `search` subcommand with fuzzy pattern name matching
  6. CLI ergonomics: config file defaults, `-f` shorthand, pnpm banner fix

  **Business Value:**
  | Benefit | Impact |
  | 594KB to 4KB list output | 99% context reduction for list queries |
  | Fuzzy matching | Eliminates agent retry loops on typos |
  | Config defaults | No more repeating --input and --features paths |
  | Composable filters | One command replaces multiple API method calls |

#### Acceptance Criteria

**List queries return compact summaries**

- Given patterns exist in the dataset
- When running "process-api query getCurrentWork"
- Then each pattern in the output contains only summary fields
- And the output does not contain "directive" or "code" fields
- And total output size is under 1KB for typical results

**Full flag returns complete patterns**

- Given patterns exist in the dataset
- When running "process-api query getCurrentWork --full"
- Then each pattern contains all ExtractedPattern fields
- And the output includes "directive" and "code" fields

**Single pattern detail is unaffected**

- Given a pattern "MyPattern" exists
- When running "process-api pattern MyPattern"
- Then the output contains full pattern detail
- And the output includes deliverables, dependencies, and relationships

**Full flag combined with names-only is rejected**

- Given patterns exist in the dataset
- When running "process-api query getCurrentWork --full --names-only"
- Then the command fails with an error about conflicting modifiers
- And the error message lists the conflicting flags

**Names-only output for list queries**

- Given 5 patterns exist with status "roadmap"
- When running "process-api query getRoadmapItems --names-only"
- Then the output is a JSON array of 5 strings
- And each string is a pattern name

**Count output for list queries**

- Given 3 active patterns and 5 roadmap patterns
- When running "process-api query getCurrentWork --count"
- Then the output is the integer 3

**Field selection for list queries**

- Given patterns exist in the dataset
- When running "process-api query getCurrentWork --fields patternName,status,phase"
- Then each pattern in the output contains only the requested fields
- And no other fields are present

**Invalid field name in field selection is rejected**

- Given patterns exist in the dataset
- When running "process-api query getCurrentWork --fields patternName,nonExistentField"
- Then the command fails with an error about invalid field names
- And the error message lists valid field names for the current output mode

**Successful query returns typed envelope**

- Given patterns exist in the dataset
- When running "process-api status"
- Then the output JSON has "success" set to true
- And the output JSON has a "data" field with the result
- And the output JSON has a "metadata" field with pattern count

**Failed query returns error envelope**

- When running "process-api query nonExistentMethod"
- Then the output JSON has "success" set to false
- And the output JSON has an "error" field with a message

**Compact format strips empty fields**

- Given a pattern with empty arrays and null values
- When running "process-api pattern MyPattern"
- Then the output does not contain empty arrays
- And the output does not contain null values
- And the output does not contain empty strings

**List with single filter**

- Given patterns with various statuses and categories
- When running "process-api list --status active"
- Then only active patterns are returned
- And results use the compact summary format

**List with composed filters**

- Given patterns with various statuses and categories
- When running "process-api list --status roadmap --category projection"
- Then only roadmap patterns in the projection category are returned

**Search with fuzzy matching**

- Given a pattern named "AgentCommandInfrastructure"
- When running "process-api search AgentCommand"
- Then the result includes "AgentCommandInfrastructure"
- And results are ranked by match quality

**Pagination with limit and offset**

- Given 20 roadmap patterns exist
- When running "process-api list --status roadmap --limit 5 --offset 10"
- Then exactly 5 patterns are returned
- And they start from the 11th pattern

**Search with no results returns empty with suggestion**

- Given patterns exist but none match "zzNonexistent"
- When running "process-api search zzNonexistent"
- Then the result contains an empty matches array
- And the output includes a hint that no patterns matched

**Config file provides default input paths**

- Given a delivery-process.config.ts exists with input and features paths
- When running "process-api status" without --input or --features flags
- Then the pipeline uses paths from the config file
- And the output shows correct pattern counts

**Fuzzy pattern name suggestion on not-found**

- Given a pattern "AgentCommandInfrastructure" exists
- When running "process-api pattern AgentCommand"
- Then the error message includes "Did you mean: AgentCommandInfrastructure?"

**Empty result provides contextual hint**

- Given no patterns have status "active"
- And 3 patterns have status "roadmap"
- When running "process-api list --status active"
- Then the output includes a hint about roadmap patterns
- And the hint suggests "Try: list --status roadmap"

#### Business Rules

**List queries return compact pattern summaries by default**

**Invariant:** List-returning API methods produce summaries, not full ExtractedPattern
    objects, unless `--full` is explicitly requested.

    **Rationale:** The single biggest usability problem. `getCurrentWork` returns 3 active
    patterns at ~3.5KB each = 10.5KB. Summarized: ~300 bytes total. The `directive` field
    (raw JSDoc AST) and `code` field (full source) are almost never needed for list queries.
    AI agents need name, status, category, phase, and file path -- nothing more.

    **Summary projection fields:**
    | Field | Source | Size |
    | patternName | pattern.patternName | ~30 chars |
    | status | pattern.status | ~8 chars |
    | category | pattern.categories | ~15 chars |
    | phase | pattern.phase | ~3 chars |
    | file | pattern.filePath | ~40 chars |
    | source | pattern.source | ~7 chars |

    **Verified by:** List returns summaries, Full flag returns raw patterns, Pattern detail unchanged

_Verified by: List queries return compact summaries, Full flag returns complete patterns, Single pattern detail is unaffected, Full flag combined with names-only is rejected_

**Global output modifier flags apply to any list-returning command**

**Invariant:** Output modifiers are composable and apply uniformly across all
    list-returning subcommands and query methods.

    **Rationale:** AI agents frequently need just pattern names (for further queries),
    just counts (for progress checks), or specific fields (for focused analysis).
    These are post-processing transforms that should work with any data source.

    **Modifier flags:**
    | Flag | Effect | Example Output |
    | --names-only | Array of pattern name strings | ["OrderSaga", "EventStore"] |
    | --count | Single integer | 6 |
    | --fields name,status | Selected fields only | [{"name":"X","status":"active"}] |

    **Verified by:** Names-only output, Count output, Field selection

_Verified by: Names-only output for list queries, Count output for list queries, Field selection for list queries, Invalid field name in field selection is rejected_

**Output format is configurable with typed response envelope**

**Invariant:** All CLI output uses the QueryResult envelope for success/error
    discrimination. The compact format strips empty and null fields.

    **Rationale:** The existing `QueryResult<T>` types (`QuerySuccess`, `QueryError`) are
    defined in `src/api/types.ts` but not wired into the CLI output. Agents cannot
    distinguish success from error without try/catch on JSON parsing. Empty arrays,
    null values, and empty strings add noise to every response.

    **Envelope structure:**
    | Field | Type | Purpose |
    | success | boolean | Discriminator for success/error |
    | data | T | The query result |
    | metadata | object | Pattern count, timestamp, pipeline health |
    | error | string | Error message (only on failure) |

    **Verified by:** Success envelope, Error envelope, Compact format strips nulls

_Verified by: Successful query returns typed envelope, Failed query returns error envelope, Compact format strips empty fields_

**List subcommand provides composable filters and fuzzy search**

**Invariant:** The `list` subcommand replaces the need to call specific
    `getPatternsByX` methods. Filters are composable via AND logic.
    The `query` subcommand remains available for programmatic/raw access.

    **Rationale:** Currently, filtering by status AND category requires calling
    `getPatternsByCategory` then manually filtering by status. A single `list`
    command with composable filters eliminates multi-step queries. Fuzzy search
    reduces agent retry loops when pattern names are approximate.

    **Filter flags:**
    | Flag | Filters by | Example |
    | --status | FSM status | --status active |
    | --phase | Phase number | --phase 22 |
    | --category | Category tag | --category projection |
    | --source | Source type | --source gherkin |
    | --limit N | Max results | --limit 10 |
    | --offset N | Skip results | --offset 5 |

    **Verified by:** Single filter, Composed filters, Fuzzy search, Pagination

_Verified by: List with single filter, List with composed filters, Search with fuzzy matching, Pagination with limit and offset, Search with no results returns empty with suggestion_

**CLI provides ergonomic defaults and helpful error messages**

**Invariant:** Common operations require minimal flags. Pattern name typos
    produce actionable suggestions. Empty results explain why.

    **Rationale:** Every extra flag and every retry loop costs AI agent context
    tokens. Config file defaults eliminate repetitive path arguments. Fuzzy matching
    with suggestions prevents the common "Pattern not found" → retry → still not found
    loop. Empty result hints guide agents toward productive queries.

    **Ergonomic features:**
    | Feature | Before | After |
    | Config defaults | --input 'src/**/*.ts' --features '...' every time | Read from config file |
    | -f shorthand | --features 'specs/*.feature' | -f 'specs/*.feature' |
    | pnpm banner | Breaks JSON piping | Clean stdout |
    | Did-you-mean | "Pattern not found" (dead end) | "Did you mean: AgentCommandInfrastructure?" |
    | Empty hints | [] (no context) | "No active patterns. 3 are roadmap. Try: list --status roadmap" |

    **Verified by:** Config file resolution, Fuzzy suggestions, Empty result hints

_Verified by: Config file provides default input paths, Fuzzy pattern name suggestion on not-found, Empty result provides contextual hint_

---

### ✅ Data API Stub Integration

| Property | Value |
| --- | --- |
| Status | completed |
| Effort | 2d |
| Business Value | unlock design session stub metadata |

**Problem:**
  Design sessions produce code stubs in `delivery-process/stubs/` with rich
  metadata: `@target` (destination file path), `@since` (design session ID),
  `@see` (PDR references), and `AD-N` numbered decisions. But 14 of 22 stubs
  lack the libar-docs opt-in marker, making them invisible to the scanner pipeline.
  The 8 stubs that ARE scanned silently drop the target and see annotations because
  they are not prefixed with the libar-docs namespace.

  This means: the richest source of design context (stubs with architectural
  decisions, target paths, and session provenance) is invisible to the API.

  **Solution:**
  A two-phase integration approach:
  1. **Phase A (Annotation):** Add the libar-docs opt-in + implements tag to
     the 14 non-annotated stubs. This makes them scannable with zero pipeline changes.
  2. **Phase B (Taxonomy):** Register libar-docs-target and libar-docs-since
     as new taxonomy tags. Rename existing `@target` and `@since` annotations in
     all stubs. This gives structured access to stub-specific metadata.

  3. **Phase C (Commands):** Add query commands:
  - `stubs [pattern]` lists design stubs with target paths
  - `decisions [pattern]` surfaces PDR references and AD-N items
  - `pdr <number>` finds all patterns referencing a specific PDR

  **Business Value:**
  | Benefit | Impact |
  | 14 invisible stubs become visible | Full design context available to API |
  | Target path tracking | Know where stubs will be implemented |
  | Design decision queries | Surface AD-N decisions for review |
  | PDR cross-referencing | Find all patterns related to a decision |

#### Acceptance Criteria

**Annotated stubs are discoverable by the scanner**

- Given stub files with @libar-docs and @libar-docs-implements tags
- When running the scanner pipeline with stubs input glob
- Then all annotated stubs appear in the MasterDataset
- And each stub has an implementsPatterns relationship

**Stub target path is extracted as structured field**

- Given a stub with "@libar-docs-target:platform-core/src/agent/router.ts"
- When the stub is scanned and extracted
- Then the pattern's targetPath field contains "platform-core/src/agent/router.ts"
- And the targetPath is available via ProcessStateAPI queries

**Stub without libar-docs opt-in is invisible to scanner**

- Given a stub file without the @libar-docs marker
- When running the scanner pipeline with stubs input glob
- Then the stub does NOT appear in the MasterDataset
- And no error is raised for the missing marker

**List all stubs with implementation status**

- Given stubs exist for 4 patterns with targets
- When running "process-api stubs"
- Then the output lists each stub with its target path
- And each stub shows whether the target file exists
- And stubs are grouped by parent pattern

**List stubs for a specific pattern**

- Given 5 stubs implement "AgentCommandInfrastructure"
- When running "process-api stubs AgentCommandInfrastructure"
- Then only stubs for that pattern are returned
- And each stub shows target, session, and implementation status

**Filter unresolved stubs**

- Given 3 stubs with existing targets and 2 without
- When running "process-api stubs --unresolved"
- Then only the 2 stubs without existing target files are returned

**Stubs for nonexistent pattern returns empty result**

- Given no stubs implement "NonExistentPattern"
- When running "process-api stubs NonExistentPattern"
- Then the result is empty
- And the error message suggests checking the pattern name

**Query design decisions for a pattern**

- Given stubs for "AgentCommandInfrastructure" with AD-N items
- When running "process-api decisions AgentCommandInfrastructure"
- Then the output lists each AD-N decision with its description
- And the output shows referenced PDR numbers
- And the output shows the source design session

**Cross-reference a PDR number**

- Given patterns and stubs referencing "PDR-012"
- When running "process-api pdr 012"
- Then the output lists all patterns referencing PDR-012
- And the output shows the decision feature file location
- And the output shows stub count per pattern

**PDR query for nonexistent number returns empty**

- Given no patterns or stubs reference "PDR-999"
- When running "process-api pdr 999"
- Then the result indicates no references found
- And the output includes "No patterns reference PDR-999"

#### Business Rules

**All stubs are visible to the scanner pipeline**

**Invariant:** Every stub file in `delivery-process/stubs/` has `@libar-docs`
    opt-in and `@libar-docs-implements` linking it to its parent pattern.

    **Rationale:** The scanner requires `@libar-docs` opt-in marker to include a
    file. Without it, stubs are invisible regardless of other annotations. The
    `@libar-docs-implements` tag creates the bidirectional link: spec defines the
    pattern (via `@libar-docs-pattern`), stub implements it. Per PDR-009, stubs
    must NOT use `@libar-docs-pattern` -- that belongs to the feature file.

    **Boundary note:** Phase A (annotating stubs with libar-docs opt-in and
    libar-docs-implements tags) is consumer-side work done in each consuming repo.
    Package.json scan paths (`-i 'delivery-process/stubs/**/*.ts'`) are already
    pre-configured in 15 scripts. This spec covers Phase B: taxonomy tag
    registration (libar-docs-target, libar-docs-since) and CLI query subcommands.

    **Verified by:** All stubs scanned, Stub metadata extracted

_Verified by: Annotated stubs are discoverable by the scanner, Stub target path is extracted as structured field, Stub without libar-docs opt-in is invisible to scanner_

**Stubs subcommand lists design stubs with implementation status**

**Invariant:** `stubs` returns stub files with their target paths, design
    session origins, and whether the target file already exists.

    **Rationale:** Before implementation, agents need to know: which stubs
    exist for a pattern, where they should be moved to, and which have already
    been implemented. The stub-to-implementation resolver compares
    `@libar-docs-target` paths against actual files to determine status.

    **Output per stub:**
    | Field | Source |
    | Stub file | Pattern filePath |
    | Target | @libar-docs-target value |
    | Implemented? | Target file exists? |
    | Since | @libar-docs-since (design session ID) |
    | Pattern | @libar-docs-implements value |

    **Verified by:** List all stubs, List stubs for pattern, Filter unresolved

_Verified by: List all stubs with implementation status, List stubs for a specific pattern, Filter unresolved stubs, Stubs for nonexistent pattern returns empty result_

**Decisions and PDR commands surface design rationale**

**Invariant:** Design decisions (AD-N items) and PDR references from stub
    annotations are queryable by pattern name or PDR number.

    **Rationale:** Design sessions produce numbered decisions (AD-1, AD-2, etc.)
    and reference PDR decision records (see PDR-012). When reviewing designs
    or starting implementation, agents need to find these decisions without
    reading every stub file manually.

    **decisions output:**
    ```
    Pattern: AgentCommandInfrastructure
    Source: DS-4 (stubs/agent-command-routing/)
    Decisions:
      AD-1: Unified action model (PDR-011)
      AD-5: Router maps command types to orchestrator (PDR-012)
    PDRs referenced: PDR-011, PDR-012
    ```

    **pdr output:**
    ```
    PDR-012: Agent Command Routing
    Referenced by:
      AgentCommandInfrastructure (5 stubs)
      CommandRouter (spec)
    Decision file: decisions/pdr-012-agent-command-routing.feature
    ```

    **Verified by:** Decisions for pattern, PDR cross-reference

_Verified by: Query design decisions for a pattern, Cross-reference a PDR number, PDR query for nonexistent number returns empty_

---

[← Back to Roadmap](../ROADMAP.md)
