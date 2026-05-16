import { z } from 'zod';

import { PackageSchema } from './package.js';

const RegexSchema = z.instanceof(RegExp);
const PrefixSchema = z.string().min(1, 'Package match prefix cannot be empty');

export const PackageMatcherSchema = z.union([RegexSchema, PrefixSchema]);

export const PackageConfigSchema = PackageSchema.extend({
  match: PackageMatcherSchema,
});

export type PackageMatcher = z.infer<typeof PackageMatcherSchema>;
export type PackageConfig = z.infer<typeof PackageConfigSchema>;
