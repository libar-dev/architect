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

export interface PackageMetadata {
  readonly name: string;
  readonly version: string;
}

export function readCliPackageMetadata(): PackageMetadata {
  return JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
    name: string;
    version: string;
  };
}

export function resolveInvocationDir(): string {
  // process.cwd() is canonical so execFile({ cwd }) embedding is respected.
  // INIT_CWD and PWD remain as fallbacks if cwd resolution throws (rare).
  try {
    const cwd = process.cwd();
    if (cwd.length > 0) {
      return cwd;
    }
  } catch {
    /* fall through to env fallbacks */
  }
  const initCwd = process.env['INIT_CWD'];
  if (initCwd !== undefined && initCwd.length > 0) {
    return initCwd;
  }
  const pwd = process.env['PWD'];
  if (pwd !== undefined && pwd.length > 0) {
    return pwd;
  }
  throw new Error('resolveInvocationDir: unable to resolve invocation directory');
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
