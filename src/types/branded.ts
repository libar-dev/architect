/**
 * Branded type helper
 * Creates nominal types for better compile-time safety
 *
 * @architect-shape
 * @architect-include core-types
 */
type Branded<T, Brand extends string> = T & { readonly __brand: Brand };

/**
 * Unique identifier for a documentation pattern
 * Format: pattern-{8-char-hex}
 */
export type PatternId = Branded<string, 'PatternId'>;

/**
 * Convert string to PatternId
 * @param id - String identifier to brand
 * @returns Branded PatternId
 */
export function asPatternId(id: string): PatternId {
  return id as PatternId;
}

/**
 * Unique identifier for a documentation module
 * Currently same as PatternId (one module per pattern)
 */
export type ModuleId = PatternId;

/**
 * Convert string to ModuleId
 * @param id - String identifier to brand
 * @returns Branded ModuleId
 */
export function asModuleId(id: string): ModuleId {
  return id as ModuleId;
}

/**
 * Category name for organizing patterns
 * Examples: core, domain, arch, infra, validation
 */
export type CategoryName = Branded<string, 'CategoryName'>;

/**
 * Convert string to CategoryName
 * @param name - Category name to brand
 * @returns Branded CategoryName
 */
export function asCategoryName(name: string): CategoryName {
  return name as CategoryName;
}

/**
 * Source file path relative to base directory
 * Examples: src/types/index.ts, packages/core/src/index.ts
 */
export type SourceFilePath = Branded<string, 'SourceFilePath'>;

/**
 * Convert string to SourceFilePath
 * @param path - File path to brand
 * @returns Branded SourceFilePath
 */
export function asSourceFilePath(path: string): SourceFilePath {
  return path as SourceFilePath;
}

/**
 * Output file path for generated documentation
 * Examples: docs/core/pattern-name.md
 */
export type OutputFilePath = Branded<string, 'OutputFilePath'>;

/**
 * Convert string to OutputFilePath
 * @param path - Output path to brand
 * @returns Branded OutputFilePath
 */
export function asOutputFilePath(path: string): OutputFilePath {
  return path as OutputFilePath;
}

/**
 * Registry file path
 * Examples: registry.json, docs/registry.json
 */
export type RegistryFilePath = Branded<string, 'RegistryFilePath'>;

/**
 * Convert string to RegistryFilePath
 * @param path - Registry path to brand
 * @returns Branded RegistryFilePath
 */
export function asRegistryFilePath(path: string): RegistryFilePath {
  return path as RegistryFilePath;
}

/**
 * Directive tag name
 * Format: @architect-{category} or @architect-{category}-{subcategory}
 */
export type DirectiveTag = Branded<string, 'DirectiveTag'>;

/**
 * Convert string to DirectiveTag
 * @param tag - Tag string to brand
 * @returns Branded DirectiveTag
 */
export function asDirectiveTag(tag: string): DirectiveTag {
  return tag as DirectiveTag;
}
