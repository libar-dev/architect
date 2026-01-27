/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern DocumentCodecs
 * @libar-docs-status completed
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
export * from './types/index.js';
export { RenderableDocumentOutputSchema } from './shared-schema.js';
export { renderDataTable, renderDocString, renderStepsList, renderBusinessRule, renderScenarioContent, renderAcceptanceCriteria, renderBusinessRulesSection, renderPatternRichContent, parseDescriptionWithDocStrings, parseBusinessRuleAnnotations, type RichContentOptions, type BusinessRule, type BusinessRuleAnnotations, DEFAULT_RICH_CONTENT_OPTIONS, mergeRichContentOptions, } from './helpers.js';
export { PatternsDocumentCodec, createPatternsCodec, type PatternsCodecOptions, DEFAULT_PATTERNS_OPTIONS, } from './patterns.js';
export { RoadmapDocumentCodec, CompletedMilestonesCodec, CurrentWorkCodec, createRoadmapCodec, createMilestonesCodec, createCurrentWorkCodec, type RoadmapCodecOptions, type CompletedMilestonesCodecOptions, type CurrentWorkCodecOptions, DEFAULT_ROADMAP_OPTIONS, DEFAULT_MILESTONES_OPTIONS, DEFAULT_CURRENT_WORK_OPTIONS, } from './timeline.js';
export { RequirementsDocumentCodec, createRequirementsCodec, type RequirementsCodecOptions, DEFAULT_REQUIREMENTS_OPTIONS, } from './requirements.js';
export { SessionContextCodec, RemainingWorkCodec, createSessionContextCodec, createRemainingWorkCodec, type SessionCodecOptions, type RemainingWorkCodecOptions, DEFAULT_SESSION_OPTIONS, DEFAULT_REMAINING_WORK_OPTIONS, } from './session.js';
export { PrChangesCodec, createPrChangesCodec, type PrChangesCodecOptions, DEFAULT_PR_CHANGES_OPTIONS, } from './pr-changes.js';
export { AdrDocumentCodec, createAdrCodec, type AdrCodecOptions, DEFAULT_ADR_OPTIONS, } from './adr.js';
export { PlanningChecklistCodec, SessionPlanCodec, SessionFindingsCodec, createPlanningChecklistCodec, createSessionPlanCodec, createSessionFindingsCodec, type PlanningChecklistCodecOptions, type SessionPlanCodecOptions, type SessionFindingsCodecOptions, DEFAULT_PLANNING_CHECKLIST_OPTIONS, DEFAULT_SESSION_PLAN_OPTIONS, DEFAULT_SESSION_FINDINGS_OPTIONS, } from './planning.js';
export { ChangelogCodec, TraceabilityCodec, OverviewCodec, createChangelogCodec, createTraceabilityCodec, createOverviewCodec, type ChangelogCodecOptions, type TraceabilityCodecOptions, type OverviewCodecOptions, DEFAULT_CHANGELOG_OPTIONS, DEFAULT_TRACEABILITY_OPTIONS, DEFAULT_OVERVIEW_OPTIONS, } from './reporting.js';
export { BusinessRulesCodec, createBusinessRulesCodec, type BusinessRulesCodecOptions, DEFAULT_BUSINESS_RULES_OPTIONS, } from './business-rules.js';
export { ArchitectureDocumentCodec, createArchitectureCodec, type ArchitectureCodecOptions, type ArchitectureDiagramType, DEFAULT_ARCHITECTURE_OPTIONS, } from './architecture.js';
//# sourceMappingURL=index.d.ts.map