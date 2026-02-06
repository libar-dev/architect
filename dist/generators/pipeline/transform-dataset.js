/**
 * @libar-docs
 * @libar-docs-generator @libar-docs-core
 * @libar-docs-pattern TransformDataset
 * @libar-docs-status completed
 * @libar-docs-implements PatternRelationshipModel
 * @libar-docs-arch-role service
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer application
 * @libar-docs-uses MasterDataset, ExtractedPattern, TagRegistry, NormalizeStatus
 * @libar-docs-used-by Orchestrator
 * @libar-docs-usecase "When computing all pattern views in a single pass"
 * @libar-docs-usecase "When transforming raw extracted data for generators"
 * @libar-docs-extract-shapes RuntimeMasterDataset, RawDataset, transformToMasterDataset
 *
 * ## TransformDataset - Single-Pass Pattern Transformation
 *
 * Transforms raw extracted patterns into a MasterDataset with all pre-computed
 * views. This is the core of the unified transformation pipeline, computing
 * status groups, phase groups, quarter groups, category groups, and source
 * groups in a single iteration over the pattern array.
 *
 * ### When to Use
 *
 * - Use in orchestrator after pattern extraction and merging
 * - Use when you need pre-computed views for multiple generators
 *
 * ### Key Concepts
 *
 * - **Single-pass**: O(n) complexity regardless of view count
 * - **Immutable output**: Returns a new MasterDataset object
 * - **Workflow integration**: Uses workflow config for phase names
 */
import { ExtractedPatternSchema } from '../../validation-schemas/index.js';
import { normalizeStatus, ACCEPTED_STATUS_VALUES } from '../../taxonomy/index.js';
/**
 * Infer bounded context from file path using configured rules.
 *
 * Iterates through rules in order and returns the context from the first
 * matching pattern. Returns undefined if no rules match.
 *
 * Pattern matching supports:
 * - Simple prefix matching: `src/validation/` matches files in that directory
 * - Glob-style wildcards: `src/validation/**` matches all files recursively
 *
 * @param filePath - The source file path to check
 * @param rules - Ordered list of inference rules
 * @returns The inferred context name, or undefined if no match
 */
function inferContext(filePath, rules) {
    if (!rules || rules.length === 0)
        return undefined;
    for (const rule of rules) {
        if (matchPattern(filePath, rule.pattern)) {
            return rule.context;
        }
    }
    return undefined;
}
/**
 * Simple pattern matching for file paths.
 *
 * Supports:
 * - Exact prefix matching: `src/validation/` matches `src/validation/foo.ts`
 * - Glob-style `**` wildcard: `src/validation/**` matches all files recursively
 *
 * @param filePath - The file path to check
 * @param pattern - The pattern to match against
 * @returns true if the file path matches the pattern
 */
function matchPattern(filePath, pattern) {
    // Handle `**` wildcard patterns (recursive match)
    if (pattern.endsWith('/**')) {
        const prefix = pattern.slice(0, -3); // Remove '/**'
        return filePath.startsWith(prefix);
    }
    // Handle `/*` wildcard patterns (single level match)
    if (pattern.endsWith('/*')) {
        const prefix = pattern.slice(0, -2); // Remove '/*'
        const afterPrefix = filePath.slice(prefix.length);
        // Must start with prefix and have exactly one path segment after
        return filePath.startsWith(prefix) && !afterPrefix.slice(1).includes('/');
    }
    // Simple prefix matching
    return filePath.startsWith(pattern);
}
/**
 * Check if a status value is a known/valid status.
 *
 * @param status - Status value to check
 * @returns true if status is a known value
 */
function isKnownStatus(status) {
    if (!status)
        return true; // undefined is acceptable (defaults to planned)
    return ACCEPTED_STATUS_VALUES.includes(status);
}
/**
 * Transform raw extracted data into a MasterDataset with all pre-computed views.
 *
 * This is a ONE-PASS transformation that computes:
 * - Status-based groupings (completed/active/planned)
 * - Phase-based groupings with counts
 * - Quarter-based groupings for timeline views
 * - Category-based groupings for taxonomy
 * - Source-based views (TypeScript vs Gherkin, roadmap, PRD)
 * - Aggregate statistics (counts, phase count, category count)
 * - Optional relationship index
 *
 * For backward compatibility, this function returns just the dataset.
 * Use `transformToMasterDatasetWithValidation` to get validation summary.
 *
 * @param raw - Raw dataset with patterns, registry, and optional workflow
 * @returns MasterDataset with all pre-computed views
 *
 * @example
 * ```typescript
 * const masterDataset = transformToMasterDataset({
 *   patterns: mergedPatterns,
 *   tagRegistry: registry,
 *   workflow,
 * });
 *
 * // Access pre-computed views
 * const completed = masterDataset.byStatus.completed;
 * const phase3Patterns = masterDataset.byPhase.find(p => p.phaseNumber === 3);
 * const q42024 = masterDataset.byQuarter["Q4-2024"];
 * ```
 */
export function transformToMasterDataset(raw) {
    return transformToMasterDatasetWithValidation(raw).dataset;
}
/**
 * Transform raw extracted data into a MasterDataset with validation summary.
 *
 * This is the full transformation that includes:
 * - Pre-loop validation against ExtractedPatternSchema
 * - Status-based groupings (completed/active/planned)
 * - Phase-based groupings with counts
 * - Quarter-based groupings for timeline views
 * - Category-based groupings for taxonomy
 * - Source-based views (TypeScript vs Gherkin, roadmap, PRD)
 * - Aggregate statistics (counts, phase count, category count)
 * - Relationship index with dangling reference detection
 * - Validation summary with malformed patterns and unknown statuses
 *
 * @param raw - Raw dataset with patterns, registry, and optional workflow
 * @returns TransformResult with dataset and validation summary
 *
 * @example
 * ```typescript
 * const result = transformToMasterDatasetWithValidation({
 *   patterns: mergedPatterns,
 *   tagRegistry: registry,
 *   workflow,
 * });
 *
 * if (result.validation.warningCount > 0) {
 *   console.warn(`Found ${result.validation.warningCount} validation issues`);
 * }
 *
 * const dataset = result.dataset;
 * ```
 */
export function transformToMasterDatasetWithValidation(raw) {
    const { patterns, tagRegistry, workflow, contextInferenceRules } = raw;
    // ─────────────────────────────────────────────────────────────────────────
    // Validation tracking
    // ─────────────────────────────────────────────────────────────────────────
    const malformedPatterns = [];
    const unknownStatuses = [];
    const danglingReferences = [];
    // ─────────────────────────────────────────────────────────────────────────
    // Pre-loop validation: validate each pattern against schema
    // ─────────────────────────────────────────────────────────────────────────
    // Build a set of all pattern names for reference checking
    const allPatternNames = new Set();
    for (const pattern of patterns) {
        const key = pattern.patternName ?? pattern.name;
        allPatternNames.add(key);
    }
    for (const pattern of patterns) {
        // Validate against schema
        const parseResult = ExtractedPatternSchema.safeParse(pattern);
        if (!parseResult.success) {
            const patternId = pattern.patternName ?? pattern.name;
            const issues = parseResult.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
            malformedPatterns.push({ patternId, issues });
        }
        // Check for unknown status values
        if (pattern.status && !isKnownStatus(pattern.status)) {
            if (!unknownStatuses.includes(pattern.status)) {
                unknownStatuses.push(pattern.status);
            }
        }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Initialize accumulators for single-pass computation
    // ─────────────────────────────────────────────────────────────────────────
    const byStatus = {
        completed: [],
        active: [],
        planned: [],
    };
    const byPhaseMap = new Map();
    const byQuarter = {};
    const byCategoryMap = new Map();
    const bySource = {
        typescript: [],
        gherkin: [],
        roadmap: [],
        prd: [],
    };
    const relationshipIndex = {};
    // Architecture index for diagram generation
    const archIndex = {
        byRole: {},
        byContext: {},
        byLayer: {},
        all: [],
    };
    // ─────────────────────────────────────────────────────────────────────────
    // Single pass over all patterns
    // ─────────────────────────────────────────────────────────────────────────
    for (const pattern of patterns) {
        // Reference for accumulation
        const p = pattern;
        // ─── Status grouping ───────────────────────────────────────────────────
        const status = normalizeStatus(pattern.status);
        byStatus[status].push(p);
        // ─── Phase grouping ────────────────────────────────────────────────────
        if (pattern.phase !== undefined) {
            const existing = byPhaseMap.get(pattern.phase) ?? [];
            existing.push(p);
            byPhaseMap.set(pattern.phase, existing);
            // Also add to roadmap view (patterns with phase are roadmap items)
            bySource.roadmap.push(p);
        }
        // ─── Quarter grouping ──────────────────────────────────────────────────
        if (pattern.quarter) {
            const quarter = pattern.quarter;
            const quarterPatterns = (byQuarter[quarter] ??= []);
            quarterPatterns.push(p);
        }
        // ─── Category grouping ─────────────────────────────────────────────────
        const category = pattern.category;
        const categoryPatterns = byCategoryMap.get(category) ?? [];
        categoryPatterns.push(p);
        byCategoryMap.set(category, categoryPatterns);
        // ─── Source grouping ───────────────────────────────────────────────────
        if (pattern.source.file.endsWith('.feature')) {
            bySource.gherkin.push(p);
        }
        else {
            bySource.typescript.push(p);
        }
        // ─── PRD grouping (has productArea, userRole, or businessValue) ────────
        if (pattern.productArea || pattern.userRole || pattern.businessValue) {
            bySource.prd.push(p);
        }
        // ─── Relationship index ────────────────────────────────────────────────
        const patternKey = pattern.patternName ?? pattern.name;
        relationshipIndex[patternKey] = {
            uses: [...(pattern.uses ?? [])],
            usedBy: [...(pattern.usedBy ?? [])],
            dependsOn: [...(pattern.dependsOn ?? [])],
            enables: [...(pattern.enables ?? [])],
            // UML-inspired relationship fields (PatternRelationshipModel)
            implementsPatterns: [...(pattern.implementsPatterns ?? [])],
            implementedBy: [], // Computed in second pass
            extendsPattern: pattern.extendsPattern,
            extendedBy: [], // Computed in second pass
            // Cross-reference and API navigation fields (PatternRelationshipModel enhancement)
            seeAlso: [...(pattern.seeAlso ?? [])],
            apiRef: [...(pattern.apiRef ?? [])],
        };
        // ─── Architecture index (for diagram generation) ──────────────────────
        // Infer context from file path if not explicitly set
        const inferredContext = pattern.archContext ?? inferContext(pattern.source.file, contextInferenceRules);
        const hasArchMetadata = pattern.archRole !== undefined ||
            inferredContext !== undefined ||
            pattern.archLayer !== undefined;
        if (hasArchMetadata) {
            archIndex.all.push(p);
            // Group by role (bounded-context, projection, saga, etc.)
            if (pattern.archRole) {
                const rolePatterns = (archIndex.byRole[pattern.archRole] ??= []);
                rolePatterns.push(p);
            }
            // Group by context (orders, inventory, etc.) for subgraph rendering
            // Uses explicit archContext OR inferred context from file path
            if (inferredContext) {
                const contextPatterns = (archIndex.byContext[inferredContext] ??= []);
                contextPatterns.push(p);
            }
            // Group by layer (domain, application, infrastructure)
            if (pattern.archLayer) {
                const layerPatterns = (archIndex.byLayer[pattern.archLayer] ??= []);
                layerPatterns.push(p);
            }
        }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Second pass: compute reverse lookups (implementedBy, extendedBy)
    // ─────────────────────────────────────────────────────────────────────────
    // We iterate over patterns again to have access to source.file for implementedBy
    for (const pattern of patterns) {
        const patternKey = pattern.patternName ?? pattern.name;
        const entry = relationshipIndex[patternKey];
        if (!entry)
            continue;
        // Build implementedBy reverse lookup with full ImplementationRef
        for (const implemented of entry.implementsPatterns) {
            const target = relationshipIndex[implemented];
            if (target) {
                // Check if this implementation is already added (by name)
                const alreadyAdded = target.implementedBy.some((impl) => impl.name === patternKey);
                if (!alreadyAdded) {
                    // Extract first line of description if available, truncate to 100 chars
                    const desc = pattern.directive.description;
                    const firstLine = desc ? desc.split('\n')[0]?.trim() : undefined;
                    const description = firstLine && firstLine.length > 0
                        ? firstLine.slice(0, 100) + (firstLine.length > 100 ? '...' : '')
                        : undefined;
                    target.implementedBy.push({
                        name: patternKey,
                        file: pattern.source.file,
                        description,
                    });
                }
            }
        }
        // Build extendedBy reverse lookup (still uses string names)
        if (entry.extendsPattern) {
            const target = relationshipIndex[entry.extendsPattern];
            if (target && !target.extendedBy.includes(patternKey)) {
                target.extendedBy.push(patternKey);
            }
        }
    }
    // Sort implementedBy alphabetically by file path for consistent output
    for (const entry of Object.values(relationshipIndex)) {
        entry.implementedBy.sort((a, b) => a.file.localeCompare(b.file));
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Third pass: detect dangling references in relationship fields
    // ─────────────────────────────────────────────────────────────────────────
    for (const pattern of patterns) {
        const patternKey = pattern.patternName ?? pattern.name;
        // Check 'uses' references
        for (const ref of pattern.uses ?? []) {
            if (!allPatternNames.has(ref)) {
                danglingReferences.push({ pattern: patternKey, field: 'uses', missing: ref });
            }
        }
        // Check 'dependsOn' references
        for (const ref of pattern.dependsOn ?? []) {
            if (!allPatternNames.has(ref)) {
                danglingReferences.push({ pattern: patternKey, field: 'dependsOn', missing: ref });
            }
        }
        // Check 'implementsPatterns' references
        for (const ref of pattern.implementsPatterns ?? []) {
            if (!allPatternNames.has(ref)) {
                danglingReferences.push({ pattern: patternKey, field: 'implementsPatterns', missing: ref });
            }
        }
        // Check 'extendsPattern' reference
        if (pattern.extendsPattern && !allPatternNames.has(pattern.extendsPattern)) {
            danglingReferences.push({
                pattern: patternKey,
                field: 'extendsPattern',
                missing: pattern.extendsPattern,
            });
        }
        // Check 'seeAlso' references
        for (const ref of pattern.seeAlso ?? []) {
            if (!allPatternNames.has(ref)) {
                danglingReferences.push({ pattern: patternKey, field: 'seeAlso', missing: ref });
            }
        }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Build phase groups with counts (sorted by phase number)
    // ─────────────────────────────────────────────────────────────────────────
    const byPhase = Array.from(byPhaseMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([phaseNumber, phasePatterns]) => {
        // Try workflow config first, then derive from patterns
        const workflowPhaseName = workflow?.config.phases.find((p) => p.order === phaseNumber)?.name;
        // If no workflow name, use the first pattern's name (often the phase has one primary pattern)
        const firstPattern = phasePatterns[0];
        const derivedName = firstPattern?.name;
        return {
            phaseNumber,
            phaseName: workflowPhaseName ?? derivedName,
            patterns: phasePatterns,
            counts: computeCounts(phasePatterns),
        };
    });
    // ─────────────────────────────────────────────────────────────────────────
    // Convert category map to record
    // ─────────────────────────────────────────────────────────────────────────
    const byCategory = Object.fromEntries(byCategoryMap);
    // ─────────────────────────────────────────────────────────────────────────
    // Compute aggregate counts
    // ─────────────────────────────────────────────────────────────────────────
    const counts = {
        completed: byStatus.completed.length,
        active: byStatus.active.length,
        planned: byStatus.planned.length,
        total: patterns.length,
    };
    // ─────────────────────────────────────────────────────────────────────────
    // Build validation summary
    // ─────────────────────────────────────────────────────────────────────────
    const validation = {
        totalPatterns: patterns.length,
        malformedPatterns,
        danglingReferences,
        unknownStatuses,
        warningCount: malformedPatterns.length + danglingReferences.length + unknownStatuses.length,
    };
    // ─────────────────────────────────────────────────────────────────────────
    // Return assembled MasterDataset with validation
    // ─────────────────────────────────────────────────────────────────────────
    const dataset = {
        patterns: patterns,
        tagRegistry,
        byStatus,
        byPhase,
        byQuarter,
        byCategory,
        bySource,
        counts,
        phaseCount: byPhaseMap.size,
        categoryCount: byCategoryMap.size,
        relationshipIndex,
        // Only include archIndex if it has content
        ...(archIndex.all.length > 0 && { archIndex }),
    };
    // Only include workflow if defined (exactOptionalPropertyTypes compliance)
    if (workflow !== undefined) {
        return { dataset: { ...dataset, workflow }, validation };
    }
    return { dataset, validation };
}
/**
 * Compute status counts for a subset of patterns
 *
 * @param patterns - Patterns to count
 * @returns Status counts including total
 */
function computeCounts(patterns) {
    let completed = 0;
    let active = 0;
    let planned = 0;
    for (const p of patterns) {
        const s = normalizeStatus(p.status);
        if (s === 'completed')
            completed++;
        else if (s === 'active')
            active++;
        else
            planned++;
    }
    return {
        completed,
        active,
        planned,
        total: patterns.length,
    };
}
/**
 * Compute completion percentage from status counts
 *
 * @param counts - Status counts
 * @returns Percentage (0-100) of completed items
 */
export function completionPercentage(counts) {
    if (counts.total === 0)
        return 0;
    return Math.round((counts.completed / counts.total) * 100);
}
/**
 * Check if all items in a phase/group are completed
 *
 * @param counts - Status counts
 * @returns True if all items are completed
 */
export function isFullyCompleted(counts) {
    return counts.total > 0 && counts.completed === counts.total;
}
//# sourceMappingURL=transform-dataset.js.map