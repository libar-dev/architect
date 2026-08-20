/**
 * @architect-bounded-context:documentation-composition
 */
/**
 * Builds the project-config options schema and snapshot helpers for
 * documentation-composition projections.
 */

import { z } from 'zod';

import type { ProjectionContext } from '../../context/projection-context.js';
import type { ProjectConfigSnapshot } from '../../fragments/documentation-composition/index.js';

import { dedupeStrings, hasText } from './documentation-composition-shared.internal.js';

export const SourceGlobGroupsSchema = z
  .strictObject({
    input: z.array(z.string()).readonly(),
    features: z.array(z.string()).readonly(),
    exclude: z.array(z.string()).readonly().optional(),
  })
  .readonly();

export type SourceGlobGroups = z.infer<typeof SourceGlobGroupsSchema>;

export const ProjectConfigOptionsSchema = z
  .strictObject({
    baseDir: z.string(),
    configPath: z.string(),
    buildTimeMs: z.number(),
    sourceGlobs: SourceGlobGroupsSchema,
    projectName: z.string().optional(),
  })
  .readonly();

export type ProjectConfigOptions = z.infer<typeof ProjectConfigOptionsSchema>;

export function buildProjectConfigSnapshot(
  context: ProjectionContext,
  options: ProjectConfigOptions,
): ProjectConfigSnapshot {
  return {
    kind: 'ProjectConfigSnapshot',
    baseDir: options.baseDir,
    configPath: options.configPath,
    sourceGlobs: dedupeStrings([
      ...options.sourceGlobs.input,
      ...options.sourceGlobs.features,
      ...(options.sourceGlobs.exclude ?? []).map((entry) =>
        entry.trim().startsWith('!') ? entry : `!${entry}`,
      ),
    ]),
    buildTimeMs: options.buildTimeMs,
    patternCount: context.graph.patterns.length,
    roleCount: context.graph.roleCount,
    ...(resolveProjectName(context, options.projectName) !== undefined
      ? { projectName: resolveProjectName(context, options.projectName) }
      : {}),
  };
}

function resolveProjectName(
  context: ProjectionContext,
  explicitProjectName: string | undefined,
): string | undefined {
  if (hasText(explicitProjectName)) {
    return explicitProjectName.trim();
  }

  const metadataName = context.projectMetadata?.name;
  return hasText(metadataName) ? metadataName.trim() : undefined;
}
