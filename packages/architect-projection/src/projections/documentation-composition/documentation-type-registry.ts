/**
 * @architect
 * @architect-pattern DocumentationTypeRegistry
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:projection
 *
 * **Value:** The source-first registry star for documentation document types:
 * one identity list drives the output-routing, disclosure, and cli-surface axis
 * maps, assembled and frozen here so each doc type's contract — supported keys,
 * route ids, markdown targets, disclosure defaults, generator names — is declared
 * once and validated by Zod rather than scattered across the pipeline.
 *
 * **Invariant:** The registry exposes exactly the supported documentation types;
 * every type resolves to one frozen metadata entry across all four axes (identity,
 * output-routing, disclosure, cli-surface), and an unknown key resolves to
 * `undefined` rather than a partial entry.
 *
 * ### When to Use
 *
 * - Resolve a documentation type's metadata, routing, disclosure level, or CLI
 *   generator surface from its key.
 */
import { z } from 'zod';

import { DisclosureSpecSchema } from '../../disclosure/spec.js';
import { ProgressiveDisclosureLevelSchema } from '../../disclosure/levels.js';
import { LogicalRouteIdSchema } from '../../routing/route-id.js';

import { DOCUMENTATION_DEFINITIONS } from './documentation-definition.internal.js';
import { type SupportedDocumentationType } from './documentation-type-registry.identity.js';

export type { SupportedDocumentationType } from './documentation-type-registry.identity.js';

const DisclosureMatrixSchema = z.record(ProgressiveDisclosureLevelSchema, DisclosureSpecSchema);

export const SupportedDocumentationTypeRegistryEntrySchema = z.strictObject({
  key: z.string().min(1),
  displayTitle: z.string().min(1),
  description: z.string().min(1),
  rootRouteId: LogicalRouteIdSchema,
  markdownRootTarget: z.string().regex(/\.md$/u),
  childDirectory: z.string().min(1).optional(),
  entityPathLayout: z
    .literal('nested-index')
    .optional()
    .describe(
      'Entity-route file layout for this doc type. When "nested-index", each entity routes to `${childDirectory}/${slug}/INDEX.md`; otherwise entities render as flat `${childDirectory}/${slug}.md` files. The bundle carries this onto `routing.entityPathLayout` so the markdown renderer never has to special-case a documentation type.',
    ),
  defaultDisclosureLevel: ProgressiveDisclosureLevelSchema,
  disclosureMatrix: DisclosureMatrixSchema,
  generatorName: z.string().min(1),
  generatorAliases: z.array(z.string()).readonly(),
});

export type SupportedDocumentationTypeRegistryEntry = z.infer<
  typeof SupportedDocumentationTypeRegistryEntrySchema
>;

export type SupportedDocumentationTypeMetadata = Readonly<
  Omit<SupportedDocumentationTypeRegistryEntry, 'key'> & {
    key: SupportedDocumentationType;
  }
>;

export type DocumentationTypeMetadata = SupportedDocumentationTypeMetadata;

const DOCUMENTATION_TYPE_REGISTRY = Object.freeze(
  DOCUMENTATION_DEFINITIONS.map((definition) => {
    const { project: _project, ...metadata } = definition;
    const parsed = SupportedDocumentationTypeRegistryEntrySchema.parse(metadata);

    return Object.freeze({
      ...parsed,
      key: definition.key,
    });
  }),
);

const DOCUMENTATION_TYPE_METADATA_BY_KEY = new Map<string, DocumentationTypeMetadata>(
  DOCUMENTATION_TYPE_REGISTRY.map((entry) => [entry.key, entry] as const),
);

export const SUPPORTED_DOCUMENTATION_TYPE_REGISTRY = DOCUMENTATION_TYPE_REGISTRY;

export const SUPPORTED_DOCUMENTATION_TYPES = Object.freeze(
  DOCUMENTATION_TYPE_REGISTRY.map((entry) => entry.key),
);

export function getDocumentationTypeMetadata(key: string): DocumentationTypeMetadata | undefined {
  return DOCUMENTATION_TYPE_METADATA_BY_KEY.get(key);
}

export function getSupportedDocumentationTypeMetadata(
  key: SupportedDocumentationType,
): SupportedDocumentationTypeMetadata {
  const metadata = DOCUMENTATION_TYPE_METADATA_BY_KEY.get(key);

  if (metadata === undefined) {
    throw new Error(`Unsupported documentation type: ${key}`);
  }

  return metadata;
}
