# Design Review — Package Lens

**Purpose:** Design-review components grouped by workspace package, including not-yet-implemented specs.
**Detail Level:** Working-state-inclusive context map plus per-lens component diagrams

---

## Overview

This view captures 210 patterns across 7 diagrams in the Package view.

## Diagrams

### Package Map

Each node is a group; each arrow is a cross-group dependency (`depends-on` / `uses`, pointing from dependant to dependency). The per-group diagrams below detail each group’s internal dependencies and any see-also references.

```mermaid
graph LR
  pkg_architect_cli["Architect CLI (4)"]
  pkg_architect_core["Architect Core (34)"]
  pkg_architect_guard["Architect Guard (19)"]
  pkg_architect_mcp["Architect MCP (5)"]
  pkg_architect_package_content["Architect Package Content (43)"]
  pkg_architect_projection["Architect Projection (105)"]
  pkg_architect_cli --> pkg_architect_core
  pkg_architect_cli --> pkg_architect_projection
  pkg_architect_guard --> pkg_architect_core
  pkg_architect_mcp --> pkg_architect_core
  pkg_architect_mcp --> pkg_architect_projection
  pkg_architect_package_content --> pkg_architect_core
  pkg_architect_package_content --> pkg_architect_guard
  pkg_architect_package_content --> pkg_architect_mcp
  pkg_architect_package_content --> pkg_architect_projection
  pkg_architect_projection --> pkg_architect_core
```

### Package: Architect CLI (4 patterns)

```mermaid
graph TD
  clierrorhandler["CLIErrorHandler<br/>(utility · completed)"]
  cliruntimepaths["CLIRuntimePaths<br/>(utility · completed)"]
  cliversionhelper["CLIVersionHelper<br/>(utility · completed)"]
  patterngraphcli["PatternGraphCLI<br/>(service · active)"]
  cliversionhelper -->|depends-on| cliruntimepaths
  patterngraphcli -->|depends-on| cliruntimepaths
  patterngraphcli -->|depends-on| cliversionhelper
```

### Package: Architect Core (34 patterns)

```mermaid
graph TD
  architectureinspection["ArchitectureInspection<br/>(utility · active)"]
  astparser["AstParser<br/>(service · active)"]
  blockschema["BlockSchema<br/>(contract · active)"]
  buildpipeline["BuildPipeline<br/>(service · completed)"]
  codecutils["CodecUtils<br/>(codec · active)"]
  configloader["ConfigLoader<br/>(service · active)"]
  decisionresolution["DecisionResolution<br/>(utility · active)"]
  defineconfig["DefineConfig<br/>(utility · active)"]
  docextractor["DocExtractor<br/>(service · active)"]
  dualsourceextractor["DualSourceExtractor<br/>(service · active)"]
  errorfactorytypes["ErrorFactoryTypes<br/>(contract · completed)"]
  extractedpattern["ExtractedPattern<br/>(contract · active)"]
  extractiondiagnostics["ExtractionDiagnostics<br/>(contract · active)"]
  fsmstates["FSMStates<br/>(read-model · active)"]
  fsmtransitions["FSMTransitions<br/>(read-model · active)"]
  fsmvalidator["FSMValidator<br/>(decider · active)"]
  gherkinastparser["GherkinAstParser<br/>(service · active)"]
  gherkinextractor["GherkinExtractor<br/>(service · active)"]
  gherkinscanner["GherkinScanner<br/>(service · active)"]
  graphinventory["GraphInventory<br/>(utility · active)"]
  layerinference["LayerInference<br/>(service · active)"]
  markdownblockparser["MarkdownBlockParser<br/>(codec · active)"]
  packageresolver["PackageResolver<br/>(utility · active)"]
  patternclassification["PatternClassification<br/>(utility · active)"]
  patterngraph["PatternGraph<br/>(contract · active)"]
  patterngraphapi["PatternGraphApi<br/>(utility · active)"]
  patternhelpers["PatternHelpers<br/>(utility · active)"]
  patternscanner["PatternScanner<br/>(service · active)"]
  registrybuilder["RegistryBuilder<br/>(utility · active)"]
  resultmonadtypes["ResultMonadTypes<br/>(contract · completed)"]
  ruleaggregation["RuleAggregation<br/>(utility · active)"]
  shapeextractor["ShapeExtractor<br/>(service · active)"]
  sourcemerge["SourceMerge<br/>(utility · active)"]
  tagregistryschemas["TagRegistrySchemas<br/>(contract · active)"]
  architectureinspection -->|depends-on| extractedpattern
  architectureinspection -->|depends-on| patterngraph
  architectureinspection -->|depends-on| patternhelpers
  buildpipeline -->|depends-on| astparser
  buildpipeline -->|depends-on| docextractor
  buildpipeline -->|depends-on| extractiondiagnostics
  buildpipeline -->|depends-on| gherkinextractor
  buildpipeline -->|depends-on| gherkinscanner
  buildpipeline -->|depends-on| patterngraph
  buildpipeline -->|depends-on| patternscanner
  decisionresolution -->|depends-on| extractedpattern
  decisionresolution -->|depends-on| patterngraph
  decisionresolution -->|depends-on| patternhelpers
  docextractor -->|depends-on| shapeextractor
  dualsourceextractor -->|depends-on| extractedpattern
  dualsourceextractor -->|depends-on| patternhelpers
  fsmvalidator -->|depends-on| fsmstates
  fsmvalidator -->|depends-on| fsmtransitions
  gherkinextractor -->|depends-on| gherkinastparser
  gherkinextractor -->|depends-on| layerinference
  graphinventory -->|depends-on| extractedpattern
  graphinventory -->|depends-on| patterngraph
  graphinventory -->|depends-on| patternhelpers
  patternclassification -->|depends-on| extractedpattern
  patternclassification -->|depends-on| patterngraph
  patterngraph -->|depends-on| extractedpattern
  patterngraphapi -->|depends-on| extractedpattern
  patterngraphapi -->|depends-on| patterngraph
  patterngraphapi -->|depends-on| patternhelpers
  patternhelpers -->|depends-on| extractedpattern
  patternhelpers -->|depends-on| patterngraph
  ruleaggregation -->|depends-on| extractedpattern
  ruleaggregation -->|depends-on| patterngraph
  ruleaggregation -->|depends-on| patternhelpers
```

### Package: Architect Guard (19 patterns)

```mermaid
graph TD
  antipatterndetector["AntiPatternDetector<br/>(service · completed)"]
  antipatternvalidationtypes["AntiPatternValidationTypes<br/>(contract · completed)"]
  deriveprocessstate["DeriveProcessState<br/>(read-model · active)"]
  detectchanges["DetectChanges<br/>(service · active)"]
  gitbranchdiff["GitBranchDiff<br/>(utility · active)"]
  githelpers["GitHelpers<br/>(utility · active)"]
  gitmodule["GitModule<br/>(barrel · active)"]
  gitnamestatusparser["GitNameStatusParser<br/>(utility · active)"]
  lintengine["LintEngine<br/>(service · completed)"]
  lintmodule["LintModule<br/>(barrel · completed)"]
  lintpatternscli["LintPatternsCLI<br/>(service · completed)"]
  lintprocesscli["LintProcessCLI<br/>(service · active)"]
  lintrules["LintRules<br/>(service · completed)"]
  processguarddecider["ProcessGuardDecider<br/>(decider · active)"]
  processguardlinter["ProcessGuardLinter<br/>(barrel · active)"]
  processguardtypes["ProcessGuardTypes<br/>(contract · active)"]
  sessionstatereader["SessionStateReader<br/>(service · active)"]
  validatepatternscli["ValidatePatternsCLI<br/>(service · completed)"]
  validationmodule["ValidationModule<br/>(barrel · completed)"]
  antipatterndetector -->|depends-on| antipatternvalidationtypes
  deriveprocessstate -->|depends-on| sessionstatereader
  detectchanges -->|depends-on| deriveprocessstate
  detectchanges -->|depends-on| gitnamestatusparser
  gitbranchdiff -->|depends-on| gitnamestatusparser
  gitmodule -->|depends-on| gitbranchdiff
  gitmodule -->|depends-on| githelpers
  lintengine -->|depends-on| lintrules
  lintmodule -->|depends-on| lintengine
  lintmodule -->|depends-on| lintrules
  lintpatternscli -->|depends-on| lintengine
  lintpatternscli -->|depends-on| lintrules
  lintprocesscli -->|depends-on| processguardlinter
  processguarddecider -->|depends-on| deriveprocessstate
  processguarddecider -->|depends-on| detectchanges
  processguardlinter -->|depends-on| deriveprocessstate
  processguardlinter -->|depends-on| detectchanges
  processguardlinter -->|depends-on| processguarddecider
  validationmodule -->|depends-on| antipatterndetector
  validationmodule -->|depends-on| antipatternvalidationtypes
```

### Package: Architect MCP (5 patterns)

```mermaid
graph TD
  mcpfilewatcher["MCPFileWatcher<br/>(utility · completed)"]
  mcppipelinesession["MCPPipelineSession<br/>(service · completed)"]
  mcpserver["MCPServer<br/>(service · completed)"]
  mcpserverbin["MCPServerBin<br/>(utility · completed)"]
  mcptoolregistry["MCPToolRegistry<br/>(service · completed)"]
  mcpfilewatcher -->|depends-on| mcppipelinesession
  mcppipelinesession -->|depends-on| mcpfilewatcher
  mcppipelinesession -->|depends-on| mcptoolregistry
  mcpserver -->|depends-on| mcpfilewatcher
  mcpserver -->|depends-on| mcppipelinesession
  mcpserver -->|depends-on| mcptoolregistry
  mcpserverbin -->|depends-on| mcpserver
  mcptoolregistry -->|depends-on| mcppipelinesession
```

### Package: Architect Package Content (43 patterns)

```mermaid
graph TD
  adr001taxonomycanonicalvalues["ADR001TaxonomyCanonicalValues<br/>(completed)"]
  adr002gherkinonlytesting["ADR002GherkinOnlyTesting<br/>(completed)"]
  adr003sourcefirstpatternarchitecture["ADR003SourceFirstPatternArchitecture<br/>(completed)"]
  adr005codecbasedmarkdownrendering["ADR005CodecBasedMarkdownRendering<br/>(completed)"]
  adr006singlereadmodelarchitecture["ADR006SingleReadModelArchitecture<br/>(completed)"]
  adr007coordinatedtaxonomyredesign["ADR007CoordinatedTaxonomyRedesign<br/>(completed)"]
  adr008stepdefinitionstubsconvention["ADR008StepDefinitionStubsConvention<br/>(completed)"]
  adr009projectiontrustboundary["ADR009ProjectionTrustBoundary<br/>(completed)"]
  adr010documentationcompositionhelpers["ADR010DocumentationCompositionHelpers<br/>(completed)"]
  adr012deliverynavigation["ADR012DeliveryNavigation<br/>(completed)"]
  adr013taxonomyretirement["ADR013TaxonomyRetirement<br/>(completed)"]
  apireferenceshapecoverage["ApiReferenceShapeCoverage<br/>(candidate)"]
  architectbriefdeterministicbundle["ArchitectBriefDeterministicBundle<br/>(candidate)"]
  architecturedelta["ArchitectureDelta<br/>(roadmap)"]
  assistivecodeintelligence["AssistiveCodeIntelligence<br/>(epic · candidate)"]
  codecbehaviorexecutabletests["CodecBehaviorExecutableTests<br/>(roadmap)"]
  dataapirelationshipgraph["DataAPIRelationshipGraph<br/>(roadmap)"]
  decisionrecordtemporalhygiene["DecisionRecordTemporalHygiene<br/>(candidate)"]
  documentationprojection["DocumentationProjection<br/>(epic · candidate)"]
  generatorinfrastructureexecutabletests["GeneratorInfrastructureExecutableTests<br/>(roadmap)"]
  gherkinparsefailurediagnostics["GherkinParseFailureDiagnostics<br/>(candidate)"]
  goalorientednavigation["GoalOrientedNavigation<br/>(roadmap)"]
  mcpoutputschemavalidation["McpOutputSchemaValidation<br/>(candidate)"]
  modelenricheddataapi["ModelEnrichedDataAPI<br/>(candidate)"]
  monoreposupport["MonorepoSupport<br/>(roadmap)"]
  multisourcecomposition["MultiSourceComposition<br/>(candidate)"]
  onesourcemultipleaudiences["OneSourceMultipleAudiences<br/>(candidate)"]
  pdr001sessionworkflowcommands["PDR001SessionWorkflowCommands<br/>(completed)"]
  pdr005processguardfsm["PDR005ProcessGuardFSM<br/>(completed)"]
  pdr006advisoryprocessguardprotection["PDR006AdvisoryProcessGuardProtection<br/>(completed)"]
  prdimplementationsection["PrdImplementationSection<br/>(roadmap)"]
  progressivegovernance["ProgressiveGovernance<br/>(roadmap)"]
  readmodelreflexivity["ReadModelReflexivity<br/>(candidate)"]
  sessionfilecleanup["SessionFileCleanup<br/>(roadmap)"]
  setupcommand["SetupCommand<br/>(roadmap)"]
  sourcecanonical["SourceCanonical<br/>(candidate)"]
  statusawareeslintsuppression["StatusAwareEslintSuppression<br/>(roadmap)"]
  stepdefinitioncompletion["StepDefinitionCompletion<br/>(roadmap)"]
  streaminggitdiff["StreamingGitDiff<br/>(roadmap)"]
  taxonomydocumentationcluster["TaxonomyDocumentationCluster<br/>(active)"]
  traceabilityenhancements["TraceabilityEnhancements<br/>(roadmap)"]
  traceabilitygenerator["TraceabilityGenerator<br/>(roadmap)"]
  valuetransferstate["ValueTransferState<br/>(candidate)"]
  adr001taxonomycanonicalvalues -. see-also .- adr007coordinatedtaxonomyredesign
  adr001taxonomycanonicalvalues -. see-also .- adr012deliverynavigation
  adr001taxonomycanonicalvalues -. see-also .- adr013taxonomyretirement
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
  adr012deliverynavigation -->|depends-on| adr001taxonomycanonicalvalues
  adr012deliverynavigation -->|depends-on| adr003sourcefirstpatternarchitecture
  adr012deliverynavigation -. see-also .- adr013taxonomyretirement
  adr013taxonomyretirement -->|depends-on| adr001taxonomycanonicalvalues
  adr013taxonomyretirement -->|depends-on| adr007coordinatedtaxonomyredesign
  architectbriefdeterministicbundle -. see-also .- adr005codecbasedmarkdownrendering
  architectbriefdeterministicbundle -. see-also .- adr006singlereadmodelarchitecture
  architectbriefdeterministicbundle -. see-also .- modelenricheddataapi
  architectbriefdeterministicbundle -->|depends-on| valuetransferstate
  decisionrecordtemporalhygiene -. see-also .- adr006singlereadmodelarchitecture
  documentationprojection -->|depends-on| adr010documentationcompositionhelpers
  goalorientednavigation -. see-also .- adr006singlereadmodelarchitecture
  goalorientednavigation -. see-also .- adr009projectiontrustboundary
  goalorientednavigation -. see-also .- adr010documentationcompositionhelpers
  goalorientednavigation -. see-also .- taxonomydocumentationcluster
  mcpoutputschemavalidation -. see-also .- adr006singlereadmodelarchitecture
  modelenricheddataapi -. see-also .- adr005codecbasedmarkdownrendering
  modelenricheddataapi -. see-also .- adr006singlereadmodelarchitecture
  modelenricheddataapi -->|depends-on| architectbriefdeterministicbundle
  pdr005processguardfsm -->|depends-on| adr001taxonomycanonicalvalues
  pdr006advisoryprocessguardprotection -->|depends-on| adr001taxonomycanonicalvalues
  pdr006advisoryprocessguardprotection -->|depends-on| pdr005processguardfsm
  stepdefinitioncompletion -->|depends-on| adr002gherkinonlytesting
  taxonomydocumentationcluster -. see-also .- adr010documentationcompositionhelpers
  taxonomydocumentationcluster -. see-also .- multisourcecomposition
  taxonomydocumentationcluster -. see-also .- onesourcemultipleaudiences
  traceabilityenhancements -->|depends-on| traceabilitygenerator
  valuetransferstate -. see-also .- adr006singlereadmodelarchitecture
  valuetransferstate -. see-also .- architectbriefdeterministicbundle
```

### Package: Architect Projection (105 patterns)

```mermaid
graph TD
  annotationcoverage["AnnotationCoverage<br/>(contract · active)"]
  annotationcoverageprojection["AnnotationCoverageProjection<br/>(projection · completed)"]
  apireferencedigest["ApiReferenceDigest<br/>(contract · active)"]
  apireferenceprojection["ApiReferenceProjection<br/>(projection · active)"]
  architecturecomparison["ArchitectureComparison<br/>(contract · active)"]
  architecturecomparisonprojection["ArchitectureComparisonProjection<br/>(projection · completed)"]
  architecturediagram["ArchitectureDiagram<br/>(contract · active)"]
  architecturediagramprojection["ArchitectureDiagramProjection<br/>(projection · completed)"]
  architecturegraphprojection["ArchitectureGraphProjection<br/>(projection · active)"]
  architectureneighborhood["ArchitectureNeighborhood<br/>(contract · active)"]
  architectureneighborhoodprojection["ArchitectureNeighborhoodProjection<br/>(projection · completed)"]
  boundedcontextfragmentcontract["BoundedContextFragmentContract<br/>(contract · active)"]
  boundedcontextprojection["BoundedContextProjection<br/>(projection · completed)"]
  businessrule["BusinessRule<br/>(contract · active)"]
  businessrulereference["BusinessRuleReference<br/>(contract · active)"]
  businessruleset["BusinessRuleSet<br/>(contract · active)"]
  businessrulesprojection["BusinessRulesProjection<br/>(projection · completed)"]
  changelogprojection["ChangelogProjection<br/>(projection · completed)"]
  compacttextrenderer["CompactTextRenderer<br/>(codec · completed)"]
  decisioncatalog["DecisionCatalog<br/>(contract · active)"]
  decisioncatalogprojection["DecisionCatalogProjection<br/>(projection · completed)"]
  decisionrecord["DecisionRecord<br/>(contract · active)"]
  deliverable["Deliverable<br/>(contract · active)"]
  deliverablemanifest["DeliverableManifest<br/>(contract · active)"]
  deliverableprojection["DeliverableProjection<br/>(projection · completed)"]
  deliveryreportingfragmentcontracts["DeliveryReportingFragmentContracts<br/>(contract · active)"]
  deliveryreportingprojectionsupport["DeliveryReportingProjectionSupport<br/>(utility · completed)"]
  deliveryreportingsupporting["DeliveryReportingSupporting<br/>(contract · active)"]
  dependencycontext["DependencyContext<br/>(contract · active)"]
  dependencycontextprojection["DependencyContextProjection<br/>(projection · completed)"]
  dependencyedge["DependencyEdge<br/>(contract · active)"]
  dependencyedgeprojection["DependencyEdgeProjection<br/>(projection · completed)"]
  dependencyedgeset["DependencyEdgeSet<br/>(contract · active)"]
  designreviewprojection["DesignReviewProjection<br/>(projection · active)"]
  documentationbundle["DocumentationBundle<br/>(projection · completed)"]
  documentationcompositionprojectionsupport["DocumentationCompositionProjectionSupport<br/>(utility · completed)"]
  documentationcompositionsupporting["DocumentationCompositionSupporting<br/>(contract · active)"]
  documentationtyperegistry["DocumentationTypeRegistry<br/>(contract · active)"]
  emissiondescriptor["EmissionDescriptor<br/>(contract · active)"]
  executioncontextprojectionsupport["ExecutionContextProjectionSupport<br/>(utility · completed)"]
  executioncontextsupporting["ExecutionContextSupporting<br/>(contract · active)"]
  filereadinglist["FileReadingList<br/>(contract · active)"]
  filereadinglistprojection["FileReadingListProjection<br/>(projection · completed)"]
  fragmentrendererdispatch["FragmentRendererDispatch<br/>(codec · completed)"]
  generatordegeneracyguard["GeneratorDegeneracyGuard<br/>(utility · completed)"]
  governanceprojectionsupport["GovernanceProjectionSupport<br/>(utility · completed)"]
  governancesupporting["GovernanceSupporting<br/>(contract · active)"]
  handoffprojection["HandoffProjection<br/>(projection · completed)"]
  handoffrecord["HandoffRecord<br/>(contract · active)"]
  jsonrenderer["JsonRenderer<br/>(codec · completed)"]
  managedregionengine["ManagedRegionEngine<br/>(utility · active)"]
  markdownrenderer["MarkdownRenderer<br/>(codec · completed)"]
  openquestionlistprojection["OpenQuestionListProjection<br/>(projection · active)"]
  operationalinsightsprojectionsupport["OperationalInsightsProjectionSupport<br/>(utility · completed)"]
  operationalinsightssupporting["OperationalInsightsSupporting<br/>(contract · active)"]
  orphanpatternlist["OrphanPatternList<br/>(contract · active)"]
  orphanpatternlistprojection["OrphanPatternListProjection<br/>(projection · completed)"]
  overviewdigest["OverviewDigest<br/>(contract · active)"]
  overviewprojection["OverviewProjection<br/>(projection · completed)"]
  patternbundleprojection["PatternBundleProjection<br/>(projection · active)"]
  patterncatalog["PatternCatalog<br/>(contract · active)"]
  patterncatalogprojection["PatternCatalogProjection<br/>(projection · completed)"]
  patterndetail["PatternDetail<br/>(contract · active)"]
  patterndetailprojection["PatternDetailProjection<br/>(projection · completed)"]
  patternrelationsfragmentcontracts["PatternRelationsFragmentContracts<br/>(contract · active)"]
  patternrelationsprojectionsupport["PatternRelationsProjectionSupport<br/>(utility · completed)"]
  patternrelationssupporting["PatternRelationsSupporting<br/>(contract · active)"]
  patternsummary["PatternSummary<br/>(contract · active)"]
  patternsummaryprojection["PatternSummaryProjection<br/>(projection · completed)"]
  prchangereview["PrChangeReview<br/>(contract · active)"]
  prchangereviewprojection["PrChangeReviewProjection<br/>(projection · completed)"]
  projectconfigprojection["ProjectConfigProjection<br/>(projection · completed)"]
  projectconfigsnapshot["ProjectConfigSnapshot<br/>(contract · active)"]
  projectionfragmentcontracts["ProjectionFragmentContracts<br/>(contract · active)"]
  projectionfragmentschema["ProjectionFragmentSchema<br/>(contract · active)"]
  requirementdigest["RequirementDigest<br/>(contract · active)"]
  requirementdigestprojection["RequirementDigestProjection<br/>(projection · completed)"]
  requirementexecutabledigestprojection["RequirementExecutableDigestProjection<br/>(projection · completed)"]
  requirementspecsdigestprojection["RequirementSpecsDigestProjection<br/>(projection · completed)"]
  roadmaptimeline["RoadmapTimeline<br/>(contract · active)"]
  roadmaptimelineprojection["RoadmapTimelineProjection<br/>(projection · completed)"]
  roleprofile["RoleProfile<br/>(contract · active)"]
  roleprofilecollection["RoleProfileCollection<br/>(contract · active)"]
  roleprofileprojection["RoleProfileProjection<br/>(projection · completed)"]
  scopereadinesscheck["ScopeReadinessCheck<br/>(contract · active)"]
  scopereadinessprojection["ScopeReadinessProjection<br/>(projection · completed)"]
  scopereadinessreport["ScopeReadinessReport<br/>(contract · active)"]
  sessioncontextbundle["SessionContextBundle<br/>(contract · active)"]
  sessioncontextprojection["SessionContextProjection<br/>(projection · completed)"]
  sourceinventorydigest["SourceInventoryDigest<br/>(contract · active)"]
  sourceinventoryentry["SourceInventoryEntry<br/>(contract · active)"]
  sourceinventoryprojection["SourceInventoryProjection<br/>(projection · completed)"]
  statusdistribution["StatusDistribution<br/>(contract · active)"]
  statusdistributionprojection["StatusDistributionProjection<br/>(projection · completed)"]
  tagusageentry["TagUsageEntry<br/>(contract · active)"]
  tagusagematrix["TagUsageMatrix<br/>(contract · active)"]
  tagusageprojection["TagUsageProjection<br/>(projection · completed)"]
  taxonomydigest["TaxonomyDigest<br/>(contract · active)"]
  taxonomydigestprojection["TaxonomyDigestProjection<br/>(projection · completed)"]
  taxonomyembeddedshapesprojection["TaxonomyEmbeddedShapesProjection<br/>(projection · active)"]
  traceabilitymatrix["TraceabilityMatrix<br/>(contract · active)"]
  traceabilitymatrixprojection["TraceabilityMatrixProjection<br/>(projection · completed)"]
  uirenderer["UiRenderer<br/>(codec · completed)"]
  validationruledigest["ValidationRuleDigest<br/>(contract · active)"]
  validationruledigestprojection["ValidationRuleDigestProjection<br/>(projection · completed)"]
  annotationcoverageprojection -->|depends-on| annotationcoverage
  annotationcoverageprojection -->|depends-on| operationalinsightsprojectionsupport
  apireferenceprojection -->|depends-on| apireferencedigest
  apireferenceprojection -->|depends-on| projectionfragmentschema
  architecturecomparisonprojection -->|depends-on| architecturecomparison
  architecturecomparisonprojection -->|depends-on| patternrelationsfragmentcontracts
  architecturecomparisonprojection -->|depends-on| patternrelationsprojectionsupport
  architecturediagramprojection -->|depends-on| documentationcompositionprojectionsupport
  architecturediagramprojection -->|depends-on| projectionfragmentcontracts
  architectureneighborhoodprojection -->|depends-on| architectureneighborhood
  architectureneighborhoodprojection -->|depends-on| patternrelationsfragmentcontracts
  architectureneighborhoodprojection -->|depends-on| patternrelationsprojectionsupport
  boundedcontextprojection -->|depends-on| boundedcontextfragmentcontract
  boundedcontextprojection -->|depends-on| patternrelationsprojectionsupport
  businessrulesprojection -->|depends-on| businessrule
  businessrulesprojection -->|depends-on| businessruleset
  businessrulesprojection -->|depends-on| governanceprojectionsupport
  businessrulesprojection -->|depends-on| governancesupporting
  businessrulesprojection -->|depends-on| projectionfragmentcontracts
  changelogprojection -->|depends-on| deliveryreportingprojectionsupport
  changelogprojection -->|depends-on| roadmaptimeline
  compacttextrenderer -->|depends-on| fragmentrendererdispatch
  compacttextrenderer -->|depends-on| projectionfragmentschema
  decisioncatalogprojection -->|depends-on| decisioncatalog
  decisioncatalogprojection -->|depends-on| decisionrecord
  decisioncatalogprojection -->|depends-on| governanceprojectionsupport
  decisioncatalogprojection -->|depends-on| projectionfragmentcontracts
  deliverableprojection -->|depends-on| deliverable
  deliverableprojection -->|depends-on| deliverablemanifest
  deliverableprojection -->|depends-on| executioncontextprojectionsupport
  deliverableprojection -->|depends-on| projectionfragmentcontracts
  deliveryreportingprojectionsupport -->|depends-on| deliveryreportingfragmentcontracts
  deliveryreportingsupporting -->|depends-on| deliverable
  deliveryreportingsupporting -->|depends-on| patternsummary
  dependencycontextprojection -->|depends-on| dependencycontext
  dependencycontextprojection -->|depends-on| patternrelationsfragmentcontracts
  dependencycontextprojection -->|depends-on| patternrelationsprojectionsupport
  dependencyedgeprojection -->|depends-on| dependencyedge
  dependencyedgeprojection -->|depends-on| dependencyedgeset
  dependencyedgeprojection -->|depends-on| patternrelationsfragmentcontracts
  dependencyedgeprojection -->|depends-on| patternrelationsprojectionsupport
  designreviewprojection -->|depends-on| architecturediagram
  designreviewprojection -->|depends-on| architecturediagramprojection
  documentationbundle -->|depends-on| documentationcompositionprojectionsupport
  documentationbundle -->|depends-on| projectionfragmentcontracts
  documentationcompositionprojectionsupport -->|depends-on| architecturediagram
  documentationcompositionprojectionsupport -->|depends-on| prchangereview
  documentationcompositionprojectionsupport -->|depends-on| projectconfigsnapshot
  executioncontextprojectionsupport -->|depends-on| projectionfragmentcontracts
  filereadinglistprojection -->|depends-on| executioncontextprojectionsupport
  filereadinglistprojection -->|depends-on| filereadinglist
  filereadinglistprojection -->|depends-on| projectionfragmentcontracts
  fragmentrendererdispatch -->|depends-on| projectionfragmentschema
  generatordegeneracyguard -->|depends-on| projectionfragmentcontracts
  governanceprojectionsupport -->|depends-on| projectionfragmentcontracts
  handoffprojection -->|depends-on| executioncontextprojectionsupport
  handoffprojection -->|depends-on| handoffrecord
  handoffprojection -->|depends-on| projectionfragmentcontracts
  handoffrecord -->|depends-on| executioncontextsupporting
  jsonrenderer -->|depends-on| projectionfragmentschema
  markdownrenderer -->|depends-on| fragmentrendererdispatch
  markdownrenderer -->|depends-on| projectionfragmentschema
  openquestionlistprojection -->|depends-on| patternrelationsfragmentcontracts
  openquestionlistprojection -->|depends-on| patternrelationsprojectionsupport
  operationalinsightsprojectionsupport -->|depends-on| businessrulereference
  operationalinsightsprojectionsupport -->|depends-on| projectionfragmentcontracts
  orphanpatternlistprojection -->|depends-on| orphanpatternlist
  orphanpatternlistprojection -->|depends-on| patternrelationsfragmentcontracts
  orphanpatternlistprojection -->|depends-on| patternrelationsprojectionsupport
  overviewprojection -->|depends-on| architecturediagram
  overviewprojection -->|depends-on| operationalinsightsprojectionsupport
  overviewprojection -->|depends-on| overviewdigest
  patternbundleprojection -->|depends-on| patternrelationsfragmentcontracts
  patternbundleprojection -->|depends-on| patternrelationsprojectionsupport
  patterncatalogprojection -->|depends-on| patterncatalog
  patterncatalogprojection -->|depends-on| patternrelationsfragmentcontracts
  patterncatalogprojection -->|depends-on| patternrelationsprojectionsupport
  patterndetailprojection -->|depends-on| patterndetail
  patterndetailprojection -->|depends-on| patternrelationsfragmentcontracts
  patterndetailprojection -->|depends-on| patternrelationsprojectionsupport
  patternrelationsprojectionsupport -->|depends-on| patternrelationsfragmentcontracts
  patternrelationssupporting -->|depends-on| deliverable
  patternrelationssupporting -->|depends-on| deliverablemanifest
  patternsummaryprojection -->|depends-on| patternrelationsfragmentcontracts
  patternsummaryprojection -->|depends-on| patternrelationsprojectionsupport
  patternsummaryprojection -->|depends-on| patternsummary
  prchangereviewprojection -->|depends-on| documentationcompositionprojectionsupport
  prchangereviewprojection -->|depends-on| projectionfragmentcontracts
  projectconfigprojection -->|depends-on| documentationcompositionprojectionsupport
  projectconfigprojection -->|depends-on| projectionfragmentcontracts
  requirementdigestprojection -->|depends-on| operationalinsightsprojectionsupport
  requirementdigestprojection -->|depends-on| requirementdigest
  requirementexecutabledigestprojection -->|depends-on| operationalinsightsprojectionsupport
  requirementexecutabledigestprojection -->|depends-on| requirementdigest
  requirementspecsdigestprojection -->|depends-on| operationalinsightsprojectionsupport
  requirementspecsdigestprojection -->|depends-on| requirementdigest
  roadmaptimelineprojection -->|depends-on| deliveryreportingprojectionsupport
  roadmaptimelineprojection -->|depends-on| roadmaptimeline
  roleprofileprojection -->|depends-on| operationalinsightsprojectionsupport
  roleprofileprojection -->|depends-on| roleprofile
  roleprofileprojection -->|depends-on| roleprofilecollection
  scopereadinesscheck -->|depends-on| executioncontextsupporting
  scopereadinessprojection -->|depends-on| executioncontextprojectionsupport
  scopereadinessprojection -->|depends-on| projectionfragmentcontracts
  scopereadinessprojection -->|depends-on| scopereadinesscheck
  scopereadinessprojection -->|depends-on| scopereadinessreport
  scopereadinessreport -->|depends-on| executioncontextsupporting
  sessioncontextbundle -->|depends-on| executioncontextsupporting
  sessioncontextprojection -->|depends-on| executioncontextprojectionsupport
  sessioncontextprojection -->|depends-on| projectionfragmentcontracts
  sessioncontextprojection -->|depends-on| sessioncontextbundle
  sourceinventorydigest -->|depends-on| sourceinventoryentry
  sourceinventoryprojection -->|depends-on| operationalinsightsprojectionsupport
  sourceinventoryprojection -->|depends-on| sourceinventorydigest
  statusdistributionprojection -->|depends-on| deliveryreportingprojectionsupport
  statusdistributionprojection -->|depends-on| statusdistribution
  tagusagematrix -->|depends-on| tagusageentry
  tagusageprojection -->|depends-on| operationalinsightsprojectionsupport
  tagusageprojection -->|depends-on| tagusagematrix
  taxonomydigestprojection -->|depends-on| governanceprojectionsupport
  taxonomydigestprojection -->|depends-on| governancesupporting
  taxonomydigestprojection -->|depends-on| projectionfragmentcontracts
  taxonomydigestprojection -->|depends-on| taxonomydigest
  taxonomyembeddedshapesprojection -->|depends-on| emissiondescriptor
  taxonomyembeddedshapesprojection -->|depends-on| taxonomydigestprojection
  traceabilitymatrixprojection -->|depends-on| deliveryreportingprojectionsupport
  traceabilitymatrixprojection -->|depends-on| traceabilitymatrix
  uirenderer -->|depends-on| fragmentrendererdispatch
  uirenderer -->|depends-on| projectionfragmentschema
  validationruledigestprojection -->|depends-on| governanceprojectionsupport
  validationruledigestprojection -->|depends-on| projectionfragmentcontracts
  validationruledigestprojection -->|depends-on| validationruledigest
```

## Fan-in

Most-depended-on patterns in this view, ranked by in-view dependant count.

| Pattern                              | Dependants | Top dependants                                                                                                                                          |
| ------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ProjectionFragmentContracts          | 17         | ArchitectureDiagramProjection, BusinessRulesProjection, DecisionCatalogProjection, DeliverableProjection, DocumentationBundle                           |
| ExtractedPattern                     | 14         | ArchitectureInspection, DecisionResolution, DeliveryReportingProjectionSupport, DualSourceExtractor, ExecutionContextProjectionSupport                  |
| PatternRelationsFragmentContracts    | 11         | ArchitectureComparisonProjection, ArchitectureNeighborhoodProjection, DependencyContextProjection, DependencyEdgeProjection, OpenQuestionListProjection |
| PatternRelationsProjectionSupport    | 11         | ArchitectureComparisonProjection, ArchitectureNeighborhoodProjection, BoundedContextProjection, DependencyContextProjection, DependencyEdgeProjection   |
| PatternGraph                         | 10         | ArchitectureInspection, BuildPipeline, DecisionResolution, GraphInventory, PatternClassification                                                        |
| OperationalInsightsProjectionSupport | 8          | AnnotationCoverageProjection, OverviewProjection, RequirementDigestProjection, RequirementExecutableDigestProjection, RequirementSpecsDigestProjection  |
| BlockSchema                          | 7          | ArchitectureDiagram, DecisionRecord, DocumentationCompositionSupporting, MarkdownRenderer, OperationalInsightsSupporting                                |
| ADR001TaxonomyCanonicalValues        | 6          | ADR003SourceFirstPatternArchitecture, ADR007CoordinatedTaxonomyRedesign, ADR012DeliveryNavigation, ADR013TaxonomyRetirement, PDR005ProcessGuardFSM      |
| PatternHelpers                       | 6          | ArchitectureInspection, DecisionResolution, DualSourceExtractor, GraphInventory, PatternGraphApi                                                        |
| ProjectionFragmentSchema             | 6          | ApiReferenceProjection, CompactTextRenderer, FragmentRendererDispatch, JsonRenderer, MarkdownRenderer                                                   |

## Cross-package bounded contexts

Bounded contexts whose patterns span more than one workspace package.

| Bounded context | Packages                                        | Patterns |
| --------------- | ----------------------------------------------- | -------- |
| cli             | Architect CLI, Architect Guard, Architect MCP   | 6        |
| api             | Architect MCP, Architect Package Content        | 7        |
| extractor       | Architect Core, Architect Package Content       | 7        |
| governance      | Architect Package Content, Architect Projection | 9        |
| projection      | Architect Package Content, Architect Projection | 46       |
| rendering       | Architect Core, Architect Projection            | 9        |
| validation      | Architect Core, Architect Guard                 | 7        |

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
- ADR012DeliveryNavigation
- ADR013TaxonomyRetirement
- AnnotationCoverage
- AnnotationCoverageProjection
- AntiPatternDetector
- AntiPatternValidationTypes
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
- ChangelogProjection
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
- DualSourceExtractor
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
- ManagedRegionEngine
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
- PDR006AdvisoryProcessGuardProtection
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
- TaxonomyEmbeddedShapesProjection
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

---

[← Back to Design Review](../DESIGN-REVIEW.md)
