@libar-docs
@libar-docs-pattern:DataAPIOutputShaping
@libar-docs-status:active
@libar-docs-phase:25a
@libar-docs-product-area:DeliveryProcess
@libar-docs-effort:4d
@libar-docs-priority:high
@libar-docs-business-value:compact-output-for-ai-agents
Feature: Data API Output Shaping - Compact Output for AI Agents

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

  Background: Deliverables
    Given the following deliverables:
      | Deliverable | Status | Location | Tests | Test Type |
      | summarizePattern() projection | planned | src/api/summarize.ts | Yes | unit |
      | Output modifier pipeline | planned | src/cli/output-pipeline.ts | Yes | unit |
      | QueryResult envelope wiring | planned | src/cli/process-api.ts | Yes | unit |
      | list subcommand | planned | src/cli/process-api.ts | Yes | integration |
      | search subcommand | planned | src/cli/process-api.ts | Yes | integration |
      | Fuzzy pattern matching | planned | src/api/fuzzy-match.ts | Yes | unit |
      | Config file default resolution | planned | src/cli/process-api.ts | Yes | unit |
      | pnpm banner fix | planned | package.json | No | N/A |

  # ============================================================================
  # RULE 1: Pattern Summarization
  # ============================================================================

  Rule: List queries return compact pattern summaries by default

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

    @acceptance-criteria @happy-path
    Scenario: List queries return compact summaries
      Given patterns exist in the dataset
      When running "process-api query getCurrentWork"
      Then each pattern in the output contains only summary fields
      And the output does not contain "directive" or "code" fields
      And total output size is under 1KB for typical results

    @acceptance-criteria @happy-path
    Scenario: Full flag returns complete patterns
      Given patterns exist in the dataset
      When running "process-api query getCurrentWork --full"
      Then each pattern contains all ExtractedPattern fields
      And the output includes "directive" and "code" fields

    @acceptance-criteria @happy-path
    Scenario: Single pattern detail is unaffected
      Given a pattern "MyPattern" exists
      When running "process-api pattern MyPattern"
      Then the output contains full pattern detail
      And the output includes deliverables, dependencies, and relationships

    @acceptance-criteria @validation
    Scenario: Full flag combined with names-only is rejected
      Given patterns exist in the dataset
      When running "process-api query getCurrentWork --full --names-only"
      Then the command fails with an error about conflicting modifiers
      And the error message lists the conflicting flags

  # ============================================================================
  # RULE 2: Output Modifiers
  # ============================================================================

  Rule: Global output modifier flags apply to any list-returning command

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

    @acceptance-criteria @happy-path
    Scenario: Names-only output for list queries
      Given 5 patterns exist with status "roadmap"
      When running "process-api query getRoadmapItems --names-only"
      Then the output is a JSON array of 5 strings
      And each string is a pattern name

    @acceptance-criteria @happy-path
    Scenario: Count output for list queries
      Given 3 active patterns and 5 roadmap patterns
      When running "process-api query getCurrentWork --count"
      Then the output is the integer 3

    @acceptance-criteria @happy-path
    Scenario: Field selection for list queries
      Given patterns exist in the dataset
      When running "process-api query getCurrentWork --fields patternName,status,phase"
      Then each pattern in the output contains only the requested fields
      And no other fields are present

    @acceptance-criteria @validation
    Scenario: Invalid field name in field selection is rejected
      Given patterns exist in the dataset
      When running "process-api query getCurrentWork --fields patternName,nonExistentField"
      Then the command fails with an error about invalid field names
      And the error message lists valid field names for the current output mode

  # ============================================================================
  # RULE 3: Output Format and Envelope
  # ============================================================================

  Rule: Output format is configurable with typed response envelope

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

    @acceptance-criteria @happy-path
    Scenario: Successful query returns typed envelope
      Given patterns exist in the dataset
      When running "process-api status"
      Then the output JSON has "success" set to true
      And the output JSON has a "data" field with the result
      And the output JSON has a "metadata" field with pattern count

    @acceptance-criteria @validation
    Scenario: Failed query returns error envelope
      When running "process-api query nonExistentMethod"
      Then the output JSON has "success" set to false
      And the output JSON has an "error" field with a message

    @acceptance-criteria @happy-path
    Scenario: Compact format strips empty fields
      Given a pattern with empty arrays and null values
      When running "process-api pattern MyPattern"
      Then the output does not contain empty arrays
      And the output does not contain null values
      And the output does not contain empty strings

  # ============================================================================
  # RULE 4: Filtering and Search
  # ============================================================================

  Rule: List subcommand provides composable filters and fuzzy search

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

    @acceptance-criteria @happy-path
    Scenario: List with single filter
      Given patterns with various statuses and categories
      When running "process-api list --status active"
      Then only active patterns are returned
      And results use the compact summary format

    @acceptance-criteria @happy-path
    Scenario: List with composed filters
      Given patterns with various statuses and categories
      When running "process-api list --status roadmap --category projection"
      Then only roadmap patterns in the projection category are returned

    @acceptance-criteria @happy-path
    Scenario: Search with fuzzy matching
      Given a pattern named "AgentCommandInfrastructure"
      When running "process-api search AgentCommand"
      Then the result includes "AgentCommandInfrastructure"
      And results are ranked by match quality

    @acceptance-criteria @happy-path
    Scenario: Pagination with limit and offset
      Given 20 roadmap patterns exist
      When running "process-api list --status roadmap --limit 5 --offset 10"
      Then exactly 5 patterns are returned
      And they start from the 11th pattern

    @acceptance-criteria @validation
    Scenario: Search with no results returns empty with suggestion
      Given patterns exist but none match "zzNonexistent"
      When running "process-api search zzNonexistent"
      Then the result contains an empty matches array
      And the output includes a hint that no patterns matched

  # ============================================================================
  # RULE 5: CLI Ergonomics
  # ============================================================================

  Rule: CLI provides ergonomic defaults and helpful error messages

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

    @acceptance-criteria @happy-path
    Scenario: Config file provides default input paths
      Given a delivery-process.config.ts exists with input and features paths
      When running "process-api status" without --input or --features flags
      Then the pipeline uses paths from the config file
      And the output shows correct pattern counts

    @acceptance-criteria @validation
    Scenario: Fuzzy pattern name suggestion on not-found
      Given a pattern "AgentCommandInfrastructure" exists
      When running "process-api pattern AgentCommand"
      Then the error message includes "Did you mean: AgentCommandInfrastructure?"

    @acceptance-criteria @validation
    Scenario: Empty result provides contextual hint
      Given no patterns have status "active"
      And 3 patterns have status "roadmap"
      When running "process-api list --status active"
      Then the output includes a hint about roadmap patterns
      And the hint suggests "Try: list --status roadmap"
