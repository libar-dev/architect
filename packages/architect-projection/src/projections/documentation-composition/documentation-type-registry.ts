/**
 * @architect-bounded-context:documentation-composition
 */
import { z } from 'zod';

import { DisclosureSpecSchema } from '../../disclosure/spec.js';
import { freezeDisclosureMatrix } from './disclosure-matrix.js';
import { ProgressiveDisclosureLevelSchema } from '../../disclosure/levels.js';
import { LogicalRouteIdSchema } from '../../routing/route-id.js';

import { DOCUMENTATION_TYPE_CLI_SURFACE } from './documentation-type-registry.cli-surface.js';
import { DOCUMENTATION_TYPE_DISCLOSURE } from './documentation-type-registry.disclosure.js';
import {
  SUPPORTED_DOCUMENTATION_TYPE_IDENTITIES,
  type DocumentationTypeIdentity,
  type SupportedDocumentationType,
} from './documentation-type-registry.identity.js';
import { DOCUMENTATION_TYPE_OUTPUT_ROUTING } from './documentation-type-registry.output-routing.js';

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

const DOCUMENTATION_TYPE_REGISTRY: readonly SupportedDocumentationTypeMetadata[] =
  SUPPORTED_DOCUMENTATION_TYPE_IDENTITIES.map((identity) =>
    composeSupportedDocumentationTypeMetadata(identity),
  );

interface SupportedDocumentationTypeRegistryState {
  readonly registry: readonly SupportedDocumentationTypeMetadata[];
  readonly supportedTypes: readonly SupportedDocumentationType[];
  readonly byKey: ReadonlyMap<string, SupportedDocumentationTypeMetadata>;
}

let supportedDocumentationTypeRegistryState: SupportedDocumentationTypeRegistryState | undefined;

export const SUPPORTED_DOCUMENTATION_TYPE_REGISTRY = createLazyReadonlyArrayFacade(
  () => getSupportedDocumentationTypeRegistryState().registry,
);

export const SUPPORTED_DOCUMENTATION_TYPES = createLazyReadonlyArrayFacade(
  () => getSupportedDocumentationTypeRegistryState().supportedTypes,
);

export function getDocumentationTypeMetadata(key: string): DocumentationTypeMetadata | undefined {
  return getSupportedDocumentationTypeRegistryState().byKey.get(key);
}

export function getSupportedDocumentationTypeMetadata(
  key: SupportedDocumentationType,
): SupportedDocumentationTypeMetadata {
  const metadata = getSupportedDocumentationTypeRegistryState().byKey.get(key);

  if (metadata === undefined) {
    throw new Error(`Unsupported documentation type: ${key}`);
  }

  return metadata;
}

export function freezeSupportedDocumentationTypeMetadata(
  entry: SupportedDocumentationTypeMetadata,
): SupportedDocumentationTypeMetadata {
  Object.freeze(entry.generatorAliases);
  freezeDisclosureMatrix(entry.disclosureMatrix);
  return Object.freeze(entry);
}

function composeSupportedDocumentationTypeMetadata(
  identity: DocumentationTypeIdentity,
): SupportedDocumentationTypeMetadata {
  return {
    ...identity,
    ...DOCUMENTATION_TYPE_OUTPUT_ROUTING[identity.key],
    ...DOCUMENTATION_TYPE_DISCLOSURE[identity.key],
    ...DOCUMENTATION_TYPE_CLI_SURFACE[identity.key],
  };
}

function getSupportedDocumentationTypeRegistryState(): SupportedDocumentationTypeRegistryState {
  supportedDocumentationTypeRegistryState ??= buildSupportedDocumentationTypeRegistryState();
  return supportedDocumentationTypeRegistryState;
}

function buildSupportedDocumentationTypeRegistryState(): SupportedDocumentationTypeRegistryState {
  const registry = Object.freeze(
    DOCUMENTATION_TYPE_REGISTRY.map((entry) => freezeSupportedDocumentationTypeMetadata(entry)),
  );
  const supportedTypes = Object.freeze(registry.map((entry) => entry.key));

  return {
    registry,
    supportedTypes,
    byKey: new Map(registry.map((entry) => [entry.key, entry])),
  };
}

function createLazyReadonlyArrayFacade<TValue>(load: () => readonly TValue[]): readonly TValue[] {
  const target: TValue[] = [];
  let initialized = false;

  function initialize(): void {
    if (initialized) {
      return;
    }

    initialized = true;
    target.push(...load());
    Object.freeze(target);
  }

  return new Proxy(target, {
    get(currentTarget, property, receiver): unknown {
      initialize();
      return Reflect.get(currentTarget, property, receiver) as unknown;
    },
    getOwnPropertyDescriptor(currentTarget, property) {
      initialize();
      return Reflect.getOwnPropertyDescriptor(currentTarget, property);
    },
    has(currentTarget, property) {
      initialize();
      return Reflect.has(currentTarget, property);
    },
    ownKeys(currentTarget) {
      initialize();
      return Reflect.ownKeys(currentTarget);
    },
    set() {
      initialize();
      return false;
    },
  });
}
