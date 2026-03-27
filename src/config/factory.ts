/**
 * @architect
 * @architect-core @architect-config
 * @architect-pattern ArchitectFactory
 * @architect-status completed
 * @architect-arch-role service
 * @architect-arch-context config
 * @architect-arch-layer application
 * @architect-include reference-sample
 * @architect-uses ConfigurationTypes, ConfigurationPresets, RegexBuilders, TagRegistry
 * @architect-used-by PublicAPI
 * @architect-extract-shapes CreateArchitectOptions, createArchitect
 *
 * ## Architect Factory
 *
 * Main factory function for creating configured Architect instances.
 * Supports presets, custom configuration, and configuration overrides.
 *
 * ### When to Use
 *
 * - At application startup to create a configured instance
 * - When switching between different tag prefixes
 * - When customizing the taxonomy for a specific project
 */

import type { ArchitectConfig, ArchitectInstance } from './types.js';
import type { TagRegistry } from '../validation-schemas/tag-registry.js';
import { buildRegistry } from '../taxonomy/registry-builder.js';
import { createRegexBuilders } from './regex-builders.js';
import { LIBAR_GENERIC_PRESET, PRESETS, type PresetName } from './presets.js';

/**
 * Options for creating an Architect instance
 */
export interface CreateArchitectOptions {
  /** Use a preset configuration */
  preset?: PresetName;
  /** Custom tag prefix (overrides preset) */
  tagPrefix?: string;
  /** Custom file opt-in tag (overrides preset) */
  fileOptInTag?: string;
  /** Custom categories (replaces preset categories entirely) */
  categories?: ArchitectConfig['categories'];
}

/**
 * Creates a configured Architect instance.
 *
 * Configuration resolution order:
 * 1. Start with preset (or libar-generic default)
 * 2. Preset categories REPLACE base taxonomy categories (not merged)
 * 3. Apply explicit overrides (tagPrefix, fileOptInTag, categories)
 * 4. Create regex builders from final configuration
 *
 * Note: Presets define complete category sets. The libar-generic preset
 * has 3 categories (core, api, infra), while ddd-es-cqrs has 21.
 * Categories from the preset replace base categories entirely.
 *
 * @param options - Configuration options
 * @returns Configured Architect instance
 *
 * @example
 * ```typescript
 * // Use the default preset
 * const dp = createArchitect();
 * ```
 *
 * @example
 * ```typescript
 * // Custom prefix with DDD taxonomy
 * const dp = createArchitect({
 *   preset: "ddd-es-cqrs",
 *   tagPrefix: "@my-project-",
 *   fileOptInTag: "@my-project"
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Default (libar-generic preset with 3 categories)
 * const dp = createArchitect();
 * ```
 */
export function createArchitect(options: CreateArchitectOptions = {}): ArchitectInstance {
  // Start with preset or default to libar-generic
  const baseConfig = options.preset ? PRESETS[options.preset] : LIBAR_GENERIC_PRESET;

  // Apply overrides
  const tagPrefix = options.tagPrefix ?? baseConfig.tagPrefix;
  const fileOptInTag = options.fileOptInTag ?? baseConfig.fileOptInTag;
  const categories = options.categories ?? baseConfig.categories;

  // Build the base registry from taxonomy constants (readonly)
  const baseRegistry = buildRegistry();

  // Convert readonly arrays to mutable (buildRegistry returns readonly `as const` arrays)
  const mutableBaseRegistry: TagRegistry = {
    version: baseRegistry.version,
    categories: [...baseRegistry.categories].map((c) => ({
      ...c,
      aliases: [...c.aliases],
    })),
    metadataTags: [...baseRegistry.metadataTags].map((t) => ({
      ...t,
      values: t.values ? [...t.values] : undefined,
      required: t.required ?? false,
      repeatable: t.repeatable ?? false,
    })),
    aggregationTags: [...baseRegistry.aggregationTags],
    formatOptions: [...baseRegistry.formatOptions],
    tagPrefix: baseRegistry.tagPrefix,
    fileOptInTag: baseRegistry.fileOptInTag,
  };

  // Create mutable categories from preset
  const mutableCategories = [...categories].map((c) => ({
    tag: c.tag,
    domain: c.domain,
    priority: c.priority,
    description: c.description,
    aliases: [...c.aliases],
  }));

  // Create registry with preset categories REPLACING base categories (not merging).
  // This ensures libar-generic preset gets only 3 categories, not all 21 DDD categories.
  const registry: TagRegistry = {
    ...mutableBaseRegistry,
    tagPrefix,
    fileOptInTag,
    categories: mutableCategories,
  };

  // Create regex builders
  const regexBuilders = createRegexBuilders(tagPrefix, fileOptInTag);

  return {
    registry,
    regexBuilders,
  };
}
