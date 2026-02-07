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
import { findBestMatch } from './fuzzy-match.js';
import { extractFirstSentence } from '../utils/string-utils.js';
import { getPatternName, findPatternByName as findPatternByNameFromList, getRelationships, } from './pattern-helpers.js';
const VALID_SESSION_TYPES = ['planning', 'design', 'implement'];
export function isValidSessionType(value) {
    return VALID_SESSION_TYPES.includes(value);
}
// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------
function getAllPatternNames(dataset) {
    return dataset.patterns.map(getPatternName);
}
function findPatternByName(dataset, name) {
    return findPatternByNameFromList(dataset.patterns, name);
}
/**
 * Find a pattern by name or throw ContextAssemblyError with a fuzzy suggestion.
 */
function requirePattern(dataset, name) {
    const pattern = findPatternByName(dataset, name);
    if (pattern !== undefined)
        return pattern;
    const allNames = getAllPatternNames(dataset);
    const best = findBestMatch(name, [...allNames]);
    const suggestion = best !== undefined ? `\nDid you mean: ${best.patternName}?` : '';
    throw new ContextAssemblyError('PATTERN_NOT_FOUND', `Pattern not found: "${name}"${suggestion}`);
}
function resolveDepEntry(dataset, depName, kind) {
    const pattern = findPatternByName(dataset, depName);
    return {
        name: depName,
        status: pattern?.status,
        file: pattern?.source.file ?? '',
        kind,
    };
}
function buildMetadata(pattern) {
    return {
        name: getPatternName(pattern),
        status: pattern.status,
        phase: pattern.phase,
        category: pattern.category,
        file: pattern.source.file,
        summary: extractFirstSentence(pattern.directive.description),
    };
}
function resolveStubRefs(dataset, patternName) {
    const rels = getRelationships(dataset, patternName);
    if (rels === undefined)
        return [];
    return rels.implementedBy
        .filter((ref) => ref.file.includes('/stubs/'))
        .map((ref) => ({
        stubFile: ref.file,
        targetPath: findPatternByName(dataset, ref.name)?.targetPath ?? '',
        name: ref.name,
    }));
}
function resolveArchNeighbors(dataset, pattern, focalNames) {
    const ctx = pattern.archContext;
    if (ctx === undefined || dataset.archIndex === undefined)
        return [];
    const contextPatterns = dataset.archIndex.byContext[ctx];
    if (contextPatterns === undefined)
        return [];
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
function resolveDeliverables(api, patternName) {
    const deliverables = api.getPatternDeliverables(patternName);
    return deliverables.map((d) => ({
        name: d.name,
        status: d.status,
        location: d.location,
    }));
}
function resolveFsm(api, status) {
    if (status === undefined)
        return undefined;
    const VALID_STATUSES = new Set(['roadmap', 'active', 'completed', 'deferred']);
    if (!VALID_STATUSES.has(status))
        return undefined;
    const validStatus = status;
    const transitions = api.getValidTransitionsFrom(validStatus);
    const protection = api.getProtectionInfo(validStatus);
    return {
        currentStatus: status,
        validTransitions: transitions,
        protectionLevel: protection.level,
    };
}
function resolveTestFiles(pattern) {
    return pattern.behaviorFile !== undefined ? [pattern.behaviorFile] : [];
}
// ---------------------------------------------------------------------------
// assembleContext
// ---------------------------------------------------------------------------
export function assembleContext(dataset, api, options) {
    const { patterns: patternNames, sessionType } = options;
    if (patternNames.length === 0) {
        return emptyBundle([], sessionType);
    }
    // Resolve all focal patterns
    const focalPatterns = [];
    for (const name of patternNames) {
        focalPatterns.push(requirePattern(dataset, name));
    }
    const focalNameSet = new Set(focalPatterns.map(getPatternName));
    // Collect per-pattern data
    const allMetadata = [];
    const allSpecFiles = [];
    const allStubs = [];
    const perPatternDeps = new Map();
    const allConsumers = [];
    const allNeighbors = [];
    const allDeliverables = [];
    const allTestFiles = [];
    let fsm;
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
        const deps = [];
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
        // Deliverables, FSM, and test files (implement only)
        if (sessionType === 'implement') {
            allDeliverables.push(...resolveDeliverables(api, name));
            fsm = resolveFsm(api, pattern.status);
            allTestFiles.push(...resolveTestFiles(pattern));
        }
    }
    // Compute shared dependencies for multi-pattern context
    const sharedDependencies = [];
    if (patternNames.length > 1) {
        const depCounts = new Map();
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
    const allDeps = [];
    const seenDeps = new Set();
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
export function buildDepTree(dataset, options) {
    const { pattern: focalName, maxDepth, includeImplementationDeps } = options;
    requirePattern(dataset, focalName);
    // Find the root of the dependency chain by walking up
    const rootName = findDepTreeRoot(dataset, focalName, includeImplementationDeps);
    const visited = new Set();
    return buildTreeNode(dataset, rootName, focalName, 0, maxDepth, includeImplementationDeps, visited);
}
function findDepTreeRoot(dataset, focalName, includeImplementationDeps) {
    // Walk up dependsOn/enables chains to find the root ancestor
    const visited = new Set();
    let current = focalName;
    for (;;) {
        visited.add(current);
        const rels = getRelationships(dataset, current);
        if (rels === undefined)
            break;
        const parents = rels.dependsOn;
        const implParents = includeImplementationDeps ? rels.uses : [];
        const allParents = [...parents, ...implParents];
        const unvisitedParent = allParents.find((p) => !visited.has(p) && findPatternByName(dataset, p) !== undefined);
        if (unvisitedParent === undefined)
            break;
        current = unvisitedParent;
    }
    return current;
}
function buildTreeNode(dataset, name, focalName, depth, maxDepth, includeImplementationDeps, visited) {
    const pattern = findPatternByName(dataset, name);
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
        const hasChildren = rels !== undefined &&
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
    const childNames = [];
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
        .filter((childName) => findPatternByName(dataset, childName) !== undefined)
        .map((childName) => buildTreeNode(dataset, childName, focalName, depth + 1, maxDepth, includeImplementationDeps, visited));
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
export function buildFileReadingList(dataset, patternName, includeRelated) {
    const pattern = requirePattern(dataset, patternName);
    const name = getPatternName(pattern);
    // Primary: spec file + stub files
    const primary = [pattern.source.file];
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
    const completedDeps = [];
    const roadmapDeps = [];
    const architectureNeighbors = [];
    const rels = getRelationships(dataset, name);
    if (rels !== undefined) {
        for (const depName of rels.dependsOn) {
            const depPattern = findPatternByName(dataset, depName);
            if (depPattern === undefined)
                continue;
            if (depPattern.status === 'completed') {
                completedDeps.push(depPattern.source.file);
            }
            else {
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
export function buildOverview(dataset) {
    const { counts } = dataset;
    const total = counts.total;
    const percentage = total > 0 ? Math.round((counts.completed / total) * 100) : 0;
    const progress = {
        total,
        completed: counts.completed,
        active: counts.active,
        planned: counts.planned,
        percentage,
    };
    // Active phases: phases with active patterns
    const activePhases = [];
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
    const blocking = [];
    for (const pattern of dataset.patterns) {
        if (pattern.status === 'completed')
            continue;
        const name = getPatternName(pattern);
        const rels = getRelationships(dataset, name);
        if (rels === undefined)
            continue;
        const incompleteDeps = rels.dependsOn.filter((depName) => {
            const depPattern = findPatternByName(dataset, depName);
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
export class ContextAssemblyError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = 'ContextAssemblyError';
        this.code = code;
    }
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function emptyBundle(patterns, sessionType) {
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
//# sourceMappingURL=context-assembler.js.map