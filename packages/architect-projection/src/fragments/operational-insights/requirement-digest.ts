/**
 * @architect
 * @architect-pattern RequirementDigest
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:operational-insights
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

import { BusinessRuleReferenceSchema } from '../governance/business-rule-reference.js';
import { RequirementEntrySchema } from './supporting.js';

export const RequirementDigestSchema = z.strictObject({
  kind: z.literal('RequirementDigest'),
  productArea: z.string(),
  requirements: z.array(RequirementEntrySchema),
  businessRuleReferences: z.array(BusinessRuleReferenceSchema),
});

export type RequirementDigest = z.infer<typeof RequirementDigestSchema>;

export const REQUIREMENTS_ALL_AREAS_LABEL = 'All Product Areas';
export const REQUIREMENTS_EXECUTABLE_AREA_LABEL = 'Implemented (Value Transfer Complete)';
export const REQUIREMENTS_SPECS_AREA_LABEL = 'Specs (Pending Implementation)';
