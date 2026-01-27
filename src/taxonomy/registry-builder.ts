/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern TagRegistryBuilder
 * @libar-docs-status completed
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

/**
 * TagRegistry interface (matches schema from validation-schemas/tag-registry.ts)
 */
export interface TagRegistry {
  version: string;
  categories: readonly CategoryDefinitionForRegistry[];
  metadataTags: readonly MetadataTagDefinitionForRegistry[];
  aggregationTags: readonly AggregationTagDefinitionForRegistry[];
  formatOptions: readonly string[];
  tagPrefix: string;
  fileOptInTag: string;
}

interface CategoryDefinitionForRegistry {
  tag: string;
  domain: string;
  priority: number;
  description: string;
  aliases: readonly string[];
}

export interface MetadataTagDefinitionForRegistry {
  tag: string;
  format: FormatType;
  purpose: string;
  required?: boolean;
  repeatable?: boolean;
  values?: readonly string[];
  default?: string;
  example?: string;
}

// Type alias for consumers (backwards compatible)
export type TagDefinition = MetadataTagDefinitionForRegistry;

interface AggregationTagDefinitionForRegistry {
  tag: string;
  targetDoc: string | null;
  purpose: string;
}

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
        example: '@libar-docs-implements EventStoreDurability, IdempotentAppend',
      },
      {
        tag: 'extends',
        format: 'value',
        purpose: 'Base pattern this pattern extends (generalization relationship)',
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
        example: '@libar-docs-business-value eliminates-event-replay-complexity',
      },
      {
        tag: 'constraint',
        format: 'value',
        purpose: 'Technical constraint affecting feature implementation',
        repeatable: true,
        example: '@libar-docs-constraint requires-convex-backend',
      },
      {
        tag: 'adr',
        format: 'value',
        purpose: 'ADR/PDR number for decision tracking',
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
        example: '@libar-docs-adr-supersedes 012',
      },
      {
        tag: 'adr-superseded-by',
        format: 'value',
        purpose: 'ADR/PDR number that supersedes this decision',
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
        purpose: "File paths to implementation APIs (replaces 'See:' markdown text in Rules)",
        example: '@libar-docs-api-ref @libar-dev/platform-core/src/durability/outbox.ts',
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
    tagPrefix: '@libar-docs-',
    fileOptInTag: '@libar-docs',
  };
}
