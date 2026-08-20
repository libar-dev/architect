/**
 * @architect-bounded-context:governance
 */
export {
  collectBusinessRuleProductAreas,
  parseAndProjectBusinessRuleSet,
  projectBusinessRule,
  projectBusinessRuleSet,
} from './business-rules.js';
export type { BusinessRuleSetOptions } from './business-rules.js';
export { projectDecisionCatalog, projectDecisionRecord } from './decision-records.js';
export {
  TaxonomyDigestOptionsSchema,
  parseAndProjectTaxonomyDigest,
  projectTaxonomyDigest,
  summarizeTaxonomyDigest,
} from './taxonomy-digest.js';
export type { TaxonomyDigestOptions } from './taxonomy-digest.internal.js';
export type { TaxonomyDigestCountSummary } from '../../fragments/governance/index.js';
export { projectValidationRuleDigest } from './validation-rule-digest.js';
