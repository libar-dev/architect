# Changelog

**Purpose:** Completed patterns in completion order.

---

## Overview

Completed milestones timeline covering 124 patterns.

| Metric    | Value |
| --------- | ----- |
| Patterns  | 124   |
| Completed | 124   |
| Active    | 0     |
| Planned   | 0     |
| Candidate | 0     |

| Pattern                                               | Status    | Role       | Source File                                                                                                          |
| ----------------------------------------------------- | --------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| ADR001TaxonomyCanonicalValues                         | completed |            | architect/decisions/adr-001-taxonomy-canonical-values.feature                                                        |
| ADR002GherkinOnlyTesting                              | completed |            | architect/decisions/adr-002-gherkin-only-testing.feature                                                             |
| ADR003SourceFirstPatternArchitecture                  | completed |            | architect/decisions/adr-003-source-first-pattern-architecture.feature                                                |
| ADR005CodecBasedMarkdownRendering                     | completed |            | architect/decisions/adr-005-codec-based-markdown-rendering.feature                                                   |
| ADR006SingleReadModelArchitecture                     | completed |            | architect/decisions/adr-006-single-read-model-architecture.feature                                                   |
| ADR007CoordinatedTaxonomyRedesign                     | completed |            | architect/decisions/adr-007-coordinated-taxonomy-redesign.feature                                                    |
| ADR008StepDefinitionStubsConvention                   | completed |            | architect/decisions/adr-008-step-definition-stubs-convention.feature                                                 |
| ADR009ProjectionTrustBoundary                         | completed |            | architect/decisions/adr-009-projection-trust-boundary.feature                                                        |
| ADR010DocumentationCompositionHelpers                 | completed |            | architect/decisions/adr-010-documentation-composition-helpers.feature                                                |
| ADR012DeliveryNavigation                              | completed |            | architect/decisions/adr-012-delivery-navigation.feature                                                              |
| ADR013TaxonomyRetirement                              | completed |            | architect/decisions/adr-013-taxonomy-retirement.feature                                                              |
| AnnotationCoverageProjection                          | completed | projection | packages/architect-projection/src/projections/operational-insights/index.ts                                          |
| AntiPatternDetector                                   | completed | service    | packages/architect-guard/src/validation/anti-patterns.ts                                                             |
| AntiPatternValidationTypes                            | completed | contract   | packages/architect-guard/src/validation/types.ts                                                                     |
| ArchitectureComparisonProjection                      | completed | projection | packages/architect-projection/src/projections/pattern-relations/architecture-comparison.ts                           |
| ArchitectureDiagramProjection                         | completed | projection | packages/architect-projection/src/projections/documentation-composition/architecture-diagram.ts                      |
| ArchitectureNavigationProjectionExecutableTests       | completed | projection | packages/architect-projection/tests/features/projections/pattern-relations/architecture-neighborhood.feature         |
| ArchitectureNeighborhoodProjection                    | completed | projection | packages/architect-projection/src/projections/pattern-relations/architecture-neighborhood.ts                         |
| BoundedContextProjection                              | completed | projection | packages/architect-projection/src/projections/pattern-relations/architecture-context.ts                              |
| BuildPipeline                                         | completed | service    | packages/architect-core/src/generators/pipeline/build-pipeline.ts                                                    |
| BusinessRulesProjection                               | completed | projection | packages/architect-projection/src/projections/governance/business-rules.ts                                           |
| BusinessRulesProjectionExecutableTests                | completed | projection | packages/architect-projection/tests/features/projections/governance/business-rules.feature                           |
| ChangelogProjection                                   | completed | projection | packages/architect-projection/src/projections/delivery-reporting/index.ts                                            |
| ChangelogProjectionExecutableTests                    | completed | projection | packages/architect-projection/tests/features/projections/delivery-reporting/changelog.feature                        |
| CLIErrorHandler                                       | completed | utility    | packages/architect-cli/src/cli/error-handler.ts                                                                      |
| CLIRuntimePaths                                       | completed | utility    | packages/architect-cli/src/cli/runtime-helpers.ts                                                                    |
| CLIVersionHelper                                      | completed | utility    | packages/architect-cli/src/cli/version.ts                                                                            |
| CompactTextRenderer                                   | completed | codec      | packages/architect-projection/src/renderers/render-compact-text.ts                                                   |
| ConfigBasedWorkflowDefinition                         | completed |            | packages/architect-core/tests/features/config/config-loader.feature                                                  |
| ConfigResolution                                      | completed |            | packages/architect-core/tests/features/config/config-resolution.feature                                              |
| ConfigurationAPI                                      | completed |            | packages/architect-core/tests/features/config/configuration-api.feature                                              |
| DataAPICLIErgonomics                                  | completed |            | tests/features/cli/data-api-help.feature                                                                             |
| DataAPIOutputShaping                                  | completed |            | tests/features/api/output-shaping/output-pipeline.feature                                                            |
| DecisionCatalogProjection                             | completed | projection | packages/architect-projection/src/projections/governance/decision-records.ts                                         |
| DecisionCatalogProjectionExecutableTests              | completed | projection | packages/architect-projection/tests/features/projections/governance/decision-records.feature                         |
| DefineConfigExecutableTests                           | completed |            | packages/architect-core/tests/features/config/define-config.feature                                                  |
| DeliverableProjection                                 | completed | projection | packages/architect-projection/src/projections/execution-context/deliverables.ts                                      |
| DeliveryProgressProjectionExecutableTests             | completed | projection | packages/architect-projection/tests/features/projections/delivery-reporting/phase-progress-status.feature            |
| DeliveryReportingProjectionSupport                    | completed | utility    | packages/architect-projection/src/projections/delivery-reporting/index.ts                                            |
| DeliveryReportingProjectionSupportExecutableTests     | completed | projection | packages/architect-projection/tests/features/projections/delivery-reporting/roadmap-timeline.feature                 |
| DependencyContextProjection                           | completed | projection | packages/architect-projection/src/projections/pattern-relations/dependency-context.ts                                |
| DependencyContextProjectionExecutableTests            | completed | projection | packages/architect-projection/tests/features/projections/pattern-relations/dependency-context.feature                |
| DependencyEdgeProjection                              | completed | projection | packages/architect-projection/src/projections/pattern-relations/dependency-edges.ts                                  |
| DependencyEdgeProjectionExecutableTests               | completed | projection | packages/architect-projection/tests/features/projections/pattern-relations/dependency-edges.feature                  |
| DocStringMediaType                                    | completed |            | packages/architect-core/tests/features/scanner/docstring-mediatype.feature                                           |
| DocumentationBundle                                   | completed | projection | packages/architect-projection/src/projections/documentation-composition/documentation-bundle.ts                      |
| DocumentationCompositionProjectionExecutableTests     | completed | projection | packages/architect-projection/tests/features/projections/documentation-composition/config-documentation.feature      |
| DocumentationCompositionProjectionSupport             | completed | utility    | packages/architect-projection/src/projections/documentation-composition/documentation-composition-shared.internal.ts |
| DualSourceMergeIntegration                            | completed |            | packages/architect-core/tests/features/extractor/dual-source-merge.feature                                           |
| ErrorFactoryTypes                                     | completed | contract   | packages/architect-core/src/types/errors.ts                                                                          |
| ErrorFactoryTypesExecutableTests                      | completed | contract   | packages/architect-core/tests/features/types/error-factories.feature                                                 |
| ExecutionContextProjectionExecutableTests             | completed | projection | packages/architect-projection/tests/features/projections/execution-context/context-session.feature                   |
| ExecutionContextProjectionSupport                     | completed | utility    | packages/architect-projection/src/projections/execution-context/execution-context-shared.internal.ts                 |
| FileDiscovery                                         | completed |            | packages/architect-core/tests/features/scanner/file-discovery.feature                                                |
| FileReadingListProjection                             | completed | projection | packages/architect-projection/src/projections/execution-context/file-reading-list.ts                                 |
| FragmentRendererDispatch                              | completed | codec      | packages/architect-projection/src/renderers/\_shared/dispatch.ts                                                     |
| GenerateDocsCli                                       | completed |            | tests/features/cli/generate-docs.feature                                                                             |
| GeneratorDegeneracyGuard                              | completed | utility    | packages/architect-projection/src/projections/documentation-composition/degenerate-guard.ts                          |
| GeneratorDegeneracyGuardExecutableTests               | completed | projection | packages/architect-projection/tests/features/projections/documentation-composition/degenerate-guard.feature          |
| GherkinRulesSupport                                   | completed |            | packages/architect-core/tests/features/scanner/gherkin-parser.feature                                                |
| GovernanceProjectionSupport                           | completed | utility    | packages/architect-projection/src/projections/governance/governance-shared.internal.ts                               |
| GovernanceValidationTaxonomyProjectionExecutableTests | completed | projection | packages/architect-projection/tests/features/projections/governance/validation-taxonomy.feature                      |
| HandoffProjection                                     | completed | projection | packages/architect-projection/src/projections/execution-context/handoff.ts                                           |
| JsonRenderer                                          | completed | codec      | packages/architect-projection/src/renderers/render-json.ts                                                           |
| LintEngine                                            | completed | service    | packages/architect-guard/src/lint/engine.ts                                                                          |
| LintModule                                            | completed | barrel     | packages/architect-guard/src/lint/index.ts                                                                           |
| LintPatternsCLI                                       | completed | service    | packages/architect-guard/src/cli/lint-patterns.ts                                                                    |
| LintPatternsCliBehavior                               | completed |            | tests/features/cli/lint-patterns.feature                                                                             |
| LintProcessCliBehavior                                | completed |            | tests/features/cli/lint-process.feature                                                                              |
| LintRules                                             | completed | service    | packages/architect-guard/src/lint/rules.ts                                                                           |
| MarkdownRenderer                                      | completed | codec      | packages/architect-projection/src/renderers/render-markdown.ts                                                       |
| MCPFileWatcher                                        | completed | utility    | packages/architect-mcp/src/file-watcher.ts                                                                           |
| MCPPipelineSession                                    | completed | service    | packages/architect-mcp/src/pipeline-session.ts                                                                       |
| MCPServer                                             | completed | service    | packages/architect-mcp/src/server.ts                                                                                 |
| MCPServerBin                                          | completed | utility    | packages/architect-mcp/src/cli/mcp-server.ts                                                                         |
| MCPToolRegistry                                       | completed | service    | packages/architect-mcp/src/tool-registry.ts                                                                          |
| OperationalInsightsProjectionExecutableTests          | completed | projection | packages/architect-projection/tests/features/projections/operational-insights/reporting.feature                      |
| OperationalInsightsProjectionSupport                  | completed | utility    | packages/architect-projection/src/projections/operational-insights/index.ts                                          |
| OrphanPatternListProjection                           | completed | projection | packages/architect-projection/src/projections/pattern-relations/orphan-pattern-list.ts                               |
| OverviewProjection                                    | completed | projection | packages/architect-projection/src/projections/operational-insights/index.ts                                          |
| PatternCatalogProjection                              | completed | projection | packages/architect-projection/src/projections/pattern-relations/pattern-catalog.ts                                   |
| PatternCatalogStatusFilterExecutableTests             | completed | projection | packages/architect-projection/tests/features/projections/pattern-relations/pattern-catalog-status-filter.feature     |
| PatternDetailProjection                               | completed | projection | packages/architect-projection/src/projections/pattern-relations/pattern-detail.ts                                    |
| PatternDetailProjectionExecutableTests                | completed | projection | packages/architect-projection/tests/features/projections/pattern-relations/pattern-detail.feature                    |
| PatternGraphAPICLI                                    | completed |            | tests/features/cli/pattern-graph-cli-core.feature                                                                    |
| PatternGraphCliArchHealth                             | completed |            | tests/features/cli/pattern-graph-cli-arch-health.feature                                                             |
| PatternGraphCliOutputModifiers                        | completed |            | tests/features/cli/pattern-graph-cli-output-modifiers.feature                                                        |
| PatternGraphCliQueryPassthrough                       | completed |            | tests/features/cli/pattern-graph-cli-query.feature                                                                   |
| PatternGraphCliRulesSubcommand                        | completed |            | tests/features/cli/pattern-graph-cli-rules-subcommand.feature                                                        |
| PatternGraphCliSubcommands                            | completed |            | tests/features/cli/pattern-graph-cli-subcommands.feature                                                             |
| PatternRelationsProjectionSupport                     | completed | utility    | packages/architect-projection/src/projections/\_shared/pattern-helpers.internal.ts                                   |
| PatternSummaryCatalogProjectionExecutableTests        | completed | projection | packages/architect-projection/tests/features/projections/pattern-relations/pattern-summary.feature                   |
| PatternSummaryProjection                              | completed | projection | packages/architect-projection/src/projections/pattern-relations/pattern-summary.ts                                   |
| PDR001SessionWorkflowCommands                         | completed |            | architect/decisions/pdr-001-session-workflow-commands.feature                                                        |
| PDR005ProcessGuardFSM                                 | completed |            | architect/decisions/pdr-005-process-guard-fsm.feature                                                                |
| PDR006AdvisoryProcessGuardProtection                  | completed |            | architect/decisions/pdr-006-advisory-process-guard-protection.feature                                                |
| PrChangeReviewProjection                              | completed | projection | packages/architect-projection/src/projections/documentation-composition/pr-change-review.ts                          |
| ProjectConfigLoader                                   | completed |            | packages/architect-core/tests/features/config/project-config-loader.feature                                          |
| ProjectConfigProjection                               | completed | projection | packages/architect-projection/src/projections/documentation-composition/project-config.ts                            |
| RequirementDigestProjection                           | completed | projection | packages/architect-projection/src/projections/operational-insights/index.ts                                          |
| RequirementExecutableDigestProjection                 | completed | projection | packages/architect-projection/src/projections/operational-insights/index.ts                                          |
| RequirementSpecsDigestProjection                      | completed | projection | packages/architect-projection/src/projections/operational-insights/index.ts                                          |
| ResultMonadTypes                                      | completed | contract   | packages/architect-core/src/types/result.ts                                                                          |
| ResultMonadTypesExecutableTests                       | completed | contract   | packages/architect-core/tests/features/types/result-monad.feature                                                    |
| RoadmapTimelineProjection                             | completed | projection | packages/architect-projection/src/projections/delivery-reporting/index.ts                                            |
| RoleProfileProjection                                 | completed | projection | packages/architect-projection/src/projections/operational-insights/index.ts                                          |
| ScannerCore                                           | completed |            | packages/architect-core/tests/features/behavior/scanner-core.feature                                                 |
| ScopeReadinessProjection                              | completed | projection | packages/architect-projection/src/projections/execution-context/scope-readiness.ts                                   |
| SessionContextProjection                              | completed | projection | packages/architect-projection/src/projections/execution-context/session-context.ts                                   |
| ShapeExtraction                                       | completed |            | packages/architect-core/tests/features/extractor/shape-extraction-types.feature                                      |
| SourceInventoryProjection                             | completed | projection | packages/architect-projection/src/projections/operational-insights/index.ts                                          |
| SourceMerging                                         | completed |            | packages/architect-core/tests/features/config/source-merging.feature                                                 |
| StatusDistributionProjection                          | completed | projection | packages/architect-projection/src/projections/delivery-reporting/index.ts                                            |
| TagUsageProjection                                    | completed | projection | packages/architect-projection/src/projections/operational-insights/index.ts                                          |
| TaxonomyDigestProjection                              | completed | projection | packages/architect-projection/src/projections/governance/taxonomy-digest.ts                                          |
| TaxonomyDocumentationCluster                          | completed |            | architect/specs/documentation-projection/05-taxonomy-documentation-cluster.feature                                   |
| TraceabilityMatrixProjection                          | completed | projection | packages/architect-projection/src/projections/delivery-reporting/index.ts                                            |
| TraceabilityMatrixProjectionExecutableTests           | completed | projection | packages/architect-projection/tests/features/projections/delivery-reporting/traceability-matrix.feature              |
| TypeScriptTaxonomyImplementation                      | completed |            | packages/architect-core/tests/features/types/tag-registry-builder.feature                                            |
| UiRenderer                                            | completed | codec      | packages/architect-projection/src/renderers/render-ui.ts                                                             |
| ValidatePatternsCLI                                   | completed | service    | packages/architect-guard/src/cli/validate-patterns.ts                                                                |
| ValidationModule                                      | completed | barrel     | packages/architect-guard/src/validation/index.ts                                                                     |
| ValidationRuleDigestProjection                        | completed | projection | packages/architect-projection/src/projections/governance/validation-rule-digest.ts                                   |
| ValidatorReadModelConsolidation                       | completed |            | tests/features/cli/validate-patterns.feature                                                                         |
