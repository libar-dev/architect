/**
 * @architect
 * @architect-pattern ProjectConfigSnapshot
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:documentation-composition
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import { z } from 'zod';

export const ProjectConfigSnapshotSchema = z.strictObject({
  kind: z.literal('ProjectConfigSnapshot'),
  baseDir: z.string(),
  configPath: z.string(),
  sourceGlobs: z.array(z.string()),
  buildTimeMs: z.number().int().nonnegative(),
  patternCount: z.number().int().nonnegative(),
  phaseCount: z.number().int().nonnegative(),
  roleCount: z.number().int().nonnegative(),
  projectName: z.string().optional(),
});

export type ProjectConfigSnapshot = z.infer<typeof ProjectConfigSnapshotSchema>;
