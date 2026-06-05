# Design Review

**Purpose:** Component diagrams over the live pattern graph — including not-yet-implemented specs — so a planned pattern's shape is reviewable before implementation.
**Detail Level:** Working-state-inclusive context map plus per-lens component diagrams

---

## Overview

This view captures 213 patterns across 24 diagrams in the Component view.

## Related views

- [By Layer](design-review/by-layer.md)
- [By Package](design-review/by-package.md)
- [By Theme](design-review/by-theme.md)

## Diagrams

### Context Map

Each node is a group; each arrow is a cross-group dependency (`depends-on` / `uses`, pointing from dependant to dependency). The per-group diagrams below detail each group’s internal dependencies and any see-also references.

```mermaid
graph LR
  api["api (7)"]
  cli["cli (6)"]
  configuration["configuration (4)"]
  delivery_reporting["delivery-reporting (7)"]
  documentation_composition["documentation-composition (8)"]
  domain["domain (1)"]
  execution_context["execution-context (8)"]
  extractor["extractor (7)"]
  generator["generator (4)"]
  governance["governance (9)"]
  lint["lint (4)"]
  operational_insights["operational-insights (10)"]
  pattern_relations["pattern-relations (12)"]
  pipeline["pipeline (1)"]
  process_guard["process-guard (6)"]
  projection["projection (47)"]
  read_api["read-api (7)"]
  rendering["rendering (9)"]
  scanner["scanner (4)"]
  validation["validation (8)"]
  validation_schemas["validation-schemas (4)"]
  role_contract["role: contract (2)"]
  pkg_architect_package_content["Architect Package Content (38)"]
  api --> pipeline
  api --> projection
  api --> read_api
  api --> rendering
  cli --> api
  cli --> lint
  cli --> rendering
  cli --> role_contract
  cli --> scanner
  delivery_reporting --> execution_context
  delivery_reporting --> pattern_relations
  documentation_composition --> rendering
  extractor --> read_api
  extractor --> scanner
  extractor --> validation_schemas
  governance --> rendering
  lint --> process_guard
  lint --> validation
  lint --> validation_schemas
  operational_insights --> rendering
  pattern_relations --> execution_context
  pipeline --> extractor
  pipeline --> scanner
  pipeline --> validation_schemas
  pkg_architect_package_content --> configuration
  pkg_architect_package_content --> process_guard
  pkg_architect_package_content --> projection
  process_guard --> generator
  process_guard --> lint
  process_guard --> scanner
  process_guard --> validation
  projection --> api
  projection --> delivery_reporting
  projection --> documentation_composition
  projection --> execution_context
  projection --> governance
  projection --> operational_insights
  projection --> pattern_relations
  projection --> rendering
  projection --> validation_schemas
  read_api --> validation_schemas
  validation --> extractor
  validation --> scanner
  validation --> validation_schemas
```

### Bounded context: api (7 patterns)

```mermaid
graph TD
  architectbriefdeterministicbundle["ArchitectBriefDeterministicBundle<br/>(candidate)"]
  mcpfilewatcher["MCPFileWatcher<br/>(utility · completed)"]
  mcpoutputschemavalidation["McpOutputSchemaValidation<br/>(candidate)"]
  mcppipelinesession["MCPPipelineSession<br/>(service · completed)"]
  mcpserver["MCPServer<br/>(service · completed)"]
  mcptoolregistry["MCPToolRegistry<br/>(service · completed)"]
  modelenricheddataapi["ModelEnrichedDataAPI<br/>(candidate)"]
  architectbriefdeterministicbundle -->|depends-on| mcptoolregistry
  architectbriefdeterministicbundle -. see-also .- modelenricheddataapi
  mcpfilewatcher -->|depends-on| mcppipelinesession
  mcppipelinesession -->|depends-on| mcpfilewatcher
  mcppipelinesession -->|depends-on| mcptoolregistry
  mcpserver -->|depends-on| mcpfilewatcher
  mcpserver -->|depends-on| mcppipelinesession
  mcpserver -->|depends-on| mcptoolregistry
  mcptoolregistry -->|depends-on| mcppipelinesession
  modelenricheddataapi -->|depends-on| architectbriefdeterministicbundle
```

### Bounded context: cli (6 patterns)

```mermaid
graph TD
  clierrorhandler["CLIErrorHandler<br/>(utility · completed)"]
  cliruntimepaths["CLIRuntimePaths<br/>(utility · completed)"]
  cliversionhelper["CLIVersionHelper<br/>(utility · completed)"]
  lintpatternscli["LintPatternsCLI<br/>(service · completed)"]
  mcpserverbin["MCPServerBin<br/>(utility · completed)"]
  patterngraphcli["PatternGraphCLI<br/>(service · active)"]
  cliversionhelper -->|depends-on| cliruntimepaths
  patterngraphcli -->|depends-on| cliruntimepaths
  patterngraphcli -->|depends-on| cliversionhelper
```

### Bounded context: configuration (4 patterns)

```mermaid
graph TD
  configloader["ConfigLoader<br/>(service · active)"]
  defineconfig["DefineConfig<br/>(utility · active)"]
  registrybuilder["RegistryBuilder<br/>(utility · active)"]
  sourcemerge["SourceMerge<br/>(utility · active)"]
```

### Bounded context: delivery-reporting (7 patterns)

```mermaid
graph TD
  deliveryreportingfragmentcontracts["DeliveryReportingFragmentContracts<br/>(contract · active)"]
  deliveryreportingsupporting["DeliveryReportingSupporting<br/>(contract · active)"]
  phaseprogress["PhaseProgress<br/>(contract · active)"]
  releasenotesdigest["ReleaseNotesDigest<br/>(contract · active)"]
  roadmaptimeline["RoadmapTimeline<br/>(contract · active)"]
  statusdistribution["StatusDistribution<br/>(contract · active)"]
  traceabilitymatrix["TraceabilityMatrix<br/>(contract · active)"]
```

### Bounded context: documentation-composition (8 patterns)

```mermaid
graph TD
  apireferencedigest["ApiReferenceDigest<br/>(contract · active)"]
  apireferenceprojection["ApiReferenceProjection<br/>(projection · active)"]
  architecturediagram["ArchitectureDiagram<br/>(contract · active)"]
  documentationcompositionsupporting["DocumentationCompositionSupporting<br/>(contract · active)"]
  emissiondescriptor["EmissionDescriptor<br/>(contract · active)"]
  generatordegeneracyguard["GeneratorDegeneracyGuard<br/>(utility · completed)"]
  prchangereview["PrChangeReview<br/>(contract · active)"]
  projectconfigsnapshot["ProjectConfigSnapshot<br/>(contract · active)"]
  apireferenceprojection -->|depends-on| apireferencedigest
```

### Bounded context: domain (1 pattern)

```mermaid
graph TD
  packageresolver["PackageResolver<br/>(utility · active)"]
```

### Bounded context: execution-context (8 patterns)

```mermaid
graph TD
  deliverable["Deliverable<br/>(contract · active)"]
  deliverablemanifest["DeliverableManifest<br/>(contract · active)"]
  executioncontextsupporting["ExecutionContextSupporting<br/>(contract · active)"]
  filereadinglist["FileReadingList<br/>(contract · active)"]
  handoffrecord["HandoffRecord<br/>(contract · active)"]
  scopereadinesscheck["ScopeReadinessCheck<br/>(contract · active)"]
  scopereadinessreport["ScopeReadinessReport<br/>(contract · active)"]
  sessioncontextbundle["SessionContextBundle<br/>(contract · active)"]
  handoffrecord -->|depends-on| executioncontextsupporting
  scopereadinesscheck -->|depends-on| executioncontextsupporting
  scopereadinessreport -->|depends-on| executioncontextsupporting
  sessioncontextbundle -->|depends-on| executioncontextsupporting
```

### Bounded context: extractor (7 patterns)

```mermaid
graph TD
  docextractor["DocExtractor<br/>(service · active)"]
  dualsourceextractor["DualSourceExtractor<br/>(service · active)"]
  extractiondiagnostics["ExtractionDiagnostics<br/>(contract · active)"]
  gherkinextractor["GherkinExtractor<br/>(service · active)"]
  gherkinparsefailurediagnostics["GherkinParseFailureDiagnostics<br/>(candidate)"]
  layerinference["LayerInference<br/>(service · active)"]
  shapeextractor["ShapeExtractor<br/>(service · active)"]
  docextractor -->|depends-on| shapeextractor
  gherkinextractor -->|depends-on| layerinference
```

### Bounded context: generator (4 patterns)

```mermaid
graph TD
  gitbranchdiff["GitBranchDiff<br/>(utility · active)"]
  githelpers["GitHelpers<br/>(utility · active)"]
  gitmodule["GitModule<br/>(barrel · active)"]
  gitnamestatusparser["GitNameStatusParser<br/>(utility · active)"]
  gitbranchdiff -->|depends-on| gitnamestatusparser
  gitmodule -->|depends-on| gitbranchdiff
  gitmodule -->|depends-on| githelpers
```

### Bounded context: governance (9 patterns)

```mermaid
graph TD
  businessrule["BusinessRule<br/>(contract · active)"]
  businessrulereference["BusinessRuleReference<br/>(contract · active)"]
  businessruleset["BusinessRuleSet<br/>(contract · active)"]
  decisioncatalog["DecisionCatalog<br/>(contract · active)"]
  decisionrecord["DecisionRecord<br/>(contract · active)"]
  decisionrecordtemporalhygiene["DecisionRecordTemporalHygiene<br/>(candidate)"]
  governancesupporting["GovernanceSupporting<br/>(contract · active)"]
  taxonomydigest["TaxonomyDigest<br/>(contract · active)"]
  validationruledigest["ValidationRuleDigest<br/>(contract · active)"]
```

### Bounded context: lint (4 patterns)

```mermaid
graph TD
  lintengine["LintEngine<br/>(service · completed)"]
  lintmodule["LintModule<br/>(barrel · completed)"]
  lintrules["LintRules<br/>(service · completed)"]
  processguarddecider["ProcessGuardDecider<br/>(decider · active)"]
  lintengine -->|depends-on| lintrules
  lintmodule -->|depends-on| lintengine
  lintmodule -->|depends-on| lintrules
```

### Bounded context: operational-insights (10 patterns)

```mermaid
graph TD
  annotationcoverage["AnnotationCoverage<br/>(contract · active)"]
  operationalinsightssupporting["OperationalInsightsSupporting<br/>(contract · active)"]
  overviewdigest["OverviewDigest<br/>(contract · active)"]
  requirementdigest["RequirementDigest<br/>(contract · active)"]
  roleprofile["RoleProfile<br/>(contract · active)"]
  roleprofilecollection["RoleProfileCollection<br/>(contract · active)"]
  sourceinventorydigest["SourceInventoryDigest<br/>(contract · active)"]
  sourceinventoryentry["SourceInventoryEntry<br/>(contract · active)"]
  tagusageentry["TagUsageEntry<br/>(contract · active)"]
  tagusagematrix["TagUsageMatrix<br/>(contract · active)"]
  sourceinventorydigest -->|depends-on| sourceinventoryentry
  tagusagematrix -->|depends-on| tagusageentry
```

### Bounded context: pattern-relations (12 patterns)

```mermaid
graph TD
  architecturecomparison["ArchitectureComparison<br/>(contract · active)"]
  architectureneighborhood["ArchitectureNeighborhood<br/>(contract · active)"]
  boundedcontextfragmentcontract["BoundedContextFragmentContract<br/>(contract · active)"]
  dependencycontext["DependencyContext<br/>(contract · active)"]
  dependencyedge["DependencyEdge<br/>(contract · active)"]
  dependencyedgeset["DependencyEdgeSet<br/>(contract · active)"]
  orphanpatternlist["OrphanPatternList<br/>(contract · active)"]
  patterncatalog["PatternCatalog<br/>(contract · active)"]
  patterndetail["PatternDetail<br/>(contract · active)"]
  patternrelationsfragmentcontracts["PatternRelationsFragmentContracts<br/>(contract · active)"]
  patternrelationssupporting["PatternRelationsSupporting<br/>(contract · active)"]
  patternsummary["PatternSummary<br/>(contract · active)"]
```

### Bounded context: pipeline (1 pattern)

```mermaid
graph TD
  buildpipeline["BuildPipeline<br/>(service · completed)"]
```

### Bounded context: process-guard (6 patterns)

```mermaid
graph TD
  deriveprocessstate["DeriveProcessState<br/>(read-model · active)"]
  detectchanges["DetectChanges<br/>(service · active)"]
  lintprocesscli["LintProcessCLI<br/>(service · active)"]
  processguardlinter["ProcessGuardLinter<br/>(barrel · active)"]
  processguardtypes["ProcessGuardTypes<br/>(contract · active)"]
  sessionstatereader["SessionStateReader<br/>(service · active)"]
  deriveprocessstate -->|depends-on| sessionstatereader
  detectchanges -->|depends-on| deriveprocessstate
  lintprocesscli -->|depends-on| processguardlinter
  processguardlinter -->|depends-on| deriveprocessstate
  processguardlinter -->|depends-on| detectchanges
```

### Bounded context: projection (47 patterns)

```mermaid
graph TD
  annotationcoverageprojection["AnnotationCoverageProjection<br/>(projection · completed)"]
  architecturecomparisonprojection["ArchitectureComparisonProjection<br/>(projection · completed)"]
  architecturediagramprojection["ArchitectureDiagramProjection<br/>(projection · completed)"]
  architecturegraphprojection["ArchitectureGraphProjection<br/>(projection · active)"]
  architectureneighborhoodprojection["ArchitectureNeighborhoodProjection<br/>(projection · completed)"]
  boundedcontextprojection["BoundedContextProjection<br/>(projection · completed)"]
  businessrulesprojection["BusinessRulesProjection<br/>(projection · completed)"]
  decisioncatalogprojection["DecisionCatalogProjection<br/>(projection · completed)"]
  deliverableprojection["DeliverableProjection<br/>(projection · completed)"]
  deliveryreportingprojectionsupport["DeliveryReportingProjectionSupport<br/>(utility · completed)"]
  dependencycontextprojection["DependencyContextProjection<br/>(projection · completed)"]
  dependencyedgeprojection["DependencyEdgeProjection<br/>(projection · completed)"]
  designreviewprojection["DesignReviewProjection<br/>(projection · active)"]
  documentationbundle["DocumentationBundle<br/>(projection · completed)"]
  documentationcompositionprojectionsupport["DocumentationCompositionProjectionSupport<br/>(utility · completed)"]
  documentationtyperegistry["DocumentationTypeRegistry<br/>(contract · active)"]
  executioncontextprojectionsupport["ExecutionContextProjectionSupport<br/>(utility · completed)"]
  filereadinglistprojection["FileReadingListProjection<br/>(projection · completed)"]
  governanceprojectionsupport["GovernanceProjectionSupport<br/>(utility · completed)"]
  handoffprojection["HandoffProjection<br/>(projection · completed)"]
  openquestionlistprojection["OpenQuestionListProjection<br/>(projection · active)"]
  operationalinsightsprojectionsupport["OperationalInsightsProjectionSupport<br/>(utility · completed)"]
  orphanpatternlistprojection["OrphanPatternListProjection<br/>(projection · completed)"]
  overviewprojection["OverviewProjection<br/>(projection · completed)"]
  patternbundleprojection["PatternBundleProjection<br/>(projection · active)"]
  patterncatalogprojection["PatternCatalogProjection<br/>(projection · completed)"]
  patterndetailprojection["PatternDetailProjection<br/>(projection · completed)"]
  patternrelationsprojectionsupport["PatternRelationsProjectionSupport<br/>(utility · completed)"]
  patternsummaryprojection["PatternSummaryProjection<br/>(projection · completed)"]
  phaseprogressprojection["PhaseProgressProjection<br/>(projection · completed)"]
  prchangereviewprojection["PrChangeReviewProjection<br/>(projection · completed)"]
  projectconfigprojection["ProjectConfigProjection<br/>(projection · completed)"]
  releasenotesprojection["ReleaseNotesProjection<br/>(projection · completed)"]
  requirementdigestprojection["RequirementDigestProjection<br/>(projection · completed)"]
  requirementexecutabledigestprojection["RequirementExecutableDigestProjection<br/>(projection · completed)"]
  requirementspecsdigestprojection["RequirementSpecsDigestProjection<br/>(projection · completed)"]
  roadmaptimelineprojection["RoadmapTimelineProjection<br/>(projection · completed)"]
  roleprofileprojection["RoleProfileProjection<br/>(projection · completed)"]
  scopereadinessprojection["ScopeReadinessProjection<br/>(projection · completed)"]
  sessioncontextprojection["SessionContextProjection<br/>(projection · completed)"]
  sourceinventoryprojection["SourceInventoryProjection<br/>(projection · completed)"]
  statusdistributionprojection["StatusDistributionProjection<br/>(projection · completed)"]
  tagusageprojection["TagUsageProjection<br/>(projection · completed)"]
  taxonomydigestprojection["TaxonomyDigestProjection<br/>(projection · completed)"]
  traceabilitymatrixprojection["TraceabilityMatrixProjection<br/>(projection · completed)"]
  validationruledigestprojection["ValidationRuleDigestProjection<br/>(projection · completed)"]
  valuetransferstate["ValueTransferState<br/>(candidate)"]
  annotationcoverageprojection -->|depends-on| operationalinsightsprojectionsupport
  architecturecomparisonprojection -->|depends-on| patternrelationsprojectionsupport
  architecturediagramprojection -->|depends-on| documentationcompositionprojectionsupport
  architectureneighborhoodprojection -->|depends-on| patternrelationsprojectionsupport
  boundedcontextprojection -->|depends-on| patternrelationsprojectionsupport
  businessrulesprojection -->|depends-on| governanceprojectionsupport
  decisioncatalogprojection -->|depends-on| governanceprojectionsupport
  deliverableprojection -->|depends-on| executioncontextprojectionsupport
  dependencycontextprojection -->|depends-on| patternrelationsprojectionsupport
  dependencyedgeprojection -->|depends-on| patternrelationsprojectionsupport
  designreviewprojection -->|depends-on| architecturediagramprojection
  documentationbundle -->|depends-on| documentationcompositionprojectionsupport
  filereadinglistprojection -->|depends-on| executioncontextprojectionsupport
  handoffprojection -->|depends-on| executioncontextprojectionsupport
  openquestionlistprojection -->|depends-on| patternrelationsprojectionsupport
  orphanpatternlistprojection -->|depends-on| patternrelationsprojectionsupport
  overviewprojection -->|depends-on| operationalinsightsprojectionsupport
  patternbundleprojection -->|depends-on| patternrelationsprojectionsupport
  patterncatalogprojection -->|depends-on| patternrelationsprojectionsupport
  patterndetailprojection -->|depends-on| patternrelationsprojectionsupport
  patternsummaryprojection -->|depends-on| patternrelationsprojectionsupport
  phaseprogressprojection -->|depends-on| deliveryreportingprojectionsupport
  prchangereviewprojection -->|depends-on| documentationcompositionprojectionsupport
  projectconfigprojection -->|depends-on| documentationcompositionprojectionsupport
  releasenotesprojection -->|depends-on| deliveryreportingprojectionsupport
  requirementdigestprojection -->|depends-on| operationalinsightsprojectionsupport
  requirementexecutabledigestprojection -->|depends-on| operationalinsightsprojectionsupport
  requirementspecsdigestprojection -->|depends-on| operationalinsightsprojectionsupport
  roadmaptimelineprojection -->|depends-on| deliveryreportingprojectionsupport
  roleprofileprojection -->|depends-on| operationalinsightsprojectionsupport
  scopereadinessprojection -->|depends-on| executioncontextprojectionsupport
  sessioncontextprojection -->|depends-on| executioncontextprojectionsupport
  sourceinventoryprojection -->|depends-on| operationalinsightsprojectionsupport
  statusdistributionprojection -->|depends-on| deliveryreportingprojectionsupport
  tagusageprojection -->|depends-on| operationalinsightsprojectionsupport
  taxonomydigestprojection -->|depends-on| governanceprojectionsupport
  traceabilitymatrixprojection -->|depends-on| deliveryreportingprojectionsupport
  validationruledigestprojection -->|depends-on| governanceprojectionsupport
```

### Bounded context: read-api (7 patterns)

```mermaid
graph TD
  architectureinspection["ArchitectureInspection<br/>(utility · active)"]
  decisionresolution["DecisionResolution<br/>(utility · active)"]
  graphinventory["GraphInventory<br/>(utility · active)"]
  patternclassification["PatternClassification<br/>(utility · active)"]
  patterngraphapi["PatternGraphApi<br/>(utility · active)"]
  patternhelpers["PatternHelpers<br/>(utility · active)"]
  ruleaggregation["RuleAggregation<br/>(utility · active)"]
  architectureinspection -->|depends-on| patternhelpers
  decisionresolution -->|depends-on| patternhelpers
  graphinventory -->|depends-on| patternhelpers
  patterngraphapi -->|depends-on| patternhelpers
  ruleaggregation -->|depends-on| patternhelpers
```

### Bounded context: rendering (9 patterns)

```mermaid
graph TD
  blockschema["BlockSchema<br/>(contract · active)"]
  compacttextrenderer["CompactTextRenderer<br/>(codec · completed)"]
  fragmentrendererdispatch["FragmentRendererDispatch<br/>(codec · completed)"]
  jsonrenderer["JsonRenderer<br/>(codec · completed)"]
  markdownblockparser["MarkdownBlockParser<br/>(codec · active)"]
  markdownrenderer["MarkdownRenderer<br/>(codec · completed)"]
  projectionfragmentcontracts["ProjectionFragmentContracts<br/>(contract · active)"]
  projectionfragmentschema["ProjectionFragmentSchema<br/>(contract · active)"]
  uirenderer["UiRenderer<br/>(codec · completed)"]
  compacttextrenderer -->|depends-on| fragmentrendererdispatch
  compacttextrenderer -->|depends-on| projectionfragmentschema
  fragmentrendererdispatch -->|depends-on| projectionfragmentschema
  jsonrenderer -->|depends-on| projectionfragmentschema
  markdownrenderer -->|depends-on| blockschema
  markdownrenderer -->|depends-on| fragmentrendererdispatch
  markdownrenderer -->|depends-on| projectionfragmentschema
  uirenderer -->|depends-on| blockschema
  uirenderer -->|depends-on| fragmentrendererdispatch
  uirenderer -->|depends-on| projectionfragmentschema
```

### Bounded context: scanner (4 patterns)

```mermaid
graph TD
  astparser["AstParser<br/>(service · active)"]
  gherkinastparser["GherkinAstParser<br/>(service · active)"]
  gherkinscanner["GherkinScanner<br/>(service · active)"]
  patternscanner["PatternScanner<br/>(service · active)"]
```

### Bounded context: validation (8 patterns)

```mermaid
graph TD
  antipatterndetector["AntiPatternDetector<br/>(service · completed)"]
  dodvalidationtypes["DoDValidationTypes<br/>(contract · completed)"]
  dodvalidator["DoDValidator<br/>(service · completed)"]
  fsmstates["FSMStates<br/>(read-model · active)"]
  fsmtransitions["FSMTransitions<br/>(read-model · active)"]
  fsmvalidator["FSMValidator<br/>(decider · active)"]
  validatepatternscli["ValidatePatternsCLI<br/>(service · completed)"]
  validationmodule["ValidationModule<br/>(barrel · completed)"]
  antipatterndetector -->|depends-on| dodvalidationtypes
  dodvalidator -->|depends-on| dodvalidationtypes
  fsmvalidator -->|depends-on| fsmstates
  fsmvalidator -->|depends-on| fsmtransitions
  validationmodule -->|depends-on| antipatterndetector
  validationmodule -->|depends-on| dodvalidationtypes
  validationmodule -->|depends-on| dodvalidator
```

### Bounded context: validation-schemas (4 patterns)

```mermaid
graph TD
  codecutils["CodecUtils<br/>(codec · active)"]
  extractedpattern["ExtractedPattern<br/>(contract · active)"]
  patterngraph["PatternGraph<br/>(contract · active)"]
  tagregistryschemas["TagRegistrySchemas<br/>(contract · active)"]
  patterngraph -->|depends-on| extractedpattern
```

### Uncontextualized · role: contract (2 patterns)

```mermaid
graph TD
  errorfactorytypes["ErrorFactoryTypes<br/>(contract · completed)"]
  resultmonadtypes["ResultMonadTypes<br/>(contract · completed)"]
```

### Unclassified · Architect Package Content (38 patterns)

```mermaid
graph TD
  adr001taxonomycanonicalvalues["ADR001TaxonomyCanonicalValues<br/>(completed)"]
  adr002gherkinonlytesting["ADR002GherkinOnlyTesting<br/>(completed)"]
  adr003sourcefirstpatternarchitecture["ADR003SourceFirstPatternArchitecture<br/>(completed)"]
  adr005codecbasedmarkdownrendering["ADR005CodecBasedMarkdownRendering<br/>(completed)"]
  adr006singlereadmodelarchitecture["ADR006SingleReadModelArchitecture<br/>(completed)"]
  adr007coordinatedtaxonomyredesign["ADR007CoordinatedTaxonomyRedesign<br/>(active)"]
  adr008stepdefinitionstubsconvention["ADR008StepDefinitionStubsConvention<br/>(completed)"]
  adr009projectiontrustboundary["ADR009ProjectionTrustBoundary<br/>(completed)"]
  adr010documentationcompositionhelpers["ADR010DocumentationCompositionHelpers<br/>(completed)"]
  apireferenceshapecoverage["ApiReferenceShapeCoverage<br/>(candidate)"]
  architecturedelta["ArchitectureDelta<br/>(roadmap)"]
  assistivecodeintelligence["AssistiveCodeIntelligence<br/>(epic · candidate)"]
  codecbehaviorexecutabletests["CodecBehaviorExecutableTests<br/>(roadmap)"]
  dataapirelationshipgraph["DataAPIRelationshipGraph<br/>(roadmap)"]
  documentationprojection["DocumentationProjection<br/>(epic · candidate)"]
  dodvalidation["DoDValidation<br/>(roadmap)"]
  effortvariancetracking["EffortVarianceTracking<br/>(roadmap)"]
  generatorinfrastructureexecutabletests["GeneratorInfrastructureExecutableTests<br/>(roadmap)"]
  goalorientednavigation["GoalOrientedNavigation<br/>(roadmap)"]
  livingroadmapcli["LivingRoadmapCLI<br/>(roadmap)"]
  monoreposupport["MonorepoSupport<br/>(roadmap)"]
  multisourcecomposition["MultiSourceComposition<br/>(candidate)"]
  onesourcemultipleaudiences["OneSourceMultipleAudiences<br/>(candidate)"]
  pdr001sessionworkflowcommands["PDR001SessionWorkflowCommands<br/>(roadmap)"]
  pdr005processguardfsm["PDR005ProcessGuardFSM<br/>(completed)"]
  phasenumberingconventions["PhaseNumberingConventions<br/>(roadmap)"]
  prdimplementationsection["PrdImplementationSection<br/>(roadmap)"]
  progressivegovernance["ProgressiveGovernance<br/>(roadmap)"]
  readmodelreflexivity["ReadModelReflexivity<br/>(candidate)"]
  sessionfilecleanup["SessionFileCleanup<br/>(roadmap)"]
  setupcommand["SetupCommand<br/>(roadmap)"]
  sourcecanonical["SourceCanonical<br/>(candidate)"]
  statusawareeslintsuppression["StatusAwareEslintSuppression<br/>(roadmap)"]
  stepdefinitioncompletion["StepDefinitionCompletion<br/>(roadmap)"]
  streaminggitdiff["StreamingGitDiff<br/>(roadmap)"]
  taxonomydocumentationcluster["TaxonomyDocumentationCluster<br/>(roadmap)"]
  traceabilityenhancements["TraceabilityEnhancements<br/>(roadmap)"]
  traceabilitygenerator["TraceabilityGenerator<br/>(roadmap)"]
  adr001taxonomycanonicalvalues -. see-also .- adr007coordinatedtaxonomyredesign
  adr003sourcefirstpatternarchitecture -->|depends-on| adr001taxonomycanonicalvalues
  adr006singlereadmodelarchitecture -->|depends-on| adr005codecbasedmarkdownrendering
  adr007coordinatedtaxonomyredesign -->|depends-on| adr001taxonomycanonicalvalues
  adr007coordinatedtaxonomyredesign -->|depends-on| pdr005processguardfsm
  adr008stepdefinitionstubsconvention -->|depends-on| adr002gherkinonlytesting
  adr008stepdefinitionstubsconvention -->|depends-on| adr003sourcefirstpatternarchitecture
  adr009projectiontrustboundary -. see-also .- adr005codecbasedmarkdownrendering
  adr009projectiontrustboundary -. see-also .- adr006singlereadmodelarchitecture
  adr010documentationcompositionhelpers -. see-also .- adr005codecbasedmarkdownrendering
  adr010documentationcompositionhelpers -. see-also .- adr006singlereadmodelarchitecture
  adr010documentationcompositionhelpers -. see-also .- adr009projectiontrustboundary
  documentationprojection -->|depends-on| adr010documentationcompositionhelpers
  goalorientednavigation -. see-also .- adr006singlereadmodelarchitecture
  goalorientednavigation -. see-also .- adr009projectiontrustboundary
  goalorientednavigation -. see-also .- adr010documentationcompositionhelpers
  goalorientednavigation -. see-also .- taxonomydocumentationcluster
  pdr005processguardfsm -->|depends-on| adr001taxonomycanonicalvalues
  stepdefinitioncompletion -->|depends-on| adr002gherkinonlytesting
  taxonomydocumentationcluster -. see-also .- adr010documentationcompositionhelpers
  taxonomydocumentationcluster -. see-also .- multisourcecomposition
  taxonomydocumentationcluster -. see-also .- onesourcemultipleaudiences
  traceabilityenhancements -->|depends-on| traceabilitygenerator
```

## Fan-in

Most-depended-on patterns in this view, ranked by in-view dependant count.

| Pattern                              | Dependants | Top dependants                                                                                                                                          |
| ------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ProjectionFragmentContracts          | 17         | ArchitectureDiagramProjection, BusinessRulesProjection, DecisionCatalogProjection, DeliverableProjection, DocumentationBundle                           |
| ExtractedPattern                     | 14         | ArchitectureInspection, DecisionResolution, DeliveryReportingProjectionSupport, DualSourceExtractor, ExecutionContextProjectionSupport                  |
| PatternGraph                         | 11         | ArchitectureInspection, BuildPipeline, DecisionResolution, DoDValidator, GraphInventory                                                                 |
| PatternRelationsFragmentContracts    | 11         | ArchitectureComparisonProjection, ArchitectureNeighborhoodProjection, DependencyContextProjection, DependencyEdgeProjection, OpenQuestionListProjection |
| PatternRelationsProjectionSupport    | 11         | ArchitectureComparisonProjection, ArchitectureNeighborhoodProjection, BoundedContextProjection, DependencyContextProjection, DependencyEdgeProjection   |
| OperationalInsightsProjectionSupport | 8          | AnnotationCoverageProjection, OverviewProjection, RequirementDigestProjection, RequirementExecutableDigestProjection, RequirementSpecsDigestProjection  |
| BlockSchema                          | 7          | ArchitectureDiagram, DecisionRecord, DocumentationCompositionSupporting, MarkdownRenderer, OperationalInsightsSupporting                                |
| PatternHelpers                       | 6          | ArchitectureInspection, DecisionResolution, DualSourceExtractor, GraphInventory, PatternGraphApi                                                        |
| ProjectionFragmentSchema             | 6          | ApiReferenceProjection, CompactTextRenderer, FragmentRendererDispatch, JsonRenderer, MarkdownRenderer                                                   |
| DeliveryReportingProjectionSupport   | 5          | PhaseProgressProjection, ReleaseNotesProjection, RoadmapTimelineProjection, StatusDistributionProjection, TraceabilityMatrixProjection                  |

## Cross-package bounded contexts

Bounded contexts whose patterns span more than one workspace package.

| Bounded context | Packages                                        | Patterns |
| --------------- | ----------------------------------------------- | -------- |
| cli             | Architect CLI, Architect Guard, Architect MCP   | 6        |
| api             | Architect MCP, Architect Package Content        | 7        |
| extractor       | Architect Core, Architect Package Content       | 7        |
| governance      | Architect Package Content, Architect Projection | 9        |
| projection      | Architect Package Content, Architect Projection | 47       |
| rendering       | Architect Core, Architect Projection            | 9        |
| validation      | Architect Core, Architect Guard                 | 8        |

## Legend

### Legend

- Solid arrow = dependency (depends-on / uses)
- Dotted line = reference (see-also)

## Patterns

- ADR001TaxonomyCanonicalValues
- ADR002GherkinOnlyTesting
- ADR003SourceFirstPatternArchitecture
- ADR005CodecBasedMarkdownRendering
- ADR006SingleReadModelArchitecture
- ADR007CoordinatedTaxonomyRedesign
- ADR008StepDefinitionStubsConvention
- ADR009ProjectionTrustBoundary
- ADR010DocumentationCompositionHelpers
- AnnotationCoverage
- AnnotationCoverageProjection
- AntiPatternDetector
- ApiReferenceDigest
- ApiReferenceProjection
- ApiReferenceShapeCoverage
- ArchitectBriefDeterministicBundle
- ArchitectureComparison
- ArchitectureComparisonProjection
- ArchitectureDelta
- ArchitectureDiagram
- ArchitectureDiagramProjection
- ArchitectureGraphProjection
- ArchitectureInspection
- ArchitectureNeighborhood
- ArchitectureNeighborhoodProjection
- AssistiveCodeIntelligence
- AstParser
- BlockSchema
- BoundedContextFragmentContract
- BoundedContextProjection
- BuildPipeline
- BusinessRule
- BusinessRuleReference
- BusinessRuleSet
- BusinessRulesProjection
- CLIErrorHandler
- CLIRuntimePaths
- CLIVersionHelper
- CodecBehaviorExecutableTests
- CodecUtils
- CompactTextRenderer
- ConfigLoader
- DataAPIRelationshipGraph
- DecisionCatalog
- DecisionCatalogProjection
- DecisionRecord
- DecisionRecordTemporalHygiene
- DecisionResolution
- DefineConfig
- Deliverable
- DeliverableManifest
- DeliverableProjection
- DeliveryReportingFragmentContracts
- DeliveryReportingProjectionSupport
- DeliveryReportingSupporting
- DependencyContext
- DependencyContextProjection
- DependencyEdge
- DependencyEdgeProjection
- DependencyEdgeSet
- DeriveProcessState
- DesignReviewProjection
- DetectChanges
- DocExtractor
- DocumentationBundle
- DocumentationCompositionProjectionSupport
- DocumentationCompositionSupporting
- DocumentationProjection
- DocumentationTypeRegistry
- DoDValidation
- DoDValidationTypes
- DoDValidator
- DualSourceExtractor
- EffortVarianceTracking
- EmissionDescriptor
- ErrorFactoryTypes
- ExecutionContextProjectionSupport
- ExecutionContextSupporting
- ExtractedPattern
- ExtractionDiagnostics
- FileReadingList
- FileReadingListProjection
- FragmentRendererDispatch
- FSMStates
- FSMTransitions
- FSMValidator
- GeneratorDegeneracyGuard
- GeneratorInfrastructureExecutableTests
- GherkinAstParser
- GherkinExtractor
- GherkinParseFailureDiagnostics
- GherkinScanner
- GitBranchDiff
- GitHelpers
- GitModule
- GitNameStatusParser
- GoalOrientedNavigation
- GovernanceProjectionSupport
- GovernanceSupporting
- GraphInventory
- HandoffProjection
- HandoffRecord
- JsonRenderer
- LayerInference
- LintEngine
- LintModule
- LintPatternsCLI
- LintProcessCLI
- LintRules
- LivingRoadmapCLI
- MarkdownBlockParser
- MarkdownRenderer
- MCPFileWatcher
- McpOutputSchemaValidation
- MCPPipelineSession
- MCPServer
- MCPServerBin
- MCPToolRegistry
- ModelEnrichedDataAPI
- MonorepoSupport
- MultiSourceComposition
- OneSourceMultipleAudiences
- OpenQuestionListProjection
- OperationalInsightsProjectionSupport
- OperationalInsightsSupporting
- OrphanPatternList
- OrphanPatternListProjection
- OverviewDigest
- OverviewProjection
- PackageResolver
- PatternBundleProjection
- PatternCatalog
- PatternCatalogProjection
- PatternClassification
- PatternDetail
- PatternDetailProjection
- PatternGraph
- PatternGraphApi
- PatternGraphCLI
- PatternHelpers
- PatternRelationsFragmentContracts
- PatternRelationsProjectionSupport
- PatternRelationsSupporting
- PatternScanner
- PatternSummary
- PatternSummaryProjection
- PDR001SessionWorkflowCommands
- PDR005ProcessGuardFSM
- PhaseNumberingConventions
- PhaseProgress
- PhaseProgressProjection
- PrChangeReview
- PrChangeReviewProjection
- PrdImplementationSection
- ProcessGuardDecider
- ProcessGuardLinter
- ProcessGuardTypes
- ProgressiveGovernance
- ProjectConfigProjection
- ProjectConfigSnapshot
- ProjectionFragmentContracts
- ProjectionFragmentSchema
- ReadModelReflexivity
- RegistryBuilder
- ReleaseNotesDigest
- ReleaseNotesProjection
- RequirementDigest
- RequirementDigestProjection
- RequirementExecutableDigestProjection
- RequirementSpecsDigestProjection
- ResultMonadTypes
- RoadmapTimeline
- RoadmapTimelineProjection
- RoleProfile
- RoleProfileCollection
- RoleProfileProjection
- RuleAggregation
- ScopeReadinessCheck
- ScopeReadinessProjection
- ScopeReadinessReport
- SessionContextBundle
- SessionContextProjection
- SessionFileCleanup
- SessionStateReader
- SetupCommand
- ShapeExtractor
- SourceCanonical
- SourceInventoryDigest
- SourceInventoryEntry
- SourceInventoryProjection
- SourceMerge
- StatusAwareEslintSuppression
- StatusDistribution
- StatusDistributionProjection
- StepDefinitionCompletion
- StreamingGitDiff
- TagRegistrySchemas
- TagUsageEntry
- TagUsageMatrix
- TagUsageProjection
- TaxonomyDigest
- TaxonomyDigestProjection
- TaxonomyDocumentationCluster
- TraceabilityEnhancements
- TraceabilityGenerator
- TraceabilityMatrix
- TraceabilityMatrixProjection
- UiRenderer
- ValidatePatternsCLI
- ValidationModule
- ValidationRuleDigest
- ValidationRuleDigestProjection
- ValueTransferState
