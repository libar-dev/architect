import { execFile, type ExecFileException } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const cliPackageRoot = path.resolve(here, '..', '..');
const monorepoRoot = path.resolve(cliPackageRoot, '..', '..');
const dogfoodRoot = monorepoRoot;

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

const BIN_BY_COMMAND: Record<string, string> = {
  architect: 'bin/architect.js',
  'architect-generate': 'bin/architect-generate.js',
  'architect-validate': 'bin/architect-validate.js',
  'architect-guard': 'bin/architect-guard.js',
  'architect-lint-patterns': 'bin/architect-lint-patterns.js',
  'architect-lint-steps': 'bin/architect-lint-steps.js',
};

/**
 * Spawns one of the architect-cli bins as a real subprocess and captures
 * stdout / stderr / exit code. Run with cwd = repo root so the CLI sees the
 * live `architect.config.ts` (the repo's dogfood corpus).
 */
export async function runCli(invocation: string): Promise<CliResult> {
  const tokens = invocation.trim().split(/\s+/);
  const binName = tokens.shift();
  if (binName === undefined) {
    throw new Error(`Empty CLI invocation: "${invocation}"`);
  }
  const relBin = BIN_BY_COMMAND[binName];
  if (relBin === undefined) {
    throw new Error(`Unknown architect bin in invocation: "${binName}"`);
  }
  const binPath = path.join(cliPackageRoot, relBin);

  // The CLI's resolveInvocationDir() prefers process.env.PWD over process.cwd().
  // execFile inherits parent's PWD, so we strip PWD/INIT_CWD to let the child
  // fall through to process.cwd() — which is the directory we set via `cwd:`.
  const childEnv = { ...process.env };
  delete childEnv['PWD'];
  delete childEnv['INIT_CWD'];

  return await new Promise<CliResult>((resolve) => {
    execFile(
      process.execPath,
      [binPath, ...tokens],
      {
        cwd: dogfoodRoot,
        env: childEnv,
        maxBuffer: 32 * 1024 * 1024,
        encoding: 'utf8',
      },
      (error: ExecFileException | null, stdout: string, stderr: string) => {
        let exitCode = 0;
        if (error !== null) {
          exitCode = typeof error.code === 'number' ? error.code : 1;
        }
        resolve({ exitCode, stdout, stderr });
      }
    );
  });
}

export function getJsonValueAtPath(value: unknown, dottedPath: string): unknown {
  const segments = dottedPath.split('.');
  let cursor: unknown = value;
  for (const segment of segments) {
    if (cursor === null || typeof cursor !== 'object') {
      return undefined;
    }
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return cursor;
}
