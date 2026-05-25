# Architecture

**Purpose:** Auto-generated architecture diagram from source annotations
**Detail Level:** Component diagram with bounded context subgraphs

---

## Overview

This diagram captures 232 patterns in the Component architecture view.

## Diagram

```mermaid
graph TD
  adr001taxonomycanonicalvalues["ADR001TaxonomyCanonicalValues"]
  adr002gherkinonlytesting["ADR002GherkinOnlyTesting"]
  adr003sourcefirstpatternarchitecture["ADR003SourceFirstPatternArchitecture"]
  adr005codecbasedmarkdownrendering["ADR005CodecBasedMarkdownRendering"]
  adr006singlereadmodelarchitecture["ADR006SingleReadModelArchitecture"]
  adr007coordinatedtaxonomyredesign["ADR007CoordinatedTaxonomyRedesign"]
  adr008stepdefinitionstubsconvention["ADR008StepDefinitionStubsConvention"]
  adr009projectiontrustboundary["ADR009ProjectionTrustBoundary"]
  architectpubliccontract["ArchitectPublicContract"]
  architecturenavigationprojectionexecutabletests["ArchitectureNavigationProjectionExecutableTests<br/>(projection)"]
  boundedcontextfragmentcontract["BoundedContextFragmentContract<br/>(contract)"]
  businessrulesprojectionexecutabletests["BusinessRulesProjectionExecutableTests<br/>(projection)"]
  canonicalvaluessync["CanonicalValuesSync"]
  codecutilsvalidation["CodecUtilsValidation"]
  compacttextrenderertests["CompactTextRendererTests"]
  configbasedworkflowdefinition["ConfigBasedWorkflowDefinition"]
  configresolution["ConfigResolution"]
  configurationapi["ConfigurationAPI"]
  crosspackageedgeclassification["CrossPackageEdgeClassification"]
  dataapicliergonomics["DataAPICLIErgonomics"]
  dataapioutputshaping["DataAPIOutputShaping"]
  decisioncatalogprojectionexecutabletests["DecisionCatalogProjectionExecutableTests<br/>(projection)"]
  defineconfigexecutabletests["DefineConfigExecutableTests"]
  deliveryprogressprojectionexecutabletests["DeliveryProgressProjectionExecutableTests<br/>(projection)"]
  deliveryreportingfragmentcontracts["DeliveryReportingFragmentContracts<br/>(contract)"]
  deliveryreportingprojectionsupportexecutabletests["DeliveryReportingProjectionSupportExecutableTests<br/>(projection)"]
  dependencyedgeprojectionexecutabletests["DependencyEdgeProjectionExecutableTests<br/>(projection)"]
  dependencytreeprojectionexecutabletests["DependencyTreeProjectionExecutableTests<br/>(projection)"]
  docstringmediatype["DocStringMediaType"]
  documentationcommandparityboundarytests["DocumentationCommandParityBoundaryTests"]
  documentationcompositionprojectionexecutabletests["DocumentationCompositionProjectionExecutableTests<br/>(projection)"]
  dualsourcemergeintegration["DualSourceMergeIntegration"]
  errorfactories["ErrorFactories<br/>(contract)"]
  errorfactorytypes["ErrorFactoryTypes<br/>(contract)"]
  executioncontextprojectionexecutabletests["ExecutionContextProjectionExecutableTests<br/>(projection)"]
  filediscovery["FileDiscovery"]
  generatedocscli["GenerateDocsCli"]
  gherkinexternalrelationshiptagpropagation["GherkinExternalRelationshipTagPropagation"]
  gherkinrulessupport["GherkinRulesSupport"]
  governancevalidationtaxonomyprojectionexecutabletests["GovernanceValidationTaxonomyProjectionExecutableTests<br/>(projection)"]
  lintpatternsclibehavior["LintPatternsCliBehavior"]
  lintprocessclibehavior["LintProcessCliBehavior"]
  loadpreambleparser["LoadPreambleParser"]
  mcpruntimehardeningexecutabletests["MCPRuntimeHardeningExecutableTests"]
  mcpserverlifecycleexecutabletests["MCPServerLifecycleExecutableTests"]
  mcptoolinputvalidationexecutabletests["MCPToolInputValidationExecutableTests"]
  mcptoolregistryboundarytests["MCPToolRegistryBoundaryTests"]
  mcptoolregistryintegrationtests["MCPToolRegistryIntegrationTests"]
  openquestionlistprojectionexecutabletests["OpenQuestionListProjectionExecutableTests<br/>(projection)"]
  operationalinsightsprojectionexecutabletests["OperationalInsightsProjectionExecutableTests<br/>(projection)"]
  packageresolverexecutabletests["PackageResolverExecutableTests"]
  patternbundleprojectionexecutabletests["PatternBundleProjectionExecutableTests<br/>(projection)"]
  patterndetailprojectionexecutabletests["PatternDetailProjectionExecutableTests<br/>(projection)"]
  patterngraphapicli["PatternGraphAPICLI"]
  patterngraphapireverselookup["PatternGraphApiReverseLookup"]
  patterngraphcliarchhealth["PatternGraphCliArchHealth"]
  patterngraphclicache["PatternGraphCliCache"]
  patterngraphclidryrun["PatternGraphCliDryRun"]
  patterngraphclimetadata["PatternGraphCliMetadata"]
  patterngraphclioutputmodifiers["PatternGraphCliOutputModifiers"]
  patterngraphclirepl["PatternGraphCliRepl"]
  patterngraphclirulessubcommand["PatternGraphCliRulesSubcommand"]
  patterngraphclisubcommands["PatternGraphCliSubcommands"]
  patternreferencevalidation["PatternReferenceValidation"]
  patternrelationsfragmentcontracts["PatternRelationsFragmentContracts<br/>(contract)"]
  patternsummarycatalogprojectionexecutabletests["PatternSummaryCatalogProjectionExecutableTests<br/>(projection)"]
  pdr005processguardfsm["PDR005ProcessGuardFSM"]
  projectconfigloader["ProjectConfigLoader"]
  projectionfragmentcontracts["ProjectionFragmentContracts<br/>(contract)"]
  projectionfragmentschema["ProjectionFragmentSchema<br/>(contract)"]
  releasenotesprojectionexecutabletests["ReleaseNotesProjectionExecutableTests<br/>(projection)"]
  resultmonad["ResultMonad<br/>(contract)"]
  resultmonadtypes["ResultMonadTypes<br/>(contract)"]
  scannercore["ScannerCore"]
  shapeextraction["ShapeExtraction"]
  sourcemerging["SourceMerging"]
  stubtaxonomytagtests["StubTaxonomyTagTests"]
  tagregistryschemasvalidation["TagRegistrySchemasValidation"]
  traceabilitymatrixprojectionexecutabletests["TraceabilityMatrixProjectionExecutableTests<br/>(projection)"]
  typescripttaxonomyimplementation["TypeScriptTaxonomyImplementation"]
  validatorreadmodelconsolidation["ValidatorReadModelConsolidation"]
  valueformatcanonicalvaluesdispatch["ValueFormatCanonicalValuesDispatch"]
  workflowconfigschemasvalidation["WorkflowConfigSchemasValidation"]
  subgraph operational_insights["operational-insights"]
    annotationcoverage["AnnotationCoverage<br/>(contract)"]
    operationalinsightssupporting["OperationalInsightsSupporting<br/>(contract)"]
    overviewdigest["OverviewDigest<br/>(contract)"]
    requirementdigest["RequirementDigest<br/>(contract)"]
    roleprofile["RoleProfile<br/>(contract)"]
    roleprofilecollection["RoleProfileCollection<br/>(contract)"]
    sourceinventorydigest["SourceInventoryDigest<br/>(contract)"]
    sourceinventoryentry["SourceInventoryEntry<br/>(contract)"]
    tagusageentry["TagUsageEntry<br/>(contract)"]
    tagusagematrix["TagUsageMatrix<br/>(contract)"]
  end
  subgraph projection["projection"]
    annotationcoverageprojection["AnnotationCoverageProjection<br/>(projection)"]
    architecturecomparisonprojection["ArchitectureComparisonProjection<br/>(projection)"]
    architecturediagramprojection["ArchitectureDiagramProjection<br/>(projection)"]
    architectureneighborhoodprojection["ArchitectureNeighborhoodProjection<br/>(projection)"]
    boundedcontextprojection["BoundedContextProjection<br/>(projection)"]
    businessrulesprojection["BusinessRulesProjection<br/>(projection)"]
    decisioncatalogprojection["DecisionCatalogProjection<br/>(projection)"]
    deliverableprojection["DeliverableProjection<br/>(projection)"]
    deliveryreportingprojectionsupport["DeliveryReportingProjectionSupport<br/>(utility)"]
    dependencyedgeprojection["DependencyEdgeProjection<br/>(projection)"]
    dependencytreeprojection["DependencyTreeProjection<br/>(projection)"]
    documentationbundle["DocumentationBundle<br/>(projection)"]
    documentationcompositionprojectionsupport["DocumentationCompositionProjectionSupport<br/>(utility)"]
    executioncontextprojectionsupport["ExecutionContextProjectionSupport<br/>(utility)"]
    filereadinglistprojection["FileReadingListProjection<br/>(projection)"]
    governanceprojectionsupport["GovernanceProjectionSupport<br/>(utility)"]
    handoffprojection["HandoffProjection<br/>(projection)"]
    openquestionlistprojection["OpenQuestionListProjection<br/>(projection)"]
    operationalinsightsprojectionsupport["OperationalInsightsProjectionSupport<br/>(utility)"]
    orphanpatternlistprojection["OrphanPatternListProjection<br/>(projection)"]
    overviewprojection["OverviewProjection<br/>(projection)"]
    patternbundleprojection["PatternBundleProjection<br/>(projection)"]
    patterncatalogprojection["PatternCatalogProjection<br/>(projection)"]
    patterndetailprojection["PatternDetailProjection<br/>(projection)"]
    patternrelationsprojectionsupport["PatternRelationsProjectionSupport<br/>(utility)"]
    patternsummaryprojection["PatternSummaryProjection<br/>(projection)"]
    phaseprogressprojection["PhaseProgressProjection<br/>(projection)"]
    prchangereviewprojection["PrChangeReviewProjection<br/>(projection)"]
    projectconfigprojection["ProjectConfigProjection<br/>(projection)"]
    releasenotesprojection["ReleaseNotesProjection<br/>(projection)"]
    requirementdigestprojection["RequirementDigestProjection<br/>(projection)"]
    requirementexecutabledigestprojection["RequirementExecutableDigestProjection<br/>(projection)"]
    requirementspecsdigestprojection["RequirementSpecsDigestProjection<br/>(projection)"]
    roadmaptimelineprojection["RoadmapTimelineProjection<br/>(projection)"]
    roleprofileprojection["RoleProfileProjection<br/>(projection)"]
    scopereadinessprojection["ScopeReadinessProjection<br/>(projection)"]
    sessioncontextprojection["SessionContextProjection<br/>(projection)"]
    sourceinventoryprojection["SourceInventoryProjection<br/>(projection)"]
    statusdistributionprojection["StatusDistributionProjection<br/>(projection)"]
    tagusageprojection["TagUsageProjection<br/>(projection)"]
    taxonomydigestprojection["TaxonomyDigestProjection<br/>(projection)"]
    traceabilitymatrixprojection["TraceabilityMatrixProjection<br/>(projection)"]
    validationruledigestprojection["ValidationRuleDigestProjection<br/>(projection)"]
  end
  subgraph validation["validation"]
    antipatterndetector["AntiPatternDetector<br/>(service)"]
    dodvalidationtypes["DoDValidationTypes<br/>(contract)"]
    dodvalidator["DoDValidator<br/>(service)"]
    fsmstates["FSMStates<br/>(read-model)"]
    fsmtransitions["FSMTransitions<br/>(read-model)"]
    fsmvalidator["FSMValidator<br/>(decider)"]
    validatepatternscli["ValidatePatternsCLI<br/>(service)"]
    validationmodule["ValidationModule<br/>(barrel)"]
  end
  subgraph pattern_relations["pattern-relations"]
    architecturecomparison["ArchitectureComparison<br/>(contract)"]
    architectureneighborhood["ArchitectureNeighborhood<br/>(contract)"]
    dependencyedge["DependencyEdge<br/>(contract)"]
    dependencyedgeset["DependencyEdgeSet<br/>(contract)"]
    dependencytree["DependencyTree<br/>(contract)"]
    orphanpatternlist["OrphanPatternList<br/>(contract)"]
    patterncatalog["PatternCatalog<br/>(contract)"]
    patterndetail["PatternDetail<br/>(contract)"]
    patternrelationssupporting["PatternRelationsSupporting<br/>(contract)"]
    patternsummary["PatternSummary<br/>(contract)"]
  end
  subgraph documentation_composition["documentation-composition"]
    architecturediagram["ArchitectureDiagram<br/>(contract)"]
    documentationcompositionsupporting["DocumentationCompositionSupporting<br/>(contract)"]
    prchangereview["PrChangeReview<br/>(contract)"]
    projectconfigsnapshot["ProjectConfigSnapshot<br/>(contract)"]
  end
  subgraph read_api["read-api"]
    architectureinspection["ArchitectureInspection<br/>(utility)"]
    graphinventory["GraphInventory<br/>(utility)"]
    patternclassification["PatternClassification<br/>(utility)"]
    patterngraphapi["PatternGraphApi<br/>(utility)"]
    patternhelpers["PatternHelpers<br/>(utility)"]
  end
  subgraph scanner["scanner"]
    astparser["AstParser<br/>(service)"]
    gherkinastparser["GherkinAstParser<br/>(service)"]
    gherkinscanner["GherkinScanner<br/>(service)"]
    patternscanner["PatternScanner<br/>(service)"]
  end
  subgraph rendering["rendering"]
    blockschema["BlockSchema<br/>(contract)"]
    compacttextrenderer["CompactTextRenderer<br/>(codec)"]
    fragmentrendererdispatch["FragmentRendererDispatch<br/>(codec)"]
    jsonrenderer["JsonRenderer<br/>(codec)"]
    markdownrenderer["MarkdownRenderer<br/>(codec)"]
    uirenderer["UiRenderer<br/>(codec)"]
  end
  subgraph pipeline["pipeline"]
    buildpipeline["BuildPipeline<br/>(service)"]
  end
  subgraph governance["governance"]
    businessrule["BusinessRule<br/>(contract)"]
    businessrulereference["BusinessRuleReference<br/>(contract)"]
    businessruleset["BusinessRuleSet<br/>(contract)"]
    decisioncatalog["DecisionCatalog<br/>(contract)"]
    decisionrecord["DecisionRecord<br/>(contract)"]
    governancesupporting["GovernanceSupporting<br/>(contract)"]
    taxonomydigest["TaxonomyDigest<br/>(contract)"]
    validationruledigest["ValidationRuleDigest<br/>(contract)"]
  end
  subgraph cli["cli"]
    clierrorhandler["CLIErrorHandler<br/>(utility)"]
    cliruntimepaths["CLIRuntimePaths<br/>(utility)"]
    cliversionhelper["CLIVersionHelper<br/>(utility)"]
    lintpatternscli["LintPatternsCLI<br/>(service)"]
    mcpserverbin["MCPServerBin<br/>(utility)"]
    patterngraphcli["PatternGraphCLI<br/>(service)"]
  end
  subgraph validation_schemas["validation-schemas"]
    codecutils["CodecUtils<br/>(codec)"]
    patterngraph["PatternGraph<br/>(contract)"]
  end
  subgraph configuration["configuration"]
    configloader["ConfigLoader<br/>(service)"]
    defineconfig["DefineConfig<br/>(utility)"]
  end
  subgraph execution_context["execution-context"]
    deliverable["Deliverable<br/>(contract)"]
    deliverablemanifest["DeliverableManifest<br/>(contract)"]
    executioncontextsupporting["ExecutionContextSupporting<br/>(contract)"]
    filereadinglist["FileReadingList<br/>(contract)"]
    handoffrecord["HandoffRecord<br/>(contract)"]
    scopereadinesscheck["ScopeReadinessCheck<br/>(contract)"]
    scopereadinessreport["ScopeReadinessReport<br/>(contract)"]
    sessioncontextbundle["SessionContextBundle<br/>(contract)"]
  end
  subgraph delivery_reporting["delivery-reporting"]
    deliveryreportingsupporting["DeliveryReportingSupporting<br/>(contract)"]
    phaseprogress["PhaseProgress<br/>(contract)"]
    releasenotesdigest["ReleaseNotesDigest<br/>(contract)"]
    roadmaptimeline["RoadmapTimeline<br/>(contract)"]
    statusdistribution["StatusDistribution<br/>(contract)"]
    traceabilitymatrix["TraceabilityMatrix<br/>(contract)"]
  end
  subgraph process_guard["process-guard"]
    deriveprocessstate["DeriveProcessState<br/>(read-model)"]
    detectchanges["DetectChanges<br/>(service)"]
    lintprocesscli["LintProcessCLI<br/>(service)"]
    processguardlinter["ProcessGuardLinter<br/>(barrel)"]
    processguardtypes["ProcessGuardTypes<br/>(contract)"]
    sessionstatereader["SessionStateReader<br/>(service)"]
  end
  subgraph extractor["extractor"]
    docextractor["DocExtractor<br/>(service)"]
    dualsourceextractor["DualSourceExtractor<br/>(service)"]
    extractiondiagnostics["ExtractionDiagnostics<br/>(contract)"]
    gherkinextractor["GherkinExtractor<br/>(service)"]
    layerinference["LayerInference<br/>(service)"]
    shapeextractor["ShapeExtractor<br/>(service)"]
  end
  subgraph generator["generator"]
    gitbranchdiff["GitBranchDiff<br/>(utility)"]
    githelpers["GitHelpers<br/>(utility)"]
    gitmodule["GitModule<br/>(barrel)"]
    gitnamestatusparser["GitNameStatusParser<br/>(utility)"]
  end
  subgraph lint["lint"]
    lintengine["LintEngine<br/>(service)"]
    lintmodule["LintModule<br/>(barrel)"]
    lintrules["LintRules<br/>(service)"]
    processguarddecider["ProcessGuardDecider<br/>(decider)"]
  end
  subgraph api["api"]
    mcpfilewatcher["MCPFileWatcher<br/>(utility)"]
    mcppipelinesession["MCPPipelineSession<br/>(service)"]
    mcpserver["MCPServer<br/>(service)"]
    mcptoolregistry["MCPToolRegistry<br/>(service)"]
  end
  subgraph domain["domain"]
    packageresolver["PackageResolver<br/>(utility)"]
  end
  subgraph guard["guard"]
    processguardrulesexecutabletests["ProcessGuardRulesExecutableTests"]
  end
  adr001taxonomycanonicalvalues ==>|enables| adr003sourcefirstpatternarchitecture
  adr001taxonomycanonicalvalues ==>|enables| adr007coordinatedtaxonomyredesign
  adr001taxonomycanonicalvalues -. see-also .- adr007coordinatedtaxonomyredesign
  adr001taxonomycanonicalvalues ==>|enables| pdr005processguardfsm
  adr002gherkinonlytesting ==>|enables| adr008stepdefinitionstubsconvention
  adr003sourcefirstpatternarchitecture -->|depends-on| adr001taxonomycanonicalvalues
  adr003sourcefirstpatternarchitecture -.->|uses| adr001taxonomycanonicalvalues
  adr003sourcefirstpatternarchitecture ==>|enables| adr008stepdefinitionstubsconvention
  adr005codecbasedmarkdownrendering ==>|enables| adr006singlereadmodelarchitecture
  adr006singlereadmodelarchitecture -->|depends-on| adr005codecbasedmarkdownrendering
  adr006singlereadmodelarchitecture -.->|uses| adr005codecbasedmarkdownrendering
  adr006singlereadmodelarchitecture ==>|enables| validatorreadmodelconsolidation
  adr007coordinatedtaxonomyredesign -->|depends-on| adr001taxonomycanonicalvalues
  adr007coordinatedtaxonomyredesign -.->|uses| adr001taxonomycanonicalvalues
  adr007coordinatedtaxonomyredesign -->|depends-on| pdr005processguardfsm
  adr007coordinatedtaxonomyredesign -.->|uses| pdr005processguardfsm
  adr008stepdefinitionstubsconvention -->|depends-on| adr002gherkinonlytesting
  adr008stepdefinitionstubsconvention -.->|uses| adr002gherkinonlytesting
  adr008stepdefinitionstubsconvention -->|depends-on| adr003sourcefirstpatternarchitecture
  adr008stepdefinitionstubsconvention -.->|uses| adr003sourcefirstpatternarchitecture
  adr009projectiontrustboundary -. see-also .- adr005codecbasedmarkdownrendering
  adr009projectiontrustboundary -. see-also .- adr006singlereadmodelarchitecture
  annotationcoverage ==>|enables| annotationcoverageprojection
  annotationcoverageprojection -->|depends-on| annotationcoverage
  annotationcoverageprojection -.->|uses| annotationcoverage
  annotationcoverageprojection -->|depends-on| operationalinsightsprojectionsupport
  annotationcoverageprojection -.->|uses| operationalinsightsprojectionsupport
  antipatterndetector -->|depends-on| dodvalidationtypes
  antipatterndetector -.->|uses| dodvalidationtypes
  architecturecomparison ==>|enables| architecturecomparisonprojection
  architecturecomparisonprojection -->|depends-on| architecturecomparison
  architecturecomparisonprojection -.->|uses| architecturecomparison
  architecturecomparisonprojection -->|depends-on| patternrelationsfragmentcontracts
  architecturecomparisonprojection -.->|uses| patternrelationsfragmentcontracts
  architecturecomparisonprojection -->|depends-on| patternrelationsprojectionsupport
  architecturecomparisonprojection -.->|uses| patternrelationsprojectionsupport
  architecturediagram -->|depends-on| blockschema
  architecturediagram -.->|uses| blockschema
  architecturediagram ==>|enables| documentationcompositionprojectionsupport
  architecturediagramprojection -->|depends-on| documentationcompositionprojectionsupport
  architecturediagramprojection -.->|uses| documentationcompositionprojectionsupport
  architecturediagramprojection -->|depends-on| projectionfragmentcontracts
  architecturediagramprojection -.->|uses| projectionfragmentcontracts
  architectureneighborhood ==>|enables| architectureneighborhoodprojection
  architectureneighborhoodprojection -->|depends-on| architectureneighborhood
  architectureneighborhoodprojection -.->|uses| architectureneighborhood
  architectureneighborhoodprojection -->|depends-on| patternrelationsfragmentcontracts
  architectureneighborhoodprojection -.->|uses| patternrelationsfragmentcontracts
  architectureneighborhoodprojection -->|depends-on| patternrelationsprojectionsupport
  architectureneighborhoodprojection -.->|uses| patternrelationsprojectionsupport
  blockschema ==>|enables| architecturediagram
  blockschema ==>|enables| decisionrecord
  blockschema ==>|enables| documentationcompositionsupporting
  blockschema ==>|enables| markdownrenderer
  blockschema ==>|enables| operationalinsightssupporting
  blockschema ==>|enables| prchangereview
  blockschema ==>|enables| uirenderer
  boundedcontextfragmentcontract ==>|enables| boundedcontextprojection
  boundedcontextprojection -->|depends-on| boundedcontextfragmentcontract
  boundedcontextprojection -.->|uses| boundedcontextfragmentcontract
  boundedcontextprojection -->|depends-on| patternrelationsprojectionsupport
  boundedcontextprojection -.->|uses| patternrelationsprojectionsupport
  buildpipeline -->|depends-on| docextractor
  buildpipeline -.->|uses| docextractor
  buildpipeline -->|depends-on| extractiondiagnostics
  buildpipeline -.->|uses| extractiondiagnostics
  buildpipeline -->|depends-on| gherkinextractor
  buildpipeline -.->|uses| gherkinextractor
  buildpipeline -->|depends-on| gherkinscanner
  buildpipeline -.->|uses| gherkinscanner
  buildpipeline -->|depends-on| patterngraph
  buildpipeline -.->|uses| patterngraph
  buildpipeline -->|depends-on| patternscanner
  buildpipeline -.->|uses| patternscanner
  businessrule ==>|enables| businessrulesprojection
  businessrulereference ==>|enables| operationalinsightsprojectionsupport
  businessruleset ==>|enables| businessrulesprojection
  businessrulesprojection -->|depends-on| businessrule
  businessrulesprojection -.->|uses| businessrule
  businessrulesprojection -->|depends-on| businessruleset
  businessrulesprojection -.->|uses| businessruleset
  businessrulesprojection -->|depends-on| governanceprojectionsupport
  businessrulesprojection -.->|uses| governanceprojectionsupport
  businessrulesprojection -->|depends-on| governancesupporting
  businessrulesprojection -.->|uses| governancesupporting
  businessrulesprojection -->|depends-on| projectionfragmentcontracts
  businessrulesprojection -.->|uses| projectionfragmentcontracts
  canonicalvaluessync -. see-also .- adr001taxonomycanonicalvalues
  clierrorhandler -->|depends-on| errorfactorytypes
  clierrorhandler -.->|uses| errorfactorytypes
  cliruntimepaths ==>|enables| cliversionhelper
  cliruntimepaths ==>|enables| patterngraphcli
  cliversionhelper -->|depends-on| cliruntimepaths
  cliversionhelper -.->|uses| cliruntimepaths
  cliversionhelper ==>|enables| patterngraphcli
  codecutils ==>|enables| lintengine
  codecutils ==>|enables| validatepatternscli
  compacttextrenderer -->|depends-on| fragmentrendererdispatch
  compacttextrenderer -.->|uses| fragmentrendererdispatch
  compacttextrenderer -->|depends-on| projectionfragmentschema
  compacttextrenderer -.->|uses| projectionfragmentschema
  decisioncatalog ==>|enables| decisioncatalogprojection
  decisioncatalogprojection -->|depends-on| decisioncatalog
  decisioncatalogprojection -.->|uses| decisioncatalog
  decisioncatalogprojection -->|depends-on| decisionrecord
  decisioncatalogprojection -.->|uses| decisionrecord
  decisioncatalogprojection -->|depends-on| governanceprojectionsupport
  decisioncatalogprojection -.->|uses| governanceprojectionsupport
  decisioncatalogprojection -->|depends-on| projectionfragmentcontracts
  decisioncatalogprojection -.->|uses| projectionfragmentcontracts
  decisionrecord -->|depends-on| blockschema
  decisionrecord -.->|uses| blockschema
  decisionrecord ==>|enables| decisioncatalogprojection
  deliverable ==>|enables| deliveryreportingsupporting
  deliverable ==>|enables| patternrelationssupporting
  deliverablemanifest ==>|enables| patternrelationssupporting
  deliverableprojection -->|depends-on| executioncontextprojectionsupport
  deliverableprojection -.->|uses| executioncontextprojectionsupport
  deliverableprojection -->|depends-on| projectionfragmentcontracts
  deliverableprojection -.->|uses| projectionfragmentcontracts
  deliveryreportingfragmentcontracts ==>|enables| deliveryreportingprojectionsupport
  deliveryreportingprojectionsupport -->|depends-on| deliveryreportingfragmentcontracts
  deliveryreportingprojectionsupport -.->|uses| deliveryreportingfragmentcontracts
  deliveryreportingprojectionsupport ==>|enables| phaseprogressprojection
  deliveryreportingprojectionsupport ==>|enables| releasenotesprojection
  deliveryreportingprojectionsupport ==>|enables| roadmaptimelineprojection
  deliveryreportingprojectionsupport ==>|enables| statusdistributionprojection
  deliveryreportingprojectionsupport ==>|enables| traceabilitymatrixprojection
  deliveryreportingsupporting -->|depends-on| deliverable
  deliveryreportingsupporting -.->|uses| deliverable
  deliveryreportingsupporting -->|depends-on| patternsummary
  deliveryreportingsupporting -.->|uses| patternsummary
  dependencyedge ==>|enables| dependencyedgeprojection
  dependencyedgeprojection -->|depends-on| dependencyedge
  dependencyedgeprojection -.->|uses| dependencyedge
  dependencyedgeprojection -->|depends-on| dependencyedgeset
  dependencyedgeprojection -.->|uses| dependencyedgeset
  dependencyedgeprojection -->|depends-on| patternrelationsfragmentcontracts
  dependencyedgeprojection -.->|uses| patternrelationsfragmentcontracts
  dependencyedgeprojection -->|depends-on| patternrelationsprojectionsupport
  dependencyedgeprojection -.->|uses| patternrelationsprojectionsupport
  dependencyedgeset ==>|enables| dependencyedgeprojection
  dependencytree ==>|enables| dependencytreeprojection
  dependencytreeprojection -->|depends-on| dependencytree
  dependencytreeprojection -.->|uses| dependencytree
  dependencytreeprojection -->|depends-on| patternrelationsfragmentcontracts
  dependencytreeprojection -.->|uses| patternrelationsfragmentcontracts
  dependencytreeprojection -->|depends-on| patternrelationsprojectionsupport
  dependencytreeprojection -.->|uses| patternrelationsprojectionsupport
  deriveprocessstate ==>|enables| detectchanges
  deriveprocessstate -->|depends-on| fsmvalidator
  deriveprocessstate -.->|uses| fsmvalidator
  deriveprocessstate ==>|enables| processguarddecider
  deriveprocessstate ==>|enables| processguardlinter
  deriveprocessstate -->|depends-on| sessionstatereader
  deriveprocessstate -.->|uses| sessionstatereader
  detectchanges -->|depends-on| deriveprocessstate
  detectchanges -.->|uses| deriveprocessstate
  detectchanges ==>|enables| processguarddecider
  detectchanges ==>|enables| processguardlinter
  docextractor ==>|enables| buildpipeline
  docextractor ==>|enables| validatepatternscli
  documentationbundle -->|depends-on| documentationcompositionprojectionsupport
  documentationbundle -.->|uses| documentationcompositionprojectionsupport
  documentationbundle -->|depends-on| projectionfragmentcontracts
  documentationbundle -.->|uses| projectionfragmentcontracts
  documentationcompositionprojectionsupport -->|depends-on| architecturediagram
  documentationcompositionprojectionsupport -.->|uses| architecturediagram
  documentationcompositionprojectionsupport ==>|enables| architecturediagramprojection
  documentationcompositionprojectionsupport ==>|enables| documentationbundle
  documentationcompositionprojectionsupport -->|depends-on| prchangereview
  documentationcompositionprojectionsupport -.->|uses| prchangereview
  documentationcompositionprojectionsupport ==>|enables| prchangereviewprojection
  documentationcompositionprojectionsupport ==>|enables| projectconfigprojection
  documentationcompositionprojectionsupport -->|depends-on| projectconfigsnapshot
  documentationcompositionprojectionsupport -.->|uses| projectconfigsnapshot
  documentationcompositionsupporting -->|depends-on| blockschema
  documentationcompositionsupporting -.->|uses| blockschema
  dodvalidationtypes ==>|enables| antipatterndetector
  dodvalidationtypes ==>|enables| dodvalidator
  dodvalidator -->|depends-on| dodvalidationtypes
  dodvalidator -.->|uses| dodvalidationtypes
  dodvalidator -->|depends-on| patterngraph
  dodvalidator -.->|uses| patterngraph
  errorfactorytypes ==>|enables| clierrorhandler
  executioncontextprojectionsupport ==>|enables| deliverableprojection
  executioncontextprojectionsupport ==>|enables| filereadinglistprojection
  executioncontextprojectionsupport ==>|enables| handoffprojection
  executioncontextprojectionsupport -->|depends-on| projectionfragmentcontracts
  executioncontextprojectionsupport -.->|uses| projectionfragmentcontracts
  executioncontextprojectionsupport ==>|enables| scopereadinessprojection
  executioncontextprojectionsupport ==>|enables| sessioncontextprojection
  extractiondiagnostics ==>|enables| buildpipeline
  filereadinglistprojection -->|depends-on| executioncontextprojectionsupport
  filereadinglistprojection -.->|uses| executioncontextprojectionsupport
  filereadinglistprojection -->|depends-on| projectionfragmentcontracts
  filereadinglistprojection -.->|uses| projectionfragmentcontracts
  fragmentrendererdispatch ==>|enables| compacttextrenderer
  fragmentrendererdispatch ==>|enables| markdownrenderer
  fragmentrendererdispatch -->|depends-on| projectionfragmentschema
  fragmentrendererdispatch -.->|uses| projectionfragmentschema
  fragmentrendererdispatch ==>|enables| uirenderer
  fsmstates ==>|enables| fsmvalidator
  fsmtransitions ==>|enables| fsmvalidator
  fsmvalidator ==>|enables| deriveprocessstate
  fsmvalidator -->|depends-on| fsmstates
  fsmvalidator -.->|uses| fsmstates
  fsmvalidator -->|depends-on| fsmtransitions
  fsmvalidator -.->|uses| fsmtransitions
  fsmvalidator ==>|enables| processguarddecider
  fsmvalidator ==>|enables| processguardlinter
  fsmvalidator ==>|enables| processguardtypes
  gherkinexternalrelationshiptagpropagation -. see-also .- gherkinrulessupport
  gherkinextractor ==>|enables| buildpipeline
  gherkinextractor ==>|enables| validatepatternscli
  gherkinscanner ==>|enables| buildpipeline
  gherkinscanner ==>|enables| sessionstatereader
  gherkinscanner ==>|enables| validatepatternscli
  gitbranchdiff ==>|enables| gitmodule
  githelpers ==>|enables| gitmodule
  gitmodule -->|depends-on| gitbranchdiff
  gitmodule -.->|uses| gitbranchdiff
  gitmodule -->|depends-on| githelpers
  gitmodule -.->|uses| githelpers
  governanceprojectionsupport ==>|enables| businessrulesprojection
  governanceprojectionsupport ==>|enables| decisioncatalogprojection
  governanceprojectionsupport -->|depends-on| projectionfragmentcontracts
  governanceprojectionsupport -.->|uses| projectionfragmentcontracts
  governanceprojectionsupport ==>|enables| taxonomydigestprojection
  governanceprojectionsupport ==>|enables| validationruledigestprojection
  governancesupporting ==>|enables| businessrulesprojection
  governancesupporting ==>|enables| taxonomydigestprojection
  handoffprojection -->|depends-on| executioncontextprojectionsupport
  handoffprojection -.->|uses| executioncontextprojectionsupport
  handoffprojection -->|depends-on| projectionfragmentcontracts
  handoffprojection -.->|uses| projectionfragmentcontracts
  jsonrenderer -->|depends-on| projectionfragmentschema
  jsonrenderer -.->|uses| projectionfragmentschema
  lintengine -->|depends-on| codecutils
  lintengine -.->|uses| codecutils
  lintengine ==>|enables| lintmodule
  lintengine ==>|enables| lintpatternscli
  lintengine -->|depends-on| lintrules
  lintengine -.->|uses| lintrules
  lintmodule -->|depends-on| lintengine
  lintmodule -.->|uses| lintengine
  lintmodule -->|depends-on| lintrules
  lintmodule -.->|uses| lintrules
  lintpatternscli -->|depends-on| lintengine
  lintpatternscli -.->|uses| lintengine
  lintpatternscli -->|depends-on| lintrules
  lintpatternscli -.->|uses| lintrules
  lintpatternscli -->|depends-on| patternscanner
  lintpatternscli -.->|uses| patternscanner
  lintprocesscli -->|depends-on| processguardlinter
  lintprocesscli -.->|uses| processguardlinter
  lintrules ==>|enables| lintengine
  lintrules ==>|enables| lintmodule
  lintrules ==>|enables| lintpatternscli
  markdownrenderer -->|depends-on| blockschema
  markdownrenderer -.->|uses| blockschema
  markdownrenderer -->|depends-on| fragmentrendererdispatch
  markdownrenderer -.->|uses| fragmentrendererdispatch
  markdownrenderer -->|depends-on| projectionfragmentschema
  markdownrenderer -.->|uses| projectionfragmentschema
  mcpfilewatcher -->|depends-on| mcppipelinesession
  mcpfilewatcher ==>|enables| mcppipelinesession
  mcpfilewatcher -.->|uses| mcppipelinesession
  mcpfilewatcher ==>|enables| mcpserver
  mcppipelinesession -->|depends-on| mcpfilewatcher
  mcppipelinesession ==>|enables| mcpfilewatcher
  mcppipelinesession -.->|uses| mcpfilewatcher
  mcppipelinesession ==>|enables| mcpserver
  mcppipelinesession -->|depends-on| mcptoolregistry
  mcppipelinesession ==>|enables| mcptoolregistry
  mcppipelinesession -.->|uses| mcptoolregistry
  mcpserver -->|depends-on| mcpfilewatcher
  mcpserver -.->|uses| mcpfilewatcher
  mcpserver -->|depends-on| mcppipelinesession
  mcpserver -.->|uses| mcppipelinesession
  mcpserver ==>|enables| mcpserverbin
  mcpserver -->|depends-on| mcptoolregistry
  mcpserver -.->|uses| mcptoolregistry
  mcpserverbin -->|depends-on| mcpserver
  mcpserverbin -.->|uses| mcpserver
  mcptoolregistry -->|depends-on| mcppipelinesession
  mcptoolregistry ==>|enables| mcppipelinesession
  mcptoolregistry -.->|uses| mcppipelinesession
  mcptoolregistry ==>|enables| mcpserver
  openquestionlistprojection -->|depends-on| patternrelationsfragmentcontracts
  openquestionlistprojection -.->|uses| patternrelationsfragmentcontracts
  openquestionlistprojection -->|depends-on| patternrelationsprojectionsupport
  openquestionlistprojection -.->|uses| patternrelationsprojectionsupport
  operationalinsightsprojectionsupport ==>|enables| annotationcoverageprojection
  operationalinsightsprojectionsupport -->|depends-on| businessrulereference
  operationalinsightsprojectionsupport -.->|uses| businessrulereference
  operationalinsightsprojectionsupport ==>|enables| overviewprojection
  operationalinsightsprojectionsupport -->|depends-on| projectionfragmentcontracts
  operationalinsightsprojectionsupport -.->|uses| projectionfragmentcontracts
  operationalinsightsprojectionsupport ==>|enables| requirementdigestprojection
  operationalinsightsprojectionsupport ==>|enables| requirementexecutabledigestprojection
  operationalinsightsprojectionsupport ==>|enables| requirementspecsdigestprojection
  operationalinsightsprojectionsupport ==>|enables| roleprofileprojection
  operationalinsightsprojectionsupport ==>|enables| sourceinventoryprojection
  operationalinsightsprojectionsupport ==>|enables| tagusageprojection
  operationalinsightssupporting -->|depends-on| blockschema
  operationalinsightssupporting -.->|uses| blockschema
  orphanpatternlist ==>|enables| orphanpatternlistprojection
  orphanpatternlistprojection -->|depends-on| orphanpatternlist
  orphanpatternlistprojection -.->|uses| orphanpatternlist
  orphanpatternlistprojection -->|depends-on| patternrelationsfragmentcontracts
  orphanpatternlistprojection -.->|uses| patternrelationsfragmentcontracts
  orphanpatternlistprojection -->|depends-on| patternrelationsprojectionsupport
  orphanpatternlistprojection -.->|uses| patternrelationsprojectionsupport
  overviewdigest ==>|enables| overviewprojection
  overviewprojection -->|depends-on| operationalinsightsprojectionsupport
  overviewprojection -.->|uses| operationalinsightsprojectionsupport
  overviewprojection -->|depends-on| overviewdigest
  overviewprojection -.->|uses| overviewdigest
  patternbundleprojection -->|depends-on| patternrelationsfragmentcontracts
  patternbundleprojection -.->|uses| patternrelationsfragmentcontracts
  patternbundleprojection -->|depends-on| patternrelationsprojectionsupport
  patternbundleprojection -.->|uses| patternrelationsprojectionsupport
  patterncatalog ==>|enables| patterncatalogprojection
  patterncatalogprojection -->|depends-on| patterncatalog
  patterncatalogprojection -.->|uses| patterncatalog
  patterncatalogprojection -->|depends-on| patternrelationsfragmentcontracts
  patterncatalogprojection -.->|uses| patternrelationsfragmentcontracts
  patterncatalogprojection -->|depends-on| patternrelationsprojectionsupport
  patterncatalogprojection -.->|uses| patternrelationsprojectionsupport
  patterndetail ==>|enables| patterndetailprojection
  patterndetailprojection -->|depends-on| patterndetail
  patterndetailprojection -.->|uses| patterndetail
  patterndetailprojection -->|depends-on| patternrelationsfragmentcontracts
  patterndetailprojection -.->|uses| patternrelationsfragmentcontracts
  patterndetailprojection -->|depends-on| patternrelationsprojectionsupport
  patterndetailprojection -.->|uses| patternrelationsprojectionsupport
  patterngraph ==>|enables| buildpipeline
  patterngraph ==>|enables| dodvalidator
  patterngraph ==>|enables| validatepatternscli
  patterngraphcli -->|depends-on| cliruntimepaths
  patterngraphcli -.->|uses| cliruntimepaths
  patterngraphcli -->|depends-on| cliversionhelper
  patterngraphcli -.->|uses| cliversionhelper
  patternrelationsfragmentcontracts ==>|enables| architecturecomparisonprojection
  patternrelationsfragmentcontracts ==>|enables| architectureneighborhoodprojection
  patternrelationsfragmentcontracts ==>|enables| dependencyedgeprojection
  patternrelationsfragmentcontracts ==>|enables| dependencytreeprojection
  patternrelationsfragmentcontracts ==>|enables| openquestionlistprojection
  patternrelationsfragmentcontracts ==>|enables| orphanpatternlistprojection
  patternrelationsfragmentcontracts ==>|enables| patternbundleprojection
  patternrelationsfragmentcontracts ==>|enables| patterncatalogprojection
  patternrelationsfragmentcontracts ==>|enables| patterndetailprojection
  patternrelationsfragmentcontracts ==>|enables| patternrelationsprojectionsupport
  patternrelationsfragmentcontracts ==>|enables| patternsummaryprojection
  patternrelationsprojectionsupport ==>|enables| architecturecomparisonprojection
  patternrelationsprojectionsupport ==>|enables| architectureneighborhoodprojection
  patternrelationsprojectionsupport ==>|enables| boundedcontextprojection
  patternrelationsprojectionsupport ==>|enables| dependencyedgeprojection
  patternrelationsprojectionsupport ==>|enables| dependencytreeprojection
  patternrelationsprojectionsupport ==>|enables| openquestionlistprojection
  patternrelationsprojectionsupport ==>|enables| orphanpatternlistprojection
  patternrelationsprojectionsupport ==>|enables| patternbundleprojection
  patternrelationsprojectionsupport ==>|enables| patterncatalogprojection
  patternrelationsprojectionsupport ==>|enables| patterndetailprojection
  patternrelationsprojectionsupport -->|depends-on| patternrelationsfragmentcontracts
  patternrelationsprojectionsupport -.->|uses| patternrelationsfragmentcontracts
  patternrelationsprojectionsupport ==>|enables| patternsummaryprojection
  patternrelationssupporting -->|depends-on| deliverable
  patternrelationssupporting -.->|uses| deliverable
  patternrelationssupporting -->|depends-on| deliverablemanifest
  patternrelationssupporting -.->|uses| deliverablemanifest
  patternscanner ==>|enables| buildpipeline
  patternscanner ==>|enables| lintpatternscli
  patternscanner ==>|enables| validatepatternscli
  patternsummary ==>|enables| deliveryreportingsupporting
  patternsummary ==>|enables| patternsummaryprojection
  patternsummaryprojection -->|depends-on| patternrelationsfragmentcontracts
  patternsummaryprojection -.->|uses| patternrelationsfragmentcontracts
  patternsummaryprojection -->|depends-on| patternrelationsprojectionsupport
  patternsummaryprojection -.->|uses| patternrelationsprojectionsupport
  patternsummaryprojection -->|depends-on| patternsummary
  patternsummaryprojection -.->|uses| patternsummary
  pdr005processguardfsm -->|depends-on| adr001taxonomycanonicalvalues
  pdr005processguardfsm -.->|uses| adr001taxonomycanonicalvalues
  pdr005processguardfsm ==>|enables| adr007coordinatedtaxonomyredesign
  phaseprogress ==>|enables| phaseprogressprojection
  phaseprogressprojection -->|depends-on| deliveryreportingprojectionsupport
  phaseprogressprojection -.->|uses| deliveryreportingprojectionsupport
  phaseprogressprojection -->|depends-on| phaseprogress
  phaseprogressprojection -.->|uses| phaseprogress
  prchangereview -->|depends-on| blockschema
  prchangereview -.->|uses| blockschema
  prchangereview ==>|enables| documentationcompositionprojectionsupport
  prchangereviewprojection -->|depends-on| documentationcompositionprojectionsupport
  prchangereviewprojection -.->|uses| documentationcompositionprojectionsupport
  prchangereviewprojection -->|depends-on| projectionfragmentcontracts
  prchangereviewprojection -.->|uses| projectionfragmentcontracts
  processguarddecider -->|depends-on| deriveprocessstate
  processguarddecider -.->|uses| deriveprocessstate
  processguarddecider -->|depends-on| detectchanges
  processguarddecider -.->|uses| detectchanges
  processguarddecider -->|depends-on| fsmvalidator
  processguarddecider -.->|uses| fsmvalidator
  processguarddecider ==>|enables| processguardlinter
  processguardlinter -->|depends-on| deriveprocessstate
  processguardlinter -.->|uses| deriveprocessstate
  processguardlinter -->|depends-on| detectchanges
  processguardlinter -.->|uses| detectchanges
  processguardlinter -->|depends-on| fsmvalidator
  processguardlinter -.->|uses| fsmvalidator
  processguardlinter ==>|enables| lintprocesscli
  processguardlinter -->|depends-on| processguarddecider
  processguardlinter -.->|uses| processguarddecider
  processguardtypes -->|depends-on| fsmvalidator
  processguardtypes -.->|uses| fsmvalidator
  projectconfigprojection -->|depends-on| documentationcompositionprojectionsupport
  projectconfigprojection -.->|uses| documentationcompositionprojectionsupport
  projectconfigprojection -->|depends-on| projectionfragmentcontracts
  projectconfigprojection -.->|uses| projectionfragmentcontracts
  projectconfigsnapshot ==>|enables| documentationcompositionprojectionsupport
  projectionfragmentcontracts ==>|enables| architecturediagramprojection
  projectionfragmentcontracts ==>|enables| businessrulesprojection
  projectionfragmentcontracts ==>|enables| decisioncatalogprojection
  projectionfragmentcontracts ==>|enables| deliverableprojection
  projectionfragmentcontracts ==>|enables| documentationbundle
  projectionfragmentcontracts ==>|enables| executioncontextprojectionsupport
  projectionfragmentcontracts ==>|enables| filereadinglistprojection
  projectionfragmentcontracts ==>|enables| governanceprojectionsupport
  projectionfragmentcontracts ==>|enables| handoffprojection
  projectionfragmentcontracts ==>|enables| operationalinsightsprojectionsupport
  projectionfragmentcontracts ==>|enables| prchangereviewprojection
  projectionfragmentcontracts ==>|enables| projectconfigprojection
  projectionfragmentcontracts ==>|enables| scopereadinessprojection
  projectionfragmentcontracts ==>|enables| sessioncontextprojection
  projectionfragmentcontracts ==>|enables| taxonomydigestprojection
  projectionfragmentcontracts ==>|enables| validationruledigestprojection
  projectionfragmentschema ==>|enables| compacttextrenderer
  projectionfragmentschema ==>|enables| fragmentrendererdispatch
  projectionfragmentschema ==>|enables| jsonrenderer
  projectionfragmentschema ==>|enables| markdownrenderer
  projectionfragmentschema ==>|enables| uirenderer
  releasenotesdigest ==>|enables| releasenotesprojection
  releasenotesprojection -->|depends-on| deliveryreportingprojectionsupport
  releasenotesprojection -.->|uses| deliveryreportingprojectionsupport
  releasenotesprojection -->|depends-on| releasenotesdigest
  releasenotesprojection -.->|uses| releasenotesdigest
  requirementdigest ==>|enables| requirementdigestprojection
  requirementdigest ==>|enables| requirementexecutabledigestprojection
  requirementdigest ==>|enables| requirementspecsdigestprojection
  requirementdigestprojection -->|depends-on| operationalinsightsprojectionsupport
  requirementdigestprojection -.->|uses| operationalinsightsprojectionsupport
  requirementdigestprojection -->|depends-on| requirementdigest
  requirementdigestprojection -.->|uses| requirementdigest
  requirementexecutabledigestprojection -->|depends-on| operationalinsightsprojectionsupport
  requirementexecutabledigestprojection -.->|uses| operationalinsightsprojectionsupport
  requirementexecutabledigestprojection -->|depends-on| requirementdigest
  requirementexecutabledigestprojection -.->|uses| requirementdigest
  requirementspecsdigestprojection -->|depends-on| operationalinsightsprojectionsupport
  requirementspecsdigestprojection -.->|uses| operationalinsightsprojectionsupport
  requirementspecsdigestprojection -->|depends-on| requirementdigest
  requirementspecsdigestprojection -.->|uses| requirementdigest
  roadmaptimeline ==>|enables| roadmaptimelineprojection
  roadmaptimelineprojection -->|depends-on| deliveryreportingprojectionsupport
  roadmaptimelineprojection -.->|uses| deliveryreportingprojectionsupport
  roadmaptimelineprojection -->|depends-on| roadmaptimeline
  roadmaptimelineprojection -.->|uses| roadmaptimeline
  roleprofile ==>|enables| roleprofileprojection
  roleprofilecollection ==>|enables| roleprofileprojection
  roleprofileprojection -->|depends-on| operationalinsightsprojectionsupport
  roleprofileprojection -.->|uses| operationalinsightsprojectionsupport
  roleprofileprojection -->|depends-on| roleprofile
  roleprofileprojection -.->|uses| roleprofile
  roleprofileprojection -->|depends-on| roleprofilecollection
  roleprofileprojection -.->|uses| roleprofilecollection
  scopereadinessprojection -->|depends-on| executioncontextprojectionsupport
  scopereadinessprojection -.->|uses| executioncontextprojectionsupport
  scopereadinessprojection -->|depends-on| projectionfragmentcontracts
  scopereadinessprojection -.->|uses| projectionfragmentcontracts
  sessioncontextprojection -->|depends-on| executioncontextprojectionsupport
  sessioncontextprojection -.->|uses| executioncontextprojectionsupport
  sessioncontextprojection -->|depends-on| projectionfragmentcontracts
  sessioncontextprojection -.->|uses| projectionfragmentcontracts
  sessionstatereader ==>|enables| deriveprocessstate
  sessionstatereader -->|depends-on| gherkinscanner
  sessionstatereader -.->|uses| gherkinscanner
  sourceinventorydigest -->|depends-on| sourceinventoryentry
  sourceinventorydigest -.->|uses| sourceinventoryentry
  sourceinventorydigest ==>|enables| sourceinventoryprojection
  sourceinventoryentry ==>|enables| sourceinventorydigest
  sourceinventoryprojection -->|depends-on| operationalinsightsprojectionsupport
  sourceinventoryprojection -.->|uses| operationalinsightsprojectionsupport
  sourceinventoryprojection -->|depends-on| sourceinventorydigest
  sourceinventoryprojection -.->|uses| sourceinventorydigest
  statusdistribution ==>|enables| statusdistributionprojection
  statusdistributionprojection -->|depends-on| deliveryreportingprojectionsupport
  statusdistributionprojection -.->|uses| deliveryreportingprojectionsupport
  statusdistributionprojection -->|depends-on| statusdistribution
  statusdistributionprojection -.->|uses| statusdistribution
  tagusageentry ==>|enables| tagusagematrix
  tagusagematrix -->|depends-on| tagusageentry
  tagusagematrix -.->|uses| tagusageentry
  tagusagematrix ==>|enables| tagusageprojection
  tagusageprojection -->|depends-on| operationalinsightsprojectionsupport
  tagusageprojection -.->|uses| operationalinsightsprojectionsupport
  tagusageprojection -->|depends-on| tagusagematrix
  tagusageprojection -.->|uses| tagusagematrix
  taxonomydigest ==>|enables| taxonomydigestprojection
  taxonomydigestprojection -->|depends-on| governanceprojectionsupport
  taxonomydigestprojection -.->|uses| governanceprojectionsupport
  taxonomydigestprojection -->|depends-on| governancesupporting
  taxonomydigestprojection -.->|uses| governancesupporting
  taxonomydigestprojection -->|depends-on| projectionfragmentcontracts
  taxonomydigestprojection -.->|uses| projectionfragmentcontracts
  taxonomydigestprojection -->|depends-on| taxonomydigest
  taxonomydigestprojection -.->|uses| taxonomydigest
  traceabilitymatrix ==>|enables| traceabilitymatrixprojection
  traceabilitymatrixprojection -->|depends-on| deliveryreportingprojectionsupport
  traceabilitymatrixprojection -.->|uses| deliveryreportingprojectionsupport
  traceabilitymatrixprojection -->|depends-on| traceabilitymatrix
  traceabilitymatrixprojection -.->|uses| traceabilitymatrix
  uirenderer -->|depends-on| blockschema
  uirenderer -.->|uses| blockschema
  uirenderer -->|depends-on| fragmentrendererdispatch
  uirenderer -.->|uses| fragmentrendererdispatch
  uirenderer -->|depends-on| projectionfragmentschema
  uirenderer -.->|uses| projectionfragmentschema
  validatepatternscli -->|depends-on| codecutils
  validatepatternscli -.->|uses| codecutils
  validatepatternscli -->|depends-on| docextractor
  validatepatternscli -.->|uses| docextractor
  validatepatternscli -->|depends-on| gherkinextractor
  validatepatternscli -.->|uses| gherkinextractor
  validatepatternscli -->|depends-on| gherkinscanner
  validatepatternscli -.->|uses| gherkinscanner
  validatepatternscli -->|depends-on| patterngraph
  validatepatternscli -.->|uses| patterngraph
  validatepatternscli -->|depends-on| patternscanner
  validatepatternscli -.->|uses| patternscanner
  validationruledigest ==>|enables| validationruledigestprojection
  validationruledigestprojection -->|depends-on| governanceprojectionsupport
  validationruledigestprojection -.->|uses| governanceprojectionsupport
  validationruledigestprojection -->|depends-on| projectionfragmentcontracts
  validationruledigestprojection -.->|uses| projectionfragmentcontracts
  validationruledigestprojection -->|depends-on| validationruledigest
  validationruledigestprojection -.->|uses| validationruledigest
  validatorreadmodelconsolidation -->|depends-on| adr006singlereadmodelarchitecture
  validatorreadmodelconsolidation -.->|uses| adr006singlereadmodelarchitecture
  valueformatcanonicalvaluesdispatch -. see-also .- canonicalvaluessync
```

## Legend

### Legend

- Solid arrow = dependency
- Dashed arrow = usage
- Bold arrow = enablement
- Dotted line = reference

## Patterns

- ADR001TaxonomyCanonicalValues
- ADR002GherkinOnlyTesting
- ADR003SourceFirstPatternArchitecture
- ADR005CodecBasedMarkdownRendering
- ADR006SingleReadModelArchitecture
- ADR007CoordinatedTaxonomyRedesign
- ADR008StepDefinitionStubsConvention
- ADR009ProjectionTrustBoundary
- AnnotationCoverage
- AnnotationCoverageProjection
- AntiPatternDetector
- ArchitectPublicContract
- ArchitectureComparison
- ArchitectureComparisonProjection
- ArchitectureDiagram
- ArchitectureDiagramProjection
- ArchitectureInspection
- ArchitectureNavigationProjectionExecutableTests
- ArchitectureNeighborhood
- ArchitectureNeighborhoodProjection
- AstParser
- BlockSchema
- BoundedContextFragmentContract
- BoundedContextProjection
- BuildPipeline
- BusinessRule
- BusinessRuleReference
- BusinessRuleSet
- BusinessRulesProjection
- BusinessRulesProjectionExecutableTests
- CanonicalValuesSync
- CLIErrorHandler
- CLIRuntimePaths
- CLIVersionHelper
- CodecUtils
- CodecUtilsValidation
- CompactTextRenderer
- CompactTextRendererTests
- ConfigBasedWorkflowDefinition
- ConfigLoader
- ConfigResolution
- ConfigurationAPI
- CrossPackageEdgeClassification
- DataAPICLIErgonomics
- DataAPIOutputShaping
- DecisionCatalog
- DecisionCatalogProjection
- DecisionCatalogProjectionExecutableTests
- DecisionRecord
- DefineConfig
- DefineConfigExecutableTests
- Deliverable
- DeliverableManifest
- DeliverableProjection
- DeliveryProgressProjectionExecutableTests
- DeliveryReportingFragmentContracts
- DeliveryReportingProjectionSupport
- DeliveryReportingProjectionSupportExecutableTests
- DeliveryReportingSupporting
- DependencyEdge
- DependencyEdgeProjection
- DependencyEdgeProjectionExecutableTests
- DependencyEdgeSet
- DependencyTree
- DependencyTreeProjection
- DependencyTreeProjectionExecutableTests
- DeriveProcessState
- DetectChanges
- DocExtractor
- DocStringMediaType
- DocumentationBundle
- DocumentationCommandParityBoundaryTests
- DocumentationCompositionProjectionExecutableTests
- DocumentationCompositionProjectionSupport
- DocumentationCompositionSupporting
- DoDValidationTypes
- DoDValidator
- DualSourceExtractor
- DualSourceMergeIntegration
- ErrorFactories
- ErrorFactoryTypes
- ExecutionContextProjectionExecutableTests
- ExecutionContextProjectionSupport
- ExecutionContextSupporting
- ExtractionDiagnostics
- FileDiscovery
- FileReadingList
- FileReadingListProjection
- FragmentRendererDispatch
- FSMStates
- FSMTransitions
- FSMValidator
- GenerateDocsCli
- GherkinAstParser
- GherkinExternalRelationshipTagPropagation
- GherkinExtractor
- GherkinRulesSupport
- GherkinScanner
- GitBranchDiff
- GitHelpers
- GitModule
- GitNameStatusParser
- GovernanceProjectionSupport
- GovernanceSupporting
- GovernanceValidationTaxonomyProjectionExecutableTests
- GraphInventory
- HandoffProjection
- HandoffRecord
- JsonRenderer
- LayerInference
- LintEngine
- LintModule
- LintPatternsCLI
- LintPatternsCliBehavior
- LintProcessCLI
- LintProcessCliBehavior
- LintRules
- LoadPreambleParser
- MarkdownRenderer
- MCPFileWatcher
- MCPPipelineSession
- MCPRuntimeHardeningExecutableTests
- MCPServer
- MCPServerBin
- MCPServerLifecycleExecutableTests
- MCPToolInputValidationExecutableTests
- MCPToolRegistry
- MCPToolRegistryBoundaryTests
- MCPToolRegistryIntegrationTests
- OpenQuestionListProjection
- OpenQuestionListProjectionExecutableTests
- OperationalInsightsProjectionExecutableTests
- OperationalInsightsProjectionSupport
- OperationalInsightsSupporting
- OrphanPatternList
- OrphanPatternListProjection
- OverviewDigest
- OverviewProjection
- PackageResolver
- PackageResolverExecutableTests
- PatternBundleProjection
- PatternBundleProjectionExecutableTests
- PatternCatalog
- PatternCatalogProjection
- PatternClassification
- PatternDetail
- PatternDetailProjection
- PatternDetailProjectionExecutableTests
- PatternGraph
- PatternGraphApi
- PatternGraphAPICLI
- PatternGraphApiReverseLookup
- PatternGraphCLI
- PatternGraphCliArchHealth
- PatternGraphCliCache
- PatternGraphCliDryRun
- PatternGraphCliMetadata
- PatternGraphCliOutputModifiers
- PatternGraphCliRepl
- PatternGraphCliRulesSubcommand
- PatternGraphCliSubcommands
- PatternHelpers
- PatternReferenceValidation
- PatternRelationsFragmentContracts
- PatternRelationsProjectionSupport
- PatternRelationsSupporting
- PatternScanner
- PatternSummary
- PatternSummaryCatalogProjectionExecutableTests
- PatternSummaryProjection
- PDR005ProcessGuardFSM
- PhaseProgress
- PhaseProgressProjection
- PrChangeReview
- PrChangeReviewProjection
- ProcessGuardDecider
- ProcessGuardLinter
- ProcessGuardRulesExecutableTests
- ProcessGuardTypes
- ProjectConfigLoader
- ProjectConfigProjection
- ProjectConfigSnapshot
- ProjectionFragmentContracts
- ProjectionFragmentSchema
- ReleaseNotesDigest
- ReleaseNotesProjection
- ReleaseNotesProjectionExecutableTests
- RequirementDigest
- RequirementDigestProjection
- RequirementExecutableDigestProjection
- RequirementSpecsDigestProjection
- ResultMonad
- ResultMonadTypes
- RoadmapTimeline
- RoadmapTimelineProjection
- RoleProfile
- RoleProfileCollection
- RoleProfileProjection
- ScannerCore
- ScopeReadinessCheck
- ScopeReadinessProjection
- ScopeReadinessReport
- SessionContextBundle
- SessionContextProjection
- SessionStateReader
- ShapeExtraction
- ShapeExtractor
- SourceInventoryDigest
- SourceInventoryEntry
- SourceInventoryProjection
- SourceMerging
- StatusDistribution
- StatusDistributionProjection
- StubTaxonomyTagTests
- TagRegistrySchemasValidation
- TagUsageEntry
- TagUsageMatrix
- TagUsageProjection
- TaxonomyDigest
- TaxonomyDigestProjection
- TraceabilityMatrix
- TraceabilityMatrixProjection
- TraceabilityMatrixProjectionExecutableTests
- TypeScriptTaxonomyImplementation
- UiRenderer
- ValidatePatternsCLI
- ValidationModule
- ValidationRuleDigest
- ValidationRuleDigestProjection
- ValidatorReadModelConsolidation
- ValueFormatCanonicalValuesDispatch
- WorkflowConfigSchemasValidation
