# Architecture

**Purpose:** Auto-generated architecture diagram from source annotations
**Detail Level:** Component diagram with bounded context subgraphs

---

## Overview

This diagram was auto-generated from 107 annotated source files across 10 bounded contexts.

| Metric | Count |
| --- | --- |
| Total Components | 107 |
| Bounded Contexts | 10 |
| Component Roles | 5 |

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
        ProcessAPICLIImpl["ProcessAPICLIImpl[service]"]
        OutputPipelineImpl["OutputPipelineImpl[service]"]
        LintProcessCLI["LintProcessCLI"]
        LintPatternsCLI["LintPatternsCLI"]
        TagTaxonomyCLI["TagTaxonomyCLI"]
        Documentation_Generator_CLI["Documentation Generator CLI"]
        CLIErrorHandler["CLIErrorHandler"]
    end
    subgraph config["Config BC"]
        WorkflowLoader["WorkflowLoader"]
        ConfigurationTypes["ConfigurationTypes"]
        RegexBuilders["RegexBuilders"]
        ConfigurationPresets["ConfigurationPresets"]
        DeliveryProcessFactory["DeliveryProcessFactory[service]"]
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
        WarningCollector["WarningCollector"]
        GeneratorTypes["GeneratorTypes"]
        SourceMappingValidator["SourceMappingValidator"]
        SourceMapper["SourceMapper[infrastructure]"]
        GeneratorRegistry["GeneratorRegistry"]
        Documentation_Generation_Orchestrator["Documentation Generation Orchestrator[service]"]
        ContentDeduplicator["ContentDeduplicator[infrastructure]"]
        CodecBasedGenerator["CodecBasedGenerator[service]"]
        FileCache["FileCache[infrastructure]"]
        TransformDataset["TransformDataset[service]"]
        PipelineModule["PipelineModule"]
        BuiltInGenerators["BuiltInGenerators"]
        DecisionDocGenerator["DecisionDocGenerator[service]"]
        CodecGeneratorRegistration["CodecGeneratorRegistration"]
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
        UniversalRenderer["UniversalRenderer[service]"]
        RenderableDocumentModel_RDM_["RenderableDocumentModel(RDM)"]
        DocumentGenerator["DocumentGenerator[service]"]
        ValidationRulesCodec["ValidationRulesCodec"]
        TimelineCodec["TimelineCodec"]
        TaxonomyCodec["TaxonomyCodec"]
        SharedCodecSchema["SharedCodecSchema"]
        SessionCodec["SessionCodec[projection]"]
        RequirementsCodec["RequirementsCodec"]
        ReportingCodecs["ReportingCodecs"]
        PrChangesCodec["PrChangesCodec"]
        PlanningCodecs["PlanningCodecs"]
        PatternsCodec["PatternsCodec[projection]"]
        DocumentCodecs["DocumentCodecs"]
        RichContentHelpers["RichContentHelpers"]
        DecisionDocCodec["DecisionDocCodec[projection]"]
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
        CategoryDefinitions["CategoryDefinitions[read-model]"]
    end
    subgraph validation["Validation BC"]
        WorkflowConfigSchema["WorkflowConfigSchema"]
        Tag_Registry_Configuration["Tag Registry Configuration"]
        OutputSchemas["OutputSchemas"]
        ExtractedShapeSchema["ExtractedShapeSchema"]
        ExtractedPatternSchema["ExtractedPatternSchema"]
        DualSourceSchemas["DualSourceSchemas"]
        DocDirectiveSchema["DocDirectiveSchema"]
        CodecUtils["CodecUtils"]
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
        WorkflowConfigSchema["WorkflowConfigSchema"]
        Tag_Registry_Configuration["Tag Registry Configuration"]
        OutputSchemas["OutputSchemas"]
        ExtractedShapeSchema["ExtractedShapeSchema"]
        ExtractedPatternSchema["ExtractedPatternSchema"]
        DualSourceSchemas["DualSourceSchemas"]
        DocDirectiveSchema["DocDirectiveSchema"]
        CodecUtils["CodecUtils"]
        DoDValidationTypes["DoDValidationTypes"]
        ValidationModule["ValidationModule"]
        StatusValues["StatusValues"]
        RiskLevels["RiskLevels"]
        NormalizedStatus["NormalizedStatus"]
        LayerTypes["LayerTypes"]
        HierarchyLevels["HierarchyLevels"]
        FormatTypes["FormatTypes"]
        LintModule["LintModule"]
        WarningCollector["WarningCollector"]
        GeneratorTypes["GeneratorTypes"]
        SourceMappingValidator["SourceMappingValidator"]
        GeneratorRegistry["GeneratorRegistry"]
        ShapeExtractor["ShapeExtractor"]
        LayerInference["LayerInference"]
        WorkflowLoader["WorkflowLoader"]
        ConfigurationTypes["ConfigurationTypes"]
        RegexBuilders["RegexBuilders"]
        ConfigurationPresets["ConfigurationPresets"]
        ConfigurationDefaults["ConfigurationDefaults"]
        RenderableUtils["RenderableUtils"]
        RenderableDocumentModel_RDM_["RenderableDocumentModel(RDM)"]
        CLIVersionHelper["CLIVersionHelper"]
        ValidatePatternsCLI["ValidatePatternsCLI"]
        LintProcessCLI["LintProcessCLI"]
        LintPatternsCLI["LintPatternsCLI"]
        TagTaxonomyCLI["TagTaxonomyCLI"]
        Documentation_Generator_CLI["Documentation Generator CLI"]
        CLIErrorHandler["CLIErrorHandler"]
        ProcessStateTypes["ProcessStateTypes"]
        StubResolverImpl["StubResolverImpl"]
        APIModule["APIModule"]
        FSMModule["FSMModule"]
        ProcessGuardTypes["ProcessGuardTypes"]
        ProcessGuardModule["ProcessGuardModule"]
        DetectChanges["DetectChanges"]
        DeriveProcessState["DeriveProcessState"]
        PipelineModule["PipelineModule"]
        BuiltInGenerators["BuiltInGenerators"]
        CodecGeneratorRegistration["CodecGeneratorRegistration"]
        ValidationRulesCodec["ValidationRulesCodec"]
        TimelineCodec["TimelineCodec"]
        TaxonomyCodec["TaxonomyCodec"]
        SharedCodecSchema["SharedCodecSchema"]
        RequirementsCodec["RequirementsCodec"]
        ReportingCodecs["ReportingCodecs"]
        PrChangesCodec["PrChangesCodec"]
        PlanningCodecs["PlanningCodecs"]
        DocumentCodecs["DocumentCodecs"]
        RichContentHelpers["RichContentHelpers"]
        BusinessRulesCodec["BusinessRulesCodec"]
        AdrDocumentCodec["AdrDocumentCodec"]
        CodecBaseOptions["CodecBaseOptions"]
    end
    ExtractedPatternSchema --> DocDirectiveSchema
    DoDValidator --> DoDValidationTypes
    DoDValidator --> DualSourceExtractor
    AntiPatternDetector --> DoDValidationTypes
    GherkinScanner --> GherkinASTParser
    TypeScript_AST_Parser --> DocDirectiveSchema
    LintModule --> LintRules
    LintModule --> LintEngine
    LintEngine --> LintRules
    LintEngine --> CodecUtils
    SourceMapper -.-> DecisionDocCodec
    SourceMapper -.-> ShapeExtractor
    SourceMapper -.-> GherkinASTParser
    GeneratorRegistry --> GeneratorTypes
    Documentation_Generation_Orchestrator --> Pattern_Scanner
    GherkinExtractor --> GherkinASTParser
    DualSourceExtractor --> GherkinExtractor
    DualSourceExtractor --> GherkinScanner
    Document_Extractor --> Pattern_Scanner
    WorkflowLoader --> WorkflowConfigSchema
    WorkflowLoader --> CodecUtils
    RegexBuilders --> ConfigurationTypes
    ConfigurationPresets --> ConfigurationTypes
    DeliveryProcessFactory --> ConfigurationTypes
    DeliveryProcessFactory --> ConfigurationPresets
    DeliveryProcessFactory --> RegexBuilders
    ConfigLoader --> DeliveryProcessFactory
    ConfigLoader --> ConfigurationTypes
    ValidatePatternsCLI --> GherkinScanner
    ValidatePatternsCLI --> DualSourceExtractor
    ValidatePatternsCLI --> CodecUtils
    ProcessAPICLIImpl --> ProcessStateAPI
    ProcessAPICLIImpl --> MasterDataset
    ProcessAPICLIImpl --> Pattern_Scanner
    ProcessAPICLIImpl --> PatternSummarizerImpl
    ProcessAPICLIImpl --> FuzzyMatcherImpl
    ProcessAPICLIImpl --> OutputPipelineImpl
    OutputPipelineImpl --> PatternSummarizerImpl
    LintProcessCLI --> ProcessGuardModule
    LintPatternsCLI --> LintEngine
    LintPatternsCLI --> LintRules
    TagTaxonomyCLI --> ConfigLoader
    PatternSummarizerImpl --> ProcessStateAPI
    StubResolverImpl --> ProcessStateAPI
    ScopeValidatorImpl --> ProcessStateAPI
    ScopeValidatorImpl --> MasterDataset
    ScopeValidatorImpl --> StubResolverImpl
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
    DetectChanges --> DeriveProcessState
    TransformDataset --> MasterDataset
    PipelineModule --> TransformDataset
    BuiltInGenerators --> GeneratorRegistry
    BuiltInGenerators --> CodecBasedGenerator
    DecisionDocGenerator -.-> DecisionDocCodec
    DecisionDocGenerator -.-> SourceMapper
    ArchitectureCodec --> MasterDataset
```

---

## Legend

| Arrow Style | Relationship | Description |
| --- | --- | --- |
| `-->` | uses | Direct dependency (solid arrow) |
| `-.->`  | depends-on | Weak dependency (dashed arrow) |
| `..->`  | implements | Realization relationship (dotted arrow) |
| `-->>`  | extends | Generalization relationship (open arrow) |

---

## Component Inventory

All components with architecture annotations:

| Component | Context | Role | Layer | Source File |
| --- | --- | --- | --- | --- |
| 🚧 Pattern Helpers | api | - | domain | src/api/pattern-helpers.ts |
| ✅ Master Dataset | api | read-model | domain | src/validation-schemas/master-dataset.ts |
| 🚧 Arch Queries Impl | api | service | domain | src/api/arch-queries.ts |
| 🚧 Context Assembler Impl | api | service | application | src/api/context-assembler.ts |
| 🚧 Context Formatter Impl | api | service | application | src/api/context-formatter.ts |
| 🚧 Coverage Analyzer Impl | api | service | application | src/api/coverage-analyzer.ts |
| 🚧 Fuzzy Matcher Impl | api | service | application | src/api/fuzzy-match.ts |
| ✅ Handoff Generator Impl | api | service | application | src/api/handoff-generator.ts |
| 🚧 Pattern Summarizer Impl | api | service | application | src/api/summarize.ts |
| 🚧 Process State API | api | service | application | src/api/process-state.ts |
| ✅ Scope Validator Impl | api | service | application | src/api/scope-validator.ts |
| 🚧 Output Pipeline Impl | cli | service | application | src/cli/output-pipeline.ts |
| 🚧 Process API CLI Impl | cli | service | application | src/cli/process-api.ts |
| ✅ Config Loader | config | infrastructure | infrastructure | src/config/config-loader.ts |
| ✅ Delivery Process Factory | config | service | application | src/config/factory.ts |
| ✅ Document Extractor | extractor | service | application | src/extractor/doc-extractor.ts |
| ✅ Dual Source Extractor | extractor | service | application | src/extractor/dual-source-extractor.ts |
| ✅ Gherkin Extractor | extractor | service | application | src/extractor/gherkin-extractor.ts |
| ✅ Content Deduplicator | generator | infrastructure | infrastructure | src/generators/content-deduplicator.ts |
| 🚧 File Cache | generator | infrastructure | infrastructure | src/cache/file-cache.ts |
| ✅ Source Mapper | generator | infrastructure | infrastructure | src/generators/source-mapper.ts |
| ✅ Codec Based Generator | generator | service | application | src/generators/codec-based.ts |
| ✅ Decision Doc Generator | generator | service | application | src/generators/built-in/decision-doc-generator.ts |
| ✅ Documentation Generation Orchestrator | generator | service | application | src/generators/orchestrator.ts |
| ✅ Transform Dataset | generator | service | application | src/generators/pipeline/transform-dataset.ts |
| 🚧 Process Guard Decider | lint | decider | application | src/lint/process-guard/decider.ts |
| ✅ Lint Engine | lint | service | application | src/lint/engine.ts |
| ✅ Lint Rules | lint | service | application | src/lint/rules.ts |
| ✅ Architecture Codec | renderer | projection | application | src/renderable/codecs/architecture.ts |
| ✅ Decision Doc Codec | renderer | projection | application | src/renderable/codecs/decision-doc.ts |
| ✅ Patterns Codec | renderer | projection | application | src/renderable/codecs/patterns.ts |
| ✅ Session Codec | renderer | projection | application | src/renderable/codecs/session.ts |
| ✅ Renderable Document | renderer | read-model | domain | src/renderable/schema.ts |
| ✅ Document Generator | renderer | service | application | src/renderable/generate.ts |
| ✅ Universal Renderer | renderer | service | application | src/renderable/render.ts |
| ✅ Gherkin AST Parser | scanner | infrastructure | infrastructure | src/scanner/gherkin-ast-parser.ts |
| ✅ Gherkin Scanner | scanner | infrastructure | infrastructure | src/scanner/gherkin-scanner.ts |
| ✅ Pattern Scanner | scanner | infrastructure | infrastructure | src/scanner/pattern-scanner.ts |
| ✅ TypeScript AST Parser | scanner | infrastructure | infrastructure | src/scanner/ast-parser.ts |
| ✅ Category Definitions | taxonomy | read-model | domain | src/taxonomy/categories.ts |
| ✅ Tag Registry Builder | taxonomy | service | domain | src/taxonomy/registry-builder.ts |
| 🚧 FSM Validator | validation | decider | application | src/validation/fsm/validator.ts |
| 🚧 FSM States | validation | read-model | domain | src/validation/fsm/states.ts |
| 🚧 FSM Transitions | validation | read-model | domain | src/validation/fsm/transitions.ts |
| ✅ Anti Pattern Detector | validation | service | application | src/validation/anti-patterns.ts |
| ✅ DoD Validator | validation | service | application | src/validation/dod-validator.ts |
| ✅ Adr Document Codec | - | - | - | src/renderable/codecs/adr.ts |
| 🚧 API Module | - | - | - | src/api/index.ts |
| ✅ Built In Generators | - | - | - | src/generators/built-in/index.ts |
| ✅ Business Rules Codec | - | - | - | src/renderable/codecs/business-rules.ts |
| ✅ CLI Error Handler | - | - | - | src/cli/error-handler.ts |
| ✅ CLI Version Helper | - | - | - | src/cli/version.ts |
| ✅ Codec Base Options | - | - | - | src/renderable/codecs/types/base.ts |
| ✅ Codec Generator Registration | - | - | - | src/generators/built-in/codec-generators.ts |
| ✅ Codec Utils | - | - | - | src/validation-schemas/codec-utils.ts |
| ✅ Configuration Defaults | - | - | - | src/config/defaults.ts |
| ✅ Configuration Presets | - | - | - | src/config/presets.ts |
| ✅ Configuration Types | - | - | - | src/config/types.ts |
| 🚧 Derive Process State | - | - | - | src/lint/process-guard/derive-state.ts |
| 🚧 Detect Changes | - | - | - | src/lint/process-guard/detect-changes.ts |
| ✅ Doc Directive Schema | - | - | - | src/validation-schemas/doc-directive.ts |
| ✅ Documentation Generator CLI | - | - | - | src/cli/generate-docs.ts |
| ✅ Document Codecs | - | - | - | src/renderable/codecs/index.ts |
| ✅ DoD Validation Types | - | - | - | src/validation/types.ts |
| ✅ Dual Source Schemas | - | - | - | src/validation-schemas/dual-source.ts |
| ✅ Extracted Pattern Schema | - | - | - | src/validation-schemas/extracted-pattern.ts |
| ✅ Extracted Shape Schema | - | - | - | src/validation-schemas/extracted-shape.ts |
| ✅ Format Types | - | - | - | src/taxonomy/format-types.ts |
| 🚧 FSM Module | - | - | - | src/validation/fsm/index.ts |
| ✅ Generator Registry | - | - | - | src/generators/registry.ts |
| ✅ Generator Types | - | - | - | src/generators/types.ts |
| ✅ Hierarchy Levels | - | - | - | src/taxonomy/hierarchy-levels.ts |
| ✅ Layer Inference | - | - | - | src/extractor/layer-inference.ts |
| ✅ Layer Types | - | - | - | src/taxonomy/layer-types.ts |
| ✅ Lint Module | - | - | - | src/lint/index.ts |
| ✅ Lint Patterns CLI | - | - | - | src/cli/lint-patterns.ts |
| 🚧 Lint Process CLI | - | - | - | src/cli/lint-process.ts |
| ✅ Normalized Status | - | - | - | src/taxonomy/normalized-status.ts |
| ✅ Output Schemas | - | - | - | src/validation-schemas/output-schemas.ts |
| ✅ Pipeline Module | - | - | - | src/generators/pipeline/index.ts |
| ✅ Planning Codecs | - | - | - | src/renderable/codecs/planning.ts |
| ✅ Pr Changes Codec | - | - | - | src/renderable/codecs/pr-changes.ts |
| 🚧 Process Guard Module | - | - | - | src/lint/process-guard/index.ts |
| 🚧 Process Guard Types | - | - | - | src/lint/process-guard/types.ts |
| 🚧 Process State Types | - | - | - | src/api/types.ts |
| ✅ Regex Builders | - | - | - | src/config/regex-builders.ts |
| ✅ Renderable Document Model(RDM) | - | - | - | src/renderable/index.ts |
| ✅ Renderable Utils | - | - | - | src/renderable/utils.ts |
| ✅ Reporting Codecs | - | - | - | src/renderable/codecs/reporting.ts |
| ✅ Requirements Codec | - | - | - | src/renderable/codecs/requirements.ts |
| ✅ Rich Content Helpers | - | - | - | src/renderable/codecs/helpers.ts |
| ✅ Risk Levels | - | - | - | src/taxonomy/risk-levels.ts |
| ✅ Shape Extractor | - | - | - | src/extractor/shape-extractor.ts |
| ✅ Shared Codec Schema | - | - | - | src/renderable/codecs/shared-schema.ts |
| ✅ Source Mapping Validator | - | - | - | src/generators/source-mapping-validator.ts |
| ✅ Status Values | - | - | - | src/taxonomy/status-values.ts |
| 🚧 Stub Resolver Impl | - | - | - | src/api/stub-resolver.ts |
| ✅ Tag Registry Configuration | - | - | - | src/validation-schemas/tag-registry.ts |
| ⏸️ Tag Taxonomy CLI | - | - | - | src/cli/generate-tag-taxonomy.ts |
| ✅ Taxonomy Codec | - | - | - | src/renderable/codecs/taxonomy.ts |
| ✅ Timeline Codec | - | - | - | src/renderable/codecs/timeline.ts |
| ✅ Validate Patterns CLI | - | - | - | src/cli/validate-patterns.ts |
| ✅ Validation Module | - | - | - | src/validation/index.ts |
| ✅ Validation Rules Codec | - | - | - | src/renderable/codecs/validation-rules.ts |
| ✅ Warning Collector | - | - | - | src/generators/warning-collector.ts |
| ✅ Workflow Config Schema | - | - | - | src/validation-schemas/workflow-config.ts |
| ✅ Workflow Loader | - | - | - | src/config/workflow-loader.ts |
