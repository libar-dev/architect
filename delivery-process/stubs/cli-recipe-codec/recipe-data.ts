/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements CliRecipeCodec
 * @libar-docs-target src/cli/cli-schema.ts
 *
 * ## Recipe Data — Example Definitions for CLI_SCHEMA Extension
 *
 * Demonstrates how recipe content from docs/PROCESS-API.md maps to the
 * structured `RecipeGroup[]` and `CommandNarrativeGroup[]` schema types
 * defined in `recipe-schema.ts`.
 *
 * **Content source:** All recipe and narrative content below is extracted from
 * the manually-maintained `docs/PROCESS-API.md` (509 lines). During
 * implementation, this content moves into `CLI_SCHEMA` in
 * `src/cli/cli-schema.ts` and the manual prose sections in PROCESS-API.md
 * are replaced with links to the generated file.
 *
 * **Coverage:** This stub shows 2 of 5 recipe groups and 2 of 6 command
 * narratives to validate the schema design. The full implementation will
 * include all content from PROCESS-API.md sections:
 *
 * | PROCESS-API.md Section | Schema Location | Content Type |
 * |------------------------|-----------------|--------------|
 * | Common Recipes (5 blocks, 42 lines) | `CLI_SCHEMA.recipes` | RecipeGroup[] |
 * | Session Workflow Commands (6 cmds, 125 lines) | `CLI_SCHEMA.commandNarratives[0]` | CommandNarrativeGroup |
 * | Pattern Discovery (8 cmds, 95 lines) | `CLI_SCHEMA.commandNarratives[1]` | CommandNarrativeGroup |
 * | Architecture Queries (11 cmds, 28 lines) | `CLI_SCHEMA.commandNarratives[2]` | CommandNarrativeGroup |
 * | Metadata and Inventory (4 cmds, 39 lines) | `CLI_SCHEMA.commandNarratives[3]` | CommandNarrativeGroup |
 * | Why Use This (30 lines) | Generator preamble | SectionBlock[] |
 * | Quick Start (32 lines) | Generator preamble | SectionBlock[] |
 * | Session Types (12 lines) | Generator preamble | SectionBlock[] |
 *
 * **DD-4 validation:** Each command narrative below carries its description
 * and usage example as structured data, not freeform prose. The generator
 * renders these fields into markdown without any hardcoded command text.
 */

import type {
  RecipeGroup,
  RecipeExample,
  RecipeStep,
  CommandNarrativeGroup,
  CommandNarrative,
} from './recipe-schema.js';

// =============================================================================
// Recipe Group Examples (2 of 5)
// =============================================================================

/**
 * "Starting a Session" recipe — the recommended 3-command startup sequence.
 *
 * Source: docs/PROCESS-API.md lines 470-476 (Common Recipes section).
 */
const startingASessionRecipe: RecipeExample = {
  title: 'Starting a Session',
  purpose: 'The recommended session startup is three commands.',
  steps: [
    {
      command: 'pnpm process:query -- overview',
      comment: 'project health',
    },
    {
      command: 'pnpm process:query -- scope-validate MyPattern implement',
      comment: 'pre-flight',
    },
    {
      command: 'pnpm process:query -- context MyPattern --session implement',
      comment: 'curated context',
    },
  ] satisfies readonly RecipeStep[],
};

/**
 * "Finding What to Work On" recipe — discover available work.
 *
 * Source: docs/PROCESS-API.md lines 478-484.
 */
const findingWorkRecipe: RecipeExample = {
  title: 'Finding What to Work On',
  purpose: 'Discover available patterns, blockers, and missing implementations.',
  steps: [
    {
      command: 'pnpm process:query -- list --status roadmap --names-only',
      comment: 'available patterns',
    },
    {
      command: 'pnpm process:query -- arch blocking',
      comment: 'stuck patterns',
    },
    {
      command: 'pnpm process:query -- stubs --unresolved',
      comment: 'missing implementations',
    },
  ] satisfies readonly RecipeStep[],
};

/**
 * Example RecipeGroup composing the two recipe examples above.
 *
 * During implementation, all 5 recipe groups from PROCESS-API.md are defined:
 * 1. Starting a Session
 * 2. Finding What to Work On
 * 3. Investigating a Pattern
 * 4. Design Session Prep
 * 5. Ending a Session
 */
export const COMMON_RECIPES: RecipeGroup = {
  title: 'Common Recipes',
  description: 'Frequently-used command sequences for daily workflow.',
  recipes: [startingASessionRecipe, findingWorkRecipe],
};

// =============================================================================
// Command Narrative Examples (2 of 6 session workflow commands)
// =============================================================================

/**
 * Narrative for the `overview` command.
 *
 * Source: docs/PROCESS-API.md lines 86-91.
 */
const overviewNarrative: CommandNarrative = {
  command: 'overview',
  description:
    'Executive summary: progress percentage, active phases, blocking patterns, and a CLI cheat sheet.',
  usageExample: 'pnpm process:query -- overview',
  expectedOutput: [
    '=== PROGRESS ===',
    '318 patterns (224 completed, 47 active, 47 planned) = 70%',
    '',
    '=== ACTIVE PHASES ===',
    'Phase 24: ProcessStateAPIRelationshipQueries (1 active)',
    'Phase 25: DataAPIStubIntegration (1 active)',
    '',
    '=== BLOCKING ===',
    'StepLintExtendedRules blocked by: StepLintVitestCucumber',
    '',
    '=== DATA API ===',
    'pnpm process:query -- <subcommand>',
    '  overview, context, scope-validate, dep-tree, list, stubs, files, rules, arch blocking',
  ].join('\n'),
};

/**
 * Narrative for the `scope-validate` command.
 *
 * Source: docs/PROCESS-API.md lines 94-117.
 */
const scopeValidateNarrative: CommandNarrative = {
  command: 'scope-validate',
  description:
    'Highest-impact command. Pre-flight readiness check that prevents wasted sessions. Returns a PASS/BLOCKED/WARN verdict covering: dependency completion, deliverable definitions, FSM transition validity, and design decisions.',
  usageExample: 'pnpm process:query -- scope-validate MyPattern implement',
  details:
    'Checks: dependency completion, deliverable definitions, FSM transition validity, design decisions, executable spec location. Valid session types: `implement`, `design`.',
  expectedOutput: [
    '=== SCOPE VALIDATION: DataAPIDesignSessionSupport (implement) ===',
    '',
    '=== CHECKLIST ===',
    '[PASS] Dependencies completed: 2/2 completed',
    '[PASS] Deliverables defined: 4 deliverable(s) found',
    '[BLOCKED] FSM allows transition: completed -> active is not valid.',
    '[WARN] Design decisions recorded: No PDR/AD references found in stubs',
    '',
    '=== VERDICT ===',
    'BLOCKED: 1 blocker(s) prevent implement session',
  ].join('\n'),
};

/**
 * Example CommandNarrativeGroup for Session Workflow Commands.
 *
 * During implementation, all 6 session workflow commands are included:
 * overview, scope-validate, context, dep-tree, files, handoff.
 *
 * Additional CommandNarrativeGroups are created for:
 * - Pattern Discovery (status, list, search, pattern, stubs, decisions, pdr, rules)
 * - Architecture Queries (arch roles, context, layer, neighborhood, compare, coverage, dangling, orphans, blocking)
 * - Metadata and Inventory (tags, sources, unannotated, query)
 */
export const SESSION_WORKFLOW_NARRATIVES: CommandNarrativeGroup = {
  title: 'Session Workflow Commands',
  description:
    'These 6 commands output structured text (not JSON). They are designed for terminal reading and AI context consumption.',
  commands: [overviewNarrative, scopeValidateNarrative],
};

// =============================================================================
// Preamble Content Example (configured in delivery-process.config.ts)
// =============================================================================

/**
 * Example preamble sections for the CliRecipeGenerator config.
 *
 * These are SectionBlock[] that get prepended before generated content.
 * During implementation, the full preamble includes:
 *
 * 1. "Why Use This" — comparison table (CLI vs reading markdown)
 * 2. Quick Start — 3-command sequence with example `overview` output
 * 3. Session Types — table + decision tree sentence
 *
 * Source: docs/PROCESS-API.md lines 13-77.
 *
 * Note: The preamble is configured in delivery-process.config.ts, NOT in
 * CLI_SCHEMA. This keeps editorial prose separate from structured command
 * metadata and follows the proven pattern from ReferenceDocConfig.preamble.
 */
export const EXAMPLE_PREAMBLE = [
  // --- Why Use This ---
  {
    type: 'heading' as const,
    level: 2,
    text: 'Why Use This',
  },
  {
    type: 'paragraph' as const,
    text: 'Traditional approach: read generated Markdown, parse it mentally, hope it\'s current. This CLI queries the **same annotated sources** that generate those docs -- in real time, with typed output.',
  },
  {
    type: 'table' as const,
    columns: ['Approach', 'Context Cost', 'Accuracy', 'Speed'],
    rows: [
      ['Parse generated Markdown', 'High', 'Snapshot at gen time', 'Slow'],
      ['**Data API CLI**', '**Low**', 'Real-time from source', 'Instant'],
    ],
  },
  {
    type: 'paragraph' as const,
    text: [
      'The CLI has two output modes:',
      '',
      '- **Text commands** (6) -- formatted for terminal reading or AI context. Use `===` section markers for structure.',
      '- **JSON commands** (12+) -- wrapped in a `QueryResult` envelope. Pipeable to `jq`.',
    ].join('\n'),
  },

  // --- Session Types ---
  {
    type: 'heading' as const,
    level: 2,
    text: 'Session Types',
  },
  {
    type: 'paragraph' as const,
    text: 'The `--session` flag tailors output to what you need right now:',
  },
  {
    type: 'table' as const,
    columns: ['Type', 'Includes', 'When to Use'],
    rows: [
      ['`planning`', 'Pattern metadata and spec file only', 'Creating a new roadmap spec'],
      ['`design`', 'Full: metadata, stubs, deps, deliverables', 'Making architectural decisions'],
      ['`implement`', 'Focused: deliverables, FSM state, test files', 'Writing code from an existing spec'],
    ],
  },
  {
    type: 'paragraph' as const,
    text: '**Decision tree:** Starting to code? `implement`. Complex decisions? `design`. New pattern? `planning`. Not sure? Run `overview` first.',
  },
] as const;

// =============================================================================
// Placeholder
// =============================================================================

export function _recipeDataPlaceholder(): never {
  throw new Error('CliRecipeCodec not yet implemented - roadmap pattern');
}
