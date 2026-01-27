/**
 * @libar-docs
 */
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
export class GeneratorRegistry {
    generators = new Map();
    /**
     * Register a generator.
     *
     * @throws Error if generator with same name already registered
     */
    register(generator) {
        if (this.generators.has(generator.name)) {
            throw new Error(`Generator "${generator.name}" is already registered. ` +
                `Available generators: ${this.available().join(', ')}`);
        }
        this.generators.set(generator.name, generator);
    }
    /**
     * Get generator by name.
     *
     * @returns Generator if found, undefined otherwise
     */
    get(name) {
        return this.generators.get(name);
    }
    /**
     * Check if generator exists.
     */
    has(name) {
        return this.generators.has(name);
    }
    /**
     * List all registered generator names.
     *
     * @returns Sorted array of generator names
     */
    available() {
        return Array.from(this.generators.keys()).sort();
    }
    /**
     * Clear all registered generators.
     * Primarily for testing.
     */
    clear() {
        this.generators.clear();
    }
}
/**
 * Singleton instance.
 * Generators register themselves on import via this instance.
 */
export const generatorRegistry = new GeneratorRegistry();
//# sourceMappingURL=registry.js.map