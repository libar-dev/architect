/**
 * @architect
 * @architect-pattern PackageMatcherContract
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:configuration
 *
 * ## PackageMatcherContract - Monorepo Package Matching Shape
 *
 * `PackageConfigSchema` plus `PackageMatcherSchema` — a matcher is either a
 * `RegExp` or a non-empty prefix string. This is the contract for matching a
 * source file to its monorepo package and the schema basis of MonorepoSupport.
 * It is the shape contract only; the runtime matching logic lives in the
 * separate PackageResolver service.
 *
 * ### When to Use
 *
 * - Declaring how a monorepo package is matched (prefix or RegExp) in config.
 * - Validating a `PackageConfig` entry at the config trust boundary.
 * - Typing a consumer that resolves a file path to its owning package.
 */
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
