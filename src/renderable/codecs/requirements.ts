/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern RequirementsCodec
 * @libar-docs-status completed
 *
 * ## Requirements Document Codec
 *
 * Transforms MasterDataset into RenderableDocument for PRD/requirements output.
 * Generates PRODUCT-REQUIREMENTS.md and detail files (requirements/*.md).
 *
 * ### When to Use
 *
 * - When generating product requirements documentation
 * - When creating stakeholder-facing PRD documents
 * - When organizing requirements by user role or product area
 *
 * ### Factory Pattern
 *
 * Use `createRequirementsCodec(options)` for custom options:
 * ```typescript
 * const codec = createRequirementsCodec({ groupBy: "user-role" });
 * const doc = codec.decode(dataset);
 * ```
 */

import { z } from 'zod';
import {
  MasterDatasetSchema,
  type MasterDataset,
} from '../../validation-schemas/master-dataset.js';
import type { ExtractedPattern } from '../../validation-schemas/index.js';
import {
  type RenderableDocument,
  type SectionBlock,
  heading,
  paragraph,
  separator,
  table,
  list,
  collapsible,
  linkOut,
  document,
} from '../schema.js';
import { renderScenarioContent, renderBusinessRulesSection } from './helpers.js';
import { normalizeStatus } from '../../taxonomy/index.js';
import {
  getStatusEmoji,
  getDisplayName,
  computeStatusCounts,
  completionPercentage,
  renderProgressBar,
  sortByStatusAndName,
  formatBusinessValue,
} from '../utils.js';
import { toKebabCase, groupBy } from '../../utils/index.js';
import { getPatternName } from '../../api/pattern-helpers.js';
import {
  type BaseCodecOptions,
  type NormalizedStatusFilter,
  DEFAULT_BASE_OPTIONS,
  mergeOptions,
} from './types/base.js';

// ═══════════════════════════════════════════════════════════════════════════
// Path Normalization Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Known repository prefixes that should be stripped from implementation paths.
 */
const REPO_PREFIXES = ['libar-platform/', 'monorepo/'];

/**
 * Normalize implementation file path by stripping repository prefixes.
 *
 * @param filePath - The implementation file path (may include repo prefix)
 * @returns Path with repo prefix stripped if present
 */
function normalizeImplPath(filePath: string): string {
  for (const prefix of REPO_PREFIXES) {
    if (filePath.startsWith(prefix)) {
      return filePath.slice(prefix.length);
    }
  }
  return filePath;
}

// ═══════════════════════════════════════════════════════════════════════════
// Requirements Codec Options (co-located with codec)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Options for RequirementsDocumentCodec
 */
export interface RequirementsCodecOptions extends BaseCodecOptions {
  /** Group requirements by (default: "product-area") */
  groupBy?: 'product-area' | 'user-role' | 'phase';

  /** Filter by status (default: all statuses). Uses normalized status values. */
  filterStatus?: NormalizedStatusFilter[];

  /** Include scenario steps (default: true) */
  includeScenarioSteps?: boolean;

  /** Include business value (default: true) */
  includeBusinessValue?: boolean;

  /** Include Business Rules section from Gherkin Rule: keyword (default: true) */
  includeBusinessRules?: boolean;

  /** Render full step details (Given/When/Then) vs just names (default: true) */
  includeStepDetails?: boolean;
}

/**
 * Default options for RequirementsDocumentCodec
 */
export const DEFAULT_REQUIREMENTS_OPTIONS: Required<RequirementsCodecOptions> = {
  ...DEFAULT_BASE_OPTIONS,
  groupBy: 'product-area',
  filterStatus: [],
  includeScenarioSteps: true,
  includeBusinessValue: true,
  includeBusinessRules: true,
  includeStepDetails: true,
};
import { RenderableDocumentOutputSchema } from './shared-schema.js';

// ═══════════════════════════════════════════════════════════════════════════
// Requirements Document Codec
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a RequirementsDocumentCodec with custom options.
 *
 * @param options - Codec configuration options
 * @returns Configured Zod codec
 *
 * @example
 * ```typescript
 * // Group by user role instead of product area
 * const codec = createRequirementsCodec({ groupBy: "user-role" });
 *
 * // Filter to only completed requirements
 * const codec = createRequirementsCodec({ filterStatus: ["completed"] });
 * ```
 */
export function createRequirementsCodec(
  options?: RequirementsCodecOptions
): z.ZodCodec<typeof MasterDatasetSchema, typeof RenderableDocumentOutputSchema> {
  const opts = mergeOptions(DEFAULT_REQUIREMENTS_OPTIONS, options);

  return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
    decode: (dataset: MasterDataset): RenderableDocument => {
      return buildRequirementsDocument(dataset, opts);
    },
    /** @throws Always - this codec is decode-only. See zod-codecs.md */
    encode: (): never => {
      throw new Error('RequirementsDocumentCodec is decode-only. See zod-codecs.md');
    },
  });
}

/**
 * Default Requirements Document Codec
 *
 * Transforms MasterDataset → RenderableDocument for product requirements.
 * Features grouped by product area and user role.
 */
export const RequirementsDocumentCodec = createRequirementsCodec();

// ═══════════════════════════════════════════════════════════════════════════
// Document Builder
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build requirements document
 */
function buildRequirementsDocument(
  dataset: MasterDataset,
  options: Required<RequirementsCodecOptions>
): RenderableDocument {
  const sections: SectionBlock[] = [];

  // Get PRD patterns (patterns with product metadata), excluding ADR/PDR decisions
  // (decisions belong to the ADR codec, not requirements)
  let prdPatterns = dataset.bySource.prd.filter((p) => p.adr === undefined);

  // Apply status filter if specified
  if (options.filterStatus.length > 0) {
    prdPatterns = prdPatterns.filter((p) =>
      options.filterStatus.includes(normalizeStatus(p.status))
    );
  }

  if (prdPatterns.length === 0) {
    sections.push(
      heading(2, 'No Product Requirements'),
      paragraph('No patterns have product area, user role, or business value metadata.')
    );

    return document('Product Requirements', sections, {
      purpose: 'Product requirements documentation',
    });
  }

  // 1. Summary
  sections.push(...buildRequirementsSummary(prdPatterns));

  // 2. Features by primary grouping
  if (options.groupBy === 'user-role') {
    sections.push(...buildByUserRole(prdPatterns));
    sections.push(...buildByProductArea(prdPatterns, options));
  } else if (options.groupBy === 'phase') {
    sections.push(...buildByPhase(prdPatterns, options));
    sections.push(...buildByProductArea(prdPatterns, options));
  } else {
    // Default: product-area
    sections.push(...buildByProductArea(prdPatterns, options));
    sections.push(...buildByUserRole(prdPatterns));
  }

  // 4. All Features table
  sections.push(...buildAllFeaturesTable(prdPatterns));

  // Build additional files for detailed requirements (if enabled)
  const additionalFiles = options.generateDetailFiles
    ? buildRequirementsDetailFiles(prdPatterns, options, dataset)
    : {};

  const docOpts: {
    purpose: string;
    detailLevel: string;
    additionalFiles?: Record<string, RenderableDocument>;
  } = {
    purpose: 'Product requirements and feature specifications',
    detailLevel: options.generateDetailFiles
      ? 'Overview with links to detailed requirements'
      : 'Compact summary',
  };

  if (Object.keys(additionalFiles).length > 0) {
    docOpts.additionalFiles = additionalFiles;
  }

  return document('Product Requirements', sections, docOpts);
}

// ═══════════════════════════════════════════════════════════════════════════
// Section Builders
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build requirements summary section
 */
function buildRequirementsSummary(patterns: ExtractedPattern[]): SectionBlock[] {
  const counts = computeStatusCounts(patterns);
  const progress = completionPercentage(counts);
  const progressBar = renderProgressBar(counts.completed, counts.total, 20);

  // Group by product area
  const byArea = groupBy(
    patterns.filter(
      (p): p is ExtractedPattern & { productArea: string } => p.productArea !== undefined
    ),
    (p) => p.productArea
  );

  // Group by user role
  const byRole = groupBy(
    patterns.filter((p): p is ExtractedPattern & { userRole: string } => p.userRole !== undefined),
    (p) => p.userRole
  );

  return [
    heading(2, 'Summary'),
    paragraph(`**Overall:** ${progressBar} (${progress}%)`),
    table(
      ['Metric', 'Value'],
      [
        ['Total Features', String(counts.total)],
        ['Completed', String(counts.completed)],
        ['Active', String(counts.active)],
        ['Planned', String(counts.planned)],
        ['Product Areas', String(byArea.size)],
        ['User Roles', String(byRole.size)],
      ]
    ),
    separator(),
  ];
}

/**
 * Build features by product area section
 * Each feature links to its individual detail file when generateDetailFiles is enabled
 */
function buildByProductArea(
  patterns: ExtractedPattern[],
  options: Required<RequirementsCodecOptions>
): SectionBlock[] {
  const sections: SectionBlock[] = [];

  const byArea = groupBy(
    patterns.filter((p) => p.productArea),
    (p) => p.productArea ?? ''
  );

  if (byArea.size === 0) {
    return [];
  }

  sections.push(heading(2, 'By Product Area'));

  const sortedAreas = [...byArea.keys()].sort();

  for (const area of sortedAreas) {
    const areaPatterns = byArea.get(area) ?? [];
    const counts = computeStatusCounts(areaPatterns);
    const progress = completionPercentage(counts);

    sections.push(heading(3, area));
    sections.push(paragraph(`${counts.completed}/${counts.total} complete (${progress}%)`));

    // Feature list - link each feature to its individual file if enabled
    const items = sortByStatusAndName([...areaPatterns]).map((p) => {
      const emoji = getStatusEmoji(p.status);
      const name = getDisplayName(p);
      const businessValue = options.includeBusinessValue
        ? formatBusinessValue(p.businessValue)
        : null;
      const label = businessValue ? `${emoji} ${name} - ${businessValue}` : `${emoji} ${name}`;
      if (options.generateDetailFiles) {
        const slug = requirementToSlug(getPatternName(p), p.phase);
        return `[${label}](requirements/${slug}.md)`;
      }
      return label;
    });

    sections.push(list(items));
  }

  sections.push(separator());

  return sections;
}

/**
 * Build features by user role section
 */
function buildByUserRole(patterns: ExtractedPattern[]): SectionBlock[] {
  const sections: SectionBlock[] = [];

  const byRole = groupBy(
    patterns.filter((p) => p.userRole),
    (p) => p.userRole ?? ''
  );

  if (byRole.size === 0) {
    return [];
  }

  sections.push(heading(2, 'By User Role'));

  const sortedRoles = [...byRole.keys()].sort();

  for (const role of sortedRoles) {
    const rolePatterns = byRole.get(role) ?? [];
    const counts = computeStatusCounts(rolePatterns);

    // Use collapsible for user role breakdown
    const roleContent: SectionBlock[] = [];

    const rows = sortByStatusAndName([...rolePatterns]).map((p) => {
      const emoji = getStatusEmoji(p.status);
      const name = getDisplayName(p);
      const area = p.productArea ?? '-';
      return [`${emoji} ${name}`, area, normalizeStatus(p.status)];
    });

    roleContent.push(table(['Feature', 'Product Area', 'Status'], rows));

    sections.push(
      collapsible(`${role} (${counts.total} features, ${counts.completed} complete)`, roleContent)
    );
  }

  sections.push(separator());

  return sections;
}

/**
 * Build features by phase section
 * Each feature links to its individual detail file when generateDetailFiles is enabled
 */
function buildByPhase(
  patterns: ExtractedPattern[],
  options: Required<RequirementsCodecOptions>
): SectionBlock[] {
  const sections: SectionBlock[] = [];

  const byPhase = groupBy(
    patterns.filter((p) => p.phase !== undefined),
    (p) => p.phase ?? 0
  );

  if (byPhase.size === 0) {
    return [];
  }

  sections.push(heading(2, 'By Phase'));

  const sortedPhases = [...byPhase.keys()].sort((a, b) => a - b);

  for (const phase of sortedPhases) {
    const phasePatterns = byPhase.get(phase) ?? [];
    const counts = computeStatusCounts(phasePatterns);
    const progress = completionPercentage(counts);

    sections.push(heading(3, `Phase ${phase}`));
    sections.push(paragraph(`${counts.completed}/${counts.total} complete (${progress}%)`));

    // Feature list - link each feature to its individual file if enabled
    const items = sortByStatusAndName([...phasePatterns]).map((p) => {
      const emoji = getStatusEmoji(p.status);
      const name = getDisplayName(p);
      const businessValue = options.includeBusinessValue
        ? formatBusinessValue(p.businessValue)
        : null;
      const label = businessValue ? `${emoji} ${name} - ${businessValue}` : `${emoji} ${name}`;
      if (options.generateDetailFiles) {
        const slug = requirementToSlug(getPatternName(p), p.phase);
        return `[${label}](requirements/${slug}.md)`;
      }
      return label;
    });

    sections.push(list(items));
  }

  sections.push(separator());

  return sections;
}

/**
 * Build all features table
 */
function buildAllFeaturesTable(patterns: ExtractedPattern[]): SectionBlock[] {
  const sorted = sortByStatusAndName([...patterns]);

  const rows = sorted.map((p) => {
    const emoji = getStatusEmoji(p.status);
    const name = getDisplayName(p);
    const area = p.productArea ?? '-';
    const role = p.userRole ?? '-';
    const status = normalizeStatus(p.status);
    return [`${emoji} ${name}`, area, role, status];
  });

  return [
    heading(2, 'All Features'),
    table(['Feature', 'Product Area', 'User Role', 'Status'], rows),
    separator(),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// Individual Detail Files (Progressive Disclosure)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate URL-safe slug from pattern name with phase prefix
 *
 * Produces readable slugs with phase ordering:
 * - DeciderPattern (phase 14) → "phase-14-decider-pattern"
 * - BddTestingInfrastructure (phase 19) → "phase-19-bdd-testing-infrastructure"
 * - SomeUnassigned (no phase) → "phase-00-some-unassigned"
 *
 * @param patternName - The pattern name (typically CamelCase)
 * @param phase - Optional phase number (defaults to 0)
 * @returns URL-safe slug with phase prefix
 *
 * @internal Exported for testing - not part of public API
 */
export function requirementToSlug(patternName: string, phase: number | undefined): string {
  const phaseNum = phase ?? 0;
  const paddedPhase = String(phaseNum).padStart(2, '0');
  return `phase-${paddedPhase}-${toKebabCase(patternName)}`;
}

/**
 * Build individual requirement files (progressive disclosure)
 * Creates one file per requirement instead of grouping by product area
 */
function buildRequirementsDetailFiles(
  patterns: ExtractedPattern[],
  options: Required<RequirementsCodecOptions>,
  dataset: MasterDataset
): Record<string, RenderableDocument> {
  const files: Record<string, RenderableDocument> = {};

  for (const pattern of patterns) {
    const slug = requirementToSlug(getPatternName(pattern), pattern.phase);
    files[`requirements/${slug}.md`] = buildSingleRequirementDocument(pattern, options, dataset);
  }

  return files;
}

/**
 * Build a single requirement detail document
 */
function buildSingleRequirementDocument(
  pattern: ExtractedPattern,
  options: Required<RequirementsCodecOptions>,
  dataset: MasterDataset
): RenderableDocument {
  const sections: SectionBlock[] = [];
  const emoji = getStatusEmoji(pattern.status);
  const name = getDisplayName(pattern);

  // Metadata
  const metaRows: string[][] = [['Status', normalizeStatus(pattern.status)]];

  if (pattern.productArea) {
    metaRows.push(['Product Area', pattern.productArea]);
  }

  if (pattern.userRole) {
    metaRows.push(['User Role', pattern.userRole]);
  }

  if (options.includeBusinessValue && pattern.businessValue) {
    metaRows.push(['Business Value', formatBusinessValue(pattern.businessValue)]);
  }

  if (pattern.phase !== undefined) {
    metaRows.push(['Phase', String(pattern.phase)]);
  }

  sections.push(heading(2, 'Overview'), table(['Property', 'Value'], metaRows));

  // Description
  if (pattern.directive.description) {
    sections.push(heading(2, 'Description'), paragraph(pattern.directive.description));
  }

  // Use cases
  if (pattern.useCases && pattern.useCases.length > 0) {
    sections.push(heading(2, 'Use Cases'), list([...pattern.useCases]));
  }

  // Scenarios as acceptance criteria with full steps, DataTables, and DocStrings
  if (options.includeScenarioSteps && pattern.scenarios && pattern.scenarios.length > 0) {
    sections.push(heading(2, 'Acceptance Criteria'));
    for (const scenario of pattern.scenarios) {
      sections.push(...renderScenarioContent(scenario));
    }
  }

  // Business Rules from Gherkin Rule: keyword
  // Use H2 to match other top-level sections in detail documents
  if (options.includeBusinessRules) {
    sections.push(...renderBusinessRulesSection(pattern.rules, { baseHeadingLevel: 2 }));
  }

  // Deliverables
  if (pattern.deliverables && pattern.deliverables.length > 0) {
    const deliverableItems = pattern.deliverables.map((d) => {
      const status = ` (${d.status})`;
      return `${d.name}${status}`;
    });

    sections.push(heading(2, 'Deliverables'), list(deliverableItems));
  }

  // Implementations (files that implement this pattern via @libar-docs-implements)
  const patternKey = getPatternName(pattern);
  const rel = dataset.relationshipIndex?.[patternKey];
  if (rel?.implementedBy && rel.implementedBy.length > 0) {
    sections.push(heading(2, 'Implementations'));
    sections.push(
      paragraph('Files that implement this pattern:'),
      list(
        rel.implementedBy.map((impl) => {
          const fileName = impl.file.split('/').pop() ?? impl.file;
          // Normalize path to strip repo prefixes (e.g., "libar-platform/packages/..." -> "packages/...")
          const normalizedPath = normalizeImplPath(impl.file);
          // Link is relative from output/requirements/ directory, go up two levels to project root
          const link = `[\`${fileName}\`](../../${normalizedPath})`;
          return impl.description ? `${link} - ${impl.description}` : link;
        })
      )
    );
  }

  // Back link
  sections.push(
    separator(),
    linkOut('← Back to Product Requirements', '../PRODUCT-REQUIREMENTS.md')
  );

  return document(`${emoji} ${name}`, sections, {
    purpose: `Detailed requirements for the ${name} feature`,
  });
}
