/**
 * @architect-bounded-context:documentation-composition
 */
import type { SupportedDocumentationType } from './documentation-type-registry.identity.js';

type DocumentationTypeOutputRouting = Readonly<{
  markdownRootTarget: `${string}.md`;
  childDirectory?: string;
  entityPathLayout?: 'nested-index';
}>;

export const DOCUMENTATION_TYPE_OUTPUT_ROUTING = {
  architecture: {
    markdownRootTarget: 'ARCHITECTURE.md',
    childDirectory: 'architecture',
  },
  decisions: {
    markdownRootTarget: 'DECISIONS.md',
    childDirectory: 'decisions',
  },
  'business-rules': {
    markdownRootTarget: 'BUSINESS-RULES.md',
    childDirectory: 'business-rules',
  },
  patterns: {
    markdownRootTarget: 'PATTERNS.md',
    childDirectory: 'patterns',
  },
  roadmap: {
    markdownRootTarget: 'ROADMAP.md',
    childDirectory: 'roadmap',
  },
  'current-work': {
    markdownRootTarget: 'CURRENT-WORK.md',
  },
  'requirements-executable': {
    markdownRootTarget: 'REQUIREMENTS-EXECUTABLE.md',
    childDirectory: 'requirements-executable',
    entityPathLayout: 'nested-index',
  },
  'requirements-specs': {
    markdownRootTarget: 'REQUIREMENTS-SPECS.md',
    childDirectory: 'requirements-specs',
  },
  'validation-rules': {
    markdownRootTarget: 'VALIDATION-RULES.md',
    childDirectory: 'validation',
  },
  taxonomy: {
    markdownRootTarget: 'TAXONOMY.md',
    childDirectory: 'taxonomy',
  },
  changelog: {
    markdownRootTarget: 'CHANGELOG.md',
  },
  traceability: {
    markdownRootTarget: 'TRACEABILITY.md',
    childDirectory: 'traceability',
  },
} as const satisfies Record<SupportedDocumentationType, DocumentationTypeOutputRouting>;
