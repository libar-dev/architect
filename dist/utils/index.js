/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern UtilsModule
 * @libar-docs-status completed
 * @libar-docs-uses StringUtilities, CollectionUtilities
 *
 * ## UtilsModule - Shared Utilities Barrel Export
 *
 * Common helper functions used across the delivery-process package.
 * Provides text transformation and collection manipulation utilities.
 *
 * ### When to Use
 *
 * - Use when importing utility functions from the package
 * - Use for consistent text slugification or collection grouping
 */
export { slugify, toKebabCase, camelCaseToTitleCase, normalizeLineEndings, } from './string-utils.js';
export { groupBy } from './collection-utils.js';
export { generatePatternId } from './id-utils.js';
//# sourceMappingURL=index.js.map