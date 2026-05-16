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
  const pwd = process.env['PWD'];
  const initCwd = process.env['INIT_CWD'];
  if (pwd !== undefined && pwd.length > 0) {
    return pwd;
  }
  if (initCwd !== undefined && initCwd.length > 0) {
    return initCwd;
  }
  return process.cwd();
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
