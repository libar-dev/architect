# Architecture

**Purpose:** Auto-generated architecture diagrams from source annotations
**Detail Level:** Context map plus per-group component diagrams

---

## Overview

This view captures 237 patterns across 29 diagrams in the Component architecture view.

## Diagrams

### Context Map

Each node is a group; arrows are cross-group relationships. See the per-group diagrams below for detail.

```mermaid
graph LR
  api["api (4)"]
  cli["cli (6)"]
  configuration["configuration (4)"]
  delivery_reporting["delivery-reporting (6)"]
  documentation_composition["documentation-composition (4)"]
  domain["domain (1)"]
  execution_context["execution-context (8)"]
  extractor["extractor (6)"]
  generator["generator (4)"]
  governance["governance (8)"]
  guard["guard (1)"]
  lint["lint (4)"]
  operational_insights["operational-insights (10)"]
  pattern_relations["pattern-relations (10)"]
  pipeline["pipeline (1)"]
  process_guard["process-guard (6)"]
  projection["projection (43)"]
  read_api["read-api (5)"]
  rendering["rendering (7)"]
  scanner["scanner (4)"]
  validation["validation (8)"]
  validation_schemas["validation-schemas (4)"]
  role_contract["role: contract (9)"]
  role_projection["role: projection (17)"]
  pkg_architect_core["Architect Core (22)"]
  pkg_architect_host_dev["Architect Host (Dev) (22)"]
  pkg_architect_mcp["Architect MCP (4)"]
  pkg_architect_package_content["Architect Package Content (9)"]
  api --> cli
  cli --> api
  cli --> lint
  cli --> role_contract
  cli --> scanner
  delivery_reporting --> execution_context
  delivery_reporting --> pattern_relations
  delivery_reporting --> projection
  documentation_composition --> projection
  documentation_composition --> rendering
  execution_context --> delivery_reporting
  execution_context --> pattern_relations
  execution_context --> projection
  extractor --> pipeline
  extractor --> read_api
  extractor --> scanner
  extractor --> validation
  extractor --> validation_schemas
  generator --> process_guard
  governance --> projection
  governance --> rendering
  lint --> cli
  lint --> process_guard
  lint --> validation
  lint --> validation_schemas
  operational_insights --> projection
  operational_insights --> rendering
  pattern_relations --> delivery_reporting
  pattern_relations --> execution_context
  pattern_relations --> projection
  pipeline --> extractor
  pipeline --> scanner
  pipeline --> validation_schemas
  pkg_architect_core --> pkg_architect_host_dev
  pkg_architect_host_dev --> pkg_architect_package_content
  pkg_architect_package_content --> pkg_architect_host_dev
  process_guard --> generator
  process_guard --> lint
  process_guard --> scanner
  process_guard --> validation
  projection --> delivery_reporting
  projection --> documentation_composition
  projection --> execution_context
  projection --> governance
  projection --> operational_insights
  projection --> pattern_relations
  projection --> role_contract
  read_api --> extractor
  read_api --> validation_schemas
  rendering --> documentation_composition
  rendering --> governance
  rendering --> operational_insights
  rendering --> role_contract
  role_contract --> cli
  role_contract --> projection
  role_contract --> rendering
  scanner --> cli
  scanner --> extractor
  scanner --> pipeline
  scanner --> process_guard
  scanner --> validation
  validation --> extractor
  validation --> lint
  validation --> process_guard
  validation --> scanner
  validation --> validation_schemas
  validation_schemas --> extractor
  validation_schemas --> lint
  validation_schemas --> pipeline
  validation_schemas --> read_api
  validation_schemas --> validation
```

### Bounded context: api \(4 patterns\)

```mermaid
graph TD
  mcpfilewatcher["MCPFileWatcher<br/>(utility)"]
  mcppipelinesession["MCPPipelineSession<br/>(service)"]
  mcpserver["MCPServer<br/>(service)"]
  mcptoolregistry["MCPToolRegistry<br/>(service)"]
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
  mcpserver -->|depends-on| mcptoolregistry
  mcpserver -.->|uses| mcptoolregistry
  mcptoolregistry -->|depends-on| mcppipelinesession
  mcptoolregistry ==>|enables| mcppipelinesession
  mcptoolregistry -.->|uses| mcppipelinesession
  mcptoolregistry ==>|enables| mcpserver
```

### Bounded context: cli \(6 patterns\)

```mermaid
graph TD
  clierrorhandler["CLIErrorHandler<br/>(utility)"]
  cliruntimepaths["CLIRuntimePaths<br/>(utility)"]
  cliversionhelper["CLIVersionHelper<br/>(utility)"]
  lintpatternscli["LintPatternsCLI<br/>(service)"]
  mcpserverbin["MCPServerBin<br/>(utility)"]
  patterngraphcli["PatternGraphCLI<br/>(service)"]
  cliruntimepaths ==>|enables| cliversionhelper
  cliruntimepaths ==>|enables| patterngraphcli
  cliversionhelper -->|depends-on| cliruntimepaths
  cliversionhelper -.->|uses| cliruntimepaths
  cliversionhelper ==>|enables| patterngraphcli
  patterngraphcli -->|depends-on| cliruntimepaths
  patterngraphcli -.->|uses| cliruntimepaths
  patterngraphcli -->|depends-on| cliversionhelper
  patterngraphcli -.->|uses| cliversionhelper
```

### Bounded context: configuration \(4 patterns\)

```mermaid
graph TD
  configloader["ConfigLoader<br/>(service)"]
  defineconfig["DefineConfig<br/>(utility)"]
  registrybuilder["RegistryBuilder<br/>(utility)"]
  sourcemerge["SourceMerge<br/>(utility)"]
```

### Bounded context: delivery-reporting \(6 patterns\)

```mermaid
graph TD
  deliveryreportingsupporting["DeliveryReportingSupporting<br/>(contract)"]
  phaseprogress["PhaseProgress<br/>(contract)"]
  releasenotesdigest["ReleaseNotesDigest<br/>(contract)"]
  roadmaptimeline["RoadmapTimeline<br/>(contract)"]
  statusdistribution["StatusDistribution<br/>(contract)"]
  traceabilitymatrix["TraceabilityMatrix<br/>(contract)"]
```

### Bounded context: documentation-composition \(4 patterns\)

```mermaid
graph TD
  architecturediagram["ArchitectureDiagram<br/>(contract)"]
  documentationcompositionsupporting["DocumentationCompositionSupporting<br/>(contract)"]
  prchangereview["PrChangeReview<br/>(contract)"]
  projectconfigsnapshot["ProjectConfigSnapshot<br/>(contract)"]
```

### Bounded context: domain \(1 pattern\)

```mermaid
graph TD
  packageresolver["PackageResolver<br/>(utility)"]
```

### Bounded context: execution-context \(8 patterns\)

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
  executioncontextsupporting ==>|enables| handoffrecord
  executioncontextsupporting ==>|enables| scopereadinesscheck
  executioncontextsupporting ==>|enables| scopereadinessreport
  executioncontextsupporting ==>|enables| sessioncontextbundle
  handoffrecord -->|depends-on| executioncontextsupporting
  handoffrecord -.->|uses| executioncontextsupporting
  scopereadinesscheck -->|depends-on| executioncontextsupporting
  scopereadinesscheck -.->|uses| executioncontextsupporting
  scopereadinessreport -->|depends-on| executioncontextsupporting
  scopereadinessreport -.->|uses| executioncontextsupporting
  sessioncontextbundle -->|depends-on| executioncontextsupporting
  sessioncontextbundle -.->|uses| executioncontextsupporting
```

### Bounded context: extractor \(6 patterns\)

```mermaid
graph TD
  docextractor["DocExtractor<br/>(service)"]
  dualsourceextractor["DualSourceExtractor<br/>(service)"]
  extractiondiagnostics["ExtractionDiagnostics<br/>(contract)"]
  gherkinextractor["GherkinExtractor<br/>(service)"]
  layerinference["LayerInference<br/>(service)"]
  shapeextractor["ShapeExtractor<br/>(service)"]
  docextractor -->|depends-on| shapeextractor
  docextractor -.->|uses| shapeextractor
  gherkinextractor -->|depends-on| layerinference
  gherkinextractor -.->|uses| layerinference
  layerinference ==>|enables| gherkinextractor
  shapeextractor ==>|enables| docextractor
```

### Bounded context: generator \(4 patterns\)

```mermaid
graph TD
  gitbranchdiff["GitBranchDiff<br/>(utility)"]
  githelpers["GitHelpers<br/>(utility)"]
  gitmodule["GitModule<br/>(barrel)"]
  gitnamestatusparser["GitNameStatusParser<br/>(utility)"]
  gitbranchdiff ==>|enables| gitmodule
  gitbranchdiff -->|depends-on| gitnamestatusparser
  gitbranchdiff -.->|uses| gitnamestatusparser
  githelpers ==>|enables| gitmodule
  gitmodule -->|depends-on| gitbranchdiff
  gitmodule -.->|uses| gitbranchdiff
  gitmodule -->|depends-on| githelpers
  gitmodule -.->|uses| githelpers
  gitnamestatusparser ==>|enables| gitbranchdiff
```

### Bounded context: governance \(8 patterns\)

```mermaid
graph TD
  businessrule["BusinessRule<br/>(contract)"]
  businessrulereference["BusinessRuleReference<br/>(contract)"]
  businessruleset["BusinessRuleSet<br/>(contract)"]
  decisioncatalog["DecisionCatalog<br/>(contract)"]
  decisionrecord["DecisionRecord<br/>(contract)"]
  governancesupporting["GovernanceSupporting<br/>(contract)"]
  taxonomydigest["TaxonomyDigest<br/>(contract)"]
  validationruledigest["ValidationRuleDigest<br/>(contract)"]
```

### Bounded context: guard \(1 pattern\)

```mermaid
graph TD
  processguardrulesexecutabletests["ProcessGuardRulesExecutableTests"]
```

### Bounded context: lint \(4 patterns\)

```mermaid
graph TD
  lintengine["LintEngine<br/>(service)"]
  lintmodule["LintModule<br/>(barrel)"]
  lintrules["LintRules<br/>(service)"]
  processguarddecider["ProcessGuardDecider<br/>(decider)"]
  lintengine ==>|enables| lintmodule
  lintengine -->|depends-on| lintrules
  lintengine -.->|uses| lintrules
  lintmodule -->|depends-on| lintengine
  lintmodule -.->|uses| lintengine
  lintmodule -->|depends-on| lintrules
  lintmodule -.->|uses| lintrules
  lintrules ==>|enables| lintengine
  lintrules ==>|enables| lintmodule
```

### Bounded context: operational-insights \(10 patterns\)

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
  sourceinventorydigest -.->|uses| sourceinventoryentry
  sourceinventoryentry ==>|enables| sourceinventorydigest
  tagusageentry ==>|enables| tagusagematrix
  tagusagematrix -->|depends-on| tagusageentry
  tagusagematrix -.->|uses| tagusageentry
```

### Bounded context: pattern-relations \(10 patterns\)

```mermaid
graph TD
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
```

### Bounded context: pipeline \(1 pattern\)

```mermaid
graph TD
  buildpipeline["BuildPipeline<br/>(service)"]
```

### Bounded context: process-guard \(6 patterns\)

```mermaid
graph TD
  deriveprocessstate["DeriveProcessState<br/>(read-model)"]
  detectchanges["DetectChanges<br/>(service)"]
  lintprocesscli["LintProcessCLI<br/>(service)"]
  processguardlinter["ProcessGuardLinter<br/>(barrel)"]
  processguardtypes["ProcessGuardTypes<br/>(contract)"]
  sessionstatereader["SessionStateReader<br/>(service)"]
  deriveprocessstate ==>|enables| detectchanges
  deriveprocessstate ==>|enables| processguardlinter
  deriveprocessstate -->|depends-on| sessionstatereader
  deriveprocessstate -.->|uses| sessionstatereader
  detectchanges -->|depends-on| deriveprocessstate
  detectchanges -.->|uses| deriveprocessstate
  detectchanges ==>|enables| processguardlinter
  lintprocesscli -->|depends-on| processguardlinter
  lintprocesscli -.->|uses| processguardlinter
  processguardlinter -->|depends-on| deriveprocessstate
  processguardlinter -.->|uses| deriveprocessstate
  processguardlinter -->|depends-on| detectchanges
  processguardlinter -.->|uses| detectchanges
  processguardlinter ==>|enables| lintprocesscli
  sessionstatereader ==>|enables| deriveprocessstate
```

### Bounded context: projection \(43 patterns\)

```mermaid
graph TD
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
  annotationcoverageprojection -->|depends-on| operationalinsightsprojectionsupport
  annotationcoverageprojection -.->|uses| operationalinsightsprojectionsupport
  architecturecomparisonprojection -->|depends-on| patternrelationsprojectionsupport
  architecturecomparisonprojection -.->|uses| patternrelationsprojectionsupport
  architecturediagramprojection -->|depends-on| documentationcompositionprojectionsupport
  architecturediagramprojection -.->|uses| documentationcompositionprojectionsupport
  architectureneighborhoodprojection -->|depends-on| patternrelationsprojectionsupport
  architectureneighborhoodprojection -.->|uses| patternrelationsprojectionsupport
  boundedcontextprojection -->|depends-on| patternrelationsprojectionsupport
  boundedcontextprojection -.->|uses| patternrelationsprojectionsupport
  businessrulesprojection -->|depends-on| governanceprojectionsupport
  businessrulesprojection -.->|uses| governanceprojectionsupport
  decisioncatalogprojection -->|depends-on| governanceprojectionsupport
  decisioncatalogprojection -.->|uses| governanceprojectionsupport
  deliverableprojection -->|depends-on| executioncontextprojectionsupport
  deliverableprojection -.->|uses| executioncontextprojectionsupport
  deliveryreportingprojectionsupport ==>|enables| phaseprogressprojection
  deliveryreportingprojectionsupport ==>|enables| releasenotesprojection
  deliveryreportingprojectionsupport ==>|enables| roadmaptimelineprojection
  deliveryreportingprojectionsupport ==>|enables| statusdistributionprojection
  deliveryreportingprojectionsupport ==>|enables| traceabilitymatrixprojection
  dependencyedgeprojection -->|depends-on| patternrelationsprojectionsupport
  dependencyedgeprojection -.->|uses| patternrelationsprojectionsupport
  dependencytreeprojection -->|depends-on| patternrelationsprojectionsupport
  dependencytreeprojection -.->|uses| patternrelationsprojectionsupport
  documentationbundle -->|depends-on| documentationcompositionprojectionsupport
  documentationbundle -.->|uses| documentationcompositionprojectionsupport
  documentationcompositionprojectionsupport ==>|enables| architecturediagramprojection
  documentationcompositionprojectionsupport ==>|enables| documentationbundle
  documentationcompositionprojectionsupport ==>|enables| prchangereviewprojection
  documentationcompositionprojectionsupport ==>|enables| projectconfigprojection
  executioncontextprojectionsupport ==>|enables| deliverableprojection
  executioncontextprojectionsupport ==>|enables| filereadinglistprojection
  executioncontextprojectionsupport ==>|enables| handoffprojection
  executioncontextprojectionsupport ==>|enables| scopereadinessprojection
  executioncontextprojectionsupport ==>|enables| sessioncontextprojection
  filereadinglistprojection -->|depends-on| executioncontextprojectionsupport
  filereadinglistprojection -.->|uses| executioncontextprojectionsupport
  governanceprojectionsupport ==>|enables| businessrulesprojection
  governanceprojectionsupport ==>|enables| decisioncatalogprojection
  governanceprojectionsupport ==>|enables| taxonomydigestprojection
  governanceprojectionsupport ==>|enables| validationruledigestprojection
  handoffprojection -->|depends-on| executioncontextprojectionsupport
  handoffprojection -.->|uses| executioncontextprojectionsupport
  openquestionlistprojection -->|depends-on| patternrelationsprojectionsupport
  openquestionlistprojection -.->|uses| patternrelationsprojectionsupport
  operationalinsightsprojectionsupport ==>|enables| annotationcoverageprojection
  operationalinsightsprojectionsupport ==>|enables| overviewprojection
  operationalinsightsprojectionsupport ==>|enables| requirementdigestprojection
  operationalinsightsprojectionsupport ==>|enables| requirementexecutabledigestprojection
  operationalinsightsprojectionsupport ==>|enables| requirementspecsdigestprojection
  operationalinsightsprojectionsupport ==>|enables| roleprofileprojection
  operationalinsightsprojectionsupport ==>|enables| sourceinventoryprojection
  operationalinsightsprojectionsupport ==>|enables| tagusageprojection
  orphanpatternlistprojection -->|depends-on| patternrelationsprojectionsupport
  orphanpatternlistprojection -.->|uses| patternrelationsprojectionsupport
  overviewprojection -->|depends-on| operationalinsightsprojectionsupport
  overviewprojection -.->|uses| operationalinsightsprojectionsupport
  patternbundleprojection -->|depends-on| patternrelationsprojectionsupport
  patternbundleprojection -.->|uses| patternrelationsprojectionsupport
  patterncatalogprojection -->|depends-on| patternrelationsprojectionsupport
  patterncatalogprojection -.->|uses| patternrelationsprojectionsupport
  patterndetailprojection -->|depends-on| patternrelationsprojectionsupport
  patterndetailprojection -.->|uses| patternrelationsprojectionsupport
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
  patternrelationsprojectionsupport ==>|enables| patternsummaryprojection
  patternsummaryprojection -->|depends-on| patternrelationsprojectionsupport
  patternsummaryprojection -.->|uses| patternrelationsprojectionsupport
  phaseprogressprojection -->|depends-on| deliveryreportingprojectionsupport
  phaseprogressprojection -.->|uses| deliveryreportingprojectionsupport
  prchangereviewprojection -->|depends-on| documentationcompositionprojectionsupport
  prchangereviewprojection -.->|uses| documentationcompositionprojectionsupport
  projectconfigprojection -->|depends-on| documentationcompositionprojectionsupport
  projectconfigprojection -.->|uses| documentationcompositionprojectionsupport
  releasenotesprojection -->|depends-on| deliveryreportingprojectionsupport
  releasenotesprojection -.->|uses| deliveryreportingprojectionsupport
  requirementdigestprojection -->|depends-on| operationalinsightsprojectionsupport
  requirementdigestprojection -.->|uses| operationalinsightsprojectionsupport
  requirementexecutabledigestprojection -->|depends-on| operationalinsightsprojectionsupport
  requirementexecutabledigestprojection -.->|uses| operationalinsightsprojectionsupport
  requirementspecsdigestprojection -->|depends-on| operationalinsightsprojectionsupport
  requirementspecsdigestprojection -.->|uses| operationalinsightsprojectionsupport
  roadmaptimelineprojection -->|depends-on| deliveryreportingprojectionsupport
  roadmaptimelineprojection -.->|uses| deliveryreportingprojectionsupport
  roleprofileprojection -->|depends-on| operationalinsightsprojectionsupport
  roleprofileprojection -.->|uses| operationalinsightsprojectionsupport
  scopereadinessprojection -->|depends-on| executioncontextprojectionsupport
  scopereadinessprojection -.->|uses| executioncontextprojectionsupport
  sessioncontextprojection -->|depends-on| executioncontextprojectionsupport
  sessioncontextprojection -.->|uses| executioncontextprojectionsupport
  sourceinventoryprojection -->|depends-on| operationalinsightsprojectionsupport
  sourceinventoryprojection -.->|uses| operationalinsightsprojectionsupport
  statusdistributionprojection -->|depends-on| deliveryreportingprojectionsupport
  statusdistributionprojection -.->|uses| deliveryreportingprojectionsupport
  tagusageprojection -->|depends-on| operationalinsightsprojectionsupport
  tagusageprojection -.->|uses| operationalinsightsprojectionsupport
  taxonomydigestprojection -->|depends-on| governanceprojectionsupport
  taxonomydigestprojection -.->|uses| governanceprojectionsupport
  traceabilitymatrixprojection -->|depends-on| deliveryreportingprojectionsupport
  traceabilitymatrixprojection -.->|uses| deliveryreportingprojectionsupport
  validationruledigestprojection -->|depends-on| governanceprojectionsupport
  validationruledigestprojection -.->|uses| governanceprojectionsupport
```

### Bounded context: read-api \(5 patterns\)

```mermaid
graph TD
  architectureinspection["ArchitectureInspection<br/>(utility)"]
  graphinventory["GraphInventory<br/>(utility)"]
  patternclassification["PatternClassification<br/>(utility)"]
  patterngraphapi["PatternGraphApi<br/>(utility)"]
  patternhelpers["PatternHelpers<br/>(utility)"]
  architectureinspection -->|depends-on| patternhelpers
  architectureinspection -.->|uses| patternhelpers
  graphinventory -->|depends-on| patternhelpers
  graphinventory -.->|uses| patternhelpers
  patterngraphapi -->|depends-on| patternhelpers
  patterngraphapi -.->|uses| patternhelpers
  patternhelpers ==>|enables| architectureinspection
  patternhelpers ==>|enables| graphinventory
  patternhelpers ==>|enables| patterngraphapi
```

### Bounded context: rendering \(7 patterns\)

```mermaid
graph TD
  blockschema["BlockSchema<br/>(contract)"]
  compacttextrenderer["CompactTextRenderer<br/>(codec)"]
  fragmentrendererdispatch["FragmentRendererDispatch<br/>(codec)"]
  jsonrenderer["JsonRenderer<br/>(codec)"]
  markdownblockparser["MarkdownBlockParser<br/>(codec)"]
  markdownrenderer["MarkdownRenderer<br/>(codec)"]
  uirenderer["UiRenderer<br/>(codec)"]
  blockschema ==>|enables| markdownrenderer
  blockschema ==>|enables| uirenderer
  compacttextrenderer -->|depends-on| fragmentrendererdispatch
  compacttextrenderer -.->|uses| fragmentrendererdispatch
  fragmentrendererdispatch ==>|enables| compacttextrenderer
  fragmentrendererdispatch ==>|enables| markdownrenderer
  fragmentrendererdispatch ==>|enables| uirenderer
  markdownrenderer -->|depends-on| blockschema
  markdownrenderer -.->|uses| blockschema
  markdownrenderer -->|depends-on| fragmentrendererdispatch
  markdownrenderer -.->|uses| fragmentrendererdispatch
  uirenderer -->|depends-on| blockschema
  uirenderer -.->|uses| blockschema
  uirenderer -->|depends-on| fragmentrendererdispatch
  uirenderer -.->|uses| fragmentrendererdispatch
```

### Bounded context: scanner \(4 patterns\)

```mermaid
graph TD
  astparser["AstParser<br/>(service)"]
  gherkinastparser["GherkinAstParser<br/>(service)"]
  gherkinscanner["GherkinScanner<br/>(service)"]
  patternscanner["PatternScanner<br/>(service)"]
```

### Bounded context: validation \(8 patterns\)

```mermaid
graph TD
  antipatterndetector["AntiPatternDetector<br/>(service)"]
  dodvalidationtypes["DoDValidationTypes<br/>(contract)"]
  dodvalidator["DoDValidator<br/>(service)"]
  fsmstates["FSMStates<br/>(read-model)"]
  fsmtransitions["FSMTransitions<br/>(read-model)"]
  fsmvalidator["FSMValidator<br/>(decider)"]
  validatepatternscli["ValidatePatternsCLI<br/>(service)"]
  validationmodule["ValidationModule<br/>(barrel)"]
  antipatterndetector -->|depends-on| dodvalidationtypes
  antipatterndetector -.->|uses| dodvalidationtypes
  antipatterndetector ==>|enables| validationmodule
  dodvalidationtypes ==>|enables| antipatterndetector
  dodvalidationtypes ==>|enables| dodvalidator
  dodvalidationtypes ==>|enables| validationmodule
  dodvalidator -->|depends-on| dodvalidationtypes
  dodvalidator -.->|uses| dodvalidationtypes
  dodvalidator ==>|enables| validationmodule
  fsmstates ==>|enables| fsmvalidator
  fsmtransitions ==>|enables| fsmvalidator
  fsmvalidator -->|depends-on| fsmstates
  fsmvalidator -.->|uses| fsmstates
  fsmvalidator -->|depends-on| fsmtransitions
  fsmvalidator -.->|uses| fsmtransitions
  validationmodule -->|depends-on| antipatterndetector
  validationmodule -.->|uses| antipatterndetector
  validationmodule -->|depends-on| dodvalidationtypes
  validationmodule -.->|uses| dodvalidationtypes
  validationmodule -->|depends-on| dodvalidator
  validationmodule -.->|uses| dodvalidator
```

### Bounded context: validation-schemas \(4 patterns\)

```mermaid
graph TD
  codecutils["CodecUtils<br/>(codec)"]
  extractedpattern["ExtractedPattern<br/>(contract)"]
  patterngraph["PatternGraph<br/>(contract)"]
  tagregistryschemas["TagRegistrySchemas<br/>(contract)"]
  extractedpattern ==>|enables| patterngraph
  patterngraph -->|depends-on| extractedpattern
  patterngraph -.->|uses| extractedpattern
```

### Uncontextualized · role: contract \(9 patterns\)

```mermaid
graph TD
  boundedcontextfragmentcontract["BoundedContextFragmentContract<br/>(contract)"]
  deliveryreportingfragmentcontracts["DeliveryReportingFragmentContracts<br/>(contract)"]
  errorfactories["ErrorFactories<br/>(contract)"]
  errorfactorytypes["ErrorFactoryTypes<br/>(contract)"]
  patternrelationsfragmentcontracts["PatternRelationsFragmentContracts<br/>(contract)"]
  projectionfragmentcontracts["ProjectionFragmentContracts<br/>(contract)"]
  projectionfragmentschema["ProjectionFragmentSchema<br/>(contract)"]
  resultmonad["ResultMonad<br/>(contract)"]
  resultmonadtypes["ResultMonadTypes<br/>(contract)"]
```

### Uncontextualized · role: projection \(17 patterns\)

```mermaid
graph TD
  architecturenavigationprojectionexecutabletests["ArchitectureNavigationProjectionExecutableTests<br/>(projection)"]
  businessrulesprojectionexecutabletests["BusinessRulesProjectionExecutableTests<br/>(projection)"]
  decisioncatalogprojectionexecutabletests["DecisionCatalogProjectionExecutableTests<br/>(projection)"]
  deliveryprogressprojectionexecutabletests["DeliveryProgressProjectionExecutableTests<br/>(projection)"]
  deliveryreportingprojectionsupportexecutabletests["DeliveryReportingProjectionSupportExecutableTests<br/>(projection)"]
  dependencyedgeprojectionexecutabletests["DependencyEdgeProjectionExecutableTests<br/>(projection)"]
  dependencytreeprojectionexecutabletests["DependencyTreeProjectionExecutableTests<br/>(projection)"]
  documentationcompositionprojectionexecutabletests["DocumentationCompositionProjectionExecutableTests<br/>(projection)"]
  executioncontextprojectionexecutabletests["ExecutionContextProjectionExecutableTests<br/>(projection)"]
  governancevalidationtaxonomyprojectionexecutabletests["GovernanceValidationTaxonomyProjectionExecutableTests<br/>(projection)"]
  openquestionlistprojectionexecutabletests["OpenQuestionListProjectionExecutableTests<br/>(projection)"]
  operationalinsightsprojectionexecutabletests["OperationalInsightsProjectionExecutableTests<br/>(projection)"]
  patternbundleprojectionexecutabletests["PatternBundleProjectionExecutableTests<br/>(projection)"]
  patterndetailprojectionexecutabletests["PatternDetailProjectionExecutableTests<br/>(projection)"]
  patternsummarycatalogprojectionexecutabletests["PatternSummaryCatalogProjectionExecutableTests<br/>(projection)"]
  releasenotesprojectionexecutabletests["ReleaseNotesProjectionExecutableTests<br/>(projection)"]
  traceabilitymatrixprojectionexecutabletests["TraceabilityMatrixProjectionExecutableTests<br/>(projection)"]
```

### Unclassified · Architect Core \(22 patterns\)

```mermaid
graph TD
  codecutilsvalidation["CodecUtilsValidation"]
  configbasedworkflowdefinition["ConfigBasedWorkflowDefinition"]
  configresolution["ConfigResolution"]
  configurationapi["ConfigurationAPI"]
  crosspackageedgeclassification["CrossPackageEdgeClassification"]
  defineconfigexecutabletests["DefineConfigExecutableTests"]
  docstringmediatype["DocStringMediaType"]
  dualsourcemergeintegration["DualSourceMergeIntegration"]
  filediscovery["FileDiscovery"]
  gherkinexternalrelationshiptagpropagation["GherkinExternalRelationshipTagPropagation"]
  gherkinrulessupport["GherkinRulesSupport"]
  packageresolverexecutabletests["PackageResolverExecutableTests"]
  patterngraphapireverselookup["PatternGraphApiReverseLookup"]
  patternreferencevalidation["PatternReferenceValidation"]
  projectconfigloader["ProjectConfigLoader"]
  scannercore["ScannerCore"]
  shapeextraction["ShapeExtraction"]
  sourcemerging["SourceMerging"]
  tagregistryschemasvalidation["TagRegistrySchemasValidation"]
  typescripttaxonomyimplementation["TypeScriptTaxonomyImplementation"]
  valueformatcanonicalvaluesdispatch["ValueFormatCanonicalValuesDispatch"]
  workflowconfigschemasvalidation["WorkflowConfigSchemasValidation"]
  gherkinexternalrelationshiptagpropagation -. see-also .- gherkinrulessupport
```

### Unclassified · Architect Host \(Dev\) \(22 patterns\)

```mermaid
graph TD
  architectpubliccontract["ArchitectPublicContract"]
  canonicalvaluessync["CanonicalValuesSync"]
  compacttextrenderertests["CompactTextRendererTests"]
  dataapicliergonomics["DataAPICLIErgonomics"]
  dataapioutputshaping["DataAPIOutputShaping"]
  documentationcommandparityboundarytests["DocumentationCommandParityBoundaryTests"]
  generatedocscli["GenerateDocsCli"]
  lintpatternsclibehavior["LintPatternsCliBehavior"]
  lintprocessclibehavior["LintProcessCliBehavior"]
  loadpreambleparser["LoadPreambleParser"]
  mcptoolregistryboundarytests["MCPToolRegistryBoundaryTests"]
  patterngraphapicli["PatternGraphAPICLI"]
  patterngraphcliarchhealth["PatternGraphCliArchHealth"]
  patterngraphclicache["PatternGraphCliCache"]
  patterngraphclidryrun["PatternGraphCliDryRun"]
  patterngraphclimetadata["PatternGraphCliMetadata"]
  patterngraphclioutputmodifiers["PatternGraphCliOutputModifiers"]
  patterngraphclirepl["PatternGraphCliRepl"]
  patterngraphclirulessubcommand["PatternGraphCliRulesSubcommand"]
  patterngraphclisubcommands["PatternGraphCliSubcommands"]
  stubtaxonomytagtests["StubTaxonomyTagTests"]
  validatorreadmodelconsolidation["ValidatorReadModelConsolidation"]
```

### Unclassified · Architect MCP \(4 patterns\)

```mermaid
graph TD
  mcpruntimehardeningexecutabletests["MCPRuntimeHardeningExecutableTests"]
  mcpserverlifecycleexecutabletests["MCPServerLifecycleExecutableTests"]
  mcptoolinputvalidationexecutabletests["MCPToolInputValidationExecutableTests"]
  mcptoolregistryintegrationtests["MCPToolRegistryIntegrationTests"]
```

### Unclassified · Architect Package Content \(9 patterns\)

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
  pdr005processguardfsm["PDR005ProcessGuardFSM"]
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
  pdr005processguardfsm -->|depends-on| adr001taxonomycanonicalvalues
  pdr005processguardfsm -.->|uses| adr001taxonomycanonicalvalues
  pdr005processguardfsm ==>|enables| adr007coordinatedtaxonomyredesign
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
- ExtractedPattern
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
- MarkdownBlockParser
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
- RegistryBuilder
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
- SourceMerge
- SourceMerging
- StatusDistribution
- StatusDistributionProjection
- StubTaxonomyTagTests
- TagRegistrySchemas
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
