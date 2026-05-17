/**
 * @architect-bounded-context:documentation-composition
 */
import type { ProgressiveDisclosureLevel } from '../../disclosure/levels.js';

import type { SupportedDocumentationType } from './documentation-type-registry.identity.js';
import {
  architectureDisclosureMatrix,
  businessRulesDisclosureMatrix,
  changelogDisclosureMatrix,
  currentWorkDisclosureMatrix,
  decisionsDisclosureMatrix,
  patternsDisclosureMatrix,
  requirementsDisclosureMatrix,
  roadmapDisclosureMatrix,
  taxonomyDisclosureMatrix,
  traceabilityDisclosureMatrix,
  type DocumentationDisclosureMatrix,
  validationRulesDisclosureMatrix,
} from './disclosure-matrix.js';

type DocumentationTypeDisclosure = Readonly<{
  defaultDisclosureLevel: ProgressiveDisclosureLevel;
  disclosureMatrix: DocumentationDisclosureMatrix;
}>;

export const DOCUMENTATION_TYPE_DISCLOSURE = {
  architecture: {
    defaultDisclosureLevel: 'essential',
    disclosureMatrix: architectureDisclosureMatrix,
  },
  decisions: {
    defaultDisclosureLevel: 'important',
    disclosureMatrix: decisionsDisclosureMatrix,
  },
  'business-rules': {
    defaultDisclosureLevel: 'important',
    disclosureMatrix: businessRulesDisclosureMatrix,
  },
  patterns: {
    defaultDisclosureLevel: 'important',
    disclosureMatrix: patternsDisclosureMatrix,
  },
  roadmap: {
    defaultDisclosureLevel: 'important',
    disclosureMatrix: roadmapDisclosureMatrix,
  },
  'current-work': {
    defaultDisclosureLevel: 'essential',
    disclosureMatrix: currentWorkDisclosureMatrix,
  },
  'requirements-executable': {
    defaultDisclosureLevel: 'important',
    disclosureMatrix: requirementsDisclosureMatrix,
  },
  'requirements-specs': {
    defaultDisclosureLevel: 'important',
    disclosureMatrix: requirementsDisclosureMatrix,
  },
  'validation-rules': {
    defaultDisclosureLevel: 'useful',
    disclosureMatrix: validationRulesDisclosureMatrix,
  },
  taxonomy: {
    defaultDisclosureLevel: 'advanced',
    disclosureMatrix: taxonomyDisclosureMatrix,
  },
  changelog: {
    defaultDisclosureLevel: 'useful',
    disclosureMatrix: changelogDisclosureMatrix,
  },
  traceability: {
    defaultDisclosureLevel: 'advanced',
    disclosureMatrix: traceabilityDisclosureMatrix,
  },
} as const satisfies Record<SupportedDocumentationType, DocumentationTypeDisclosure>;
