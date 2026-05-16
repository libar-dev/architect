import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, mkdtemp, readdir, rm, symlink, unlink } from 'node:fs/promises';
import { accessSync, constants } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL, fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const packageRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const tempRoot = await mkdtemp(join(tmpdir(), 'architect-guard-pack-'));

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', stdio: 'pipe' });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed with exit ${String(result.status)}
${result.stdout}${result.stderr}`
    );
  }
  return result.stdout.trim();
}

async function assertReadable(path) {
  accessSync(path, constants.R_OK);
}

try {
  const packOutput = run('pnpm', ['pack', '--pack-destination', tempRoot], packageRoot);
  const tarballs = (await readdir(tempRoot)).filter((entry) => entry.endsWith('.tgz'));
  if (tarballs.length !== 1) {
    throw new Error(`Expected one packed tarball, found ${String(tarballs.length)} in ${tempRoot}`);
  }

  const tarballPath = join(tempRoot, tarballs[0]);
  const extractRoot = join(tempRoot, 'extract');
  await mkdir(extractRoot);
  run('tar', ['-xzf', tarballPath, '-C', extractRoot], packageRoot);

  const extractedPackageRoot = join(extractRoot, 'package');
  const baselinePath = join(extractedPackageRoot, 'dist/lint/dangling-baseline.json');
  await assertReadable(baselinePath);

  const nodeModulesPath = join(extractedPackageRoot, 'node_modules');
  await mkdir(nodeModulesPath);
  const zodPackagePath = require.resolve('zod/package.json');
  await symlink(dirname(zodPackagePath), join(nodeModulesPath, 'zod'), 'dir');

  const moduleUrl = pathToFileURL(join(extractedPackageRoot, 'dist/lint/dangling-baseline.js'));
  const baselineModule = await import(moduleUrl.href);
  const entries = await baselineModule.readDanglingBaseline();
  if (!Array.isArray(entries)) {
    throw new Error('Packed dangling baseline did not load as an array.');
  }

  await unlink(baselinePath);
  try {
    await baselineModule.readDanglingBaseline();
    throw new Error('Expected missing packed baseline resource to fail.');
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('Dangling baseline file not found')) {
      throw error;
    }
  }

  console.log(`Packed ${tarballs[0]} from pnpm pack output.`);
  console.log(
    `Loaded ${String(entries.length)} dangling baseline entr${entries.length === 1 ? 'y' : 'ies'} from extracted dist resource.`
  );
  console.log(
    'Missing-resource check failed as expected after removing dist/lint/dangling-baseline.json.'
  );
  console.log(packOutput);
} finally {
  if (process.env.ARCHITECT_KEEP_PACK_SMOKE_TEMP !== '1') {
    await rm(tempRoot, { recursive: true, force: true });
  } else {
    console.log(`Kept smoke temp directory: ${tempRoot}`);
  }
}
