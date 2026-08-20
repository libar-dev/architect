/**
 * @architect
 * @architect-pattern DocumentationDefinitionRegistry
 * @architect-status completed
 * @architect-role:decider
 * @architect-bounded-context:documentation-composition
 * @architect-uses ProjectionContext, ProjectionBundle, DocumentationTypeIdentity, ApiReferenceProjection, ArchitectureDiagramProjection, DesignReviewProjection, DecisionCatalogProjection, BusinessRulesProjection, TaxonomyDigestProjection, ValidationRuleDigestProjection, TraceabilityMatrixProjection
 */
import type { ProjectionContext } from '../../context/projection-context.js';
import type { ProjectionBundle } from '../../fragments/base.js';
import type { Fragment } from '../../fragments/index.js';
import { projectPatternCatalog } from '../pattern-relations/pattern-catalog.js';
import {
  projectChangelog,
  projectCurrentWork,
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

import { buildApiReferenceBundle } from './api-reference.js';
import { buildArchitectureBundle } from './architecture-diagram.js';
import { buildDesignReviewBundle } from './design-review.js';
import { DOCUMENTATION_TYPE_CLI_SURFACE } from './documentation-type-registry.cli-surface.js';
import { DOCUMENTATION_TYPE_DISCLOSURE } from './documentation-type-registry.disclosure.js';
import {
  SUPPORTED_DOCUMENTATION_TYPE_IDENTITIES,
  type DocumentationTypeIdentity,
  type SupportedDocumentationType,
} from './documentation-type-registry.identity.js';
import { DOCUMENTATION_TYPE_OUTPUT_ROUTING } from './documentation-type-registry.output-routing.js';

type DocumentationProjectionFactory = (context: ProjectionContext) => ProjectionBundle<Fragment>;

export type DocumentationDefinition = Readonly<
  DocumentationTypeIdentity &
    (typeof DOCUMENTATION_TYPE_OUTPUT_ROUTING)[SupportedDocumentationType] &
    (typeof DOCUMENTATION_TYPE_DISCLOSURE)[SupportedDocumentationType] &
    (typeof DOCUMENTATION_TYPE_CLI_SURFACE)[SupportedDocumentationType] & {
      project: DocumentationProjectionFactory;
    }
>;

const DOCUMENTATION_PROJECTIONS = {
  architecture: (context) => buildArchitectureBundle(context),
  'design-review': (context) => buildDesignReviewBundle(context),
  'api-reference': (context) => buildApiReferenceBundle(context),
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
  changelog: (context) => projectChangelog(context),
  traceability: (context) => projectTraceabilityMatrix(context),
} satisfies Record<SupportedDocumentationType, DocumentationProjectionFactory>;

function freezeDocumentationDefinition(
  definition: DocumentationDefinition,
): DocumentationDefinition {
  Object.freeze(definition.generatorAliases);
  Object.freeze(definition.disclosureMatrix);
  return Object.freeze(definition);
}

export const DocDefinition = {
  build(identity: DocumentationTypeIdentity): DocumentationDefinition {
    const key = identity.key;

    return freezeDocumentationDefinition({
      ...identity,
      ...DOCUMENTATION_TYPE_OUTPUT_ROUTING[key],
      ...DOCUMENTATION_TYPE_DISCLOSURE[key],
      ...DOCUMENTATION_TYPE_CLI_SURFACE[key],
      project: DOCUMENTATION_PROJECTIONS[key],
    });
  },
} as const;

export const DOCUMENTATION_DEFINITIONS = Object.freeze(
  SUPPORTED_DOCUMENTATION_TYPE_IDENTITIES.map((identity) => DocDefinition.build(identity)),
);

const DOCUMENTATION_DEFINITION_BY_KEY = new Map<string, DocumentationDefinition>(
  DOCUMENTATION_DEFINITIONS.map((definition) => [definition.key, definition] as const),
);

export function getDocumentationDefinition(key: string): DocumentationDefinition | undefined {
  return DOCUMENTATION_DEFINITION_BY_KEY.get(key);
}
