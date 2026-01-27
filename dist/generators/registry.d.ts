/**
 * @libar-docs
 */
import type { DocumentGenerator } from './types';
/**
 * @libar-docs-generator
 * @libar-docs-pattern GeneratorRegistry
 * @libar-docs-status completed
 * @libar-docs-uses GeneratorTypes
 * @libar-docs-used-by GeneratorFactory, Orchestrator, GenerateDocsCLI
 *
 * ## GeneratorRegistry - Central Registry for Document Generators
 *
 * Manages registration and lookup of document generators (both built-in and custom).
 * Uses explicit registration pattern for transparency and debuggability.
 *
 * ### When to Use
 *
 * - Registering built-in generators on module import
 * - Registering custom generators from user code
 * - Looking up generators by name in the CLI
 *
 * ### Key Concepts
 *
 * - **Singleton:** Single global instance shared across the package
 * - **Explicit Registration:** No auto-discovery, transparent registration
 * - **Name Uniqueness:** Prevents duplicate generator names
 */
export declare class GeneratorRegistry {
    private readonly generators;
    /**
     * Register a generator.
     *
     * @throws Error if generator with same name already registered
     */
    register(generator: DocumentGenerator): void;
    /**
     * Get generator by name.
     *
     * @returns Generator if found, undefined otherwise
     */
    get(name: string): DocumentGenerator | undefined;
    /**
     * Check if generator exists.
     */
    has(name: string): boolean;
    /**
     * List all registered generator names.
     *
     * @returns Sorted array of generator names
     */
    available(): string[];
    /**
     * Clear all registered generators.
     * Primarily for testing.
     */
    clear(): void;
}
/**
 * Singleton instance.
 * Generators register themselves on import via this instance.
 */
export declare const generatorRegistry: GeneratorRegistry;
//# sourceMappingURL=registry.d.ts.map