import { z } from 'zod';

import { ACCEPTED_STATUS_VALUES, type AcceptedStatusValue } from '../taxonomy/index.js';
import { asDirectiveTag, type DirectiveTag } from '../types/branded.js';
import { HierarchyLevelSchema } from './dual-source.js';
import type { TagRegistry } from './tag-registry.js';
import { PatternIdentifierSchema, PatternReferenceSchema } from './pattern-contract.js';

export const PositionSchema = z
  .strictObject({
    startLine: z.number().int().positive('Line numbers must be positive'),
    endLine: z.number().int().positive('Line numbers must be positive'),
  })
  .refine((pos) => pos.endLine >= pos.startLine, {
    message: 'End line must be >= start line',
  });

export type Position = z.output<typeof PositionSchema>;

export const createDirectiveTagSchema = (
  tagPrefix: string,
): z.ZodPipe<z.ZodString, z.ZodTransform<DirectiveTag, string>> =>
  z
    .string()
    .min(1, 'Tag cannot be empty')
    .refine((tag) => tag.startsWith(tagPrefix), {
      message: `Tags must start with ${tagPrefix}`,
    })
    .transform((tag) => asDirectiveTag(tag));

const DirectiveTagSchema = createDirectiveTagSchema('@architect-');

export const DefaultPatternStatusSchema = z.enum(ACCEPTED_STATUS_VALUES);
export const AcceptedPatternStatusSchema = z.enum(ACCEPTED_STATUS_VALUES);
export const PatternStatusSchema = z.enum(ACCEPTED_STATUS_VALUES);
export type PatternStatus = AcceptedStatusValue;

export function createPatternStatusSchema(registry: TagRegistry): z.ZodType<string> {
  const statusTag = registry.metadataTags.find((tag) => tag.tag === 'status');
  if (statusTag?.values && statusTag.values.length > 0) {
    const [first, ...rest] = statusTag.values;
    if (first) {
      return z.enum([first, ...rest]);
    }
  }
  return DefaultPatternStatusSchema;
}

export const DocDirectiveSchema = z.strictObject({
  tags: z.array(DirectiveTagSchema).readonly(),
  description: z.string().default(''),
  examples: z.array(z.string()).readonly().default([]),
  position: PositionSchema,
  patternName: PatternIdentifierSchema.optional(),
  status: PatternStatusSchema.optional(),
  role: z.string().optional(),
  unlockReason: z.string().optional(),
  boundedContext: z.string().optional(),
  whenToUse: z.array(z.string()).readonly().optional(),
  uses: z.array(PatternReferenceSchema).readonly().optional(),
  level: HierarchyLevelSchema.optional(),
  parent: PatternIdentifierSchema.optional(),
  implements: z.array(z.string()).readonly().optional(),
  extends: z.string().optional(),
  seeAlso: z.array(z.string()).readonly().optional(),
  enforcesDecisions: z.array(z.string()).readonly().optional(),
  apiRef: z.array(z.string()).readonly().optional(),
  target: z.string().optional(),
  executableSpecs: z.array(z.string()).readonly().optional(),
  archRole: z.string().optional(),
  include: z.array(z.string().min(1)).readonly().optional(),
  productArea: z.string().optional(),
  convention: z.array(z.string()).readonly().optional(),
  deprecatedTags: z.array(z.string()).readonly().optional(),
});

export type DocDirective = z.output<typeof DocDirectiveSchema>;

export function isDocDirective(value: unknown): value is DocDirective {
  return DocDirectiveSchema.safeParse(value).success;
}
