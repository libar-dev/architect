/**
 * @architect-bounded-context:documentation-composition
 */
import { z } from 'zod';

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { Fragment } from '../../fragments/index.js';
import { projectPatternCatalog } from '../pattern-relations/pattern-catalog.js';
import { ProjectionError } from '../errors.js';
import {
  projectCurrentWork,
  projectReleaseNotesDigest,
  projectRoadmapTimeline,
  projectTraceabilityMatrix,
} from '../delivery-reporting/index.js';
import { projectDecisionCatalog, projectValidationRuleDigest } from '../governance/index.js';
import { projectBusinessRuleSet } from '../governance/business-rules.js';
import { projectTaxonomyDigest } from '../governance/taxonomy-digest.js';
import {
  projectRequirementExecutableDigest,
  projectRequirementSpecsDigest,
} from '../operational-insights/index.js';

import { buildArchitectureDiagram } from './architecture-diagram.internal.js';
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
      { message: `Supported types: ${SUPPORTED_DOCUMENTATION_TYPES.join(', ')}` }
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

type DocumentationProjectionFactory = (context: ProjectionContext) => ProjectionBundle<Fragment>;

const DOCUMENTATION_PROJECTION_FACTORIES = {
  architecture: (context) =>
    projectSingle(buildArchitectureDiagram(context, { scope: 'component' })),
  decisions: (context) => projectDecisionCatalog(context),
  'business-rules': (context) =>
    projectBusinessRuleSet(context, { scope: 'all', groupedBy: 'package' }),
  patterns: (context) => projectPatternCatalog(context),
  roadmap: (context) => projectRoadmapTimeline(context),
  'current-work': (context) => projectCurrentWork(context),
  'requirements-executable': (context) => projectRequirementExecutableDigest(context),
  'requirements-specs': (context) => projectRequirementSpecsDigest(context),
  'validation-rules': (context) => projectValidationRuleDigest(context),
  taxonomy: (context) => projectTaxonomyDigest(context),
  changelog: (context) => projectReleaseNotesDigest(context),
  traceability: (context) => projectTraceabilityMatrix(context),
} satisfies Record<SupportedDocumentationType, DocumentationProjectionFactory>;

export function assertSupportedDocumentType(documentType: string): SupportedDocumentationType {
  const metadata = getDocumentationTypeMetadata(documentType);
  if (metadata !== undefined) {
    return metadata.key;
  }

  throw new ProjectionError(
    'UNKNOWN_DOCUMENT_TYPE',
    `Unknown document type "${documentType}". Supported types: ${SUPPORTED_DOCUMENTATION_TYPES.join(', ')}.`
  );
}

export function projectDocumentationBundleInternal(
  context: ProjectionContext,
  options: RawProjectDocumentationBundleOptions
): ProjectionBundle<Fragment> {
  const documentType = assertSupportedDocumentType(options.documentType);
  const filteredContext = withDocumentationFilter(context, documentType, options.disclosureLevel);
  const bundle = DOCUMENTATION_PROJECTION_FACTORIES[documentType](filteredContext);

  const metadata = getDocumentationTypeMetadata(documentType);
  if (metadata !== undefined && bundle.routing !== undefined) {
    const level = options.disclosureLevel ?? metadata.defaultDisclosureLevel;
    const childDirectory =
      'childDirectory' in metadata ? metadata.childDirectory : undefined;
    const entityPathLayout =
      'entityPathLayout' in metadata ? metadata.entityPathLayout : undefined;
    return {
      ...bundle,
      routing: {
        ...bundle.routing,
        disclosureSpec: metadata.disclosureMatrix[level],
        markdownRootTarget: metadata.markdownRootTarget,
        ...(childDirectory !== undefined
          ? { markdownChildDirectory: childDirectory }
          : {}),
        ...(entityPathLayout !== undefined ? { entityPathLayout } : {}),
      },
    };
  }

  return bundle;
}

function withDocumentationFilter(
  context: ProjectionContext,
  documentType: SupportedDocumentationType,
  disclosureLevel: ProjectDocumentationBundleOptions['disclosureLevel']
): ProjectionContext {
  const projectionFilter = resolveProjectionFilter(context, documentType, disclosureLevel);

  return projectionFilter === undefined ? context : { ...context, projectionFilter };
}
