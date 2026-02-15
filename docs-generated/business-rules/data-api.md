# DataAPI Business Rules

**Purpose:** Business rules for the DataAPI product area

---

**85 rules** from 18 features. 11 rules have explicit invariants.

---

## Phase 25

### Pattern Helpers Tests

#### getPatternName uses patternName tag when available

_Verified by: Returns patternName when set, Falls back to name when patternName is absent_

#### findPatternByName performs case-insensitive matching

_Verified by: Exact case match, Case-insensitive match, No match returns undefined_

#### getRelationships looks up with case-insensitive fallback

_Verified by: Exact key match in relationship index, Case-insensitive fallback match, Missing relationship index returns undefined_

#### suggestPattern provides fuzzy suggestions

_Verified by: Suggests close match, No close match returns empty_

*pattern-helpers.feature*

---

## Uncategorized

### Arch Queries Test

#### Neighborhood and comparison views

_Verified by: Pattern neighborhood shows direct connections, Cross-context comparison shows shared and unique dependencies, Neighborhood for nonexistent pattern returns undefined_

#### Taxonomy discovery via tags and sources

_Verified by: Tag aggregation counts values across patterns, Source inventory categorizes files by type, Tags with no patterns returns empty report_

#### Coverage analysis reports annotation completeness

_Verified by: Unused taxonomy detection, Cross-context comparison with integration points, Neighborhood includes implements relationships, Neighborhood includes dependsOn and enables relationships_

*arch-queries.feature*

### Context Assembler Tests

*Tests for assembleContext(), buildDepTree(), buildFileReadingList(), and*

#### assembleContext produces session-tailored context bundles

**Invariant:** Each session type (design/planning/implement) must include exactly the context sections defined by its profile — no more, no less.

**Rationale:** Over-fetching wastes AI context window tokens; under-fetching causes the agent to make uninformed decisions.

_Verified by: Design session includes stubs, consumers, and architecture, Planning session includes only metadata and dependencies, Implement session includes deliverables and FSM, Multi-pattern context merges metadata from both patterns, Pattern not found returns error with suggestion, Description preserves Problem and Solution structure, Solution text with inline bold is not truncated, Design session includes stubs, consumers, and architecture_

#### buildDepTree walks dependency chains with cycle detection

**Invariant:** The dependency tree must walk the full chain up to the depth limit, mark the focal node, and terminate safely on circular references.

**Rationale:** Dependency chains reveal implementation prerequisites — cycles and infinite recursion would crash the CLI.

_Verified by: Dependency tree shows chain with status markers, Depth limit truncates branches, Circular dependencies are handled safely, Standalone pattern returns single-node tree_

#### buildOverview provides executive project summary

**Invariant:** The overview must include progress counts (completed/active/planned), active phase listing, and blocking dependencies.

**Rationale:** The overview is the first command in every session start recipe — it must provide a complete project health snapshot.

_Verified by: Overview shows progress, active phases, and blocking, Empty dataset returns zero-state overview, Overview shows progress, active phases, and blocking_

#### buildFileReadingList returns paths by relevance

**Invariant:** Primary files (spec, implementation) must always be included; related files (dependency implementations) are included only when requested.

**Rationale:** File reading lists power the "what to read" guidance — relevance sorting ensures the most important files are read first within token budgets.

_Verified by: File list includes primary and related files, File list includes implementation files for completed dependencies, File list without related returns only primary_

*context-assembler.feature*

### Context Formatter Tests

*Tests for formatContextBundle(), formatDepTree(), formatFileReadingList(),*

#### formatContextBundle renders section markers

_Verified by: Design bundle renders all populated sections, Implement bundle renders deliverables and FSM_

#### formatDepTree renders indented tree

_Verified by: Tree renders with arrows and focal marker_

#### formatOverview renders progress summary

_Verified by: Overview renders progress line_

#### formatFileReadingList renders categorized file paths

_Verified by: File list renders primary and dependency sections, Empty file reading list renders minimal output_

*context-formatter.feature*

### Fuzzy Match Tests

*Validates tiered fuzzy matching: exact > prefix > substring > Levenshtein.*

#### Fuzzy matching uses tiered scoring

_Verified by: Exact match scores 1.0, Exact match is case-insensitive, Prefix match scores 0.9, Substring match scores 0.7, Levenshtein match for close typos, Results are sorted by score descending, Empty query matches all patterns as prefix, No candidate patterns returns no results_

#### findBestMatch returns single suggestion

_Verified by: Best match returns suggestion above threshold, No match returns undefined when below threshold_

#### Levenshtein distance computation

_Verified by: Identical strings have distance 0, Single character difference_

*fuzzy-match.feature*

### Generate Docs Cli

*Command-line interface for generating documentation from annotated TypeScript.*

#### CLI displays help and version information

_Verified by: Display help with --help flag, Display version with -v flag_

#### CLI requires input patterns

_Verified by: Fail without --input flag_

#### CLI lists available generators

_Verified by: List generators with --list-generators_

#### CLI generates documentation from source files

_Verified by: Generate patterns documentation, Use default generator (patterns) when not specified_

#### CLI rejects unknown options

_Verified by: Unknown option causes error_

*generate-docs.feature*

### Generate Tag Taxonomy Cli

*Command-line interface for generating TAG_TAXONOMY.md from tag registry configuration.*

#### CLI displays help and version information

_Verified by: Display help with --help flag, Display help with -h flag, Display version with --version flag, Display version with -v flag_

#### CLI generates taxonomy at specified output path

_Verified by: Generate taxonomy at default path, Generate taxonomy at custom output path, Create output directory if missing_

#### CLI respects overwrite flag for existing files

_Verified by: Fail when output file exists without --overwrite, Overwrite existing file with -f flag, Overwrite existing file with --overwrite flag_

#### Generated taxonomy contains expected sections

_Verified by: Generated file contains category documentation, Generated file reports statistics_

#### CLI warns about unknown flags

_Verified by: Warn on unknown flag but continue_

*generate-tag-taxonomy.feature*

### Handoff Generator Tests

*Multi-session work loses critical state between sessions when handoff*

#### Handoff generates compact session state summary

_Verified by: Generate handoff for in-progress pattern, Handoff captures discovered items, Session type is inferred from status, Completed pattern infers review session type, Deferred pattern infers design session type, Files modified section included when provided, Blockers section shows incomplete dependencies, Pattern not found throws error_

#### Formatter produces structured text output

_Verified by: Handoff formatter produces markers per ADR-008_

*handoff-generator.feature*

### Lint Patterns Cli

*Command-line interface for validating pattern annotation quality.*

#### CLI displays help and version information

_Verified by: Display help with --help flag, Display version with -v flag_

#### CLI requires input patterns

_Verified by: Fail without --input flag_

#### Lint passes for valid patterns

_Verified by: Lint passes for complete annotations_

#### Lint detects violations in incomplete patterns

_Verified by: Report violations for incomplete annotations_

#### CLI supports multiple output formats

_Verified by: JSON output format, Pretty output format is default_

#### Strict mode treats warnings as errors

_Verified by: Strict mode fails on warnings, Non-strict mode passes with warnings_

*lint-patterns.feature*

### Lint Process Cli

*Command-line interface for validating changes against delivery process rules.*

#### CLI displays help and version information

_Verified by: Display help with --help flag, Display help with -h flag, Display version with --version flag, Display version with -v flag_

#### CLI requires git repository for validation

_Verified by: Fail without git repository in staged mode, Fail without git repository in all mode_

#### CLI validates file mode input

_Verified by: Fail when files mode has no files, Accept file via positional argument, Accept file via --file flag_

#### CLI handles no changes gracefully

_Verified by: No changes detected exits successfully_

#### CLI supports multiple output formats

_Verified by: JSON output format, Pretty output format is default_

#### CLI supports debug options

_Verified by: Show state flag displays derived state_

#### CLI warns about unknown flags

_Verified by: Warn on unknown flag but continue_

*lint-process.feature*

### Output Pipeline Tests

*Validates the output pipeline transforms: summarization, modifiers,*

#### Output modifiers apply with correct precedence

_Verified by: Default mode returns summaries for pattern arrays, Count modifier returns integer, Names-only modifier returns string array, Fields modifier picks specific fields, Full modifier bypasses summarization, Scalar input passes through unchanged, Fields with single field returns objects with one key_

#### Modifier conflicts are rejected

_Verified by: Full combined with names-only is rejected, Full combined with count is rejected, Full combined with fields is rejected, Invalid field name is rejected_

#### List filters compose via AND logic

_Verified by: Filter by status returns matching patterns, Filter by status and category narrows results, Pagination with limit and offset, Offset beyond array length returns empty results_

#### Empty stripping removes noise

_Verified by: Null and empty values are stripped_

*output-pipeline.feature*

### Pattern Summarize Tests

*Validates that summarizePattern() projects ExtractedPattern (~3.5KB) to*

#### summarizePattern projects to compact summary

_Verified by: Summary includes all 6 fields for a TypeScript pattern, Summary includes all 6 fields for a Gherkin pattern, Summary uses patternName tag over name field, Summary omits undefined optional fields_

#### summarizePatterns batch processes arrays

_Verified by: Batch summarization returns correct count_

*summarize.feature*

### Process Api Cli

*Command-line interface for querying delivery process state via ProcessStateAPI.*

#### CLI displays help and version information

_Verified by: Display help with --help flag, Display version with -v flag, No subcommand shows help_

#### CLI requires input flag for subcommands

_Verified by: Fail without --input flag when running status, Reject unknown options_

#### CLI status subcommand shows delivery state

_Verified by: Status shows counts and completion percentage_

#### CLI query subcommand executes API methods

_Verified by: Query getStatusCounts returns count object, Query isValidTransition with arguments, Unknown API method shows error_

#### CLI pattern subcommand shows pattern detail

_Verified by: Pattern lookup returns full detail, Pattern not found shows error_

#### CLI arch subcommand queries architecture

_Verified by: Arch roles lists roles with counts, Arch context filters to bounded context, Arch layer lists layers with counts_

#### CLI shows errors for missing subcommand arguments

_Verified by: Query without method name shows error, Pattern without name shows error, Unknown subcommand shows error_

#### CLI handles argument edge cases

_Verified by: Integer arguments are coerced for phase queries, Double-dash separator is handled gracefully_

#### CLI list subcommand filters patterns

_Verified by: List all patterns returns JSON array, List with invalid phase shows error_

#### CLI search subcommand finds patterns by fuzzy match

_Verified by: Search returns matching patterns, Search without query shows error_

#### CLI context assembly subcommands return text output

_Verified by: Context returns curated text bundle, Context without pattern name shows error, Overview returns executive summary text, Dep-tree returns dependency tree text_

#### CLI tags and sources subcommands return JSON

_Verified by: Tags returns tag usage counts, Sources returns file inventory_

#### CLI extended arch subcommands query architecture relationships

_Verified by: Arch neighborhood returns pattern relationships, Arch compare returns context comparison, Arch coverage returns annotation coverage_

#### CLI unannotated subcommand finds files without annotations

_Verified by: Unannotated finds files missing libar-docs marker_

#### Output modifiers work when placed after the subcommand

**Invariant:** Output modifiers (--count, --names-only, --fields) produce identical results regardless of position relative to the subcommand and its filters.

**Rationale:** Users should not need to memorize argument ordering rules; the CLI should be forgiving.

_Verified by: Count modifier after list subcommand returns count, Names-only modifier after list subcommand returns names, Count modifier combined with list filter_

#### CLI arch health subcommands detect graph quality issues

**Invariant:** Health subcommands (dangling, orphans, blocking) operate on the relationship index, not the architecture index, and return results without requiring arch annotations.

**Rationale:** Graph quality issues (broken references, isolated patterns, blocked dependencies) are relationship-level concerns that should be queryable even when no architecture metadata exists.

_Verified by: Arch dangling returns broken references, Arch orphans returns isolated patterns, Arch blocking returns blocked patterns_

*process-api.feature*

### Process State API

*- Markdown generation is not ideal for programmatic access*

#### Status queries return correct patterns

**Invariant:** Status queries must correctly filter by both normalized status (planned = roadmap + deferred) and FSM status (exact match).

**Rationale:** The two-domain status convention requires separate query methods — mixing them produces incorrect filtered results.

_Verified by: Get patterns by normalized status, Get patterns by FSM status, Get current work returns active patterns, Get roadmap items returns roadmap and deferred, Get status counts, Get completion percentage_

#### Phase queries return correct phase data

**Invariant:** Phase queries must return only patterns in the requested phase, with accurate progress counts and completion percentage.

**Rationale:** Phase-level queries power the roadmap and session planning views — incorrect counts cascade into wrong progress percentages.

_Verified by: Get patterns by phase, Get phase progress, Get nonexistent phase returns undefined, Get active phases_

#### FSM queries expose transition validation

**Invariant:** FSM queries must validate transitions against the PDR-005 state machine and expose protection levels per status.

**Rationale:** Programmatic FSM access enables tooling to enforce delivery process rules without reimplementing the state machine.

_Verified by: Check valid transition, Check invalid transition, Get valid transitions from status, Get protection info_

#### Pattern queries find and retrieve pattern data

**Invariant:** Pattern lookup must be case-insensitive by name, and category queries must return only patterns with the requested category.

**Rationale:** Case-insensitive search reduces friction in CLI and AI agent usage where exact casing is often unknown.

_Verified by: Find pattern by name (case insensitive), Find nonexistent pattern returns undefined, Get patterns by category, Get all categories with counts_

#### Timeline queries group patterns by time

**Invariant:** Quarter queries must correctly filter by quarter string, and recently completed must be sorted by date descending with limit.

**Rationale:** Timeline grouping enables quarterly reporting and session context — recent completions show delivery momentum.

_Verified by: Get patterns by quarter, Get all quarters, Get recently completed sorted by date_

*process-state-api.feature*

### Scope Validator Tests

*Starting an implementation or design session without checking prerequisites*

#### Implementation scope validation checks all prerequisites

_Verified by: All implementation checks pass, Incomplete dependency blocks implementation, FSM transition from completed blocks implementation, Missing PDR references produce WARN, No deliverables blocks implementation, Strict mode promotes WARN to BLOCKED, Pattern not found throws error_

#### Design scope validation checks dependency stubs

_Verified by: Design session with no dependencies passes, Design session with dependencies lacking stubs produces WARN_

#### Formatter produces structured text output

_Verified by: Formatter produces markers per ADR-008, Formatter shows warnings verdict text, Formatter shows blocker details for blocked verdict_

*scope-validator.feature*

### Stub Resolver Tests

*Design session stubs need structured discovery and resolution*

#### Stubs are identified by path or target metadata

_Verified by: Patterns in stubs directory are identified as stubs, Patterns with targetPath are identified as stubs_

#### Stubs are resolved against the filesystem

_Verified by: Resolved stubs show target existence status, Stubs are grouped by implementing pattern_

#### Decision items are extracted from descriptions

_Verified by: AD-N items are extracted from description text, Empty description returns no decision items, Malformed AD items are skipped_

#### PDR references are found across patterns

_Verified by: Patterns referencing a PDR are found, No references returns empty result_

*stub-resolver.feature*

### Stub Taxonomy Tag Tests

*Stub metadata (target path, design session) was stored as plain text*

#### Taxonomy tags are registered in the registry

_Verified by: Target and since tags exist in registry_

#### Tags are part of the stub metadata group

_Verified by: Built registry groups target and since as stub tags_

*taxonomy-tags.feature*

### Validate Patterns Cli

*Command-line interface for cross-validating TypeScript patterns vs Gherkin feature files.*

#### CLI displays help and version information

_Verified by: Display help with --help flag, Display help with -h flag, Display version with --version flag, Display version with -v flag_

#### CLI requires input and feature patterns

_Verified by: Fail without --input flag, Fail without --features flag_

#### CLI validates patterns across TypeScript and Gherkin sources

_Verified by: Validation passes for matching patterns, Detect phase mismatch between sources, Detect status mismatch between sources_

#### CLI supports multiple output formats

_Verified by: JSON output format, Pretty output format is default_

#### Strict mode treats warnings as errors

_Verified by: Strict mode exits with code 2 on warnings, Non-strict mode passes with warnings_

#### CLI warns about unknown flags

_Verified by: Warn on unknown flag but continue_

*validate-patterns.feature*

---

[← Back to Business Rules](../BUSINESS-RULES.md)
