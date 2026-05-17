/**
 * Disclosure-level vocabulary — package-wide concepts consumed by renderers,
 * fragments, and projections. Promoted here from documentation-composition/
 * so consumers don't reach across domain boundaries (was finding F17 in the
 * architect-projection comprehensive review).
 */
import { z } from 'zod';

export const PROGRESSIVE_DISCLOSURE_LEVELS = [
  'essential',
  'important',
  'useful',
  'advanced',
] as const;

export const ProgressiveDisclosureLevelSchema = z
  .enum(PROGRESSIVE_DISCLOSURE_LEVELS)
  .describe(
    'Progressive disclosure tier for documentation content. "essential" = root summaries and orientation needed before any drill-down; "important" = primary details reachable from the same bundle; "useful" = secondary or nested detail available through explicit routes; "advanced" = deep reference material intentionally separated from the primary path.',
  );
export type ProgressiveDisclosureLevel = z.infer<typeof ProgressiveDisclosureLevelSchema>;

export const ProgressiveDisclosurePolicySchema = z
  .strictObject({
    level: ProgressiveDisclosureLevelSchema.describe(
      'Disclosure tier this policy applies to. Determines whether content is always present, nearby, available on request, or relegated to deep reference material.',
    ),
    availability: z
      .enum(['always', 'nearby', 'available', 'reference'])
      .describe(
        'Where this tier surfaces relative to the primary document path. "always" = inline in the root document; "nearby" = same bundle, one hop away; "available" = explicit route the reader must follow; "reference" = deep-link only, off the primary path.',
      ),
    purpose: z
      .string()
      .min(1)
      .describe('One-sentence rationale for placing content at this disclosure level.'),
  })
  .describe(
    'Policy entry mapping a progressive-disclosure level to its surface availability and the editorial reason for placing content there.',
  );

export type ProgressiveDisclosurePolicy = z.infer<typeof ProgressiveDisclosurePolicySchema>;

export const PROGRESSIVE_DISCLOSURE_POLICY = [
  {
    level: 'essential',
    availability: 'always',
    purpose: 'Root summaries and orientation needed before any drill-down.',
  },
  {
    level: 'important',
    availability: 'nearby',
    purpose: 'Primary details reachable from the same bundle.',
  },
  {
    level: 'useful',
    availability: 'available',
    purpose: 'Secondary or nested detail available through explicit routes.',
  },
  {
    level: 'advanced',
    availability: 'reference',
    purpose: 'Deep reference material intentionally separated from the primary path.',
  },
] as const satisfies readonly ProgressiveDisclosurePolicy[];
