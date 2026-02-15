=== DATAAPI OVERVIEW ===

Purpose: DataAPI product area overview
Detail Level: Compact summary

**How do I query process state?** The Data API provides direct terminal access to delivery process state. It replaces reading generated markdown or launching explore agents — targeted queries use 5-10x less context. The `context` command assembles curated bundles tailored to session type (planning, design, implement).

=== KEY INVARIANTS ===

- One-command context assembly: `context <pattern> --session <type>` returns metadata + file paths + dependency status + architecture position in ~1.5KB
- Session type tailoring: `planning` (~500B, brief + deps), `design` (~1.5KB, spec + stubs + deps), `implement` (deliverables + FSM + tests)
- Direct API queries replace doc reading: JSON output is 5-10x smaller than generated docs

=== API TYPES ===

| Type                    | Kind  |
| ----------------------- | ----- |
| MasterDatasetSchema     | const |
| StatusGroupsSchema      | const |
| StatusCountsSchema      | const |
| PhaseGroupSchema        | const |
| SourceViewsSchema       | const |
| RelationshipEntrySchema | const |
| ArchIndexSchema         | const |

=== BEHAVIOR SPECIFICATIONS ===

--- ProcessStateAPITesting ---

| Rule                                           | Description |
| ---------------------------------------------- | ----------- |
| Status queries return correct patterns         |             |
| Phase queries return correct phase data        |             |
| FSM queries expose transition validation       |             |
| Pattern queries find and retrieve pattern data |             |
| Timeline queries group patterns by time        |             |

--- ValidatePatternsCli ---

| Rule                                                         | Description |
| ------------------------------------------------------------ | ----------- |
| CLI displays help and version information                    |             |
| CLI requires input and feature patterns                      |             |
| CLI validates patterns across TypeScript and Gherkin sources |             |
| CLI supports multiple output formats                         |             |
| Strict mode treats warnings as errors                        |             |
| CLI warns about unknown flags                                |             |

--- ProcessApiCli ---

| Rule                                                           | Description                                                                                                           |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| CLI displays help and version information                      |                                                                                                                       |
| CLI requires input flag for subcommands                        |                                                                                                                       |
| CLI status subcommand shows delivery state                     |                                                                                                                       |
| CLI query subcommand executes API methods                      |                                                                                                                       |
| CLI pattern subcommand shows pattern detail                    |                                                                                                                       |
| CLI arch subcommand queries architecture                       |                                                                                                                       |
| CLI shows errors for missing subcommand arguments              |                                                                                                                       |
| CLI handles argument edge cases                                |                                                                                                                       |
| CLI list subcommand filters patterns                           |                                                                                                                       |
| CLI search subcommand finds patterns by fuzzy match            |                                                                                                                       |
| CLI context assembly subcommands return text output            |                                                                                                                       |
| CLI tags and sources subcommands return JSON                   |                                                                                                                       |
| CLI extended arch subcommands query architecture relationships |                                                                                                                       |
| CLI unannotated subcommand finds files without annotations     |                                                                                                                       |
| Output modifiers work when placed after the subcommand         | **Invariant:** Output modifiers (--count, --names-only, --fields) produce identical results regardless of position... |
| CLI arch health subcommands detect graph quality issues        | **Invariant:** Health subcommands (dangling, orphans, blocking) operate on the relationship index, not the...         |

--- LintProcessCli ---

| Rule                                       | Description |
| ------------------------------------------ | ----------- |
| CLI displays help and version information  |             |
| CLI requires git repository for validation |             |
| CLI validates file mode input              |             |
| CLI handles no changes gracefully          |             |
| CLI supports multiple output formats       |             |
| CLI supports debug options                 |             |
| CLI warns about unknown flags              |             |

--- LintPatternsCli ---

| Rule                                           | Description |
| ---------------------------------------------- | ----------- |
| CLI displays help and version information      |             |
| CLI requires input patterns                    |             |
| Lint passes for valid patterns                 |             |
| Lint detects violations in incomplete patterns |             |
| CLI supports multiple output formats           |             |
| Strict mode treats warnings as errors          |             |

--- GenerateTagTaxonomyCli ---

| Rule                                            | Description |
| ----------------------------------------------- | ----------- |
| CLI displays help and version information       |             |
| CLI generates taxonomy at specified output path |             |
| CLI respects overwrite flag for existing files  |             |
| Generated taxonomy contains expected sections   |             |
| CLI warns about unknown flags                   |             |

--- GenerateDocsCli ---

| Rule                                          | Description |
| --------------------------------------------- | ----------- |
| CLI displays help and version information     |             |
| CLI requires input patterns                   |             |
| CLI lists available generators                |             |
| CLI generates documentation from source files |             |
| CLI rejects unknown options                   |             |

--- ScopeValidatorTests ---

| Rule                                                     | Description |
| -------------------------------------------------------- | ----------- |
| Implementation scope validation checks all prerequisites |             |
| Design scope validation checks dependency stubs          |             |
| Formatter produces structured text output                |             |

--- HandoffGeneratorTests ---

| Rule                                            | Description |
| ----------------------------------------------- | ----------- |
| Handoff generates compact session state summary |             |
| Formatter produces structured text output       |             |

--- StubTaxonomyTagTests ---

| Rule                                         | Description |
| -------------------------------------------- | ----------- |
| Taxonomy tags are registered in the registry |             |
| Tags are part of the stub metadata group     |             |

--- StubResolverTests ---

| Rule                                            | Description |
| ----------------------------------------------- | ----------- |
| Stubs are identified by path or target metadata |             |
| Stubs are resolved against the filesystem       |             |
| Decision items are extracted from descriptions  |             |
| PDR references are found across patterns        |             |

--- PatternSummarizeTests ---

| Rule                                         | Description |
| -------------------------------------------- | ----------- |
| summarizePattern projects to compact summary |             |
| summarizePatterns batch processes arrays     |             |

--- PatternHelpersTests ---

| Rule                                                     | Description |
| -------------------------------------------------------- | ----------- |
| getPatternName uses patternName tag when available       |             |
| findPatternByName performs case-insensitive matching     |             |
| getRelationships looks up with case-insensitive fallback |             |
| suggestPattern provides fuzzy suggestions                |             |

--- OutputPipelineTests ---

| Rule                                           | Description |
| ---------------------------------------------- | ----------- |
| Output modifiers apply with correct precedence |             |
| Modifier conflicts are rejected                |             |
| List filters compose via AND logic             |             |
| Empty stripping removes noise                  |             |

--- FuzzyMatchTests ---

| Rule                                    | Description |
| --------------------------------------- | ----------- |
| Fuzzy matching uses tiered scoring      |             |
| findBestMatch returns single suggestion |             |
| Levenshtein distance computation        |             |

--- ContextFormatterTests ---

| Rule                                                 | Description |
| ---------------------------------------------------- | ----------- |
| formatContextBundle renders section markers          |             |
| formatDepTree renders indented tree                  |             |
| formatOverview renders progress summary              |             |
| formatFileReadingList renders categorized file paths |             |

--- ContextAssemblerTests ---

| Rule                                                      | Description |
| --------------------------------------------------------- | ----------- |
| assembleContext produces session-tailored context bundles |             |
| buildDepTree walks dependency chains with cycle detection |             |
| buildOverview provides executive project summary          |             |
| buildFileReadingList returns paths by relevance           |             |

--- ArchQueriesTest ---

| Rule                                              | Description |
| ------------------------------------------------- | ----------- |
| Neighborhood and comparison views                 |             |
| Taxonomy discovery via tags and sources           |             |
| Coverage analysis reports annotation completeness |             |
