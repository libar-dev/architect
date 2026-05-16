/**
 * @architect
 * @architect-pattern ValidationRuleDigest
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:governance
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

import {
  FsmGraphSchema,
  ProtectionLevelEntrySchema,
  ValidationRuleEntrySchema,
} from './supporting.js';

export const ValidationRuleDigestSchema = z.strictObject({
  kind: z.literal('ValidationRuleDigest'),
  rules: z.array(ValidationRuleEntrySchema),
  fsm: FsmGraphSchema,
  protectionLevels: z.array(ProtectionLevelEntrySchema),
});

export type ValidationRuleDigest = z.infer<typeof ValidationRuleDigestSchema>;
