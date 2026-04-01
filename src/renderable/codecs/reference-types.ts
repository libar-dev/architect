/**
 * @architect
 * @architect-pattern ReferenceCodec
 * @architect-status completed
 *
 * ## Reference Codec — Types and Shared Constants
 *
 * All type/interface definitions and shared constants used across the
 * ReferenceDocumentCodec module family.
 */

import type { SectionBlock } from '../schema.js';
import type { BaseCodecOptions, DetailLevel } from './types/base.js';
import type { ShapeSelector } from './shape-matcher.js';

// ============================================================================
// Shared Constants
// ============================================================================

/** Content source identifiers for hardcoded domain diagrams */
export const DIAGRAM_SOURCE_VALUES = [
  'fsm-lifecycle',
  'generation-pipeline',
  'master-dataset-views',
] as const;

/** Discriminated source type for DiagramScope.source */
export type DiagramSource = (typeof DIAGRAM_SOURCE_VALUES)[number];

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Scoped diagram filter for dynamic mermaid generation from relationship metadata.
 *
 * Patterns matching the filter become diagram nodes. Immediate neighbors
 * (connected via relationship edges but not in scope) appear with a distinct style.
 */
export interface DiagramScope {
  /** Bounded contexts to include (matches pattern.archContext) */
  readonly archContext?: readonly string[];

  /** Explicit pattern names to include */
  readonly patterns?: readonly string[];

  /** Cross-cutting include tags (matches pattern.include entries) */
  readonly include?: readonly string[];

  /** Architectural layers to include (matches pattern.archLayer) */
  readonly archLayer?: readonly string[];

  /** Mermaid graph direction (default: 'TB') */
  readonly direction?: 'TB' | 'LR';

  /** Section heading for this diagram (default: 'Component Overview') */
  readonly title?: string;

  /** Mermaid diagram type (default: 'graph' for flowchart) */
  readonly diagramType?:
    | 'graph'
    | 'sequenceDiagram'
    | 'stateDiagram-v2'
    | 'C4Context'
    | 'classDiagram';

  /** Show relationship type labels on edges (default: true) */
  readonly showEdgeLabels?: boolean;

  /** Content source override. When set, uses hardcoded domain content
   * instead of computing from pattern relationships.
   * - 'fsm-lifecycle': FSM state transitions with protection levels
   * - 'generation-pipeline': 4-stage generation pipeline temporal flow
   * - 'master-dataset-views': MasterDataset pre-computed view fan-out
   */
  readonly source?: DiagramSource;
}

/**
 * Configuration for a reference document type.
 *
 * Each config object defines one reference document's composition.
 * Convention tags, shape selectors, and behavior tags control content assembly.
 */
export interface ReferenceDocConfig {
  /** Document title (e.g., "Process Guard Reference") */
  readonly title: string;

  /** Convention tag values to extract from decision records */
  readonly conventionTags?: readonly string[];

  /** Categories to filter behavior patterns from MasterDataset */
  readonly behaviorCategories?: readonly string[];

  /** Multiple scoped diagrams. */
  readonly diagramScopes?: readonly DiagramScope[];

  /** Target _claude-md/ directory for summary output */
  readonly claudeMdSection: string;

  /** Output filename for detailed docs (in docs/) */
  readonly docsFilename: string;

  /** Output filename for summary _claude-md module */
  readonly claudeMdFilename: string;

  /** DD-3/DD-6: Fine-grained shape selectors for declaration-level filtering */
  readonly shapeSelectors?: readonly ShapeSelector[];

  /** DD-1 (CrossCuttingDocumentInclusion): Include-tag values for cross-cutting content routing */
  readonly includeTags?: readonly string[];

  /**
   * Product area filter (ADR-001 canonical values).
   * When set, pre-filters all content sources to patterns with matching productArea.
   * Auto-generates diagram scopes from productArea→archContext mapping if no
   * explicit diagramScopes are provided.
   */
  readonly productArea?: string;

  /**
   * Exclude patterns whose source.file starts with any of these prefixes.
   * Used to filter ephemeral planning specs from behavior sections.
   * @example ['architect/specs/']
   */
  readonly excludeSourcePaths?: readonly string[];

  /**
   * Static preamble sections prepended before all generated content.
   * Use for editorial intro prose that cannot be expressed as annotations.
   * Appears in both detailed and summary outputs.
   */
  readonly preamble?: readonly SectionBlock[];

  /** When true, shapes section renders before conventions (default: false) */
  readonly shapesFirst?: boolean;
}

/**
 * Product area metadata for intro sections and index generation.
 *
 * Each area has a reader-facing question (from ADR-001), a coverage summary,
 * an intro paragraph synthesized from executable specs, key invariants
 * curated from business rules, and the most important patterns in the area.
 */
export interface ProductAreaMeta {
  /** Reader-facing question (from ADR-001 canonical values) */
  readonly question: string;
  /** Comma-separated coverage summary */
  readonly covers: string;
  /** 2-4 sentence intro explaining what this area does and why it matters */
  readonly intro: string;
  /** Additional structured content rendered after intro at 'detailed' level only */
  readonly introSections?: readonly SectionBlock[];
  /** Live diagram scopes generated from annotation data (overrides auto-generated diagram) */
  readonly diagramScopes?: readonly DiagramScope[];
  /** Key invariants to surface prominently (curated from executable specs) */
  readonly keyInvariants: readonly string[];
  /** Key patterns in this area */
  readonly keyPatterns: readonly string[];
}

// ============================================================================
// Codec Options
// ============================================================================

export interface ReferenceCodecOptions extends BaseCodecOptions {
  /** Override detail level (default: 'standard') */
  readonly detailLevel?: DetailLevel;
}
