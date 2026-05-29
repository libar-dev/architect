# Architecture

**Purpose:** Auto-generated architecture diagrams from source annotations
**Detail Level:** Context map plus per-group component diagrams

---

## Overview

This view captures 166 patterns across 23 diagrams in the Component architecture view.

## Related views

- [Layered](architecture/layered.md)
- [Package Seam](architecture/package-seam.md)

## Diagrams

### Context Map

Each node is a group; each arrow is a cross-group dependency (`depends-on` / `uses`, pointing from dependant to dependency). The per-group diagrams below detail each group’s internal dependencies and any see-also references.

```mermaid
graph LR
  api["api (4)"]
  cli["cli (6)"]
  configuration["configuration (4)"]
  delivery_reporting["delivery-reporting (7)"]
  documentation_composition["documentation-composition (7)"]
  domain["domain (1)"]
  execution_context["execution-context (8)"]
  extractor["extractor (6)"]
  generator["generator (4)"]
  governance["governance (8)"]
  lint["lint (4)"]
  operational_insights["operational-insights (10)"]
  pattern_relations["pattern-relations (12)"]
  pipeline["pipeline (1)"]
  process_guard["process-guard (6)"]
  projection["projection (44)"]
  read_api["read-api (7)"]
  rendering["rendering (7)"]
  scanner["scanner (4)"]
  validation["validation (8)"]
  validation_schemas["validation-schemas (4)"]
  role_contract["role: contract (4)"]
  api --> pipeline
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
  documentation_composition --> role_contract
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
  projection --> validation_schemas
  read_api --> validation_schemas
  rendering --> role_contract
  validation --> extractor
  validation --> scanner
  validation --> validation_schemas
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

### Bounded context: cli (6 patterns)

```mermaid
graph TD
  clierrorhandler["CLIErrorHandler<br/>(utility)"]
  cliruntimepaths["CLIRuntimePaths<br/>(utility)"]
  cliversionhelper["CLIVersionHelper<br/>(utility)"]
  lintpatternscli["LintPatternsCLI<br/>(service)"]
  mcpserverbin["MCPServerBin<br/>(utility)"]
  patterngraphcli["PatternGraphCLI<br/>(service)"]
  cliversionhelper -->|depends-on| cliruntimepaths
  patterngraphcli -->|depends-on| cliruntimepaths
  patterngraphcli -->|depends-on| cliversionhelper
```

### Bounded context: configuration (4 patterns)

```mermaid
graph TD
  configloader["ConfigLoader<br/>(service)"]
  defineconfig["DefineConfig<br/>(utility)"]
  registrybuilder["RegistryBuilder<br/>(utility)"]
  sourcemerge["SourceMerge<br/>(utility)"]
```

### Bounded context: delivery-reporting (7 patterns)

```mermaid
graph TD
  deliveryreportingfragmentcontracts["DeliveryReportingFragmentContracts<br/>(contract)"]
  deliveryreportingsupporting["DeliveryReportingSupporting<br/>(contract)"]
  phaseprogress["PhaseProgress<br/>(contract)"]
  releasenotesdigest["ReleaseNotesDigest<br/>(contract)"]
  roadmaptimeline["RoadmapTimeline<br/>(contract)"]
  statusdistribution["StatusDistribution<br/>(contract)"]
  traceabilitymatrix["TraceabilityMatrix<br/>(contract)"]
```

### Bounded context: documentation-composition (7 patterns)

```mermaid
graph TD
  apireferencedigest["ApiReferenceDigest<br/>(contract)"]
  apireferenceprojection["ApiReferenceProjection<br/>(projection)"]
  architecturediagram["ArchitectureDiagram<br/>(contract)"]
  documentationcompositionsupporting["DocumentationCompositionSupporting<br/>(contract)"]
  generatordegeneracyguard["GeneratorDegeneracyGuard<br/>(utility)"]
  prchangereview["PrChangeReview<br/>(contract)"]
  projectconfigsnapshot["ProjectConfigSnapshot<br/>(contract)"]
  apireferenceprojection -->|depends-on| apireferencedigest
```

### Bounded context: domain (1 pattern)

```mermaid
graph TD
  packageresolver["PackageResolver<br/>(utility)"]
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

### Bounded context: governance (8 patterns)

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

### Bounded context: pattern-relations (12 patterns)

```mermaid
graph TD
  architecturecomparison["ArchitectureComparison<br/>(contract)"]
  architectureneighborhood["ArchitectureNeighborhood<br/>(contract)"]
  boundedcontextfragmentcontract["BoundedContextFragmentContract<br/>(contract)"]
  dependencycontext["DependencyContext<br/>(contract)"]
  dependencyedge["DependencyEdge<br/>(contract)"]
  dependencyedgeset["DependencyEdgeSet<br/>(contract)"]
  orphanpatternlist["OrphanPatternList<br/>(contract)"]
  patterncatalog["PatternCatalog<br/>(contract)"]
  patterndetail["PatternDetail<br/>(contract)"]
  patternrelationsfragmentcontracts["PatternRelationsFragmentContracts<br/>(contract)"]
  patternrelationssupporting["PatternRelationsSupporting<br/>(contract)"]
  patternsummary["PatternSummary<br/>(contract)"]
```

### Bounded context: pipeline (1 pattern)

```mermaid
graph TD
  buildpipeline["BuildPipeline<br/>(service)"]
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

### Bounded context: projection (44 patterns)

```mermaid
graph TD
  annotationcoverageprojection["AnnotationCoverageProjection<br/>(projection)"]
  architecturecomparisonprojection["ArchitectureComparisonProjection<br/>(projection)"]
  architecturediagramprojection["ArchitectureDiagramProjection<br/>(projection)"]
  architecturegraphprojection["ArchitectureGraphProjection<br/>(projection)"]
  architectureneighborhoodprojection["ArchitectureNeighborhoodProjection<br/>(projection)"]
  boundedcontextprojection["BoundedContextProjection<br/>(projection)"]
  businessrulesprojection["BusinessRulesProjection<br/>(projection)"]
  decisioncatalogprojection["DecisionCatalogProjection<br/>(projection)"]
  deliverableprojection["DeliverableProjection<br/>(projection)"]
  deliveryreportingprojectionsupport["DeliveryReportingProjectionSupport<br/>(utility)"]
  dependencycontextprojection["DependencyContextProjection<br/>(projection)"]
  dependencyedgeprojection["DependencyEdgeProjection<br/>(projection)"]
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
  architecturecomparisonprojection -->|depends-on| patternrelationsprojectionsupport
  architecturediagramprojection -->|depends-on| documentationcompositionprojectionsupport
  architectureneighborhoodprojection -->|depends-on| patternrelationsprojectionsupport
  boundedcontextprojection -->|depends-on| patternrelationsprojectionsupport
  businessrulesprojection -->|depends-on| governanceprojectionsupport
  decisioncatalogprojection -->|depends-on| governanceprojectionsupport
  deliverableprojection -->|depends-on| executioncontextprojectionsupport
  dependencycontextprojection -->|depends-on| patternrelationsprojectionsupport
  dependencyedgeprojection -->|depends-on| patternrelationsprojectionsupport
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
  architectureinspection["ArchitectureInspection<br/>(utility)"]
  decisionresolution["DecisionResolution<br/>(utility)"]
  graphinventory["GraphInventory<br/>(utility)"]
  patternclassification["PatternClassification<br/>(utility)"]
  patterngraphapi["PatternGraphApi<br/>(utility)"]
  patternhelpers["PatternHelpers<br/>(utility)"]
  ruleaggregation["RuleAggregation<br/>(utility)"]
  architectureinspection -->|depends-on| patternhelpers
  decisionresolution -->|depends-on| patternhelpers
  graphinventory -->|depends-on| patternhelpers
  patterngraphapi -->|depends-on| patternhelpers
  ruleaggregation -->|depends-on| patternhelpers
```

### Bounded context: rendering (7 patterns)

```mermaid
graph TD
  blockschema["BlockSchema<br/>(contract)"]
  compacttextrenderer["CompactTextRenderer<br/>(codec)"]
  fragmentrendererdispatch["FragmentRendererDispatch<br/>(codec)"]
  jsonrenderer["JsonRenderer<br/>(codec)"]
  markdownblockparser["MarkdownBlockParser<br/>(codec)"]
  markdownrenderer["MarkdownRenderer<br/>(codec)"]
  uirenderer["UiRenderer<br/>(codec)"]
  compacttextrenderer -->|depends-on| fragmentrendererdispatch
  markdownrenderer -->|depends-on| blockschema
  markdownrenderer -->|depends-on| fragmentrendererdispatch
  uirenderer -->|depends-on| blockschema
  uirenderer -->|depends-on| fragmentrendererdispatch
```

### Bounded context: scanner (4 patterns)

```mermaid
graph TD
  astparser["AstParser<br/>(service)"]
  gherkinastparser["GherkinAstParser<br/>(service)"]
  gherkinscanner["GherkinScanner<br/>(service)"]
  patternscanner["PatternScanner<br/>(service)"]
```

### Bounded context: validation (8 patterns)

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
  codecutils["CodecUtils<br/>(codec)"]
  extractedpattern["ExtractedPattern<br/>(contract)"]
  patterngraph["PatternGraph<br/>(contract)"]
  tagregistryschemas["TagRegistrySchemas<br/>(contract)"]
  patterngraph -->|depends-on| extractedpattern
```

### Uncontextualized · role: contract (4 patterns)

```mermaid
graph TD
  errorfactorytypes["ErrorFactoryTypes<br/>(contract)"]
  projectionfragmentcontracts["ProjectionFragmentContracts<br/>(contract)"]
  projectionfragmentschema["ProjectionFragmentSchema<br/>(contract)"]
  resultmonadtypes["ResultMonadTypes<br/>(contract)"]
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

| Bounded context | Packages                                      | Patterns |
| --------------- | --------------------------------------------- | -------- |
| cli             | Architect CLI, Architect Guard, Architect MCP | 6        |
| rendering       | Architect Core, Architect Projection          | 7        |
| validation      | Architect Core, Architect Guard               | 8        |

## Legend

### Legend

- Solid arrow = dependency (depends-on / uses)
- Dotted line = reference (see-also)

## Patterns

- AnnotationCoverage
- AnnotationCoverageProjection
- AntiPatternDetector
- ApiReferenceDigest
- ApiReferenceProjection
- ArchitectureComparison
- ArchitectureComparisonProjection
- ArchitectureDiagram
- ArchitectureDiagramProjection
- ArchitectureGraphProjection
- ArchitectureInspection
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
- CLIErrorHandler
- CLIRuntimePaths
- CLIVersionHelper
- CodecUtils
- CompactTextRenderer
- ConfigLoader
- DecisionCatalog
- DecisionCatalogProjection
- DecisionRecord
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
- DetectChanges
- DocExtractor
- DocumentationBundle
- DocumentationCompositionProjectionSupport
- DocumentationCompositionSupporting
- DoDValidationTypes
- DoDValidator
- DualSourceExtractor
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
- GherkinAstParser
- GherkinExtractor
- GherkinScanner
- GitBranchDiff
- GitHelpers
- GitModule
- GitNameStatusParser
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
- MarkdownBlockParser
- MarkdownRenderer
- MCPFileWatcher
- MCPPipelineSession
- MCPServer
- MCPServerBin
- MCPToolRegistry
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
- PhaseProgress
- PhaseProgressProjection
- PrChangeReview
- PrChangeReviewProjection
- ProcessGuardDecider
- ProcessGuardLinter
- ProcessGuardTypes
- ProjectConfigProjection
- ProjectConfigSnapshot
- ProjectionFragmentContracts
- ProjectionFragmentSchema
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
- SessionStateReader
- ShapeExtractor
- SourceInventoryDigest
- SourceInventoryEntry
- SourceInventoryProjection
- SourceMerge
- StatusDistribution
- StatusDistributionProjection
- TagRegistrySchemas
- TagUsageEntry
- TagUsageMatrix
- TagUsageProjection
- TaxonomyDigest
- TaxonomyDigestProjection
- TraceabilityMatrix
- TraceabilityMatrixProjection
- UiRenderer
- ValidatePatternsCLI
- ValidationModule
- ValidationRuleDigest
- ValidationRuleDigestProjection
