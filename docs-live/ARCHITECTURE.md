# Architecture

**Purpose:** Auto-generated architecture diagram from source annotations
**Detail Level:** Component diagram with bounded context subgraphs

---

## Overview

This diagram was auto-generated from 162 annotated source files across 11 bounded contexts.

| Metric           | Count |
| ---------------- | ----- |
| Total Components | 162   |
| Bounded Contexts | 11    |
| Component Roles  | 5     |

---

## System Overview

Component architecture with bounded context isolation:

```mermaid
graph TB
    subgraph api["Api BC"]
        MasterDataset["MasterDataset[read-model]"]
        ProcessStateTypes["ProcessStateTypes"]
        PatternSummarizerImpl["PatternSummarizerImpl[service]"]
        StubResolverImpl["StubResolverImpl"]
        ScopeValidatorImpl["ScopeValidatorImpl[service]"]
        RulesQueryModule["RulesQueryModule"]
        ProcessStateAPI["ProcessStateAPI[service]"]
        PatternHelpers["PatternHelpers"]
        APIModule["APIModule"]
        HandoffGeneratorImpl["HandoffGeneratorImpl[service]"]
        FuzzyMatcherImpl["FuzzyMatcherImpl[service]"]
        CoverageAnalyzerImpl["CoverageAnalyzerImpl[service]"]
        ContextFormatterImpl["ContextFormatterImpl[service]"]
        ContextAssemblerImpl["ContextAssemblerImpl[service]"]
        ArchQueriesImpl["ArchQueriesImpl[service]"]
    end
    subgraph cli["Cli BC"]
        CLIVersionHelper["CLIVersionHelper"]
        ValidatePatternsCLI["ValidatePatternsCLI"]
        ReplMode["ReplMode[service]"]
        ProcessAPICLIImpl["ProcessAPICLIImpl[service]"]
        OutputPipelineImpl["OutputPipelineImpl[service]"]
        LintProcessCLI["LintProcessCLI"]
        LintPatternsCLI["LintPatternsCLI"]
        TagTaxonomyCLI["TagTaxonomyCLI"]
        Documentation_Generator_CLI["Documentation Generator CLI"]
        CLIErrorHandler["CLIErrorHandler"]
        DatasetCache["DatasetCache[infrastructure]"]
        CLISchema["CLISchema"]
    end
    subgraph config["Config BC"]
        WorkflowLoader["WorkflowLoader[infrastructure]"]
        ConfigurationTypes["ConfigurationTypes"]
        ConfigResolver["ConfigResolver[service]"]
        RegexBuilders["RegexBuilders[infrastructure]"]
        ProjectConfigTypes["ProjectConfigTypes"]
        ProjectConfigSchema["ProjectConfigSchema[infrastructure]"]
        ConfigurationPresets["ConfigurationPresets"]
        SourceMerger["SourceMerger[service]"]
        DeliveryProcessFactory["DeliveryProcessFactory[service]"]
        DefineConfig["DefineConfig[infrastructure]"]
        ConfigurationDefaults["ConfigurationDefaults"]
        ConfigLoader["ConfigLoader[infrastructure]"]
    end
    subgraph extractor["Extractor BC"]
        ShapeExtractor["ShapeExtractor"]
        LayerInference["LayerInference"]
        GherkinExtractor["GherkinExtractor[service]"]
        DualSourceExtractor["DualSourceExtractor[service]"]
        Document_Extractor["Document Extractor[service]"]
    end
    subgraph generator["Generator BC"]
        GitNameStatusParser["GitNameStatusParser"]
        GitModule["GitModule"]
        GitBranchDiff["GitBranchDiff"]
        WarningCollector["WarningCollector"]
        GeneratorTypes["GeneratorTypes"]
        SourceMappingValidator["SourceMappingValidator"]
        SourceMapper["SourceMapper[infrastructure]"]
        GeneratorRegistry["GeneratorRegistry"]
        Documentation_Generation_Orchestrator["Documentation Generation Orchestrator[service]"]
        ContentDeduplicator["ContentDeduplicator[infrastructure]"]
        CodecBasedGenerator["CodecBasedGenerator[service]"]
        FileCache["FileCache[infrastructure]"]
        ReferenceGeneratorRegistration["ReferenceGeneratorRegistration"]
        ProcessApiReferenceGenerator["ProcessApiReferenceGenerator"]
        BuiltInGenerators["BuiltInGenerators"]
        DesignReviewGenerator["DesignReviewGenerator[service]"]
        DecisionDocGenerator["DecisionDocGenerator[service]"]
        CodecGeneratorRegistration["CodecGeneratorRegistration"]
        CliRecipeGenerator["CliRecipeGenerator"]
        TransformTypes["TransformTypes"]
        TransformDataset["TransformDataset[service]"]
        SequenceTransformUtils["SequenceTransformUtils[service]"]
        RelationshipResolver["RelationshipResolver[service]"]
        MergePatterns["MergePatterns"]
        PipelineModule["PipelineModule"]
        ContextInferenceImpl["ContextInferenceImpl"]
        PipelineFactory["PipelineFactory"]
    end
    subgraph lint["Lint BC"]
        LintRules["LintRules[service]"]
        LintModule["LintModule"]
        LintEngine["LintEngine[service]"]
        ProcessGuardTypes["ProcessGuardTypes"]
        ProcessGuardModule["ProcessGuardModule"]
        DetectChanges["DetectChanges"]
        DeriveProcessState["DeriveProcessState"]
        ProcessGuardDecider["ProcessGuardDecider[decider]"]
    end
    subgraph renderer["Renderer BC"]
        RenderableUtils["RenderableUtils"]
        RenderableDocument["RenderableDocument[read-model]"]
        SectionBlock["SectionBlock"]
        UniversalRenderer["UniversalRenderer[service]"]
        loadPreambleFromMarkdown___Shared_Markdown_to_SectionBlock_Parser["loadPreambleFromMarkdown — Shared Markdown-to-SectionBlock Parser"]
        RenderableDocumentModel_RDM_["RenderableDocumentModel(RDM)"]
        DocumentGenerator["DocumentGenerator[service]"]
        ValidationRulesCodec["ValidationRulesCodec"]
        TimelineCodec["TimelineCodec"]
        TaxonomyCodec["TaxonomyCodec"]
        SharedCodecSchema["SharedCodecSchema"]
        SessionCodec["SessionCodec[projection]"]
        RequirementsCodec["RequirementsCodec"]
        ReportingCodecs["ReportingCodecs"]
        ReferenceDocumentCodec["ReferenceDocumentCodec"]
        PrChangesCodec["PrChangesCodec"]
        PlanningCodecs["PlanningCodecs"]
        PatternsCodec["PatternsCodec[projection]"]
        DocumentCodecs["DocumentCodecs"]
        IndexCodec["IndexCodec"]
        RichContentHelpers["RichContentHelpers"]
        MermaidDiagramUtils["MermaidDiagramUtils"]
        DesignReviewCodec["DesignReviewCodec[projection]"]
        DecisionDocCodec["DecisionDocCodec[projection]"]
        CompositeCodec["CompositeCodec[projection]"]
        ClaudeModuleCodec["ClaudeModuleCodec"]
        BusinessRulesCodec["BusinessRulesCodec"]
        ArchitectureCodec["ArchitectureCodec[projection]"]
        AdrDocumentCodec["AdrDocumentCodec"]
        CodecBaseOptions["CodecBaseOptions"]
    end
    subgraph scanner["Scanner BC"]
        Pattern_Scanner["Pattern Scanner[infrastructure]"]
        GherkinScanner["GherkinScanner[infrastructure]"]
        GherkinASTParser["GherkinASTParser[infrastructure]"]
        TypeScript_AST_Parser["TypeScript AST Parser[infrastructure]"]
    end
    subgraph taxonomy["Taxonomy BC"]
        StatusValues["StatusValues"]
        RiskLevels["RiskLevels"]
        TagRegistryBuilder["TagRegistryBuilder[service]"]
        NormalizedStatus["NormalizedStatus"]
        LayerTypes["LayerTypes"]
        HierarchyLevels["HierarchyLevels"]
        FormatTypes["FormatTypes"]
        DeliverableStatusTaxonomy["DeliverableStatusTaxonomy"]
        CategoryDefinitions["CategoryDefinitions[read-model]"]
        CategoryDefinition["CategoryDefinition"]
    end
    subgraph types["Types BC"]
        ResultMonadTypes["ResultMonadTypes"]
        ErrorFactoryTypes["ErrorFactoryTypes"]
    end
    subgraph validation["Validation BC"]
        DoDValidationTypes["DoDValidationTypes"]
        ValidationModule["ValidationModule"]
        DoDValidator["DoDValidator[service]"]
        AntiPatternDetector["AntiPatternDetector[service]"]
        FSMValidator["FSMValidator[decider]"]
        FSMTransitions["FSMTransitions[read-model]"]
        FSMStates["FSMStates[read-model]"]
        FSMModule["FSMModule"]
    end
    subgraph shared["Shared Infrastructure"]
        Convention_Annotation_Example___DD_3_Decision["Convention Annotation Example — DD-3 Decision[decider]"]
        DoDValidationTypes["DoDValidationTypes"]
        ValidationModule["ValidationModule"]
        ResultMonadTypes["ResultMonadTypes"]
        ErrorFactoryTypes["ErrorFactoryTypes"]
        RenderableUtils["RenderableUtils"]
        SectionBlock["SectionBlock"]
        RenderableDocumentModel_RDM_["RenderableDocumentModel(RDM)"]
        StatusValues["StatusValues"]
        RiskLevels["RiskLevels"]
        NormalizedStatus["NormalizedStatus"]
        LayerTypes["LayerTypes"]
        HierarchyLevels["HierarchyLevels"]
        FormatTypes["FormatTypes"]
        DeliverableStatusTaxonomy["DeliverableStatusTaxonomy"]
        CategoryDefinition["CategoryDefinition"]
        LintModule["LintModule"]
        ShapeExtractor["ShapeExtractor"]
        LayerInference["LayerInference"]
        WarningCollector["WarningCollector"]
        GeneratorTypes["GeneratorTypes"]
        SourceMappingValidator["SourceMappingValidator"]
        GeneratorRegistry["GeneratorRegistry"]
        CLIVersionHelper["CLIVersionHelper"]
        ValidatePatternsCLI["ValidatePatternsCLI"]
        LintProcessCLI["LintProcessCLI"]
        LintPatternsCLI["LintPatternsCLI"]
        TagTaxonomyCLI["TagTaxonomyCLI"]
        Documentation_Generator_CLI["Documentation Generator CLI"]
        CLIErrorHandler["CLIErrorHandler"]
        ProcessStateTypes["ProcessStateTypes"]
        StubResolverImpl["StubResolverImpl"]
        RulesQueryModule["RulesQueryModule"]
        APIModule["APIModule"]
        FSMModule["FSMModule"]
        ValidationRulesCodec["ValidationRulesCodec"]
        TimelineCodec["TimelineCodec"]
        TaxonomyCodec["TaxonomyCodec"]
        SharedCodecSchema["SharedCodecSchema"]
        RequirementsCodec["RequirementsCodec"]
        ReportingCodecs["ReportingCodecs"]
        ReferenceDocumentCodec["ReferenceDocumentCodec"]
        PrChangesCodec["PrChangesCodec"]
        PlanningCodecs["PlanningCodecs"]
        DocumentCodecs["DocumentCodecs"]
        IndexCodec["IndexCodec"]
        RichContentHelpers["RichContentHelpers"]
        ClaudeModuleCodec["ClaudeModuleCodec"]
        BusinessRulesCodec["BusinessRulesCodec"]
        AdrDocumentCodec["AdrDocumentCodec"]
        ProcessGuardTypes["ProcessGuardTypes"]
        ProcessGuardModule["ProcessGuardModule"]
        DetectChanges["DetectChanges"]
        DeriveProcessState["DeriveProcessState"]
        ReferenceGeneratorRegistration["ReferenceGeneratorRegistration"]
        BuiltInGenerators["BuiltInGenerators"]
        CodecGeneratorRegistration["CodecGeneratorRegistration"]
        MergePatterns["MergePatterns"]
        PipelineModule["PipelineModule"]
        PipelineFactory["PipelineFactory"]
        CodecBaseOptions["CodecBaseOptions"]
        ADR006SingleReadModelArchitecture["ADR006SingleReadModelArchitecture"]
        ADR005CodecBasedMarkdownRendering["ADR005CodecBasedMarkdownRendering"]
        ADR003SourceFirstPatternArchitecture["ADR003SourceFirstPatternArchitecture"]
        ADR002GherkinOnlyTesting["ADR002GherkinOnlyTesting"]
        ADR001TaxonomyCanonicalValues["ADR001TaxonomyCanonicalValues"]
        ValidatorReadModelConsolidation["ValidatorReadModelConsolidation"]
        StepDefinitionCompletion["StepDefinitionCompletion"]
        SessionGuidesModuleSource["SessionGuidesModuleSource"]
        SessionFileCleanup["SessionFileCleanup"]
        ProcessAPILayeredExtraction["ProcessAPILayeredExtraction"]
        OrchestratorPipelineFactoryMigration["OrchestratorPipelineFactoryMigration"]
        MvpWorkflowImplementation["MvpWorkflowImplementation"]
        LivingRoadmapCLI["LivingRoadmapCLI"]
        EffortVarianceTracking["EffortVarianceTracking"]
        ConfigBasedWorkflowDefinition["ConfigBasedWorkflowDefinition"]
        CliBehaviorTesting["CliBehaviorTesting"]
        StringUtils["StringUtils"]
        FileCacheTesting["FileCacheTesting"]
        ProcessGuardTesting["ProcessGuardTesting"]
        TagRegistryBuilderTesting["TagRegistryBuilderTesting"]
        ResultMonad["ResultMonad"]
        NormalizedStatusTesting["NormalizedStatusTesting"]
        ErrorFactories["ErrorFactories"]
        DeliverableStatusTaxonomyTesting["DeliverableStatusTaxonomyTesting"]
        SessionHandoffs["SessionHandoffs"]
        SessionFileLifecycle["SessionFileLifecycle"]
        KebabCaseSlugs["KebabCaseSlugs"]
        ErrorHandlingUnification["ErrorHandlingUnification"]
    end
    DoDValidator --> DoDValidationTypes
    DoDValidator --> DualSourceExtractor
    AntiPatternDetector --> DoDValidationTypes
    ResultMonadTypes ..-> ResultMonad
    ErrorFactoryTypes ..-> ErrorFactories
    GherkinScanner --> GherkinASTParser
    SectionBlock ..-> RenderableDocument
    CategoryDefinition ..-> CategoryDefinitions
    LintModule --> LintRules
    LintModule --> LintEngine
    LintEngine --> LintRules
    GherkinExtractor --> GherkinASTParser
    DualSourceExtractor --> GherkinExtractor
    DualSourceExtractor --> GherkinScanner
    Document_Extractor --> Pattern_Scanner
    ConfigResolver --> ProjectConfigTypes
    ConfigResolver --> DeliveryProcessFactory
    ConfigResolver --> ConfigurationDefaults
    RegexBuilders --> ConfigurationTypes
    ProjectConfigTypes --> ConfigurationTypes
    ProjectConfigTypes --> ConfigurationPresets
    ProjectConfigSchema --> ProjectConfigTypes
    ConfigurationPresets --> ConfigurationTypes
    SourceMerger --> ProjectConfigTypes
    DeliveryProcessFactory --> ConfigurationTypes
    DeliveryProcessFactory --> ConfigurationPresets
    DeliveryProcessFactory --> RegexBuilders
    DefineConfig --> ProjectConfigTypes
    ConfigLoader --> DeliveryProcessFactory
    ConfigLoader --> ConfigurationTypes
    SourceMapper -.-> DecisionDocCodec
    SourceMapper -.-> ShapeExtractor
    SourceMapper -.-> GherkinASTParser
    GeneratorRegistry --> GeneratorTypes
    Documentation_Generation_Orchestrator --> Pattern_Scanner
    ValidatePatternsCLI --> GherkinScanner
    ValidatePatternsCLI --> GherkinExtractor
    ValidatePatternsCLI --> MasterDataset
    ReplMode --> PipelineFactory
    ReplMode --> ProcessStateAPI
    ProcessAPICLIImpl --> ProcessStateAPI
    ProcessAPICLIImpl --> MasterDataset
    ProcessAPICLIImpl --> PipelineFactory
    ProcessAPICLIImpl --> RulesQueryModule
    ProcessAPICLIImpl --> PatternSummarizerImpl
    ProcessAPICLIImpl --> FuzzyMatcherImpl
    ProcessAPICLIImpl --> OutputPipelineImpl
    OutputPipelineImpl --> PatternSummarizerImpl
    LintProcessCLI --> ProcessGuardModule
    LintPatternsCLI --> LintEngine
    LintPatternsCLI --> LintRules
    TagTaxonomyCLI --> ConfigLoader
    DatasetCache --> PipelineFactory
    PatternSummarizerImpl --> ProcessStateAPI
    StubResolverImpl --> ProcessStateAPI
    ScopeValidatorImpl --> ProcessStateAPI
    ScopeValidatorImpl --> MasterDataset
    ScopeValidatorImpl --> StubResolverImpl
    RulesQueryModule --> BusinessRulesCodec
    RulesQueryModule ..-> ProcessAPILayeredExtraction
    ProcessStateAPI --> MasterDataset
    ProcessStateAPI --> FSMValidator
    HandoffGeneratorImpl --> ProcessStateAPI
    HandoffGeneratorImpl --> MasterDataset
    HandoffGeneratorImpl --> ContextFormatterImpl
    CoverageAnalyzerImpl --> Pattern_Scanner
    CoverageAnalyzerImpl --> MasterDataset
    ContextFormatterImpl --> ContextAssemblerImpl
    ContextAssemblerImpl --> ProcessStateAPI
    ContextAssemblerImpl --> MasterDataset
    ContextAssemblerImpl --> PatternSummarizerImpl
    ContextAssemblerImpl --> FuzzyMatcherImpl
    ContextAssemblerImpl --> StubResolverImpl
    ArchQueriesImpl --> ProcessStateAPI
    ArchQueriesImpl --> MasterDataset
    FSMValidator --> FSMTransitions
    FSMValidator --> FSMStates
    DesignReviewCodec --> MasterDataset
    DesignReviewCodec --> MermaidDiagramUtils
    ArchitectureCodec --> MasterDataset
    DetectChanges --> DeriveProcessState
    DeriveProcessState --> GherkinScanner
    DeriveProcessState --> FSMValidator
    ProcessGuardDecider --> FSMValidator
    ProcessGuardDecider --> DeriveProcessState
    ProcessGuardDecider --> DetectChanges
    BuiltInGenerators --> GeneratorRegistry
    BuiltInGenerators --> CodecBasedGenerator
    DesignReviewGenerator --> DesignReviewCodec
    DesignReviewGenerator --> MasterDataset
    DecisionDocGenerator -.-> DecisionDocCodec
    DecisionDocGenerator -.-> SourceMapper
    CodecGeneratorRegistration --> DesignReviewGenerator
    CodecGeneratorRegistration --> DecisionDocGenerator
    CodecGeneratorRegistration --> ProcessApiReferenceGenerator
    CodecGeneratorRegistration --> CliRecipeGenerator
    TransformDataset --> MasterDataset
    SequenceTransformUtils --> MasterDataset
    MergePatterns --> PatternHelpers
    MergePatterns ..-> OrchestratorPipelineFactoryMigration
    PipelineModule --> TransformDataset
    PipelineFactory --> GherkinScanner
    PipelineFactory --> GherkinExtractor
    PipelineFactory --> MasterDataset
    PipelineFactory ..-> ProcessAPILayeredExtraction
    ADR006SingleReadModelArchitecture -.-> ADR005CodecBasedMarkdownRendering
    ADR003SourceFirstPatternArchitecture -.-> ADR001TaxonomyCanonicalValues
    ValidatorReadModelConsolidation -.-> ADR006SingleReadModelArchitecture
    StepDefinitionCompletion -.-> ADR002GherkinOnlyTesting
    SessionFileCleanup -.-> SessionFileLifecycle
    ProcessAPILayeredExtraction -.-> ValidatorReadModelConsolidation
    OrchestratorPipelineFactoryMigration -.-> ProcessAPILayeredExtraction
    LivingRoadmapCLI -.-> MvpWorkflowImplementation
    EffortVarianceTracking -.-> MvpWorkflowImplementation
    ConfigBasedWorkflowDefinition -.-> MvpWorkflowImplementation
    CliBehaviorTesting -.-> ADR002GherkinOnlyTesting
    ProcessGuardTesting -.-> AntiPatternDetector
    KebabCaseSlugs -.-> StringUtils
    ErrorHandlingUnification -.-> ResultMonad
    ErrorHandlingUnification -.-> ErrorFactories
```

---

## Legend

| Arrow Style | Relationship | Description                              |
| ----------- | ------------ | ---------------------------------------- |
| `-->`       | uses         | Direct dependency (solid arrow)          |
| `-.->`      | depends-on   | Weak dependency (dashed arrow)           |
| `..->`      | implements   | Realization relationship (dotted arrow)  |
| `-->>`      | extends      | Generalization relationship (open arrow) |

---

## Component Inventory

All components with architecture annotations:

| Component                                                         | Context    | Role           | Layer          | Source File                                                                  |
| ----------------------------------------------------------------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------- |
| 🚧 Pattern Helpers                                                | api        | -              | domain         | src/api/pattern-helpers.ts                                                   |
| ✅ Master Dataset                                                 | api        | read-model     | domain         | src/validation-schemas/master-dataset.ts                                     |
| 🚧 Arch Queries Impl                                              | api        | service        | domain         | src/api/arch-queries.ts                                                      |
| 🚧 Context Assembler Impl                                         | api        | service        | application    | src/api/context-assembler.ts                                                 |
| 🚧 Context Formatter Impl                                         | api        | service        | application    | src/api/context-formatter.ts                                                 |
| 🚧 Coverage Analyzer Impl                                         | api        | service        | application    | src/api/coverage-analyzer.ts                                                 |
| 🚧 Fuzzy Matcher Impl                                             | api        | service        | application    | src/api/fuzzy-match.ts                                                       |
| ✅ Handoff Generator Impl                                         | api        | service        | application    | src/api/handoff-generator.ts                                                 |
| 🚧 Pattern Summarizer Impl                                        | api        | service        | application    | src/api/summarize.ts                                                         |
| 🚧 Process State API                                              | api        | service        | application    | src/api/process-state.ts                                                     |
| ✅ Scope Validator Impl                                           | api        | service        | application    | src/api/scope-validator.ts                                                   |
| ✅ CLI Schema                                                     | cli        | -              | domain         | src/cli/cli-schema.ts                                                        |
| 🚧 Dataset Cache                                                  | cli        | infrastructure | infrastructure | src/cli/dataset-cache.ts                                                     |
| 🚧 Output Pipeline Impl                                           | cli        | service        | application    | src/cli/output-pipeline.ts                                                   |
| 🚧 Process API CLI Impl                                           | cli        | service        | application    | src/cli/process-api.ts                                                       |
| 🚧 Repl Mode                                                      | cli        | service        | application    | src/cli/repl.ts                                                              |
| ✅ Configuration Defaults                                         | config     | -              | domain         | src/config/defaults.ts                                                       |
| ✅ Configuration Presets                                          | config     | -              | domain         | src/config/presets.ts                                                        |
| ✅ Configuration Types                                            | config     | -              | domain         | src/config/types.ts                                                          |
| 🚧 Project Config Types                                           | config     | -              | domain         | src/config/project-config.ts                                                 |
| ✅ Config Loader                                                  | config     | infrastructure | infrastructure | src/config/config-loader.ts                                                  |
| 🚧 Define Config                                                  | config     | infrastructure | infrastructure | src/config/define-config.ts                                                  |
| 🚧 Project Config Schema                                          | config     | infrastructure | infrastructure | src/config/project-config-schema.ts                                          |
| ✅ Regex Builders                                                 | config     | infrastructure | infrastructure | src/config/regex-builders.ts                                                 |
| ✅ Workflow Loader                                                | config     | infrastructure | infrastructure | src/config/workflow-loader.ts                                                |
| 🚧 Config Resolver                                                | config     | service        | application    | src/config/resolve-config.ts                                                 |
| ✅ Delivery Process Factory                                       | config     | service        | application    | src/config/factory.ts                                                        |
| 🚧 Source Merger                                                  | config     | service        | application    | src/config/merge-sources.ts                                                  |
| ✅ Document Extractor                                             | extractor  | service        | application    | src/extractor/doc-extractor.ts                                               |
| ✅ Dual Source Extractor                                          | extractor  | service        | application    | src/extractor/dual-source-extractor.ts                                       |
| ✅ Gherkin Extractor                                              | extractor  | service        | application    | src/extractor/gherkin-extractor.ts                                           |
| Cli Recipe Generator                                              | generator  | -              | application    | src/generators/built-in/cli-recipe-generator.ts                              |
| ✅ Context Inference Impl                                         | generator  | -              | application    | src/generators/pipeline/context-inference.ts                                 |
| 🚧 Git Branch Diff                                                | generator  | -              | infrastructure | src/git/branch-diff.ts                                                       |
| 🚧 Git Module                                                     | generator  | -              | infrastructure | src/git/index.ts                                                             |
| 🚧 Git Name Status Parser                                         | generator  | -              | infrastructure | src/git/name-status.ts                                                       |
| ✅ Process Api Reference Generator                                | generator  | -              | application    | src/generators/built-in/process-api-reference-generator.ts                   |
| 🚧 Transform Types                                                | generator  | -              | application    | src/generators/pipeline/transform-types.ts                                   |
| ✅ Content Deduplicator                                           | generator  | infrastructure | infrastructure | src/generators/content-deduplicator.ts                                       |
| 🚧 File Cache                                                     | generator  | infrastructure | infrastructure | src/cache/file-cache.ts                                                      |
| ✅ Source Mapper                                                  | generator  | infrastructure | infrastructure | src/generators/source-mapper.ts                                              |
| ✅ Codec Based Generator                                          | generator  | service        | application    | src/generators/codec-based.ts                                                |
| ✅ Decision Doc Generator                                         | generator  | service        | application    | src/generators/built-in/decision-doc-generator.ts                            |
| 🚧 Design Review Generator                                        | generator  | service        | application    | src/generators/built-in/design-review-generator.ts                           |
| ✅ Documentation Generation Orchestrator                          | generator  | service        | application    | src/generators/orchestrator.ts                                               |
| 🚧 Relationship Resolver                                          | generator  | service        | application    | src/generators/pipeline/relationship-resolver.ts                             |
| 🚧 Sequence Transform Utils                                       | generator  | service        | application    | src/generators/pipeline/sequence-utils.ts                                    |
| ✅ Transform Dataset                                              | generator  | service        | application    | src/generators/pipeline/transform-dataset.ts                                 |
| 🚧 Process Guard Decider                                          | lint       | decider        | application    | src/lint/process-guard/decider.ts                                            |
| ✅ Lint Engine                                                    | lint       | service        | application    | src/lint/engine.ts                                                           |
| ✅ Lint Rules                                                     | lint       | service        | application    | src/lint/rules.ts                                                            |
| loadPreambleFromMarkdown — Shared Markdown-to-SectionBlock Parser | renderer   | -              | domain         | src/renderable/load-preamble.ts                                              |
| ✅ Mermaid Diagram Utils                                          | renderer   | -              | -              | src/renderable/codecs/diagram-utils.ts                                       |
| ✅ Architecture Codec                                             | renderer   | projection     | application    | src/renderable/codecs/architecture.ts                                        |
| 🚧 Composite Codec                                                | renderer   | projection     | application    | src/renderable/codecs/composite.ts                                           |
| ✅ Decision Doc Codec                                             | renderer   | projection     | application    | src/renderable/codecs/decision-doc.ts                                        |
| 🚧 Design Review Codec                                            | renderer   | projection     | application    | src/renderable/codecs/design-review.ts                                       |
| ✅ Patterns Codec                                                 | renderer   | projection     | application    | src/renderable/codecs/patterns.ts                                            |
| ✅ Session Codec                                                  | renderer   | projection     | application    | src/renderable/codecs/session.ts                                             |
| ✅ Renderable Document                                            | renderer   | read-model     | domain         | src/renderable/schema.ts                                                     |
| ✅ Document Generator                                             | renderer   | service        | application    | src/renderable/generate.ts                                                   |
| ✅ Universal Renderer                                             | renderer   | service        | application    | src/renderable/render.ts                                                     |
| ✅ Gherkin AST Parser                                             | scanner    | infrastructure | infrastructure | src/scanner/gherkin-ast-parser.ts                                            |
| ✅ Gherkin Scanner                                                | scanner    | infrastructure | infrastructure | src/scanner/gherkin-scanner.ts                                               |
| ✅ Pattern Scanner                                                | scanner    | infrastructure | infrastructure | src/scanner/pattern-scanner.ts                                               |
| ✅ TypeScript AST Parser                                          | scanner    | infrastructure | infrastructure | src/scanner/ast-parser.ts                                                    |
| ✅ Category Definitions                                           | taxonomy   | read-model     | domain         | src/taxonomy/categories.ts                                                   |
| ✅ Tag Registry Builder                                           | taxonomy   | service        | domain         | src/taxonomy/registry-builder.ts                                             |
| 🚧 FSM Validator                                                  | validation | decider        | application    | src/validation/fsm/validator.ts                                              |
| 🚧 FSM States                                                     | validation | read-model     | domain         | src/validation/fsm/states.ts                                                 |
| 🚧 FSM Transitions                                                | validation | read-model     | domain         | src/validation/fsm/transitions.ts                                            |
| ✅ Anti Pattern Detector                                          | validation | service        | application    | src/validation/anti-patterns.ts                                              |
| ✅ DoD Validator                                                  | validation | service        | application    | src/validation/dod-validator.ts                                              |
| 📋 ADR 001 Taxonomy Canonical Values                              | -          | -              | -              | delivery-process/decisions/adr-001-taxonomy-canonical-values.feature         |
| ✅ ADR 002 Gherkin Only Testing                                   | -          | -              | -              | delivery-process/decisions/adr-002-gherkin-only-testing.feature              |
| 📋 ADR 003 Source First Pattern Architecture                      | -          | -              | -              | delivery-process/decisions/adr-003-source-first-pattern-architecture.feature |
| ✅ ADR 005 Codec Based Markdown Rendering                         | -          | -              | -              | delivery-process/decisions/adr-005-codec-based-markdown-rendering.feature    |
| ✅ ADR 006 Single Read Model Architecture                         | -          | -              | -              | delivery-process/decisions/adr-006-single-read-model-architecture.feature    |
| ✅ Adr Document Codec                                             | -          | -              | -              | src/renderable/codecs/adr.ts                                                 |
| 🚧 API Module                                                     | -          | -              | -              | src/api/index.ts                                                             |
| ✅ Built In Generators                                            | -          | -              | -              | src/generators/built-in/index.ts                                             |
| ✅ Business Rules Codec                                           | -          | -              | -              | src/renderable/codecs/business-rules.ts                                      |
| CategoryDefinition                                                | -          | -              | -              | src/taxonomy/categories.ts                                                   |
| 🚧 Claude Module Codec                                            | -          | -              | -              | src/renderable/codecs/claude-module.ts                                       |
| 📋 Cli Behavior Testing                                           | -          | -              | -              | delivery-process/specs/cli-behavior-testing.feature                          |
| ✅ CLI Error Handler                                              | -          | -              | -              | src/cli/error-handler.ts                                                     |
| ✅ CLI Version Helper                                             | -          | -              | -              | src/cli/version.ts                                                           |
| ✅ Codec Base Options                                             | -          | -              | -              | src/renderable/codecs/types/base.ts                                          |
| ✅ Codec Generator Registration                                   | -          | -              | -              | src/generators/built-in/codec-generators.ts                                  |
| ✅ Config Based Workflow Definition                               | -          | -              | -              | delivery-process/specs/config-based-workflow-definition.feature              |
| 🚧 Deliverable Status Taxonomy                                    | -          | -              | -              | src/taxonomy/deliverable-status.ts                                           |
| 🚧 Deliverable Status Taxonomy Testing                            | -          | -              | -              | tests/features/types/deliverable-status.feature                              |
| 🚧 Derive Process State                                           | -          | -              | -              | src/lint/process-guard/derive-state.ts                                       |
| 🚧 Detect Changes                                                 | -          | -              | -              | src/lint/process-guard/detect-changes.ts                                     |
| ✅ Documentation Generator CLI                                    | -          | -              | -              | src/cli/generate-docs.ts                                                     |
| ✅ Document Codecs                                                | -          | -              | -              | src/renderable/codecs/index.ts                                               |
| ✅ DoD Validation Types                                           | -          | -              | -              | src/validation/types.ts                                                      |
| 📋 Effort Variance Tracking                                       | -          | -              | -              | delivery-process/specs/effort-variance-tracking.feature                      |
| ✅ Error Factories                                                | -          | -              | -              | tests/features/types/error-factories.feature                                 |
| ✅ Error Factory Types                                            | -          | -              | -              | src/types/errors.ts                                                          |
| ✅ Error Handling Unification                                     | -          | -              | -              | tests/features/behavior/error-handling.feature                               |
| 🚧 File Cache Testing                                             | -          | -              | -              | tests/features/utils/file-cache.feature                                      |
| ✅ Format Types                                                   | -          | -              | -              | src/taxonomy/format-types.ts                                                 |
| 🚧 FSM Module                                                     | -          | -              | -              | src/validation/fsm/index.ts                                                  |
| ✅ Generator Registry                                             | -          | -              | -              | src/generators/registry.ts                                                   |
| ✅ Generator Types                                                | -          | -              | -              | src/generators/types.ts                                                      |
| ✅ Hierarchy Levels                                               | -          | -              | -              | src/taxonomy/hierarchy-levels.ts                                             |
| ✅ Index Codec                                                    | -          | -              | -              | src/renderable/codecs/index-codec.ts                                         |
| ✅ Kebab Case Slugs                                               | -          | -              | -              | tests/features/behavior/kebab-case-slugs.feature                             |
| ✅ Layer Inference                                                | -          | -              | -              | src/extractor/layer-inference.ts                                             |
| ✅ Layer Types                                                    | -          | -              | -              | src/taxonomy/layer-types.ts                                                  |
| ✅ Lint Module                                                    | -          | -              | -              | src/lint/index.ts                                                            |
| ✅ Lint Patterns CLI                                              | -          | -              | -              | src/cli/lint-patterns.ts                                                     |
| 🚧 Lint Process CLI                                               | -          | -              | -              | src/cli/lint-process.ts                                                      |
| 📋 Living Roadmap CLI                                             | -          | -              | -              | delivery-process/specs/living-roadmap-cli.feature                            |
| ✅ Merge Patterns                                                 | -          | -              | -              | src/generators/pipeline/merge-patterns.ts                                    |
| ✅ Mvp Workflow Implementation                                    | -          | -              | -              | delivery-process/specs/mvp-workflow-implementation.feature                   |
| ✅ Normalized Status                                              | -          | -              | -              | src/taxonomy/normalized-status.ts                                            |
| 🚧 Normalized Status Testing                                      | -          | -              | -              | tests/features/types/normalized-status.feature                               |
| ✅ Orchestrator Pipeline Factory Migration                        | -          | -              | -              | delivery-process/specs/orchestrator-pipeline-factory-migration.feature       |
| ✅ Pipeline Factory                                               | -          | -              | -              | src/generators/pipeline/build-pipeline.ts                                    |
| ✅ Pipeline Module                                                | -          | -              | -              | src/generators/pipeline/index.ts                                             |
| ✅ Planning Codecs                                                | -          | -              | -              | src/renderable/codecs/planning.ts                                            |
| ✅ Pr Changes Codec                                               | -          | -              | -              | src/renderable/codecs/pr-changes.ts                                          |
| ✅ Process API Layered Extraction                                 | -          | -              | -              | delivery-process/specs/process-api-layered-extraction.feature                |
| 🚧 Process Guard Module                                           | -          | -              | -              | src/lint/process-guard/index.ts                                              |
| ✅ Process Guard Testing                                          | -          | -              | -              | tests/features/validation/process-guard.feature                              |
| 🚧 Process Guard Types                                            | -          | -              | -              | src/lint/process-guard/types.ts                                              |
| 🚧 Process State Types                                            | -          | -              | -              | src/api/types.ts                                                             |
| 🚧 Reference Document Codec                                       | -          | -              | -              | src/renderable/codecs/reference.ts                                           |
| 🚧 Reference Generator Registration                               | -          | -              | -              | src/generators/built-in/reference-generators.ts                              |
| ✅ Renderable Document Model(RDM)                                 | -          | -              | -              | src/renderable/index.ts                                                      |
| ✅ Renderable Utils                                               | -          | -              | -              | src/renderable/utils.ts                                                      |
| ✅ Reporting Codecs                                               | -          | -              | -              | src/renderable/codecs/reporting.ts                                           |
| ✅ Requirements Codec                                             | -          | -              | -              | src/renderable/codecs/requirements.ts                                        |
| ✅ Result Monad                                                   | -          | -              | -              | tests/features/types/result-monad.feature                                    |
| ✅ Result Monad Types                                             | -          | -              | -              | src/types/result.ts                                                          |
| ✅ Rich Content Helpers                                           | -          | -              | -              | src/renderable/codecs/helpers.ts                                             |
| ✅ Risk Levels                                                    | -          | -              | -              | src/taxonomy/risk-levels.ts                                                  |
| ✅ Rules Query Module                                             | -          | -              | -              | src/api/rules-query.ts                                                       |
| SectionBlock                                                      | -          | -              | -              | src/renderable/schema.ts                                                     |
| 📋 Session File Cleanup                                           | -          | -              | -              | delivery-process/specs/session-file-cleanup.feature                          |
| ✅ Session File Lifecycle                                         | -          | -              | -              | tests/features/behavior/session-file-lifecycle.feature                       |
| ✅ Session Guides Module Source                                   | -          | -              | -              | delivery-process/specs/session-guides-module-source.feature                  |
| ✅ Session Handoffs                                               | -          | -              | -              | tests/features/behavior/session-handoffs.feature                             |
| ✅ Shape Extractor                                                | -          | -              | -              | src/extractor/shape-extractor.ts                                             |
| ✅ Shared Codec Schema                                            | -          | -              | -              | src/renderable/codecs/shared-schema.ts                                       |
| ✅ Source Mapping Validator                                       | -          | -              | -              | src/generators/source-mapping-validator.ts                                   |
| ✅ Status Values                                                  | -          | -              | -              | src/taxonomy/status-values.ts                                                |
| 📋 Step Definition Completion                                     | -          | -              | -              | delivery-process/specs/step-definition-completion.feature                    |
| ✅ String Utils                                                   | -          | -              | -              | tests/features/utils/string-utils.feature                                    |
| 🚧 Stub Resolver Impl                                             | -          | -              | -              | src/api/stub-resolver.ts                                                     |
| 🚧 Tag Registry Builder Testing                                   | -          | -              | -              | tests/features/types/tag-registry-builder.feature                            |
| ⏸️ Tag Taxonomy CLI                                               | -          | -              | -              | src/cli/generate-tag-taxonomy.ts                                             |
| ✅ Taxonomy Codec                                                 | -          | -              | -              | src/renderable/codecs/taxonomy.ts                                            |
| ✅ Timeline Codec                                                 | -          | -              | -              | src/renderable/codecs/timeline.ts                                            |
| ✅ Validate Patterns CLI                                          | -          | -              | -              | src/cli/validate-patterns.ts                                                 |
| ✅ Validation Module                                              | -          | -              | -              | src/validation/index.ts                                                      |
| ✅ Validation Rules Codec                                         | -          | -              | -              | src/renderable/codecs/validation-rules.ts                                    |
| ✅ Validator Read Model Consolidation                             | -          | -              | -              | delivery-process/specs/validator-read-model-consolidation.feature            |
| ✅ Warning Collector                                              | -          | -              | -              | src/generators/warning-collector.ts                                          |
| 📋 Convention Annotation Example — DD-3 Decision                  | -          | decider        | -              | delivery-process/stubs/error-guide-codec/convention-annotation-example.ts    |
