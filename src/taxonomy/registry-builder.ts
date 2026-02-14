/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern TagRegistryBuilder
 * @libar-docs-status completed
 * @libar-docs-arch-role service
 * @libar-docs-arch-context taxonomy
 * @libar-docs-arch-layer domain
 * @libar-docs-implements TypeScriptTaxonomyImplementation
 * @libar-docs-extract-shapes TagRegistry, MetadataTagDefinitionForRegistry, TagDefinition, buildRegistry, METADATA_TAGS_BY_GROUP
 *
 * ## Tag Registry Builder
 *
 * Constructs a complete TagRegistry from TypeScript constants.
 * Provides the default tag definitions for the delivery-process annotation system.
 *
 * ### When to Use
 *
 * - When building custom tag registries with modified definitions
 * - When accessing tag metadata (format, purpose, values)
 * - When initializing the taxonomy for pattern extraction
 */
import { CATEGORIES } from './categories.js';
import { type FormatType } from './format-types.js';
import {
  ADR_LAYER_VALUES,
  ADR_STATUS_VALUES,
  ADR_THEME_VALUES,
  GLOBAL_FORMAT_OPTIONS,
  PRIORITY_VALUES,
  WORKFLOW_VALUES,
} from './generator-options.js';
import { DEFAULT_HIERARCHY_LEVEL, HIERARCHY_LEVELS } from './hierarchy-levels.js';
import { RISK_LEVELS } from './risk-levels.js';
import { ACCEPTED_STATUS_VALUES, DEFAULT_STATUS } from './status-values.js';
import { CONVENTION_VALUES } from './conventions.js';
import { DEFAULT_TAG_PREFIX, DEFAULT_FILE_OPT_IN_TAG } from '../config/defaults.js';

/**
 * TagRegistry interface (matches schema from validation-schemas/tag-registry.ts)
 */
export interface TagRegistry {
  /** Schema version for forward/backward compatibility checking */
  version: string;
  /** Category definitions for classifying patterns by domain (e.g., core, api, ddd) */
  categories: readonly CategoryDefinitionForRegistry[];
  /** Metadata tag definitions with format, purpose, and validation rules */
  metadataTags: readonly MetadataTagDefinitionForRegistry[];
  /** Aggregation tag definitions for document-level grouping */
  aggregationTags: readonly AggregationTagDefinitionForRegistry[];
  /** Available format options for documentation output */
  formatOptions: readonly string[];
  /** Prefix for all tags (e.g., "@libar-docs-") */
  tagPrefix: string;
  /** File-level opt-in marker tag (e.g., "@libar-docs") */
  fileOptInTag: string;
}

interface CategoryDefinitionForRegistry {
  /** Category tag name without prefix (e.g., "core", "api", "ddd") */
  tag: string;
  /** Human-readable domain name (e.g., "Core Infrastructure", "Strategic DDD") */
  domain: string;
  /** Display order priority (lower = higher priority, determines sort order) */
  priority: number;
  /** Brief description of the category's purpose and scope */
  description: string;
  /** Alternative tag names that map to this category */
  aliases: readonly string[];
}

export interface MetadataTagDefinitionForRegistry {
  /** Tag name without prefix (e.g., "pattern", "status", "phase") */
  tag: string;
  /** Value format type determining parsing rules (flag, value, enum, csv, number, quoted-value) */
  format: FormatType;
  /** Human-readable description of the tag's purpose and usage */
  purpose: string;
  /** Whether this tag must be present for valid patterns */
  required?: boolean;
  /** Whether this tag can appear multiple times on a single pattern */
  repeatable?: boolean;
  /** Valid values for enum-type tags (undefined for non-enum formats) */
  values?: readonly string[];
  /** Default value applied when tag is not specified */
  default?: string;
  /** Example usage showing tag syntax (e.g., "@libar-docs-pattern MyPattern") */
  example?: string;
  /** Maps tag name to metadata object property name (defaults to kebab-to-camelCase) */
  metadataKey?: string;
  /** Post-parse value transformer applied after format-based parsing */
  transform?: (value: string) => string;
}

// Type alias for consumers (backwards compatible)
export type TagDefinition = MetadataTagDefinitionForRegistry;

interface AggregationTagDefinitionForRegistry {
  /** Aggregation tag name (e.g., "overview", "decision", "intro") */
  tag: string;
  /** Target document filename this tag aggregates to (null = inline rendering) */
  targetDoc: string | null;
  /** Description of what this aggregation collects */
  purpose: string;
}

/**
 * Metadata tags organized by functional group.
 * Used for documentation generation to create organized sections.
 *
 * Groups:
 * - core: Essential pattern identification (pattern, status, core, usecase, brief)
 * - relationship: Pattern dependencies and connections
 * - process: Timeline and assignment tracking
 * - prd: Product requirements documentation
 * - adr: Architecture decision records
 * - hierarchy: Epic/phase/task breakdown
 * - traceability: Two-tier spec architecture links
 * - discovery: Session discovery findings (retrospective tags)
 * - architecture: Diagram generation tags
 * - extraction: Documentation extraction control
 * - stub: Design session stub metadata
 */
export const METADATA_TAGS_BY_GROUP = {
  core: ['pattern', 'status', 'core', 'usecase', 'brief'] as const,
  relationship: [
    'uses',
    'used-by',
    'implements',
    'extends',
    'depends-on',
    'enables',
    'see-also',
    'api-ref',
  ] as const,
  process: [
    'phase',
    'release',
    'quarter',
    'completed',
    'effort',
    'effort-actual',
    'team',
    'workflow',
    'risk',
    'priority',
  ] as const,
  prd: ['product-area', 'user-role', 'business-value', 'constraint'] as const,
  adr: [
    'adr',
    'adr-status',
    'adr-category',
    'adr-supersedes',
    'adr-superseded-by',
    'adr-theme',
    'adr-layer',
  ] as const,
  hierarchy: ['level', 'parent', 'title'] as const,
  traceability: ['executable-specs', 'roadmap-spec', 'behavior-file'] as const,
  discovery: [
    'discovered-gap',
    'discovered-improvement',
    'discovered-risk',
    'discovered-learning',
  ] as const,
  architecture: ['arch-role', 'arch-context', 'arch-layer', 'arch-view'] as const,
  extraction: ['extract-shapes', 'shape'] as const,
  stub: ['target', 'since'] as const,
  convention: ['convention'] as const,
} as const;

// Transform helpers for data-driven Gherkin tag extraction
const hyphenToSpace = (v: string): string => v.replace(/-/g, ' ');
const padAdr = (v: string): string => v.padStart(3, '0');
const stripQuotes = (v: string): string => v.replace(/^["']|["']$/g, '');

/**
 * Build the complete tag registry from TypeScript constants
 *
 * This is THE single source of truth for the taxonomy.
 * All consumers should use this function instead of loading JSON.
 */
export function buildRegistry(): TagRegistry {
  return {
    version: '2.0.0',

    categories: CATEGORIES,

    metadataTags: [
      {
        tag: 'pattern',
        format: 'value',
        purpose: 'Explicit pattern name',
        required: true,
        example: '@libar-docs-pattern CommandOrchestrator',
      },
      {
        tag: 'status',
        format: 'enum',
        purpose: 'Work item lifecycle status (per PDR-005 FSM)',
        values: [...ACCEPTED_STATUS_VALUES], // Includes legacy values for extraction
        default: DEFAULT_STATUS,
        example: '@libar-docs-status roadmap',
      },
      {
        tag: 'core',
        format: 'flag',
        purpose: 'Marks as essential/must-know pattern',
        example: '@libar-docs-core',
      },
      {
        tag: 'usecase',
        format: 'quoted-value',
        purpose: 'Use case association',
        repeatable: true,
        example: '@libar-docs-usecase "When handling command failures"',
      },
      {
        tag: 'uses',
        format: 'csv',
        purpose: 'Patterns this depends on',
        example: '@libar-docs-uses CommandBus, EventStore',
      },
      {
        tag: 'used-by',
        format: 'csv',
        purpose: 'Patterns that depend on this',
        example: '@libar-docs-used-by SagaOrchestrator',
      },
      {
        tag: 'phase',
        format: 'number',
        purpose: 'Roadmap phase number (unified across monorepo)',
        example: '@libar-docs-phase 14',
      },
      {
        tag: 'release',
        format: 'value',
        purpose: 'Target release version (semver or vNEXT for unreleased work)',
        example: '@libar-docs-release v0.1.0',
      },
      {
        tag: 'brief',
        format: 'value',
        purpose: 'Path to pattern brief markdown',
        example: '@libar-docs-brief docs/briefs/decider-pattern.md',
      },
      {
        tag: 'depends-on',
        format: 'csv',
        purpose: 'Roadmap dependencies (pattern or phase names)',
        example: '@libar-docs-depends-on EventStore, CommandBus',
      },
      {
        tag: 'enables',
        format: 'csv',
        purpose: 'Patterns this enables',
        example: '@libar-docs-enables SagaOrchestrator, ProjectionBuilder',
      },
      // Relationship tags for UML-inspired pattern modeling (PatternRelationshipModel)
      {
        tag: 'implements',
        format: 'csv',
        purpose: 'Patterns this code file realizes (realization relationship)',
        metadataKey: 'implementsPatterns',
        example: '@libar-docs-implements EventStoreDurability, IdempotentAppend',
      },
      {
        tag: 'extends',
        format: 'value',
        purpose: 'Base pattern this pattern extends (generalization relationship)',
        metadataKey: 'extendsPattern',
        example: '@libar-docs-extends ProjectionCategories',
      },
      {
        tag: 'quarter',
        format: 'value',
        purpose: 'Delivery quarter for timeline tracking',
        example: '@libar-docs-quarter Q1-2026',
      },
      {
        tag: 'completed',
        format: 'value',
        purpose: 'Completion date (YYYY-MM-DD format)',
        example: '@libar-docs-completed 2026-01-08',
      },
      {
        tag: 'effort',
        format: 'value',
        purpose: 'Estimated effort (4h, 2d, 1w format)',
        example: '@libar-docs-effort 2d',
      },
      {
        tag: 'effort-actual',
        format: 'value',
        purpose: 'Actual effort spent (4h, 2d, 1w format)',
        example: '@libar-docs-effort-actual 3d',
      },
      {
        tag: 'team',
        format: 'value',
        purpose: 'Responsible team assignment',
        example: '@libar-docs-team platform',
      },
      {
        tag: 'workflow',
        format: 'enum',
        purpose: 'Workflow discipline for process tracking',
        values: [...WORKFLOW_VALUES],
        example: '@libar-docs-workflow implementation',
      },
      {
        tag: 'risk',
        format: 'enum',
        purpose: 'Risk level for planning',
        values: [...RISK_LEVELS],
        example: '@libar-docs-risk medium',
      },
      {
        tag: 'priority',
        format: 'enum',
        purpose: 'Priority level for roadmap ordering',
        values: [...PRIORITY_VALUES],
        example: '@libar-docs-priority high',
      },
      {
        tag: 'product-area',
        format: 'value',
        purpose: 'Product area for PRD grouping',
        example: '@libar-docs-product-area PlatformCore',
      },
      {
        tag: 'user-role',
        format: 'value',
        purpose: 'Target user persona for this feature',
        example: '@libar-docs-user-role Developer',
      },
      {
        tag: 'business-value',
        format: 'value',
        purpose: 'Business value statement (hyphenated for tag format)',
        transform: hyphenToSpace,
        example: '@libar-docs-business-value eliminates-event-replay-complexity',
      },
      {
        tag: 'constraint',
        format: 'value',
        purpose: 'Technical constraint affecting feature implementation',
        repeatable: true,
        metadataKey: 'constraints',
        transform: hyphenToSpace,
        example: '@libar-docs-constraint requires-convex-backend',
      },
      {
        tag: 'adr',
        format: 'value',
        purpose: 'ADR/PDR number for decision tracking',
        transform: padAdr,
        example: '@libar-docs-adr 015',
      },
      {
        tag: 'adr-status',
        format: 'enum',
        purpose: 'ADR/PDR decision status',
        values: [...ADR_STATUS_VALUES],
        default: 'proposed',
        example: '@libar-docs-adr-status accepted',
      },
      {
        tag: 'adr-category',
        format: 'value',
        purpose: 'ADR/PDR category (architecture, process, tooling)',
        example: '@libar-docs-adr-category architecture',
      },
      {
        tag: 'adr-supersedes',
        format: 'value',
        purpose: 'ADR/PDR number this decision supersedes',
        transform: padAdr,
        example: '@libar-docs-adr-supersedes 012',
      },
      {
        tag: 'adr-superseded-by',
        format: 'value',
        purpose: 'ADR/PDR number that supersedes this decision',
        transform: padAdr,
        example: '@libar-docs-adr-superseded-by 020',
      },
      {
        tag: 'adr-theme',
        format: 'enum',
        purpose: 'Theme grouping for related decisions (from synthesis)',
        values: [...ADR_THEME_VALUES],
        example: '@libar-docs-adr-theme persistence',
      },
      {
        tag: 'adr-layer',
        format: 'enum',
        purpose: 'Evolutionary layer of the decision',
        values: [...ADR_LAYER_VALUES],
        example: '@libar-docs-adr-layer foundation',
      },
      {
        tag: 'level',
        format: 'enum',
        purpose: 'Hierarchy level for epic->phase->task breakdown',
        values: [...HIERARCHY_LEVELS],
        default: DEFAULT_HIERARCHY_LEVEL,
        example: '@libar-docs-level epic',
      },
      {
        tag: 'parent',
        format: 'value',
        purpose: 'Parent pattern name in hierarchy (links tasks to phases, phases to epics)',
        example: '@libar-docs-parent AggregateArchitecture',
      },
      {
        tag: 'title',
        format: 'quoted-value',
        purpose: 'Human-readable display title (supports quoted values with spaces)',
        transform: stripQuotes,
        example: '@libar-docs-title:"Process Guard Linter"',
      },
      // PDR-007: Two-Tier Spec Architecture traceability
      {
        tag: 'executable-specs',
        format: 'csv',
        purpose: 'Links roadmap spec to package executable spec locations (PDR-007)',
        example: '@libar-docs-executable-specs platform-decider/tests/features/behavior',
      },
      {
        tag: 'roadmap-spec',
        format: 'value',
        purpose: 'Links package spec back to roadmap pattern for traceability (PDR-007)',
        example: '@libar-docs-roadmap-spec DeciderPattern',
      },
      {
        tag: 'behavior-file',
        format: 'value',
        purpose: 'Path to behavior test feature file for traceability',
        example: '@libar-docs-behavior-file behavior/my-pattern.feature',
      },
      // Session discovery findings (retrospective tags)
      {
        tag: 'discovered-gap',
        format: 'value',
        purpose: 'Gap identified during session retrospective',
        repeatable: true,
        metadataKey: 'discoveredGaps',
        transform: hyphenToSpace,
        example: '@libar-docs-discovered-gap missing-error-handling',
      },
      {
        tag: 'discovered-improvement',
        format: 'value',
        purpose: 'Improvement identified during session retrospective',
        repeatable: true,
        metadataKey: 'discoveredImprovements',
        transform: hyphenToSpace,
        example: '@libar-docs-discovered-improvement cache-invalidation',
      },
      {
        tag: 'discovered-risk',
        format: 'value',
        purpose: 'Risk identified during session retrospective',
        repeatable: true,
        metadataKey: 'discoveredRisks',
        transform: hyphenToSpace,
        example: '@libar-docs-discovered-risk data-loss-on-migration',
      },
      {
        tag: 'discovered-learning',
        format: 'value',
        purpose: 'Learning captured during session retrospective',
        repeatable: true,
        metadataKey: 'discoveredLearnings',
        transform: hyphenToSpace,
        example: '@libar-docs-discovered-learning convex-mutation-limits',
      },
      // Cross-reference and API navigation tags (PatternRelationshipModel enhancement)
      {
        tag: 'see-also',
        format: 'csv',
        purpose: 'Related patterns for cross-reference without dependency implication',
        example: '@libar-docs-see-also AgentAsBoundedContext, CrossContextIntegration',
      },
      {
        tag: 'api-ref',
        format: 'csv',
        purpose: "File paths to implementation APIs (replaces 'See:' Markdown text in Rules)",
        example: '@libar-docs-api-ref @libar-dev/platform-core/src/durability/outbox.ts',
      },
      // Shape extraction for documentation generation (ADR-021)
      {
        tag: 'extract-shapes',
        format: 'csv',
        purpose: 'TypeScript type names to extract from this file for documentation',
        example: '@libar-docs-extract-shapes DeciderInput, ValidationResult, ProcessViolation',
      },
      // DD-1: Declaration-level shape tagging
      {
        tag: 'shape',
        format: 'value',
        purpose: 'Marks declaration as documentable shape, optionally with group name',
        example: '@libar-docs-shape api-types',
      },
      // Architecture diagram generation tags
      {
        tag: 'arch-role',
        format: 'enum',
        purpose: 'Architectural role for diagram generation (component type)',
        values: [
          'bounded-context',
          'command-handler',
          'projection',
          'saga',
          'process-manager',
          'infrastructure',
          'repository',
          'decider',
          'read-model',
          'service',
        ] as const,
        example: '@libar-docs-arch-role projection',
      },
      {
        tag: 'arch-context',
        format: 'value',
        purpose: 'Bounded context this component belongs to (for subgraph grouping)',
        example: '@libar-docs-arch-context orders',
      },
      {
        tag: 'arch-layer',
        format: 'enum',
        purpose: 'Architectural layer for layered diagrams',
        values: ['domain', 'application', 'infrastructure'] as const,
        example: '@libar-docs-arch-layer application',
      },
      {
        tag: 'arch-view',
        format: 'csv',
        purpose: 'Named architectural views for scoped diagram generation',
        example: '@libar-docs-arch-view codec-transformation,pipeline-overview',
      },
      // Design session stub metadata tags (DataAPIStubIntegration Phase B)
      {
        tag: 'target',
        format: 'value',
        purpose: 'Target implementation path for stub files',
        example: '@libar-docs-target src/api/stub-resolver.ts',
      },
      {
        tag: 'since',
        format: 'value',
        purpose: 'Design session that created this pattern',
        example: '@libar-docs-since DS-A',
      },
      // Convention tags for reference document generation (CodecDrivenReferenceGeneration)
      {
        tag: 'convention',
        format: 'csv',
        purpose: 'Convention domains for reference document generation from decision records',
        values: [...CONVENTION_VALUES],
        example: '@libar-docs-convention fsm-rules, testing-policy',
      },
    ],

    aggregationTags: [
      {
        tag: 'overview',
        targetDoc: 'OVERVIEW.md',
        purpose: 'Architecture overview patterns',
      },
      {
        tag: 'decision',
        targetDoc: 'DECISIONS.md',
        purpose: 'ADR-style decisions (auto-numbered)',
      },
      {
        tag: 'intro',
        targetDoc: null,
        purpose: 'Package introduction (template placeholder)',
      },
    ],

    formatOptions: [...GLOBAL_FORMAT_OPTIONS],
    tagPrefix: DEFAULT_TAG_PREFIX,
    fileOptInTag: DEFAULT_FILE_OPT_IN_TAG,
  };
}
