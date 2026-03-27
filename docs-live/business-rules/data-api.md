# Data API Business Rules

**Purpose:** Business rules for the Data API product area

---

**90 rules** from 25 features. 90 rules have explicit invariants.

---

## Phase 25

### Pattern Helpers Tests

---

#### getPatternName uses patternName tag when available

> **Invariant:** getPatternName must return the patternName tag value when set, falling back to the pattern's name field when the tag is absent.
>
> **Rationale:** The patternName tag allows human-friendly display names — without the fallback, patterns missing the tag would display as undefined.

**Verified by:**

- Returns patternName when set
- Falls back to name when patternName is absent

---

#### findPatternByName performs case-insensitive matching

> **Invariant:** findPatternByName must match pattern names case-insensitively, returning undefined when no match exists.
>
> **Rationale:** Case-insensitive matching prevents frustrating "not found" errors when developers type "processguard" instead of "ProcessGuard" — both clearly refer to the same pattern.

**Verified by:**

- Exact case match
- Case-insensitive match
- No match returns undefined

---

#### getRelationships looks up with case-insensitive fallback

> **Invariant:** getRelationships must first try exact key lookup in the relationship index, then fall back to case-insensitive matching, returning undefined when no match exists.
>
> **Rationale:** Exact-first with case-insensitive fallback balances performance (O(1) exact lookup) with usability (tolerates case mismatches in cross-references).

**Verified by:**

- Exact key match in relationship index
- Case-insensitive fallback match
- Missing relationship index returns undefined

---

#### suggestPattern provides fuzzy suggestions

> **Invariant:** suggestPattern must return fuzzy match suggestions for close pattern names, returning empty results when no close match exists.
>
> **Rationale:** Fuzzy suggestions power "did you mean?" UX in the CLI — without them, typos produce unhelpful "pattern not found" messages.

**Verified by:**

- Suggests close match
- No close match returns empty

_pattern-helpers.feature_

---

## Uncategorized

### Arch Queries Test

---

#### Neighborhood and comparison views

> **Invariant:** The architecture query API must provide pattern neighborhood views (direct connections) and cross-context comparison views (shared/unique dependencies), returning undefined for nonexistent patterns.
>
> **Rationale:** Neighborhood and comparison views are the primary navigation tools for understanding architecture — without them, developers must manually trace relationship chains across files.

**Verified by:**

- Pattern neighborhood shows direct connections
- Cross-context comparison shows shared and unique dependencies
- Neighborhood for nonexistent pattern returns undefined

---

#### Taxonomy discovery via tags and sources

> **Invariant:** The API must aggregate tag values with counts across all patterns and categorize source files by type, returning empty reports when no patterns match.
>
> **Rationale:** Tag aggregation reveals annotation coverage gaps and source inventory helps teams understand their codebase composition — both are essential for project health monitoring.

**Verified by:**

- Tag aggregation counts values across patterns
- Source inventory categorizes files by type
- Tags with no patterns returns empty report

---

#### Coverage analysis reports annotation completeness

> **Invariant:** Coverage analysis must detect unused taxonomy entries, cross-context integration points, and include all relationship types (implements, dependsOn, enables) in neighborhood views.
>
> **Rationale:** Unused taxonomy entries indicate dead configuration while missing relationship types produce incomplete architecture views — both degrade the reliability of generated documentation.

**Verified by:**

- Unused taxonomy detection
- Cross-context comparison with integration points
- Neighborhood includes implements relationships
- Neighborhood includes dependsOn and enables relationships

_arch-queries.feature_

### Context Assembler Tests

_Tests for assembleContext(), buildDepTree(), buildFileReadingList(), and_

---

#### assembleContext produces session-tailored context bundles

> **Invariant:** Each session type (design/planning/implement) must include exactly the context sections defined by its profile — no more, no less.
>
> **Rationale:** Over-fetching wastes AI context window tokens; under-fetching causes the agent to make uninformed decisions.

**Verified by:**

- Design session includes stubs, consumers, and architecture
- Planning session includes only metadata and dependencies
- Implement session includes deliverables and FSM
- Multi-pattern context merges metadata from both patterns
- Pattern not found returns error with suggestion
- Description preserves Problem and Solution structure
- Solution text with inline bold is not truncated
- Design session includes stubs
- consumers
- and architecture

---

#### buildDepTree walks dependency chains with cycle detection

> **Invariant:** The dependency tree must walk the full chain up to the depth limit, mark the focal node, and terminate safely on circular references.
>
> **Rationale:** Dependency chains reveal implementation prerequisites — cycles and infinite recursion would crash the CLI.

**Verified by:**

- Dependency tree shows chain with status markers
- Depth limit truncates branches
- Circular dependencies are handled safely
- Standalone pattern returns single-node tree

---

#### buildOverview provides executive project summary

> **Invariant:** The overview must include progress counts (completed/active/planned), active phase listing, and blocking dependencies.
>
> **Rationale:** The overview is the first command in every session start recipe — it must provide a complete project health snapshot.

**Verified by:**

- Overview shows progress, active phases, and blocking
- Empty dataset returns zero-state overview
- Overview shows progress
- active phases
- and blocking

---

#### buildFileReadingList returns paths by relevance

> **Invariant:** Primary files (spec, implementation) must always be included; related files (dependency implementations) are included only when requested.
>
> **Rationale:** File reading lists power the "what to read" guidance — relevance sorting ensures the most important files are read first within token budgets.

**Verified by:**

- File list includes primary and related files
- File list includes implementation files for completed dependencies
- File list without related returns only primary

_context-assembler.feature_

### Context Formatter Tests

_Tests for formatContextBundle(), formatDepTree(), formatFileReadingList(),_

---

#### formatContextBundle renders section markers

> **Invariant:** The context formatter must render section markers for all populated sections in a context bundle, with design bundles rendering all sections and implement bundles focusing on deliverables and FSM.
>
> **Rationale:** Section markers enable structured parsing of context output — without them, AI consumers cannot reliably extract specific sections from the formatted bundle.

**Verified by:**

- Design bundle renders all populated sections
- Implement bundle renders deliverables and FSM

---

#### formatDepTree renders indented tree

> **Invariant:** The dependency tree formatter must render with indentation arrows and a focal pattern marker to visually distinguish the target pattern from its dependencies.
>
> **Rationale:** Visual hierarchy in the dependency tree makes dependency chains scannable at a glance — flat output would require mental parsing to understand depth and relationships.

**Verified by:**

- Tree renders with arrows and focal marker

---

#### formatOverview renders progress summary

> **Invariant:** The overview formatter must render a progress summary line showing completion metrics for the project and point users to the current query script name.
>
> **Rationale:** The progress line is the first thing developers see when starting a session — it provides immediate project health awareness, and the follow-up command guidance must be copy-pasteable.

**Verified by:**

- Overview renders progress line
- Overview renders architect query guidance

---

#### formatFileReadingList renders categorized file paths

> **Invariant:** The file reading list formatter must categorize paths into primary and dependency sections, producing minimal output when the list is empty.
>
> **Rationale:** Categorized file lists tell developers which files to read first (primary) versus reference (dependency) — uncategorized lists waste time on low-priority files.

**Verified by:**

- File list renders primary and dependency sections
- Empty file reading list renders minimal output

_context-formatter.feature_

### Fuzzy Match Tests

_Validates tiered fuzzy matching: exact > prefix > substring > Levenshtein._

---

#### Fuzzy matching uses tiered scoring

> **Invariant:** Pattern matching must use a tiered scoring system: exact match (1.0) > prefix match (0.9) > substring match (0.7) > Levenshtein distance, with results sorted by score descending and case-insensitive matching.
>
> **Rationale:** Tiered scoring ensures the most intuitive match wins — an exact match should always rank above a substring match, preventing surprising suggestions for common pattern names.

**Verified by:**

- Exact match scores 1.0
- Exact match is case-insensitive
- Prefix match scores above 0.9
- Substring match scores 0.7
- Levenshtein match for close typos
- Results are sorted by score descending
- Prefix matches rank shorter names higher
- Prefix match scores reflect query coverage
- Empty query matches all patterns as prefix
- No candidate patterns returns no results

---

#### findBestMatch returns single suggestion

> **Invariant:** findBestMatch must return the single highest-scoring match above the threshold, or undefined when no match exceeds the threshold.
>
> **Rationale:** A single best suggestion simplifies "did you mean?" prompts in the CLI — returning multiple matches would require additional UI to disambiguate.

**Verified by:**

- Best match returns suggestion above threshold
- No match returns undefined when below threshold

---

#### Levenshtein distance computation

> **Invariant:** The Levenshtein distance function must correctly compute edit distance between strings, returning 0 for identical strings.
>
> **Rationale:** Levenshtein distance is the fallback matching tier — incorrect distance computation would produce wrong fuzzy match scores for typo correction.

**Verified by:**

- Identical strings have distance 0
- Single character difference

_fuzzy-match.feature_

### Generate Docs Cli

_Command-line interface for generating documentation from annotated TypeScript._

---

#### CLI displays help and version information

> **Invariant:** The --help and -v flags must produce usage/version output and exit successfully without requiring other arguments.
>
> **Rationale:** Help and version are universal CLI conventions — they must work standalone so users can discover usage without reading external documentation.

**Verified by:**

- Display help with --help flag
- Display version with -v flag

---

#### CLI requires input patterns

> **Invariant:** The generate-docs CLI must fail with a clear error when the --input flag is not provided.
>
> **Rationale:** Without input source paths, the generator has nothing to scan — failing early with a clear message prevents confusing "no patterns found" errors downstream.

**Verified by:**

- Fail without --input flag

---

#### CLI lists available generators

> **Invariant:** The --list-generators flag must display all registered generator names without performing any generation, including config-registered reference meta-generators.
>
> **Rationale:** Users need to discover available generators before specifying --generator — listing them avoids trial-and-error with invalid generator names and must reflect the project config they are running against.

**Verified by:**

- List generators with --list-generators
- List generators includes config-registered reference meta-generators

---

#### CLI generates documentation from source files

> **Invariant:** Given valid input patterns and a generator name, the CLI must scan sources, extract patterns, and produce markdown output files.
>
> **Rationale:** This is the core pipeline — the CLI is the primary entry point for transforming annotated source code into generated documentation.

**Verified by:**

- Generate patterns documentation
- Use default generator (patterns) when not specified

---

#### CLI rejects unknown options

> **Invariant:** Unrecognized CLI flags must cause an error with a descriptive message rather than being silently ignored.
>
> **Rationale:** Silent flag ignoring hides typos and misconfigurations — users typing --ouput instead of --output would get unexpected default behavior without realizing their flag was ignored.

**Verified by:**

- Unknown option causes error

_generate-docs.feature_

### Handoff Generator Tests

_Multi-session work loses critical state between sessions when handoff_

---

#### Handoff generates compact session state summary

> **Invariant:** The handoff generator must produce a compact session state summary including pattern status, discovered items, inferred session type, modified files, and dependency blockers, throwing an error for unknown patterns.
>
> **Rationale:** Handoff documents are the bridge between multi-session work — without compact state capture, the next session starts from scratch instead of resuming where the previous one left off.

**Verified by:**

- Generate handoff for in-progress pattern
- Handoff captures discovered items
- Session type is inferred from status
- Completed pattern infers review session type
- Deferred pattern infers design session type
- Files modified section included when provided
- Blockers section shows incomplete dependencies
- Pattern not found throws error

---

#### Formatter produces structured text output

> **Invariant:** The handoff formatter must produce structured text output with ADR-008 section markers for machine-parseable session state.
>
> **Rationale:** ADR-008 markers enable the context assembler to parse handoff output programmatically — unstructured text would require fragile regex parsing.

**Verified by:**

- Handoff formatter produces markers per ADR-008

_handoff-generator.feature_

### Lint Patterns Cli

_Command-line interface for validating pattern annotation quality._

---

#### CLI displays help and version information

> **Invariant:** The --help and -v flags must produce usage/version output and exit successfully without requiring other arguments.
>
> **Rationale:** Help and version are universal CLI conventions — they must work standalone so users can discover usage without reading external documentation.

**Verified by:**

- Display help with --help flag
- Display version with -v flag

---

#### CLI requires input patterns

> **Invariant:** The lint-patterns CLI must fail with a clear error when the --input flag is not provided.
>
> **Rationale:** Without input paths, the linter has nothing to validate — failing early prevents confusing "no violations" output that falsely implies clean annotations.

**Verified by:**

- Fail without --input flag

---

#### Lint passes for valid patterns

> **Invariant:** Fully annotated patterns with all required tags must pass linting with zero violations.
>
> **Rationale:** False positives erode developer trust in the linter — valid annotations must always pass to maintain the tool's credibility.

**Verified by:**

- Lint passes for complete annotations

---

#### Lint detects violations in incomplete patterns

> **Invariant:** Patterns with missing or incomplete annotations must produce specific violation reports identifying what is missing.
>
> **Rationale:** Actionable violation messages guide developers to fix annotations — generic "lint failed" messages without specifics waste debugging time.

**Verified by:**

- Report violations for incomplete annotations

---

#### CLI supports multiple output formats

> **Invariant:** The CLI must support JSON and pretty (human-readable) output formats, with pretty as the default.
>
> **Rationale:** Pretty format serves interactive use while JSON format enables CI/CD pipeline integration and programmatic consumption of lint results.

**Verified by:**

- JSON output format
- Pretty output format is default

---

#### Strict mode treats warnings as errors

> **Invariant:** When --strict is enabled, warnings must be promoted to errors causing a non-zero exit code; without --strict, warnings must not cause failure.
>
> **Rationale:** CI pipelines need strict enforcement while local development benefits from lenient mode — the flag lets teams choose their enforcement level.

**Verified by:**

- Strict mode fails on warnings
- Non-strict mode passes with warnings

_lint-patterns.feature_

### Lint Process Cli

_Command-line interface for validating changes against delivery process rules._

---

#### CLI displays help and version information

> **Invariant:** The --help/-h and --version/-v flags must produce usage/version output and exit successfully without requiring other arguments.
>
> **Rationale:** Help and version are universal CLI conventions — both short and long flag forms must work for discoverability and scripting compatibility.

**Verified by:**

- Display help with --help flag
- Display help with -h flag
- Display version with --version flag
- Display version with -v flag

---

#### CLI requires git repository for validation

> **Invariant:** The lint-process CLI must fail with a clear error when run outside a git repository in both staged and all modes.
>
> **Rationale:** Process guard validation depends on git diff for change detection — running without git produces undefined behavior rather than useful validation results.

**Verified by:**

- Fail without git repository in staged mode
- Fail without git repository in all mode

---

#### CLI validates file mode input

> **Invariant:** In file mode, the CLI must require at least one file path via positional argument or --file flag, and fail with a clear error when none is provided.
>
> **Rationale:** File mode is for targeted validation of specific files — accepting zero files would silently produce a "no violations" result that falsely implies the files are valid.

**Verified by:**

- Fail when files mode has no files
- Accept file via positional argument
- Accept file via --file flag

---

#### CLI handles no changes gracefully

> **Invariant:** When no relevant changes are detected (empty diff), the CLI must exit successfully with a zero exit code.
>
> **Rationale:** No changes means no violations are possible — failing on empty diffs would break CI pipelines on commits that only modify non-spec files.

**Verified by:**

- No changes detected exits successfully

---

#### CLI supports multiple output formats

> **Invariant:** The CLI must support JSON and pretty (human-readable) output formats, with pretty as the default.
>
> **Rationale:** Pretty format serves interactive pre-commit use while JSON format enables CI/CD pipeline integration and automated violation processing.

**Verified by:**

- JSON output format
- Pretty output format is default

---

#### CLI supports debug options

> **Invariant:** The --show-state flag must display the derived process state (FSM states, protection levels, deliverables) without affecting validation behavior.
>
> **Rationale:** Process guard decisions are derived from complex state — exposing the intermediate state helps developers understand why a specific validation passed or failed.

**Verified by:**

- Show state flag displays derived state

---

#### CLI warns about unknown flags

> **Invariant:** Unrecognized CLI flags must produce a warning message but allow execution to continue.
>
> **Rationale:** Process validation is critical-path at commit time — hard-failing on a typo in an optional flag would block commits unnecessarily when the core validation would succeed.

**Verified by:**

- Warn on unknown flag but continue

_lint-process.feature_

### Output Pipeline Tests

_Validates the output pipeline transforms: summarization, modifiers,_

---

#### Output modifiers apply with correct precedence

> **Invariant:** Output modifiers (count, names-only, fields, full) must apply to pattern arrays with correct precedence, passing scalar inputs through unchanged, with summaries as the default mode.
>
> **Rationale:** Predictable modifier behavior enables composable CLI queries — unexpected precedence or scalar handling would produce confusing output for piped commands.

**Verified by:**

- Default mode returns summaries for pattern arrays
- Count modifier returns integer
- Names-only modifier returns string array
- Fields modifier picks specific fields
- Full modifier bypasses summarization
- Scalar input passes through unchanged
- Fields with single field returns objects with one key

---

#### Modifier conflicts are rejected

> **Invariant:** Mutually exclusive modifier combinations (full+names-only, full+count, full+fields) and invalid field names must be rejected with clear error messages.
>
> **Rationale:** Conflicting modifiers produce ambiguous intent — rejecting early with a clear message is better than silently picking one modifier and ignoring the other.

**Verified by:**

- Full combined with names-only is rejected
- Full combined with count is rejected
- Full combined with fields is rejected
- Invalid field name is rejected

---

#### List filters compose via AND logic

> **Invariant:** Multiple list filters (status, category) must compose via AND logic, with pagination (limit/offset) applied after filtering and empty results for out-of-range offsets.
>
> **Rationale:** AND composition is the intuitive default for filters — "status=active AND category=core" should narrow results, not widen them via OR logic.

**Verified by:**

- Filter by status returns matching patterns
- Filter by status and category narrows results
- Pagination with limit and offset
- Offset beyond array length returns empty results

---

#### Empty stripping removes noise

> **Invariant:** Null and empty values must be stripped from output objects to reduce noise in API responses.
>
> **Rationale:** Empty fields in pattern summaries create visual clutter and waste tokens in AI context windows — stripping them keeps output focused on meaningful data.

**Verified by:**

- Null and empty values are stripped

_output-pipeline.feature_

### Pattern Summarize Tests

_Validates that summarizePattern() projects ExtractedPattern (~3.5KB) to_

---

#### summarizePattern projects to compact summary

> **Invariant:** summarizePattern must project a full pattern object to a compact summary containing exactly 6 fields, using the patternName tag over the name field when available and omitting undefined optional fields.
>
> **Rationale:** Compact summaries reduce token usage by 80-90% compared to full patterns — they provide enough context for navigation without overwhelming AI context windows.

**Verified by:**

- Summary includes all 6 fields for a TypeScript pattern
- Summary includes all 6 fields for a Gherkin pattern
- Summary uses patternName tag over name field
- Summary omits undefined optional fields

---

#### summarizePatterns batch processes arrays

> **Invariant:** summarizePatterns must batch-process an array of patterns, returning a correctly-sized array of compact summaries.
>
> **Rationale:** Batch processing avoids N individual function calls — the API frequently needs to summarize all patterns matching a query in a single operation.

**Verified by:**

- Batch summarization returns correct count

_summarize.feature_

### Process Api Cli Cache

_MasterDataset caching between CLI invocations: cache hits, mtime invalidation, and --no-cache bypass._

---

#### MasterDataset is cached between invocations

> **Invariant:** When source files have not changed between CLI invocations, the second invocation must use the cached MasterDataset and report cache.hit as true with reduced pipelineMs.
>
> **Rationale:** The pipeline rebuild costs 2-5 seconds per invocation. Caching eliminates this cost for repeated queries against unchanged sources, which is the common case during interactive AI sessions.

**Verified by:**

- Second query uses cached dataset
- Cache invalidated on source file change
- No-cache flag bypasses cache

_data-api-cache.feature_

### Process Api Cli Core

_Core CLI infrastructure: help, version, input validation, status, query, pattern, arch basics, missing args, edge cases._

---

#### CLI displays help and version information

> **Invariant:** The CLI must always provide discoverable usage and version information via standard flags.
>
> **Rationale:** Without accessible help and version output, users cannot self-serve CLI usage or report issues with a specific version.

**Verified by:**

- Display help with --help flag
- Display version with -v flag
- No subcommand shows help

---

#### CLI requires input flag for subcommands

> **Invariant:** Every data-querying subcommand must receive either an explicit `--input` glob or a project config that provides source globs.
>
> **Rationale:** Without an input source, the pipeline has no files to scan and would produce empty or misleading results instead of a clear error, but project config auto-detection should remove that boilerplate when the repo is configured.

**Verified by:**

- Fail without --input flag when running status
- Use architect.config.js sources when --input is omitted
- Reject unknown options

---

#### CLI status subcommand shows delivery state

> **Invariant:** The status subcommand must return structured JSON containing delivery progress derived from the MasterDataset.
>
> **Rationale:** Consumers depend on machine-readable status output for scripting and CI integration; unstructured output breaks downstream automation.

**Verified by:**

- Status shows counts and completion percentage

---

#### CLI query subcommand executes API methods

> **Invariant:** The query subcommand must dispatch to any public Data API method by name and pass positional arguments through.
>
> **Rationale:** The CLI is the primary interface for ad-hoc queries; failing to resolve a valid method name or its arguments silently drops the user's request.

**Verified by:**

- Query getStatusCounts returns count object
- Query isValidTransition with arguments
- Unknown API method shows error

---

#### CLI pattern subcommand shows pattern detail

> **Invariant:** The pattern subcommand must return the full JSON detail for an exact pattern name match, or a clear error if not found.
>
> **Rationale:** Pattern lookup is the primary debugging tool for annotation issues; ambiguous or silent failures waste investigation time.

**Verified by:**

- Pattern lookup returns full detail
- Pattern not found shows error

---

#### CLI arch subcommand queries architecture

> **Invariant:** The arch subcommand must expose role, bounded context, and layer queries over the MasterDataset's architecture metadata.
>
> **Rationale:** Architecture queries replace manual exploration of annotated sources; missing or incorrect results lead to wrong structural assumptions during design sessions.

**Verified by:**

- Arch roles lists roles with counts
- Arch context filters to bounded context
- Arch layer lists layers with counts

---

#### CLI shows errors for missing subcommand arguments

> **Invariant:** Subcommands that require arguments must reject invocations with missing arguments and display usage guidance.
>
> **Rationale:** Silent acceptance of incomplete input would produce confusing pipeline errors instead of actionable feedback at the CLI boundary.

**Verified by:**

- Query without method name shows error
- Pattern without name shows error
- Unknown subcommand shows error

---

#### CLI handles argument edge cases

> **Invariant:** The CLI must gracefully handle non-standard argument forms including numeric coercion and the `--` pnpm separator.
>
> **Rationale:** Real-world invocations via pnpm pass `--` separators and numeric strings; mishandling these causes silent data loss or crashes in automated workflows.

**Verified by:**

- Integer arguments are coerced for phase queries
- Double-dash separator is handled gracefully

_process-api-core.feature_

### Process Api Cli Dry Run

_Dry-run mode shows pipeline scope without processing data._

---

#### Dry-run shows pipeline scope without processing

> **Invariant:** The --dry-run flag must display file counts, config status, and cache status without executing the pipeline. Output must contain the DRY RUN marker and must not contain a JSON success envelope.
>
> **Rationale:** Dry-run enables users to verify their input patterns resolve to expected files before committing to the 2-5s pipeline cost, which is especially valuable when debugging glob patterns or config auto-detection.

**Verified by:**

- Dry-run shows file counts
- Dry-run reports architect.config.js auto-detection

_data-api-dryrun.feature_

### Process Api Cli Help

_Per-subcommand help displays usage, flags, and examples for individual subcommands._

---

#### Per-subcommand help shows usage and flags

> **Invariant:** Running any subcommand with --help must display usage information specific to that subcommand, including applicable flags and examples. Unknown subcommands must fall back to a descriptive message.
>
> **Rationale:** Per-subcommand help replaces the need to scroll through full --help output and provides contextual guidance for subcommand-specific flags like --session.

**Verified by:**

- Per-subcommand help for context
- Global help still works
- Unknown subcommand help

_data-api-help.feature_

### Process Api Cli Metadata

_Response metadata includes validation summary and pipeline timing for diagnostics._

---

#### Response metadata includes validation summary

> **Invariant:** Every JSON response envelope must include a metadata.validation object with danglingReferenceCount, malformedPatternCount, unknownStatusCount, and warningCount fields, plus a numeric pipelineMs timing.
>
> **Rationale:** Consumers use validation counts to detect annotation quality degradation without running a separate validation pass. Pipeline timing enables performance regression detection in CI.

**Verified by:**

- Validation summary in response metadata
- Pipeline timing in metadata

_data-api-metadata.feature_

### Process Api Cli Modifiers And Rules

_Output modifiers, arch health, and rules subcommand._

---

#### Output modifiers work when placed after the subcommand

> **Invariant:** Output modifiers (--count, --names-only, --fields) produce identical results regardless of position relative to the subcommand and its filters.
>
> **Rationale:** Users should not need to memorize argument ordering rules; the CLI should be forgiving.

**Verified by:**

- Count modifier after list subcommand returns count
- Names-only modifier after list subcommand returns names
- Count modifier combined with list filter

---

#### CLI arch health subcommands detect graph quality issues

> **Invariant:** Health subcommands (dangling, orphans, blocking) operate on the relationship index, not the architecture index, and return results without requiring arch annotations.
>
> **Rationale:** Graph quality issues (broken references, isolated patterns, blocked dependencies) are relationship-level concerns that should be queryable even when no architecture metadata exists.

**Verified by:**

- Arch dangling returns broken references
- Arch orphans returns isolated patterns
- Arch blocking returns blocked patterns

---

#### CLI rules subcommand queries business rules and invariants

> **Invariant:** The rules subcommand returns structured business rules extracted from Gherkin Rule: blocks, grouped by product area and phase, with parsed invariant and rationale annotations.
>
> **Rationale:** Live business rule queries replace static generated markdown, enabling on-demand filtering by product area, pattern, and invariant presence.

**Verified by:**

- Rules returns business rules from feature files
- Rules filters by product area
- Rules with count modifier returns totals
- Rules with names-only returns flat array
- Rules filters by pattern name
- Rules with only-invariants excludes rules without invariants
- Rules product area filter excludes non-matching areas
- Rules for non-existent product area returns hint
- Rules combines product area and only-invariants filters

_process-api-modifiers-rules.feature_

### Process Api Cli Repl

_Interactive REPL mode keeps the pipeline loaded for multi-query sessions and supports reload._

---

#### REPL mode accepts multiple queries on a single pipeline load

> **Invariant:** REPL mode loads the pipeline once and accepts multiple queries on stdin, eliminating per-query pipeline overhead.
>
> **Rationale:** Design sessions involve 10-20 exploratory queries in sequence. REPL mode eliminates per-query pipeline overhead entirely.

**Verified by:**

- REPL accepts multiple queries
- REPL shows help output

---

#### REPL reload rebuilds the pipeline from fresh sources

> **Invariant:** The reload command rebuilds the pipeline from fresh sources and subsequent queries use the new dataset.
>
> **Rationale:** During implementation sessions, source files change frequently. Reload allows refreshing without restarting the REPL.

**Verified by:**

- REPL reloads pipeline on command

_data-api-repl.feature_

### Process Api Cli Subcommands

_Discovery subcommands: list, search, context assembly, tags/sources, extended arch, unannotated._

---

#### CLI list subcommand filters patterns

> **Invariant:** The list subcommand must return a valid JSON result for valid filters and a non-zero exit code with a descriptive error for invalid filters.
>
> **Rationale:** Consumers parse list output programmatically; malformed JSON or silent failures cause downstream tooling to break without diagnosis.

**Verified by:**

- List all patterns returns JSON array
- List with invalid phase shows error

---

#### CLI search subcommand finds patterns by fuzzy match

> **Invariant:** The search subcommand must require a query argument and return only patterns whose names match the query.
>
> **Rationale:** Missing query validation would produce unfiltered result sets, defeating the purpose of search and wasting context budget in AI sessions.

**Verified by:**

- Search returns matching patterns
- Search without query shows error

---

#### CLI context assembly subcommands return text output

> **Invariant:** Context assembly subcommands (context, overview, dep-tree) must produce non-empty human-readable text containing the requested pattern or summary, and require a pattern argument where applicable.
>
> **Rationale:** These subcommands replace manual file reads in AI sessions; empty or off-target output forces expensive explore-agent fallbacks that consume 5-10x more context.

**Verified by:**

- Context returns curated text bundle
- Context without pattern name shows error
- Overview returns executive summary text
- Dep-tree returns dependency tree text

---

#### CLI tags and sources subcommands return JSON

> **Invariant:** The tags and sources subcommands must return valid JSON with the expected top-level structure (data key for tags, array for sources).
>
> **Rationale:** Annotation exploration depends on machine-parseable output; invalid JSON prevents automated enrichment workflows from detecting unannotated files and tag gaps.

**Verified by:**

- Tags returns tag usage counts
- Sources returns file inventory

---

#### CLI extended arch subcommands query architecture relationships

> **Invariant:** Extended arch subcommands (neighborhood, compare, coverage) must return valid JSON reflecting the actual architecture relationships present in the scanned sources.
>
> **Rationale:** Architecture queries drive design-session decisions; stale or structurally invalid output leads to incorrect dependency analysis and missed coupling between bounded contexts.

**Verified by:**

- Arch neighborhood returns pattern relationships
- Arch compare returns context comparison
- Arch coverage returns annotation coverage

---

#### CLI unannotated subcommand finds files without annotations

> **Invariant:** The unannotated subcommand must return valid JSON listing every TypeScript file that lacks the `@architect` opt-in marker.
>
> **Rationale:** Files missing the opt-in marker are invisible to the scanner; without this subcommand, unannotated files silently drop out of generated documentation and validation.

**Verified by:**

- Unannotated finds files missing architect marker

_process-api-subcommands.feature_

### Process Api Reference Tests

_Verifies that the declarative CLI schema drives reference table generation_

---

#### Generated reference file contains all three table sections

> **Invariant:** PROCESS-API-REFERENCE.md contains Global Options, Output Modifiers, and List Filters tables generated from the CLI schema.

**Verified by:**

- Generated file contains Global Options table
- Generated file contains Output Modifiers table
- Generated file contains List Filters table
- Generated file includes inter-table prose

---

#### CLI schema stays in sync with parser

> **Invariant:** Every flag recognized by parseArgs() has a corresponding entry in the CLI schema. A missing schema entry means the sync test fails.

**Verified by:**

- Schema covers all global option flags
- Schema covers all output modifier flags
- Schema covers all list filter flags
- Schema covers session option

---

#### showHelp output reflects CLI schema

> **Invariant:** The help text rendered by showHelp() includes all options from the CLI schema, formatted for terminal display.

**Verified by:**

- Help text includes schema-defined options

_process-api-reference.feature_

### Process State API

_- Markdown generation is not ideal for programmatic access_

---

#### Status queries return correct patterns

> **Invariant:** Status queries must correctly filter by both normalized status (planned = roadmap + deferred) and FSM status (exact match).
>
> **Rationale:** The two-domain status convention requires separate query methods — mixing them produces incorrect filtered results.

**Verified by:**

- Get patterns by normalized status
- Get patterns by FSM status
- Get current work returns active patterns
- Get roadmap items returns roadmap and deferred
- Get status counts
- Get completion percentage

---

#### Phase queries return correct phase data

> **Invariant:** Phase queries must return only patterns in the requested phase, with accurate progress counts and completion percentage.
>
> **Rationale:** Phase-level queries power the roadmap and session planning views — incorrect counts cascade into wrong progress percentages.

**Verified by:**

- Get patterns by phase
- Get phase progress
- Get nonexistent phase returns undefined
- Get active phases

---

#### FSM queries expose transition validation

> **Invariant:** FSM queries must validate transitions against the PDR-005 state machine and expose protection levels per status.
>
> **Rationale:** Programmatic FSM access enables tooling to enforce delivery process rules without reimplementing the state machine.

**Verified by:**

- Check valid transition
- Check invalid transition
- Get valid transitions from status
- Get protection info

---

#### Pattern queries find and retrieve pattern data

> **Invariant:** Pattern lookup must be case-insensitive by name, and category queries must return only patterns with the requested category.
>
> **Rationale:** Case-insensitive search reduces friction in CLI and AI agent usage where exact casing is often unknown.

**Verified by:**

- Find pattern by name (case insensitive)
- Find nonexistent pattern returns undefined
- Get patterns by category
- Get all categories with counts

---

#### Timeline queries group patterns by time

> **Invariant:** Quarter queries must correctly filter by quarter string, and recently completed must be sorted by date descending with limit.
>
> **Rationale:** Timeline grouping enables quarterly reporting and session context — recent completions show delivery momentum.

**Verified by:**

- Get patterns by quarter
- Get all quarters
- Get recently completed sorted by date

_process-state-api.feature_

### Scope Validator Tests

_Starting an implementation or design session without checking prerequisites_

---

#### Implementation scope validation checks all prerequisites

> **Invariant:** Implementation scope validation must check FSM transition validity, dependency completeness, PDR references, and deliverable presence, with strict mode promoting warnings to blockers.
>
> **Rationale:** Starting implementation without passing scope validation wastes an entire session — the validator catches all known blockers before any code is written.

**Verified by:**

- All implementation checks pass
- Incomplete dependency blocks implementation
- FSM transition from completed blocks implementation
- Active pattern passes FSM check for implementation
- Missing PDR references produce WARN
- No deliverables blocks implementation
- Strict mode promotes WARN to BLOCKED
- Pattern not found throws error

---

#### Design scope validation checks dependency stubs

> **Invariant:** Design scope validation must verify that dependencies have corresponding code stubs, producing warnings when stubs are missing.
>
> **Rationale:** Design sessions that reference unstubbed dependencies cannot produce actionable interfaces — stub presence indicates the dependency's API surface is at least sketched.

**Verified by:**

- Design session with no dependencies passes
- Design session with dependencies lacking stubs produces WARN

---

#### Formatter produces structured text output

> **Invariant:** The scope validator formatter must produce structured text with ADR-008 markers, showing verdict text for warnings and blocker details for blocked verdicts.
>
> **Rationale:** Structured formatter output enables the CLI to display verdicts consistently — unstructured output would vary by validation type and be hard to parse.

**Verified by:**

- Formatter produces markers per ADR-008
- Formatter shows warnings verdict text
- Formatter shows blocker details for blocked verdict

_scope-validator.feature_

### Stub Resolver Tests

_Design session stubs need structured discovery and resolution_

---

#### Stubs are identified by path or target metadata

> **Invariant:** A pattern must be identified as a stub if it resides in the stubs directory OR has a targetPath metadata field.
>
> **Rationale:** Dual identification supports both convention-based (directory) and metadata-based (targetPath) stub detection — relying on only one would miss stubs organized differently.

**Verified by:**

- Patterns in stubs directory are identified as stubs
- Patterns with targetPath are identified as stubs

---

#### Stubs are resolved against the filesystem

> **Invariant:** Resolved stubs must show whether their target file exists on the filesystem and must be grouped by the pattern they implement.
>
> **Rationale:** Target existence status tells developers whether a stub has been implemented — grouping by pattern enables the "stubs --unresolved" command to show per-pattern implementation gaps.

**Verified by:**

- Resolved stubs show target existence status
- Stubs are grouped by implementing pattern

---

#### Decision items are extracted from descriptions

> **Invariant:** AD-N formatted items must be extracted from pattern description text, with empty descriptions returning no items and malformed items being skipped.
>
> **Rationale:** Decision items (AD-1, AD-2, etc.) link stubs to architectural decisions — extracting them enables traceability from code stubs back to the design rationale.

**Verified by:**

- AD-N items are extracted from description text
- Empty description returns no decision items
- Malformed AD items are skipped

---

#### PDR references are found across patterns

> **Invariant:** The resolver must find all patterns that reference a given PDR identifier, returning empty results when no references exist.
>
> **Rationale:** PDR cross-referencing enables impact analysis — knowing which patterns reference a decision helps assess the blast radius of changing that decision.

**Verified by:**

- Patterns referencing a PDR are found
- No references returns empty result

_stub-resolver.feature_

### Stub Taxonomy Tag Tests

_Stub metadata (target path, design session) was stored as plain text_

---

#### Taxonomy tags are registered in the registry

> **Invariant:** The target and since stub metadata tags must be registered in the tag registry as recognized taxonomy entries.
>
> **Rationale:** Unregistered tags would be flagged as unknown by the linter — registration ensures stub metadata tags pass validation alongside standard annotation tags.

**Verified by:**

- Target and since tags exist in registry

---

#### Tags are part of the stub metadata group

> **Invariant:** The target and since tags must be grouped under the stub metadata domain in the built registry.
>
> **Rationale:** Domain grouping enables the taxonomy codec to render stub metadata tags in their own section — ungrouped tags would be lost in the "Other" category.

**Verified by:**

- Built registry groups target and since as stub tags

_taxonomy-tags.feature_

### Validate Patterns Cli

_Command-line interface for cross-validating TypeScript patterns vs Gherkin feature files._

---

#### CLI displays help and version information

> **Invariant:** The --help/-h and --version/-v flags must produce usage/version output and exit successfully without requiring other arguments.
>
> **Rationale:** Help and version are universal CLI conventions — both short and long flag forms must work for discoverability and scripting compatibility.

**Verified by:**

- Display help with --help flag
- Display help with -h flag
- Display version with --version flag
- Display version with -v flag

---

#### CLI requires input and feature patterns

> **Invariant:** The validate-patterns CLI must fail with clear errors when either --input or --features flags are missing.
>
> **Rationale:** Cross-source validation requires both TypeScript and Gherkin inputs — running with only one source would produce incomplete validation that misses cross-source mismatches.

**Verified by:**

- Fail without --input flag
- Fail without --features flag

---

#### CLI validates patterns across TypeScript and Gherkin sources

> **Invariant:** The validator must detect mismatches between TypeScript and Gherkin sources including phase and status discrepancies.
>
> **Rationale:** Dual-source architecture requires consistency — a pattern with status "active" in TypeScript but "roadmap" in Gherkin creates conflicting truth and broken reports.

**Verified by:**

- Validation passes for matching patterns
- Detect phase mismatch between sources
- Detect status mismatch between sources

---

#### CLI supports multiple output formats

> **Invariant:** The CLI must support JSON and pretty (human-readable) output formats, with pretty as the default.
>
> **Rationale:** Pretty format serves interactive use while JSON format enables CI/CD pipeline integration and programmatic consumption of validation results.

**Verified by:**

- JSON output format
- Pretty output format is default

---

#### Strict mode treats warnings as errors

> **Invariant:** When --strict is enabled, warnings must be promoted to errors causing a non-zero exit code (exit 2); without --strict, warnings must not cause failure.
>
> **Rationale:** CI pipelines need strict enforcement while local development benefits from lenient mode — the flag lets teams choose their enforcement level.

**Verified by:**

- Strict mode exits with code 2 on warnings
- Non-strict mode passes with warnings

---

#### CLI warns about unknown flags

> **Invariant:** Unrecognized CLI flags must produce a warning message but allow execution to continue.
>
> **Rationale:** Pattern validation is non-destructive — warning without failing is more user-friendly than hard errors for minor flag typos, while still surfacing the issue.

**Verified by:**

- Warn on unknown flag but continue

_validate-patterns.feature_

---

[← Back to Business Rules](../BUSINESS-RULES.md)
