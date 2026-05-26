/**
 * @architect-bounded-context:documentation-composition
 */
import type { SupportedDocumentationType } from './documentation-type-registry.identity.js';

type DocumentationTypeCliSurface = Readonly<{
  generatorName: string;
  generatorAliases: readonly string[];
}>;

export const DOCUMENTATION_TYPE_CLI_SURFACE = {
  architecture: {
    generatorName: 'architecture',
    generatorAliases: [],
  },
  'api-reference': {
    generatorName: 'api-reference',
    generatorAliases: ['api'],
  },
  decisions: {
    generatorName: 'decisions',
    generatorAliases: ['adrs'],
  },
  'business-rules': {
    generatorName: 'business-rules',
    generatorAliases: [],
  },
  patterns: {
    generatorName: 'patterns',
    generatorAliases: [],
  },
  roadmap: {
    generatorName: 'roadmap',
    generatorAliases: [],
  },
  'current-work': {
    generatorName: 'current-work',
    generatorAliases: ['current'],
  },
  'requirements-executable': {
    generatorName: 'requirements-executable',
    generatorAliases: [],
  },
  'requirements-specs': {
    generatorName: 'requirements-specs',
    generatorAliases: [],
  },
  'validation-rules': {
    generatorName: 'validation-rules',
    generatorAliases: [],
  },
  taxonomy: {
    generatorName: 'taxonomy',
    generatorAliases: [],
  },
  changelog: {
    generatorName: 'changelog',
    generatorAliases: [],
  },
  traceability: {
    generatorName: 'traceability',
    generatorAliases: [],
  },
} as const satisfies Record<SupportedDocumentationType, DocumentationTypeCliSurface>;
