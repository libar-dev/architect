export { Result, type Ok, type Err } from "./result.js";
export type { PatternId, ModuleId, CategoryName, SourceFilePath, OutputFilePath, RegistryFilePath, DirectiveTag, } from "./branded.js";
export { asPatternId, asModuleId, asCategoryName, asSourceFilePath, asOutputFilePath, asRegistryFilePath, asDirectiveTag, } from "./branded.js";
export type { BaseDocError, DocError, ScanError, ExtractionError, GenerationError, BatchError, FileSystemError, FileParseError, DirectiveValidationError, PatternValidationError, RegistryValidationError, MarkdownGenerationError, FileWriteError, ConfigError, } from "./errors.js";
export { createFileSystemError, createFileParseError, createDirectiveValidationError, createPatternValidationError, createFeatureParseError, } from "./errors.js";
/**
 * Position information in source file
 * Schema: validation-schemas/doc-directive.ts
 */
export type { Position } from "../validation-schemas/doc-directive.js";
/**
 * Parsed @libar-docs-* directive from JSDoc comment
 * Schema: validation-schemas/doc-directive.ts
 */
export type { DocDirective } from "../validation-schemas/doc-directive.js";
/**
 * Information about exported symbols (discriminated union)
 * Schema: validation-schemas/export-info.ts
 */
export type { ExportInfo } from "../validation-schemas/export-info.js";
/**
 * Source file information
 * Schema: validation-schemas/extracted-pattern.ts
 */
export type { SourceInfo } from "../validation-schemas/extracted-pattern.js";
/**
 * Complete extracted pattern with code and metadata
 * Schema: validation-schemas/extracted-pattern.ts
 */
export type { ExtractedPattern } from "../validation-schemas/extracted-pattern.js";
/**
 * Scanner configuration
 * Schema: validation-schemas/config.ts
 */
export type { ScannerConfig } from "../validation-schemas/config.js";
/**
 * Generator configuration
 * Schema: validation-schemas/config.ts
 */
export type { GeneratorConfig } from "../validation-schemas/config.js";
//# sourceMappingURL=index.d.ts.map