# DataAPI Business Rules

**Purpose:** Business rules for the DataAPI product area

---

**85 rules** from 18 features. 11 rules have explicit invariants.

---

## Phase 25

### Pattern Helpers Tests

---

#### getPatternName uses patternName tag when available

**Verified by:**
- Returns patternName when set
- Falls back to name when patternName is absent

---

#### findPatternByName performs case-insensitive matching

**Verified by:**
- Exact case match
- Case-insensitive match
- No match returns undefined

---

#### getRelationships looks up with case-insensitive fallback

**Verified by:**
- Exact key match in relationship index
- Case-insensitive fallback match
- Missing relationship index returns undefined

---

#### suggestPattern provides fuzzy suggestions

**Verified by:**
- Suggests close match
- No close match returns empty

*pattern-helpers.feature*

---

## Uncategorized

### Arch Queries Test

---

#### Neighborhood and comparison views

**Verified by:**
- Pattern neighborhood shows direct connections
- Cross-context comparison shows shared and unique dependencies
- Neighborhood for nonexistent pattern returns undefined

---

#### Taxonomy discovery via tags and sources

**Verified by:**
- Tag aggregation counts values across patterns
- Source inventory categorizes files by type
- Tags with no patterns returns empty report

---

#### Coverage analysis reports annotation completeness

**Verified by:**
- Unused taxonomy detection
- Cross-context comparison with integration points
- Neighborhood includes implements relationships
- Neighborhood includes dependsOn and enables relationships

*arch-queries.feature*

### Context Assembler Tests

*Tests for assembleContext(), buildDepTree(), buildFileReadingList(), and*

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

*context-assembler.feature*

### Context Formatter Tests

*Tests for formatContextBundle(), formatDepTree(), formatFileReadingList(),*

---

#### formatContextBundle renders section markers

**Verified by:**
- Design bundle renders all populated sections
- Implement bundle renders deliverables and FSM

---

#### formatDepTree renders indented tree

**Verified by:**
- Tree renders with arrows and focal marker

---

#### formatOverview renders progress summary

**Verified by:**
- Overview renders progress line

---

#### formatFileReadingList renders categorized file paths

**Verified by:**
- File list renders primary and dependency sections
- Empty file reading list renders minimal output

*context-formatter.feature*

### Fuzzy Match Tests

*Validates tiered fuzzy matching: exact > prefix > substring > Levenshtein.*

---

#### Fuzzy matching uses tiered scoring

**Verified by:**
- Exact match scores 1.0
- Exact match is case-insensitive
- Prefix match scores 0.9
- Substring match scores 0.7
- Levenshtein match for close typos
- Results are sorted by score descending
- Empty query matches all patterns as prefix
- No candidate patterns returns no results

---

#### findBestMatch returns single suggestion

**Verified by:**
- Best match returns suggestion above threshold
- No match returns undefined when below threshold

---

#### Levenshtein distance computation

**Verified by:**
- Identical strings have distance 0
- Single character difference

*fuzzy-match.feature*

### Generate Docs Cli

*Command-line interface for generating documentation from annotated TypeScript.*

---

#### CLI displays help and version information

**Verified by:**
- Display help with --help flag
- Display version with -v flag

---

#### CLI requires input patterns

**Verified by:**
- Fail without --input flag

---

#### CLI lists available generators

**Verified by:**
- List generators with --list-generators

---

#### CLI generates documentation from source files

**Verified by:**
- Generate patterns documentation
- Use default generator (patterns) when not specified

---

#### CLI rejects unknown options

**Verified by:**
- Unknown option causes error

*generate-docs.feature*

### Generate Tag Taxonomy Cli

*Command-line interface for generating TAG_TAXONOMY.md from tag registry configuration.*

---

#### CLI displays help and version information

**Verified by:**
- Display help with --help flag
- Display help with -h flag
- Display version with --version flag
- Display version with -v flag

---

#### CLI generates taxonomy at specified output path

**Verified by:**
- Generate taxonomy at default path
- Generate taxonomy at custom output path
- Create output directory if missing

---

#### CLI respects overwrite flag for existing files

**Verified by:**
- Fail when output file exists without --overwrite
- Overwrite existing file with -f flag
- Overwrite existing file with --overwrite flag

---

#### Generated taxonomy contains expected sections

**Verified by:**
- Generated file contains category documentation
- Generated file reports statistics

---

#### CLI warns about unknown flags

**Verified by:**
- Warn on unknown flag but continue

*generate-tag-taxonomy.feature*

### Handoff Generator Tests

*Multi-session work loses critical state between sessions when handoff*

---

#### Handoff generates compact session state summary

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

**Verified by:**
- Handoff formatter produces markers per ADR-008

*handoff-generator.feature*

### Lint Patterns Cli

*Command-line interface for validating pattern annotation quality.*

---

#### CLI displays help and version information

**Verified by:**
- Display help with --help flag
- Display version with -v flag

---

#### CLI requires input patterns

**Verified by:**
- Fail without --input flag

---

#### Lint passes for valid patterns

**Verified by:**
- Lint passes for complete annotations

---

#### Lint detects violations in incomplete patterns

**Verified by:**
- Report violations for incomplete annotations

---

#### CLI supports multiple output formats

**Verified by:**
- JSON output format
- Pretty output format is default

---

#### Strict mode treats warnings as errors

**Verified by:**
- Strict mode fails on warnings
- Non-strict mode passes with warnings

*lint-patterns.feature*

### Lint Process Cli

*Command-line interface for validating changes against delivery process rules.*

---

#### CLI displays help and version information

**Verified by:**
- Display help with --help flag
- Display help with -h flag
- Display version with --version flag
- Display version with -v flag

---

#### CLI requires git repository for validation

**Verified by:**
- Fail without git repository in staged mode
- Fail without git repository in all mode

---

#### CLI validates file mode input

**Verified by:**
- Fail when files mode has no files
- Accept file via positional argument
- Accept file via --file flag

---

#### CLI handles no changes gracefully

**Verified by:**
- No changes detected exits successfully

---

#### CLI supports multiple output formats

**Verified by:**
- JSON output format
- Pretty output format is default

---

#### CLI supports debug options

**Verified by:**
- Show state flag displays derived state

---

#### CLI warns about unknown flags

**Verified by:**
- Warn on unknown flag but continue

*lint-process.feature*

### Output Pipeline Tests

*Validates the output pipeline transforms: summarization, modifiers,*

---

#### Output modifiers apply with correct precedence

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

**Verified by:**
- Full combined with names-only is rejected
- Full combined with count is rejected
- Full combined with fields is rejected
- Invalid field name is rejected

---

#### List filters compose via AND logic

**Verified by:**
- Filter by status returns matching patterns
- Filter by status and category narrows results
- Pagination with limit and offset
- Offset beyond array length returns empty results

---

#### Empty stripping removes noise

**Verified by:**
- Null and empty values are stripped

*output-pipeline.feature*

### Pattern Summarize Tests

*Validates that summarizePattern() projects ExtractedPattern (~3.5KB) to*

---

#### summarizePattern projects to compact summary

**Verified by:**
- Summary includes all 6 fields for a TypeScript pattern
- Summary includes all 6 fields for a Gherkin pattern
- Summary uses patternName tag over name field
- Summary omits undefined optional fields

---

#### summarizePatterns batch processes arrays

**Verified by:**
- Batch summarization returns correct count

*summarize.feature*

### Process Api Cli

*Command-line interface for querying delivery process state via ProcessStateAPI.*

---

#### CLI displays help and version information

**Verified by:**
- Display help with --help flag
- Display version with -v flag
- No subcommand shows help

---

#### CLI requires input flag for subcommands

**Verified by:**
- Fail without --input flag when running status
- Reject unknown options

---

#### CLI status subcommand shows delivery state

**Verified by:**
- Status shows counts and completion percentage

---

#### CLI query subcommand executes API methods

**Verified by:**
- Query getStatusCounts returns count object
- Query isValidTransition with arguments
- Unknown API method shows error

---

#### CLI pattern subcommand shows pattern detail

**Verified by:**
- Pattern lookup returns full detail
- Pattern not found shows error

---

#### CLI arch subcommand queries architecture

**Verified by:**
- Arch roles lists roles with counts
- Arch context filters to bounded context
- Arch layer lists layers with counts

---

#### CLI shows errors for missing subcommand arguments

**Verified by:**
- Query without method name shows error
- Pattern without name shows error
- Unknown subcommand shows error

---

#### CLI handles argument edge cases

**Verified by:**
- Integer arguments are coerced for phase queries
- Double-dash separator is handled gracefully

---

#### CLI list subcommand filters patterns

**Verified by:**
- List all patterns returns JSON array
- List with invalid phase shows error

---

#### CLI search subcommand finds patterns by fuzzy match

**Verified by:**
- Search returns matching patterns
- Search without query shows error

---

#### CLI context assembly subcommands return text output

**Verified by:**
- Context returns curated text bundle
- Context without pattern name shows error
- Overview returns executive summary text
- Dep-tree returns dependency tree text

---

#### CLI tags and sources subcommands return JSON

**Verified by:**
- Tags returns tag usage counts
- Sources returns file inventory

---

#### CLI extended arch subcommands query architecture relationships

**Verified by:**
- Arch neighborhood returns pattern relationships
- Arch compare returns context comparison
- Arch coverage returns annotation coverage

---

#### CLI unannotated subcommand finds files without annotations

**Verified by:**
- Unannotated finds files missing libar-docs marker

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

*process-api.feature*

### Process State API

*- Markdown generation is not ideal for programmatic access*

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

*process-state-api.feature*

### Scope Validator Tests

*Starting an implementation or design session without checking prerequisites*

---

#### Implementation scope validation checks all prerequisites

**Verified by:**
- All implementation checks pass
- Incomplete dependency blocks implementation
- FSM transition from completed blocks implementation
- Missing PDR references produce WARN
- No deliverables blocks implementation
- Strict mode promotes WARN to BLOCKED
- Pattern not found throws error

---

#### Design scope validation checks dependency stubs

**Verified by:**
- Design session with no dependencies passes
- Design session with dependencies lacking stubs produces WARN

---

#### Formatter produces structured text output

**Verified by:**
- Formatter produces markers per ADR-008
- Formatter shows warnings verdict text
- Formatter shows blocker details for blocked verdict

*scope-validator.feature*

### Stub Resolver Tests

*Design session stubs need structured discovery and resolution*

---

#### Stubs are identified by path or target metadata

**Verified by:**
- Patterns in stubs directory are identified as stubs
- Patterns with targetPath are identified as stubs

---

#### Stubs are resolved against the filesystem

**Verified by:**
- Resolved stubs show target existence status
- Stubs are grouped by implementing pattern

---

#### Decision items are extracted from descriptions

**Verified by:**
- AD-N items are extracted from description text
- Empty description returns no decision items
- Malformed AD items are skipped

---

#### PDR references are found across patterns

**Verified by:**
- Patterns referencing a PDR are found
- No references returns empty result

*stub-resolver.feature*

### Stub Taxonomy Tag Tests

*Stub metadata (target path, design session) was stored as plain text*

---

#### Taxonomy tags are registered in the registry

**Verified by:**
- Target and since tags exist in registry

---

#### Tags are part of the stub metadata group

**Verified by:**
- Built registry groups target and since as stub tags

*taxonomy-tags.feature*

### Validate Patterns Cli

*Command-line interface for cross-validating TypeScript patterns vs Gherkin feature files.*

---

#### CLI displays help and version information

**Verified by:**
- Display help with --help flag
- Display help with -h flag
- Display version with --version flag
- Display version with -v flag

---

#### CLI requires input and feature patterns

**Verified by:**
- Fail without --input flag
- Fail without --features flag

---

#### CLI validates patterns across TypeScript and Gherkin sources

**Verified by:**
- Validation passes for matching patterns
- Detect phase mismatch between sources
- Detect status mismatch between sources

---

#### CLI supports multiple output formats

**Verified by:**
- JSON output format
- Pretty output format is default

---

#### Strict mode treats warnings as errors

**Verified by:**
- Strict mode exits with code 2 on warnings
- Non-strict mode passes with warnings

---

#### CLI warns about unknown flags

**Verified by:**
- Warn on unknown flag but continue

*validate-patterns.feature*

---

[← Back to Business Rules](../BUSINESS-RULES.md)
