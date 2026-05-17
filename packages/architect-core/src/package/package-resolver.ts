/**
 * @architect
 * @architect-pattern PackageResolver
 * @architect-status active
 * @architect-role:utility
 * @architect-bounded-context:domain
 *
 * ## Package resolver
 *
 * **Value:** Maps a `pattern.source.file` to its workspace `Package`
 * (id + displayName) using a config-supplied list of `{ id, displayName,
 * match }` entries. The resolver short-circuits on the first matching
 * entry in declared order and caches the resolution per source file so
 * repeat lookups are O(1) after the first hit.
 *
 * **Hard error on miss (D-5 = A).** Files that match no configured
 * entry raise `ProjectionError('UNMAPPED_PACKAGE', …)` naming the
 * unmatched file and listing the configured matchers — no silent
 * `_other` bucket. Mirrors the resolver-failure shape D-11 prescribes
 * for cross-bundle link resolution: actionable feedback over silent
 * fallback.
 *
 * ### When to Use
 *
 * - As a typed contract / data shape consumed by projection or render layers.
 */
import type { PackageConfig, PackageMatcher } from './package-config.js';
import type { Package } from './package.js';

import { ProjectionError } from './projection-error.js';

export type PackageResolver = (sourceFile: string) => Package;

export function createPackageResolver(entries: readonly PackageConfig[]): PackageResolver {
  const cache = new Map<string, Package>();
  const matcherDescriptions = entries.map(describeMatcher);

  return (sourceFile: string): Package => {
    const cached = cache.get(sourceFile);
    if (cached !== undefined) {
      return cached;
    }

    for (const entry of entries) {
      if (matches(entry.match, sourceFile)) {
        const resolved: Package = { id: entry.id, displayName: entry.displayName };
        cache.set(sourceFile, resolved);
        return resolved;
      }
    }

    throw new ProjectionError(
      'UNMAPPED_PACKAGE',
      `No package mapping for source file "${sourceFile}". Configured matchers: ${
        matcherDescriptions.length === 0 ? '(none)' : matcherDescriptions.join(', ')
      }. Update the project config's "packages" field.`,
      { sourceFile, matchers: matcherDescriptions },
    );
  };
}

function matches(matcher: PackageMatcher, sourceFile: string): boolean {
  if (matcher instanceof RegExp) {
    return matcher.test(sourceFile);
  }
  return sourceFile.startsWith(matcher);
}

function describeMatcher(entry: PackageConfig): string {
  const matcher = entry.match;
  const repr = matcher instanceof RegExp ? matcher.toString() : `prefix:${JSON.stringify(matcher)}`;
  return `${entry.id} → ${repr}`;
}
