import type { FormatType } from '../taxonomy/format-types.js';
import type { RoleDefinition } from './role-constants.js';

export interface MetadataTagDefinition {
  readonly tag: string;
  readonly format: FormatType;
  readonly purpose: string;
  readonly required?: boolean;
  readonly repeatable?: boolean;
  readonly values?: readonly string[];
  readonly default?: string;
  readonly example?: string;
  readonly metadataKey?: string;
  readonly transform?: (value: string) => string;
}

export interface AggregationTagDefinition {
  readonly tag: string;
  readonly targetDoc: string | null;
  readonly purpose: string;
}

export interface TagRegistry {
  readonly $schema?: string;
  readonly version: string;
  readonly roles: readonly RoleDefinition[];
  readonly metadataTags: readonly MetadataTagDefinition[];
  readonly aggregationTags: readonly AggregationTagDefinition[];
  readonly formatOptions: readonly string[];
  readonly tagPrefix: string;
  readonly fileOptInTag: string;
}
