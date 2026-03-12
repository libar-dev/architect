/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern DesignReviewCodec
 * @libar-docs-status active
 * @libar-docs-implements DesignReviewGeneration
 * @libar-docs-arch-role projection
 * @libar-docs-arch-context renderer
 * @libar-docs-arch-layer application
 * @libar-docs-include codec-transformation
 * @libar-docs-uses MasterDataset, SequenceIndex, MermaidDiagramUtils
 * @libar-docs-convention codec-registry
 * @libar-docs-product-area:Generation
 *
 * ## DesignReviewCodec
 *
 * Transforms MasterDataset into a RenderableDocument containing design review
 * artifacts: sequence diagrams, component diagrams, type definition tables,
 * and design question templates.
 *
 * **Purpose:** Auto-generate design review documents from sequence annotations
 * on Gherkin specs. Diagrams stay synchronized with spec changes.
 *
 * **Output Files:** `delivery-process/design-reviews/{pattern-name}.md`
 *
 * ### Factory Pattern
 *
 * ```typescript
 * const codec = createDesignReviewCodec({ patternName: 'SetupCommand' });
 * const doc = codec.decode(dataset);
 * ```
 */

import { z } from 'zod';
import {
  MasterDatasetSchema,
  type MasterDataset,
  type SequenceIndexEntry,
  type SequenceStep,
} from '../../validation-schemas/master-dataset.js';
import type { ExtractedPattern } from '../../validation-schemas/index.js';
import {
  type RenderableDocument,
  type SectionBlock,
  heading,
  paragraph,
  separator,
  table,
  mermaid,
  document,
} from '../schema.js';
import { getPatternName, findPatternByName } from '../../api/pattern-helpers.js';
import { type BaseCodecOptions, DEFAULT_BASE_OPTIONS, mergeOptions } from './types/base.js';
import { RenderableDocumentOutputSchema } from './shared-schema.js';
import { sanitizeNodeId } from './diagram-utils.js';

// ═══════════════════════════════════════════════════════════════════════════
// Design Review Codec Options
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Options for DesignReviewCodec
 */
export interface DesignReviewCodecOptions extends BaseCodecOptions {
  /** Pattern name to generate the design review for (required) */
  patternName: string;

  /** Include the annotation convention section (default: true) */
  includeAnnotationConvention?: boolean;

  /** Include the component diagram (default: true) */
  includeComponentDiagram?: boolean;
}

/**
 * Default options for DesignReviewCodec
 */
const DEFAULT_DESIGN_REVIEW_OPTIONS: Required<DesignReviewCodecOptions> = {
  ...DEFAULT_BASE_OPTIONS,
  patternName: '',
  includeAnnotationConvention: true,
  includeComponentDiagram: true,
};

// ═══════════════════════════════════════════════════════════════════════════
// Design Review Document Codec
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a DesignReviewCodec with the given options.
 *
 * @param options - Codec configuration (patternName is required)
 * @returns Configured Zod codec that transforms MasterDataset → RenderableDocument
 */
export function createDesignReviewCodec(
  options: DesignReviewCodecOptions
): z.ZodCodec<typeof MasterDatasetSchema, typeof RenderableDocumentOutputSchema> {
  const opts = mergeOptions(DEFAULT_DESIGN_REVIEW_OPTIONS, options);

  return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
    decode: (dataset: MasterDataset): RenderableDocument => {
      return buildDesignReviewDocument(dataset, opts);
    },
    /** @throws Always - this codec is decode-only. See zod-codecs.md */
    encode: (): never => {
      throw new Error('DesignReviewCodec is decode-only. See zod-codecs.md');
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Document Builder
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build the design review document from dataset
 */
function buildDesignReviewDocument(
  dataset: MasterDataset,
  options: Required<DesignReviewCodecOptions>
): RenderableDocument {
  const { patternName } = options;

  // Find the pattern and its sequence index entry
  const pattern = findPatternByName(dataset.patterns, patternName);
  if (!pattern) {
    return document(`Design Review: ${patternName}`, [
      heading(2, 'Pattern Not Found'),
      paragraph(`Pattern "${patternName}" not found in dataset.`),
    ]);
  }

  const entry = dataset.sequenceIndex?.[getPatternName(pattern)];
  if (!entry) {
    return document(`Design Review: ${patternName}`, [
      heading(2, 'No Sequence Data'),
      paragraph(
        `Pattern "${patternName}" has no sequence annotations. ` +
          'Add `@libar-docs-sequence-orchestrator` and `@libar-docs-sequence-step` ' +
          'tags to generate design review diagrams.'
      ),
    ]);
  }

  const sections: SectionBlock[] = [];
  const displayName = getPatternName(pattern);

  // Header metadata
  sections.push(...buildHeaderSection(pattern, entry));

  // Annotation Convention (optional)
  if (options.includeAnnotationConvention) {
    sections.push(separator());
    sections.push(...buildAnnotationConventionSection());
  }

  // Sequence Diagram
  sections.push(separator());
  sections.push(...buildSequenceDiagramSection(entry, pattern));

  // Component Diagram (optional)
  if (options.includeComponentDiagram) {
    sections.push(separator());
    sections.push(...buildComponentDiagramSection(entry, pattern));
  }

  // Key Type Definitions
  sections.push(separator());
  sections.push(...buildTypeDefinitionsSection(entry));

  // Design Questions (template with auto metrics)
  sections.push(separator());
  sections.push(...buildDesignQuestionsSection(entry));

  // Findings (placeholder)
  sections.push(separator());
  sections.push(...buildFindingsSection());

  // Summary
  sections.push(separator());
  sections.push(...buildSummarySection(entry, displayName));

  return document(`Design Review: ${displayName}`, sections, {
    purpose: 'Auto-generated design review with sequence and component diagrams',
    detailLevel: 'Design review artifact from sequence annotations',
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Section Builders
// ═══════════════════════════════════════════════════════════════════════════

function buildHeaderSection(pattern: ExtractedPattern, entry: SequenceIndexEntry): SectionBlock[] {
  const name = getPatternName(pattern);
  const phase = pattern.phase !== undefined ? `Phase ${String(pattern.phase)}` : 'N/A';
  const status = pattern.status ?? 'unknown';

  return [
    paragraph(
      `**Pattern:** ${name} | **Phase:** ${phase} | **Status:** ${status} | ` +
        `**Orchestrator:** ${entry.orchestrator} | **Steps:** ${String(entry.steps.length)} | ` +
        `**Participants:** ${String(entry.participants.length)}`
    ),
    paragraph(`**Source:** \`${pattern.source.file}\``),
  ];
}

function buildAnnotationConventionSection(): SectionBlock[] {
  return [
    heading(2, 'Annotation Convention'),
    paragraph('This design review is generated from the following annotations:'),
    table(
      ['Tag', 'Level', 'Format', 'Purpose'],
      [
        ['sequence-orchestrator', 'Feature', 'value', 'Identifies the coordinator module'],
        ['sequence-step', 'Rule', 'number', 'Explicit execution ordering'],
        ['sequence-module', 'Rule', 'csv', 'Maps Rule to deliverable module(s)'],
        ['sequence-error', 'Scenario', 'flag', 'Marks scenario as error/alt path'],
      ]
    ),
    paragraph(
      'Description markers: `**Input:**` and `**Output:**` in Rule descriptions ' +
        'define data flow types for sequence diagram call arrows and component diagram edges.'
    ),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// Sequence Diagram Builder
// ═══════════════════════════════════════════════════════════════════════════

function buildSequenceDiagramSection(
  entry: SequenceIndexEntry,
  pattern: ExtractedPattern
): SectionBlock[] {
  const lines = generateSequenceDiagram(entry, pattern);
  return [
    heading(2, 'Sequence Diagram — Runtime Interaction Flow'),
    paragraph(
      'Generated from: `@libar-docs-sequence-step`, `@libar-docs-sequence-module`, ' +
        '`@libar-docs-sequence-error`, `**Input:**`/`**Output:**` markers, and ' +
        '`@libar-docs-sequence-orchestrator` on the Feature.'
    ),
    mermaid(lines.join('\n')),
  ];
}

function generateSequenceDiagram(entry: SequenceIndexEntry, pattern: ExtractedPattern): string[] {
  const lines: string[] = ['sequenceDiagram'];

  // Participant declarations
  lines.push('    participant User');
  const orchId = sanitizeNodeId(entry.orchestrator);
  const orchLabel = resolveModuleLabel(entry.orchestrator, pattern);
  lines.push(`    participant ${orchId} as ${quoteMermaidText(orchLabel)}`);

  for (const mod of entry.participants) {
    if (mod === entry.orchestrator) continue;
    const modId = sanitizeNodeId(mod);
    const modLabel = resolveModuleLabel(mod, pattern);
    lines.push(`    participant ${modId} as ${quoteMermaidText(modLabel)}`);
  }

  lines.push('');

  // User → orchestrator initial call
  lines.push(`    User->>${orchId}: invoke`);
  lines.push('');

  // Steps
  for (const step of entry.steps) {
    // Note block for rule
    lines.push(
      `    Note over ${orchId}: Rule ${String(step.stepNumber)} — ${sanitizeMermaidRawText(step.ruleName)}`
    );
    lines.push('');

    // Call from orchestrator to each module
    for (const mod of step.modules) {
      const modId = sanitizeNodeId(mod);
      const inputLabel = sanitizeMermaidRawText(extractTypeName(step.input) || step.ruleName);
      const outputLabel = sanitizeMermaidRawText(extractTypeName(step.output) || 'result');

      lines.push(`    ${orchId}->>+${modId}: ${inputLabel}`);
      lines.push(`    ${modId}-->>-${orchId}: ${outputLabel}`);
    }

    // Alt blocks for error scenarios
    if (step.errorScenarios.length > 0) {
      for (const errScenario of step.errorScenarios) {
        lines.push('');
        lines.push(`    alt ${sanitizeMermaidRawText(errScenario)}`);
        lines.push(`        ${orchId}-->>User: error`);
        lines.push(`        ${orchId}->>${orchId}: exit(1)`);
        lines.push('    end');
      }
    }

    lines.push('');
  }

  return lines;
}

// ═══════════════════════════════════════════════════════════════════════════
// Component Diagram Builder
// ═══════════════════════════════════════════════════════════════════════════

function buildComponentDiagramSection(
  entry: SequenceIndexEntry,
  pattern: ExtractedPattern
): SectionBlock[] {
  const lines = generateComponentDiagram(entry, pattern);
  return [
    heading(2, 'Component Diagram — Types and Data Flow'),
    paragraph(
      'Generated from: `@libar-docs-sequence-module` (nodes), `**Input:**`/`**Output:**` ' +
        '(edges and type shapes), deliverables table (locations), and `sequence-step` (grouping).'
    ),
    mermaid(lines.join('\n')),
  ];
}

function generateComponentDiagram(entry: SequenceIndexEntry, pattern: ExtractedPattern): string[] {
  const lines: string[] = ['graph LR'];

  // Group steps into phases by shared input type
  const phases = groupStepsByInputType(entry.steps);

  // Render phase subgraphs (use phase_N prefix for unique IDs)
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    if (!phase) continue;
    const phaseId = `phase_${String(i + 1)}`;
    lines.push(
      `    subgraph ${phaseId}[${quoteMermaidText(`Phase ${String(i + 1)}: ${phase.label}`)}]`
    );
    for (const mod of phase.modules) {
      const modId = sanitizeNodeId(mod);
      const modLabel = resolveModuleLabel(mod, pattern);
      lines.push(`        ${modId}[${quoteMermaidText(modLabel)}]`);
    }
    lines.push('    end');
    lines.push('');
  }

  // Orchestrator subgraph
  const orchId = sanitizeNodeId(entry.orchestrator);
  const orchLabel = resolveModuleLabel(entry.orchestrator, pattern);
  lines.push(`    subgraph orchestrator[${quoteMermaidText('Orchestrator')}]`);
  lines.push(`        ${orchId}[${quoteMermaidText(orchLabel)}]`);
  lines.push('    end');
  lines.push('');

  // Type nodes (hexagon shape) for types with field definitions
  const typeDefs = collectTypeDefs(entry.steps);
  if (typeDefs.length > 0) {
    lines.push(`    subgraph types[${quoteMermaidText('Key Types')}]`);
    for (const typeDef of typeDefs) {
      const typeId = sanitizeNodeId(typeDef.name);
      if (typeDef.fields) {
        // Convert comma-separated fields to newline-separated for hexagon node display
        const hexFields = typeDef.fields
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean)
          .join('\n');
        lines.push(
          `        ${typeId}{{${quoteMermaidText(`${typeDef.name}\n-----------\n${hexFields}`, {
            preserveLineBreaks: true,
          })}}}`
        );
      } else {
        lines.push(`        ${typeId}{{${quoteMermaidText(typeDef.name)}}}`);
      }
    }
    lines.push('    end');
    lines.push('');
  }

  // Edges: module outputs → orchestrator (only for proper types with -- field separator)
  for (const step of entry.steps) {
    if (step.output?.includes('--') !== true) continue;
    const outputType = extractTypeName(step.output);
    for (const mod of step.modules) {
      const modId = sanitizeNodeId(mod);
      lines.push(`    ${modId} -->|${quoteMermaidText(outputType)}| ${orchId}`);
    }
  }

  // Orchestrator dispatches to steps that take an input
  for (const step of entry.steps) {
    const inputType = extractTypeName(step.input);
    if (!inputType) continue;
    for (const mod of step.modules) {
      const modId = sanitizeNodeId(mod);
      lines.push(`    ${orchId} -->|${quoteMermaidText(inputType)}| ${modId}`);
    }
  }

  return lines;
}

// ═══════════════════════════════════════════════════════════════════════════
// Type Definitions Section
// ═══════════════════════════════════════════════════════════════════════════

function buildTypeDefinitionsSection(entry: SequenceIndexEntry): SectionBlock[] {
  const typeDefs = collectTypeDefs(entry.steps);

  if (typeDefs.length === 0) {
    return [
      heading(2, 'Key Type Definitions'),
      paragraph('No structured types found in Output annotations.'),
    ];
  }

  const rows: string[][] = [];
  for (const typeDef of typeDefs) {
    const producedBy = findProducers(entry.steps, typeDef.name);
    const consumedBy = findConsumers(entry.steps, typeDef.name);
    rows.push([
      `\`${typeDef.name}\``,
      typeDef.fields ?? '—',
      producedBy.join(', '),
      consumedBy.join(', '),
    ]);
  }

  return [
    heading(2, 'Key Type Definitions'),
    table(['Type', 'Fields', 'Produced By', 'Consumed By'], rows),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// Design Questions (template with auto metrics)
// ═══════════════════════════════════════════════════════════════════════════

function buildDesignQuestionsSection(entry: SequenceIndexEntry): SectionBlock[] {
  const stepCount = entry.steps.length;
  const typeCount = collectTypeDefs(entry.steps).length;
  const errorCount = entry.errorPaths.length;

  return [
    heading(2, 'Design Questions'),
    paragraph('Verify these design properties against the diagrams above:'),
    table(
      ['#', 'Question', 'Auto-Check', 'Diagram'],
      [
        [
          'DQ-1',
          'Is the execution ordering correct?',
          `${String(stepCount)} steps in monotonic order`,
          'Sequence',
        ],
        [
          'DQ-2',
          'Are all interfaces well-defined?',
          `${String(typeCount)} distinct types across ${String(stepCount)} steps`,
          'Component',
        ],
        [
          'DQ-3',
          'Is error handling complete?',
          `${String(errorCount)} error paths identified`,
          'Sequence',
        ],
        ['DQ-4', 'Is data flow unidirectional?', 'Review component diagram edges', 'Component'],
        ['DQ-5', 'Does validation prove the full path?', 'Review final step', 'Both'],
      ]
    ),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// Findings (placeholder for human review)
// ═══════════════════════════════════════════════════════════════════════════

function buildFindingsSection(): SectionBlock[] {
  return [
    heading(2, 'Findings'),
    paragraph(
      'Record design observations from reviewing the diagrams above. ' +
        'Each finding should reference which diagram revealed it and its impact on the spec.'
    ),
    table(
      ['#', 'Finding', 'Diagram Source', 'Impact on Spec'],
      [['F-1', '(Review the diagrams and add findings here)', '—', '—']]
    ),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════

function buildSummarySection(entry: SequenceIndexEntry, displayName: string): SectionBlock[] {
  const stepCount = entry.steps.length;
  const participantCount = entry.participants.length;
  const typeCount = collectTypeDefs(entry.steps).length;
  const errorCount = entry.errorPaths.length;

  return [
    heading(2, 'Summary'),
    paragraph(
      `The ${displayName} design review covers ${String(stepCount)} sequential steps across ` +
        `${String(participantCount)} participants with ${String(typeCount)} key data types ` +
        `and ${String(errorCount)} error paths.`
    ),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// Shared Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sanitize Mermaid text in raw positions such as notes, alt conditions, and
 * sequence message labels where the text is not wrapped in quotes.
 */
function sanitizeMermaidRawText(text: string): string {
  return text
    .replace(/\r?\n/g, ' ')
    .replace(/%%/g, '% %')
    .replace(/\|/g, '&#124;')
    .replace(/"/g, '&quot;')
    .replace(/>>/g, '> >')
    .replace(/--/g, '\u2014')
    .trim();
}

interface MermaidTextOptions {
  readonly preserveLineBreaks?: boolean;
}

/**
 * Quote Mermaid text for label positions that already use Mermaid string syntax.
 */
function quoteMermaidText(text: string, options: MermaidTextOptions = {}): string {
  const { preserveLineBreaks = false } = options;
  const escapedBackslashes = text.replace(/\\/g, '\\\\');
  const normalized = preserveLineBreaks
    ? escapedBackslashes.replace(/\r?\n/g, '\\n')
    : escapedBackslashes.replace(/\r?\n/g, ' ');

  return `"${normalized
    .replace(/%%/g, '% %')
    .replace(/\|/g, '&#124;')
    .replace(/"/g, '&quot;')
    .trim()}"`;
}

/**
 * Extract the type name from an Input or Output annotation string.
 * Format: "TypeName -- field1, field2" → "TypeName"
 * Or just: "some description" → "some description"
 * Returns empty string for undefined.
 */
function extractTypeName(annotation: string | undefined): string {
  if (!annotation) return '';
  const dashIndex = annotation.indexOf('--');
  if (dashIndex >= 0) {
    return annotation.slice(0, dashIndex).trim();
  }
  return annotation.trim();
}

/**
 * Resolve a module ID to a display label.
 * Checks deliverables table for Location basenames, falls back to module ID + .ts.
 */
function resolveModuleLabel(moduleId: string, pattern: ExtractedPattern): string {
  if (pattern.deliverables) {
    for (const d of pattern.deliverables) {
      const basename =
        d.location
          .split('/')
          .pop()
          ?.replace(/\.[^.]+$/, '') ?? '';
      if (basename === moduleId) {
        return d.location.split('/').pop() ?? `${moduleId}.ts`;
      }
    }
  }
  return `${moduleId}.ts`;
}

/** TypeDef extracted from Output annotations */
interface TypeDef {
  readonly name: string;
  readonly fields: string | undefined;
}

/**
 * Collect distinct type definitions from Output annotations.
 * Only includes annotations with the "TypeName -- fields" format.
 */
function collectTypeDefs(steps: readonly SequenceStep[]): TypeDef[] {
  const seen = new Set<string>();
  const defs: TypeDef[] = [];

  for (const step of steps) {
    if (!step.output) continue;
    const dashIndex = step.output.indexOf('--');
    if (dashIndex < 0) continue; // Skip description-style outputs

    const name = step.output.slice(0, dashIndex).trim();
    if (seen.has(name)) continue;
    seen.add(name);

    const rawFields = step.output.slice(dashIndex + 2).trim();
    defs.push({ name, fields: rawFields.length > 0 ? rawFields : undefined });
  }

  return defs;
}

/** Find which modules produce a given type (by Output annotation) */
function findProducers(steps: readonly SequenceStep[], typeName: string): string[] {
  const producers: string[] = [];
  for (const step of steps) {
    if (step.output && extractTypeName(step.output) === typeName) {
      producers.push(...step.modules);
    }
  }
  return producers;
}

/** Find which modules consume a given type (by Input annotation) */
function findConsumers(steps: readonly SequenceStep[], typeName: string): string[] {
  const consumers: string[] = [];
  for (const step of steps) {
    if (step.input && extractTypeName(step.input) === typeName) {
      consumers.push(...step.modules);
    }
  }
  return consumers;
}

/** Phase grouping for component diagram */
interface PhaseGroup {
  readonly label: string;
  readonly modules: string[];
}

/**
 * Group contiguous steps by shared Input type into phases.
 * Only adjacent steps with the same Input type are grouped together.
 * Non-contiguous steps with the same input type become separate phases.
 */
function groupStepsByInputType(steps: readonly SequenceStep[]): PhaseGroup[] {
  const phases: PhaseGroup[] = [];

  for (const step of steps) {
    const inputType = extractTypeName(step.input) || `Step ${String(step.stepNumber)}`;
    const lastPhase = phases[phases.length - 1];

    // Only merge into the previous phase if it has the same input type (contiguous grouping)
    if (lastPhase?.label === inputType) {
      lastPhase.modules.push(...step.modules);
    } else {
      phases.push({ label: inputType, modules: [...step.modules] });
    }
  }

  return phases;
}
