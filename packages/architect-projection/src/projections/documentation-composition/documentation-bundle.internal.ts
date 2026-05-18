/**
 * @architect-bounded-context:documentation-composition
 */
import { z } from 'zod';

import type { ProjectionContext } from '../../context/projection-context.js';
import type { ProjectionBundle } from '../../fragments/base.js';
import type { Fragment } from '../../fragments/index.js';
import { ProjectionError } from '../errors.js';

import { getDocumentationDefinition } from './documentation-definition.internal.js';
import {
  getDocumentationTypeMetadata,
  SUPPORTED_DOCUMENTATION_TYPES,
  type SupportedDocumentationType,
} from './documentation-type-registry.js';
import { resolveProjectionFilter } from './projection-filter-resolver.js';
import { ProgressiveDisclosureLevelSchema } from '../../disclosure/levels.js';

export type { SupportedDocumentationType } from './documentation-type-registry.js';

export const ProjectDocumentationBundleOptionsSchema = z
  .strictObject({
    documentType: z.custom<SupportedDocumentationType>(
      (value): value is SupportedDocumentationType =>
        typeof value === 'string' && getDocumentationTypeMetadata(value) !== undefined,
      { message: `Supported types: ${SUPPORTED_DOCUMENTATION_TYPES.join(', ')}` },
    ),
    disclosureLevel: ProgressiveDisclosureLevelSchema.optional(),
  })
  .readonly();

export const RawProjectDocumentationBundleOptionsSchema = z
  .strictObject({
    documentType: z.string(),
    disclosureLevel: ProgressiveDisclosureLevelSchema.optional(),
  })
  .readonly();

export type ProjectDocumentationBundleOptions = z.infer<
  typeof ProjectDocumentationBundleOptionsSchema
>;
type RawProjectDocumentationBundleOptions = z.infer<
  typeof RawProjectDocumentationBundleOptionsSchema
>;

export function assertSupportedDocumentType(documentType: string): SupportedDocumentationType {
  const definition = getDocumentationDefinition(documentType);
  if (definition !== undefined) {
    return definition.key;
  }

  throw new ProjectionError(
    'UNKNOWN_DOCUMENT_TYPE',
    `Unknown document type "${documentType}". Supported types: ${SUPPORTED_DOCUMENTATION_TYPES.join(', ')}.`,
  );
}

export function projectDocumentationBundleInternal(
  context: ProjectionContext,
  options: RawProjectDocumentationBundleOptions,
): ProjectionBundle<Fragment> {
  const documentType = assertSupportedDocumentType(options.documentType);
  const definition = getDocumentationDefinition(documentType);

  if (definition === undefined) {
    throw new ProjectionError(
      'UNKNOWN_DOCUMENT_TYPE',
      `Unknown document type "${documentType}". Supported types: ${SUPPORTED_DOCUMENTATION_TYPES.join(', ')}.`,
    );
  }

  const filteredContext = withDocumentationFilter(context, documentType, options.disclosureLevel);
  const bundle = definition.project(filteredContext);

  if (bundle.routing !== undefined) {
    const level = options.disclosureLevel ?? definition.defaultDisclosureLevel;
    const childDirectory = 'childDirectory' in definition ? definition.childDirectory : undefined;
    const entityPathLayout =
      'entityPathLayout' in definition ? definition.entityPathLayout : undefined;
    return {
      ...bundle,
      routing: {
        ...bundle.routing,
        disclosureSpec: definition.disclosureMatrix[level],
        markdownRootTarget: definition.markdownRootTarget,
        ...(childDirectory !== undefined ? { markdownChildDirectory: childDirectory } : {}),
        ...(entityPathLayout !== undefined ? { entityPathLayout } : {}),
      },
    };
  }

  return bundle;
}

function withDocumentationFilter(
  context: ProjectionContext,
  documentType: SupportedDocumentationType,
  disclosureLevel: ProjectDocumentationBundleOptions['disclosureLevel'],
): ProjectionContext {
  const projectionFilter = resolveProjectionFilter(context, documentType, disclosureLevel);

  return projectionFilter === undefined ? context : { ...context, projectionFilter };
}
