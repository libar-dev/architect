/**
 * @architect
 * @architect-core
 * @architect-pattern DocumentCodecs
 * @architect-status completed
 *
 * ## Document Codecs
 *
 * Barrel export for all document codecs.
 * Each codec transforms MasterDataset → RenderableDocument.
 *
 * ### When to Use
 *
 * - When importing codecs for document generation
 * - When accessing codec factory functions with custom options
 * - When using shared helpers for rich content rendering
 *
 * ### Factory Pattern
 *
 * Each codec exports both:
 * - Default codec with standard options: `PatternsDocumentCodec`
 * - Factory function for custom options: `createPatternsCodec(options)`
 */

// Base Types (shared by all codecs)
export * from './types/index.js';

// Shared Schema (for codec output validation)
export { RenderableDocumentOutputSchema } from './shared-schema.js';

// Rich Content Helpers
export {
  renderDataTable,
  renderDocString,
  renderStepsList,
  renderBusinessRule,
  renderScenarioContent,
  renderAcceptanceCriteria,
  renderBusinessRulesSection,
  renderPatternRichContent,
  parseDescriptionWithDocStrings,
  parseBusinessRuleAnnotations,
  type RichContentOptions,
  type BusinessRule,
  type BusinessRuleAnnotations,
  DEFAULT_RICH_CONTENT_OPTIONS,
  mergeRichContentOptions,
} from './helpers.js';

// Patterns (includes PatternsCodecOptions)
export {
  PatternsDocumentCodec,
  createPatternsCodec,
  type PatternsCodecOptions,
  DEFAULT_PATTERNS_OPTIONS,
} from './patterns.js';

// Timeline (includes Roadmap, Milestones, CurrentWork options)
export {
  RoadmapDocumentCodec,
  CompletedMilestonesCodec,
  CurrentWorkCodec,
  createRoadmapCodec,
  createMilestonesCodec,
  createCurrentWorkCodec,
  type RoadmapCodecOptions,
  type CompletedMilestonesCodecOptions,
  type CurrentWorkCodecOptions,
  DEFAULT_ROADMAP_OPTIONS,
  DEFAULT_MILESTONES_OPTIONS,
  DEFAULT_CURRENT_WORK_OPTIONS,
} from './timeline.js';

// Requirements (includes RequirementsCodecOptions)
export {
  RequirementsDocumentCodec,
  createRequirementsCodec,
  type RequirementsCodecOptions,
  DEFAULT_REQUIREMENTS_OPTIONS,
} from './requirements.js';

// Session (includes Session and RemainingWork options)
export {
  SessionContextCodec,
  RemainingWorkCodec,
  createSessionContextCodec,
  createRemainingWorkCodec,
  type SessionCodecOptions,
  type RemainingWorkCodecOptions,
  DEFAULT_SESSION_OPTIONS,
  DEFAULT_REMAINING_WORK_OPTIONS,
} from './session.js';

// PR Changes (includes PrChangesCodecOptions)
export {
  PrChangesCodec,
  createPrChangesCodec,
  type PrChangesCodecOptions,
  DEFAULT_PR_CHANGES_OPTIONS,
} from './pr-changes.js';

// ADR (Architecture Decision Records) (includes AdrCodecOptions)
export {
  AdrDocumentCodec,
  createAdrCodec,
  type AdrCodecOptions,
  DEFAULT_ADR_OPTIONS,
} from './adr.js';

// Planning (Checklist, Session Plan, Session Findings) (includes planning options)
export {
  PlanningChecklistCodec,
  SessionPlanCodec,
  SessionFindingsCodec,
  createPlanningChecklistCodec,
  createSessionPlanCodec,
  createSessionFindingsCodec,
  type PlanningChecklistCodecOptions,
  type SessionPlanCodecOptions,
  type SessionFindingsCodecOptions,
  DEFAULT_PLANNING_CHECKLIST_OPTIONS,
  DEFAULT_SESSION_PLAN_OPTIONS,
  DEFAULT_SESSION_FINDINGS_OPTIONS,
} from './planning.js';

// Reporting (Changelog, Traceability, Overview) (includes reporting options)
export {
  ChangelogCodec,
  TraceabilityCodec,
  OverviewCodec,
  createChangelogCodec,
  createTraceabilityCodec,
  createOverviewCodec,
  type ChangelogCodecOptions,
  type TraceabilityCodecOptions,
  type OverviewCodecOptions,
  DEFAULT_CHANGELOG_OPTIONS,
  DEFAULT_TRACEABILITY_OPTIONS,
  DEFAULT_OVERVIEW_OPTIONS,
} from './reporting.js';

// Business Rules (includes BusinessRulesCodecOptions)
export {
  BusinessRulesCodec,
  createBusinessRulesCodec,
  type BusinessRulesCodecOptions,
  DEFAULT_BUSINESS_RULES_OPTIONS,
} from './business-rules.js';

// Architecture (includes ArchitectureCodecOptions)
export {
  ArchitectureDocumentCodec,
  createArchitectureCodec,
  type ArchitectureCodecOptions,
  type ArchitectureDiagramType,
  DEFAULT_ARCHITECTURE_OPTIONS,
} from './architecture.js';

// Decision Doc (for documentation generation from ADR/PDR)
export {
  // Types
  type SourceMappingEntry,
  type PartitionedDecisionRules,
  type ExtractedDocString,
  type DecisionDocContent,
  // Constants
  SELF_REFERENCE_MARKER,
  SELF_REFERENCE_RULE_PATTERN,
  SELF_REFERENCE_DOCSTRING_PATTERN,
  EXTRACTION_METHODS,
  // Functions
  partitionDecisionRules,
  extractDocStrings,
  extractDocStringsFromRules,
  parseSourceMappingTable,
  parseSourceMappingsFromRules,
  isSelfReference,
  parseSelfReference,
  findRuleByName,
  extractRuleContent,
  parseDecisionDocument,
  normalizeExtractionMethod,
  docStringsToCodeBlocks,
} from './decision-doc.js';

// Taxonomy (includes TaxonomyCodecOptions)
export {
  TaxonomyDocumentCodec,
  createTaxonomyCodec,
  type TaxonomyCodecOptions,
  DEFAULT_TAXONOMY_OPTIONS,
} from './taxonomy.js';

// Validation Rules (includes ValidationRulesCodecOptions)
export {
  ValidationRulesCodec,
  createValidationRulesCodec,
  type ValidationRulesCodecOptions,
  type RuleDefinition,
  DEFAULT_VALIDATION_RULES_OPTIONS,
  RULE_DEFINITIONS,
  composeRationaleIntoRules,
} from './validation-rules.js';

// Claude Module (includes ClaudeModuleCodecOptions)
export {
  ClaudeModuleCodec,
  createClaudeModuleCodec,
  type ClaudeModuleCodecOptions,
  DEFAULT_CLAUDE_MODULE_OPTIONS,
} from './claude-module.js';

// Index (navigation hub with MasterDataset statistics + editorial preamble)
export {
  IndexCodec,
  createIndexCodec,
  type IndexCodecOptions,
  type DocumentEntry,
  DEFAULT_INDEX_OPTIONS,
} from './index-codec.js';

// Convention Extractor
export {
  extractConventions,
  type ConventionBundle,
  type ConventionRuleContent,
  type ConventionTable,
} from './convention-extractor.js';

// Reference Document Codec (parameterized factory)
export {
  createReferenceCodec,
  type ReferenceDocConfig,
  type ReferenceCodecOptions,
} from './reference.js';

export { type ShapeSelector } from './shape-matcher.js';

// Composite (multi-codec assembly)
export {
  createCompositeCodec,
  composeDocuments,
  type CompositeCodecOptions,
  type ComposeOptions,
} from './composite.js';
