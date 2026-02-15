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

| Rule                                           | Description                                                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Status queries return correct patterns         | **Invariant:** Status queries must correctly filter by both normalized status (planned = roadmap + deferred) and FSM...  |
| Phase queries return correct phase data        | **Invariant:** Phase queries must return only patterns in the requested phase, with accurate progress counts and...      |
| FSM queries expose transition validation       | **Invariant:** FSM queries must validate transitions against the PDR-005 state machine and expose protection levels...   |
| Pattern queries find and retrieve pattern data | **Invariant:** Pattern lookup must be case-insensitive by name, and category queries must return only patterns with...   |
| Timeline queries group patterns by time        | **Invariant:** Quarter queries must correctly filter by quarter string, and recently completed must be sorted by date... |

--- ValidatePatternsCli ---

| Rule                                                         | Description                                                                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| CLI displays help and version information                    | **Invariant:** The --help/-h and --version/-v flags must produce usage/version output and exit successfully without...   |
| CLI requires input and feature patterns                      | **Invariant:** The validate-patterns CLI must fail with clear errors when either --input or --features flags are...      |
| CLI validates patterns across TypeScript and Gherkin sources | **Invariant:** The validator must detect mismatches between TypeScript and Gherkin sources including phase and status... |
| CLI supports multiple output formats                         | **Invariant:** The CLI must support JSON and pretty (human-readable) output formats, with pretty as the default....      |
| Strict mode treats warnings as errors                        | **Invariant:** When --strict is enabled, warnings must be promoted to errors causing a non-zero exit code (exit 2);...   |
| CLI warns about unknown flags                                | **Invariant:** Unrecognized CLI flags must produce a warning message but allow execution to continue....                 |

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

| Rule                                       | Description                                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| CLI displays help and version information  | **Invariant:** The --help/-h and --version/-v flags must produce usage/version output and exit successfully without...   |
| CLI requires git repository for validation | **Invariant:** The lint-process CLI must fail with a clear error when run outside a git repository in both staged and... |
| CLI validates file mode input              | **Invariant:** In file mode, the CLI must require at least one file path via positional argument or --file flag, and...  |
| CLI handles no changes gracefully          | **Invariant:** When no relevant changes are detected (empty diff), the CLI must exit successfully with a zero exit...    |
| CLI supports multiple output formats       | **Invariant:** The CLI must support JSON and pretty (human-readable) output formats, with pretty as the default....      |
| CLI supports debug options                 | **Invariant:** The --show-state flag must display the derived process state (FSM states, protection levels,...           |
| CLI warns about unknown flags              | **Invariant:** Unrecognized CLI flags must produce a warning message but allow execution to continue....                 |

--- LintPatternsCli ---

| Rule                                           | Description                                                                                                           |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| CLI displays help and version information      | **Invariant:** The --help and -v flags must produce usage/version output and exit successfully without requiring...   |
| CLI requires input patterns                    | **Invariant:** The lint-patterns CLI must fail with a clear error when the --input flag is not provided....           |
| Lint passes for valid patterns                 | **Invariant:** Fully annotated patterns with all required tags must pass linting with zero violations....             |
| Lint detects violations in incomplete patterns | **Invariant:** Patterns with missing or incomplete annotations must produce specific violation reports identifying... |
| CLI supports multiple output formats           | **Invariant:** The CLI must support JSON and pretty (human-readable) output formats, with pretty as the default....   |
| Strict mode treats warnings as errors          | **Invariant:** When --strict is enabled, warnings must be promoted to errors causing a non-zero exit code; without... |

--- GenerateTagTaxonomyCli ---

| Rule                                            | Description                                                                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| CLI displays help and version information       | **Invariant:** The --help/-h and --version/-v flags must produce usage/version output and exit successfully without...   |
| CLI generates taxonomy at specified output path | **Invariant:** The taxonomy generator must write output to the specified path, creating parent directories if they do... |
| CLI respects overwrite flag for existing files  | **Invariant:** The CLI must refuse to overwrite existing output files unless the --overwrite or -f flag is explicitly... |
| Generated taxonomy contains expected sections   | **Invariant:** The generated taxonomy file must include category documentation and statistics sections reflecting the... |
| CLI warns about unknown flags                   | **Invariant:** Unrecognized CLI flags must produce a warning message but allow execution to continue....                 |

--- GenerateDocsCli ---

| Rule                                          | Description                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| CLI displays help and version information     | **Invariant:** The --help and -v flags must produce usage/version output and exit successfully without requiring... |
| CLI requires input patterns                   | **Invariant:** The generate-docs CLI must fail with a clear error when the --input flag is not provided....         |
| CLI lists available generators                | **Invariant:** The --list-generators flag must display all registered generator names without performing any...     |
| CLI generates documentation from source files | **Invariant:** Given valid input patterns and a generator name, the CLI must scan sources, extract patterns, and... |
| CLI rejects unknown options                   | **Invariant:** Unrecognized CLI flags must cause an error with a descriptive message rather than being silently...  |

--- ContextFormatterTests ---

| Rule                                                 | Description                                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| formatContextBundle renders section markers          | **Invariant:** The context formatter must render section markers for all populated sections in a context bundle, with... |
| formatDepTree renders indented tree                  | **Invariant:** The dependency tree formatter must render with indentation arrows and a focal pattern marker to...        |
| formatOverview renders progress summary              | **Invariant:** The overview formatter must render a progress summary line showing completion metrics for the...          |
| formatFileReadingList renders categorized file paths | **Invariant:** The file reading list formatter must categorize paths into primary and dependency sections, producing...  |

--- ContextAssemblerTests ---

| Rule                                                      | Description                                                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| assembleContext produces session-tailored context bundles | **Invariant:** Each session type (design/planning/implement) must include exactly the context sections defined by its... |
| buildDepTree walks dependency chains with cycle detection | **Invariant:** The dependency tree must walk the full chain up to the depth limit, mark the focal node, and terminate... |
| buildOverview provides executive project summary          | **Invariant:** The overview must include progress counts (completed/active/planned), active phase listing, and...        |
| buildFileReadingList returns paths by relevance           | **Invariant:** Primary files (spec, implementation) must always be included; related files (dependency...                |

--- ScopeValidatorTests ---

| Rule                                                     | Description                                                                                                             |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Implementation scope validation checks all prerequisites | **Invariant:** Implementation scope validation must check FSM transition validity, dependency completeness, PDR...      |
| Design scope validation checks dependency stubs          | **Invariant:** Design scope validation must verify that dependencies have corresponding code stubs, producing...        |
| Formatter produces structured text output                | **Invariant:** The scope validator formatter must produce structured text with ADR-008 markers, showing verdict text... |

--- HandoffGeneratorTests ---

| Rule                                            | Description                                                                                                    |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Handoff generates compact session state summary | **Invariant:** The handoff generator must produce a compact session state summary including pattern status,... |
| Formatter produces structured text output       | **Invariant:** The handoff formatter must produce structured text output with ADR-008 section markers for...   |

--- StubTaxonomyTagTests ---

| Rule                                         | Description                                                                                                             |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Taxonomy tags are registered in the registry | **Invariant:** The target and since stub metadata tags must be registered in the tag registry as recognized taxonomy... |
| Tags are part of the stub metadata group     | **Invariant:** The target and since tags must be grouped under the stub metadata domain in the built registry....       |

--- StubResolverTests ---

| Rule                                            | Description                                                                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Stubs are identified by path or target metadata | **Invariant:** A pattern must be identified as a stub if it resides in the stubs directory OR has a targetPath...        |
| Stubs are resolved against the filesystem       | **Invariant:** Resolved stubs must show whether their target file exists on the filesystem and must be grouped by the... |
| Decision items are extracted from descriptions  | **Invariant:** AD-N formatted items must be extracted from pattern description text, with empty descriptions...          |
| PDR references are found across patterns        | **Invariant:** The resolver must find all patterns that reference a given PDR identifier, returning empty results...     |

--- PatternSummarizeTests ---

| Rule                                         | Description                                                                                                             |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| summarizePattern projects to compact summary | **Invariant:** summarizePattern must project a full pattern object to a compact summary containing exactly 6 fields,... |
| summarizePatterns batch processes arrays     | **Invariant:** summarizePatterns must batch-process an array of patterns, returning a correctly-sized array of...       |

--- PatternHelpersTests ---

| Rule                                                     | Description                                                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| getPatternName uses patternName tag when available       | **Invariant:** getPatternName must return the patternName tag value when set, falling back to the pattern's name...   |
| findPatternByName performs case-insensitive matching     | **Invariant:** findPatternByName must match pattern names case-insensitively, returning undefined when no match...    |
| getRelationships looks up with case-insensitive fallback | **Invariant:** getRelationships must first try exact key lookup in the relationship index, then fall back to...       |
| suggestPattern provides fuzzy suggestions                | **Invariant:** suggestPattern must return fuzzy match suggestions for close pattern names, returning empty results... |

--- OutputPipelineTests ---

| Rule                                           | Description                                                                                                             |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Output modifiers apply with correct precedence | **Invariant:** Output modifiers (count, names-only, fields, full) must apply to pattern arrays with correct...          |
| Modifier conflicts are rejected                | **Invariant:** Mutually exclusive modifier combinations (full+names-only, full+count, full+fields) and invalid field... |
| List filters compose via AND logic             | **Invariant:** Multiple list filters (status, category) must compose via AND logic, with pagination (limit/offset)...   |
| Empty stripping removes noise                  | **Invariant:** Null and empty values must be stripped from output objects to reduce noise in API responses....          |

--- FuzzyMatchTests ---

| Rule                                    | Description                                                                                                             |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Fuzzy matching uses tiered scoring      | **Invariant:** Pattern matching must use a tiered scoring system: exact match (1.0) > prefix match (0.9) > substring... |
| findBestMatch returns single suggestion | **Invariant:** findBestMatch must return the single highest-scoring match above the threshold, or undefined when no...  |
| Levenshtein distance computation        | **Invariant:** The Levenshtein distance function must correctly compute edit distance between strings, returning 0...   |

--- ArchQueriesTest ---

| Rule                                              | Description                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Neighborhood and comparison views                 | **Invariant:** The architecture query API must provide pattern neighborhood views (direct connections) and...            |
| Taxonomy discovery via tags and sources           | **Invariant:** The API must aggregate tag values with counts across all patterns and categorize source files by type,... |
| Coverage analysis reports annotation completeness | **Invariant:** Coverage analysis must detect unused taxonomy entries, cross-context integration points, and include...   |
