import {
  inferHandoffSessionType,
  type HandoffSessionType,
  type SessionType,
} from '@libar-dev/architect-core';
import {
  type Fragment,
  type HandoffOptions,
  type ProjectionBundle,
} from '@libar-dev/architect-projection';
import { projectHandoffRecord } from '@libar-dev/architect-projection/projections';
import type { CliContext } from '../../pattern-graph-cli-types.js';

export function normalizeHandoffInput(
  positional: readonly string[],
  flags: Readonly<Record<string, unknown>>,
  fallbackSessionType?: SessionType,
): { pattern: string; sessionType?: HandoffSessionType; modifiedFiles: readonly string[] } {
  const usage =
    'Usage: architect handoff --pattern <pattern> [--session planning|design|implement|review] [--modified-file <path>]...';
  const typedFlags = flags as {
    readonly pattern?: string;
    readonly session?: HandoffSessionType;
    readonly modifiedFiles?: readonly string[];
  };

  let pattern = typedFlags.pattern;
  if (pattern === undefined) {
    const [positionalPattern, ...rest] = positional;
    if (rest.length > 0) {
      throw new Error(usage);
    }
    pattern = positionalPattern;
  }

  if (pattern === undefined) {
    throw new Error(usage);
  }

  const sessionType = typedFlags.session ?? fallbackSessionType;

  return {
    pattern,
    ...(sessionType !== undefined ? { sessionType } : {}),
    modifiedFiles: typedFlags.modifiedFiles ?? [],
  };
}

export function requireProjectedHandoff(
  context: CliContext,
  options: {
    pattern: string;
    sessionType?: HandoffSessionType;
    modifiedFiles: readonly string[];
  },
): ProjectionBundle<Fragment> {
  const pattern = context.api.getPattern(options.pattern);
  if (pattern === undefined) {
    throw new Error(`Pattern not found: ${options.pattern}`);
  }

  const sessionType = options.sessionType ?? inferHandoffSessionType(pattern.status);
  const handoffOptions: HandoffOptions =
    options.modifiedFiles.length > 0
      ? {
          pattern: options.pattern,
          sessionType,
          filesModified: options.modifiedFiles,
        }
      : {
          pattern: options.pattern,
          sessionType,
        };

  return projectHandoffRecord(context.projection, handoffOptions);
}
