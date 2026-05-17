import fs from 'node:fs';
import path from 'node:path';

export interface PackageMetadata {
  readonly name: string;
  readonly version: string;
}

export function readMcpPackageMetadata(): PackageMetadata {
  return JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
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
