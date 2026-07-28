# Architecture

**Purpose:** Auto-generated architecture diagrams from source annotations
**Detail Level:** Context map plus per-group component diagrams

---

## Overview

This view captures 226 patterns across 24 diagrams in the Component architecture view.

## Related views

- [By Theme](architecture/by-theme.md)
- [Layered](architecture/layered.md)
- [Package Seam](architecture/package-seam.md)

## Diagrams

### Context Map

Each node is a group; each arrow is a cross-group dependency (`depends-on` / `uses`, pointing from dependant to dependency). The per-group diagrams below detail each group’s internal dependencies and any see-also references.

```mermaid
graph LR
  shared["_shared (4)"]
  api["api (4)"]
  cli["cli (13)"]
  configuration["configuration (11)"]
  delivery_reporting["delivery-reporting (5)"]
  documentation_composition["documentation-composition (13)"]
  domain["domain (9)"]
  execution_context["execution-context (8)"]
  extractor["extractor (6)"]
  generator["generator (4)"]
  governance["governance (9)"]
  lint["lint (4)"]
  operational_insights["operational-insights (10)"]
  pattern_relations["pattern-relations (16)"]
  pipeline["pipeline (6)"]
  process_guard["process-guard (6)"]
  projection["projection (48)"]
  read_api["read-api (8)"]
  rendering["rendering (16)"]
  scanner["scanner (4)"]
  validation["validation (9)"]
  validation_schemas["validation-schemas (11)"]
  role_contract["role: contract (2)"]
  shared --> projection
  shared --> validation_schemas
  api --> pipeline
  api --> read_api
  api --> rendering
  cli --> api
  cli --> configuration
  cli --> domain
  cli --> lint
  cli --> pipeline
  cli --> projection
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
  process_guard --> generator
  process_guard --> lint
  process_guard --> scanner
  process_guard --> validation
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
  architecturegraphsupport["ArchitectureGraphSupport<br/>(service)"]
  groupedroutedbundlesupport["GroupedRoutedBundleSupport<br/>(service)"]
  projectionfilter["ProjectionFilter<br/>(contract)"]
  projectiontrustboundary["ProjectionTrustBoundary<br/>(service)"]
```

### Bounded context: api (4 patterns)

```mermaid
graph TD
  mcpfilewatcher["MCPFileWatcher<br/>(utility)"]
  mcppipelinesession["MCPPipelineSession<br/>(service)"]
  mcpserver["MCPServer<br/>(service)"]
  mcptoolregistry["MCPToolRegistry<br/>(service)"]
  mcpfilewatcher -->|depends-on| mcppipelinesession
  mcppipelinesession -->|depends-on| mcpfilewatcher
  mcppipelinesession -->|depends-on| mcptoolregistry
  mcpserver -->|depends-on| mcpfilewatcher
  mcpserver -->|depends-on| mcppipelinesession
  mcpserver -->|depends-on| mcptoolregistry
  mcptoolregistry -->|depends-on| mcppipelinesession
```

### Bounded context: cli (13 patterns)

```mermaid
graph TD
  argvhygiene["ArgvHygiene<br/>(utility)"]
  authoredcorebuilder["AuthoredCoreBuilder<br/>(service)"]
  clicontexttypes["CLIContextTypes<br/>(contract)"]
  clierrorhandler["CLIErrorHandler<br/>(utility)"]
  cliruntimepaths["CLIRuntimePaths<br/>(utility)"]
  cliversionhelper["CLIVersionHelper<br/>(utility)"]
  graphhandle["GraphHandle<br/>(service)"]
  graphhandlecli["GraphHandleCli<br/>(service)"]
  graphhandleshapes["GraphHandleShapes<br/>(contract)"]
  graphhandleviews["GraphHandleViews<br/>(service)"]
  lintpatternscli["LintPatternsCLI<br/>(service)"]
  mcpserverbin["MCPServerBin<br/>(utility)"]
  mechanicalsubstrateextractor["MechanicalSubstrateExtractor<br/>(service)"]
  authoredcorebuilder -->|depends-on| clicontexttypes
  authoredcorebuilder -->|depends-on| graphhandleshapes
  cliversionhelper -->|depends-on| cliruntimepaths
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
  architectconfigcontract["ArchitectConfigContract<br/>(contract)"]
  configdefaults["ConfigDefaults<br/>(contract)"]
  configloader["ConfigLoader<br/>(service)"]
  defineconfig["DefineConfig<br/>(utility)"]
  packagematchercontract["PackageMatcherContract<br/>(contract)"]
  projectconfigcontract["ProjectConfigContract<br/>(contract)"]
  projectconfigresolution["ProjectConfigResolution<br/>(service)"]
  projectconfigschema["ProjectConfigSchema<br/>(codec)"]
  registrybuilder["RegistryBuilder<br/>(utility)"]
  sourcemerge["SourceMerge<br/>(utility)"]
  tagdirectiveregexbuilders["TagDirectiveRegexBuilders<br/>(utility)"]
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
  deliveryreportingfragmentcontracts["DeliveryReportingFragmentContracts<br/>(contract)"]
  deliveryreportingsupporting["DeliveryReportingSupporting<br/>(contract)"]
  roadmaptimeline["RoadmapTimeline<br/>(contract)"]
  statusdistribution["StatusDistribution<br/>(contract)"]
  traceabilitymatrix["TraceabilityMatrix<br/>(contract)"]
```

### Bounded context: documentation-composition (13 patterns)

```mermaid
graph TD
  apireferencedigest["ApiReferenceDigest<br/>(contract)"]
  apireferenceprojection["ApiReferenceProjection<br/>(projection)"]
  architecturediagram["ArchitectureDiagram<br/>(contract)"]
  documentationcompositionsupporting["DocumentationCompositionSupporting<br/>(contract)"]
  documentationdefinitionregistry["DocumentationDefinitionRegistry<br/>(decider)"]
  documentationtypeidentity["DocumentationTypeIdentity<br/>(contract)"]
  emissiondescriptor["EmissionDescriptor<br/>(contract)"]
  generatordegeneracyguard["GeneratorDegeneracyGuard<br/>(utility)"]
  managedregionengine["ManagedRegionEngine<br/>(utility)"]
  prchangereview["PrChangeReview<br/>(contract)"]
  projectconfigsnapshot["ProjectConfigSnapshot<br/>(contract)"]
  projectionfilterresolver["ProjectionFilterResolver<br/>(decider)"]
  taxonomyembeddedshapesprojection["TaxonomyEmbeddedShapesProjection<br/>(projection)"]
  apireferenceprojection -->|depends-on| apireferencedigest
  documentationdefinitionregistry -->|depends-on| apireferenceprojection
  documentationdefinitionregistry -->|depends-on| documentationtypeidentity
  taxonomyembeddedshapesprojection -->|depends-on| emissiondescriptor
```

### Bounded context: domain (9 patterns)

```mermaid
graph TD
  brandedidentifiers["BrandedIdentifiers<br/>(contract)"]
  deliverablestatusdomain["DeliverableStatusDomain<br/>(contract)"]
  domainenumschemas["DomainEnumSchemas<br/>(contract)"]
  formattypedomain["FormatTypeDomain<br/>(contract)"]
  hierarchyleveldomain["HierarchyLevelDomain<br/>(contract)"]
  maturityleveldomain["MaturityLevelDomain<br/>(contract)"]
  packageresolver["PackageResolver<br/>(utility)"]
  statusnormalization["StatusNormalization<br/>(service)"]
  statusvaluedomain["StatusValueDomain<br/>(contract)"]
  maturityleveldomain -->|depends-on| statusvaluedomain
```

### Bounded context: execution-context (8 patterns)

```mermaid
graph TD
  deliverable["Deliverable<br/>(contract)"]
  deliverablemanifest["DeliverableManifest<br/>(contract)"]
  executioncontextsupporting["ExecutionContextSupporting<br/>(contract)"]
  filereadinglist["FileReadingList<br/>(contract)"]
  handoffrecord["HandoffRecord<br/>(contract)"]
  scopereadinesscheck["ScopeReadinessCheck<br/>(contract)"]
  scopereadinessreport["ScopeReadinessReport<br/>(contract)"]
  sessioncontextbundle["SessionContextBundle<br/>(contract)"]
  handoffrecord -->|depends-on| executioncontextsupporting
  scopereadinesscheck -->|depends-on| executioncontextsupporting
  scopereadinessreport -->|depends-on| executioncontextsupporting
  sessioncontextbundle -->|depends-on| executioncontextsupporting
```

### Bounded context: extractor (6 patterns)

```mermaid
graph TD
  docextractor["DocExtractor<br/>(service)"]
  dualsourceextractor["DualSourceExtractor<br/>(service)"]
  extractiondiagnostics["ExtractionDiagnostics<br/>(contract)"]
  gherkinextractor["GherkinExtractor<br/>(service)"]
  layerinference["LayerInference<br/>(service)"]
  shapeextractor["ShapeExtractor<br/>(service)"]
  docextractor -->|depends-on| shapeextractor
  gherkinextractor -->|depends-on| layerinference
```

### Bounded context: generator (4 patterns)

```mermaid
graph TD
  gitbranchdiff["GitBranchDiff<br/>(utility)"]
  githelpers["GitHelpers<br/>(utility)"]
  gitmodule["GitModule<br/>(barrel)"]
  gitnamestatusparser["GitNameStatusParser<br/>(utility)"]
  gitbranchdiff -->|depends-on| gitnamestatusparser
  gitmodule -->|depends-on| gitbranchdiff
  gitmodule -->|depends-on| githelpers
```

### Bounded context: governance (9 patterns)

```mermaid
graph TD
  businessrule["BusinessRule<br/>(contract)"]
  businessrulereference["BusinessRuleReference<br/>(contract)"]
  businessruleset["BusinessRuleSet<br/>(contract)"]
  businessrulesetassembly["BusinessRuleSetAssembly<br/>(service)"]
  decisioncatalog["DecisionCatalog<br/>(contract)"]
  decisionrecord["DecisionRecord<br/>(contract)"]
  governancesupporting["GovernanceSupporting<br/>(contract)"]
  taxonomydigest["TaxonomyDigest<br/>(contract)"]
  validationruledigest["ValidationRuleDigest<br/>(contract)"]
  businessrulesetassembly -->|depends-on| businessrule
  businessrulesetassembly -->|depends-on| businessruleset
  businessrulesetassembly -->|depends-on| governancesupporting
```

### Bounded context: lint (4 patterns)

```mermaid
graph TD
  lintengine["LintEngine<br/>(service)"]
  lintmodule["LintModule<br/>(barrel)"]
  lintrules["LintRules<br/>(service)"]
  processguarddecider["ProcessGuardDecider<br/>(decider)"]
  lintengine -->|depends-on| lintrules
  lintmodule -->|depends-on| lintengine
  lintmodule -->|depends-on| lintrules
```

### Bounded context: operational-insights (10 patterns)

```mermaid
graph TD
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
  sourceinventorydigest -->|depends-on| sourceinventoryentry
  tagusagematrix -->|depends-on| tagusageentry
```

### Bounded context: pattern-relations (16 patterns)

```mermaid
graph TD
  architecturecomparison["ArchitectureComparison<br/>(contract)"]
  architectureneighborhood["ArchitectureNeighborhood<br/>(contract)"]
  boundedcontextfragmentcontract["BoundedContextFragmentContract<br/>(contract)"]
  dependencycontext["DependencyContext<br/>(contract)"]
  dependencyedge["DependencyEdge<br/>(contract)"]
  dependencyedgeset["DependencyEdgeSet<br/>(contract)"]
  openquestionlist["OpenQuestionList<br/>(contract)"]
  orphanpatternlist["OrphanPatternList<br/>(contract)"]
  patternbundleassembly["PatternBundleAssembly<br/>(service)"]
  patternbundleentry["PatternBundleEntry<br/>(contract)"]
  patterncatalog["PatternCatalog<br/>(contract)"]
  patterncatalogassembly["PatternCatalogAssembly<br/>(service)"]
  patterndetail["PatternDetail<br/>(contract)"]
  patternrelationsfragmentcontracts["PatternRelationsFragmentContracts<br/>(contract)"]
  patternrelationssupporting["PatternRelationsSupporting<br/>(contract)"]
  patternsummary["PatternSummary<br/>(contract)"]
  patternbundleassembly -->|depends-on| patterncatalogassembly
  patternbundleentry -->|depends-on| patternrelationssupporting
  patternbundleentry -->|depends-on| patternsummary
  patterncatalogassembly -->|depends-on| patterncatalog
```

### Bounded context: pipeline (6 patterns)

```mermaid
graph TD
  buildpipeline["BuildPipeline<br/>(service)"]
  contextinference["ContextInference<br/>(service)"]
  patternsourcemerger["PatternSourceMerger<br/>(service)"]
  pipelinedatasetcontract["PipelineDatasetContract<br/>(contract)"]
  relationshipresolver["RelationshipResolver<br/>(service)"]
  transformdataset["TransformDataset<br/>(service)"]
  relationshipresolver -->|depends-on| pipelinedatasetcontract
  transformdataset -->|depends-on| contextinference
  transformdataset -->|depends-on| pipelinedatasetcontract
  transformdataset -->|depends-on| relationshipresolver
```

### Bounded context: process-guard (6 patterns)

```mermaid
graph TD
  deriveprocessstate["DeriveProcessState<br/>(read-model)"]
  detectchanges["DetectChanges<br/>(service)"]
  lintprocesscli["LintProcessCLI<br/>(service)"]
  processguardlinter["ProcessGuardLinter<br/>(barrel)"]
  processguardtypes["ProcessGuardTypes<br/>(contract)"]
  sessionstatereader["SessionStateReader<br/>(service)"]
  deriveprocessstate -->|depends-on| sessionstatereader
  detectchanges -->|depends-on| deriveprocessstate
  lintprocesscli -->|depends-on| processguardlinter
  processguardlinter -->|depends-on| deriveprocessstate
  processguardlinter -->|depends-on| detectchanges
```

### Bounded context: projection (48 patterns)

```mermaid
graph TD
  annotationcoverageprojection["AnnotationCoverageProjection<br/>(projection)"]
  architecturecomparisonprojection["ArchitectureComparisonProjection<br/>(projection)"]
  architecturediagramprojection["ArchitectureDiagramProjection<br/>(projection)"]
  architecturegraphprojection["ArchitectureGraphProjection<br/>(projection)"]
  architectureneighborhoodprojection["ArchitectureNeighborhoodProjection<br/>(projection)"]
  boundedcontextprojection["BoundedContextProjection<br/>(projection)"]
  businessrulesprojection["BusinessRulesProjection<br/>(projection)"]
  changelogprojection["ChangelogProjection<br/>(projection)"]
  decisioncatalogprojection["DecisionCatalogProjection<br/>(projection)"]
  deliverableprojection["DeliverableProjection<br/>(projection)"]
  deliveryreportingprojectionsupport["DeliveryReportingProjectionSupport<br/>(utility)"]
  dependencycontextprojection["DependencyContextProjection<br/>(projection)"]
  dependencyedgeprojection["DependencyEdgeProjection<br/>(projection)"]
  designreviewprojection["DesignReviewProjection<br/>(projection)"]
  documentationbundle["DocumentationBundle<br/>(projection)"]
  documentationcompositionprojectionsupport["DocumentationCompositionProjectionSupport<br/>(utility)"]
  documentationtyperegistry["DocumentationTypeRegistry<br/>(contract)"]
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
  prchangereviewprojection["PrChangeReviewProjection<br/>(projection)"]
  projectconfigprojection["ProjectConfigProjection<br/>(projection)"]
  projectionbundle["ProjectionBundle<br/>(contract)"]
  projectioncontext["ProjectionContext<br/>(contract)"]
  projectionerror["ProjectionError<br/>(contract)"]
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
  architectureinspection["ArchitectureInspection<br/>(utility)"]
  decisionresolution["DecisionResolution<br/>(utility)"]
  graphinventory["GraphInventory<br/>(utility)"]
  patternclassification["PatternClassification<br/>(utility)"]
  patterngraphapi["PatternGraphApi<br/>(utility)"]
  patternhelpers["PatternHelpers<br/>(utility)"]
  readapiresultcontract["ReadApiResultContract<br/>(contract)"]
  ruleaggregation["RuleAggregation<br/>(utility)"]
  architectureinspection -->|depends-on| patternhelpers
  decisionresolution -->|depends-on| patternhelpers
  graphinventory -->|depends-on| patternhelpers
  patterngraphapi -->|depends-on| patternhelpers
  ruleaggregation -->|depends-on| patternhelpers
```

### Bounded context: rendering (16 patterns)

```mermaid
graph TD
  blockschema["BlockSchema<br/>(contract)"]
  compacttextrenderer["CompactTextRenderer<br/>(codec)"]
  deterministicformatutils["DeterministicFormatUtils<br/>(utility)"]
  disclosurespec["DisclosureSpec<br/>(contract)"]
  fragmentrendererdispatch["FragmentRendererDispatch<br/>(codec)"]
  jsonrenderer["JsonRenderer<br/>(codec)"]
  logicalrouteid["LogicalRouteId<br/>(contract)"]
  markdownblockparser["MarkdownBlockParser<br/>(codec)"]
  markdownrenderer["MarkdownRenderer<br/>(codec)"]
  markdownrouteprofile["MarkdownRouteProfile<br/>(service)"]
  progressivedisclosurelevel["ProgressiveDisclosureLevel<br/>(contract)"]
  projectionfragmentcontracts["ProjectionFragmentContracts<br/>(contract)"]
  projectionfragmentschema["ProjectionFragmentSchema<br/>(contract)"]
  rendereroptions["RendererOptions<br/>(contract)"]
  slugcanonicalization["SlugCanonicalization<br/>(utility)"]
  uirenderer["UiRenderer<br/>(codec)"]
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
  astparser["AstParser<br/>(service)"]
  gherkinastparser["GherkinAstParser<br/>(service)"]
  gherkinscanner["GherkinScanner<br/>(service)"]
  patternscanner["PatternScanner<br/>(service)"]
```

### Bounded context: validation (9 patterns)

```mermaid
graph TD
  antipatterndetector["AntiPatternDetector<br/>(service)"]
  antipatternvalidationtypes["AntiPatternValidationTypes<br/>(contract)"]
  fsmstates["FSMStates<br/>(read-model)"]
  fsmtransitions["FSMTransitions<br/>(read-model)"]
  fsmvalidator["FSMValidator<br/>(decider)"]
  trustboundaryparser["TrustBoundaryParser<br/>(service)"]
  validatepatternscli["ValidatePatternsCLI<br/>(service)"]
  validationmodule["ValidationModule<br/>(barrel)"]
  zoderrorboundary["ZodErrorBoundary<br/>(utility)"]
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
  codecutils["CodecUtils<br/>(codec)"]
  configvalidationschemas["ConfigValidationSchemas<br/>(contract)"]
  docdirectivecontract["DocDirectiveContract<br/>(contract)"]
  dualsourceschemas["DualSourceSchemas<br/>(contract)"]
  exportinfocontract["ExportInfoContract<br/>(contract)"]
  extractedpattern["ExtractedPattern<br/>(contract)"]
  gherkinscanresultcontract["GherkinScanResultContract<br/>(contract)"]
  lintviolationcontract["LintViolationContract<br/>(contract)"]
  patterngraph["PatternGraph<br/>(contract)"]
  patternreferencecontract["PatternReferenceContract<br/>(contract)"]
  tagregistryschemas["TagRegistrySchemas<br/>(contract)"]
  docdirectivecontract -->|depends-on| tagregistryschemas
  patterngraph -->|depends-on| extractedpattern
```

### Uncontextualized · role: contract (2 patterns)

```mermaid
graph TD
  errorfactorytypes["ErrorFactoryTypes<br/>(contract)"]
  resultmonadtypes["ResultMonadTypes<br/>(contract)"]
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
| ProjectionContext                    | 6          | BusinessRuleSetAssembly, CLIContextTypes, DocumentationDefinitionRegistry, PatternBundleAssembly, PatternCatalogAssembly                                |

## Cross-package bounded contexts

Bounded contexts whose patterns span more than one workspace package.

| Bounded context | Packages                                                      | Patterns |
| --------------- | ------------------------------------------------------------- | -------- |
| cli             | Architect CLI, Architect Core, Architect Guard, Architect MCP | 13       |
| rendering       | Architect Core, Architect Projection                          | 16       |
| validation      | Architect Core, Architect Guard                               | 9        |

## Legend

### Legend

- Solid arrow = dependency (depends-on / uses)
- Dotted line = reference (see-also)

## Patterns

- AnnotationCoverage
- AnnotationCoverageProjection
- AntiPatternDetector
- AntiPatternValidationTypes
- ApiReferenceDigest
- ApiReferenceProjection
- ArchitectConfigContract
- ArchitectureComparison
- ArchitectureComparisonProjection
- ArchitectureDiagram
- ArchitectureDiagramProjection
- ArchitectureGraphProjection
- ArchitectureGraphSupport
- ArchitectureInspection
- ArchitectureNeighborhood
- ArchitectureNeighborhoodProjection
- ArgvHygiene
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
- CLIVersionHelper
- CodecUtils
- CompactTextRenderer
- ConfigDefaults
- ConfigLoader
- ConfigValidationSchemas
- ContextInference
- DecisionCatalog
- DecisionCatalogProjection
- DecisionRecord
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
- GherkinAstParser
- GherkinExtractor
- GherkinScanner
- GherkinScanResultContract
- GitBranchDiff
- GitHelpers
- GitModule
- GitNameStatusParser
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
- MCPPipelineSession
- MCPServer
- MCPServerBin
- MCPToolRegistry
- MechanicalSubstrateExtractor
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
- PipelineDatasetContract
- PrChangeReview
- PrChangeReviewProjection
- ProcessGuardDecider
- ProcessGuardLinter
- ProcessGuardTypes
- ProgressiveDisclosureLevel
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
- SessionStateReader
- ShapeExtractor
- SlugCanonicalization
- SourceInventoryDigest
- SourceInventoryEntry
- SourceInventoryProjection
- SourceMerge
- StatusDistribution
- StatusDistributionProjection
- StatusNormalization
- StatusValueDomain
- TagDirectiveRegexBuilders
- TagRegistrySchemas
- TagUsageEntry
- TagUsageMatrix
- TagUsageProjection
- TaxonomyDigest
- TaxonomyDigestProjection
- TaxonomyEmbeddedShapesProjection
- TraceabilityMatrix
- TraceabilityMatrixProjection
- TransformDataset
- TrustBoundaryParser
- UiRenderer
- ValidatePatternsCLI
- ValidationModule
- ValidationRuleDigest
- ValidationRuleDigestProjection
- ZodErrorBoundary
