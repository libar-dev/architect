/**
 * @architect
 * @architect-pattern BusinessRulesProjection
 * @architect-status completed
 * @architect-role:projection
 * @architect-uses GovernanceProjectionSupport, ProjectionFragmentContracts
 * @architect-bounded-context:projection
 *
 * **Value:** Exposes normalized `BusinessRule` and `BusinessRuleSet`
 * projections so documentation and UI consumers render rule invariants,
 * rationales, and verified-by lists without parsing annotation prose
 * themselves.
 *
 * **Invariant:** Single-rule and rule-set projections always produce
 * schema-validated fragments; set options are parsed through
 * `BusinessRuleSetOptionsSchema` (rejecting invalid scope or grouping values),
 * and bundle children are keyed and routed per the selected grouping.
 *
 * **Behavior:**
 * - `projectBusinessRule` looks up a rule by feature + rule name and returns
 *   a single-bundle projection of the normalized `BusinessRule`, unless the
 *   current `ProjectionFilter` excludes the owning pattern.
 * - `projectBusinessRuleSet` filters, groups, and sorts rules by product
 *   area, package, phase, or feature; defaults to scope `all` when no option
 *   is given.
 * - Re-exports `BusinessRuleSetOptionsSchema` for callers that validate
 *   options independently, and exposes `parseAndProjectBusinessRuleSet` as a
 *   parse-then-project wrapper.
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */

import type { ProjectionContext } from '../../context/projection-context.js';
import { projectSingle, type ProjectionBundle } from '../../fragments/base.js';
import type { BusinessRule, BusinessRuleSet } from '../../fragments/governance/index.js';
import {
  BusinessRuleSetOptionsSchema,
  buildBusinessRule,
  buildBusinessRuleSet,
  type BusinessRuleSetOptions,
} from './business-rules.internal.js';
import { parseAndProject } from '../_shared/parse-and-project.internal.js';

export { BusinessRuleSetOptionsSchema } from './business-rules.internal.js';

export function projectBusinessRule(
  context: ProjectionContext,
  feature: string,
  ruleName: string
): ProjectionBundle<BusinessRule> | undefined {
  const businessRule = buildBusinessRule(context, feature, ruleName);
  return businessRule === undefined ? undefined : projectSingle(businessRule);
}

export function projectBusinessRuleSet(
  context: ProjectionContext,
  options: BusinessRuleSetOptions = { scope: 'all' }
): ProjectionBundle<BusinessRuleSet> {
  return buildBusinessRuleSet(context, options);
}

export const parseAndProjectBusinessRuleSet = parseAndProject(
  BusinessRuleSetOptionsSchema,
  projectBusinessRuleSet,
  'parseAndProjectBusinessRuleSet',
  { scope: 'all' }
);

export type { BusinessRuleSetOptions } from './business-rules.internal.js';
