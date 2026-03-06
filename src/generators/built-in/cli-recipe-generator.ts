/**
 * @libar-docs
 * @libar-docs-pattern CliRecipeGenerator
 * @libar-docs-implements CliRecipeCodec
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer application
 * @libar-docs-product-area:Generation
 *
 * ## Standalone Generator for CLI Recipes and Command Narratives
 *
 * Generates `PROCESS-API-RECIPES.md` from the declarative CLI schema.
 * Sibling to `ProcessApiReferenceGenerator` — both implement
 * `DocumentGenerator`, both consume `CLI_SCHEMA` directly, neither depends
 * on MasterDataset (ADR-006 compliant).
 *
 * ### When to Use
 *
 * - When generating workflow recipes and command narrative docs from CLI schema
 * - When extending CLI_SCHEMA with new recipe groups or command narratives
 */

import type { DocumentGenerator, GeneratorContext, GeneratorOutput } from '../types.js';
import { CLI_SCHEMA } from '../../cli/cli-schema.js';
import type { RecipeGroup, CommandNarrativeGroup } from '../../cli/cli-schema.js';
import { heading, paragraph, code, separator, document } from '../../renderable/schema.js';
import type { SectionBlock } from '../../renderable/schema.js';
import { renderToMarkdown } from '../../renderable/render.js';

// =============================================================================
// Section Building — Command Narratives
// =============================================================================

/**
 * Transform a CommandNarrativeGroup into SectionBlock[].
 *
 * Each group becomes an H2 heading + optional description.
 * Each CommandNarrative becomes an H3 heading (backtick-wrapped command name)
 * + description paragraph + usage example code block + optional details
 * + optional expected output code block.
 */
function buildNarrativeSections(group: CommandNarrativeGroup): SectionBlock[] {
  const sections: SectionBlock[] = [];

  sections.push(heading(2, group.title));
  if (group.description !== undefined) {
    sections.push(paragraph(group.description));
  }

  for (const cmd of group.commands) {
    sections.push(heading(3, `\`${cmd.command}\``));
    sections.push(paragraph(cmd.description));
    sections.push(code(cmd.usageExample, 'bash'));
    if (cmd.details !== undefined) {
      sections.push(paragraph(cmd.details));
    }
    if (cmd.expectedOutput !== undefined) {
      sections.push(paragraph('Example output:'));
      sections.push(code(cmd.expectedOutput));
    }
  }

  return sections;
}

// =============================================================================
// Section Building — Recipes
// =============================================================================

/**
 * Transform a RecipeGroup into SectionBlock[].
 *
 * Each RecipeGroup becomes an H2 heading + optional description + recipe entries.
 * Each RecipeExample becomes an H3 heading + purpose paragraph + code block
 * with all steps (each rendered as `command   # comment` or just `command`).
 * If expectedOutput is present, a separate output code block follows.
 */
function buildRecipeSections(group: RecipeGroup): SectionBlock[] {
  const sections: SectionBlock[] = [];

  sections.push(heading(2, group.title));
  if (group.description !== undefined) {
    sections.push(paragraph(group.description));
  }

  for (const recipe of group.recipes) {
    sections.push(heading(3, recipe.title));
    sections.push(paragraph(recipe.purpose));

    const codeContent = recipe.steps
      .map((s) => (s.comment !== undefined ? `${s.command}   # ${s.comment}` : s.command))
      .join('\n');
    sections.push(code(codeContent, 'bash'));

    if (recipe.expectedOutput !== undefined) {
      sections.push(paragraph('Expected output:'));
      sections.push(code(recipe.expectedOutput));
    }
  }

  return sections;
}

// =============================================================================
// Document Assembly
// =============================================================================

/**
 * Build the complete recipe document from CLI schema and preamble.
 *
 * Assembly order:
 * 1. Auto-generation notice
 * 2. Preamble sections (Why Use This, Quick Start, Session Types) + separator
 * 3. Command narrative sections from CLI_SCHEMA.commandNarratives (each group + separator)
 * 4. Recipe sections from CLI_SCHEMA.recipes (each group + separator)
 */
function buildRecipeDocument(preamble: readonly SectionBlock[]): string {
  const sections: SectionBlock[] = [];

  // 1. Auto-generation notice
  sections.push(
    paragraph(
      '> Auto-generated from CLI schema. See [CLI Reference](./PROCESS-API-REFERENCE.md) for flag tables.'
    )
  );

  // 2. Preamble (editorial prose)
  if (preamble.length > 0) {
    sections.push(...preamble);
    sections.push(separator());
  }

  // 3. Command narratives from schema
  if (CLI_SCHEMA.commandNarratives !== undefined) {
    for (const group of CLI_SCHEMA.commandNarratives) {
      sections.push(...buildNarrativeSections(group));
      sections.push(separator());
    }
  }

  // 4. Recipes from schema
  if (CLI_SCHEMA.recipes !== undefined) {
    for (const group of CLI_SCHEMA.recipes) {
      sections.push(...buildRecipeSections(group));
      sections.push(separator());
    }
  }

  const doc = document('Process API CLI \u2014 Recipes & Workflow Guide', sections);
  return renderToMarkdown(doc);
}

// =============================================================================
// Generator
// =============================================================================

class CliRecipeGeneratorImpl implements DocumentGenerator {
  readonly name = 'cli-recipe';
  readonly description = 'Generate CLI recipe guide and command narratives from schema';

  private readonly preamble: readonly SectionBlock[];

  constructor(preamble: readonly SectionBlock[]) {
    this.preamble = preamble;
  }

  generate(_patterns: readonly unknown[], _context: GeneratorContext): Promise<GeneratorOutput> {
    const content = buildRecipeDocument(this.preamble);

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
 * @param preamble - Editorial SectionBlock[] prepended before generated content
 * @returns DocumentGenerator instance
 */
export function createCliRecipeGenerator(preamble: readonly SectionBlock[]): DocumentGenerator {
  return new CliRecipeGeneratorImpl(preamble);
}
