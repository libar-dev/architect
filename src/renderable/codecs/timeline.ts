/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern TimelineCodec
 * @libar-docs-status completed
 *
 * ## Timeline Document Codec
 *
 * Transforms MasterDataset into RenderableDocuments for timeline outputs:
 * - ROADMAP.md (phase breakdown with progress)
 * - COMPLETED-MILESTONES.md (historical completed phases)
 *
 * ### Factory Pattern
 *
 * Use factory functions for custom options:
 * ```typescript
 * const codec = createRoadmapCodec({ generateDetailFiles: false });
 * const doc = codec.decode(dataset);
 * ```
 */

import { z } from "zod";
import {
  MasterDatasetSchema,
  type MasterDataset,
  type PhaseGroup,
} from "../../validation-schemas/master-dataset.js";
import type { ExtractedPattern } from "../../validation-schemas/index.js";
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
} from "../schema.js";
import { normalizeStatus } from "../../taxonomy/index.js";
import {
  getStatusEmoji,
  getDisplayName,
  extractSummary,
  completionPercentage,
  renderProgressBar,
  sortByPhaseAndName,
  formatBusinessValue,
  groupBy,
} from "../utils.js";
import { toKebabCase } from "../../utils/index.js";
import {
  type BaseCodecOptions,
  type NormalizedStatusFilter,
  DEFAULT_BASE_OPTIONS,
  mergeOptions,
} from "./types/base.js";

// ═══════════════════════════════════════════════════════════════════════════
// Timeline Codec Options (co-located with codecs)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Options for RoadmapDocumentCodec
 */
export interface RoadmapCodecOptions extends BaseCodecOptions {
  /** Filter by status (default: all statuses). Uses normalized status values. */
  filterStatus?: NormalizedStatusFilter[];

  /** Include process metadata (quarter, effort, team) (default: true) */
  includeProcess?: boolean;

  /** Include deliverables in phase details (default: true) */
  includeDeliverables?: boolean;

  /** Filter by specific phases (default: all phases) */
  filterPhases?: number[];
}

/**
 * Default options for RoadmapDocumentCodec
 */
export const DEFAULT_ROADMAP_OPTIONS: Required<RoadmapCodecOptions> = {
  ...DEFAULT_BASE_OPTIONS,
  filterStatus: [],
  includeProcess: true,
  includeDeliverables: true,
  filterPhases: [],
};

/**
 * Options for CompletedMilestonesCodec
 */
export interface CompletedMilestonesCodecOptions extends BaseCodecOptions {
  /** Filter by quarters (default: all quarters) */
  filterQuarters?: string[];

  /** Include deliverables (default: true) */
  includeDeliverables?: boolean;

  /** Show links to related patterns (default: true) */
  includeLinks?: boolean;
}

/**
 * Default options for CompletedMilestonesCodec
 */
export const DEFAULT_MILESTONES_OPTIONS: Required<CompletedMilestonesCodecOptions> = {
  ...DEFAULT_BASE_OPTIONS,
  filterQuarters: [],
  includeDeliverables: true,
  includeLinks: true,
};

/**
 * Options for CurrentWorkCodec
 */
export interface CurrentWorkCodecOptions extends BaseCodecOptions {
  /** Include deliverables (default: true) */
  includeDeliverables?: boolean;

  /** Include process metadata (default: true) */
  includeProcess?: boolean;
}

/**
 * Default options for CurrentWorkCodec
 */
export const DEFAULT_CURRENT_WORK_OPTIONS: Required<CurrentWorkCodecOptions> = {
  ...DEFAULT_BASE_OPTIONS,
  includeDeliverables: true,
  includeProcess: true,
};
import { RenderableDocumentOutputSchema } from "./shared-schema.js";
import { renderAcceptanceCriteria, renderBusinessRulesSection } from "./helpers.js";

// ═══════════════════════════════════════════════════════════════════════════
// Roadmap Document Codec
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a RoadmapDocumentCodec with custom options.
 *
 * @param options - Codec configuration options
 * @returns Configured Zod codec
 *
 * @example
 * ```typescript
 * // Disable detail files for summary output
 * const codec = createRoadmapCodec({ generateDetailFiles: false });
 *
 * // Filter to specific phases
 * const codec = createRoadmapCodec({ filterPhases: [1, 2, 3] });
 * ```
 */
export function createRoadmapCodec(
  options?: RoadmapCodecOptions
): z.ZodCodec<typeof MasterDatasetSchema, typeof RenderableDocumentOutputSchema> {
  const opts = mergeOptions(DEFAULT_ROADMAP_OPTIONS, options);

  return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
    decode: (dataset: MasterDataset): RenderableDocument => {
      return buildRoadmapDocument(dataset, opts);
    },
    /** @throws Always - this codec is decode-only. See zod-codecs.md */
    encode: (): never => {
      throw new Error("RoadmapDocumentCodec is decode-only. See zod-codecs.md");
    },
  });
}

/**
 * Default Roadmap Document Codec
 *
 * Transforms MasterDataset → RenderableDocument for roadmap view.
 * Shows phases with progress, patterns grouped by phase.
 */
export const RoadmapDocumentCodec = createRoadmapCodec();

/**
 * Create a CompletedMilestonesCodec with custom options.
 *
 * @param options - Codec configuration options
 * @returns Configured Zod codec
 *
 * @example
 * ```typescript
 * // Filter to specific quarters
 * const codec = createMilestonesCodec({ filterQuarters: ["Q1-2025"] });
 * ```
 */
export function createMilestonesCodec(
  options?: CompletedMilestonesCodecOptions
): z.ZodCodec<typeof MasterDatasetSchema, typeof RenderableDocumentOutputSchema> {
  const opts = mergeOptions(DEFAULT_MILESTONES_OPTIONS, options);

  return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
    decode: (dataset: MasterDataset): RenderableDocument => {
      return buildCompletedMilestonesDocument(dataset, opts);
    },
    /** @throws Always - this codec is decode-only. See zod-codecs.md */
    encode: (): never => {
      throw new Error("CompletedMilestonesCodec is decode-only. See zod-codecs.md");
    },
  });
}

/**
 * Default Completed Milestones Document Codec
 *
 * Transforms MasterDataset → RenderableDocument for completed milestones.
 * Shows historical completed phases and patterns.
 */
export const CompletedMilestonesCodec = createMilestonesCodec();

/**
 * Create a CurrentWorkCodec with custom options.
 *
 * @param options - Codec configuration options
 * @returns Configured Zod codec
 *
 * @example
 * ```typescript
 * // Disable deliverables in output
 * const codec = createCurrentWorkCodec({ includeDeliverables: false });
 *
 * // Compact output without detail files
 * const codec = createCurrentWorkCodec({ generateDetailFiles: false });
 * ```
 */
export function createCurrentWorkCodec(
  options?: CurrentWorkCodecOptions
): z.ZodCodec<typeof MasterDatasetSchema, typeof RenderableDocumentOutputSchema> {
  const opts = mergeOptions(DEFAULT_CURRENT_WORK_OPTIONS, options);

  return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
    decode: (dataset: MasterDataset): RenderableDocument => {
      return buildCurrentWorkDocument(dataset, opts);
    },
    /** @throws Always - this codec is decode-only. See zod-codecs.md */
    encode: (): never => {
      throw new Error("CurrentWorkCodec is decode-only. See zod-codecs.md");
    },
  });
}

/**
 * Default Current Work Document Codec
 *
 * Transforms MasterDataset → RenderableDocument for current work.
 * Shows active phases with deliverables and progress tracking.
 */
export const CurrentWorkCodec = createCurrentWorkCodec();

// ═══════════════════════════════════════════════════════════════════════════
// Roadmap Document Builder
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build roadmap document
 */
function buildRoadmapDocument(
  dataset: MasterDataset,
  options: Required<RoadmapCodecOptions>
): RenderableDocument {
  const sections: SectionBlock[] = [];

  // 1. Overall progress summary
  sections.push(...buildOverallProgress(dataset));

  // 2. Phase navigation table (links to detail files)
  sections.push(...buildPhaseNavigationTable(dataset, options));

  // 3. Phase summaries (inline)
  sections.push(...buildPhaseBreakdown(dataset));

  // 4. Quarterly timeline (if quarters exist)
  if (Object.keys(dataset.byQuarter).length > 0) {
    sections.push(...buildQuarterlyTimeline(dataset));
  }

  // Build phase detail files (if enabled)
  const additionalFiles = options.generateDetailFiles
    ? buildPhaseDetailFiles(dataset, options)
    : {};

  const docOpts: {
    purpose: string;
    detailLevel: string;
    additionalFiles?: Record<string, RenderableDocument>;
  } = {
    purpose: "Track implementation progress by phase",
    detailLevel: options.generateDetailFiles
      ? "Phase summaries with links to details"
      : "Compact summary",
  };

  if (Object.keys(additionalFiles).length > 0) {
    docOpts.additionalFiles = additionalFiles;
  }

  return document("Development Roadmap", sections, docOpts);
}

/**
 * Build overall progress section
 */
function buildOverallProgress(dataset: MasterDataset): SectionBlock[] {
  const { counts, phaseCount } = dataset;
  const progress = completionPercentage(counts);
  const progressBar = renderProgressBar(counts.completed, counts.total, 20);

  // Count completed phases
  const completedPhases = dataset.byPhase.filter(
    (p) => p.counts.total > 0 && p.counts.completed === p.counts.total
  ).length;

  return [
    heading(2, "Overall Progress"),
    paragraph(`**Patterns:** ${progressBar} (${progress}%)`),
    paragraph(`**Phases:** ${completedPhases}/${phaseCount} complete`),
    table(
      ["Metric", "Value"],
      [
        ["Total Patterns", String(counts.total)],
        ["Completed", String(counts.completed)],
        ["Active", String(counts.active)],
        ["Planned", String(counts.planned)],
      ]
    ),
    separator(),
  ];
}

/**
 * Build phase breakdown section
 */
function buildPhaseBreakdown(dataset: MasterDataset): SectionBlock[] {
  const sections: SectionBlock[] = [];

  sections.push(heading(2, "Phases"));

  // Sort phases by number
  const sortedPhases = [...dataset.byPhase].sort((a, b) => a.phaseNumber - b.phaseNumber);

  for (const phase of sortedPhases) {
    sections.push(...buildPhaseSection(phase));
  }

  return sections;
}

/**
 * Build a single phase section
 */
function buildPhaseSection(phase: PhaseGroup): SectionBlock[] {
  const sections: SectionBlock[] = [];
  const { phaseNumber, phaseName, patterns, counts } = phase;

  const displayName = phaseName ?? `Phase ${phaseNumber}`;
  const progress = completionPercentage(counts);
  const progressBar = renderProgressBar(counts.completed, counts.total, 15);
  const isComplete = counts.total > 0 && counts.completed === counts.total;

  // Phase header with progress
  const statusEmoji = isComplete ? "✅" : counts.active > 0 ? "🚧" : "📋";
  sections.push(heading(3, `${statusEmoji} ${displayName}`));
  sections.push(paragraph(`${progressBar} ${progress}% complete`));

  // Pattern table for this phase
  const sortedPatterns = sortByPhaseAndName([...patterns]);
  const rows = sortedPatterns.map((p) => {
    const emoji = getStatusEmoji(p.status);
    const name = getDisplayName(p);
    const status = normalizeStatus(p.status);
    const summary = extractSummary(p.directive.description, p.patternName);
    return [`${emoji} ${name}`, status, summary || "-"];
  });

  sections.push(table(["Pattern", "Status", "Description"], rows), separator());

  return sections;
}

/**
 * Build quarterly timeline section
 */
function buildQuarterlyTimeline(dataset: MasterDataset): SectionBlock[] {
  const sections: SectionBlock[] = [];
  const quarters = Object.keys(dataset.byQuarter).sort();

  if (quarters.length === 0) {
    return [];
  }

  sections.push(heading(2, "Quarterly Timeline"));

  // Current quarter detection
  const now = new Date();
  const currentQuarter = `Q${Math.ceil((now.getMonth() + 1) / 3)}-${now.getFullYear()}`;

  const rows = quarters.map((quarter) => {
    const patterns = dataset.byQuarter[quarter] ?? [];
    const completed = patterns.filter((p) => normalizeStatus(p.status) === "completed").length;
    const isCurrent = quarter === currentQuarter;
    const marker = isCurrent ? " ← Current" : "";

    return [quarter + marker, String(patterns.length), String(completed)];
  });

  sections.push(table(["Quarter", "Total", "Completed"], rows), separator());

  return sections;
}

// ═══════════════════════════════════════════════════════════════════════════
// Roadmap Progressive Disclosure
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build phase navigation table with links to detail files
 */
function buildPhaseNavigationTable(
  dataset: MasterDataset,
  options: Required<RoadmapCodecOptions>
): SectionBlock[] {
  const sections: SectionBlock[] = [];
  const sortedPhases = [...dataset.byPhase].sort((a, b) => a.phaseNumber - b.phaseNumber);

  if (sortedPhases.length === 0) {
    return [];
  }

  sections.push(heading(2, "Phase Navigation"));

  const rows = sortedPhases.map((phase) => {
    const { phaseNumber, phaseName, counts } = phase;
    const displayName = phaseName ?? `Phase ${phaseNumber}`;
    const progress = completionPercentage(counts);
    const isComplete = counts.total > 0 && counts.completed === counts.total;
    const statusEmoji = isComplete ? "✅" : counts.active > 0 ? "🚧" : "📋";
    const slug = getPhaseSlug(phaseNumber, phaseName);

    // Link to detail file if generating detail files, otherwise just display name
    const nameCell = options.generateDetailFiles
      ? `${statusEmoji} [${displayName}](phases/${slug}.md)`
      : `${statusEmoji} ${displayName}`;

    return [nameCell, `${counts.completed}/${counts.total}`, `${progress}%`];
  });

  sections.push(table(["Phase", "Progress", "Complete"], rows), separator());

  return sections;
}

/**
 * Generate slug for phase detail file
 *
 * Produces readable slugs with proper word separation:
 * - Phase 14 "DeciderPattern" → "phase-14-decider-pattern"
 * - Phase 19 "BddTestingInfrastructure" → "phase-19-bdd-testing-infrastructure"
 * - Phase 5 (no name) → "phase-5-unnamed"
 *
 * @param phaseNumber - The phase number
 * @param phaseName - Optional phase name (typically CamelCase)
 * @returns URL-safe slug for the phase
 *
 * @internal Exported for testing - not part of public API
 */
export function getPhaseSlug(phaseNumber: number, phaseName: string | undefined): string {
  const paddedPhase = String(phaseNumber).padStart(2, "0");
  const namePart = phaseName ? toKebabCase(phaseName) : "unnamed";
  return `phase-${paddedPhase}-${namePart}`;
}

/**
 * Build phase detail files (progressive disclosure)
 */
function buildPhaseDetailFiles(
  dataset: MasterDataset,
  options: Required<RoadmapCodecOptions>
): Record<string, RenderableDocument> {
  const files: Record<string, RenderableDocument> = {};
  let sortedPhases = [...dataset.byPhase].sort((a, b) => a.phaseNumber - b.phaseNumber);

  // Apply phase filter if specified
  if (options.filterPhases.length > 0) {
    sortedPhases = sortedPhases.filter((p) => options.filterPhases.includes(p.phaseNumber));
  }

  for (const phase of sortedPhases) {
    if (phase.patterns.length === 0) continue;

    const slug = getPhaseSlug(phase.phaseNumber, phase.phaseName);
    files[`phases/${slug}.md`] = buildPhaseDetailDocument(phase, options);
  }

  return files;
}

/**
 * Build a single phase detail document
 */
function buildPhaseDetailDocument(
  phase: PhaseGroup,
  _options: Required<RoadmapCodecOptions>
): RenderableDocument {
  const sections: SectionBlock[] = [];
  const { phaseNumber, phaseName, patterns, counts } = phase;
  const displayName = phaseName ?? `Phase ${phaseNumber}`;

  // Summary
  const progress = completionPercentage(counts);
  const progressBar = renderProgressBar(counts.completed, counts.total, 20);

  sections.push(
    heading(2, "Summary"),
    paragraph(`**Progress:** ${progressBar} (${progress}%)`),
    table(
      ["Status", "Count"],
      [
        ["✅ Completed", String(counts.completed)],
        ["🚧 Active", String(counts.active)],
        ["📋 Planned", String(counts.planned)],
        ["**Total**", String(counts.total)],
      ]
    ),
    separator()
  );

  // Patterns by status
  const completed = patterns.filter((p) => normalizeStatus(p.status) === "completed");
  const active = patterns.filter((p) => normalizeStatus(p.status) === "active");
  const planned = patterns.filter((p) => normalizeStatus(p.status) === "planned");

  if (active.length > 0) {
    sections.push(heading(2, "🚧 Active Patterns"));
    sections.push(...buildPatternDetailList(active));
  }

  if (planned.length > 0) {
    sections.push(heading(2, "📋 Planned Patterns"));
    sections.push(...buildPatternDetailList(planned));
  }

  if (completed.length > 0) {
    sections.push(heading(2, "✅ Completed Patterns"));
    sections.push(...buildPatternDetailList(completed));
  }

  // Back link
  sections.push(linkOut("← Back to Roadmap", "../ROADMAP.md"));

  return document(displayName, sections, {
    purpose: `Detailed patterns for ${displayName}`,
  });
}

/**
 * Build detailed pattern list for phase detail files
 */
function buildPatternDetailList(patterns: ExtractedPattern[]): SectionBlock[] {
  const sections: SectionBlock[] = [];
  const sorted = sortByPhaseAndName([...patterns]);

  for (const pattern of sorted) {
    const emoji = getStatusEmoji(pattern.status);
    const name = getDisplayName(pattern);

    sections.push(heading(3, `${emoji} ${name}`));

    // Metadata table
    const metaRows: string[][] = [["Status", normalizeStatus(pattern.status)]];

    if (pattern.effort) {
      metaRows.push(["Effort", pattern.effort]);
    }

    if (pattern.quarter) {
      metaRows.push(["Quarter", pattern.quarter]);
    }

    const businessValue = formatBusinessValue(pattern.businessValue);
    if (businessValue) {
      metaRows.push(["Business Value", businessValue]);
    }

    sections.push(table(["Property", "Value"], metaRows));

    // Description
    if (pattern.directive.description) {
      sections.push(paragraph(pattern.directive.description));
    }

    // Dependencies
    if (pattern.dependsOn && pattern.dependsOn.length > 0) {
      sections.push(
        heading(4, "Dependencies"),
        list(pattern.dependsOn.map((d) => `Depends on: ${d}`))
      );
    }

    if (pattern.enables && pattern.enables.length > 0) {
      sections.push(heading(4, "Enables"), list(pattern.enables.map((e) => `Enables: ${e}`)));
    }

    // Use cases
    if (pattern.useCases && pattern.useCases.length > 0) {
      sections.push(heading(4, "Use Cases"), list([...pattern.useCases]));
    }

    // Acceptance Criteria (scenarios with steps, DataTables, DocStrings)
    sections.push(...renderAcceptanceCriteria(pattern.scenarios));

    // Business Rules (from Gherkin Rule: keyword)
    sections.push(...renderBusinessRulesSection(pattern.rules));

    sections.push(separator());
  }

  return sections;
}

// ═══════════════════════════════════════════════════════════════════════════
// Completed Milestones Document Builder
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build completed milestones document
 */
function buildCompletedMilestonesDocument(
  dataset: MasterDataset,
  options: Required<CompletedMilestonesCodecOptions>
): RenderableDocument {
  const sections: SectionBlock[] = [];

  // Get completed patterns
  let completedPatterns = dataset.byStatus.completed;

  // Apply quarter filter if specified
  if (options.filterQuarters.length > 0) {
    completedPatterns = completedPatterns.filter(
      (p) => p.quarter !== undefined && options.filterQuarters.includes(p.quarter)
    );
  }

  if (completedPatterns.length === 0) {
    sections.push(
      heading(2, "No Completed Milestones"),
      paragraph("No patterns have been completed yet.")
    );

    return document("Completed Milestones", sections, {
      purpose: "Historical record of completed work",
    });
  }

  // 1. Summary
  sections.push(...buildCompletedSummary(dataset, completedPatterns));

  // 2. Quarterly navigation table (links to detail files)
  sections.push(...buildQuarterlyNavigationTable(dataset, completedPatterns, options));

  // 3. Completed phases
  sections.push(...buildCompletedPhases(dataset));

  // 4. Recent completions (limit from options)
  const recentLimit = options.limits.recentItems;
  sections.push(...buildRecentCompletions(completedPatterns, recentLimit));

  // Build quarterly detail files (if enabled)
  const additionalFiles = options.generateDetailFiles
    ? buildQuarterlyMilestoneFiles(dataset, completedPatterns, options)
    : {};

  const docOpts: {
    purpose: string;
    detailLevel: string;
    additionalFiles?: Record<string, RenderableDocument>;
  } = {
    purpose: "Historical record of completed work",
    detailLevel: options.generateDetailFiles
      ? "Quarterly summaries with links to details"
      : "Compact summary",
  };

  if (Object.keys(additionalFiles).length > 0) {
    docOpts.additionalFiles = additionalFiles;
  }

  return document("Completed Milestones", sections, docOpts);
}

/**
 * Build completed summary section
 */
function buildCompletedSummary(
  dataset: MasterDataset,
  completedPatterns: ExtractedPattern[]
): SectionBlock[] {
  const completedPhases = dataset.byPhase.filter(
    (p) => p.counts.total > 0 && p.counts.completed === p.counts.total
  ).length;

  return [
    heading(2, "Summary"),
    table(
      ["Metric", "Value"],
      [
        ["Completed Patterns", String(completedPatterns.length)],
        ["Completed Phases", String(completedPhases)],
        ["Total Phases", String(dataset.phaseCount)],
      ]
    ),
    separator(),
  ];
}

/**
 * Build completed phases section
 */
function buildCompletedPhases(dataset: MasterDataset): SectionBlock[] {
  const sections: SectionBlock[] = [];

  // Filter to fully completed phases
  const completedPhases = dataset.byPhase.filter(
    (p) => p.counts.total > 0 && p.counts.completed === p.counts.total
  );

  if (completedPhases.length === 0) {
    return [];
  }

  sections.push(heading(2, "Completed Phases"));

  for (const phase of completedPhases.sort((a, b) => a.phaseNumber - b.phaseNumber)) {
    const displayName = phase.phaseName ?? `Phase ${phase.phaseNumber}`;

    // Use collapsible for phase details
    const phaseContent: SectionBlock[] = [];

    const rows = phase.patterns.map((p) => {
      const name = getDisplayName(p);
      const summary = extractSummary(p.directive.description, p.patternName);
      return [name, summary || "-"];
    });

    phaseContent.push(table(["Pattern", "Description"], rows));

    sections.push(collapsible(`✅ ${displayName} (${phase.counts.total} patterns)`, phaseContent));
  }

  sections.push(separator());

  return sections;
}

// ═══════════════════════════════════════════════════════════════════════════
// Completed Milestones Progressive Disclosure
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build quarterly navigation table with links to detail files
 */
function buildQuarterlyNavigationTable(
  _dataset: MasterDataset,
  completedPatterns: ExtractedPattern[],
  options: Required<CompletedMilestonesCodecOptions>
): SectionBlock[] {
  const sections: SectionBlock[] = [];

  // Group completed patterns by quarter
  const byQuarter = groupBy(
    completedPatterns.filter((p) => p.quarter),
    (p) => p.quarter ?? ""
  );

  if (byQuarter.size === 0) {
    return [];
  }

  sections.push(heading(2, "Quarterly Navigation"));

  const quarters = [...byQuarter.keys()].sort().reverse(); // Most recent first

  const rows = quarters.map((quarter) => {
    const patterns = byQuarter.get(quarter) ?? [];
    // Link to detail file if generating detail files
    const quarterCell = options.generateDetailFiles
      ? `[${quarter}](milestones/${quarter}.md)`
      : quarter;
    return [quarterCell, String(patterns.length)];
  });

  sections.push(table(["Quarter", "Completed"], rows), separator());

  return sections;
}

/**
 * Build recent completions section
 */
function buildRecentCompletions(patterns: ExtractedPattern[], limit = 10): SectionBlock[] {
  const sections: SectionBlock[] = [];

  // Get most recent patterns (assume last added = most recent)
  const recent = [...patterns].slice(-limit).reverse();

  if (recent.length === 0) {
    return [];
  }

  sections.push(heading(2, "Recent Completions"));

  const items = recent.map((p) => {
    const name = getDisplayName(p);
    const phase = p.phase !== undefined ? ` (Phase ${p.phase})` : "";
    const quarter = p.quarter ? ` - ${p.quarter}` : "";
    return `✅ ${name}${phase}${quarter}`;
  });

  sections.push(list(items));

  if (patterns.length > limit) {
    sections.push(
      paragraph(
        `Showing ${limit} of ${patterns.length} completed patterns. See quarterly files for full history.`
      )
    );
  }

  sections.push(separator());

  return sections;
}

/**
 * Build quarterly milestone detail files (progressive disclosure)
 */
function buildQuarterlyMilestoneFiles(
  dataset: MasterDataset,
  completedPatterns: ExtractedPattern[],
  _options: Required<CompletedMilestonesCodecOptions>
): Record<string, RenderableDocument> {
  const files: Record<string, RenderableDocument> = {};

  // Group completed patterns by quarter
  const byQuarter = groupBy(
    completedPatterns.filter((p) => p.quarter),
    (p) => p.quarter ?? ""
  );

  for (const [quarter, patterns] of byQuarter.entries()) {
    if (patterns.length === 0) continue;

    files[`milestones/${quarter}.md`] = buildQuarterDetailDocument(quarter, patterns, dataset);
  }

  return files;
}

/**
 * Build a single quarterly detail document
 */
function buildQuarterDetailDocument(
  quarter: string,
  patterns: ExtractedPattern[],
  dataset: MasterDataset
): RenderableDocument {
  const sections: SectionBlock[] = [];

  // Summary
  sections.push(
    heading(2, "Summary"),
    table(
      ["Metric", "Value"],
      [
        ["Completed in Quarter", String(patterns.length)],
        ["Quarter", quarter],
      ]
    ),
    separator()
  );

  // Group by phase
  const byPhase = groupBy(patterns, (p) => p.phase ?? 0);
  const sortedPhases = [...byPhase.keys()].sort((a, b) => a - b);

  if (sortedPhases.length > 0) {
    sections.push(heading(2, "By Phase"));

    for (const phaseNum of sortedPhases) {
      const phasePatterns = byPhase.get(phaseNum) ?? [];
      const phaseGroup = dataset.byPhase.find((p) => p.phaseNumber === phaseNum);
      const displayName = phaseGroup?.phaseName ?? `Phase ${phaseNum}`;

      const phaseContent: SectionBlock[] = [];

      const rows = sortByPhaseAndName([...phasePatterns]).map((p) => {
        const name = getDisplayName(p);
        const summary = extractSummary(p.directive.description, p.patternName);
        const businessValue = formatBusinessValue(p.businessValue);
        return [name, summary || "-", businessValue || "-"];
      });

      phaseContent.push(table(["Pattern", "Description", "Business Value"], rows));

      sections.push(collapsible(`✅ ${displayName} (${phasePatterns.length})`, phaseContent));
    }

    sections.push(separator());
  }

  // All patterns in quarter
  sections.push(heading(2, "All Patterns"));

  const rows = sortByPhaseAndName([...patterns]).map((p) => {
    const name = getDisplayName(p);
    const phase = p.phase !== undefined ? `Phase ${p.phase}` : "-";
    const summary = extractSummary(p.directive.description, p.patternName);
    return [`✅ ${name}`, phase, summary || "-"];
  });

  sections.push(table(["Pattern", "Phase", "Description"], rows), separator());

  // Back link
  sections.push(linkOut("← Back to Completed Milestones", "../COMPLETED-MILESTONES.md"));

  return document(`${quarter} Milestones`, sections, {
    purpose: `Completed patterns for ${quarter}`,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Current Work Document Builder
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build current work document
 *
 * Filters to active patterns only and shows:
 * - Progress summary for active work
 * - Phases with active patterns
 * - Deliverables (if configured)
 */
function buildCurrentWorkDocument(
  dataset: MasterDataset,
  options: Required<CurrentWorkCodecOptions>
): RenderableDocument {
  const sections: SectionBlock[] = [];

  // Get active patterns only
  const activePatterns = dataset.byStatus.active;

  if (activePatterns.length === 0) {
    sections.push(
      heading(2, "No Active Work"),
      paragraph("No patterns are currently in progress.")
    );

    return document("Current Work", sections, {
      purpose: "Active development work currently in progress",
    });
  }

  // 1. Summary of active work
  sections.push(...buildCurrentWorkSummary(dataset, activePatterns));

  // 2. Active phases with patterns
  sections.push(...buildActivePhases(dataset, options));

  // 3. All active patterns table
  sections.push(...buildActivePatternsList(activePatterns, options));

  // Build phase detail files (if enabled and phases have active work)
  const additionalFiles = options.generateDetailFiles
    ? buildCurrentWorkDetailFiles(dataset, options)
    : {};

  const docOpts: {
    purpose: string;
    detailLevel: string;
    additionalFiles?: Record<string, RenderableDocument>;
  } = {
    purpose: "Active development work currently in progress",
    detailLevel: options.generateDetailFiles
      ? "Phase summaries with links to details"
      : "Compact summary",
  };

  if (Object.keys(additionalFiles).length > 0) {
    docOpts.additionalFiles = additionalFiles;
  }

  return document("Current Work", sections, docOpts);
}

/**
 * Build current work summary section
 */
function buildCurrentWorkSummary(
  dataset: MasterDataset,
  activePatterns: ExtractedPattern[]
): SectionBlock[] {
  // Count phases with active work
  const activePhasesCount = dataset.byPhase.filter((p) => p.counts.active > 0).length;

  // Calculate overall progress (from total dataset)
  const { counts } = dataset;
  const progress = completionPercentage(counts);
  const progressBar = renderProgressBar(counts.completed, counts.total, 20);

  return [
    heading(2, "Summary"),
    paragraph(`**Overall Progress:** ${progressBar} (${progress}%)`),
    table(
      ["Metric", "Value"],
      [
        ["Total Patterns", String(counts.total)],
        ["Completed", String(counts.completed)],
        ["Active", String(counts.active)],
        ["Planned", String(counts.planned)],
        ["Active Phases", String(activePhasesCount)],
      ]
    ),
    separator(),
  ];
}

/**
 * Build active phases section
 */
function buildActivePhases(
  dataset: MasterDataset,
  options: Required<CurrentWorkCodecOptions>
): SectionBlock[] {
  const sections: SectionBlock[] = [];

  // Filter to phases with active patterns
  const activePhasesData = dataset.byPhase
    .filter((p) => p.counts.active > 0)
    .sort((a, b) => a.phaseNumber - b.phaseNumber);

  if (activePhasesData.length === 0) {
    return [];
  }

  sections.push(heading(2, "Active Phases"));

  for (const phase of activePhasesData) {
    const { phaseNumber, phaseName, patterns, counts } = phase;
    const displayName = phaseName ?? `Phase ${phaseNumber}`;

    // Only show active patterns in this phase
    const activeInPhase = patterns.filter((p) => normalizeStatus(p.status) === "active");
    const progress = completionPercentage(counts);
    const progressBar = renderProgressBar(counts.completed, counts.total, 15);

    sections.push(heading(3, `🚧 ${displayName}`));
    // Build status breakdown with all non-zero categories
    const statusParts = [`${counts.completed} done`, `${activeInPhase.length} active`];
    if (counts.planned > 0) statusParts.push(`${counts.planned} planned`);
    const statusText = statusParts.join(", ");
    sections.push(paragraph(`${progressBar} ${progress}% complete (${statusText})`));

    // Pattern table for active patterns in this phase
    const rows = sortByPhaseAndName([...activeInPhase]).map((p) => {
      const name = getDisplayName(p);
      const summary = extractSummary(p.directive.description, p.patternName);
      return [`🚧 ${name}`, summary || "-"];
    });

    sections.push(table(["Pattern", "Description"], rows));

    // Deliverables for active patterns (if configured)
    if (options.includeDeliverables) {
      const allDeliverables = activeInPhase.flatMap((p) => p.deliverables ?? []);
      if (allDeliverables.length > 0) {
        const deliverableItems = allDeliverables.map((d) => {
          const statusEmoji =
            d.status === "complete" ? "✅" : d.status === "in-progress" ? "🚧" : "📋";
          return `${statusEmoji} ${d.name}`;
        });
        sections.push(heading(4, "Deliverables"), list(deliverableItems));
      }
    }

    // Link to detail file
    if (options.generateDetailFiles) {
      const slug = getPhaseSlug(phaseNumber, phaseName);
      sections.push(linkOut(`View ${displayName} details →`, `current/${slug}.md`));
    }

    sections.push(separator());
  }

  return sections;
}

/**
 * Build all active patterns list
 */
function buildActivePatternsList(
  patterns: ExtractedPattern[],
  _options: Required<CurrentWorkCodecOptions>
): SectionBlock[] {
  const sorted = sortByPhaseAndName([...patterns]);

  const rows = sorted.map((p) => {
    const name = getDisplayName(p);
    const phase = p.phase !== undefined ? `Phase ${p.phase}` : "-";
    const effort = p.effort ?? "-";
    const summary = extractSummary(p.directive.description, p.patternName);
    return [`🚧 ${name}`, phase, effort, summary || "-"];
  });

  return [
    heading(2, "All Active Patterns"),
    table(["Pattern", "Phase", "Effort", "Description"], rows),
    separator(),
  ];
}

/**
 * Build current work detail files (progressive disclosure)
 */
function buildCurrentWorkDetailFiles(
  dataset: MasterDataset,
  options: Required<CurrentWorkCodecOptions>
): Record<string, RenderableDocument> {
  const files: Record<string, RenderableDocument> = {};

  // Only create detail files for phases with active patterns
  const activePhasesData = dataset.byPhase
    .filter((p) => p.counts.active > 0)
    .sort((a, b) => a.phaseNumber - b.phaseNumber);

  for (const phase of activePhasesData) {
    const slug = getPhaseSlug(phase.phaseNumber, phase.phaseName);
    files[`current/${slug}.md`] = buildCurrentPhaseDetailDocument(phase, dataset, options);
  }

  return files;
}

/**
 * Build detail document for an active phase
 */
function buildCurrentPhaseDetailDocument(
  phase: PhaseGroup,
  _dataset: MasterDataset,
  options: Required<CurrentWorkCodecOptions>
): RenderableDocument {
  const sections: SectionBlock[] = [];
  const { phaseNumber, phaseName, patterns, counts } = phase;
  const displayName = phaseName ?? `Phase ${phaseNumber}`;

  // Progress summary
  const progress = completionPercentage(counts);
  const progressBar = renderProgressBar(counts.completed, counts.total, 20);

  sections.push(
    heading(2, "Progress"),
    paragraph(`**Progress:** ${progressBar} (${progress}%)`),
    table(
      ["Status", "Count"],
      [
        ["✅ Completed", String(counts.completed)],
        ["🚧 Active", String(counts.active)],
        ["📋 Planned", String(counts.planned)],
        ["**Total**", String(counts.total)],
      ]
    ),
    separator()
  );

  // Active patterns detail
  const activePatterns = patterns.filter((p) => normalizeStatus(p.status) === "active");

  if (activePatterns.length > 0) {
    sections.push(heading(2, "🚧 Active Work"));

    for (const pattern of sortByPhaseAndName([...activePatterns])) {
      sections.push(...buildCurrentWorkPatternDetail(pattern, options));
    }
  }

  // Recently completed in this phase
  const completedPatterns = patterns.filter((p) => normalizeStatus(p.status) === "completed");
  if (completedPatterns.length > 0) {
    sections.push(heading(2, "✅ Recently Completed"));

    const rows = sortByPhaseAndName([...completedPatterns]).map((p) => {
      const name = getDisplayName(p);
      const summary = extractSummary(p.directive.description, p.patternName);
      return [`✅ ${name}`, summary || "-"];
    });

    sections.push(table(["Pattern", "Description"], rows));
    sections.push(separator());
  }

  // Upcoming in this phase
  const plannedPatterns = patterns.filter((p) => normalizeStatus(p.status) === "planned");
  if (plannedPatterns.length > 0) {
    const plannedContent: SectionBlock[] = [];
    const rows = sortByPhaseAndName([...plannedPatterns]).map((p) => {
      const name = getDisplayName(p);
      const effort = p.effort ?? "-";
      return [`📋 ${name}`, effort];
    });
    plannedContent.push(table(["Pattern", "Effort"], rows));

    sections.push(collapsible(`📋 Upcoming (${plannedPatterns.length})`, plannedContent));
    sections.push(separator());
  }

  // Back link
  sections.push(linkOut("← Back to Current Work", "../CURRENT-WORK.md"));

  return document(displayName, sections, {
    purpose: `Active work details for ${displayName}`,
  });
}

/**
 * Build detail section for a single active pattern
 */
function buildCurrentWorkPatternDetail(
  pattern: ExtractedPattern,
  options: Required<CurrentWorkCodecOptions>
): SectionBlock[] {
  const sections: SectionBlock[] = [];
  const name = getDisplayName(pattern);

  sections.push(heading(3, `🚧 ${name}`));

  // Metadata table
  const metaRows: string[][] = [];

  if (pattern.effort) {
    metaRows.push(["Effort", pattern.effort]);
  }

  if (pattern.quarter) {
    metaRows.push(["Quarter", pattern.quarter]);
  }

  const businessValue = formatBusinessValue(pattern.businessValue);
  if (businessValue) {
    metaRows.push(["Business Value", businessValue]);
  }

  if (metaRows.length > 0) {
    sections.push(table(["Property", "Value"], metaRows));
  }

  // Description
  if (pattern.directive.description) {
    sections.push(paragraph(pattern.directive.description));
  }

  // Deliverables (if configured)
  if (options.includeDeliverables && pattern.deliverables && pattern.deliverables.length > 0) {
    const deliverableItems = pattern.deliverables.map((d) => {
      const statusEmoji = d.status === "complete" ? "✅" : d.status === "in-progress" ? "🚧" : "📋";
      const statusText = d.status ? ` (${d.status})` : "";
      return `${statusEmoji} ${d.name}${statusText}`;
    });

    sections.push(heading(4, "Deliverables"), list(deliverableItems));
  }

  // Dependencies
  if (pattern.dependsOn && pattern.dependsOn.length > 0) {
    sections.push(
      heading(4, "Dependencies"),
      list(pattern.dependsOn.map((d) => `Depends on: ${d}`))
    );
  }

  // Use cases
  if (pattern.useCases && pattern.useCases.length > 0) {
    sections.push(heading(4, "Use Cases"), list([...pattern.useCases]));
  }

  // Acceptance Criteria (scenarios with steps, DataTables, DocStrings)
  sections.push(...renderAcceptanceCriteria(pattern.scenarios));

  // Business Rules (from Gherkin Rule: keyword)
  sections.push(...renderBusinessRulesSection(pattern.rules));

  sections.push(separator());

  return sections;
}
