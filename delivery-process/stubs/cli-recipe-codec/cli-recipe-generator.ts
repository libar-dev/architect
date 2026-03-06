/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements CliRecipeCodec
 * @libar-docs-target src/generators/built-in/cli-recipe-generator.ts
 *
 * ## CliRecipeGenerator — Standalone Generator for CLI Recipes and Narratives
 *
 * Produces `docs-live/reference/PROCESS-API-RECIPES.md` from the declarative
 * CLI schema. Sibling to `ProcessApiReferenceGenerator` — both implement
 * `DocumentGenerator`, both consume `CLI_SCHEMA` directly, neither depends
 * on MasterDataset (ADR-006 compliant).
 *
 * **Design Decision DD-1 (Separate generator, not extension):**
 * Reference tables and recipe guides serve different audiences and change at
 * different cadences. Reference tables change when CLI flags are added or
 * removed. Recipes change when workflow recommendations evolve. Coupling
 * them in one generator would force both to change together.
 * `ProcessApiReferenceGenerator` is already completed and tested (Phase 43) —
 * extending it risks regressions. Two small standalone generators are easier
 * to test and maintain than one large one.
 *
 * **Design Decision DD-2 (Schema-sourced content):**
 * Recipe definitions and command narratives live in `CLI_SCHEMA` as structured
 * data (see `recipe-schema.ts` for type definitions). The generator reads
 * these fields and transforms them to `SectionBlock[]` using the renderable
 * schema block builders. No domain knowledge is hardcoded in the generator.
 *
 * **Design Decision DD-3 (Preamble mechanism for editorial prose):**
 * Editorial content ("Why Use This", Quick Start, session decision tree) is
 * passed via a `preamble` field in the generator's config — an array of
 * `SectionBlock[]` that is prepended before all generated content. This
 * follows the proven pattern from `ReferenceDocConfig.preamble` and
 * `ErrorGuideCodec` design. The preamble is configured in
 * `delivery-process.config.ts`, not in the generator source.
 *
 * **Design Decision DD-5 (No claude-md output):**
 * The generator produces only `docs-live/reference/PROCESS-API-RECIPES.md`.
 * It does NOT produce `_claude-md/` output because CLAUDE.md already has
 * a manually-authored "Data API CLI" section that serves the AI context use
 * case. Adding generated claude-md modules would create duplicate content.
 *
 * ### Output File Structure
 *
 * The generated `PROCESS-API-RECIPES.md` has this structure:
 *
 * ```
 * # Process API CLI — Recipes & Workflow Guide
 * > Auto-generated from CLI schema.
 *
 * [Preamble: Why Use This, Quick Start, Session Types]
 * ---
 * ## Session Workflow Commands       ← from commandNarratives[0]
 *   ### overview                     ← from CommandNarrative entries
 *   ### scope-validate
 *   ...
 * ---
 * ## Pattern Discovery               ← from commandNarratives[1]
 *   ### status
 *   ### list
 *   ...
 * ---
 * ## Common Recipes                   ← from recipes[0]
 *   ### Starting a Session            ← from RecipeExample entries
 *   ### Finding What to Work On
 *   ...
 * ```
 *
 * ### Generator Architecture
 *
 * ```
 * CLI_SCHEMA.recipes           → buildRecipeSections()     → SectionBlock[]
 * CLI_SCHEMA.commandNarratives → buildNarrativeSections()  → SectionBlock[]
 * config.preamble              → prepended as-is           → SectionBlock[]
 *                                                          ↓
 *                              document() + renderToMarkdown()
 *                                                          ↓
 *                              OutputFile { path, content }
 * ```
 */

// Imports shown for design reference — actual paths resolve during implementation
// import type { DocumentGenerator, GeneratorContext, GeneratorOutput } from '../types.js';
// import { CLI_SCHEMA } from '../../cli/cli-schema.js';
// import type { RecipeGroup, CommandNarrativeGroup } from '../../cli/cli-schema.js';
// import type { SectionBlock } from '../../renderable/schema.js';
// import { heading, paragraph, code, separator, document } from '../../renderable/schema.js';
// import { renderToMarkdown } from '../../renderable/render.js';

import type { RecipeGroup, CommandNarrativeGroup } from './recipe-schema.js';

// =============================================================================
// Section Building — Recipes
// =============================================================================

/**
 * Transform a RecipeGroup into SectionBlock[].
 *
 * Each RecipeGroup becomes an H2 heading + optional description + recipe entries.
 * Each RecipeExample becomes an H3 heading + purpose paragraph + code block.
 * If expectedOutput is present, a separate "Example output" code block follows.
 */
function buildRecipeSections(_group: RecipeGroup): unknown[] {
  // Implementation transforms RecipeGroup → SectionBlock[] using block builders:
  //
  // sections.push(heading(2, group.title));
  // if (group.description) sections.push(paragraph(group.description));
  //
  // for (const recipe of group.recipes) {
  //   sections.push(heading(3, recipe.title));
  //   sections.push(paragraph(recipe.purpose));
  //
  //   // Build code block from steps:
  //   // "pnpm process:query -- overview   # project health"
  //   const codeContent = recipe.steps
  //     .map(s => s.comment ? `${s.command}   # ${s.comment}` : s.command)
  //     .join('\n');
  //   sections.push(code(codeContent, 'bash'));
  //
  //   if (recipe.expectedOutput) {
  //     sections.push(paragraph('Example output:'));
  //     sections.push(code(recipe.expectedOutput));
  //   }
  // }

  throw new Error('CliRecipeCodec not yet implemented - roadmap pattern');
}

// =============================================================================
// Section Building — Command Narratives
// =============================================================================

/**
 * Transform a CommandNarrativeGroup into SectionBlock[].
 *
 * Each group becomes an H2 heading + optional description.
 * Each CommandNarrative becomes an H3 heading (command name) + description
 * paragraph + usage example code block + optional details + optional output.
 */
function buildNarrativeSections(_group: CommandNarrativeGroup): unknown[] {
  // Implementation transforms CommandNarrativeGroup → SectionBlock[] using block builders:
  //
  // sections.push(heading(2, group.title));
  // if (group.description) sections.push(paragraph(group.description));
  //
  // for (const cmd of group.commands) {
  //   sections.push(heading(3, `\`${cmd.command}\``));
  //   sections.push(paragraph(cmd.description));
  //   sections.push(code(cmd.usageExample, 'bash'));
  //   if (cmd.details) sections.push(paragraph(cmd.details));
  //   if (cmd.expectedOutput) {
  //     sections.push(paragraph('Example output:'));
  //     sections.push(code(cmd.expectedOutput));
  //   }
  // }

  throw new Error('CliRecipeCodec not yet implemented - roadmap pattern');
}

// =============================================================================
// Document Assembly
// =============================================================================

/**
 * Build the complete recipe document from CLI schema and preamble.
 *
 * Assembly order:
 * 1. Auto-generation notice
 * 2. Preamble sections (Why Use This, Quick Start, Session Types)
 * 3. Command narrative sections (Session Workflow, Pattern Discovery, etc.)
 * 4. Recipe sections (Common Recipes)
 *
 * @param _preamble - Editorial SectionBlock[] from generator config
 */
function buildRecipeDocument(
  _preamble: readonly unknown[]
): string {
  // Implementation:
  //
  // const sections: SectionBlock[] = [];
  //
  // // 1. Auto-generation notice
  // sections.push(paragraph(
  //   '> Auto-generated from CLI schema. See [CLI Reference](./PROCESS-API-REFERENCE.md) for flag tables.'
  // ));
  //
  // // 2. Preamble (editorial prose)
  // if (preamble.length > 0) {
  //   sections.push(...preamble);
  //   sections.push(separator());
  // }
  //
  // // 3. Command narratives from schema
  // if (CLI_SCHEMA.commandNarratives) {
  //   for (const group of CLI_SCHEMA.commandNarratives) {
  //     sections.push(...buildNarrativeSections(group));
  //     sections.push(separator());
  //   }
  // }
  //
  // // 4. Recipes from schema
  // if (CLI_SCHEMA.recipes) {
  //   for (const group of CLI_SCHEMA.recipes) {
  //     sections.push(...buildRecipeSections(group));
  //     sections.push(separator());
  //   }
  // }
  //
  // const doc = document('Process API CLI - Recipes & Workflow Guide', sections);
  // return renderToMarkdown(doc);

  throw new Error('CliRecipeCodec not yet implemented - roadmap pattern');
}

// =============================================================================
// Generator Configuration
// =============================================================================

/**
 * Configuration for the CliRecipeGenerator.
 *
 * This is NOT a ReferenceDocConfig — this generator is standalone and does
 * not go through the reference codec pipeline. The config shape is minimal:
 * just preamble content and output path.
 */
export interface CliRecipeGeneratorConfig {
  /**
   * Static editorial sections prepended before all generated content.
   * Contains "Why Use This", Quick Start example, and session decision tree.
   * Configured in delivery-process.config.ts.
   */
  readonly preamble: readonly unknown[]; // SectionBlock[] — see src/renderable/schema.ts
}

// =============================================================================
// Generator Class
// =============================================================================

/**
 * Standalone generator producing PROCESS-API-RECIPES.md from CLI schema.
 *
 * Follows the same pattern as ProcessApiReferenceGenerator:
 * - Implements DocumentGenerator interface
 * - Consumes CLI_SCHEMA directly (no MasterDataset dependency)
 * - Returns OutputFile[] via standard orchestrator write path
 * - Registered in delivery-process.config.ts generatorOverrides
 *
 * Key difference from ProcessApiReferenceGenerator:
 * - ProcessApiReferenceGenerator reads CLIOptionGroup → produces flag tables
 * - CliRecipeGenerator reads RecipeGroup[] + CommandNarrativeGroup[] → produces recipes
 * - Both read from the same CLI_SCHEMA constant
 */
class CliRecipeGeneratorImpl {
  readonly name = 'cli-recipe';
  readonly description = 'Generate CLI recipe guide and command narratives from schema';

  private readonly config: CliRecipeGeneratorConfig;

  constructor(config: CliRecipeGeneratorConfig) {
    this.config = config;
  }

  generate(
    _patterns: readonly unknown[],
    _context: unknown
  ): Promise<{ files: readonly { path: string; content: string }[] }> {
    const content = buildRecipeDocument(this.config.preamble);

    return Promise.resolve({
      files: [
        {
          path: 'reference/PROCESS-API-RECIPES.md',
          content,
        },
      ],
    });
  }
}

/**
 * Factory function following the createXxxGenerator() convention.
 *
 * Called from delivery-process.config.ts or generator registration.
 * Receives preamble content from config.
 */
export function createCliRecipeGenerator(
  _config: CliRecipeGeneratorConfig
): unknown {
  // Returns DocumentGenerator from src/generators/types.ts
  throw new Error('CliRecipeCodec not yet implemented - roadmap pattern');
}

// =============================================================================
// Config Registration Example
// =============================================================================

/**
 * Registration follows the programmatic pattern from codec-generators.ts.
 * The generator is registered similarly to createProcessApiReferenceGenerator().
 *
 * Output directory override is set in delivery-process.config.ts:
 * ```typescript
 * generatorOverrides: {
 *   'cli-recipe': { outputDirectory: 'docs-live' },
 * }
 * ```
 */

// Exported only for design stub documentation purposes
export const _recipeExamples = { buildRecipeSections, buildNarrativeSections };
