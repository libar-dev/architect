import type { ArchitectInstance } from './types.js';
import type { TagRegistry, RoleDefinition } from '../validation-schemas/tag-registry.js';
import { DEFAULT_FILE_OPT_IN_TAG, DEFAULT_TAG_PREFIX } from './defaults.js';
import { BUILTIN_ROLES } from './role-constants.js';
import { createRegexBuilders } from './regex-builders.js';
import { buildRegistry } from '../taxonomy/registry-builder.js';

function cloneRoles(roles: readonly RoleDefinition[]): TagRegistry['roles'] {
  return roles.map((role) => ({
    tag: role.tag,
    domain: role.domain,
    priority: role.priority,
    aliases: [...(role.aliases ?? [])],
    ...(role.description !== undefined ? { description: role.description } : {}),
    ...(role.diagramShape !== undefined ? { diagramShape: role.diagramShape } : {}),
  }));
}

export interface CreateArchitectOptions {
  tagPrefix?: string;
  fileOptInTag?: string;
  roles?: readonly RoleDefinition[];
  productAreas?: readonly string[];
}

export function createArchitect(options: CreateArchitectOptions = {}): ArchitectInstance {
  const tagPrefix = options.tagPrefix ?? DEFAULT_TAG_PREFIX;
  const fileOptInTag = options.fileOptInTag ?? DEFAULT_FILE_OPT_IN_TAG;
  const roles = options.roles ?? BUILTIN_ROLES;

  const baseRegistry = buildRegistry({
    roles,
    ...(options.productAreas !== undefined ? { productAreas: options.productAreas } : {}),
  });

  const registry: TagRegistry = {
    version: baseRegistry.version,
    roles: cloneRoles(roles),
    metadataTags: baseRegistry.metadataTags.map((tag) => ({
      ...tag,
      required: tag.required ?? false,
      repeatable: tag.repeatable ?? false,
      ...(tag.values ? { values: [...tag.values] } : {}),
    })),
    aggregationTags: baseRegistry.aggregationTags.map((tag) => ({ ...tag })),
    formatOptions: [...baseRegistry.formatOptions],
    tagPrefix,
    fileOptInTag,
  };

  return {
    registry,
    regexBuilders: createRegexBuilders(tagPrefix, fileOptInTag),
  };
}
