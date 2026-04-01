/**
 * @architect
 * @architect-core
 * @architect-pattern IndexCodec
 * @architect-status completed
 * @architect-unlock-reason:Add-createDecodeOnlyCodec-helper
 * @architect-convention codec-registry
 * @architect-product-area:Generation
 * @architect-implements EnhancedIndexGeneration
 *
 * ## IndexCodec
 *
 * **Purpose:** Navigation hub composing editorial preamble with MasterDataset statistics.
 *
 * **Output Files:** `INDEX.md` (single page, no detail files)
 *
 * | Option | Type | Default | Description |
 * | --- | --- | --- | --- |
 * | preamble | SectionBlock[] | [] | Editorial sections (reading paths, document roles, key concepts) |
 * | documentEntries | DocumentEntry[] | [] | Static document inventory entries |
 * | includeProductAreaStats | boolean | true | Product area statistics table |
 * | includePhaseProgress | boolean | true | Phase progress summary |
 * | includeDocumentInventory | boolean | true | Unified document inventory |
 * | includePackageMetadata | boolean | true | Package metadata header |
 *
 * ### Design Decisions
 *
 * - DD-1: New IndexCodec in CodecRegistry (not a ReferenceDocConfig entry)
 * - DD-2: Document entries configured statically, not filesystem discovery
 * - DD-3: Audience reading paths are full preamble (editorial judgment)
 * - DD-4: Key concepts glossary uses preamble
 * - DD-5: Standalone codec, not routed through reference codec pipeline
 */

import type { MasterDataset } from '../../validation-schemas/master-dataset.js';
import {
  type RenderableDocument,
  type SectionBlock,
  heading,
  paragraph,
  separator,
  table,
  document,
  code,
} from '../schema.js';
import { computeStatusCounts, completionPercentage, renderProgressBar } from '../utils.js';
import {
  type BaseCodecOptions,
  type CodecContext,
  type DocumentCodec,
  DEFAULT_BASE_OPTIONS,
  mergeOptions,
  createDecodeOnlyCodec,
} from './types/base.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A document entry for the unified inventory.
 * Describes a single document in the navigation index.
 */
export interface DocumentEntry {
  readonly title: string;
  readonly path: string;
  readonly description: string;
  readonly audience: string;
  readonly topic: string;
}

/**
 * Options for the IndexCodec.
 */
export interface IndexCodecOptions extends BaseCodecOptions {
  /** Editorial preamble sections prepended before generated content */
  readonly preamble?: readonly SectionBlock[];
  /** Product area statistics table (default: true) */
  readonly includeProductAreaStats?: boolean;
  /** Phase progress summary (default: true) */
  readonly includePhaseProgress?: boolean;
  /** Unified document inventory table (default: true) */
  readonly includeDocumentInventory?: boolean;
  /** Package metadata header (default: true) */
  readonly includePackageMetadata?: boolean;
  /** Document entries for the unified inventory */
  readonly documentEntries?: readonly DocumentEntry[];
  /** Override the document purpose text (default: auto-generated from project name) */
  readonly purposeText?: string;
  /** Custom footer sections replacing the regeneration commands (default: []) */
  readonly epilogue?: readonly SectionBlock[];
  /** Override individual metadata table values */
  readonly packageMetadataOverrides?: Partial<Record<'name' | 'purpose' | 'license', string>>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Defaults
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_INDEX_OPTIONS: Required<IndexCodecOptions> = {
  ...DEFAULT_BASE_OPTIONS,
  generateDetailFiles: false,
  preamble: [],
  includeProductAreaStats: true,
  includePhaseProgress: true,
  includeDocumentInventory: true,
  includePackageMetadata: true,
  documentEntries: [],
  purposeText: '',
  epilogue: [],
  packageMetadataOverrides: {},
};

// ═══════════════════════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create an IndexCodec with custom options.
 *
 * DD-1: Registered in CodecRegistry as document type 'index'.
 * DD-5: Standalone codec, not a ReferenceDocConfig entry.
 */
export function createIndexCodec(options?: IndexCodecOptions): DocumentCodec {
  const opts = mergeOptions(DEFAULT_INDEX_OPTIONS, options);

  return createDecodeOnlyCodec((context) => buildIndexDocument(context, opts));
}

export const IndexCodec = createIndexCodec();

export const codecMeta = {
  type: 'index',
  outputPath: 'INDEX.md',
  description: 'Navigation hub with editorial preamble and MasterDataset statistics',
  factory: createIndexCodec,
  defaultInstance: IndexCodec,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Document Builder
// ═══════════════════════════════════════════════════════════════════════════

function buildIndexDocument(
  context: CodecContext,
  options: Required<IndexCodecOptions>
): RenderableDocument {
  const { dataset } = context;
  const sections: SectionBlock[] = [];

  // 1. Package metadata header
  if (options.includePackageMetadata) {
    sections.push(...buildPackageMetadata(context, options));
    sections.push(separator());
  }

  // 2. Preamble (editorial: quick nav, reading paths, document roles, key concepts)
  if (options.preamble.length > 0) {
    sections.push(...options.preamble);
    sections.push(separator());
  }

  // 3. Unified document inventory
  if (options.includeDocumentInventory && options.documentEntries.length > 0) {
    sections.push(...buildDocumentInventory(options.documentEntries));
    sections.push(separator());
  }

  // 4. Product area statistics
  if (options.includeProductAreaStats) {
    sections.push(...buildProductAreaStats(dataset));
    sections.push(separator());
  }

  // 5. Phase progress summary
  if (options.includePhaseProgress) {
    sections.push(...buildPhaseProgress(dataset));
    sections.push(separator());
  }

  // 6. Footer: epilogue > projectMetadata.regeneration > built-in default
  if (options.epilogue.length > 0) {
    sections.push(...options.epilogue);
  } else {
    sections.push(...buildRegenerationFooter(context));
  }

  const packageName = context.projectMetadata?.name ?? '@libar-dev/architect';
  const defaultPurpose =
    `Navigate the full documentation set for ${packageName}. ` +
    'Use section links for targeted reading.';
  const purpose = options.purposeText || defaultPurpose;

  return document('Documentation Index', sections, { purpose });
}

// ═══════════════════════════════════════════════════════════════════════════
// Section Builders
// ═══════════════════════════════════════════════════════════════════════════

function buildPackageMetadata(
  context: CodecContext,
  options: Required<IndexCodecOptions>
): SectionBlock[] {
  const { dataset } = context;
  const meta = context.projectMetadata;
  const overrides = options.packageMetadataOverrides;
  const totalPatterns = dataset.patterns.length;
  const counts = computeStatusCounts(dataset.patterns);

  const name = overrides.name ?? meta?.name ?? '@libar-dev/architect';
  const purpose =
    overrides.purpose ?? meta?.purpose ?? 'Context engineering platform for AI-assisted codebases';
  const license = overrides.license ?? meta?.license ?? 'MIT';

  return [
    heading(2, 'Package Metadata'),
    table(
      ['Field', 'Value'],
      [
        ['**Package**', name],
        ['**Purpose**', purpose],
        [
          '**Patterns**',
          `${totalPatterns} tracked (${counts.completed} completed, ${counts.active} active, ${counts.planned} planned)`,
        ],
        ['**Product Areas**', `${Object.keys(dataset.byProductArea).length}`],
        ['**License**', license],
      ]
    ),
  ];
}

/**
 * DD-2: Static config, not filesystem discovery.
 * Groups entries by topic, renders each group as a table.
 */
function buildDocumentInventory(entries: readonly DocumentEntry[]): SectionBlock[] {
  const sections: SectionBlock[] = [heading(2, 'Document Inventory')];

  // Group by topic
  const byTopic = new Map<string, DocumentEntry[]>();
  for (const entry of entries) {
    const group = byTopic.get(entry.topic) ?? [];
    group.push(entry);
    byTopic.set(entry.topic, group);
  }

  for (const [topic, topicEntries] of byTopic) {
    sections.push(heading(3, topic));
    sections.push(
      table(
        ['Document', 'Description', 'Audience'],
        topicEntries.map((e) => [`[${e.title}](${e.path})`, e.description, e.audience])
      )
    );
  }

  return sections;
}

function buildProductAreaStats(dataset: MasterDataset): SectionBlock[] {
  const sections: SectionBlock[] = [heading(2, 'Product Area Statistics')];

  const rows: string[][] = [];
  let totalCompleted = 0;
  let totalActive = 0;
  let totalPlanned = 0;
  let totalAll = 0;

  // Sort product areas alphabetically
  const sortedAreas = Object.entries(dataset.byProductArea).sort(([a], [b]) => a.localeCompare(b));

  for (const [area, patterns] of sortedAreas) {
    const counts = computeStatusCounts(patterns);
    const pct = completionPercentage(counts);
    rows.push([
      area,
      String(counts.total),
      String(counts.completed),
      String(counts.active),
      String(counts.planned),
      `${renderProgressBar(counts.completed, counts.total, 8)} ${pct}%`,
    ]);
    totalCompleted += counts.completed;
    totalActive += counts.active;
    totalPlanned += counts.planned;
    totalAll += counts.total;
  }

  const totalPct = totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0;
  rows.push([
    '**Total**',
    `**${totalAll}**`,
    `**${totalCompleted}**`,
    `**${totalActive}**`,
    `**${totalPlanned}**`,
    `**${renderProgressBar(totalCompleted, totalAll, 8)} ${totalPct}%**`,
  ]);

  sections.push(table(['Area', 'Patterns', 'Completed', 'Active', 'Planned', 'Progress'], rows));

  return sections;
}

function buildPhaseProgress(dataset: MasterDataset): SectionBlock[] {
  const sections: SectionBlock[] = [heading(2, 'Phase Progress')];

  const counts = computeStatusCounts(dataset.patterns);
  const pct = completionPercentage(counts);

  sections.push(
    paragraph(
      `**${counts.total}** patterns total: ` +
        `**${counts.completed}** completed (${pct}%), ` +
        `**${counts.active}** active, ` +
        `**${counts.planned}** planned. ` +
        renderProgressBar(counts.completed, counts.total, 20)
    )
  );

  // Status distribution table
  sections.push(
    table(
      ['Status', 'Count', 'Percentage'],
      [
        ['Completed', String(counts.completed), `${pct}%`],
        [
          'Active',
          String(counts.active),
          `${counts.total > 0 ? Math.round((counts.active / counts.total) * 100) : 0}%`,
        ],
        [
          'Planned',
          String(counts.planned),
          `${counts.total > 0 ? Math.round((counts.planned / counts.total) * 100) : 0}%`,
        ],
      ]
    )
  );

  // Per-phase breakdown if phases exist
  if (dataset.byPhase.length > 0) {
    sections.push(heading(3, 'By Phase'));
    const phaseRows: string[][] = [];
    for (const phaseGroup of dataset.byPhase) {
      const phaseCounts = computeStatusCounts(phaseGroup.patterns);
      const phasePct = completionPercentage(phaseCounts);
      phaseRows.push([
        `Phase ${phaseGroup.phaseNumber}`,
        String(phaseCounts.total),
        String(phaseCounts.completed),
        `${phasePct}%`,
      ]);
    }
    sections.push(table(['Phase', 'Patterns', 'Completed', 'Progress'], phaseRows));
  }

  return sections;
}

function buildRegenerationFooter(context: CodecContext): SectionBlock[] {
  const regen = context.projectMetadata?.regeneration;

  // Use configured regeneration commands if available, otherwise fall back to defaults
  if (regen && regen.commands.length > 0) {
    const sections: SectionBlock[] = [
      heading(2, 'Regeneration'),
      paragraph(regen.note ?? 'Regenerate documentation from annotated sources:'),
      code(
        regen.commands
          .map(
            (cmd) => `${cmd.command}  ${cmd.label.startsWith('#') ? cmd.label : `# ${cmd.label}`}`
          )
          .join('\n'),
        'bash'
      ),
    ];
    return sections;
  }

  // Default regeneration commands (backward compatible)
  return [
    heading(2, 'Regeneration'),
    paragraph('Regenerate all documentation from annotated sources:'),
    code(
      [
        'pnpm docs:all          # Regenerate all generated docs',
        'pnpm docs:all-preview  # Also generate ephemeral workflow docs',
      ].join('\n'),
      'bash'
    ),
    paragraph('Individual generators:'),
    code(
      [
        'pnpm docs:product-areas         # Product area docs',
        'pnpm docs:decisions             # Architecture decisions',
        'pnpm docs:reference             # Reference documents',
        'pnpm docs:business-rules        # Business rules',
        'pnpm docs:taxonomy              # Taxonomy reference',
        'pnpm docs:validation            # Validation rules',
        'pnpm docs:claude-modules        # Claude context modules',
        'pnpm docs:process-api-reference # Process API CLI reference',
        'pnpm docs:cli-recipe            # CLI recipes & workflow guide',
      ].join('\n'),
      'bash'
    ),
  ];
}
