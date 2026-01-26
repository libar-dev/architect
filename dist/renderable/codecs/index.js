/**
 * @libar-docs
 * @libar-docs-core
 *
 * ## Document Codecs
 *
 * Barrel export for all document codecs.
 * Each codec transforms MasterDataset → RenderableDocument.
 *
 * ### Factory Pattern
 *
 * Each codec exports both:
 * - Default codec with standard options: `PatternsDocumentCodec`
 * - Factory function for custom options: `createPatternsCodec(options)`
 */
// Base Types (shared by all codecs)
export * from "./types/index.js";
// Shared Schema (for codec output validation)
export { RenderableDocumentOutputSchema } from "./shared-schema.js";
// Rich Content Helpers
export { renderDataTable, renderDocString, renderStepsList, renderBusinessRule, renderScenarioContent, renderAcceptanceCriteria, renderBusinessRulesSection, renderPatternRichContent, parseDescriptionWithDocStrings, parseBusinessRuleAnnotations, DEFAULT_RICH_CONTENT_OPTIONS, mergeRichContentOptions, } from "./helpers.js";
// Patterns (includes PatternsCodecOptions)
export { PatternsDocumentCodec, createPatternsCodec, DEFAULT_PATTERNS_OPTIONS, } from "./patterns.js";
// Timeline (includes Roadmap, Milestones, CurrentWork options)
export { RoadmapDocumentCodec, CompletedMilestonesCodec, CurrentWorkCodec, createRoadmapCodec, createMilestonesCodec, createCurrentWorkCodec, DEFAULT_ROADMAP_OPTIONS, DEFAULT_MILESTONES_OPTIONS, DEFAULT_CURRENT_WORK_OPTIONS, } from "./timeline.js";
// Requirements (includes RequirementsCodecOptions)
export { RequirementsDocumentCodec, createRequirementsCodec, DEFAULT_REQUIREMENTS_OPTIONS, } from "./requirements.js";
// Session (includes Session and RemainingWork options)
export { SessionContextCodec, RemainingWorkCodec, createSessionContextCodec, createRemainingWorkCodec, DEFAULT_SESSION_OPTIONS, DEFAULT_REMAINING_WORK_OPTIONS, } from "./session.js";
// PR Changes (includes PrChangesCodecOptions)
export { PrChangesCodec, createPrChangesCodec, DEFAULT_PR_CHANGES_OPTIONS, } from "./pr-changes.js";
// ADR (Architecture Decision Records) (includes AdrCodecOptions)
export { AdrDocumentCodec, createAdrCodec, DEFAULT_ADR_OPTIONS, } from "./adr.js";
// Planning (Checklist, Session Plan, Session Findings) (includes planning options)
export { PlanningChecklistCodec, SessionPlanCodec, SessionFindingsCodec, createPlanningChecklistCodec, createSessionPlanCodec, createSessionFindingsCodec, DEFAULT_PLANNING_CHECKLIST_OPTIONS, DEFAULT_SESSION_PLAN_OPTIONS, DEFAULT_SESSION_FINDINGS_OPTIONS, } from "./planning.js";
// Reporting (Changelog, Traceability, Overview) (includes reporting options)
export { ChangelogCodec, TraceabilityCodec, OverviewCodec, createChangelogCodec, createTraceabilityCodec, createOverviewCodec, DEFAULT_CHANGELOG_OPTIONS, DEFAULT_TRACEABILITY_OPTIONS, DEFAULT_OVERVIEW_OPTIONS, } from "./reporting.js";
// Business Rules (includes BusinessRulesCodecOptions)
export { BusinessRulesCodec, createBusinessRulesCodec, DEFAULT_BUSINESS_RULES_OPTIONS, } from "./business-rules.js";
// Architecture (includes ArchitectureCodecOptions)
export { ArchitectureDocumentCodec, createArchitectureCodec, DEFAULT_ARCHITECTURE_OPTIONS, } from "./architecture.js";
//# sourceMappingURL=index.js.map