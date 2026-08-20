# Design Review

**Purpose:** Component diagrams over the live pattern graph — including not-yet-implemented specs — so a planned pattern's shape is reviewable before implementation.
**Detail Level:** Working-state-inclusive context map plus per-lens component diagrams

---

## Overview

This view captures 268 patterns across 25 diagrams in the Component view.

## Related views

- [By Layer](design-review/by-layer.md)
- [By Package](design-review/by-package.md)
- [By Theme](design-review/by-theme.md)

## Diagrams

### Context Map

Each node is a group; each arrow is a cross-group dependency (`depends-on` / `uses`, pointing from dependant to dependency). The per-group diagrams below detail each group’s internal dependencies and any see-also references.

```mermaid
graph LR
  shared["_shared (4)"]
  api["api (7)"]
  cli["cli (12)"]
  configuration["configuration (11)"]
  delivery_reporting["delivery-reporting (5)"]
  documentation_composition["documentation-composition (13)"]
  domain["domain (9)"]
  execution_context["execution-context (8)"]
  extractor["extractor (7)"]
  generator["generator (4)"]
  governance["governance (10)"]
  lint["lint (4)"]
  operational_insights["operational-insights (10)"]
  pattern_relations["pattern-relations (16)"]
  pipeline["pipeline (6)"]
  process_guard["process-guard (6)"]
  projection["projection (49)"]
  read_api["read-api (8)"]
  rendering["rendering (16)"]
  scanner["scanner (4)"]
  validation["validation (9)"]
  validation_schemas["validation-schemas (11)"]
  role_contract["role: contract (2)"]
  pkg_architect_package_content["Architect Package Content (37)"]
  shared --> projection
  shared --> validation_schemas
  api --> cli
  api --> pipeline
  api --> projection
  api --> read_api
  api --> rendering
  cli --> api
  cli --> configuration
  cli --> lint
  cli --> pipeline
  cli --> read_api
  cli --> role_contract
  cli --> scanner
  cli --> validation_schemas
  configuration --> domain
  configuration --> pipeline
  configuration --> validation_schemas
  delivery_reporting --> execution_context
  delivery_reporting --> pattern_relations
  documentation_composition --> shared
  documentation_composition --> projection
  documentation_composition --> rendering
  extractor --> read_api
  extractor --> scanner
  extractor --> validation_schemas
  governance --> shared
  governance --> projection
  governance --> read_api
  governance --> rendering
  governance --> validation_schemas
  lint --> process_guard
  lint --> validation
  lint --> validation_schemas
  operational_insights --> rendering
  pattern_relations --> shared
  pattern_relations --> domain
  pattern_relations --> execution_context
  pattern_relations --> governance
  pattern_relations --> projection
  pattern_relations --> read_api
  pattern_relations --> rendering
  pipeline --> domain
  pipeline --> extractor
  pipeline --> projection
  pipeline --> read_api
  pipeline --> role_contract
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
  projection --> cli
  projection --> delivery_reporting
  projection --> documentation_composition
  projection --> domain
  projection --> execution_context
  projection --> governance
  projection --> operational_insights
  projection --> pattern_relations
  projection --> rendering
  projection --> validation_schemas
  read_api --> validation_schemas
  rendering --> shared
  rendering --> documentation_composition
  validation --> extractor
  validation --> scanner
  validation --> validation_schemas
  validation_schemas --> domain
```

### Bounded context: \_shared (4 patterns)

```mermaid
graph TD
  architecturegraphsupport["ArchitectureGraphSupport<br/>(service · active)"]
  groupedroutedbundlesupport["GroupedRoutedBundleSupport<br/>(service · active)"]
  projectionfilter["ProjectionFilter<br/>(contract · active)"]
  projectiontrustboundary["ProjectionTrustBoundary<br/>(service · active)"]
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

### Bounded context: cli (12 patterns)

```mermaid
graph TD
  argvhygiene["ArgvHygiene<br/>(utility · completed)"]
  authoredcorebuilder["AuthoredCoreBuilder<br/>(service · completed)"]
  clicontexttypes["CLIContextTypes<br/>(contract · completed)"]
  clierrorhandler["CLIErrorHandler<br/>(utility · completed)"]
  cliruntimepaths["CLIRuntimePaths<br/>(utility · completed)"]
  graphhandle["GraphHandle<br/>(service · completed)"]
  graphhandlecli["GraphHandleCli<br/>(service · completed)"]
  graphhandleshapes["GraphHandleShapes<br/>(contract · completed)"]
  graphhandleviews["GraphHandleViews<br/>(service · completed)"]
  lintpatternscli["LintPatternsCLI<br/>(service · completed)"]
  mcpserverbin["MCPServerBin<br/>(utility · completed)"]
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

### Bounded context: configuration (11 patterns)

```mermaid
graph TD
  architectconfigcontract["ArchitectConfigContract<br/>(contract · active)"]
  configdefaults["ConfigDefaults<br/>(contract · active)"]
  configloader["ConfigLoader<br/>(service · active)"]
  defineconfig["DefineConfig<br/>(utility · active)"]
  packagematchercontract["PackageMatcherContract<br/>(contract · active)"]
  projectconfigcontract["ProjectConfigContract<br/>(contract · active)"]
  projectconfigresolution["ProjectConfigResolution<br/>(service · active)"]
  projectconfigschema["ProjectConfigSchema<br/>(codec · active)"]
  registrybuilder["RegistryBuilder<br/>(utility · active)"]
  sourcemerge["SourceMerge<br/>(utility · active)"]
  tagdirectiveregexbuilders["TagDirectiveRegexBuilders<br/>(utility · completed)"]
  projectconfigcontract -->|depends-on| architectconfigcontract
  projectconfigcontract -->|depends-on| packagematchercontract
  projectconfigresolution -->|depends-on| configdefaults
  projectconfigresolution -->|depends-on| projectconfigcontract
  projectconfigschema -->|depends-on| packagematchercontract
  projectconfigschema -->|depends-on| projectconfigcontract
  tagdirectiveregexbuilders -->|depends-on| architectconfigcontract
```

### Bounded context: delivery-reporting (5 patterns)

```mermaid
graph TD
  deliveryreportingfragmentcontracts["DeliveryReportingFragmentContracts<br/>(contract · active)"]
  deliveryreportingsupporting["DeliveryReportingSupporting<br/>(contract · active)"]
  roadmaptimeline["RoadmapTimeline<br/>(contract · active)"]
  statusdistribution["StatusDistribution<br/>(contract · active)"]
  traceabilitymatrix["TraceabilityMatrix<br/>(contract · active)"]
```

### Bounded context: documentation-composition (13 patterns)

```mermaid
graph TD
  apireferencedigest["ApiReferenceDigest<br/>(contract · active)"]
  apireferenceprojection["ApiReferenceProjection<br/>(projection · active)"]
  architecturediagram["ArchitectureDiagram<br/>(contract · active)"]
  documentationcompositionsupporting["DocumentationCompositionSupporting<br/>(contract · active)"]
  documentationdefinitionregistry["DocumentationDefinitionRegistry<br/>(decider · completed)"]
  documentationtypeidentity["DocumentationTypeIdentity<br/>(contract · active)"]
  emissiondescriptor["EmissionDescriptor<br/>(contract · active)"]
  generatordegeneracyguard["GeneratorDegeneracyGuard<br/>(utility · completed)"]
  managedregionengine["ManagedRegionEngine<br/>(utility · active)"]
  prchangereview["PrChangeReview<br/>(contract · active)"]
  projectconfigsnapshot["ProjectConfigSnapshot<br/>(contract · active)"]
  projectionfilterresolver["ProjectionFilterResolver<br/>(decider · active)"]
  taxonomyembeddedshapesprojection["TaxonomyEmbeddedShapesProjection<br/>(projection · active)"]
  apireferenceprojection -->|depends-on| apireferencedigest
  documentationdefinitionregistry -->|depends-on| apireferenceprojection
  documentationdefinitionregistry -->|depends-on| documentationtypeidentity
  taxonomyembeddedshapesprojection -->|depends-on| emissiondescriptor
```

### Bounded context: domain (9 patterns)

```mermaid
graph TD
  brandedidentifiers["BrandedIdentifiers<br/>(contract · active)"]
  deliverablestatusdomain["DeliverableStatusDomain<br/>(contract · active)"]
  domainenumschemas["DomainEnumSchemas<br/>(contract · active)"]
  formattypedomain["FormatTypeDomain<br/>(contract · active)"]
  hierarchyleveldomain["HierarchyLevelDomain<br/>(contract · completed)"]
  maturityleveldomain["MaturityLevelDomain<br/>(contract · active)"]
  packageresolver["PackageResolver<br/>(utility · active)"]
  statusnormalization["StatusNormalization<br/>(service · active)"]
  statusvaluedomain["StatusValueDomain<br/>(contract · active)"]
  maturityleveldomain -->|depends-on| statusvaluedomain
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

### Bounded context: governance (10 patterns)

```mermaid
graph TD
  businessrule["BusinessRule<br/>(contract · active)"]
  businessrulereference["BusinessRuleReference<br/>(contract · active)"]
  businessruleset["BusinessRuleSet<br/>(contract · active)"]
  businessrulesetassembly["BusinessRuleSetAssembly<br/>(service · completed)"]
  decisioncatalog["DecisionCatalog<br/>(contract · active)"]
  decisionrecord["DecisionRecord<br/>(contract · active)"]
  decisionrecordtemporalhygiene["DecisionRecordTemporalHygiene<br/>(candidate)"]
  governancesupporting["GovernanceSupporting<br/>(contract · active)"]
  taxonomydigest["TaxonomyDigest<br/>(contract · active)"]
  validationruledigest["ValidationRuleDigest<br/>(contract · active)"]
  businessrulesetassembly -->|depends-on| businessrule
  businessrulesetassembly -->|depends-on| businessruleset
  businessrulesetassembly -->|depends-on| governancesupporting
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

### Bounded context: pattern-relations (16 patterns)

```mermaid
graph TD
  architecturecomparison["ArchitectureComparison<br/>(contract · active)"]
  architectureneighborhood["ArchitectureNeighborhood<br/>(contract · active)"]
  boundedcontextfragmentcontract["BoundedContextFragmentContract<br/>(contract · active)"]
  dependencycontext["DependencyContext<br/>(contract · active)"]
  dependencyedge["DependencyEdge<br/>(contract · active)"]
  dependencyedgeset["DependencyEdgeSet<br/>(contract · active)"]
  openquestionlist["OpenQuestionList<br/>(contract · completed)"]
  orphanpatternlist["OrphanPatternList<br/>(contract · active)"]
  patternbundleassembly["PatternBundleAssembly<br/>(service · completed)"]
  patternbundleentry["PatternBundleEntry<br/>(contract · completed)"]
  patterncatalog["PatternCatalog<br/>(contract · active)"]
  patterncatalogassembly["PatternCatalogAssembly<br/>(service · completed)"]
  patterndetail["PatternDetail<br/>(contract · active)"]
  patternrelationsfragmentcontracts["PatternRelationsFragmentContracts<br/>(contract · active)"]
  patternrelationssupporting["PatternRelationsSupporting<br/>(contract · active)"]
  patternsummary["PatternSummary<br/>(contract · active)"]
  patternbundleassembly -->|depends-on| patterncatalogassembly
  patternbundleentry -->|depends-on| patternrelationssupporting
  patternbundleentry -->|depends-on| patternsummary
  patterncatalogassembly -->|depends-on| patterncatalog
```

### Bounded context: pipeline (6 patterns)

```mermaid
graph TD
  buildpipeline["BuildPipeline<br/>(service · completed)"]
  contextinference["ContextInference<br/>(service · active)"]
  patternsourcemerger["PatternSourceMerger<br/>(service · active)"]
  pipelinedatasetcontract["PipelineDatasetContract<br/>(contract · active)"]
  relationshipresolver["RelationshipResolver<br/>(service · active)"]
  transformdataset["TransformDataset<br/>(service · active)"]
  relationshipresolver -->|depends-on| pipelinedatasetcontract
  transformdataset -->|depends-on| contextinference
  transformdataset -->|depends-on| pipelinedatasetcontract
  transformdataset -->|depends-on| relationshipresolver
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

### Bounded context: projection (49 patterns)

```mermaid
graph TD
  annotationcoverageprojection["AnnotationCoverageProjection<br/>(projection · completed)"]
  architecturecomparisonprojection["ArchitectureComparisonProjection<br/>(projection · completed)"]
  architecturediagramprojection["ArchitectureDiagramProjection<br/>(projection · completed)"]
  architecturegraphprojection["ArchitectureGraphProjection<br/>(projection · active)"]
  architectureneighborhoodprojection["ArchitectureNeighborhoodProjection<br/>(projection · completed)"]
  boundedcontextprojection["BoundedContextProjection<br/>(projection · completed)"]
  businessrulesprojection["BusinessRulesProjection<br/>(projection · completed)"]
  changelogprojection["ChangelogProjection<br/>(projection · completed)"]
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
  prchangereviewprojection["PrChangeReviewProjection<br/>(projection · completed)"]
  projectconfigprojection["ProjectConfigProjection<br/>(projection · completed)"]
  projectionbundle["ProjectionBundle<br/>(contract · active)"]
  projectioncontext["ProjectionContext<br/>(contract · active)"]
  projectionerror["ProjectionError<br/>(contract · active)"]
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
  changelogprojection -->|depends-on| deliveryreportingprojectionsupport
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
  prchangereviewprojection -->|depends-on| documentationcompositionprojectionsupport
  projectconfigprojection -->|depends-on| documentationcompositionprojectionsupport
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

### Bounded context: read-api (8 patterns)

```mermaid
graph TD
  architectureinspection["ArchitectureInspection<br/>(utility · active)"]
  decisionresolution["DecisionResolution<br/>(utility · active)"]
  graphinventory["GraphInventory<br/>(utility · active)"]
  patternclassification["PatternClassification<br/>(utility · active)"]
  patterngraphapi["PatternGraphApi<br/>(utility · active)"]
  patternhelpers["PatternHelpers<br/>(utility · active)"]
  readapiresultcontract["ReadApiResultContract<br/>(contract · active)"]
  ruleaggregation["RuleAggregation<br/>(utility · active)"]
  architectureinspection -->|depends-on| patternhelpers
  decisionresolution -->|depends-on| patternhelpers
  graphinventory -->|depends-on| patternhelpers
  patterngraphapi -->|depends-on| patternhelpers
  ruleaggregation -->|depends-on| patternhelpers
```

### Bounded context: rendering (16 patterns)

```mermaid
graph TD
  blockschema["BlockSchema<br/>(contract · active)"]
  compacttextrenderer["CompactTextRenderer<br/>(codec · completed)"]
  deterministicformatutils["DeterministicFormatUtils<br/>(utility · completed)"]
  disclosurespec["DisclosureSpec<br/>(contract · active)"]
  fragmentrendererdispatch["FragmentRendererDispatch<br/>(codec · completed)"]
  jsonrenderer["JsonRenderer<br/>(codec · completed)"]
  logicalrouteid["LogicalRouteId<br/>(contract · active)"]
  markdownblockparser["MarkdownBlockParser<br/>(codec · active)"]
  markdownrenderer["MarkdownRenderer<br/>(codec · completed)"]
  markdownrouteprofile["MarkdownRouteProfile<br/>(service · active)"]
  progressivedisclosurelevel["ProgressiveDisclosureLevel<br/>(contract · active)"]
  projectionfragmentcontracts["ProjectionFragmentContracts<br/>(contract · active)"]
  projectionfragmentschema["ProjectionFragmentSchema<br/>(contract · active)"]
  rendereroptions["RendererOptions<br/>(contract · active)"]
  slugcanonicalization["SlugCanonicalization<br/>(utility · completed)"]
  uirenderer["UiRenderer<br/>(codec · completed)"]
  compacttextrenderer -->|depends-on| fragmentrendererdispatch
  compacttextrenderer -->|depends-on| projectionfragmentschema
  fragmentrendererdispatch -->|depends-on| projectionfragmentschema
  jsonrenderer -->|depends-on| projectionfragmentschema
  markdownrenderer -->|depends-on| blockschema
  markdownrenderer -->|depends-on| fragmentrendererdispatch
  markdownrenderer -->|depends-on| projectionfragmentschema
  markdownrouteprofile -->|depends-on| logicalrouteid
  rendereroptions -->|depends-on| disclosurespec
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

### Bounded context: validation (9 patterns)

```mermaid
graph TD
  antipatterndetector["AntiPatternDetector<br/>(service · completed)"]
  antipatternvalidationtypes["AntiPatternValidationTypes<br/>(contract · completed)"]
  fsmstates["FSMStates<br/>(read-model · active)"]
  fsmtransitions["FSMTransitions<br/>(read-model · active)"]
  fsmvalidator["FSMValidator<br/>(decider · active)"]
  trustboundaryparser["TrustBoundaryParser<br/>(service · active)"]
  validatepatternscli["ValidatePatternsCLI<br/>(service · completed)"]
  validationmodule["ValidationModule<br/>(barrel · completed)"]
  zoderrorboundary["ZodErrorBoundary<br/>(utility · active)"]
  antipatterndetector -->|depends-on| antipatternvalidationtypes
  fsmvalidator -->|depends-on| fsmstates
  fsmvalidator -->|depends-on| fsmtransitions
  validationmodule -->|depends-on| antipatterndetector
  validationmodule -->|depends-on| antipatternvalidationtypes
  zoderrorboundary -->|depends-on| trustboundaryparser
```

### Bounded context: validation-schemas (11 patterns)

```mermaid
graph TD
  codecutils["CodecUtils<br/>(codec · active)"]
  configvalidationschemas["ConfigValidationSchemas<br/>(contract · completed)"]
  docdirectivecontract["DocDirectiveContract<br/>(contract · active)"]
  dualsourceschemas["DualSourceSchemas<br/>(contract · active)"]
  exportinfocontract["ExportInfoContract<br/>(contract · active)"]
  extractedpattern["ExtractedPattern<br/>(contract · active)"]
  gherkinscanresultcontract["GherkinScanResultContract<br/>(contract · active)"]
  lintviolationcontract["LintViolationContract<br/>(contract · active)"]
  patterngraph["PatternGraph<br/>(contract · active)"]
  patternreferencecontract["PatternReferenceContract<br/>(contract · active)"]
  tagregistryschemas["TagRegistrySchemas<br/>(contract · active)"]
  docdirectivecontract -->|depends-on| tagregistryschemas
  patterngraph -->|depends-on| extractedpattern
```

### Uncontextualized · role: contract (2 patterns)

```mermaid
graph TD
  errorfactorytypes["ErrorFactoryTypes<br/>(contract · completed)"]
  resultmonadtypes["ResultMonadTypes<br/>(contract · completed)"]
```

### Unclassified · Architect Package Content (37 patterns)

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
  architecturedelta["ArchitectureDelta<br/>(roadmap)"]
  assistivecodeintelligence["AssistiveCodeIntelligence<br/>(epic · candidate)"]
  codecbehaviorexecutabletests["CodecBehaviorExecutableTests<br/>(roadmap)"]
  documentationprojection["DocumentationProjection<br/>(epic · candidate)"]
  generatorinfrastructureexecutabletests["GeneratorInfrastructureExecutableTests<br/>(roadmap)"]
  goalorientednavigation["GoalOrientedNavigation<br/>(roadmap)"]
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
  documentationprojection -->|depends-on| adr010documentationcompositionhelpers
  goalorientednavigation -. see-also .- adr006singlereadmodelarchitecture
  goalorientednavigation -. see-also .- adr009projectiontrustboundary
  goalorientednavigation -. see-also .- adr010documentationcompositionhelpers
  goalorientednavigation -. see-also .- taxonomydocumentationcluster
  pdr005processguardfsm -->|depends-on| adr001taxonomycanonicalvalues
  pdr006advisoryprocessguardprotection -->|depends-on| adr001taxonomycanonicalvalues
  pdr006advisoryprocessguardprotection -->|depends-on| pdr005processguardfsm
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
