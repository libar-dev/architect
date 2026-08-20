import { runBuiltPackageEntrypoint } from '@libar-dev/architect-core';

export async function runArchitectCliEntrypoint(relativePath) {
  await runBuiltPackageEntrypoint(
    import.meta.url,
    relativePath,
    'pnpm --filter @libar-dev/architect-cli build'
  );
}
