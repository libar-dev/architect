/**
 * @architect
 * @architect-cli
 * @architect-pattern CLIRuntimePaths
 * @architect-status completed
 * @architect-role:utility
 * @architect-bounded-context:cli
 * @architect-product-area:DataAPI
 *
 * ## CLIRuntimePaths — Invocation and Package Metadata Resolution
 *
 * Centralizes the split CLI runtime's package metadata lookup and base-directory
 * resolution rules so command execution stays stable across pnpm, workspaces, and
 * direct bin invocation.
 *
 * **When to Use:** Use when resolving package identity, caller working directory,
 * or `--base-dir` precedence for the split CLI runtime.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  readPackageMetadata,
  resolveInvocationDir as resolveInvocationDirFromCore,
  type PackageMetadata,
} from '@libar-dev/architect-core';

export type { PackageMetadata } from '@libar-dev/architect-core';
export const resolveInvocationDir = resolveInvocationDirFromCore;

export function readCliPackageMetadata(): PackageMetadata {
  return readPackageMetadata(new URL('../../package.json', import.meta.url));
}

export function resolveWorkspaceRoot(): string {
  return path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
}

export function resolveCliBaseDirArg(value: string): string {
  if (path.isAbsolute(value)) {
    return path.resolve(value);
  }

  const candidates = [
    path.resolve(process.cwd(), value),
    path.resolve(resolveInvocationDir(), value),
    path.resolve(resolveWorkspaceRoot(), value),
  ];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    if (seen.has(candidate)) {
      continue;
    }
    seen.add(candidate);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0] ?? path.resolve(value);
}
