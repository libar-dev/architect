import type { TagRegistry } from '@libar-dev/architect-core';

export function createProjectionTagRegistry(overrides: Partial<TagRegistry> = {}): TagRegistry {
  return {
    version: '1.0.0',
    roles: overrides.roles ?? [],
    metadataTags: overrides.metadataTags ?? [],
    aggregationTags: overrides.aggregationTags ?? [],
    formatOptions: overrides.formatOptions ?? ['full', 'list', 'summary'],
    tagPrefix: overrides.tagPrefix ?? '@architect-',
    fileOptInTag: overrides.fileOptInTag ?? '@architect',
    ...(overrides.$schema !== undefined ? { $schema: overrides.$schema } : {}),
  };
}
