/**
 * @architect
 * @architect-pattern CLISchema
 * @architect-status completed
 * @architect-unlock-reason:Add-recipe-and-narrative-fields-for-CliRecipeCodec
 * @architect-implements CliReferenceGeneration
 * @architect-arch-context cli
 * @architect-arch-layer domain
 * @architect-product-area:DataAPI
 *
 * ## CLI Schema — Single Source of Truth for CLI Reference
 *
 * Declarative schema defining all CLI options for the architect command.
 * Consumed by:
 * - `showHelp()` in pattern-graph-cli.ts (terminal help text)
 * - `CliReferenceGenerator` (generated markdown reference)
 *
 * This eliminates three-way sync between parser code, help text, and docs.
 */

// =============================================================================
// Types
// =============================================================================

export interface CLIOptionDef {
  /** Flag with value placeholder, e.g., '--input <pattern>' */
  readonly flag: string;
  /** Short alias, e.g., '-i' */
  readonly short?: string;
  /** Human-readable description */
  readonly description: string;
  /** Default value display string */
  readonly default?: string;
}

export interface CLIOptionGroup {
  /** Section heading */
  readonly title: string;
  /** Singular form of title for column headers in two-column tables */
  readonly singularTitle?: string;
  /** Intro prose rendered above the table */
  readonly description?: string;
  /** Prose rendered below the table */
  readonly postNote?: string;
  /** Option definitions */
  readonly options: readonly CLIOptionDef[];
}

/** A single step in a recipe — one CLI command with an explanatory comment. */
export interface RecipeStep {
  readonly command: string;
  readonly comment?: string;
}

/** A complete recipe example — a titled sequence of commands with context. */
export interface RecipeExample {
  readonly title: string;
  readonly purpose: string;
  readonly steps: readonly RecipeStep[];
  readonly expectedOutput?: string;
}

/** A group of related recipes under a shared heading. */
export interface RecipeGroup {
  readonly title: string;
  readonly description?: string;
  readonly recipes: readonly RecipeExample[];
}

/** Narrative metadata for a single CLI command. */
export interface CommandNarrative {
  readonly command: string;
  readonly description: string;
  readonly usageExample: string;
  readonly details?: string;
  readonly expectedOutput?: string;
}

/** A group of related command narratives under a shared section heading. */
export interface CommandNarrativeGroup {
  readonly title: string;
  readonly description?: string;
  readonly commands: readonly CommandNarrative[];
}

export interface CLISchema {
  readonly globalOptions: CLIOptionGroup;
  readonly outputModifiers: CLIOptionGroup;
  readonly listFilters: CLIOptionGroup;
  readonly sessionOptions: CLIOptionGroup;
  readonly recipes?: readonly RecipeGroup[];
  readonly commandNarratives?: readonly CommandNarrativeGroup[];
}

// =============================================================================
// Schema Definition
// =============================================================================

export const CLI_SCHEMA: CLISchema = {
  globalOptions: {
    title: 'Global Options',
    postNote:
      '**Config auto-detection:** If `--input` and `--features` are not provided, the CLI loads defaults from `architect.config.ts` or `architect.config.js`. If no config file exists, it falls back to filesystem-based detection. If neither works, `--input` is required.',
    options: [
      {
        flag: '--input <pattern>',
        short: '-i',
        description: 'TypeScript glob pattern (repeatable)',
        default: 'from config or auto-detected',
      },
      {
        flag: '--features <pattern>',
        short: '-f',
        description: 'Gherkin glob pattern (repeatable)',
        default: 'from config or auto-detected',
      },
      {
        flag: '--base-dir <dir>',
        short: '-b',
        description: 'Base directory',
        default: 'cwd',
      },
      {
        flag: '--workflow <file>',
        short: '-w',
        description: 'Workflow config JSON',
        default: 'default',
      },
      {
        flag: '--help',
        short: '-h',
        description: 'Show help',
      },
      {
        flag: '--version',
        short: '-v',
        description: 'Show version',
      },
    ],
  },

  outputModifiers: {
    title: 'Output Modifiers',
    singularTitle: 'Output Modifier',
    description: 'Composable with `list`, `arch context/layer`, and pattern-array `query` methods.',
    postNote: [
      'Valid fields for `--fields`: `patternName`, `status`, `category`, `phase`, `file`, `source`.',
      '',
      'Precedence: `--count` > `--names-only` > `--fields` > default summarize.',
      '',
      '**Note on summarization:** By default, pattern arrays are summarized to ~100 bytes per pattern (from ~3.5KB raw). Use `--full` to get complete pattern objects.',
    ].join('\n'),
    options: [
      {
        flag: '--names-only',
        description: 'Return array of pattern name strings',
      },
      {
        flag: '--count',
        description: 'Return integer count',
      },
      {
        flag: '--fields <f1,f2,...>',
        description: 'Return only specified fields per pattern',
      },
      {
        flag: '--full',
        description: 'Bypass summarization, return raw patterns',
      },
      {
        flag: '--format <fmt>',
        description: '`json` (default, pretty-printed) or `compact`',
      },
    ],
  },

  listFilters: {
    title: 'List Filters',
    singularTitle: 'List Filter',
    description: 'For the `list` subcommand. All filters are composable.',
    options: [
      {
        flag: '--status <status>',
        description: 'Filter by FSM status (roadmap, active, completed, deferred)',
      },
      {
        flag: '--phase <number>',
        description: 'Filter by roadmap phase number',
      },
      {
        flag: '--category <name>',
        description: 'Filter by category',
      },
      {
        flag: '--source <ts|gherkin>',
        description: 'Filter by source type',
      },
      {
        flag: '--arch-context <name>',
        description: 'Filter by architecture context',
      },
      {
        flag: '--product-area <name>',
        description: 'Filter by product area',
      },
      {
        flag: '--limit <n>',
        description: 'Maximum results',
      },
      {
        flag: '--offset <n>',
        description: 'Skip first n results',
      },
    ],
  },

  sessionOptions: {
    title: 'Session Types',
    description: 'For the `--session` flag used with `context` and `scope-validate`.',
    options: [
      {
        flag: '--session <type>',
        description: 'Session type: `planning`, `design`, or `implement`',
      },
    ],
  },

  // ===========================================================================
  // Command Narratives (originally transcribed from docs/CLI.md)
  // ===========================================================================

  commandNarratives: [
    // ---- Session Workflow Commands (6 text commands) ----
    {
      title: 'Session Workflow Commands',
      description:
        'These 6 commands output structured text (not JSON). They are designed for terminal reading and AI context consumption.',
      commands: [
        {
          command: 'overview',
          description:
            'Executive summary: progress percentage, active phases, blocking patterns, and a CLI cheat sheet.',
          usageExample: 'pnpm architect:query -- overview',
          expectedOutput: [
            '=== PROGRESS ===',
            '318 patterns (224 completed, 47 active, 47 planned) = 70%',
            '',
            '=== ACTIVE PHASES ===',
            'Phase 24: PatternGraphAPIRelationshipQueries (1 active)',
            'Phase 25: DataAPIStubIntegration (1 active)',
            '',
            '=== BLOCKING ===',
            'StepLintExtendedRules blocked by: StepLintVitestCucumber',
            '',
            '=== DATA API \u2014 Use Instead of Explore Agents ===',
            'pnpm architect:query -- <subcommand>',
            '  overview, context, scope-validate, dep-tree, list, stubs, files, rules, arch blocking',
          ].join('\n'),
        },
        {
          command: 'scope-validate',
          description:
            '**Highest-impact command.** Pre-flight readiness check that prevents wasted sessions. Returns a PASS/BLOCKED/WARN verdict covering: dependency completion, deliverable definitions, FSM transition validity, and design decisions.',
          usageExample: 'pnpm architect:query -- scope-validate MyPattern implement',
          details:
            'Checks: dependency completion, deliverable definitions, FSM transition validity, design decisions, executable spec location. Valid session types for scope-validate: `implement`, `design`.',
          expectedOutput: [
            '=== SCOPE VALIDATION: DataAPIDesignSessionSupport (implement) ===',
            '',
            '=== CHECKLIST ===',
            '[PASS] Dependencies completed: 2/2 completed',
            '[PASS] Deliverables defined: 4 deliverable(s) found',
            '[BLOCKED] FSM allows transition: completed \u2192 active is not valid.',
            '[WARN] Design decisions recorded: No PDR/AD references found in stubs',
            '',
            '=== VERDICT ===',
            'BLOCKED: 1 blocker(s) prevent implement session',
          ].join('\n'),
        },
        {
          command: 'context',
          description: 'Curated context bundle tailored to session type.',
          usageExample: 'pnpm architect:query -- context MyPattern --session design',
          expectedOutput: [
            '=== PATTERN: ContextAssemblerImpl ===',
            'Status: active | Category: pattern',
            '## ContextAssembler \u2014 Session-Oriented Context Bundle Builder',
            '',
            'Pure function composition over PatternGraph.',
            'File: src/api/context-assembler.ts',
            '',
            '=== DEPENDENCIES ===',
            '[active] PatternGraphAPI (implementation) src/api/pattern-graph-api.ts',
            '[completed] PatternGraph (implementation) src/validation-schemas/pattern-graph.ts',
            '',
            '=== CONSUMERS ===',
            'ContextFormatterImpl (active)',
            'PatternGraphCLIImpl (active)',
            '',
            '=== ARCHITECTURE (context: api) ===',
            'PatternGraph (completed, read-model)',
            'PatternGraphAPI (active, service)',
            '...',
          ].join('\n'),
        },
        {
          command: 'dep-tree',
          description:
            'Dependency chain with status indicators. Shows what a pattern depends on, recursively.',
          usageExample: 'pnpm architect:query -- dep-tree MyPattern',
          details:
            'Use `--depth` to limit recursion depth: `pnpm architect:query -- dep-tree MyPattern --depth 2`.',
        },
        {
          command: 'files',
          description:
            'File reading list with implementation paths. Use `--related` to include architecture neighbors.',
          usageExample: 'pnpm architect:query -- files MyPattern --related',
          expectedOutput: [
            '=== PRIMARY ===',
            'src/cli/pattern-graph-cli.ts',
            '',
            '=== ARCHITECTURE NEIGHBORS ===',
            'src/cli/version.ts',
            'src/cli/output-pipeline.ts',
            'src/cli/error-handler.ts',
          ].join('\n'),
        },
        {
          command: 'handoff',
          description:
            'Captures session-end state: deliverable statuses, blockers, and modification date.',
          usageExample: 'pnpm architect:query -- handoff --pattern MyPattern',
          details:
            'Use `--git` to include recent commits. Use `--session` to tag the handoff with a session id.',
          expectedOutput: [
            '=== HANDOFF: DataAPIDesignSessionSupport (review) ===',
            'Date: 2026-02-21 | Status: completed',
            '',
            '=== COMPLETED ===',
            '[x] Scope validation logic (src/api/scope-validator.ts)',
            '[x] Handoff document generator (src/api/handoff-generator.ts)',
            '',
            '=== BLOCKERS ===',
            'None',
          ].join('\n'),
        },
      ],
    },

    // ---- Pattern Discovery (8 JSON commands) ----
    {
      title: 'Pattern Discovery',
      description: 'These commands output JSON wrapped in a `QueryResult` envelope.',
      commands: [
        {
          command: 'status',
          description: 'Status counts and completion percentage.',
          usageExample: 'pnpm architect:query -- status',
          details:
            '**Output:** `{ counts: { completed, active, planned, total }, completionPercentage, distribution }`',
        },
        {
          command: 'list',
          description:
            'Filtered pattern listing. Composable with output modifiers and list filters.',
          usageExample: 'pnpm architect:query -- list --status roadmap --names-only',
          details:
            'See Output Modifiers and List Filters for all options. Examples: `list --status active --count`, `list --phase 25 --fields patternName,status,file`.',
        },
        {
          command: 'search',
          description:
            'Fuzzy name search with match scores. Suggests close matches when a pattern is not found.',
          usageExample: 'pnpm architect:query -- search EventStore',
        },
        {
          command: 'pattern',
          description:
            'Full detail for one pattern including deliverables, dependencies, and all relationship fields.',
          usageExample: 'pnpm architect:query -- pattern TransformDataset',
          details:
            '**Warning:** Completed patterns can produce ~66KB of output. Prefer `context --session` for interactive sessions.',
        },
        {
          command: 'stubs',
          description: 'Design stubs with target paths and resolution status.',
          usageExample: 'pnpm architect:query -- stubs MyPattern',
          details:
            'Use `--unresolved` to show only stubs missing target files: `pnpm architect:query -- stubs --unresolved`.',
        },
        {
          command: 'decisions',
          description: 'AD-N design decisions extracted from stub descriptions.',
          usageExample: 'pnpm architect:query -- decisions MyPattern',
          details:
            '**Note:** Returns exit code 1 when no decisions are found (unlike `list`/`search` which return empty arrays).',
        },
        {
          command: 'pdr',
          description: 'Cross-reference patterns mentioning a PDR number.',
          usageExample: 'pnpm architect:query -- pdr 1',
          details:
            '**Note:** Returns exit code 1 when no PDR references are found, same as `decisions`.',
        },
        {
          command: 'rules',
          description:
            'Business rules and invariants extracted from Gherkin `Rule:` blocks, grouped by product area, phase, and feature.',
          usageExample: 'pnpm architect:query -- rules --pattern ProcessGuardDecider',
          details:
            '**Warning:** Unfiltered `rules` output can exceed 600KB. Always use `--pattern` or `--product-area` filters. **Output shape:** `{ productAreas: [{ productArea, ruleCount, invariantCount, phases: [{ phase, features: [{ pattern, source, rules }] }] }], totalRules, totalInvariants }`',
        },
      ],
    },

    // ---- Architecture Queries (11 subcommands) ----
    {
      title: 'Architecture Queries',
      description:
        'All architecture queries output JSON. They use `@architect-arch-*` annotations.',
      commands: [
        {
          command: 'arch roles',
          description: 'All arch-roles with pattern counts',
          usageExample: 'pnpm architect:query -- arch roles',
        },
        {
          command: 'arch context',
          description: 'All bounded contexts',
          usageExample: 'pnpm architect:query -- arch context',
        },
        {
          command: 'arch context <name>',
          description: 'Patterns in one bounded context',
          usageExample: 'pnpm architect:query -- arch context scanner',
        },
        {
          command: 'arch layer',
          description: 'All architecture layers',
          usageExample: 'pnpm architect:query -- arch layer',
        },
        {
          command: 'arch layer <name>',
          description: 'Patterns in one layer',
          usageExample: 'pnpm architect:query -- arch layer domain',
        },
        {
          command: 'arch neighborhood <pattern>',
          description: 'Uses, usedBy, dependsOn, same-context',
          usageExample: 'pnpm architect:query -- arch neighborhood EventStore',
        },
        {
          command: 'arch compare <c1> <c2>',
          description: 'Cross-context shared deps + integration',
          usageExample: 'pnpm architect:query -- arch compare scanner codec',
        },
        {
          command: 'arch coverage',
          description: 'Annotation completeness across input files',
          usageExample: 'pnpm architect:query -- arch coverage',
        },
        {
          command: 'arch dangling',
          description: "Broken references (names that don't exist)",
          usageExample: 'pnpm architect:query -- arch dangling',
        },
        {
          command: 'arch orphans',
          description: 'Patterns with no relationships (isolated)',
          usageExample: 'pnpm architect:query -- arch orphans',
        },
        {
          command: 'arch blocking',
          description: 'Patterns blocked by incomplete deps',
          usageExample: 'pnpm architect:query -- arch blocking',
        },
      ],
    },

    // ---- Metadata & Inventory (4 commands) ----
    {
      title: 'Metadata & Inventory',
      commands: [
        {
          command: 'tags',
          description:
            'Tag usage report \u2014 counts per tag and value across all annotated sources.',
          usageExample: 'pnpm architect:query -- tags',
        },
        {
          command: 'sources',
          description: 'File inventory by type (TypeScript, Gherkin, Stubs, Decisions).',
          usageExample: 'pnpm architect:query -- sources',
        },
        {
          command: 'unannotated',
          description:
            'TypeScript files missing the `@architect` opt-in marker. Use `--path` to scope to a directory.',
          usageExample: 'pnpm architect:query -- unannotated --path src/types',
        },
        {
          command: 'query',
          description:
            'Execute any of the 26 query API methods directly by name. This is the escape hatch for methods not exposed as dedicated subcommands.',
          usageExample: 'pnpm architect:query -- query getStatusCounts',
          details:
            'Integer-like arguments are automatically coerced to numbers. Run `architect --help` for the full list of available API methods. Examples: `query isValidTransition roadmap active`, `query getPatternsByPhase 18`, `query getRecentlyCompleted 5`.',
        },
      ],
    },
  ],

  // ===========================================================================
  // Recipes (originally transcribed from docs/CLI.md "Common Recipes" section)
  // ===========================================================================

  recipes: [
    {
      title: 'Common Recipes',
      description: 'Frequently-used command sequences for daily workflow.',
      recipes: [
        {
          title: 'Starting a Session',
          purpose: 'The recommended session startup is three commands.',
          steps: [
            {
              command: 'pnpm architect:query -- overview',
              comment: 'project health',
            },
            {
              command: 'pnpm architect:query -- scope-validate MyPattern implement',
              comment: 'pre-flight',
            },
            {
              command: 'pnpm architect:query -- context MyPattern --session implement',
              comment: 'curated context',
            },
          ],
        },
        {
          title: 'Finding What to Work On',
          purpose: 'Discover available patterns, blockers, and missing implementations.',
          steps: [
            {
              command: 'pnpm architect:query -- list --status roadmap --names-only',
              comment: 'available patterns',
            },
            {
              command: 'pnpm architect:query -- arch blocking',
              comment: 'stuck patterns',
            },
            {
              command: 'pnpm architect:query -- stubs --unresolved',
              comment: 'missing implementations',
            },
          ],
        },
        {
          title: 'Investigating a Pattern',
          purpose: 'Deep-dive into a specific pattern: search, dependencies, neighbors, and files.',
          steps: [
            {
              command: 'pnpm architect:query -- search EventStore',
              comment: 'fuzzy name search',
            },
            {
              command: 'pnpm architect:query -- dep-tree MyPattern --depth 2',
              comment: 'dependency chain',
            },
            {
              command: 'pnpm architect:query -- arch neighborhood MyPattern',
              comment: 'what it touches',
            },
            {
              command: 'pnpm architect:query -- files MyPattern --related',
              comment: 'file paths',
            },
          ],
        },
        {
          title: 'Design Session Prep',
          purpose: 'Gather full context, design decisions, and stubs before a design session.',
          steps: [
            {
              command: 'pnpm architect:query -- context MyPattern --session design',
              comment: 'full context',
            },
            {
              command: 'pnpm architect:query -- decisions MyPattern',
              comment: 'design decisions',
            },
            {
              command: 'pnpm architect:query -- stubs MyPattern',
              comment: 'existing stubs',
            },
          ],
        },
        {
          title: 'Ending a Session',
          purpose: 'Capture session-end state for continuity.',
          steps: [
            {
              command: 'pnpm architect:query -- handoff --pattern MyPattern',
              comment: 'capture state',
            },
            {
              command: 'pnpm architect:query -- handoff --pattern MyPattern --git',
              comment: 'include commits',
            },
          ],
        },
      ],
    },
  ],
};
