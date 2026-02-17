=== DATAAPI OVERVIEW ===

Purpose: DataAPI product area overview
Detail Level: Compact summary

**How do I query process state?** Process state API, stubs, context assembly, CLI.


=== API TYPES ===

| Type | Kind |
| --- | --- |
| MasterDatasetSchema | const |
| StatusGroupsSchema | const |
| StatusCountsSchema | const |
| PhaseGroupSchema | const |
| SourceViewsSchema | const |
| RelationshipEntrySchema | const |
| ArchIndexSchema | const |


=== BEHAVIOR SPECIFICATIONS ===

--- PDR001SessionWorkflowCommands ---

| Rule | Description |
| --- | --- |
| DD-1 - Text output with section markers | Both scope-validate and handoff return string from the router, using<br>    === SECTION === markers. Follows the dual... |
| DD-2 - Git integration is opt-in via --git flag | The handoff command accepts an optional --git flag. The CLI handler<br>    calls git diff and passes file list to the... |
| DD-3 - Session type inferred from FSM status | Handoff infers session type from pattern's current FSM status.<br>    An explicit --session flag overrides inference.... |
| DD-4 - Severity levels match Process Guard model | Scope validation uses three severity levels:<br><br>    \| Severity \| Meaning \|<br>    \| PASS \| Check passed \|<br>    \| BLOCKED \|... |
| DD-5 - Current date only for handoff | Handoff always uses the current date. No --date flag. |
| DD-6 - Both positional and flag forms for scope type | scope-validate accepts scope type as both positional argument<br>    and --type flag. |
| DD-7 - Co-located formatter functions | Each module (scope-validator.ts, handoff-generator.ts) exports<br>    both the data builder and the text formatter.... |

--- ProcessStateAPIRelationshipQueries ---

| Rule | Description |
| --- | --- |
| API provides implementation relationship queries | **Invariant:** Every pattern with `implementedBy` entries is discoverable via the API.<br><br>    **Rationale:** Claude... |
| API provides inheritance hierarchy queries | **Invariant:** Pattern inheritance chains are fully navigable in both directions.<br><br>    **Rationale:** Patterns form... |
| API provides combined relationship views | **Invariant:** All relationship types are accessible through a unified interface.<br><br>    **Rationale:** Claude Code... |
| API supports bidirectional traceability queries | **Invariant:** Navigation from spec to code and code to spec is symmetric.<br><br>    **Rationale:** Traceability is... |

--- ProcessStateAPICLI ---

| Rule | Description |
| --- | --- |
| CLI supports status-based pattern queries | **Invariant:** Every ProcessStateAPI status query method is accessible via CLI.<br><br>    **Rationale:** The most common... |
| CLI supports phase-based queries | **Invariant:** Patterns can be filtered by phase number.<br><br>    **Rationale:** Phase 18 (Event Durability) is the... |
| CLI provides progress summary queries | **Invariant:** Overall and per-phase progress is queryable in a single command.<br><br>    **Rationale:** Planning sessions... |
| CLI supports multiple output formats | **Invariant:** JSON output is parseable by AI agents without transformation.<br><br>    **Rationale:** Claude Code can... |
| CLI supports individual pattern lookup | **Invariant:** Any pattern can be queried by name with full details.<br><br>    **Rationale:** During implementation,... |
| CLI provides discoverable help | **Invariant:** All flags are documented via --help with examples.<br><br>    **Rationale:** Claude Code can read --help... |

--- DataAPIStubIntegration ---

| Rule | Description |
| --- | --- |
| All stubs are visible to the scanner pipeline | **Invariant:** Every stub file in `delivery-process/stubs/` has `@libar-docs`<br>    opt-in and `@libar-docs-implements`... |
| Stubs subcommand lists design stubs with implementation status | **Invariant:** `stubs` returns stub files with their target paths, design<br>    session origins, and whether the target... |
| Decisions and PDR commands surface design rationale | **Invariant:** Design decisions (AD-N items) and PDR references from stub<br>    annotations are queryable by pattern... |

--- DataAPIDesignSessionSupport ---

| Rule | Description |
| --- | --- |
| Scope-validate checks implementation prerequisites before session start | **Invariant:** Scope validation surfaces all blocking conditions before<br>    committing to a session, preventing... |
| Handoff generates compact session state summary for multi-session work | **Invariant:** Handoff documentation captures everything the next session<br>    needs to continue work without context... |

--- DataAPIRelationshipGraph ---

| Rule | Description |
| --- | --- |
| Graph command traverses relationships recursively with configurable depth | **Invariant:** Graph traversal walks both planning relationships (`dependsOn`,<br>    `enables`) and implementation... |
| Impact analysis shows transitive dependents of a pattern | **Invariant:** Impact analysis answers "if I change X, what else is affected?"<br>    by walking `usedBy` + `enables`... |
| Path finding discovers relationship chains between two patterns | **Invariant:** Path finding returns the shortest chain of relationships<br>    connecting two patterns, or indicates no... |
| Graph health commands detect broken references and isolated patterns | **Invariant:** Dangling references (pattern names in `uses`/`dependsOn` that<br>    don't match any pattern definition)... |

--- DataAPIPlatformIntegration ---

| Rule | Description |
| --- | --- |
| ProcessStateAPI is accessible as an MCP server for Claude Code | **Invariant:** The MCP server exposes all ProcessStateAPI methods as MCP tools<br>    with typed input/output schemas.... |
| Process state can be auto-generated as CLAUDE.md context sections | **Invariant:** Generated CLAUDE.md sections are additive layers that provide<br>    pattern metadata, relationships, and... |
| Cross-package views show dependencies spanning multiple packages | **Invariant:** Cross-package queries aggregate patterns from multiple<br>    input sources and resolve cross-package... |
| Process validation integrates with git hooks and file watching | **Invariant:** Pre-commit hooks validate annotation consistency. Watch mode<br>    re-generates docs on source... |

--- DataAPIOutputShaping ---

| Rule | Description |
| --- | --- |
| List queries return compact pattern summaries by default | **Invariant:** List-returning API methods produce summaries, not full ExtractedPattern<br>    objects, unless `--full`... |
| Global output modifier flags apply to any list-returning command | **Invariant:** Output modifiers are composable and apply uniformly across all<br>    list-returning subcommands and... |
| Output format is configurable with typed response envelope | **Invariant:** All CLI output uses the QueryResult envelope for success/error<br>    discrimination. The compact format... |
| List subcommand provides composable filters and fuzzy search | **Invariant:** The `list` subcommand replaces the need to call specific<br>    `getPatternsByX` methods. Filters are... |
| CLI provides ergonomic defaults and helpful error messages | **Invariant:** Common operations require minimal flags. Pattern name typos<br>    produce actionable suggestions. Empty... |

--- DataAPIContextAssembly ---

| Rule | Description |
| --- | --- |
| Context command assembles curated context for a single pattern | **Invariant:** Given a pattern name, `context` returns everything needed to<br>    start working on that pattern:... |
| Files command returns only file paths organized by relevance | **Invariant:** `files` returns the most token-efficient output possible --<br>    just file paths that Claude Code can... |
| Dep-tree command shows recursive dependency chain with status | **Invariant:** The dependency tree walks both `dependsOn`/`enables` (planning)<br>    and `uses`/`usedBy`... |
| Context command supports multiple patterns with merged output | **Invariant:** Multi-pattern context deduplicates shared dependencies and<br>    highlights overlap between patterns.... |
| Overview provides executive project summary | **Invariant:** `overview` returns project-wide health in one command.<br><br>    **Rationale:** Planning sessions start... |

--- DataAPICLIErgonomics ---

| Rule | Description |
| --- | --- |
| MasterDataset is cached between invocations with file-change invalidation | **Invariant:** Cache is automatically invalidated when any source file<br>    (TypeScript or Gherkin) has a modification... |
| REPL mode keeps pipeline loaded for interactive multi-query sessions | **Invariant:** REPL mode loads the pipeline once and accepts multiple queries<br>    on stdin, with optional tab... |
| Per-subcommand help and diagnostic modes aid discoverability | **Invariant:** Every subcommand supports `--help` with usage, flags, and<br>    examples. Dry-run shows pipeline scope... |

--- DataAPIArchitectureQueries ---

| Rule | Description |
| --- | --- |
| Arch subcommand provides neighborhood and comparison views | **Invariant:** Architecture queries resolve pattern names to concrete<br>    relationships and file paths, not just... |
| Coverage analysis reports annotation completeness with gaps | **Invariant:** Coverage reports identify unannotated files that should have<br>    the libar-docs opt-in marker based on... |
| Tags and sources commands provide taxonomy and inventory views | **Invariant:** All tag values in use are discoverable without reading<br>    configuration files. Source file inventory... |

--- ValidatePatternsCli ---

| Rule | Description |
| --- | --- |
| CLI displays help and version information |  |
| CLI requires input and feature patterns |  |
| CLI validates patterns across TypeScript and Gherkin sources |  |
| CLI supports multiple output formats |  |
| Strict mode treats warnings as errors |  |
| CLI warns about unknown flags |  |

--- ProcessApiCli ---

| Rule | Description |
| --- | --- |
| CLI displays help and version information |  |
| CLI requires input flag for subcommands |  |
| CLI status subcommand shows delivery state |  |
| CLI query subcommand executes API methods |  |
| CLI pattern subcommand shows pattern detail |  |
| CLI arch subcommand queries architecture |  |
| CLI shows errors for missing subcommand arguments |  |
| CLI handles argument edge cases |  |
| CLI list subcommand filters patterns |  |
| CLI search subcommand finds patterns by fuzzy match |  |
| CLI context assembly subcommands return text output |  |
| CLI tags and sources subcommands return JSON |  |
| CLI extended arch subcommands query architecture relationships |  |
| CLI unannotated subcommand finds files without annotations |  |
| Output modifiers work when placed after the subcommand | **Invariant:** Output modifiers (--count, --names-only, --fields) produce identical results regardless of position... |
| CLI arch health subcommands detect graph quality issues | **Invariant:** Health subcommands (dangling, orphans, blocking) operate on the relationship index, not the... |

--- LintProcessCli ---

| Rule | Description |
| --- | --- |
| CLI displays help and version information |  |
| CLI requires git repository for validation |  |
| CLI validates file mode input |  |
| CLI handles no changes gracefully |  |
| CLI supports multiple output formats |  |
| CLI supports debug options |  |
| CLI warns about unknown flags |  |

--- LintPatternsCli ---

| Rule | Description |
| --- | --- |
| CLI displays help and version information |  |
| CLI requires input patterns |  |
| Lint passes for valid patterns |  |
| Lint detects violations in incomplete patterns |  |
| CLI supports multiple output formats |  |
| Strict mode treats warnings as errors |  |

--- GenerateTagTaxonomyCli ---

| Rule | Description |
| --- | --- |
| CLI displays help and version information |  |
| CLI generates taxonomy at specified output path |  |
| CLI respects overwrite flag for existing files |  |
| Generated taxonomy contains expected sections |  |
| CLI warns about unknown flags |  |

--- GenerateDocsCli ---

| Rule | Description |
| --- | --- |
| CLI displays help and version information |  |
| CLI requires input patterns |  |
| CLI lists available generators |  |
| CLI generates documentation from source files |  |
| CLI rejects unknown options |  |

--- ProcessStateAPITesting ---

| Rule | Description |
| --- | --- |
| Status queries return correct patterns |  |
| Phase queries return correct phase data |  |
| FSM queries expose transition validation |  |
| Pattern queries find and retrieve pattern data |  |
| Timeline queries group patterns by time |  |

--- StubTaxonomyTagTests ---

| Rule | Description |
| --- | --- |
| Taxonomy tags are registered in the registry |  |
| Tags are part of the stub metadata group |  |

--- StubResolverTests ---

| Rule | Description |
| --- | --- |
| Stubs are identified by path or target metadata |  |
| Stubs are resolved against the filesystem |  |
| Decision items are extracted from descriptions |  |
| PDR references are found across patterns |  |

--- ScopeValidatorTests ---

| Rule | Description |
| --- | --- |
| Implementation scope validation checks all prerequisites |  |
| Design scope validation checks dependency stubs |  |
| Formatter produces structured text output |  |

--- HandoffGeneratorTests ---

| Rule | Description |
| --- | --- |
| Handoff generates compact session state summary |  |
| Formatter produces structured text output |  |

--- PatternSummarizeTests ---

| Rule | Description |
| --- | --- |
| summarizePattern projects to compact summary |  |
| summarizePatterns batch processes arrays |  |

--- PatternHelpersTests ---

| Rule | Description |
| --- | --- |
| getPatternName uses patternName tag when available |  |
| findPatternByName performs case-insensitive matching |  |
| getRelationships looks up with case-insensitive fallback |  |
| suggestPattern provides fuzzy suggestions |  |

--- OutputPipelineTests ---

| Rule | Description |
| --- | --- |
| Output modifiers apply with correct precedence |  |
| Modifier conflicts are rejected |  |
| List filters compose via AND logic |  |
| Empty stripping removes noise |  |

--- FuzzyMatchTests ---

| Rule | Description |
| --- | --- |
| Fuzzy matching uses tiered scoring |  |
| findBestMatch returns single suggestion |  |
| Levenshtein distance computation |  |

--- ArchQueriesTest ---

| Rule | Description |
| --- | --- |
| Neighborhood and comparison views |  |
| Taxonomy discovery via tags and sources |  |
| Coverage analysis reports annotation completeness |  |

--- ContextFormatterTests ---

| Rule | Description |
| --- | --- |
| formatContextBundle renders section markers |  |
| formatDepTree renders indented tree |  |
| formatOverview renders progress summary |  |
| formatFileReadingList renders categorized file paths |  |

--- ContextAssemblerTests ---

| Rule | Description |
| --- | --- |
| assembleContext produces session-tailored context bundles |  |
| buildDepTree walks dependency chains with cycle detection |  |
| buildOverview provides executive project summary |  |
| buildFileReadingList returns paths by relevance |  |
