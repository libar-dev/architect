/**
 * @architect
 * @architect-core @architect-config
 * @architect-pattern ConfigurationTypes
 * @architect-status completed
 * @architect-arch-layer domain
 * @architect-arch-context config
 * @architect-extract-shapes ArchitectConfig, ArchitectInstance, RegexBuilders
 *
 * ## Configuration Types
 *
 * Type definitions for the Architect configuration system.
 * Provides fully type-safe configuration with generics to preserve literal types from presets.
 *
 * ### When to Use
 *
 * - When defining custom presets or configurations
 * - When creating type-safe factory functions
 * - When extending the configuration system
 */

import type { TagRegistry } from '../validation-schemas/tag-registry.js';
import type { CategoryDefinition } from '../taxonomy/categories.js';
import type { MetadataTagDefinitionForRegistry } from '../taxonomy/registry-builder.js';
import type { ContextInferenceRule } from '../generators/pipeline/context-inference.js';

/**
 * Configuration for creating a delivery process instance.
 * Uses generics to preserve literal types from presets.
 */
export interface ArchitectConfig {
  /** Tag prefix for directives (e.g., "@docs-" or "@architect-") */
  readonly tagPrefix: string;
  /** File-level opt-in tag (e.g., "@docs" or "@architect") */
  readonly fileOptInTag: string;
  /** Category definitions for pattern classification */
  readonly categories: readonly CategoryDefinition[];
  /** Optional metadata tag definitions */
  readonly metadataTags?: readonly MetadataTagDefinitionForRegistry[];
  /**
   * Optional context inference rules for auto-inferring bounded context from file paths.
   *
   * When provided, these rules are merged with the default rules. User-provided rules
   * take precedence over defaults (applied first in the rule list).
   *
   * @example
   * ```typescript
   * contextInferenceRules: [
   *   { pattern: 'packages/orders/**', context: 'orders' },
   *   { pattern: 'packages/inventory/**', context: 'inventory' },
   * ]
   * ```
   */
  readonly contextInferenceRules?: readonly ContextInferenceRule[];
}

/**
 * Instance returned by createArchitect with configured registry
 */
export interface ArchitectInstance {
  /** The fully configured tag registry */
  readonly registry: TagRegistry;
  /** Regex builders for tag detection */
  readonly regexBuilders: RegexBuilders;
}

/**
 * Regex builders for tag detection
 *
 * Provides type-safe regex operations for detecting and normalizing tags
 * based on the configured tag prefix.
 */
export interface RegexBuilders {
  /** Pattern to match file-level opt-in (e.g., /** @docs *\/) */
  readonly fileOptInPattern: RegExp;
  /** Pattern to match directives (e.g., @docs-pattern, @docs-status) */
  readonly directivePattern: RegExp;
  /** Check if content has the file-level opt-in marker */
  hasFileOptIn(content: string): boolean;
  /** Check if content has any doc directives */
  hasDocDirectives(content: string): boolean;
  /** Normalize a tag by removing @ and prefix (e.g., "@docs-pattern" -> "pattern") */
  normalizeTag(tag: string): string;
}
