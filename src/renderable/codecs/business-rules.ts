/**
 * @architect
 * @architect-core
 * @architect-pattern BusinessRulesCodec
 * @architect-status completed
 * @architect-unlock-reason:Progressive-disclosure-by-product-area
 * @architect-convention codec-registry
 * @architect-product-area:Generation
 *
 * ## BusinessRulesCodec
 *
 * Transforms MasterDataset into a RenderableDocument for business rules output.
 * Generates BUSINESS-RULES.md organized by product area, phase, and feature.
 *
 * **Purpose:** Business rules documentation organized by product area, phase, and feature. Extracts domain constraints from Gherkin Rule: blocks.
 *
 * **Output Files:** `BUSINESS-RULES.md` (main index), `business-rules/<area-slug>.md` (area details)
 *
 * | Option | Type | Default | Description |
 * | --- | --- | --- | --- |
 * | groupBy | "domain" \| "phase" \| "domain-then-phase" | "domain-then-phase" | Primary grouping strategy |
 * | includeCodeExamples | boolean | false | Include code examples from DocStrings |
 * | includeTables | boolean | true | Include markdown tables from descriptions |
 * | includeRationale | boolean | true | Include rationale section per rule |
 * | filterDomains | string[] | [] | Filter by domain categories (empty = all) |
 * | filterPhases | number[] | [] | Filter by phases (empty = all) |
 * | onlyWithInvariants | boolean | false | Show only rules with explicit invariants |
 * | includeSource | boolean | true | Include source feature file link |
 * | includeVerifiedBy | boolean | true | Include Verified by scenario links |
 * | maxDescriptionLength | number | 150 | Max description length in standard mode |
 * | excludeSourcePaths | string[] | [] | Exclude patterns by source path prefix |
 *
 * ### When to Use
 *
 * - When generating business rules documentation for stakeholders
 * - When extracting domain constraints without implementation details
 * - When creating compliance or audit documentation from feature specs
 *
 * ### Information Architecture
 *
 * ```
 * Product Area (Platform, DeliveryProcess)
 *   └── Phase (21, 15, etc.) or Release (v0.1.0 for DeliveryProcess)
 *        └── Feature (pattern name with description)
 *             └── Rules (inline with Invariant + Rationale)
 * ```
 *
 * ### Progressive Disclosure
 *
 * - **summary**: Statistics only (compact reference)
 * - **standard**: Above + all features with rules inline
 * - **detailed**: Full content including code examples and verification links
 *
 * ### Factory Pattern
 *
 * Use `createBusinessRulesCodec(options)` to create a configured codec:
 * ```typescript
 * const codec = createBusinessRulesCodec({ detailLevel: "summary" });
 * const doc = codec.decode(dataset);
 * ```
 */

import type { MasterDataset } from '../../validation-schemas/master-dataset.js';
import type { ExtractedPattern } from '../../validation-schemas/index.js';
import type { BusinessRule } from '../../validation-schemas/extracted-pattern.js';
import {
  type RenderableDocument,
  type SectionBlock,
  heading,
  paragraph,
  separator,
  table,
  linkOut,
  document,
} from '../schema.js';
import {
  type BaseCodecOptions,
  type DocumentCodec,
  DEFAULT_BASE_OPTIONS,
  mergeOptions,
  createDecodeOnlyCodec,
} from './types/base.js';
import { toKebabCase, camelCaseToTitleCase } from '../../utils/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// Business Rules Codec Options (co-located with codec)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Options for BusinessRulesCodec
 *
 * Supports progressive disclosure via detailLevel:
 * - "summary": Statistics table + All Rules table only (no domain sections)
 * - "standard": Above + domain sections with truncated descriptions
 * - "detailed": Full content including code examples and verification links
 */
export interface BusinessRulesCodecOptions extends BaseCodecOptions {
  /** Group rules by (default: "domain-then-phase") */
  groupBy?: 'domain' | 'phase' | 'domain-then-phase';

  /** Include code examples from DocStrings (default: false, only in detailed mode) */
  includeCodeExamples?: boolean;

  /** Include markdown tables from rule descriptions (default: true) */
  includeTables?: boolean;

  /** Include rationale section (default: true) */
  includeRationale?: boolean;

  /** Filter by domain categories (default: all) */
  filterDomains?: string[];

  /** Filter by phases (default: all) */
  filterPhases?: number[];

  /** Show only rules with explicit invariants (default: false) */
  onlyWithInvariants?: boolean;

  /** Include source feature file link for each rule (default: true) */
  includeSource?: boolean;

  /** Include "Verified by" scenario links (default: false, only in detailed mode) */
  includeVerifiedBy?: boolean;

  /** Maximum description length in characters for standard mode (default: 150, 0 = no limit) */
  maxDescriptionLength?: number;

  /** Exclude patterns whose source.file starts with any of these prefixes (default: []) */
  excludeSourcePaths?: string[];
}

/**
 * Default options for BusinessRulesCodec
 */
export const DEFAULT_BUSINESS_RULES_OPTIONS: Required<BusinessRulesCodecOptions> = {
  ...DEFAULT_BASE_OPTIONS,
  groupBy: 'domain-then-phase',
  includeCodeExamples: false, // Only in detailed mode
  includeTables: true,
  includeRationale: true,
  filterDomains: [],
  filterPhases: [],
  onlyWithInvariants: false,
  includeSource: true,
  includeVerifiedBy: true,
  maxDescriptionLength: 150,
  excludeSourcePaths: [],
};
import {
  parseBusinessRuleAnnotations,
  type BusinessRuleAnnotations,
  extractFirstSentence,
} from './helpers.js';
import { extractTablesAsSectionBlocks } from './convention-extractor.js';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_PRODUCT_AREA = 'Platform';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A business rule with its context (pattern, parsed annotations)
 */
interface RuleWithContext {
  rule: BusinessRule;
  pattern: ExtractedPattern;
  annotations: BusinessRuleAnnotations;
}

/**
 * A feature (pattern) with its rules
 */
interface FeatureWithRules {
  pattern: ExtractedPattern;
  featureName: string;
  featureDescription: string;
  rules: RuleWithContext[];
}

/**
 * Grouped by product area → phase/release → features
 */
interface ProductAreaGroup {
  productArea: string;
  displayName: string;
  phases: Map<string, FeatureWithRules[]>; // phase key → features
}

// ═══════════════════════════════════════════════════════════════════════════
// Business Rules Document Codec
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a BusinessRulesCodec with custom options.
 *
 * @param options - Codec configuration options
 * @returns Configured Zod codec
 *
 * @example
 * ```typescript
 * // Compact summary mode
 * const codec = createBusinessRulesCodec({ detailLevel: "summary" });
 *
 * // Filter to specific domains
 * const codec = createBusinessRulesCodec({ filterDomains: ["ddd", "event-sourcing"] });
 * ```
 */
export function createBusinessRulesCodec(options?: BusinessRulesCodecOptions): DocumentCodec {
  const opts = mergeOptions(DEFAULT_BUSINESS_RULES_OPTIONS, options);

  return createDecodeOnlyCodec(({ dataset }) => buildBusinessRulesDocument(dataset, opts));
}

/**
 * Default Business Rules Document Codec
 *
 * Transforms MasterDataset → RenderableDocument for business rules.
 * Uses default options with standard detail level.
 *
 * @example
 * ```typescript
 * const doc = BusinessRulesCodec.decode(masterDataset);
 * const markdown = renderToMarkdown(doc);
 * ```
 */
export const BusinessRulesCodec = createBusinessRulesCodec();

export const codecMeta = {
  type: 'business-rules',
  outputPath: 'BUSINESS-RULES.md',
  description: 'Business rules and invariants by domain',
  factory: createBusinessRulesCodec,
  defaultInstance: BusinessRulesCodec,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Document Builder
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build the business rules document from dataset
 */
function buildBusinessRulesDocument(
  dataset: MasterDataset,
  options: Required<BusinessRulesCodecOptions>
): RenderableDocument {
  const sections: SectionBlock[] = [];

  // 1. Collect all rules organized by product area → phase → feature
  const productAreaGroups = collectRulesByProductArea(dataset, options);

  // Calculate stats
  const stats = calculateStats(productAreaGroups);

  if (stats.totalRules === 0) {
    sections.push(
      heading(2, 'No Business Rules Found'),
      paragraph(
        'No business rules were found in the feature files. ' +
          'Business rules are defined using the `Rule:` keyword in Gherkin feature files.'
      )
    );
    return document('Business Rules', sections, {
      purpose: 'Domain constraints and invariants',
    });
  }

  // 2. Build summary (single line with stats)
  sections.push(...buildSummarySection(stats));

  // 3. Progressive disclosure: split by product area when detail files enabled
  if (options.generateDetailFiles && options.detailLevel !== 'summary') {
    sections.push(...buildProductAreaIndexSection(productAreaGroups));

    const additionalFiles = buildBusinessRulesDetailFiles(productAreaGroups, options);

    const docOpts: {
      purpose: string;
      detailLevel: string;
      additionalFiles?: Record<string, RenderableDocument>;
    } = {
      purpose: 'Domain constraints and invariants extracted from feature files',
      detailLevel: 'Overview with links to detailed business rules by product area',
    };

    if (Object.keys(additionalFiles).length > 0) {
      docOpts.additionalFiles = additionalFiles;
    }

    return document('Business Rules', sections, docOpts);
  }

  // 4. Non-split mode: all content in single document
  if (options.detailLevel !== 'summary') {
    sections.push(...buildProductAreaSections(productAreaGroups, options));
  }

  return document('Business Rules', sections, {
    purpose: 'Domain constraints and invariants extracted from feature files',
    detailLevel: options.detailLevel,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Rule Collection
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Collect rules organized by Product Area → Phase → Feature
 */
function collectRulesByProductArea(
  dataset: MasterDataset,
  options: Required<BusinessRulesCodecOptions>
): Map<string, ProductAreaGroup> {
  const groups = new Map<string, ProductAreaGroup>();

  for (const pattern of dataset.patterns) {
    // Skip patterns without rules
    if (!pattern.rules || pattern.rules.length === 0) {
      continue;
    }

    // Apply source path exclusion filter
    if (
      options.excludeSourcePaths.length > 0 &&
      options.excludeSourcePaths.some((prefix) => pattern.source.file.startsWith(prefix))
    ) {
      continue;
    }

    // Apply domain filter
    if (options.filterDomains.length > 0 && !options.filterDomains.includes(pattern.category)) {
      continue;
    }

    // Apply phase filter
    if (
      options.filterPhases.length > 0 &&
      pattern.phase !== undefined &&
      !options.filterPhases.includes(pattern.phase)
    ) {
      continue;
    }

    const productArea = pattern.productArea ?? DEFAULT_PRODUCT_AREA;
    const productAreaDisplay = formatProductAreaName(productArea);

    // Determine phase key (use release for DeliveryProcess items without phase)
    const phaseKey = getPhaseKey(pattern);

    // Get or create product area group
    let group = groups.get(productArea);
    if (!group) {
      group = {
        productArea,
        displayName: productAreaDisplay,
        phases: new Map(),
      };
      groups.set(productArea, group);
    }

    // Get or create phase group
    let phaseFeatures = group.phases.get(phaseKey);
    if (!phaseFeatures) {
      phaseFeatures = [];
      group.phases.set(phaseKey, phaseFeatures);
    }

    // Build feature with rules
    const featureWithRules: FeatureWithRules = {
      pattern,
      featureName: pattern.name,
      featureDescription: extractFeatureDescription(pattern),
      rules: [],
    };

    // Process rules
    for (const rule of pattern.rules) {
      const annotations = parseBusinessRuleAnnotations(rule.description);

      // Apply onlyWithInvariants filter
      if (options.onlyWithInvariants && !annotations.invariant) {
        continue;
      }

      featureWithRules.rules.push({
        rule,
        pattern,
        annotations,
      });
    }

    // Only add feature if it has rules after filtering
    if (featureWithRules.rules.length > 0) {
      phaseFeatures.push(featureWithRules);
    }
  }

  return groups;
}

/**
 * Get the phase key for grouping (e.g., "Phase 21" or "v0.1.0")
 */
function getPhaseKey(pattern: ExtractedPattern): string {
  // If pattern has a phase, use it
  if (pattern.phase !== undefined) {
    return `Phase ${pattern.phase}`;
  }

  // For DeliveryProcess items without phase, use release
  const release = pattern.release;
  if (release) {
    return release;
  }

  // Fallback
  return 'Uncategorized';
}

const CONTENT_HEADER_PATTERNS = [
  /\*\*Problem:\*\*\s*/,
  /\*\*Business Value:\*\*\s*/,
  /\*\*Solution:\*\*\s*/,
  /\*\*Context:\*\*\s*/,
] as const;

const NEXT_HEADER_PATTERN = /\n\s*(?:\*\*[A-Z]|\|)/m;

/**
 * Extract a compact description from the feature
 *
 * Looks for content after header markers like **Problem:** or **Business Value:**
 * and extracts the full first sentence/paragraph.
 */
function extractFeatureDescription(pattern: ExtractedPattern): string {
  const desc = pattern.directive.description;

  // Try to find content after a header
  for (const headerPattern of CONTENT_HEADER_PATTERNS) {
    const match = headerPattern.exec(desc);
    if (match) {
      // Get text after the header
      const afterHeader = desc.slice(match.index + match[0].length);
      // Get content up to the next header or table
      const nextHeaderMatch = NEXT_HEADER_PATTERN.exec(afterHeader);
      const content = nextHeaderMatch ? afterHeader.slice(0, nextHeaderMatch.index) : afterHeader;

      // Clean up and extract first sentence
      const cleaned = content.trim().split('\n')[0]?.trim() ?? '';
      if (cleaned.length > 0) {
        return extractFirstSentence(cleaned);
      }
    }
  }

  // Fallback: Try to get the first meaningful line
  const lines = desc.split('\n').filter((line: string) => {
    const trimmed = line.trim();
    return (
      trimmed.length > 0 &&
      !trimmed.startsWith('**') && // Skip any header
      !trimmed.startsWith('|') && // Skip table rows
      !trimmed.startsWith('-') && // Skip list items
      trimmed.length > 20 // Require substantial content
    );
  });

  const firstLine = lines[0];
  if (firstLine) {
    return extractFirstSentence(firstLine);
  }

  return '';
}

// ═══════════════════════════════════════════════════════════════════════════
// Statistics
// ═══════════════════════════════════════════════════════════════════════════

interface Stats {
  totalRules: number;
  totalFeatures: number;
  withInvariants: number;
  productAreas: number;
}

function calculateStats(groups: Map<string, ProductAreaGroup>): Stats {
  let totalRules = 0;
  let totalFeatures = 0;
  let withInvariants = 0;

  for (const group of groups.values()) {
    for (const features of group.phases.values()) {
      totalFeatures += features.length;
      for (const feature of features) {
        totalRules += feature.rules.length;
        for (const ruleCtx of feature.rules) {
          if (ruleCtx.annotations.invariant) {
            withInvariants++;
          }
        }
      }
    }
  }

  return {
    totalRules,
    totalFeatures,
    withInvariants,
    productAreas: groups.size,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Summary Section
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build compact summary section
 */
function buildSummarySection(stats: Stats): SectionBlock[] {
  const summary = `Domain constraints and invariants extracted from feature specifications. ${stats.totalRules} rules from ${stats.totalFeatures} features across ${stats.productAreas} product areas.`;

  return [paragraph(`**${summary}**`), separator()];
}

// ═══════════════════════════════════════════════════════════════════════════
// Product Area Sections
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build sections organized by Product Area → Phase → Feature → Rules
 */
function buildProductAreaSections(
  groups: Map<string, ProductAreaGroup>,
  options: Required<BusinessRulesCodecOptions>
): SectionBlock[] {
  const sections: SectionBlock[] = [];

  // Sort product areas alphabetically
  const sortedGroups = [...groups.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );

  for (const group of sortedGroups) {
    const sortedPhases = sortPhaseEntries([...group.phases.entries()]);

    for (const [phaseKey, features] of sortedPhases) {
      // Product Area / Phase heading
      sections.push(heading(2, `${group.displayName} / ${phaseKey}`));

      // Sort features by name
      const sortedFeatures = [...features].sort((a, b) =>
        a.featureName.localeCompare(b.featureName)
      );

      for (const feature of sortedFeatures) {
        sections.push(...renderFeatureWithRules(feature, options));
      }

      sections.push(separator());
    }
  }

  return sections;
}

// ═══════════════════════════════════════════════════════════════════════════
// Progressive Disclosure: Product Area Index + Detail Files
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Per-area statistics
 */
interface AreaStats {
  totalRules: number;
  totalFeatures: number;
  withInvariants: number;
}

/**
 * Calculate statistics for a single product area group
 */
function calculateAreaStats(group: ProductAreaGroup): AreaStats {
  let totalRules = 0;
  let totalFeatures = 0;
  let withInvariants = 0;

  for (const features of group.phases.values()) {
    totalFeatures += features.length;
    for (const feature of features) {
      totalRules += feature.rules.length;
      for (const ruleCtx of feature.rules) {
        if (ruleCtx.annotations.invariant) {
          withInvariants++;
        }
      }
    }
  }

  return { totalRules, totalFeatures, withInvariants };
}

/**
 * Generate URL-safe slug from product area name
 */
function productAreaToSlug(productArea: string): string {
  return toKebabCase(productArea);
}

/**
 * Build the product area index section for the main document.
 * Shows a summary table with links to each product area's detail file.
 */
function buildProductAreaIndexSection(groups: Map<string, ProductAreaGroup>): SectionBlock[] {
  const sections: SectionBlock[] = [];
  sections.push(heading(2, 'Product Areas'));

  const sortedGroups = [...groups.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );

  const rows: string[][] = sortedGroups.map((group) => {
    const areaStats = calculateAreaStats(group);
    const slug = productAreaToSlug(group.productArea);
    const link = `[${group.displayName}](business-rules/${slug}.md)`;
    return [
      link,
      String(areaStats.totalFeatures),
      String(areaStats.totalRules),
      String(areaStats.withInvariants),
    ];
  });

  sections.push(table(['Product Area', 'Features', 'Rules', 'With Invariants'], rows));
  sections.push(separator());

  return sections;
}

/**
 * Build one detail file per product area
 */
function buildBusinessRulesDetailFiles(
  groups: Map<string, ProductAreaGroup>,
  options: Required<BusinessRulesCodecOptions>
): Record<string, RenderableDocument> {
  const files: Record<string, RenderableDocument> = {};

  const sortedGroups = [...groups.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );

  for (const group of sortedGroups) {
    const slug = productAreaToSlug(group.productArea);
    files[`business-rules/${slug}.md`] = buildSingleProductAreaDocument(group, options);
  }

  return files;
}

/**
 * Build a single product area detail document with rules organized by phase
 */
function buildSingleProductAreaDocument(
  group: ProductAreaGroup,
  options: Required<BusinessRulesCodecOptions>
): RenderableDocument {
  const sections: SectionBlock[] = [];
  const areaStats = calculateAreaStats(group);

  // Area stats
  sections.push(
    paragraph(
      `**${areaStats.totalRules} rules** from ${areaStats.totalFeatures} features. ` +
        `${areaStats.withInvariants} rules have explicit invariants.`
    )
  );
  sections.push(separator());

  // Sort phases
  const sortedPhases = sortPhaseEntries([...group.phases.entries()]);

  for (const [phaseKey, features] of sortedPhases) {
    const sortedFeatures = [...features].sort((a, b) => a.featureName.localeCompare(b.featureName));

    // Render features for this phase
    const phaseContent: SectionBlock[] = [];
    for (const feature of sortedFeatures) {
      phaseContent.push(...renderFeatureWithRules(feature, options));
    }

    // Always render flat — file-level split by product area is sufficient disclosure
    sections.push(heading(2, phaseKey));
    sections.push(...phaseContent);

    sections.push(separator());
  }

  // Back link
  sections.push(linkOut('\u2190 Back to Business Rules', '../BUSINESS-RULES.md'));

  return document(`${group.displayName} Business Rules`, sections, {
    purpose: `Business rules for the ${group.displayName} product area`,
  });
}

/**
 * Sort phase entries: numeric phases first (ascending), then releases, then uncategorized
 */
function sortPhaseEntries(
  entries: Array<[string, FeatureWithRules[]]>
): Array<[string, FeatureWithRules[]]> {
  return entries.sort(([a], [b]) => {
    const aNum = extractPhaseNumber(a);
    const bNum = extractPhaseNumber(b);

    if (aNum !== null && bNum !== null) {
      return aNum - bNum;
    }
    if (aNum !== null) return -1;
    if (bNum !== null) return 1;
    return a.localeCompare(b);
  });
}

/**
 * Extract phase number from phase key (e.g., "Phase 21" → 21)
 */
function extractPhaseNumber(phaseKey: string): number | null {
  const pattern = /^Phase\s+(\d+)$/;
  const match = pattern.exec(phaseKey);
  if (match?.[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Feature Rendering
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Render a feature with its rules inline.
 *
 * All rules render flat — Rule title + Invariant + Rationale are essential
 * business knowledge and must never be hidden behind collapsible blocks.
 * Progressive disclosure happens at the file level (split by product area).
 */
function renderFeatureWithRules(
  feature: FeatureWithRules,
  options: Required<BusinessRulesCodecOptions>
): SectionBlock[] {
  const sections: SectionBlock[] = [];
  const isDetailed = options.detailLevel === 'detailed';

  // Feature heading (H3) — humanized from camelCase pattern name
  sections.push(heading(3, humanizeFeatureName(feature.featureName)));

  // Feature description
  if (feature.featureDescription) {
    sections.push(paragraph(`*${feature.featureDescription}*`));
  }

  // Render each rule flat — no collapsible wrapping
  for (const ruleCtx of feature.rules) {
    sections.push(...renderRuleInline(ruleCtx, options, isDetailed));
  }

  // Source file path as italic text (informational, not a link — paths are
  // relative to the feature repo root and don't resolve from docs-generated/)
  if (options.includeSource) {
    const sourceFile = feature.pattern.source.file;
    sections.push(paragraph(`*${extractSourceName(sourceFile)}*`));
  }

  return sections;
}

/**
 * Render a single rule inline with its annotations.
 *
 * Each rule is preceded by a separator. Invariant + Rationale are combined
 * into a blockquote "constraint card" for visual emphasis. Verified-by is
 * rendered as a checkbox list for scanability. Scenario names from the
 * Rule block are deduplicated against explicit **Verified by:** annotations.
 */
function renderRuleInline(
  ruleCtx: RuleWithContext,
  options: Required<BusinessRulesCodecOptions>,
  isDetailed: boolean
): SectionBlock[] {
  const sections: SectionBlock[] = [];
  const { rule, annotations } = ruleCtx;

  // Visual separator before each rule
  sections.push(separator());

  // Rule name as H4 heading
  sections.push(heading(4, rule.name));

  // Constraint card: blockquote combining Invariant + Rationale
  const cardLines: string[] = [];

  if (annotations.invariant) {
    cardLines.push(`> **Invariant:** ${annotations.invariant}`);
  }

  if (options.includeRationale && annotations.rationale) {
    cardLines.push(`> **Rationale:** ${annotations.rationale}`);
  }

  if (cardLines.length > 0) {
    sections.push(paragraph(cardLines.join('\n>\n')));
  } else if (annotations.remainingContent) {
    // Fallback first-line stays as plain paragraph (not blockquoted)
    const firstLine = extractFirstSentence(annotations.remainingContent);
    if (firstLine) {
      sections.push(paragraph(firstLine));
    }
  }

  // Tables from rule description
  if (options.includeTables && rule.description) {
    const tableBlocks = extractTablesAsSectionBlocks(rule.description);
    for (const tableBlock of tableBlocks) {
      sections.push(tableBlock);
    }
  }

  // Code examples (detailed mode only, or if explicitly enabled)
  if ((isDetailed || options.includeCodeExamples) && annotations.codeExamples) {
    for (const codeBlock of annotations.codeExamples) {
      sections.push(codeBlock);
    }
  }

  // Verified-by as compact bullet list (label + items in one block, no blank line gap)
  if (options.includeVerifiedBy) {
    const names = deduplicateScenarioNames(rule.scenarioNames, annotations.verifiedBy);
    if (names.length > 0) {
      const bullets = names.map((name) => `- ${name}`).join('\n');
      sections.push(paragraph(`**Verified by:**\n${bullets}`));
    }
  }

  // API implementation references
  if (annotations.apiRefs && annotations.apiRefs.length > 0) {
    const refList = annotations.apiRefs.map((ref) => `\`${ref}\``).join(', ');
    sections.push(paragraph(`**Implementation:** ${refList}`));
  }

  // Placeholder only when there is truly no content
  if (
    !annotations.invariant &&
    !annotations.remainingContent &&
    !annotations.rationale &&
    rule.scenarioNames.length === 0
  ) {
    sections.push(paragraph('*No invariant or description specified.*'));
  }

  return sections;
}

// ═══════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Humanize a camelCase/PascalCase feature name for display.
 *
 * Inserts spaces at camelCase boundaries and strips common suffixes
 * like "Testing" that don't add value in business rules context.
 *
 * Examples:
 * - ConfigResolution → Config Resolution
 * - RichContentHelpersTesting → Rich Content Helpers
 * - ProcessGuardTesting → Process Guard
 * - ContextInference → Context Inference
 */
function humanizeFeatureName(name: string): string {
  return camelCaseToTitleCase(name).replace(/\s*Testing$/i, '');
}

/**
 * Deduplicate scenario names from Rule block and **Verified by:** annotation.
 *
 * Uses case-insensitive comparison to catch near-duplicates like
 * "Standard level includes source link-out" vs "Standard level includes source link-out".
 */
export function deduplicateScenarioNames(
  scenarioNames: readonly string[],
  verifiedBy: readonly string[] | undefined
): string[] {
  const seen = new Map<string, string>(); // lowercase → original
  for (const name of scenarioNames) {
    const key = name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.set(key, name);
    }
  }
  if (verifiedBy) {
    for (const name of verifiedBy) {
      const key = name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, name);
      }
    }
  }
  return [...seen.values()];
}

function formatProductAreaName(productArea: string): string {
  return camelCaseToTitleCase(productArea);
}

/**
 * Extract a clean source name from file path
 */
function extractSourceName(filePath: string): string {
  const pattern = /([^/]+)\.feature$/;
  const match = pattern.exec(filePath);
  if (match?.[1]) {
    return match[1] + '.feature';
  }
  return filePath;
}
