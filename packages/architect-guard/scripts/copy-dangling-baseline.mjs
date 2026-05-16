import { copyFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourcePath = fileURLToPath(new URL('../src/lint/dangling-baseline.json', import.meta.url));
const destinationPath = fileURLToPath(
  new URL('../dist/lint/dangling-baseline.json', import.meta.url)
);

await mkdir(dirname(destinationPath), { recursive: true });
await copyFile(sourcePath, destinationPath);
