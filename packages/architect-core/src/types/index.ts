export * from './result.js';

export type {
  PatternId,
  ModuleId,
  RoleName,
  SourceFilePath,
  OutputFilePath,
  RegistryFilePath,
  DirectiveTag,
} from './branded.js';

export {
  asPatternId,
  asModuleId,
  asRoleName,
  asSourceFilePath,
  asOutputFilePath,
  asRegistryFilePath,
  asDirectiveTag,
} from './branded.js';

export type {
  BaseDocError,
  DocError,
  ScanError,
  ExtractionError,
  GenerationError,
  BatchError,
  FileSystemError,
  FileParseError,
  DirectiveValidationError,
  PatternValidationError,
  RegistryValidationError,
  MarkdownGenerationError,
  FileWriteError,
  FeatureParseError,
  ConfigError,
  ProcessMetadataValidationError,
  DeliverableValidationError,
  GherkinPatternValidationError,
} from './errors.js';

export {
  createFileSystemError,
  createFileParseError,
  createDirectiveValidationError,
  createPatternValidationError,
  createFeatureParseError,
  createProcessMetadataValidationError,
  createDeliverableValidationError,
  createGherkinPatternValidationError,
} from './errors.js';

export type { Position } from '../validation-schemas/doc-directive.js';
export type { DocDirective } from '../validation-schemas/doc-directive.js';
export type { ExportInfo } from '../validation-schemas/export-info.js';
export type { SourceInfo } from '../validation-schemas/extracted-pattern.js';
export type { ExtractedPattern } from '../validation-schemas/extracted-pattern.js';
export type { ScannerConfig } from '../validation-schemas/config.js';
export type { GeneratorConfig } from '../validation-schemas/config.js';
