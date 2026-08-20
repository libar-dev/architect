# Design Review — Package Lens

**Purpose:** Design-review components grouped by workspace package, including not-yet-implemented specs.
**Detail Level:** Working-state-inclusive context map plus per-lens component diagrams

---

## Overview

This view captures 268 patterns across 7 diagrams in the Package view.

## Diagrams

### Package Map

Each node is a group; each arrow is a cross-group dependency (`depends-on` / `uses`, pointing from dependant to dependency). The per-group diagrams below detail each group’s internal dependencies and any see-also references.

```mermaid
graph LR
  pkg_architect_cli["Architect CLI (9)"]
  pkg_architect_core["Architect Core (65)"]
  pkg_architect_guard["Architect Guard (19)"]
  pkg_architect_mcp["Architect MCP (5)"]
  pkg_architect_package_content["Architect Package Content (43)"]
  pkg_architect_projection["Architect Projection (127)"]
  pkg_architect_cli --> pkg_architect_core
  pkg_architect_core --> pkg_architect_projection
  pkg_architect_guard --> pkg_architect_core
  pkg_architect_mcp --> pkg_architect_core
  pkg_architect_mcp --> pkg_architect_projection
  pkg_architect_package_content --> pkg_architect_cli
  pkg_architect_package_content --> pkg_architect_core
  pkg_architect_package_content --> pkg_architect_guard
  pkg_architect_package_content --> pkg_architect_mcp
  pkg_architect_package_content --> pkg_architect_projection
  pkg_architect_projection --> pkg_architect_core
```

### Package: Architect CLI (9 patterns)

```mermaid
graph TD
  authoredcorebuilder["AuthoredCoreBuilder<br/>(service · completed)"]
  clicontexttypes["CLIContextTypes<br/>(contract · completed)"]
  clierrorhandler["CLIErrorHandler<br/>(utility · completed)"]
  cliruntimepaths["CLIRuntimePaths<br/>(utility · completed)"]
  graphhandle["GraphHandle<br/>(service · completed)"]
  graphhandlecli["GraphHandleCli<br/>(service · completed)"]
  graphhandleshapes["GraphHandleShapes<br/>(contract · completed)"]
  graphhandleviews["GraphHandleViews<br/>(service · completed)"]
  mechanicalsubstrateextractor["MechanicalSubstrateExtractor<br/>(service · completed)"]
  authoredcorebuilder -->|depends-on| clicontexttypes
  authoredcorebuilder -->|depends-on| graphhandleshapes
  graphhandle -->|depends-on| authoredcorebuilder
  graphhandle -->|depends-on| graphhandleshapes
  graphhandle -->|depends-on| graphhandleviews
  graphhandle -->|depends-on| mechanicalsubstrateextractor
  graphhandlecli -->|depends-on| authoredcorebuilder
  graphhandlecli -->|depends-on| clicontexttypes
  graphhandlecli -->|depends-on| cliruntimepaths
  graphhandlecli -->|depends-on| graphhandle
  graphhandlecli -->|depends-on| graphhandleviews
  graphhandlecli -->|depends-on| mechanicalsubstrateextractor
  graphhandleviews -->|depends-on| graphhandleshapes
  mechanicalsubstrateextractor -->|depends-on| graphhandleshapes
```

### Package: Architect Core (65 patterns)

```mermaid
graph TD
  architectconfigcontract["ArchitectConfigContract<br/>(contract · active)"]
  architectureinspection["ArchitectureInspection<br/>(utility · active)"]
  argvhygiene["ArgvHygiene<br/>(utility · completed)"]
  astparser["AstParser<br/>(service · active)"]
  blockschema["BlockSchema<br/>(contract · active)"]
  brandedidentifiers["BrandedIdentifiers<br/>(contract · active)"]
  buildpipeline["BuildPipeline<br/>(service · completed)"]
  codecutils["CodecUtils<br/>(codec · active)"]
  configdefaults["ConfigDefaults<br/>(contract · active)"]
  configloader["ConfigLoader<br/>(service · active)"]
  configvalidationschemas["ConfigValidationSchemas<br/>(contract · completed)"]
  contextinference["ContextInference<br/>(service · active)"]
  decisionresolution["DecisionResolution<br/>(utility · active)"]
  defineconfig["DefineConfig<br/>(utility · active)"]
  deliverablestatusdomain["DeliverableStatusDomain<br/>(contract · active)"]
  docdirectivecontract["DocDirectiveContract<br/>(contract · active)"]
  docextractor["DocExtractor<br/>(service · active)"]
  domainenumschemas["DomainEnumSchemas<br/>(contract · active)"]
  dualsourceextractor["DualSourceExtractor<br/>(service · active)"]
  dualsourceschemas["DualSourceSchemas<br/>(contract · active)"]
  errorfactorytypes["ErrorFactoryTypes<br/>(contract · completed)"]
  exportinfocontract["ExportInfoContract<br/>(contract · active)"]
  extractedpattern["ExtractedPattern<br/>(contract · active)"]
  extractiondiagnostics["ExtractionDiagnostics<br/>(contract · active)"]
  formattypedomain["FormatTypeDomain<br/>(contract · active)"]
  fsmstates["FSMStates<br/>(read-model · active)"]
  fsmtransitions["FSMTransitions<br/>(read-model · active)"]
  fsmvalidator["FSMValidator<br/>(decider · active)"]
  gherkinastparser["GherkinAstParser<br/>(service · active)"]
  gherkinextractor["GherkinExtractor<br/>(service · active)"]
  gherkinscanner["GherkinScanner<br/>(service · active)"]
  gherkinscanresultcontract["GherkinScanResultContract<br/>(contract · active)"]
  graphinventory["GraphInventory<br/>(utility · active)"]
  hierarchyleveldomain["HierarchyLevelDomain<br/>(contract · completed)"]
  layerinference["LayerInference<br/>(service · active)"]
  lintviolationcontract["LintViolationContract<br/>(contract · active)"]
  markdownblockparser["MarkdownBlockParser<br/>(codec · active)"]
  maturityleveldomain["MaturityLevelDomain<br/>(contract · active)"]
  packagematchercontract["PackageMatcherContract<br/>(contract · active)"]
  packageresolver["PackageResolver<br/>(utility · active)"]
  patternclassification["PatternClassification<br/>(utility · active)"]
  patterngraph["PatternGraph<br/>(contract · active)"]
  patterngraphapi["PatternGraphApi<br/>(utility · active)"]
  patternhelpers["PatternHelpers<br/>(utility · active)"]
  patternreferencecontract["PatternReferenceContract<br/>(contract · active)"]
  patternscanner["PatternScanner<br/>(service · active)"]
  patternsourcemerger["PatternSourceMerger<br/>(service · active)"]
  pipelinedatasetcontract["PipelineDatasetContract<br/>(contract · active)"]
  projectconfigcontract["ProjectConfigContract<br/>(contract · active)"]
  projectconfigresolution["ProjectConfigResolution<br/>(service · active)"]
  projectconfigschema["ProjectConfigSchema<br/>(codec · active)"]
  readapiresultcontract["ReadApiResultContract<br/>(contract · active)"]
  registrybuilder["RegistryBuilder<br/>(utility · active)"]
  relationshipresolver["RelationshipResolver<br/>(service · active)"]
  resultmonadtypes["ResultMonadTypes<br/>(contract · completed)"]
  ruleaggregation["RuleAggregation<br/>(utility · active)"]
  shapeextractor["ShapeExtractor<br/>(service · active)"]
  sourcemerge["SourceMerge<br/>(utility · active)"]
  statusnormalization["StatusNormalization<br/>(service · active)"]
  statusvaluedomain["StatusValueDomain<br/>(contract · active)"]
  tagdirectiveregexbuilders["TagDirectiveRegexBuilders<br/>(utility · completed)"]
  tagregistryschemas["TagRegistrySchemas<br/>(contract · active)"]
  transformdataset["TransformDataset<br/>(service · active)"]
  trustboundaryparser["TrustBoundaryParser<br/>(service · active)"]
  zoderrorboundary["ZodErrorBoundary<br/>(utility · active)"]
  architectconfigcontract -->|depends-on| tagregistryschemas
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
  configvalidationschemas -->|depends-on| brandedidentifiers
  decisionresolution -->|depends-on| extractedpattern
  decisionresolution -->|depends-on| patterngraph
  decisionresolution -->|depends-on| patternhelpers
  docdirectivecontract -->|depends-on| tagregistryschemas
  docextractor -->|depends-on| shapeextractor
  dualsourceextractor -->|depends-on| extractedpattern
  dualsourceextractor -->|depends-on| patternhelpers
  dualsourceschemas -->|depends-on| deliverablestatusdomain
  dualsourceschemas -->|depends-on| domainenumschemas
  dualsourceschemas -->|depends-on| statusvaluedomain
  fsmvalidator -->|depends-on| fsmstates
  fsmvalidator -->|depends-on| fsmtransitions
  gherkinextractor -->|depends-on| gherkinastparser
  gherkinextractor -->|depends-on| layerinference
  graphinventory -->|depends-on| extractedpattern
  graphinventory -->|depends-on| patterngraph
  graphinventory -->|depends-on| patternhelpers
  maturityleveldomain -->|depends-on| statusvaluedomain
  patternclassification -->|depends-on| extractedpattern
  patternclassification -->|depends-on| patterngraph
  patterngraph -->|depends-on| extractedpattern
  patterngraphapi -->|depends-on| extractedpattern
  patterngraphapi -->|depends-on| patterngraph
  patterngraphapi -->|depends-on| patternhelpers
  patternhelpers -->|depends-on| extractedpattern
  patternhelpers -->|depends-on| patterngraph
  patternsourcemerger -->|depends-on| extractedpattern
  patternsourcemerger -->|depends-on| patternhelpers
  patternsourcemerger -->|depends-on| resultmonadtypes
  pipelinedatasetcontract -->|depends-on| extractedpattern
  pipelinedatasetcontract -->|depends-on| patterngraph
  pipelinedatasetcontract -->|depends-on| tagregistryschemas
  projectconfigcontract -->|depends-on| architectconfigcontract
  projectconfigcontract -->|depends-on| contextinference
  projectconfigcontract -->|depends-on| formattypedomain
  projectconfigcontract -->|depends-on| packagematchercontract
  projectconfigcontract -->|depends-on| tagregistryschemas
  projectconfigresolution -->|depends-on| configdefaults
  projectconfigresolution -->|depends-on| contextinference
  projectconfigresolution -->|depends-on| projectconfigcontract
  projectconfigschema -->|depends-on| formattypedomain
  projectconfigschema -->|depends-on| packagematchercontract
  projectconfigschema -->|depends-on| projectconfigcontract
  readapiresultcontract -->|depends-on| patterngraph
  relationshipresolver -->|depends-on| decisionresolution
  relationshipresolver -->|depends-on| extractedpattern
  relationshipresolver -->|depends-on| patterngraph
  relationshipresolver -->|depends-on| patternreferencecontract
  relationshipresolver -->|depends-on| pipelinedatasetcontract
  ruleaggregation -->|depends-on| extractedpattern
  ruleaggregation -->|depends-on| patterngraph
  ruleaggregation -->|depends-on| patternhelpers
  tagdirectiveregexbuilders -->|depends-on| architectconfigcontract
  transformdataset -->|depends-on| contextinference
  transformdataset -->|depends-on| extractedpattern
  transformdataset -->|depends-on| maturityleveldomain
  transformdataset -->|depends-on| packageresolver
  transformdataset -->|depends-on| patterngraph
  transformdataset -->|depends-on| patternhelpers
  transformdataset -->|depends-on| pipelinedatasetcontract
  transformdataset -->|depends-on| relationshipresolver
  transformdataset -->|depends-on| statusnormalization
  transformdataset -->|depends-on| statusvaluedomain
  zoderrorboundary -->|depends-on| trustboundaryparser
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
  adr014agentreadsurface["ADR014AgentReadSurface<br/>(completed)"]
  apireferenceshapecoverage["ApiReferenceShapeCoverage<br/>(candidate)"]
  architectbriefdeterministicbundle["ArchitectBriefDeterministicBundle<br/>(candidate)"]
  architecturedelta["ArchitectureDelta<br/>(roadmap)"]
  assistivecodeintelligence["AssistiveCodeIntelligence<br/>(epic · candidate)"]
  codecbehaviorexecutabletests["CodecBehaviorExecutableTests<br/>(roadmap)"]
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
  taxonomydocumentationcluster["TaxonomyDocumentationCluster<br/>(completed)"]
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
  adr014agentreadsurface -->|depends-on| adr006singlereadmodelarchitecture
  adr014agentreadsurface -->|depends-on| adr010documentationcompositionhelpers
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

### Package: Architect Projection (127 patterns)

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
  architecturegraphsupport["ArchitectureGraphSupport<br/>(service · active)"]
  architectureneighborhood["ArchitectureNeighborhood<br/>(contract · active)"]
  architectureneighborhoodprojection["ArchitectureNeighborhoodProjection<br/>(projection · completed)"]
  boundedcontextfragmentcontract["BoundedContextFragmentContract<br/>(contract · active)"]
  boundedcontextprojection["BoundedContextProjection<br/>(projection · completed)"]
  businessrule["BusinessRule<br/>(contract · active)"]
  businessrulereference["BusinessRuleReference<br/>(contract · active)"]
  businessruleset["BusinessRuleSet<br/>(contract · active)"]
  businessrulesetassembly["BusinessRuleSetAssembly<br/>(service · completed)"]
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
  deterministicformatutils["DeterministicFormatUtils<br/>(utility · completed)"]
  disclosurespec["DisclosureSpec<br/>(contract · active)"]
  documentationbundle["DocumentationBundle<br/>(projection · completed)"]
  documentationcompositionprojectionsupport["DocumentationCompositionProjectionSupport<br/>(utility · completed)"]
  documentationcompositionsupporting["DocumentationCompositionSupporting<br/>(contract · active)"]
  documentationdefinitionregistry["DocumentationDefinitionRegistry<br/>(decider · completed)"]
  documentationtypeidentity["DocumentationTypeIdentity<br/>(contract · active)"]
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
  groupedroutedbundlesupport["GroupedRoutedBundleSupport<br/>(service · active)"]
  handoffprojection["HandoffProjection<br/>(projection · completed)"]
  handoffrecord["HandoffRecord<br/>(contract · active)"]
  jsonrenderer["JsonRenderer<br/>(codec · completed)"]
  logicalrouteid["LogicalRouteId<br/>(contract · active)"]
  managedregionengine["ManagedRegionEngine<br/>(utility · active)"]
  markdownrenderer["MarkdownRenderer<br/>(codec · completed)"]
  markdownrouteprofile["MarkdownRouteProfile<br/>(service · active)"]
  openquestionlist["OpenQuestionList<br/>(contract · completed)"]
  openquestionlistprojection["OpenQuestionListProjection<br/>(projection · active)"]
  operationalinsightsprojectionsupport["OperationalInsightsProjectionSupport<br/>(utility · completed)"]
  operationalinsightssupporting["OperationalInsightsSupporting<br/>(contract · active)"]
  orphanpatternlist["OrphanPatternList<br/>(contract · active)"]
  orphanpatternlistprojection["OrphanPatternListProjection<br/>(projection · completed)"]
  overviewdigest["OverviewDigest<br/>(contract · active)"]
  overviewprojection["OverviewProjection<br/>(projection · completed)"]
  patternbundleassembly["PatternBundleAssembly<br/>(service · completed)"]
  patternbundleentry["PatternBundleEntry<br/>(contract · completed)"]
  patternbundleprojection["PatternBundleProjection<br/>(projection · active)"]
  patterncatalog["PatternCatalog<br/>(contract · active)"]
  patterncatalogassembly["PatternCatalogAssembly<br/>(service · completed)"]
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
  progressivedisclosurelevel["ProgressiveDisclosureLevel<br/>(contract · active)"]
  projectconfigprojection["ProjectConfigProjection<br/>(projection · completed)"]
  projectconfigsnapshot["ProjectConfigSnapshot<br/>(contract · active)"]
  projectionbundle["ProjectionBundle<br/>(contract · active)"]
  projectioncontext["ProjectionContext<br/>(contract · active)"]
  projectionerror["ProjectionError<br/>(contract · active)"]
  projectionfilter["ProjectionFilter<br/>(contract · active)"]
  projectionfilterresolver["ProjectionFilterResolver<br/>(decider · active)"]
  projectionfragmentcontracts["ProjectionFragmentContracts<br/>(contract · active)"]
  projectionfragmentschema["ProjectionFragmentSchema<br/>(contract · active)"]
  projectiontrustboundary["ProjectionTrustBoundary<br/>(service · active)"]
  rendereroptions["RendererOptions<br/>(contract · active)"]
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
  slugcanonicalization["SlugCanonicalization<br/>(utility · completed)"]
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
  businessrulesetassembly -->|depends-on| businessrule
  businessrulesetassembly -->|depends-on| businessruleset
  businessrulesetassembly -->|depends-on| governanceprojectionsupport
  businessrulesetassembly -->|depends-on| governancesupporting
  businessrulesetassembly -->|depends-on| groupedroutedbundlesupport
  businessrulesetassembly -->|depends-on| logicalrouteid
  businessrulesetassembly -->|depends-on| projectionbundle
  businessrulesetassembly -->|depends-on| projectioncontext
  businessrulesetassembly -->|depends-on| projectionerror
  businessrulesetassembly -->|depends-on| projectionfilter
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
  disclosurespec -->|depends-on| projectionfilter
  documentationbundle -->|depends-on| documentationcompositionprojectionsupport
  documentationbundle -->|depends-on| projectionfragmentcontracts
  documentationcompositionprojectionsupport -->|depends-on| architecturediagram
  documentationcompositionprojectionsupport -->|depends-on| prchangereview
  documentationcompositionprojectionsupport -->|depends-on| projectconfigsnapshot
  documentationdefinitionregistry -->|depends-on| apireferenceprojection
  documentationdefinitionregistry -->|depends-on| architecturediagramprojection
  documentationdefinitionregistry -->|depends-on| businessrulesprojection
  documentationdefinitionregistry -->|depends-on| decisioncatalogprojection
  documentationdefinitionregistry -->|depends-on| designreviewprojection
  documentationdefinitionregistry -->|depends-on| documentationtypeidentity
  documentationdefinitionregistry -->|depends-on| projectionbundle
  documentationdefinitionregistry -->|depends-on| projectioncontext
  documentationdefinitionregistry -->|depends-on| taxonomydigestprojection
  documentationdefinitionregistry -->|depends-on| traceabilitymatrixprojection
  documentationdefinitionregistry -->|depends-on| validationruledigestprojection
  documentationtypeidentity -->|depends-on| logicalrouteid
  executioncontextprojectionsupport -->|depends-on| projectionfragmentcontracts
  filereadinglistprojection -->|depends-on| executioncontextprojectionsupport
  filereadinglistprojection -->|depends-on| filereadinglist
  filereadinglistprojection -->|depends-on| projectionfragmentcontracts
  fragmentrendererdispatch -->|depends-on| projectionfragmentschema
  generatordegeneracyguard -->|depends-on| projectionfragmentcontracts
  governanceprojectionsupport -->|depends-on| projectionfragmentcontracts
  groupedroutedbundlesupport -->|depends-on| projectionbundle
  handoffprojection -->|depends-on| executioncontextprojectionsupport
  handoffprojection -->|depends-on| handoffrecord
  handoffprojection -->|depends-on| projectionfragmentcontracts
  handoffrecord -->|depends-on| executioncontextsupporting
  jsonrenderer -->|depends-on| projectionfragmentschema
  markdownrenderer -->|depends-on| fragmentrendererdispatch
  markdownrenderer -->|depends-on| projectionfragmentschema
  markdownrouteprofile -->|depends-on| emissiondescriptor
  markdownrouteprofile -->|depends-on| logicalrouteid
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
  patternbundleassembly -->|depends-on| businessrule
  patternbundleassembly -->|depends-on| businessrulesprojection
  patternbundleassembly -->|depends-on| logicalrouteid
  patternbundleassembly -->|depends-on| patterncatalogassembly
  patternbundleassembly -->|depends-on| patterndetailprojection
  patternbundleassembly -->|depends-on| patternrelationsprojectionsupport
  patternbundleassembly -->|depends-on| patternsummaryprojection
  patternbundleassembly -->|depends-on| projectionbundle
  patternbundleassembly -->|depends-on| projectioncontext
  patternbundleentry -->|depends-on| businessrule
  patternbundleentry -->|depends-on| patternrelationssupporting
  patternbundleentry -->|depends-on| patternsummary
  patternbundleprojection -->|depends-on| patternrelationsfragmentcontracts
  patternbundleprojection -->|depends-on| patternrelationsprojectionsupport
  patterncatalogassembly -->|depends-on| patterncatalog
  patterncatalogassembly -->|depends-on| patternrelationsprojectionsupport
  patterncatalogassembly -->|depends-on| projectioncontext
  patterncatalogassembly -->|depends-on| projectionfilter
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
  projectionbundle -->|depends-on| emissiondescriptor
  projectionbundle -->|depends-on| projectionfragmentschema
  projectionfilterresolver -->|depends-on| documentationtyperegistry
  projectionfilterresolver -->|depends-on| progressivedisclosurelevel
  projectionfilterresolver -->|depends-on| projectionfilter
  projectiontrustboundary -->|depends-on| projectioncontext
  rendereroptions -->|depends-on| disclosurespec
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
| ExtractedPattern                     | 21         | ArchitectureGraphSupport, ArchitectureInspection, BusinessRuleSetAssembly, DecisionResolution, DeliveryReportingProjectionSupport                       |
| ProjectionFragmentContracts          | 17         | ArchitectureDiagramProjection, BusinessRulesProjection, DecisionCatalogProjection, DeliverableProjection, DocumentationBundle                           |
| PatternGraph                         | 15         | ArchitectureInspection, BuildPipeline, DecisionResolution, GraphInventory, PatternClassification                                                        |
| PatternRelationsProjectionSupport    | 13         | ArchitectureComparisonProjection, ArchitectureNeighborhoodProjection, BoundedContextProjection, DependencyContextProjection, DependencyEdgeProjection   |
| PatternHelpers                       | 11         | ArchitectureInspection, BusinessRuleSetAssembly, DecisionResolution, DualSourceExtractor, GraphInventory                                                |
| PatternRelationsFragmentContracts    | 11         | ArchitectureComparisonProjection, ArchitectureNeighborhoodProjection, DependencyContextProjection, DependencyEdgeProjection, OpenQuestionListProjection |
| OperationalInsightsProjectionSupport | 8          | AnnotationCoverageProjection, OverviewProjection, RequirementDigestProjection, RequirementExecutableDigestProjection, RequirementSpecsDigestProjection  |
| BlockSchema                          | 7          | ArchitectureDiagram, DecisionRecord, DocumentationCompositionSupporting, MarkdownRenderer, OperationalInsightsSupporting                                |
| ProjectionFragmentSchema             | 7          | ApiReferenceProjection, CompactTextRenderer, FragmentRendererDispatch, JsonRenderer, MarkdownRenderer                                                   |
| ADR001TaxonomyCanonicalValues        | 6          | ADR003SourceFirstPatternArchitecture, ADR007CoordinatedTaxonomyRedesign, ADR012DeliveryNavigation, ADR013TaxonomyRetirement, PDR005ProcessGuardFSM      |

## Cross-package bounded contexts

Bounded contexts whose patterns span more than one workspace package.

| Bounded context | Packages                                                      | Patterns |
| --------------- | ------------------------------------------------------------- | -------- |
| cli             | Architect CLI, Architect Core, Architect Guard, Architect MCP | 12       |
| api             | Architect MCP, Architect Package Content                      | 7        |
| extractor       | Architect Core, Architect Package Content                     | 7        |
| governance      | Architect Package Content, Architect Projection               | 10       |
| projection      | Architect Package Content, Architect Projection               | 49       |
| rendering       | Architect Core, Architect Projection                          | 16       |
| validation      | Architect Core, Architect Guard                               | 9        |

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
- ADR014AgentReadSurface
- AnnotationCoverage
- AnnotationCoverageProjection
- AntiPatternDetector
- AntiPatternValidationTypes
- ApiReferenceDigest
- ApiReferenceProjection
- ApiReferenceShapeCoverage
- ArchitectBriefDeterministicBundle
- ArchitectConfigContract
- ArchitectureComparison
- ArchitectureComparisonProjection
- ArchitectureDelta
- ArchitectureDiagram
- ArchitectureDiagramProjection
- ArchitectureGraphProjection
- ArchitectureGraphSupport
- ArchitectureInspection
- ArchitectureNeighborhood
- ArchitectureNeighborhoodProjection
- ArgvHygiene
- AssistiveCodeIntelligence
- AstParser
- AuthoredCoreBuilder
- BlockSchema
- BoundedContextFragmentContract
- BoundedContextProjection
- BrandedIdentifiers
- BuildPipeline
- BusinessRule
- BusinessRuleReference
- BusinessRuleSet
- BusinessRuleSetAssembly
- BusinessRulesProjection
- ChangelogProjection
- CLIContextTypes
- CLIErrorHandler
- CLIRuntimePaths
- CodecBehaviorExecutableTests
- CodecUtils
- CompactTextRenderer
- ConfigDefaults
- ConfigLoader
- ConfigValidationSchemas
- ContextInference
- DecisionCatalog
- DecisionCatalogProjection
- DecisionRecord
- DecisionRecordTemporalHygiene
- DecisionResolution
- DefineConfig
- Deliverable
- DeliverableManifest
- DeliverableProjection
- DeliverableStatusDomain
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
- DeterministicFormatUtils
- DisclosureSpec
- DocDirectiveContract
- DocExtractor
- DocumentationBundle
- DocumentationCompositionProjectionSupport
- DocumentationCompositionSupporting
- DocumentationDefinitionRegistry
- DocumentationProjection
- DocumentationTypeIdentity
- DocumentationTypeRegistry
- DomainEnumSchemas
- DualSourceExtractor
- DualSourceSchemas
- EmissionDescriptor
- ErrorFactoryTypes
- ExecutionContextProjectionSupport
- ExecutionContextSupporting
- ExportInfoContract
- ExtractedPattern
- ExtractionDiagnostics
- FileReadingList
- FileReadingListProjection
- FormatTypeDomain
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
- GherkinScanResultContract
- GitBranchDiff
- GitHelpers
- GitModule
- GitNameStatusParser
- GoalOrientedNavigation
- GovernanceProjectionSupport
- GovernanceSupporting
- GraphHandle
- GraphHandleCli
- GraphHandleShapes
- GraphHandleViews
- GraphInventory
- GroupedRoutedBundleSupport
- HandoffProjection
- HandoffRecord
- HierarchyLevelDomain
- JsonRenderer
- LayerInference
- LintEngine
- LintModule
- LintPatternsCLI
- LintProcessCLI
- LintRules
- LintViolationContract
- LogicalRouteId
- ManagedRegionEngine
- MarkdownBlockParser
- MarkdownRenderer
- MarkdownRouteProfile
- MaturityLevelDomain
- MCPFileWatcher
- McpOutputSchemaValidation
- MCPPipelineSession
- MCPServer
- MCPServerBin
- MCPToolRegistry
- MechanicalSubstrateExtractor
- ModelEnrichedDataAPI
- MonorepoSupport
- MultiSourceComposition
- OneSourceMultipleAudiences
- OpenQuestionList
- OpenQuestionListProjection
- OperationalInsightsProjectionSupport
- OperationalInsightsSupporting
- OrphanPatternList
- OrphanPatternListProjection
- OverviewDigest
- OverviewProjection
- PackageMatcherContract
- PackageResolver
- PatternBundleAssembly
- PatternBundleEntry
- PatternBundleProjection
- PatternCatalog
- PatternCatalogAssembly
- PatternCatalogProjection
- PatternClassification
- PatternDetail
- PatternDetailProjection
- PatternGraph
- PatternGraphApi
- PatternHelpers
- PatternReferenceContract
- PatternRelationsFragmentContracts
- PatternRelationsProjectionSupport
- PatternRelationsSupporting
- PatternScanner
- PatternSourceMerger
- PatternSummary
- PatternSummaryProjection
- PDR001SessionWorkflowCommands
- PDR005ProcessGuardFSM
- PDR006AdvisoryProcessGuardProtection
- PipelineDatasetContract
- PrChangeReview
- PrChangeReviewProjection
- PrdImplementationSection
- ProcessGuardDecider
- ProcessGuardLinter
- ProcessGuardTypes
- ProgressiveDisclosureLevel
- ProgressiveGovernance
- ProjectConfigContract
- ProjectConfigProjection
- ProjectConfigResolution
- ProjectConfigSchema
- ProjectConfigSnapshot
- ProjectionBundle
- ProjectionContext
- ProjectionError
- ProjectionFilter
- ProjectionFilterResolver
- ProjectionFragmentContracts
- ProjectionFragmentSchema
- ProjectionTrustBoundary
- ReadApiResultContract
- ReadModelReflexivity
- RegistryBuilder
- RelationshipResolver
- RendererOptions
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
- SlugCanonicalization
- SourceCanonical
- SourceInventoryDigest
- SourceInventoryEntry
- SourceInventoryProjection
- SourceMerge
- StatusAwareEslintSuppression
- StatusDistribution
- StatusDistributionProjection
- StatusNormalization
- StatusValueDomain
- StepDefinitionCompletion
- StreamingGitDiff
- TagDirectiveRegexBuilders
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
- TransformDataset
- TrustBoundaryParser
- UiRenderer
- ValidatePatternsCLI
- ValidationModule
- ValidationRuleDigest
- ValidationRuleDigestProjection
- ValueTransferState
- ZodErrorBoundary

---

[← Back to Design Review](../DESIGN-REVIEW.md)
