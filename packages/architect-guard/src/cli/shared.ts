import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

function readGuardPackageJson(): { version?: string; name?: string } {
  try {
    const filePath = fileURLToPath(import.meta.url);
    const dirPath = dirname(filePath);
    const packagePath = join(dirPath, '..', '..', '..', 'package.json');
    return JSON.parse(readFileSync(packagePath, 'utf-8')) as { version?: string; name?: string };
  } catch {
    return {};
  }
}

export function printVersionAndExit(cliName: string): never {
  const packageJson = readGuardPackageJson();
  process.stdout.write(
    `${cliName} (${packageJson.name ?? '@libar-dev/architect-guard'}) v${packageJson.version ?? 'unknown'}\n`
  );
  process.exit(0);
}

export function handleCliError(error: unknown, exitCode = 1): never {
  if (error instanceof Error) {
    console.error('Error:', error.message);
    if (process.env['DEBUG']) {
      console.error('Stack trace:', error.stack);
    }
  } else {
    console.error('Error:', String(error));
  }

  process.exit(exitCode);
}

export function isDirectCliEntrypoint(metaUrl: string): boolean {
  const argv1 = process.argv[1];
  return argv1 !== undefined && metaUrl === pathToFileURL(argv1).href;
}
