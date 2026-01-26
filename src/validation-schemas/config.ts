import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import type { RegistryFilePath } from "../types/branded.js";
import { asRegistryFilePath } from "../types/branded.js";

/**
 * Safely resolve a path, following symlinks if possible
 *
 * Falls back to path.resolve if the path doesn't exist yet
 * (which is valid for output directories that will be created)
 */
function safeRealpathSync(filePath: string): string {
  try {
    return fs.realpathSync(filePath);
  } catch {
    // Path doesn't exist yet, use regular resolve
    return path.resolve(filePath);
  }
}

/**
 * Glob pattern validation
 * Must be non-empty and not contain parent directory traversal for security
 */
const GlobPatternSchema = z
  .string()
  .min(1, "Glob pattern cannot be empty")
  .refine((pattern) => !pattern.includes(".."), {
    message: "Glob patterns cannot contain parent directory traversal (..)",
  });

/**
 * Base directory validation with normalization
 */
const BaseDirSchema = z
  .string()
  .min(1, "Base directory cannot be empty")
  .transform((dir) => path.resolve(dir)); // Normalize to absolute path

/**
 * Create output directory validator with explicit base directory
 *
 * **Security**: Uses explicit baseDir parameter instead of process.cwd()
 * to prevent manipulation via symlinks or environment changes.
 *
 * @param baseDir - Explicit base directory for validation
 * @returns Output directory schema validator
 *
 */
function createOutputDirSchema(baseDir: string): z.ZodType<string> {
  return z
    .string()
    .min(1, "Output directory cannot be empty")
    .transform((dir) => path.normalize(path.resolve(dir)))
    .refine(
      (dir) => {
        // Resolve symlinks for the base directory to prevent bypass attacks
        const resolvedBase = safeRealpathSync(baseDir);
        const resolvedDir = safeRealpathSync(dir);

        // Prevent parent directory traversal
        if (dir.includes("..")) {
          return false;
        }

        // Must be within resolvedBase or be a relative path
        return resolvedDir.startsWith(resolvedBase) || !path.isAbsolute(dir);
      },
      {
        message: "Output directory must be within project (no parent traversal)",
      }
    );
}

/**
 * Registry file path validation
 * Must be a JSON file
 */
const RegistryFilePathSchema = z
  .string()
  .min(1, "Registry path cannot be empty")
  .refine((p) => p.endsWith(".json"), {
    message: "Registry file must be a JSON file (.json)",
  })
  .transform((p) => asRegistryFilePath(path.normalize(p)));

/**
 * Scanner configuration
 *
 * Schema enforces:
 * - At least one glob pattern
 * - No parent directory traversal in patterns
 * - Normalized base directory path
 * - Strict mode to prevent extra fields
 *
 * **Transform Chain:**
 * 1. Validate pattern non-empty
 * 2. Check for security issues (..)
 * 3. Normalize baseDir to absolute path
 */
export const ScannerConfigSchema = z
  .object({
    /** Glob patterns to scan (e.g., 'src/**\/*.ts') */
    patterns: z.array(GlobPatternSchema).min(1, "At least one glob pattern required").readonly(),

    /** Directories to exclude (optional) */
    exclude: z.array(GlobPatternSchema).readonly().optional(),

    /** Base directory for scanning (normalized to absolute path) */
    baseDir: BaseDirSchema,
  })
  .strict();

/**
 * Type alias inferred from schema
 *
 * **Schema-First Law**: Type automatically derives from Zod schema.
 */
export type ScannerConfig = z.infer<typeof ScannerConfigSchema>;

/**
 * Generator configuration type
 *
 * **Note**: Defined explicitly to break circular dependency with factory function
 * while maintaining type safety and TIER 1 compliance.
 */
export interface GeneratorConfig {
  outputDir: string;
  registryPath: RegistryFilePath;
  overwrite: boolean;
  readmeOnly: boolean;
}

/**
 * Generator configuration factory
 *
 * **Security**: Requires explicit baseDir to prevent path manipulation attacks.
 *
 * Schema enforces:
 * - Output directory within explicit baseDir (security)
 * - Registry file is JSON format
 * - Path normalization with symlink prevention
 * - Strict mode to prevent extra fields
 *
 * **Transform Chain:**
 * 1. Normalize output directory to absolute path
 * 2. Validate within explicit baseDir boundaries
 * 3. Prevent parent directory traversal (..)
 * 4. Ensure registry is .json file
 * 5. Normalize all paths
 *
 * @param baseDir - Explicit base directory for security validation
 * @returns Generator config schema
 *
 * @example
 * ```typescript
 * const schema = createGeneratorConfigSchema(process.cwd());
 * const config = schema.parse({
 *   outputDir: 'docs',
 *   registryPath: 'registry.json'
 * });
 * ```
 */

export function createGeneratorConfigSchema(baseDir: string): z.ZodType<GeneratorConfig> {
  return z
    .object({
      /** Output directory for generated docs (within baseDir) */
      outputDir: createOutputDirSchema(baseDir),

      /** Registry file path (must be .json) */
      registryPath: RegistryFilePathSchema,

      /** Whether to overwrite existing files */
      overwrite: z.boolean().default(false),

      /** When true, only generate OVERVIEW.md, DECISIONS.md, and registry.json */
      readmeOnly: z.boolean().default(false),
    })
    .strict();
}

/**
 * Generator configuration (backward compatibility)
 *
 * **Deprecated**: Use createGeneratorConfigSchema(baseDir) instead for better security.
 *
 * This version uses process.cwd() which can be manipulated.
 */
export const GeneratorConfigSchema: z.ZodType<GeneratorConfig> = createGeneratorConfigSchema(
  process.cwd()
);

/**
 * Runtime type guard for ScannerConfig
 *
 * @param value - Value to check
 * @returns True if value conforms to ScannerConfig schema
 *
 * @example
 * ```typescript
 * if (isScannerConfig(parsed)) {
 *   console.log(parsed.patterns); // Type-safe access
 * }
 * ```
 */
export function isScannerConfig(value: unknown): value is ScannerConfig {
  return ScannerConfigSchema.safeParse(value).success;
}

/**
 * Runtime type guard for GeneratorConfig
 *
 * @param value - Value to check
 * @returns True if value conforms to GeneratorConfig schema
 *
 * @example
 * ```typescript
 * if (isGeneratorConfig(parsed)) {
 *   console.log(parsed.outputDir); // Type-safe access
 * }
 * ```
 */
export function isGeneratorConfig(value: unknown): value is GeneratorConfig {
  const result = GeneratorConfigSchema.safeParse(value);
  return result.success;
}
