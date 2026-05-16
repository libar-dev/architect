import { RenderFormatSchema, SessionTypeSchema } from '@libar-dev/architect-core';
import { z } from 'zod';
import type {
  BuildResult,
  PackageConfig,
  PatternGraphAPI,
  QueryMetadataExtra,
  RuntimePatternGraph,
  TagRegistry,
} from '@libar-dev/architect-core';
import type { ProjectionContext } from '@libar-dev/architect-projection';

export const ParsedArgsSchema = z
  .strictObject({
    baseDir: z.string(),
    input: z.array(z.string()).readonly(),
    features: z.array(z.string()).readonly(),
    command: z.string().nullable(),
    commandArgs: z.array(z.string()).readonly(),
    help: z.boolean(),
    version: z.boolean(),
    dryRun: z.boolean(),
    noCache: z.boolean(),
    format: RenderFormatSchema,
    sessionType: SessionTypeSchema,
    sessionTypeExplicit: z.boolean(),
    depth: z.number().int(),
  })
  .readonly();

export type ParsedArgs = z.output<typeof ParsedArgsSchema>;

export interface SourcePlan {
  readonly baseDir: string;
  readonly input: readonly string[];
  readonly features: readonly string[];
  readonly exclude: readonly string[];
  readonly tagRegistry: TagRegistry | undefined;
  readonly configLabel: string;
  readonly packages: readonly PackageConfig[];
}

export const CacheRecordSchema = z
  .strictObject({
    createdAt: z.number().int(),
    signature: z.string(),
  })
  .readonly();

export type CacheRecord = z.output<typeof CacheRecordSchema>;

export interface CliContext {
  readonly args: ParsedArgs;
  readonly sourcePlan: SourcePlan;
  readonly build: BuildResult;
  readonly graph: RuntimePatternGraph;
  readonly api: PatternGraphAPI;
  readonly projection: ProjectionContext;
  readonly metadata: QueryMetadataExtra;
}
