/**
 * @architect
 * @architect-pattern CliReferenceGenerator
 * @architect-status completed
 * @architect-implements CliReferenceGeneration
 * @architect-arch-context generator
 * @architect-arch-layer application
 * @architect-product-area:Generation
 *
 * ## Standalone Generator for CLI Reference
 *
 * Generates `CLI-REFERENCE.md` from the declarative CLI schema.
 * Does NOT consume PatternGraph (ADR-006 compliant — CLI schema is static
 * TypeScript, not annotation-derived data).
 */

import type { DocumentGenerator, GeneratorContext, GeneratorOutput } from '../types.js';
import { CLI_SCHEMA } from '../../cli/cli-schema.js';
import type { CLIOptionDef, CLIOptionGroup } from '../../cli/cli-schema.js';
import { heading, paragraph, table, separator, document } from '../../renderable/schema.js';
import type { SectionBlock } from '../../renderable/schema.js';
import { renderToMarkdown } from '../../renderable/render.js';

// =============================================================================
// Section Building
// =============================================================================

function buildOptionSection(
  group: CLIOptionGroup,
  buildTable: (group: CLIOptionGroup) => {
    columns: string[];
    mapRow: (opt: CLIOptionDef) => string[];
  }
): SectionBlock[] {
  const sections: SectionBlock[] = [];
  sections.push(heading(2, group.title));
  if (group.description !== undefined) {
    sections.push(paragraph(group.description));
  }
  const { columns, mapRow } = buildTable(group);
  sections.push(table(columns, group.options.map(mapRow)));
  if (group.postNote !== undefined) {
    sections.push(paragraph(group.postNote));
  }
  return sections;
}

// =============================================================================
// Document Assembly
// =============================================================================

function buildReferenceDocument(): string {
  const sections: SectionBlock[] = [];

  sections.push(
    paragraph(
      '> Auto-generated from CLI schema. See [Pattern Graph CLI Guide](../../docs/PROCESS-API.md) for usage examples and recipes.'
    )
  );

  const fourCol = (): { columns: string[]; mapRow: (opt: CLIOptionDef) => string[] } => ({
    columns: ['Flag', 'Short', 'Description', 'Default'],
    mapRow: (opt) => [
      `\`${opt.flag}\``,
      opt.short !== undefined ? `\`${opt.short}\`` : '---',
      opt.description,
      opt.default ?? '---',
    ],
  });
  const twoCol = (
    g: CLIOptionGroup
  ): { columns: string[]; mapRow: (opt: CLIOptionDef) => string[] } => ({
    columns: [g.singularTitle ?? g.title, 'Description'],
    mapRow: (opt) => [`\`${opt.flag}\``, opt.description],
  });

  sections.push(...buildOptionSection(CLI_SCHEMA.globalOptions, fourCol));
  sections.push(separator());
  sections.push(...buildOptionSection(CLI_SCHEMA.outputModifiers, twoCol));
  sections.push(separator());
  sections.push(...buildOptionSection(CLI_SCHEMA.listFilters, twoCol));
  sections.push(separator());
  sections.push(...buildOptionSection(CLI_SCHEMA.sessionOptions, twoCol));

  const doc = document('Pattern Graph CLI Reference', sections);
  return renderToMarkdown(doc);
}

// =============================================================================
// Generator
// =============================================================================

class CliReferenceGeneratorImpl implements DocumentGenerator {
  readonly name = 'cli-reference';
  readonly description = 'Generate CLI reference tables from declarative schema';

  generate(_patterns: readonly unknown[], _context: GeneratorContext): Promise<GeneratorOutput> {
    const content = buildReferenceDocument();

    return Promise.resolve({
      files: [
        {
          path: 'reference/CLI-REFERENCE.md',
          content,
        },
      ],
    });
  }
}

export function createCliReferenceGenerator(): DocumentGenerator {
  return new CliReferenceGeneratorImpl();
}
