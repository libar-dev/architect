import fs from 'node:fs';
import path from 'node:path';

import type { LintViolation } from '@libar-dev/architect-core';

import type { LintSummary } from './engine.js';

export interface TierABaselineEntry {
  readonly path: string;
  readonly rule: string;
  readonly line: number;
  readonly message: string;
}

export interface TierABaselineFilterOptions {
  readonly baseDir: string;
}

export const TIER_A_LINT_BASELINE: readonly TierABaselineEntry[] = [
  {
    path: 'packages/architect-cli/src/cli/error-handler.ts',
    rule: 'missing-pattern-name',
    line: 3,
    message: 'Pattern missing explicit name. Add @architect-pattern YourPatternName',
  },
  {
    path: 'packages/architect-cli/src/cli/error-handler.ts',
    rule: 'missing-relationship-target',
    line: 3,
    message: "Relationship target 'DocError' not found in known patterns",
  },
  {
    path: 'packages/architect-cli/src/cli/pattern-graph-cli.ts',
    rule: 'missing-relationship-target',
    line: 3,
    message: "Relationship target 'ContextFormatterImpl' not found in known patterns",
  },
  {
    path: 'packages/architect-cli/src/cli/pattern-graph-cli.ts',
    rule: 'missing-relationship-target',
    line: 3,
    message: "Relationship target 'ScopeValidatorImpl' not found in known patterns",
  },
  {
    path: 'packages/architect-cli/src/cli/pattern-graph-cli.ts',
    rule: 'missing-relationship-target',
    line: 3,
    message: "Relationship target 'CoverageAnalyzerImpl' not found in known patterns",
  },
  {
    path: 'packages/architect-cli/src/cli/pattern-graph-cli.ts',
    rule: 'missing-relationship-target',
    line: 3,
    message: "Relationship target 'HandoffGeneratorImpl' not found in known patterns",
  },
  {
    path: 'packages/architect-cli/src/cli/pattern-graph-cli.ts',
    rule: 'missing-relationship-target',
    line: 3,
    message: "Relationship target 'CLIVersionHelper' not found in known patterns",
  },
  {
    path: 'packages/architect-cli/src/cli/pattern-graph-cli.ts',
    rule: 'missing-relationship-target',
    line: 3,
    message: "Implementation target 'PatternGraphAPICLI' not found in known patterns",
  },
  {
    path: 'packages/architect-cli/src/cli/pattern-graph-cli.ts',
    rule: 'missing-relationship-target',
    line: 3,
    message: "Implementation target 'DataAPICLIErgonomics' not found in known patterns",
  },
  {
    path: 'packages/architect-cli/src/cli/version.ts',
    rule: 'missing-pattern-name',
    line: 1,
    message: 'Pattern missing explicit name. Add @architect-pattern YourPatternName',
  },
  {
    path: 'packages/architect-core/src/config/cli-schema.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Implementation target 'CliReferenceGeneration' not found in known patterns",
  },
  {
    path: 'packages/architect-core/src/generators/pipeline/build-pipeline.ts',
    rule: 'missing-pattern-name',
    line: 1,
    message: 'Pattern missing explicit name. Add @architect-pattern YourPatternName',
  },
  {
    path: 'packages/architect-core/src/generators/pipeline/build-pipeline.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'PatternScanner' not found in known patterns",
  },
  {
    path: 'packages/architect-core/src/generators/pipeline/build-pipeline.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'GherkinScanner' not found in known patterns",
  },
  {
    path: 'packages/architect-core/src/generators/pipeline/build-pipeline.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'DocExtractor' not found in known patterns",
  },
  {
    path: 'packages/architect-core/src/generators/pipeline/build-pipeline.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'GherkinExtractor' not found in known patterns",
  },
  {
    path: 'packages/architect-core/src/generators/pipeline/build-pipeline.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'PatternGraph' not found in known patterns",
  },
  {
    path: 'packages/architect-core/src/generators/pipeline/build-pipeline.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ExtractionDiagnostics' not found in known patterns",
  },
  {
    path: 'packages/architect-core/src/types/errors.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Implementation target 'ErrorFactories' not found in known patterns",
  },
  {
    path: 'packages/architect-core/src/types/result.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Implementation target 'ResultMonad' not found in known patterns",
  },
  {
    path: 'packages/architect-core/src/validation/fsm/states.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Implementation target 'PhaseStateMachineValidation' not found in known patterns",
  },
  {
    path: 'packages/architect-core/src/validation/fsm/transitions.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Implementation target 'PhaseStateMachineValidation' not found in known patterns",
  },
  {
    path: 'packages/architect-core/src/validation/fsm/validator.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Implementation target 'PhaseStateMachineValidation' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/cli/lint-patterns.ts',
    rule: 'missing-pattern-name',
    line: 3,
    message: 'Pattern missing explicit name. Add @architect-pattern YourPatternName',
  },
  {
    path: 'packages/architect-guard/src/cli/lint-patterns.ts',
    rule: 'missing-relationship-target',
    line: 3,
    message: "Relationship target 'PatternScanner' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/cli/lint-process.ts',
    rule: 'missing-pattern-name',
    line: 3,
    message: 'Pattern missing explicit name. Add @architect-pattern YourPatternName',
  },
  {
    path: 'packages/architect-guard/src/cli/validate-patterns.ts',
    rule: 'missing-pattern-name',
    line: 3,
    message: 'Pattern missing explicit name. Add @architect-pattern YourPatternName',
  },
  {
    path: 'packages/architect-guard/src/cli/validate-patterns.ts',
    rule: 'missing-relationship-target',
    line: 3,
    message: "Relationship target 'PatternScanner' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/cli/validate-patterns.ts',
    rule: 'missing-relationship-target',
    line: 3,
    message: "Relationship target 'GherkinScanner' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/cli/validate-patterns.ts',
    rule: 'missing-relationship-target',
    line: 3,
    message: "Relationship target 'DocExtractor' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/cli/validate-patterns.ts',
    rule: 'missing-relationship-target',
    line: 3,
    message: "Relationship target 'GherkinExtractor' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/cli/validate-patterns.ts',
    rule: 'missing-relationship-target',
    line: 3,
    message: "Relationship target 'PatternGraph' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/cli/validate-patterns.ts',
    rule: 'missing-relationship-target',
    line: 3,
    message: "Relationship target 'CodecUtils' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/lint/engine.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'CodecUtils' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/lint/index.ts',
    rule: 'missing-pattern-name',
    line: 1,
    message: 'Pattern missing explicit name. Add @architect-pattern YourPatternName',
  },
  {
    path: 'packages/architect-guard/src/lint/process-guard/decider.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'DeriveProcessState' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/lint/process-guard/decider.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'DetectChanges' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/lint/process-guard/decider.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Implementation target 'ProcessGuardLinter' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/lint/process-guard/derive-state.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'SessionStateReader' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/lint/process-guard/derive-state.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Implementation target 'ProcessGuardLinter' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/lint/process-guard/detect-changes.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'DeriveProcessState' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/lint/process-guard/detect-changes.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Implementation target 'ProcessGuardLinter' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/lint/process-guard/index.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Implementation target 'ProcessGuardLinter' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/lint/process-guard/session-state-reader.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'GherkinScanner' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/lint/process-guard/session-state-reader.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Implementation target 'ProcessGuardLinter' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/lint/process-guard/types.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Implementation target 'ProcessGuardLinter' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/lint/rules.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Implementation target 'PatternRelationshipModel' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/validation/anti-patterns.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'DoDValidationTypes' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/validation/anti-patterns.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'GherkinTypes' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/validation/dod-validator.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'DoDValidationTypes' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/validation/dod-validator.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'GherkinTypes' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/validation/dod-validator.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'PatternGraph' not found in known patterns",
  },
  {
    path: 'packages/architect-guard/src/validation/index.ts',
    rule: 'missing-pattern-name',
    line: 1,
    message: 'Pattern missing explicit name. Add @architect-pattern YourPatternName',
  },
  {
    path: 'packages/architect-guard/src/validation/types.ts',
    rule: 'missing-pattern-name',
    line: 1,
    message: 'Pattern missing explicit name. Add @architect-pattern YourPatternName',
  },
  {
    path: 'packages/architect-mcp/src/cli/mcp-server.ts',
    rule: 'missing-relationship-target',
    line: 3,
    message: "Implementation target 'MCPToolRegistryIntegrationTests' not found in known patterns",
  },
  {
    path: 'packages/architect-mcp/src/file-watcher.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Implementation target 'MCPToolRegistryIntegrationTests' not found in known patterns",
  },
  {
    path: 'packages/architect-mcp/src/pipeline-session.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Implementation target 'MCPToolRegistryIntegrationTests' not found in known patterns",
  },
  {
    path: 'packages/architect-mcp/src/server.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Implementation target 'MCPToolRegistryIntegrationTests' not found in known patterns",
  },
  {
    path: 'packages/architect-mcp/src/tool-registry.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Implementation target 'MCPToolRegistryIntegrationTests' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/_shared/pattern-helpers.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/_shared/pattern-helpers.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'PatternSummary' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/_shared/pattern-helpers.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'PatternDetail' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/_shared/pattern-helpers.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'DependencyTree' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/_shared/pattern-helpers.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'DependencyEdge' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/_shared/pattern-helpers.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ArchitectureNeighborhood' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/delivery-reporting/index.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/delivery-reporting/index.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'PhaseProgress' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/delivery-reporting/index.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'StatusDistribution' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/delivery-reporting/index.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'RoadmapTimeline' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/delivery-reporting/index.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ReleaseNotesDigest' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/delivery-reporting/index.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'TraceabilityMatrix' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/delivery-reporting/index.ts',
    rule: 'missing-relationship-target',
    line: 546,
    message: "Relationship target 'PhaseProgressSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/delivery-reporting/index.ts',
    rule: 'missing-relationship-target',
    line: 546,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/delivery-reporting/index.ts',
    rule: 'missing-relationship-target',
    line: 582,
    message: "Relationship target 'StatusDistributionSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/delivery-reporting/index.ts',
    rule: 'missing-relationship-target',
    line: 582,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/delivery-reporting/index.ts',
    rule: 'missing-relationship-target',
    line: 618,
    message: "Relationship target 'RoadmapTimelineSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/delivery-reporting/index.ts',
    rule: 'missing-relationship-target',
    line: 618,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/delivery-reporting/index.ts',
    rule: 'missing-relationship-target',
    line: 666,
    message: "Relationship target 'ReleaseNotesDigestSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/delivery-reporting/index.ts',
    rule: 'missing-relationship-target',
    line: 666,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/delivery-reporting/index.ts',
    rule: 'missing-relationship-target',
    line: 703,
    message: "Relationship target 'TraceabilityMatrixSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/delivery-reporting/index.ts',
    rule: 'missing-relationship-target',
    line: 703,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/documentation-composition/architecture-diagram.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ArchitectureDiagramSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/documentation-composition/architecture-diagram.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/documentation-composition/documentation-bundle.ts',
    rule: 'missing-pattern-name',
    line: 1,
    message: 'Pattern missing explicit name. Add @architect-pattern YourPatternName',
  },
  {
    path: 'packages/architect-projection/src/projections/documentation-composition/documentation-bundle.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/documentation-composition/documentation-composition-shared.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectConfigSnapshot' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/documentation-composition/documentation-composition-shared.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ArchitectureDiagram' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/documentation-composition/documentation-composition-shared.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'PrChangeReview' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/documentation-composition/pr-change-review.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'PrChangeReviewSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/documentation-composition/pr-change-review.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/documentation-composition/project-config.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectConfigSnapshotSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/documentation-composition/project-config.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/execution-context/deliverables.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'DeliverableManifestSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/execution-context/deliverables.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'DeliverableSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/execution-context/deliverables.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/execution-context/execution-context-shared.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/execution-context/execution-context-shared.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'SessionContextBundle' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/execution-context/execution-context-shared.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ScopeReadinessReport' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/execution-context/execution-context-shared.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'HandoffRecord' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/execution-context/execution-context-shared.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'FileReadingList' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/execution-context/execution-context-shared.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'DeliverableManifest' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/execution-context/execution-context-shared.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'Deliverable' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/execution-context/file-reading-list.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'FileReadingListSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/execution-context/file-reading-list.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/execution-context/handoff.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'HandoffRecordSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/execution-context/handoff.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/execution-context/scope-readiness.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ScopeReadinessReportSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/execution-context/scope-readiness.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/execution-context/session-context.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'SessionContextBundleSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/execution-context/session-context.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/governance/business-rules.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'BusinessRuleSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/governance/business-rules.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'BusinessRuleSetSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/governance/business-rules.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/governance/decision-records.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'DecisionRecordSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/governance/decision-records.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'DecisionCatalogSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/governance/decision-records.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/governance/governance-shared.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/governance/governance-shared.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'DecisionRecord' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/governance/governance-shared.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'DecisionCatalog' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/governance/governance-shared.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'BusinessRule' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/governance/governance-shared.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'BusinessRuleSet' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/governance/governance-shared.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ValidationRuleDigest' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/governance/governance-shared.internal.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'TaxonomyDigest' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/governance/taxonomy-digest.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'TaxonomyDigestSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/governance/taxonomy-digest.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/governance/validation-rule-digest.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ValidationRuleDigestSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/governance/validation-rule-digest.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'OverviewDigest' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'AnnotationCoverage' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'TagUsageMatrix' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'SourceInventoryEntry' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'RoleProfile' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'RequirementDigest' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 712,
    message: "Relationship target 'AnnotationCoverageSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 712,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 750,
    message: "Relationship target 'OverviewDigestSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 750,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 786,
    message: "Relationship target 'RequirementDigestSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 786,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 831,
    message: "Relationship target 'RequirementDigestSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 831,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 868,
    message: "Relationship target 'RequirementDigestSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 868,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 1049,
    message: "Relationship target 'RoleProfileCollectionSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 1049,
    message: "Relationship target 'RoleProfileSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 1049,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 1098,
    message: "Relationship target 'SourceInventoryDigestSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 1098,
    message: "Relationship target 'SourceInventoryEntrySchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 1098,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 1139,
    message: "Relationship target 'TagUsageMatrixSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/operational-insights/index.ts',
    rule: 'missing-relationship-target',
    line: 1139,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/pattern-relations/architecture-comparison.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ArchitectureComparisonSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/pattern-relations/architecture-comparison.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/pattern-relations/architecture-context.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ArchitectureContextSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/pattern-relations/architecture-context.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/pattern-relations/architecture-neighborhood.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ArchitectureNeighborhoodSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/pattern-relations/architecture-neighborhood.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/pattern-relations/dependency-edges.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'DependencyEdgeSetSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/pattern-relations/dependency-edges.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/pattern-relations/dependency-tree.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'DependencyTreeSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/pattern-relations/dependency-tree.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/pattern-relations/orphan-pattern-list.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'OrphanPatternListSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/pattern-relations/orphan-pattern-list.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/pattern-relations/pattern-catalog.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'PatternCatalogSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/pattern-relations/pattern-catalog.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/pattern-relations/pattern-detail.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'PatternDetailSchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/pattern-relations/pattern-detail.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/pattern-relations/pattern-summary.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'PatternSummarySchema' not found in known patterns",
  },
  {
    path: 'packages/architect-projection/src/projections/pattern-relations/pattern-summary.ts',
    rule: 'missing-relationship-target',
    line: 1,
    message: "Relationship target 'ProjectionContext' not found in known patterns",
  },
] as const;

export function applyTierABaseline(
  summary: LintSummary,
  options: TierABaselineFilterOptions,
): LintSummary {
  if (TIER_A_LINT_BASELINE.length === 0) {
    return summary;
  }

  const repoRoot = findRepoRoot(options.baseDir);
  const baselineKeys = new Set(
    TIER_A_LINT_BASELINE.map((entry) =>
      createBaselineKey(entry.path, entry.rule, entry.line, entry.message),
    ),
  );
  const results = summary.results
    .map((result) => {
      const relativePath = normalizeViolationPath(result.file, options.baseDir, repoRoot);
      const violations = result.violations.filter(
        (violation) =>
          !baselineKeys.has(
            createBaselineKey(relativePath, violation.rule, violation.line, violation.message),
          ),
      );
      return { file: result.file, violations };
    })
    .filter((result) => result.violations.length > 0);

  return summarizeLintResults(results, summary.filesScanned, summary.directivesChecked);
}

export function summarizeLintResults(
  results: readonly { readonly file: string; readonly violations: readonly LintViolation[] }[],
  filesScanned: number,
  directivesChecked: number,
): LintSummary {
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const result of results) {
    for (const violation of result.violations) {
      switch (violation.severity) {
        case 'error':
          errorCount++;
          break;
        case 'warning':
          warningCount++;
          break;
        case 'info':
          infoCount++;
          break;
      }
    }
  }

  return {
    results,
    errorCount,
    warningCount,
    infoCount,
    filesScanned,
    directivesChecked,
  };
}

function createBaselineKey(filePath: string, rule: string, line: number, message: string): string {
  return `${normalizeSlashes(filePath)}\u0000${rule}\u0000${String(line)}\u0000${message}`;
}

function normalizeViolationPath(
  filePath: string,
  baseDir: string,
  repoRoot: string | undefined,
): string {
  const absolutePath = path.resolve(filePath);
  const root = repoRoot ?? path.resolve(baseDir);
  return normalizeSlashes(path.relative(root, absolutePath));
}

function normalizeSlashes(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function findRepoRoot(startDir: string): string | undefined {
  let current = path.resolve(startDir);

  for (;;) {
    if (fs.existsSync(path.join(current, '.git'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
}
