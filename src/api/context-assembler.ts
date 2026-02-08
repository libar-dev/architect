/**
 * @libar-docs
 * @libar-docs-pattern ContextAssemblerImpl
 * @libar-docs-status active
 * @libar-docs-implements DataAPIContextAssembly
 * @libar-docs-uses ProcessStateAPI, MasterDataset, PatternSummarizerImpl, FuzzyMatcherImpl, StubResolverImpl
 * @libar-docs-used-by ProcessAPICLIImpl, ContextFormatterImpl
 * @libar-docs-arch-role service
 * @libar-docs-arch-context api
 * @libar-docs-arch-layer application
 *
 * ## ContextAssembler — Session-Oriented Context Bundle Builder
 *
 * Pure function composition over MasterDataset. Reads from 5 pre-computed
 * views (patterns, relationshipIndex, archIndex, deliverables, FSM) and
 * assembles them into a ContextBundle tailored to the session type.
 *
 * The assembler does NOT format output. It produces structured data that
 * the ContextFormatter renders as plain text (see ADR-008).
 */

import type { ProcessStateAPI } from './process-state.js';
import type { MasterDataset } from '../validation-schemas/master-dataset.js';
import type { ExtractedPattern } from '../validation-schemas/extracted-pattern.js';
import type { ProcessStatusValue } from '../taxonomy/index.js';
import type { NeighborEntry } from './types.js';
import { QueryApiError } from './types.js';
import { findBestMatch } from './fuzzy-match.js';
import { extractDescription } from '../utils/string-utils.js';
import {
  getPatternName,
  findPatternByName as findPatternByNameFromList,
  getRelationships,
  allPatternNames,
} from './pattern-helpers.js';

// ---------------------------------------------------------------------------
// Session Types
// ---------------------------------------------------------------------------

export type SessionType = 'planning' | 'design' | 'implement';

const VALID_SESSION_TYPES: readonly string[] = ['planning', 'design', 'implement'];

const VALID_STATUSES: ReadonlySet<string> = new Set(['roadmap', 'active', 'completed', 'deferred']);

export function isValidSessionType(value: string): value is SessionType {
  return VALID_SESSION_TYPES.includes(value);
}

// ---------------------------------------------------------------------------
// Context Options
// ---------------------------------------------------------------------------

export interface ContextOptions {
  readonly patterns: readonly string[];
  readonly sessionType: SessionType;
  readonly baseDir: string;
}

export interface DepTreeOptions {
  readonly pattern: string;
  readonly maxDepth: number;
  readonly includeImplementationDeps: boolean;
}

// ---------------------------------------------------------------------------
// Context Bundle Types
// ---------------------------------------------------------------------------

export interface PatternContextMeta {
  readonly name: string;
  readonly status: string | undefined;
  readonly phase: number | undefined;
  readonly category: string;
  readonly file: string;
  readonly summary: string;
}

export interface StubRef {
  readonly stubFile: string;
  readonly targetPath: string;
  readonly name: string;
}

export interface DepEntry {
  readonly name: string;
  readonly status: string | undefined;
  readonly file: string;
  readonly kind: 'planning' | 'implementation';
}

export interface DeliverableEntry {
  readonly name: string;
  readonly status: string;
  readonly location: string;
}

export interface FsmContext {
  readonly currentStatus: string;
  readonly validTransitions: readonly string[];
  readonly protectionLevel: 'none' | 'scope' | 'hard';
}

export interface ContextBundle {
  readonly patterns: readonly string[];
  readonly sessionType: SessionType;
  readonly metadata: readonly PatternContextMeta[];
  readonly specFiles: readonly string[];
  readonly stubs: readonly StubRef[];
  readonly dependencies: readonly DepEntry[];
  readonly sharedDependencies: readonly string[];
  readonly consumers: readonly DepEntry[];
  readonly architectureNeighbors: readonly NeighborEntry[];
  readonly deliverables: readonly DeliverableEntry[];
  readonly fsm: FsmContext | undefined;
  readonly testFiles: readonly string[];
}

// ---------------------------------------------------------------------------
// Dependency Tree Types
// ---------------------------------------------------------------------------

export interface DepTreeNode {
  readonly name: string;
  readonly status: string | undefined;
  readonly phase: number | undefined;
  readonly isFocal: boolean;
  readonly truncated: boolean;
  readonly children: readonly DepTreeNode[];
}

// ---------------------------------------------------------------------------
// File Reading List Types
// ---------------------------------------------------------------------------

export interface FileReadingList {
  readonly pattern: string;
  readonly primary: readonly string[];
  readonly completedDeps: readonly string[];
  readonly roadmapDeps: readonly string[];
  readonly architectureNeighbors: readonly string[];
}

// ---------------------------------------------------------------------------
// Overview Types
// ---------------------------------------------------------------------------

export interface ProgressSummary {
  readonly total: number;
  readonly completed: number;
  readonly active: number;
  readonly planned: number;
  readonly percentage: number;
}

export interface ActivePhaseSummary {
  readonly phase: number;
  readonly name: string | undefined;
  readonly patternCount: number;
  readonly activeCount: number;
}

export interface BlockingEntry {
  readonly pattern: string;
  readonly status: string | undefined;
  readonly blockedBy: readonly string[];
}

export interface OverviewSummary {
  readonly progress: ProgressSummary;
  readonly activePhases: readonly ActivePhaseSummary[];
  readonly blocking: readonly BlockingEntry[];
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Find a pattern by name or throw QueryApiError with a fuzzy suggestion.
 */
function requirePattern(dataset: MasterDataset, name: string): ExtractedPattern {
  const pattern = findPatternByNameFromList(dataset.patterns, name);
  if (pattern !== undefined) return pattern;
  const allNames = allPatternNames(dataset);
  const best = findBestMatch(name, [...allNames]);
  const suggestion = best !== undefined ? `\nDid you mean: ${best.patternName}?` : '';
  throw new QueryApiError('PATTERN_NOT_FOUND', `Pattern not found: "${name}"${suggestion}`);
}

function resolveDepEntry(
  dataset: MasterDataset,
  depName: string,
  kind: 'planning' | 'implementation'
): DepEntry {
  const pattern = findPatternByNameFromList(dataset.patterns, depName);
  return {
    name: depName,
    status: pattern?.status,
    file: pattern?.source.file ?? '',
    kind,
  };
}

function buildMetadata(pattern: ExtractedPattern): PatternContextMeta {
  return {
    name: getPatternName(pattern),
    status: pattern.status,
    phase: pattern.phase,
    category: pattern.category,
    file: pattern.source.file,
    summary: extractDescription(pattern.directive.description),
  };
}

function resolveStubRefs(dataset: MasterDataset, patternName: string): readonly StubRef[] {
  const rels = getRelationships(dataset, patternName);
  if (rels === undefined) return [];

  return rels.implementedBy
    .filter((ref) => ref.file.includes('/stubs/'))
    .map((ref) => ({
      stubFile: ref.file,
      targetPath: findPatternByNameFromList(dataset.patterns, ref.name)?.targetPath ?? '',
      name: ref.name,
    }));
}

function resolveArchNeighbors(
  dataset: MasterDataset,
  pattern: ExtractedPattern,
  focalNames: ReadonlySet<string>
): readonly NeighborEntry[] {
  const ctx = pattern.archContext;
  if (ctx === undefined || dataset.archIndex === undefined) return [];

  const contextPatterns = dataset.archIndex.byContext[ctx];
  if (contextPatterns === undefined) return [];

  return contextPatterns
    .filter((p) => !focalNames.has(getPatternName(p)))
    .map((p) => ({
      name: getPatternName(p),
      status: p.status,
      archRole: p.archRole,
      archContext: p.archContext,
      file: p.source.file,
    }));
}

function resolveDeliverables(
  api: ProcessStateAPI,
  patternName: string
): readonly DeliverableEntry[] {
  const deliverables = api.getPatternDeliverables(patternName);
  return deliverables.map((d) => ({
    name: d.name,
    status: d.status,
    location: d.location,
  }));
}

function resolveFsm(api: ProcessStateAPI, status: string | undefined): FsmContext | undefined {
  if (status === undefined) return undefined;
  if (!VALID_STATUSES.has(status)) return undefined;
  const validStatus = status as ProcessStatusValue;
  const transitions = api.getValidTransitionsFrom(validStatus);
  const protection = api.getProtectionInfo(validStatus);
  return {
    currentStatus: status,
    validTransitions: transitions,
    protectionLevel: protection.level,
  };
}

function resolveTestFiles(pattern: ExtractedPattern): readonly string[] {
  return pattern.behaviorFile !== undefined ? [pattern.behaviorFile] : [];
}

// ---------------------------------------------------------------------------
// assembleContext
// ---------------------------------------------------------------------------

export function assembleContext(
  dataset: MasterDataset,
  api: ProcessStateAPI,
  options: ContextOptions
): ContextBundle {
  const { patterns: patternNames, sessionType } = options;

  if (patternNames.length === 0) {
    return emptyBundle([], sessionType);
  }

  // Resolve all focal patterns
  const focalPatterns: ExtractedPattern[] = [];
  for (const name of patternNames) {
    focalPatterns.push(requirePattern(dataset, name));
  }

  const focalNameSet = new Set(focalPatterns.map(getPatternName));

  // Collect per-pattern data
  const allMetadata: PatternContextMeta[] = [];
  const allSpecFiles: string[] = [];
  const allStubs: StubRef[] = [];
  const perPatternDeps = new Map<string, readonly DepEntry[]>();
  const allConsumers: DepEntry[] = [];
  const allNeighbors: NeighborEntry[] = [];
  const allDeliverables: DeliverableEntry[] = [];
  const allTestFiles: string[] = [];
  let fsm: FsmContext | undefined;

  for (const pattern of focalPatterns) {
    const name = getPatternName(pattern);
    const rels = getRelationships(dataset, name);

    // Metadata (all session types)
    allMetadata.push(buildMetadata(pattern));

    // Spec files (design, implement)
    if (sessionType === 'design' || sessionType === 'implement') {
      if (pattern.source.file.endsWith('.feature')) {
        allSpecFiles.push(pattern.source.file);
      }
    }

    // Stubs (design only)
    if (sessionType === 'design') {
      allStubs.push(...resolveStubRefs(dataset, name));
    }

    // Dependencies (all session types)
    const deps: DepEntry[] = [];
    if (rels !== undefined) {
      for (const dep of rels.dependsOn) {
        deps.push(resolveDepEntry(dataset, dep, 'planning'));
      }
      if (sessionType === 'design') {
        for (const dep of rels.uses) {
          if (!deps.some((d) => d.name === dep)) {
            deps.push(resolveDepEntry(dataset, dep, 'implementation'));
          }
        }
      }
    }
    perPatternDeps.set(name, deps);

    // Consumers (design only)
    if (sessionType === 'design' && rels !== undefined) {
      for (const consumer of rels.usedBy) {
        if (!allConsumers.some((c) => c.name === consumer)) {
          allConsumers.push(resolveDepEntry(dataset, consumer, 'implementation'));
        }
      }
      for (const consumer of rels.enables) {
        if (!allConsumers.some((c) => c.name === consumer)) {
          allConsumers.push(resolveDepEntry(dataset, consumer, 'planning'));
        }
      }
    }

    // Architecture neighbors (design only)
    if (sessionType === 'design') {
      const neighbors = resolveArchNeighbors(dataset, pattern, focalNameSet);
      for (const n of neighbors) {
        if (!allNeighbors.some((existing) => existing.name === n.name)) {
          allNeighbors.push(n);
        }
      }
    }

    // Deliverables (design + implement)
    if (sessionType === 'design' || sessionType === 'implement') {
      allDeliverables.push(...resolveDeliverables(api, name));
    }

    // FSM and test files (implement only)
    if (sessionType === 'implement') {
      fsm = resolveFsm(api, pattern.status);
      allTestFiles.push(...resolveTestFiles(pattern));
    }
  }

  // Compute shared dependencies for multi-pattern context
  const sharedDependencies: string[] = [];
  if (patternNames.length > 1) {
    const depCounts = new Map<string, number>();
    for (const deps of perPatternDeps.values()) {
      for (const dep of deps) {
        depCounts.set(dep.name, (depCounts.get(dep.name) ?? 0) + 1);
      }
    }
    for (const [depName, count] of depCounts) {
      if (count > 1) {
        sharedDependencies.push(depName);
      }
    }
  }

  // Flatten all deps (dedup by name)
  const allDeps: DepEntry[] = [];
  const seenDeps = new Set<string>();
  for (const deps of perPatternDeps.values()) {
    for (const dep of deps) {
      if (!seenDeps.has(dep.name)) {
        seenDeps.add(dep.name);
        allDeps.push(dep);
      }
    }
  }

  return {
    patterns: [...patternNames],
    sessionType,
    metadata: allMetadata,
    specFiles: allSpecFiles,
    stubs: allStubs,
    dependencies: allDeps,
    sharedDependencies,
    consumers: allConsumers,
    architectureNeighbors: allNeighbors,
    deliverables: allDeliverables,
    fsm,
    testFiles: allTestFiles,
  };
}

// ---------------------------------------------------------------------------
// buildDepTree
// ---------------------------------------------------------------------------

export function buildDepTree(dataset: MasterDataset, options: DepTreeOptions): DepTreeNode {
  const { pattern: focalName, maxDepth, includeImplementationDeps } = options;

  requirePattern(dataset, focalName);

  // Find the root of the dependency chain by walking up
  const rootName = findDepTreeRoot(dataset, focalName, includeImplementationDeps);
  const visited = new Set<string>();

  return buildTreeNode(
    dataset,
    rootName,
    focalName,
    0,
    maxDepth,
    includeImplementationDeps,
    visited
  );
}

function findDepTreeRoot(
  dataset: MasterDataset,
  focalName: string,
  includeImplementationDeps: boolean
): string {
  // Walk up dependsOn/enables chains to find the root ancestor
  const visited = new Set<string>();
  let current = focalName;

  for (;;) {
    visited.add(current);
    const rels = getRelationships(dataset, current);
    if (rels === undefined) break;

    const parents = rels.dependsOn;
    const implParents = includeImplementationDeps ? rels.uses : [];
    const allParents = [...parents, ...implParents];

    const unvisitedParent = allParents.find(
      (p) => !visited.has(p) && findPatternByNameFromList(dataset.patterns, p) !== undefined
    );
    if (unvisitedParent === undefined) break;

    current = unvisitedParent;
  }

  return current;
}

function buildTreeNode(
  dataset: MasterDataset,
  name: string,
  focalName: string,
  depth: number,
  maxDepth: number,
  includeImplementationDeps: boolean,
  visited: Set<string>
): DepTreeNode {
  const pattern = findPatternByNameFromList(dataset.patterns, name);
  const isFocal = name.toLowerCase() === focalName.toLowerCase();

  if (visited.has(name)) {
    return {
      name,
      status: pattern?.status,
      phase: pattern?.phase,
      isFocal,
      truncated: false,
      children: [], // cycle detected — don't recurse
    };
  }

  visited.add(name);

  if (depth >= maxDepth) {
    // Check if there would be children
    const rels = getRelationships(dataset, name);
    const hasChildren =
      rels !== undefined &&
      (rels.enables.length > 0 || (includeImplementationDeps && rels.usedBy.length > 0));
    return {
      name,
      status: pattern?.status,
      phase: pattern?.phase,
      isFocal,
      truncated: hasChildren,
      children: [],
    };
  }

  // Get children: patterns that depend on this one (enables) or use this (usedBy)
  const rels = getRelationships(dataset, name);
  const childNames: string[] = [];
  if (rels !== undefined) {
    childNames.push(...rels.enables);
    if (includeImplementationDeps) {
      for (const used of rels.usedBy) {
        if (!childNames.includes(used)) {
          childNames.push(used);
        }
      }
    }
  }

  // Filter to children that actually exist in the dataset
  const children = childNames
    .filter((childName) => findPatternByNameFromList(dataset.patterns, childName) !== undefined)
    .map((childName) =>
      buildTreeNode(
        dataset,
        childName,
        focalName,
        depth + 1,
        maxDepth,
        includeImplementationDeps,
        visited
      )
    );

  return {
    name,
    status: pattern?.status,
    phase: pattern?.phase,
    isFocal,
    truncated: false,
    children,
  };
}

// ---------------------------------------------------------------------------
// buildFileReadingList
// ---------------------------------------------------------------------------

export function buildFileReadingList(
  dataset: MasterDataset,
  patternName: string,
  includeRelated: boolean
): FileReadingList {
  const pattern = requirePattern(dataset, patternName);
  const name = getPatternName(pattern);

  // Primary: spec file + stub files
  const primary: string[] = [pattern.source.file];
  const stubRefs = resolveStubRefs(dataset, name);
  for (const stub of stubRefs) {
    primary.push(stub.stubFile);
  }

  if (!includeRelated) {
    return {
      pattern: name,
      primary,
      completedDeps: [],
      roadmapDeps: [],
      architectureNeighbors: [],
    };
  }

  // Related: completed deps, roadmap deps, arch neighbors
  const completedDeps: string[] = [];
  const roadmapDeps: string[] = [];
  const architectureNeighbors: string[] = [];

  const rels = getRelationships(dataset, name);
  if (rels !== undefined) {
    for (const depName of rels.dependsOn) {
      const depPattern = findPatternByNameFromList(dataset.patterns, depName);
      if (depPattern === undefined) continue;
      if (depPattern.status === 'completed') {
        completedDeps.push(depPattern.source.file);
        // Include implementation files for completed dependencies
        const depRels = getRelationships(dataset, depName);
        if (depRels !== undefined) {
          for (const implRef of depRels.implementedBy) {
            if (!completedDeps.includes(implRef.file)) {
              completedDeps.push(implRef.file);
            }
          }
        }
      } else {
        roadmapDeps.push(depPattern.source.file);
      }
    }
  }

  // Architecture neighbors
  const ctx = pattern.archContext;
  if (ctx !== undefined && dataset.archIndex !== undefined) {
    const contextPatterns = dataset.archIndex.byContext[ctx];
    if (contextPatterns !== undefined) {
      for (const p of contextPatterns) {
        if (getPatternName(p) !== name) {
          architectureNeighbors.push(p.source.file);
        }
      }
    }
  }

  return {
    pattern: name,
    primary,
    completedDeps,
    roadmapDeps,
    architectureNeighbors,
  };
}

// ---------------------------------------------------------------------------
// buildOverview
// ---------------------------------------------------------------------------

export function buildOverview(dataset: MasterDataset): OverviewSummary {
  const { counts } = dataset;
  const total = counts.total;
  const percentage = total > 0 ? Math.round((counts.completed / total) * 100) : 0;

  const progress: ProgressSummary = {
    total,
    completed: counts.completed,
    active: counts.active,
    planned: counts.planned,
    percentage,
  };

  // Active phases: phases with active patterns
  const activePhases: ActivePhaseSummary[] = [];
  for (const group of dataset.byPhase) {
    if (group.counts.active > 0) {
      activePhases.push({
        phase: group.phaseNumber,
        name: group.phaseName,
        patternCount: group.patterns.length,
        activeCount: group.counts.active,
      });
    }
  }

  // Blocking: patterns with incomplete dependencies
  const blocking: BlockingEntry[] = [];
  for (const pattern of dataset.patterns) {
    if (pattern.status === 'completed') continue;
    const name = getPatternName(pattern);
    const rels = getRelationships(dataset, name);
    if (rels === undefined) continue;

    const incompleteDeps = rels.dependsOn.filter((depName) => {
      const depPattern = findPatternByNameFromList(dataset.patterns, depName);
      return depPattern !== undefined && depPattern.status !== 'completed';
    });

    if (incompleteDeps.length > 0) {
      blocking.push({
        pattern: name,
        status: pattern.status,
        blockedBy: incompleteDeps,
      });
    }
  }

  return { progress, activePhases, blocking };
}

// ---------------------------------------------------------------------------
// Error Type
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyBundle(patterns: readonly string[], sessionType: SessionType): ContextBundle {
  return {
    patterns,
    sessionType,
    metadata: [],
    specFiles: [],
    stubs: [],
    dependencies: [],
    sharedDependencies: [],
    consumers: [],
    architectureNeighbors: [],
    deliverables: [],
    fsm: undefined,
    testFiles: [],
  };
}
