// DocDirective schemas and types
export {
  PositionSchema,
  DocDirectiveSchema,
  isDocDirective,
  DefaultPatternStatusSchema,
  PatternStatusSchema,
  createPatternStatusSchema,
  createDirectiveTagSchema,
  type Position,
  type DocDirective,
  type PatternStatus,
} from "./doc-directive.js";

// ExportInfo schemas and types
export { ExportInfoSchema, isExportInfo, type ExportInfo } from "./export-info.js";

// ExtractedPattern schemas and types
export {
  SourceInfoSchema,
  ExtractedPatternSchema,
  BusinessRuleSchema,
  isExtractedPattern,
  type SourceInfo,
  type ExtractedPattern,
  type BusinessRule,
} from "./extracted-pattern.js";

// ScenarioRef schemas and types
export { ScenarioRefSchema, type ScenarioRef } from "./scenario-ref.js";

// Config schemas and types
export {
  ScannerConfigSchema,
  GeneratorConfigSchema,
  createGeneratorConfigSchema,
  isScannerConfig,
  isGeneratorConfig,
  type ScannerConfig,
  type GeneratorConfig,
} from "./config.js";

// Feature schemas and types (Gherkin)
// Runtime types (from Cucumber parser)
export {
  GherkinDataTableSchema,
  GherkinStepSchema,
  GherkinBackgroundSchema,
  GherkinScenarioSchema,
  GherkinFeatureSchema,
  ScannedGherkinFileSchema,
  GherkinFileErrorSchema,
  GherkinScanResultsSchema,
  type GherkinDataTableRow,
  type GherkinDataTable,
  type GherkinStep,
  type GherkinBackground,
  type GherkinScenario,
  type GherkinFeature,
  type ScannedGherkinFile,
  type GherkinFileError,
  type GherkinScanResults,
  // Processed/validated types (for extraction pipeline)
  ParsedStepSchema,
  ParsedScenarioSchema,
  ParsedBackgroundSchema,
  ParsedFeatureSchema,
  FeatureFileSchema,
  type ParsedStep,
  type ParsedScenario,
  type ParsedBackground,
  type ParsedFeature,
  type FeatureFile,
} from "./feature.js";

// Lint schemas and types
export {
  LintSeveritySchema,
  LintViolationSchema,
  isLintViolation,
  type LintSeverity,
  type LintViolation,
} from "./lint.js";

// Tag Registry schemas and types
export {
  CategoryDefinitionSchema,
  MetadataTagDefinitionSchema,
  AggregationTagDefinitionSchema,
  TagRegistrySchema,
  parseTagRegistry,
  createDefaultTagRegistry,
  mergeTagRegistries,
  type CategoryDefinition,
  type MetadataTagDefinition,
  type AggregationTagDefinition,
  type TagRegistry,
} from "./tag-registry.js";

// Dual-source extraction schemas and types
export {
  ProcessStatusSchema,
  RiskLevelSchema,
  ProcessMetadataSchema,
  DeliverableSchema,
  CrossValidationErrorSchema,
  ValidationSummarySchema,
  HierarchyLevelSchema,
  type ProcessStatus,
  type RiskLevel,
  type ProcessMetadata,
  type Deliverable,
  type CrossValidationError,
  type ValidationSummary,
  type HierarchyLevel,
} from "./dual-source.js";

// Workflow configuration schemas and types
export {
  WorkflowStatusSchema,
  PhaseArtifactsSchema,
  WorkflowPhaseSchema,
  WorkflowConfigSchema,
  createLoadedWorkflow,
  isWorkflowConfig,
  type WorkflowStatus,
  type PhaseArtifacts,
  type WorkflowPhase,
  type WorkflowConfig,
  type LoadedWorkflow,
} from "./workflow-config.js";

// Artefact Set schemas and types
export {
  ArtefactSetMetadataSchema,
  ArtefactSetSchema,
  isArtefactSet,
  parseArtefactSet,
  type ArtefactSet,
  type ArtefactSetMetadata,
} from "./artefact-set.js";

// Codec utilities for JSON parsing and serialization
export {
  createJsonInputCodec,
  createJsonOutputCodec,
  createFileLoader,
  formatCodecError,
  type CodecError,
  type JsonInputCodec,
  type JsonOutputCodec,
} from "./codec-utils.js";

// Output schemas for JSON serialization
export {
  LintViolationOutputSchema,
  LintResultOutputSchema,
  LintSummaryStatsSchema,
  LintOutputSchema,
  ValidationIssueSeveritySchema,
  ValidationIssueSourceSchema,
  ValidationIssueOutputSchema,
  ValidationStatsSchema,
  ValidationSummaryOutputSchema,
  RegistryMetadataOutputSchema,
  type LintOutput,
  type ValidationSummaryOutput,
  type RegistryMetadataOutput,
} from "./output-schemas.js";

// Master Dataset schemas and types (unified transformation pipeline)
export {
  StatusGroupsSchema,
  StatusCountsSchema,
  PhaseGroupSchema,
  SourceViewsSchema,
  RelationshipEntrySchema,
  MasterDatasetSchema,
  type MasterDataset,
  type StatusGroups,
  type StatusCounts,
  type PhaseGroup,
  type SourceViews,
  type RelationshipEntry,
} from "./master-dataset.js";
