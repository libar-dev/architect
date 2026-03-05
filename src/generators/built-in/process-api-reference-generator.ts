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

// =============================================================================
// Table Rendering
// =============================================================================

function renderGlobalOptionsTable(options: readonly CLIOptionDef[]): string {
  const header = '| Flag | Short | Description | Default |';
  const separator = '| --- | --- | --- | --- |';
  const rows = options.map((opt) => {
    const flag = `\`${opt.flag}\``;
    const short = opt.short !== undefined ? `\`${opt.short}\`` : '---';
    const def = opt.default ?? '---';
    return `| ${flag} | ${short} | ${opt.description} | ${def} |`;
  });
  return [header, separator, ...rows].join('\n');
}

function renderTwoColumnTable(
  col1: string,
  col2: string,
  options: readonly CLIOptionDef[]
): string {
  const header = `| ${col1} | ${col2} |`;
  const separator = '| --- | --- |';
  const rows = options.map((opt) => {
    const flag = `\`${opt.flag}\``;
    return `| ${flag} | ${opt.description} |`;
  });
  return [header, separator, ...rows].join('\n');
}

// =============================================================================
// Section Rendering
// =============================================================================

function renderSection(group: CLIOptionGroup, tableType: 'global' | 'two-column'): string {
  const parts: string[] = [];

  parts.push(`## ${group.title}`);
  parts.push('');

  if (group.description !== undefined) {
    parts.push(group.description);
    parts.push('');
  }

  if (tableType === 'global') {
    parts.push(renderGlobalOptionsTable(group.options));
  } else {
    parts.push(renderTwoColumnTable(group.singularTitle ?? group.title, 'Description', group.options));
  }
  parts.push('');

  if (group.postNote !== undefined) {
    parts.push(group.postNote);
    parts.push('');
  }

  return parts.join('\n');
}

// =============================================================================
// Document Assembly
// =============================================================================

function generateReferenceDocument(): string {
  const parts: string[] = [];

  parts.push('# Process API CLI Reference');
  parts.push('');
  parts.push(
    '> Auto-generated from CLI schema. See [Process API Guide](../../docs/PROCESS-API.md) for usage examples and recipes.'
  );
  parts.push('');

  parts.push(renderSection(CLI_SCHEMA.globalOptions, 'global'));
  parts.push('---');
  parts.push('');
  parts.push(renderSection(CLI_SCHEMA.outputModifiers, 'two-column'));
  parts.push('---');
  parts.push('');
  parts.push(renderSection(CLI_SCHEMA.listFilters, 'two-column'));

  return parts.join('\n');
}

// =============================================================================
// Generator
// =============================================================================

class ProcessApiReferenceGeneratorImpl implements DocumentGenerator {
  readonly name = 'process-api-reference';
  readonly description = 'Generate CLI reference tables from declarative schema';

  generate(_patterns: readonly unknown[], _context: GeneratorContext): Promise<GeneratorOutput> {
    const content = generateReferenceDocument();

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
