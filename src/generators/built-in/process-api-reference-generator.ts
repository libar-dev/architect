/**
 * @libar-docs
 * @libar-docs-pattern ProcessApiReferenceGenerator
 * @libar-docs-status completed
 * @libar-docs-implements ProcessApiHybridGeneration
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer application
 * @libar-docs-product-area:Generation
 *
 * ## Standalone Generator for Process API CLI Reference
 *
 * Generates `PROCESS-API-REFERENCE.md` from the declarative CLI schema.
 * Does NOT consume MasterDataset (ADR-006 compliant — CLI schema is static
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
      '> Auto-generated from CLI schema. See [Process API Guide](../../docs/PROCESS-API.md) for usage examples and recipes.'
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

  const doc = document('Process API CLI Reference', sections);
  return renderToMarkdown(doc);
}

// =============================================================================
// Generator
// =============================================================================

class ProcessApiReferenceGeneratorImpl implements DocumentGenerator {
  readonly name = 'process-api-reference';
  readonly description = 'Generate CLI reference tables from declarative schema';

  generate(_patterns: readonly unknown[], _context: GeneratorContext): Promise<GeneratorOutput> {
    const content = buildReferenceDocument();

    return Promise.resolve({
      files: [
        {
          path: 'reference/PROCESS-API-REFERENCE.md',
          content,
        },
      ],
    });
  }
}

export function createProcessApiReferenceGenerator(): DocumentGenerator {
  return new ProcessApiReferenceGeneratorImpl();
}
