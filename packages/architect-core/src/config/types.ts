/**
 * @architect
 * @architect-pattern ArchitectConfigContract
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:configuration
 * @architect-uses TagRegistrySchemas
 *
 * ## ArchitectConfigContract - Config Shape Every Loader Conforms To
 *
 * The typed shape contract behind `define-config`: `ArchitectConfig` (tag
 * prefix, file opt-in tag, role definitions, optional context-inference
 * rules), the resolved `ArchitectInstance` (registry + regex builders), and
 * the `RegexBuilders` interface used for tag-detection. Every config
 * loader/resolver in the toolchain conforms to these shapes; the role
 * definitions and registry draw on `TagRegistrySchemas`.
 *
 * ### When to Use
 *
 * - Authoring or resolving an Architect configuration object.
 * - Building the regex predicates (`hasFileOptIn`, `hasDocDirectives`,
 *   `normalizeTag`) that drive tag detection.
 * - Typing a consumer that must accept a resolved `ArchitectInstance`.
 */
import type { ContextInferenceRule } from '../generators/pipeline/context-inference.js';
import type { TagRegistry, RoleDefinition } from '../validation-schemas/tag-registry.js';

export interface ArchitectConfig {
  readonly tagPrefix: string;
  readonly fileOptInTag: string;
  readonly roles: readonly RoleDefinition[];
  readonly contextInferenceRules?: readonly ContextInferenceRule[];
}

export interface ArchitectInstance {
  readonly registry: TagRegistry;
  readonly regexBuilders: RegexBuilders;
}

export interface RegexBuilders {
  readonly fileOptInPattern: RegExp;
  readonly directivePattern: RegExp;
  hasFileOptIn(content: string): boolean;
  hasDocDirectives(content: string): boolean;
  normalizeTag(tag: string): string;
}
