/**
 * @libar-docs
 * @libar-docs-pattern CLISchema
 * @libar-docs-status completed
 * @libar-docs-implements ProcessApiHybridGeneration
 * @libar-docs-arch-context cli
 * @libar-docs-arch-layer domain
 * @libar-docs-product-area:DataAPI
 *
 * ## CLI Schema — Single Source of Truth for CLI Reference
 *
 * Declarative schema defining all CLI options for the process-api command.
 * Consumed by:
 * - `showHelp()` in process-api.ts (terminal help text)
 * - `ProcessApiReferenceGenerator` (generated markdown reference)
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

export interface CLISchema {
  readonly globalOptions: CLIOptionGroup;
  readonly outputModifiers: CLIOptionGroup;
  readonly listFilters: CLIOptionGroup;
  readonly sessionOptions: CLIOptionGroup;
}

// =============================================================================
// Schema Definition
// =============================================================================

export const CLI_SCHEMA: CLISchema = {
  globalOptions: {
    title: 'Global Options',
    postNote:
      '**Config auto-detection:** If `--input` and `--features` are not provided, the CLI loads defaults from `delivery-process.config.ts` in the current directory. If no config file exists, it falls back to filesystem-based detection. If neither works, `--input` is required.',
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
};
