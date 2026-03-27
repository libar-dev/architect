/**
 * @architect
 * @architect-core @architect-config
 * @architect-pattern ConfigurationPresets
 * @architect-status completed
 * @architect-arch-layer domain
 * @architect-arch-context config
 * @architect-uses ConfigurationTypes, Categories, RegistryBuilder
 * @architect-used-by ArchitectFactory
 * @architect-extract-shapes LIBAR_GENERIC_PRESET, DDD_ES_CQRS_PRESET, PresetName, PRESETS
 *
 * ## Configuration Presets
 *
 * Predefined configuration presets for common use cases.
 * Uses `as const satisfies` for full type inference while ensuring
 * configuration shape compliance.
 *
 * ### Available Presets
 *
 * - **LIBAR_GENERIC_PRESET**: Minimal categories with @architect- prefix (for package-level config)
 * - **DDD_ES_CQRS_PRESET**: Full 21-category taxonomy with @architect- prefix
 *
 * ### When to Use
 *
 * - Use LIBAR_GENERIC_PRESET for simple documentation needs with @architect- prefix (default)
 * - Use DDD_ES_CQRS_PRESET for full DDD/ES/CQRS taxonomy
 * - Use as base for custom configurations
 */

import type { ArchitectConfig } from './types.js';
import { CATEGORIES, type CategoryDefinition } from '../taxonomy/categories.js';
import { buildRegistry } from '../taxonomy/registry-builder.js';
import { DEFAULT_TAG_PREFIX, DEFAULT_FILE_OPT_IN_TAG } from './defaults.js';

/**
 * Default libar-generic preset with @architect- prefix.
 *
 * This is the universal default preset for both `createArchitect()` and
 * `loadConfig()` fallback.
 *
 * Suitable for:
 * - Most projects (default choice)
 * - Projects already using @architect- tags
 * - Package-level configuration with a compact three-category taxonomy
 * - Gradual adoption without tag migration
 *
 * @example
 * ```typescript
 * import { createArchitect } from '@libar-dev/architect';
 *
 * // Default preset (libar-generic):
 * const dp = createArchitect();
 * // Uses @architect-, @architect-pattern, @architect-status, etc.
 * // With 3 category tags: @architect-core, @architect-api, @architect-infra
 * ```
 */
export const LIBAR_GENERIC_PRESET = {
  tagPrefix: DEFAULT_TAG_PREFIX,
  fileOptInTag: DEFAULT_FILE_OPT_IN_TAG,
  categories: [
    {
      tag: 'core',
      domain: 'Core',
      priority: 1,
      description: 'Core patterns',
      aliases: [],
    },
    {
      tag: 'api',
      domain: 'API',
      priority: 2,
      description: 'Public APIs',
      aliases: [],
    },
    {
      tag: 'infra',
      domain: 'Infrastructure',
      priority: 3,
      description: 'Infrastructure',
      aliases: ['infrastructure'],
    },
  ] as const satisfies readonly CategoryDefinition[],
} as const satisfies ArchitectConfig;

/**
 * Full DDD/ES/CQRS preset (current @libar-dev taxonomy).
 *
 * Complete 21-category taxonomy with @architect- prefix. Suitable for:
 * - DDD architectures
 * - Event sourcing projects
 * - CQRS implementations
 * - Full roadmap/phase tracking
 *
 * @example
 * ```typescript
 * import { createArchitect, DDD_ES_CQRS_PRESET } from '@libar-dev/architect';
 *
 * const dp = createArchitect({ preset: "ddd-es-cqrs" });
 * ```
 */
export const DDD_ES_CQRS_PRESET = {
  tagPrefix: DEFAULT_TAG_PREFIX,
  fileOptInTag: DEFAULT_FILE_OPT_IN_TAG,
  categories: CATEGORIES,
  metadataTags: buildRegistry().metadataTags,
} as const satisfies ArchitectConfig;

/**
 * Available preset names
 */
export type PresetName = 'libar-generic' | 'ddd-es-cqrs';

/**
 * Preset lookup map
 *
 * @example
 * ```typescript
 * import { PRESETS, type PresetName } from '@libar-dev/architect';
 *
 * function getPreset(name: PresetName) {
 *   return PRESETS[name];
 * }
 * ```
 */
export const PRESETS: Record<PresetName, ArchitectConfig> = {
  'libar-generic': LIBAR_GENERIC_PRESET,
  'ddd-es-cqrs': DDD_ES_CQRS_PRESET,
};
