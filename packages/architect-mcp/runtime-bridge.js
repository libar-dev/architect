import { runBuiltPackageEntrypoint } from '@libar-dev/architect-core';

export async function runArchitectMcpEntrypoint(relativePath) {
  await runBuiltPackageEntrypoint(
    import.meta.url,
    relativePath,
    'pnpm --filter @libar-dev/architect-mcp build'
  );
}
