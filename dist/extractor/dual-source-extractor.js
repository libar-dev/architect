/**
 * @libar-docs
 * @libar-docs-extractor
 * @libar-docs-pattern DualSourceExtractor
 * @libar-docs-status completed
 * @libar-docs-uses DocExtractor, GherkinExtractor, GherkinScanner
 * @libar-docs-used-by Orchestrator
 *
 * ## DualSourceExtractor - Compose Pattern Data from Code + Features
 *
 * Extracts pattern metadata from both TypeScript code stubs (@libar-docs-*)
 * and Gherkin feature files (@libar-process-*), validates consistency,
 * and composes unified pattern data for documentation generation.
 *
 * ### When to Use
 *
 * - When implementing USDP Pattern 2 (Standard) or higher
 * - When you have both code stubs AND timeline features
 * - When generating artifacts that need both timeless and temporal data
 * - When validating cross-source consistency (pattern name, phase alignment)
 *
 * ### Key Concepts
 *
 * - **Code Source**: @libar-docs-* tags define timeless pattern graph
 * - **Feature Source**: @libar-process-* tags add temporal process metadata
 * - **Cross-Validation**: Pattern name + phase must match across sources
 * - **Deliverables**: Parsed from Gherkin Background tables in features
 */
// Import Zod schemas and inferred types (schema-first pattern)
import { ProcessMetadataSchema, DeliverableSchema, } from '../validation-schemas/index.js';
/**
 * Extract process metadata from Gherkin feature tags
 *
 * Uses schema validation instead of type assertions to ensure data integrity.
 * Returns null if required tags are missing OR if validation fails.
 *
 * @param feature - Scanned Gherkin feature
 * @returns Process metadata or null if missing required tags or validation fails
 */
export function extractProcessMetadata(feature) {
    const tags = feature.feature.tags;
    // Extract @libar-process-* tags (without @ prefix - parser strips it)
    const patternTag = tags.find((t) => t.startsWith('libar-process-pattern:'));
    const phaseTag = tags.find((t) => t.startsWith('libar-process-phase:'));
    const statusTag = tags.find((t) => t.startsWith('libar-process-status:'));
    if (!patternTag || !phaseTag) {
        // Missing required tags
        return null;
    }
    const pattern = patternTag.replace('libar-process-pattern:', '');
    const phaseStr = phaseTag.replace('libar-process-phase:', '');
    const phase = parseInt(phaseStr, 10);
    const status = statusTag?.replace('libar-process-status:', '') ?? 'roadmap';
    // Extract optional tags
    const quarterTag = tags.find((t) => t.startsWith('libar-process-quarter:'));
    const effortTag = tags.find((t) => t.startsWith('libar-process-effort:'));
    const teamTag = tags.find((t) => t.startsWith('libar-process-team:'));
    const workflowTag = tags.find((t) => t.startsWith('libar-process-workflow:'));
    const completedTag = tags.find((t) => t.startsWith('libar-process-completed:'));
    const effortActualTag = tags.find((t) => t.startsWith('libar-process-effort-actual:'));
    const riskTag = tags.find((t) => t.startsWith('libar-process-risk:'));
    const briefTag = tags.find((t) => t.startsWith('libar-process-brief:'));
    const productAreaTag = tags.find((t) => t.startsWith('libar-process-product-area:'));
    const userRoleTag = tags.find((t) => t.startsWith('libar-process-user-role:'));
    const businessValueTag = tags.find((t) => t.startsWith('libar-process-business-value:'));
    const quarter = quarterTag?.replace('libar-process-quarter:', '');
    const effort = effortTag?.replace('libar-process-effort:', '');
    const team = teamTag?.replace('libar-process-team:', '');
    const workflow = workflowTag?.replace('libar-process-workflow:', '');
    const completed = completedTag?.replace('libar-process-completed:', '');
    const effortActual = effortActualTag?.replace('libar-process-effort-actual:', '');
    const risk = riskTag?.replace('libar-process-risk:', '');
    const brief = briefTag?.replace('libar-process-brief:', '');
    const productArea = productAreaTag?.replace('libar-process-product-area:', '');
    const userRole = userRoleTag?.replace('libar-process-user-role:', '');
    // Business value may have surrounding quotes - strip them
    const businessValueRaw = businessValueTag?.replace('libar-process-business-value:', '');
    const businessValue = businessValueRaw?.replace(/^["']|["']$/g, '');
    // Build raw metadata object (no type assertions)
    const rawMetadata = {
        pattern,
        phase,
        status,
        ...(quarter && { quarter }),
        ...(effort && { effort }),
        ...(team && { team }),
        ...(workflow && { workflow }),
        ...(completed && { completed }),
        ...(effortActual && { effortActual }),
        ...(risk && { risk }),
        ...(brief && { brief }),
        ...(productArea && { productArea }),
        ...(userRole && { userRole }),
        ...(businessValue && { businessValue }),
    };
    // Validate against schema (schema-first enforcement)
    const validation = ProcessMetadataSchema.safeParse(rawMetadata);
    if (!validation.success) {
        // Log validation failure for debugging (but don't fail silently)
        console.warn(`Process metadata validation failed in ${feature.filePath}: ` +
            validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '));
        return null;
    }
    return validation.data;
}
/**
 * Parse a Tests cell value to a number
 *
 * Handles various formats:
 * - "Yes" / "No" → 1 / 0
 * - Numbers as strings → parsed int
 * - Empty → 0
 *
 * @param value - Tests cell value
 * @returns Number of tests
 */
function parseTestsValue(value) {
    const trimmed = value.trim().toLowerCase();
    // Handle Yes/No/True/False
    if (trimmed === 'yes' || trimmed === 'true' || trimmed === '✓' || trimmed === '✅') {
        return 1;
    }
    if (trimmed === 'no' ||
        trimmed === 'false' ||
        trimmed === '✗' ||
        trimmed === '' ||
        trimmed === '-') {
        return 0;
    }
    // Try to parse as number
    const parsed = parseInt(trimmed, 10);
    return isNaN(parsed) ? 0 : parsed;
}
/**
 * Extract deliverables from Gherkin Background table
 *
 * Parses Background section looking for DataTables with a "Deliverable" column.
 * Expected table format:
 * | Deliverable | Status | Tests | Location |
 *
 * Optional columns for extended tracking:
 * | Deliverable | Status | Tests | Location | Finding | Release |
 *
 * - **Finding**: Review traceability ID (e.g., "CODE-001")
 * - **Release**: Semver version for changelog grouping (e.g., "v0.2.0")
 *
 * @param feature - Scanned Gherkin feature with optional background
 * @returns Array of deliverables or empty array if no table found
 *
 * @example
 * ```gherkin
 * Background: Deliverables
 *   Given the following deliverables:
 *     | Deliverable | Status | Tests | Location | Finding | Release |
 *     | Fix parseArgs() call | Done | Yes | src/cli/generate-docs.ts | CODE-001 | v0.2.0 |
 *     | Update README.md | Done | No | README.md | DOC-001 | v0.2.0 |
 * ```
 */
export function extractDeliverables(feature) {
    // Check if feature has a background section
    if (!feature.background) {
        return [];
    }
    const deliverables = [];
    // Search for DataTables in background steps
    for (const step of feature.background.steps) {
        if (!step.dataTable) {
            continue;
        }
        const { headers, rows } = step.dataTable;
        // Check if this table has a "Deliverable" column (case-insensitive)
        const deliverableIdx = headers.findIndex((h) => h.toLowerCase() === 'deliverable');
        if (deliverableIdx === -1) {
            continue;
        }
        // Find other columns (case-insensitive)
        const statusIdx = headers.findIndex((h) => h.toLowerCase() === 'status');
        const testsIdx = headers.findIndex((h) => h.toLowerCase() === 'tests');
        const locationIdx = headers.findIndex((h) => h.toLowerCase() === 'location');
        const findingIdx = headers.findIndex((h) => h.toLowerCase() === 'finding');
        const releaseIdx = headers.findIndex((h) => h.toLowerCase() === 'release');
        // Store header names for reliable lookup (avoid empty-string key match)
        const deliverableHeader = headers[deliverableIdx];
        const statusHeader = statusIdx >= 0 ? headers[statusIdx] : undefined;
        const testsHeader = testsIdx >= 0 ? headers[testsIdx] : undefined;
        const locationHeader = locationIdx >= 0 ? headers[locationIdx] : undefined;
        const findingHeader = findingIdx >= 0 ? headers[findingIdx] : undefined;
        const releaseHeader = releaseIdx >= 0 ? headers[releaseIdx] : undefined;
        if (!deliverableHeader)
            continue;
        // Parse each row with schema validation
        for (const row of rows) {
            const name = row[deliverableHeader]?.trim() ?? '';
            const status = statusHeader ? (row[statusHeader]?.trim() ?? '') : '';
            const testsValue = testsHeader ? (row[testsHeader]?.trim() ?? '0') : '0';
            const location = locationHeader ? (row[locationHeader]?.trim() ?? '') : '';
            const findingRaw = findingHeader ? row[findingHeader]?.trim() : undefined;
            const finding = findingRaw !== '' ? findingRaw : undefined;
            const releaseRaw = releaseHeader ? row[releaseHeader]?.trim() : undefined;
            const release = releaseRaw !== '' ? releaseRaw : undefined;
            // Build raw deliverable object (no type assertions)
            const rawDeliverable = {
                name,
                status,
                tests: parseTestsValue(testsValue),
                location,
                ...(finding && { finding }),
                ...(release && { release }),
            };
            // Validate against schema (schema-first enforcement)
            const validation = DeliverableSchema.safeParse(rawDeliverable);
            if (!validation.success) {
                // Skip invalid deliverables with warning (name might be empty or tests negative)
                console.warn(`Deliverable validation failed in ${feature.filePath}: ` +
                    validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '));
                continue;
            }
            deliverables.push(validation.data);
        }
    }
    return deliverables;
}
/**
 * Combine patterns from code and features into dual-source patterns
 *
 * Validates that pattern names and phases match across sources.
 * Creates unified pattern objects with both code and process metadata.
 *
 * **Pattern Name Collisions:**
 * When multiple code files use the same `@libar-docs-pattern` name (e.g.,
 * ServiceIndependence with ECST and Reservation sub-patterns), they are
 * automatically merged:
 * - Categories, dependencies, and enables are unioned across all sources
 * - Primary pattern (first in array) provides base metadata
 * - All source patterns are preserved in the `sources` array
 * - Console warning is emitted for visibility
 *
 * @param codePatterns - Patterns extracted from TypeScript code
 * @param featureFiles - Scanned Gherkin feature files
 * @returns Dual-source extraction results
 *
 * @example
 * ```typescript
 * // Extract from both sources
 * const codeScan = await scanPatterns({ patterns: 'packages/**\/*.ts' });
 * const featureScan = await scanGherkinFiles({ patterns: 'tests/features/**\/*.feature' });
 *
 * if (codeScan.ok && featureScan.ok) {
 *   const codeExtraction = extractPatterns(codeScan.value.files, '/project');
 *   const dualSource = combineSources(codeExtraction.patterns, featureScan.value.files);
 *
 *   console.log(`Combined: ${dualSource.patterns.length}`);
 *   console.log(`Code-only: ${dualSource.codeOnly.length}`);
 *   console.log(`Feature-only: ${dualSource.featureOnly.length}`);
 *   console.log(`Validation errors: ${dualSource.validationErrors.length}`);
 *
 *   // Check for collisions
 *   for (const pattern of dualSource.patterns) {
 *     if (pattern.sources) {
 *       console.log(`${pattern.patternName} has ${pattern.sources.length} implementations`);
 *     }
 *   }
 * }
 * ```
 */
export function combineSources(codePatterns, featureFiles) {
    const combined = [];
    const codeOnly = [];
    const featureOnly = [];
    const validationErrors = [];
    const warnings = [];
    // Build index of code patterns by patternName (supports collisions)
    // When multiple code files use same pattern name, they're stored as an array
    const codeIndex = new Map();
    for (const pattern of codePatterns) {
        if (pattern.patternName) {
            const existing = codeIndex.get(pattern.patternName) ?? [];
            codeIndex.set(pattern.patternName, [...existing, pattern]);
        }
    }
    // Build index of features by pattern name
    const featureIndex = new Map();
    for (const feature of featureFiles) {
        const metadata = extractProcessMetadata(feature);
        if (metadata) {
            featureIndex.set(metadata.pattern, { metadata, file: feature });
        }
    }
    // Combine matching patterns
    for (const [patternName, codePatternArray] of codeIndex.entries()) {
        const featureData = featureIndex.get(patternName);
        if (!featureData) {
            // Code-only patterns (no matching feature)
            codeOnly.push(...codePatternArray);
            continue;
        }
        const { metadata: processMetadata, file: featureFile } = featureData;
        // Handle pattern collision (multiple code sources for same pattern name)
        const hasCollision = codePatternArray.length > 1;
        const primaryPattern = codePatternArray[0];
        if (!primaryPattern) {
            // Should never happen but TypeScript needs the check
            console.warn(`Pattern "${patternName}" has no code patterns in array`);
            continue;
        }
        // Cross-validate: Phase must match (if both present)
        if (primaryPattern.phase !== undefined && processMetadata.phase !== primaryPattern.phase) {
            validationErrors.push({
                codeName: patternName,
                featureName: processMetadata.pattern,
                codePhase: primaryPattern.phase,
                featurePhase: processMetadata.phase,
                sources: {
                    code: primaryPattern.source.file,
                    feature: featureFile.filePath,
                },
                message: `Phase mismatch: code has ${primaryPattern.phase}, feature has ${processMetadata.phase}`,
            });
            // Still combine but note the error
        }
        // Extract deliverables from feature
        const deliverables = extractDeliverables(featureFile);
        // Note: ExtractedPattern has 'category' (singular), not 'categories' (plural)
        // For collision handling, we use the primary pattern's category
        // Future enhancement: could merge categories if schema changes
        // Merge dependencies (union)
        const mergedDependsOn = hasCollision
            ? Array.from(new Set(codePatternArray.flatMap((p) => p.dependsOn ?? [])))
            : primaryPattern.dependsOn;
        // Merge enables (union)
        const mergedEnables = hasCollision
            ? Array.from(new Set(codePatternArray.flatMap((p) => p.enables ?? [])))
            : primaryPattern.enables;
        // Combine into dual-source pattern
        // Destructure to exclude existing deliverables (exactOptionalPropertyTypes requires this)
        const { deliverables: _existingDeliverables, ...patternWithoutDeliverables } = primaryPattern;
        const dualSourcePattern = {
            ...patternWithoutDeliverables,
            ...(mergedDependsOn && mergedDependsOn.length > 0 && { dependsOn: mergedDependsOn }),
            ...(mergedEnables && mergedEnables.length > 0 && { enables: mergedEnables }),
            process: processMetadata,
            ...(deliverables.length > 0 && { deliverables }),
            ...(hasCollision && { sources: codePatternArray }),
        };
        combined.push(dualSourcePattern);
        // Collect warning about collision (structured, not console.warn)
        if (hasCollision) {
            warnings.push(`Pattern name collision: "${patternName}" defined in ${codePatternArray.length} files: ` +
                codePatternArray.map((p) => p.source.file).join(', '));
        }
        // Remove from feature index (mark as matched)
        featureIndex.delete(patternName);
    }
    // Remaining features are feature-only (no matching code)
    for (const [_, { metadata }] of featureIndex.entries()) {
        featureOnly.push(metadata);
    }
    return {
        patterns: combined,
        codeOnly,
        featureOnly,
        validationErrors,
        warnings,
    };
}
/**
 * Validate dual-source consistency
 *
 * Checks that patterns are properly aligned across sources.
 * Reports code stubs without features and features without code.
 *
 * @param results - Dual-source extraction results
 * @returns Validation summary
 */
export function validateDualSource(results) {
    const errors = [];
    const warnings = [];
    // Errors: Cross-validation failures
    for (const error of results.validationErrors) {
        errors.push(`${error.codeName}: ${error.message}`);
    }
    // Warnings: Orphaned stubs (code without feature)
    for (const pattern of results.codeOnly) {
        if (pattern.status === 'roadmap') {
            const name = pattern.patternName ?? pattern.name;
            warnings.push(`Roadmap pattern "${name}" has code stub but no feature file`);
        }
    }
    // Warnings: Features without code stubs
    for (const metadata of results.featureOnly) {
        if (metadata.status === 'roadmap') {
            warnings.push(`Feature "${metadata.pattern}" (phase ${metadata.phase}) has no code stub`);
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}
//# sourceMappingURL=dual-source-extractor.js.map