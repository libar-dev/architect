import { z } from "zod";
import type { RegistryFilePath } from "../types/branded.js";
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
export declare const ScannerConfigSchema: z.ZodObject<{
    patterns: z.ZodReadonly<z.ZodArray<z.ZodString>>;
    exclude: z.ZodOptional<z.ZodReadonly<z.ZodArray<z.ZodString>>>;
    baseDir: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
}, z.core.$strict>;
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
export declare function createGeneratorConfigSchema(baseDir: string): z.ZodType<GeneratorConfig>;
/**
 * Generator configuration (backward compatibility)
 *
 * **Deprecated**: Use createGeneratorConfigSchema(baseDir) instead for better security.
 *
 * This version uses process.cwd() which can be manipulated.
 */
export declare const GeneratorConfigSchema: z.ZodType<GeneratorConfig>;
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
export declare function isScannerConfig(value: unknown): value is ScannerConfig;
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
export declare function isGeneratorConfig(value: unknown): value is GeneratorConfig;
//# sourceMappingURL=config.d.ts.map