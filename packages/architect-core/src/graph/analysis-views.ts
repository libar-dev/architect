import type { AuthoredCore, MechanicalCore } from './schema.js';
import { fileToPatternMap } from './view-support.js';
import type { FanInOptions } from './views.js';

function defined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export function blastRadius(
  mech: MechanicalCore,
  authored: AuthoredCore,
  changedFiles: readonly string[],
) {
  const fileToPattern = fileToPatternMap(authored);
  const changedSrc = changedFiles.filter(
    (file) => /^packages\/[^/]+\/src\/.*\.ts$/.test(file) && !/\.(steps|test)\.ts$/.test(file),
  );
  const importedBy = new Map<string, Set<string>>();
  for (const edge of mech.edges) {
    const importers = importedBy.get(edge.toFile) ?? new Set<string>();
    importers.add(edge.fromFile);
    importedBy.set(edge.toFile, importers);
  }
  const mechFiles = new Set(changedSrc);
  const fileQueue = [...changedSrc];
  for (let file = fileQueue.shift(); file !== undefined; file = fileQueue.shift()) {
    for (const importer of importedBy.get(file) ?? []) {
      if (!mechFiles.has(importer)) {
        mechFiles.add(importer);
        fileQueue.push(importer);
      }
    }
  }
  const mechPatterns = [...mechFiles].map((file) => fileToPattern.get(file)).filter(defined);
  const seed = new Set(changedSrc.map((file) => fileToPattern.get(file)).filter(defined));
  const authoredImpact = new Set(seed);
  const patternQueue = [...seed];
  for (let name = patternQueue.shift(); name !== undefined; name = patternQueue.shift()) {
    for (const downstream of authored.relationshipIndex[name]?.usedBy ?? []) {
      if (!authoredImpact.has(downstream)) {
        authoredImpact.add(downstream);
        patternQueue.push(downstream);
      }
    }
  }
  const atRiskFeatureFiles = new Set<string>();
  for (const name of mechPatterns) {
    for (const implementation of authored.relationshipIndex[name]?.implementedBy ?? []) {
      if (implementation.file?.endsWith('.feature') === true) {
        atRiskFeatureFiles.add(implementation.file);
      }
    }
  }
  return {
    changedSrc,
    mappedSeed: [...seed],
    authoredDownstream: [...authoredImpact].filter((name) => !seed.has(name)),
    mechFiles: mechFiles.size - changedSrc.length,
    mechPatterns,
    recovered: mechPatterns.filter((name) => !authoredImpact.has(name) && !seed.has(name)),
    atRiskFeatureFiles: [...atRiskFeatureFiles].sort(),
  };
}

export function fanInCandidates(
  mech: MechanicalCore,
  authored: AuthoredCore,
  options: FanInOptions = {},
) {
  const fileToPattern = fileToPatternMap(authored);
  const fanIn = new Map<string, Set<string>>();
  for (const edge of mech.edges) {
    if (edge.fromFile === edge.toFile) continue;
    const importers = fanIn.get(edge.toFile) ?? new Set<string>();
    importers.add(edge.fromFile);
    fanIn.set(edge.toFile, importers);
  }
  return [...fanIn.entries()]
    .map(([file, importers]) => ({
      file,
      fanIn: importers.size,
      pkg: /^packages\/([^/]+)\//.exec(file)?.[1] ?? '(root)',
      annotated: fileToPattern.has(file),
    }))
    .filter(
      (candidate) =>
        candidate.fanIn >= (options.min ?? 4) &&
        !candidate.annotated &&
        !candidate.file.endsWith('/index.ts'),
    )
    .sort((left, right) => right.fanIn - left.fanIn || left.file.localeCompare(right.file))
    .slice(0, options.limit ?? 30);
}

export function driftFlags(authored: AuthoredCore, existsOnDisk: (file: string) => boolean) {
  const patternNames = new Set(Object.keys(authored.relationshipIndex));
  const dangling: { from: string; to: string }[] = [];
  for (const [name, relationship] of Object.entries(authored.relationshipIndex)) {
    for (const target of relationship.uses) {
      if (!patternNames.has(target)) dangling.push({ from: name, to: target });
    }
  }
  const orphanedSource: { pattern: string; file: string }[] = [];
  for (const pattern of authored.patterns) {
    if (pattern.source?.file.endsWith('.ts') === true && !existsOnDisk(pattern.source.file)) {
      orphanedSource.push({ pattern: pattern.name, file: pattern.source.file });
    }
  }
  return { dangling, orphanedSource };
}

export function census(mech: MechanicalCore, authored: AuthoredCore) {
  const fileToPattern = fileToPatternMap(authored);
  const byPackage = new Map<string, Set<string>>();
  for (const symbol of mech.symbols) {
    const files = byPackage.get(symbol.pkg) ?? new Set<string>();
    files.add(symbol.file);
    byPackage.set(symbol.pkg, files);
  }
  const nodeCoverage = [...byPackage.entries()]
    .map(([pkg, files]) => {
      const nonBarrel = [...files].filter((file) => !file.endsWith('/index.ts'));
      const mapped = nonBarrel.filter((file) => fileToPattern.has(file)).length;
      return {
        pkg,
        mapped,
        total: nonBarrel.length,
        pct: Math.round((mapped / Math.max(nonBarrel.length, 1)) * 100),
      };
    })
    .sort((left, right) => left.pkg.localeCompare(right.pkg));
  const kinds = ['uses', 'usedBy', 'implementedBy'] as const;
  const edgeDensity: Record<string, number> = {};
  let edgeDark = 0;
  for (const relationship of Object.values(authored.relationshipIndex)) {
    let edgeCount = 0;
    for (const kind of kinds) {
      const count = relationship[kind].length;
      if (count > 0) edgeDensity[kind] = (edgeDensity[kind] ?? 0) + 1;
      edgeCount += count;
    }
    if (edgeCount === 0) edgeDark++;
  }
  return { nodeCoverage, edgeDensity, edgeDark, patternCount: authored.patterns.length };
}
