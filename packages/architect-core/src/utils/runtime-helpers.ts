import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export interface PackageMetadata {
  readonly name: string;
  readonly version: string;
}

export function readPackageMetadata(packageJsonUrl: URL): PackageMetadata {
  return JSON.parse(fs.readFileSync(packageJsonUrl, 'utf8')) as PackageMetadata;
}

export function resolveInvocationDir(): string {
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

export async function runBuiltPackageEntrypoint(
  packageMetaUrl: string,
  relativePath: string,
  buildCommand: string,
): Promise<void> {
  const packageRoot = path.dirname(fileURLToPath(packageMetaUrl));
  const distPath = path.join(packageRoot, 'dist', relativePath);

  if (!fs.existsSync(distPath)) {
    throw new Error(`Missing runtime artifact: ${relativePath}. Run "${buildCommand}" first.`);
  }

  await import(pathToFileURL(distPath).href);
}
