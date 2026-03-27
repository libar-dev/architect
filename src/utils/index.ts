/**
 * @architect
 * @architect-core
 * @architect-pattern UtilsModule
 * @architect-status completed
 * @architect-uses StringUtilities, CollectionUtilities
 *
 * ## UtilsModule - Shared Utilities Barrel Export
 *
 * Common helper functions used across the Architect package.
 * Provides text transformation and collection manipulation utilities.
 *
 * ### When to Use
 *
 * - Use when importing utility functions from the package
 * - Use for consistent text slugification or collection grouping
 */

export {
  slugify,
  toKebabCase,
  camelCaseToTitleCase,
  normalizeLineEndings,
} from './string-utils.js';
export { groupBy } from './collection-utils.js';
export { generatePatternId } from './id-utils.js';
