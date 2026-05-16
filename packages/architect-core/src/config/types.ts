import type { ContextInferenceRule } from '../generators/pipeline/context-inference.js';
import type { TagRegistry } from './tag-registry-contract.js';
import type { RoleDefinition } from './role-constants.js';

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
