/**
 * @architect-bounded-context:_shared
 */
import { parseAtBoundary } from '@libar-dev/architect-core';
import type { z } from 'zod';

import type { ProjectionContext } from '../../context/projection-context.js';

const NO_DEFAULT_RAW_OPTIONS = Symbol('NO_DEFAULT_RAW_OPTIONS');

/**
 * Shared trust-boundary wrapper for projection entrypoints. It enforces the
 * single parse-at-boundary rule: raw caller options are parsed exactly once,
 * then typed options flow into the projection.
 *
 * Callers with strict-object option schemas should route through this helper
 * instead of parsing again downstream.
 *
 * `NO_DEFAULT_RAW_OPTIONS` means "do not inject a default parse input" so
 * `undefined` keeps its normal optional-input semantics.
 */
export function parseAndProject<Options, Output>(
  schema: z.ZodType<Options>,
  project: (context: ProjectionContext, options: Options) => Output,
  projectionName: string,
  defaultRawOptions: unknown = NO_DEFAULT_RAW_OPTIONS,
): (context: ProjectionContext, rawOptions?: unknown) => Output {
  const errorContext = `Invalid options for ${projectionName}`;

  return (context, rawOptions) => {
    const optionsInput =
      rawOptions === undefined && defaultRawOptions !== NO_DEFAULT_RAW_OPTIONS
        ? defaultRawOptions
        : rawOptions;
    return project(context, parseAtBoundary(schema, optionsInput, errorContext));
  };
}
