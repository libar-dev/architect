import fs from 'node:fs';
import path from 'node:path';

import {
  readPackageMetadata,
  resolveInvocationDir,
  type PackageMetadata,
} from '@libar-dev/architect-core';

export type { PackageMetadata } from '@libar-dev/architect-core';

export function readMcpPackageMetadata(): PackageMetadata {
  return readPackageMetadata(new URL('../package.json', import.meta.url));
}

export function resolveMcpBaseDirArg(value: string): string {
  if (path.isAbsolute(value)) {
    return path.resolve(value);
  }

  const candidates = [
    path.resolve(process.cwd(), value),
    path.resolve(resolveInvocationDir(), value),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0] ?? path.resolve(value);
}

export function normalizeSessionBaseDir(baseDir?: string): string {
  return path.resolve(baseDir ?? process.cwd());
}
