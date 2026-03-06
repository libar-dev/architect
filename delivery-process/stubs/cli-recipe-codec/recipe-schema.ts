/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements CliRecipeCodec
 * @libar-docs-target src/cli/cli-schema.ts
 *
 * ## Recipe Schema — Structured Data Model for CLI Recipes
 *
 * Defines `RecipeGroup`, `RecipeExample`, and `RecipeStep` interfaces that
 * extend `CLISchema` with multi-command recipe sequences.
 *
 * **Design Decision DD-1 (Separate schema extension, not inline per-option):**
 * Recipes are multi-command sequences ("run these 3 commands in order") with
 * explanatory context. They do not fit into `CLIOptionGroup` which models
 * individual flags. A separate `RecipeGroup[]` field on `CLISchema` keeps
 * the type system clean — existing `CLIOptionGroup` types are unchanged,
 * and recipes are independently testable.
 *
 * Alternatives considered:
 * - (A) Inline recipes in `CLIOptionGroup` — rejected because recipes span
 *   multiple option groups (e.g., "Starting a Session" uses `overview` +
 *   `scope-validate` + `context` which span session and global options).
 * - (C) Feature file Rule: blocks — rejected because recipe content is
 *   procedural ("do X then Y"), not behavioral invariants. Feature files
 *   define what IS true; recipes define what to DO.
 *
 * **Design Decision DD-3 (Preamble for editorial prose):**
 * The "Why Use This" motivation (~30 lines), Quick Start with example output
 * (~32 lines), and session type decision tree (~12 lines) use the preamble
 * mechanism in generator config, NOT fields in the recipe schema. These are
 * editorial prose requiring human judgment, not structured data that can be
 * derived from CLI metadata. The preamble mechanism is proven by
 * DocsConsolidationStrategy Phase 2 and ErrorGuideCodec design stubs.
 *
 * **Design Decision DD-4 (Extended descriptions from schema):**
 * Narrative command descriptions ("Highest-impact command. Pre-flight readiness
 * check...") are sourced from `CommandNarrative` entries in the schema, not
 * hardcoded in the generator. Each `CommandNarrative` carries a title, rich
 * description, and usage example. This extends the existing `CLIOptionGroup`
 * pattern: `CLIOptionGroup.description` carries per-group prose, and
 * `CommandNarrative` carries per-command prose.
 *
 * We chose a separate `CommandNarrative` type rather than extending
 * `CLIOptionGroup.description` because:
 * - Command groups (Session Workflow, Pattern Discovery, Architecture) contain
 *   heterogeneous commands that each need their own narrative
 * - `CLIOptionGroup` is designed for flag tables, not command catalogs
 * - Narrative entries need usage examples (code blocks) which don't fit
 *   in a single description string
 *
 * **Design Decision DD-5 (Recipe organization and output format):**
 * Recipes are grouped by task intent, not by session type or command name.
 * Groups: "Starting a Session", "Finding What to Work On", "Investigating a
 * Pattern", "Design Session Prep", "Ending a Session". Each `RecipeExample`
 * has a title, purpose string, array of `RecipeStep` (command + comment),
 * and optional expected output. This mirrors the existing Common Recipes
 * section structure in PROCESS-API.md, ensuring zero information loss.
 *
 * ### Integration with CLISchema
 *
 * The existing `CLISchema` interface gains two new fields:
 *
 * | Field | Type | Purpose |
 * |-------|------|---------|
 * | `recipes` | `RecipeGroup[]` | Multi-command recipe sequences |
 * | `commandNarratives` | `CommandNarrativeGroup[]` | Per-command narrative descriptions |
 *
 * Both are optional to preserve backward compatibility with existing consumers
 * (ProcessApiReferenceGenerator, showHelp).
 */

// =============================================================================
// Recipe Schema Types
// =============================================================================

/**
 * A single step in a recipe — one CLI command with an explanatory comment.
 *
 * @example
 * ```typescript
 * const step: RecipeStep = {
 *   command: 'pnpm process:query -- overview',
 *   comment: 'project health',
 * };
 * ```
 */
export interface RecipeStep {
  /** The CLI command to run */
  readonly command: string;

  /** Short inline comment explaining what this step does */
  readonly comment?: string;
}

/**
 * A complete recipe example — a titled sequence of commands with context.
 *
 * @example
 * ```typescript
 * const recipe: RecipeExample = {
 *   title: 'Starting a Session',
 *   purpose: 'The recommended session startup is three commands.',
 *   steps: [
 *     { command: 'pnpm process:query -- overview', comment: 'project health' },
 *     { command: 'pnpm process:query -- scope-validate MyPattern implement', comment: 'pre-flight' },
 *     { command: 'pnpm process:query -- context MyPattern --session implement', comment: 'curated context' },
 *   ],
 * };
 * ```
 */
export interface RecipeExample {
  /** Recipe title (becomes H3 or H4 heading) */
  readonly title: string;

  /** One-line purpose description rendered before the code block */
  readonly purpose: string;

  /** Ordered sequence of CLI commands */
  readonly steps: readonly RecipeStep[];

  /**
   * Optional expected output block rendered after the commands.
   * Static string — no build-time CLI execution.
   */
  readonly expectedOutput?: string;
}

/**
 * A group of related recipes under a shared heading.
 *
 * @example
 * ```typescript
 * const group: RecipeGroup = {
 *   title: 'Common Recipes',
 *   description: 'Frequently-used command sequences for daily workflow.',
 *   recipes: [startingASession, findingWork],
 * };
 * ```
 */
export interface RecipeGroup {
  /** Group heading (becomes H2 heading) */
  readonly title: string;

  /** Optional intro prose rendered below the heading */
  readonly description?: string;

  /** Recipe examples in this group */
  readonly recipes: readonly RecipeExample[];
}

// =============================================================================
// Command Narrative Types
// =============================================================================

/**
 * Narrative metadata for a single CLI command.
 *
 * Carries the rich description and usage example that appears in the
 * generated recipe file alongside the command. This replaces the manually
 * maintained prose in docs/PROCESS-API.md sections like "Session Workflow
 * Commands" and "Pattern Discovery".
 *
 * @example
 * ```typescript
 * const narrative: CommandNarrative = {
 *   command: 'scope-validate',
 *   description: 'Highest-impact command. Pre-flight readiness check that prevents wasted sessions.',
 *   usageExample: 'pnpm process:query -- scope-validate MyPattern implement',
 *   details: 'Checks: dependency completion, deliverable definitions, FSM transition validity, design decisions.',
 * };
 * ```
 */
export interface CommandNarrative {
  /** Command name (e.g., 'overview', 'scope-validate', 'context') */
  readonly command: string;

  /** Rich narrative description of what this command does and why */
  readonly description: string;

  /** Primary usage example as a CLI command string */
  readonly usageExample: string;

  /** Additional detail text rendered below the usage example */
  readonly details?: string;

  /** Optional expected output block for this command */
  readonly expectedOutput?: string;
}

/**
 * A group of related command narratives under a shared section heading.
 *
 * Maps to sections like "Session Workflow Commands" (6 text commands)
 * and "Pattern Discovery" (8 JSON commands) in docs/PROCESS-API.md.
 */
export interface CommandNarrativeGroup {
  /** Section heading (e.g., 'Session Workflow Commands') */
  readonly title: string;

  /** Intro prose for the section */
  readonly description?: string;

  /** Individual command narratives */
  readonly commands: readonly CommandNarrative[];
}

// =============================================================================
// CLISchema Extension
// =============================================================================

/**
 * CLISchema already includes `recipes` and `commandNarratives` fields
 * (added during Phase 43 implementation). See `src/cli/cli-schema.ts`
 * for the canonical interface. No separate extended type needed.
 */

export function _recipeSchemaPlaceholder(): never {
  throw new Error('CliRecipeCodec not yet implemented - roadmap pattern');
}
