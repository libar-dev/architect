/**
 * Native Zod branded types for compile-time nominal safety.
 *
 */
import { z } from 'zod';

const PatternIdSchema = z.string().brand<'PatternId'>();
const RoleNameSchema = z.string().brand<'RoleName'>();
const SourceFilePathSchema = z.string().brand<'SourceFilePath'>();
const OutputFilePathSchema = z.string().brand<'OutputFilePath'>();
const RegistryFilePathSchema = z.string().brand<'RegistryFilePath'>();
const DirectiveTagSchema = z.string().brand<'DirectiveTag'>();

/**
 * Unique identifier for a documentation pattern
 * Format: pattern-{8-char-hex}
 */
export type PatternId = z.output<typeof PatternIdSchema>;

/**
 * Convert string to PatternId
 * @param id - String identifier to brand
 * @returns Branded PatternId
 */
export function asPatternId(id: string): PatternId {
  return PatternIdSchema.parse(id);
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
 * Role name for organizing patterns
 * Examples: core, domain, arch, infra, validation
 */
export type RoleName = z.output<typeof RoleNameSchema>;

/**
 * Convert string to RoleName
 * @param name - Role name to brand
 * @returns Branded RoleName
 */
export function asRoleName(name: string): RoleName {
  return RoleNameSchema.parse(name);
}

/**
 * Source file path relative to base directory
 * Examples: src/types/index.ts, packages/core/src/index.ts
 */
export type SourceFilePath = z.output<typeof SourceFilePathSchema>;

/**
 * Convert string to SourceFilePath
 * @param path - File path to brand
 * @returns Branded SourceFilePath
 */
export function asSourceFilePath(path: string): SourceFilePath {
  return SourceFilePathSchema.parse(path);
}

/**
 * Output file path for generated documentation
 * Examples: docs/core/pattern-name.md
 */
export type OutputFilePath = z.output<typeof OutputFilePathSchema>;

/**
 * Convert string to OutputFilePath
 * @param path - Output path to brand
 * @returns Branded OutputFilePath
 */
export function asOutputFilePath(path: string): OutputFilePath {
  return OutputFilePathSchema.parse(path);
}

/**
 * Registry file path
 * Examples: registry.json, docs/registry.json
 */
export type RegistryFilePath = z.output<typeof RegistryFilePathSchema>;

/**
 * Convert string to RegistryFilePath
 * @param path - Registry path to brand
 * @returns Branded RegistryFilePath
 */
export function asRegistryFilePath(path: string): RegistryFilePath {
  return RegistryFilePathSchema.parse(path);
}

/**
 * Directive tag name
 * Format: @architect-{category} or @architect-{category}-{subcategory}
 */
export type DirectiveTag = z.output<typeof DirectiveTagSchema>;

/**
 * Convert string to DirectiveTag
 * @param tag - Tag string to brand
 * @returns Branded DirectiveTag
 */
export function asDirectiveTag(tag: string): DirectiveTag {
  return DirectiveTagSchema.parse(tag);
}
