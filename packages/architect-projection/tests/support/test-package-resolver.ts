import {
  ProjectionError,
  createPackageResolver,
  type Package,
  type PackageConfig,
  type PackageResolver,
} from '@libar-dev/architect-core';

/**
 * Default package resolver for fixtures that do not configure their own.
 *
 * Recognised forms (order matters — earlier entries shadow later ones, so the
 * architect-pkg base-dir form `../<pkg>/...` must precede the workspace-relative
 * `packages/<pkg>/...` for cross-package fixtures to resolve to their owning
 * package rather than to the host workspace):
 *   `../<pkg>/...`            cross-package (architect-pkg base-dir)
 *   `tests/features/...`      `architect-dev`
 *   `packages/<pkg>/...`      workspace-relative
 *   `apps/<app>/...`          Studio app
 *   `action/...`              Studio action
 *   `architect/...`           `architect-pkg-content` bucket
 *
 * Tests that exercise the package axis directly should construct their
 * own resolver via `createPackageResolver` with explicit entries.
 */
const FALLBACK_ENTRIES: readonly PackageConfig[] = [
  // Cross-package: `../<pkg>/...`
  { id: 'cross', displayName: 'cross-package', match: /^\.\.\// },
  // Architect-dev host (`tests/features/...`)
  { id: 'architect-dev', displayName: 'Architect Host (Dev)', match: 'tests/features/' },
];

function captureGroup(sourceFile: string, regex: RegExp): string | null {
  const match = regex.exec(sourceFile);
  return match?.[1] ?? null;
}

export function createTestPackageResolver(extra: readonly PackageConfig[] = []): PackageResolver {
  const explicit = createPackageResolver([...extra, ...FALLBACK_ENTRIES]);
  const cache = new Map<string, Package>();

  return (sourceFile: string): Package => {
    const cached = cache.get(sourceFile);
    if (cached !== undefined) {
      return cached;
    }

    const cross = captureGroup(sourceFile, /^\.\.\/([^/]+)\//u);
    if (cross !== null) {
      const resolved: Package = { id: cross, displayName: cross };
      cache.set(sourceFile, resolved);
      return resolved;
    }

    const workspacePackage = captureGroup(sourceFile, /^packages\/([^/]+)\//u);
    if (workspacePackage !== null) {
      const resolved: Package = { id: workspacePackage, displayName: workspacePackage };
      cache.set(sourceFile, resolved);
      return resolved;
    }

    const app = captureGroup(sourceFile, /^apps\/([^/]+)\//u);
    if (app !== null) {
      const resolved: Package = { id: app, displayName: app };
      cache.set(sourceFile, resolved);
      return resolved;
    }

    if (sourceFile.startsWith('action/')) {
      const resolved: Package = { id: 'action', displayName: 'action' };
      cache.set(sourceFile, resolved);
      return resolved;
    }

    if (sourceFile.startsWith('architect/')) {
      const resolved: Package = {
        id: 'architect-pkg-content',
        displayName: 'architect-pkg-content',
      };
      cache.set(sourceFile, resolved);
      return resolved;
    }

    try {
      return explicit(sourceFile);
    } catch (error) {
      if (error instanceof ProjectionError) {
        const resolved: Package = { id: '_test-other', displayName: '_test-other' };
        cache.set(sourceFile, resolved);
        return resolved;
      }
      throw error;
    }
  };
}
