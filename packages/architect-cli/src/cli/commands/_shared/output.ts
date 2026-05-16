import {
  createSuccess,
  type QueryMetadataExtra,
  type QuerySuccess,
} from '@libar-dev/architect-core';
import {
  isBundle,
  renderCompactText,
  renderJson,
  type Fragment,
  type ProjectionBundle,
} from '@libar-dev/architect-projection';
import type { CliContext, ParsedArgs } from '../../pattern-graph-cli-types.js';

function renderPrettyJson(input: Fragment | ProjectionBundle<Fragment>): string {
  const rendered = renderJson(input, { pretty: true });
  if (typeof rendered !== 'string') {
    throw new Error('renderJson(..., { pretty: true }) must return a string.');
  }
  return rendered;
}

export function stringifyJsonValue(value: unknown): string {
  if (value === undefined) {
    return 'null';
  }

  return JSON.stringify(value, null, 2);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function looksLikeBundleCandidate(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value) && ('root' in value || 'children' in value || 'routing' in value);
}

function renderEnvelopeWithBundleData(
  envelope: Record<string, unknown> & { data: ProjectionBundle<Fragment> }
): string {
  return stringifyJsonValue({
    ...envelope,
    data: JSON.parse(renderPrettyJson(envelope.data)) as unknown,
  });
}

export function createValidationMetadata(
  build: CliContext['build']
): NonNullable<QueryMetadataExtra['validation']> {
  return {
    danglingReferenceCount: build.validation.danglingReferences.length,
    malformedPatternCount: build.validation.malformedPatterns.length,
    unknownStatusCount: build.validation.unknownStatuses.length,
    warningCount: build.validation.warningCount,
  };
}

export function createEnvelope<T>(context: CliContext, data: T): QuerySuccess<T> {
  const success = createSuccess(data, context.graph.counts.total);
  return {
    ...success,
    metadata: {
      ...success.metadata,
      validation: createValidationMetadata(context.build),
      ...(context.metadata.cache !== undefined ? { cache: context.metadata.cache } : {}),
      ...(context.metadata.pipelineMs !== undefined
        ? { pipelineMs: context.metadata.pipelineMs }
        : {}),
    },
  };
}

export function writeJson(value: unknown): void {
  if (isBundle(value)) {
    process.stdout.write(renderPrettyJson(value));
    process.stdout.write('\n');
    return;
  }

  if (isPlainObject(value) && 'data' in value) {
    const data = value['data'];
    if (isBundle(data)) {
      process.stdout.write(
        renderEnvelopeWithBundleData(
          value as Record<string, unknown> & { data: ProjectionBundle<Fragment> }
        )
      );
      process.stdout.write('\n');
      return;
    }

    if (looksLikeBundleCandidate(data)) {
      throw new Error(
        'Received malformed projection bundle in response data for JSON output. Expected { root: Fragment, children: Record<string, Fragment>, routing?: BundleRouting }.'
      );
    }
  }

  if (looksLikeBundleCandidate(value)) {
    throw new Error(
      'Received malformed projection bundle for JSON output. Expected { root: Fragment, children: Record<string, Fragment>, routing?: BundleRouting }.'
    );
  }

  process.stdout.write(stringifyJsonValue(value));
  process.stdout.write('\n');
}

export function writeProjectionOutput(
  args: ParsedArgs,
  input: Fragment | ProjectionBundle<Fragment>
): void {
  if (args.format === 'json') {
    process.stdout.write(renderPrettyJson(input));
    process.stdout.write('\n');
    return;
  }

  process.stdout.write(renderCompactText(input));
}
