/**
 * @libar-docs
 * @libar-docs-core @libar-docs-config
 * @libar-docs-pattern RegexBuilders
 * @libar-docs-status completed
 * @libar-docs-uses ConfigurationTypes
 * @libar-docs-used-by DeliveryProcessFactory
 * @libar-docs-extract-shapes createRegexBuilders
 *
 * ## Regex Builders
 *
 * Type-safe regex factory functions for tag detection and normalization.
 * Creates regex patterns based on configured tag prefix.
 *
 * ### When to Use
 *
 * - When creating a new delivery process instance
 * - When detecting doc directives in source code
 * - When normalizing tags for comparison
 */
import type { RegexBuilders } from './types.js';
export type { RegexBuilders } from './types.js';
/**
 * Creates type-safe regex builders for a given tag prefix configuration.
 * These are used throughout the scanner and validation pipeline.
 *
 * @param tagPrefix - The tag prefix (e.g., "@docs-" or "@libar-docs-")
 * @param fileOptInTag - The file opt-in tag (e.g., "@docs" or "@libar-docs")
 * @returns RegexBuilders instance with pattern matching methods
 *
 * @example
 * ```typescript
 * const builders = createRegexBuilders("@docs-", "@docs");
 *
 * // Check for file opt-in
 * if (builders.hasFileOptIn(sourceCode)) {
 *   console.log("File has @docs marker");
 * }
 *
 * // Normalize a tag
 * const normalized = builders.normalizeTag("@docs-pattern");
 * // Returns: "pattern"
 * ```
 */
export declare function createRegexBuilders(tagPrefix: string, fileOptInTag: string): RegexBuilders;
//# sourceMappingURL=regex-builders.d.ts.map