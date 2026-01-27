/**
 * @libar-docs
 * @libar-docs-lint
 * @libar-docs-pattern DeriveProcessState
 * @libar-docs-status active
 * @libar-docs-depends-on:GherkinScanner,FSMValidator
 *
 * ## DeriveProcessState - Extract Process State from File Annotations
 *
 * Derives process state from @libar-docs-* annotations in files.
 * State is computed on-demand, not stored separately.
 *
 * ### Design Principles
 *
 * - **Derived, Not Stored**: State comes from file annotations
 * - **Reuses Scanner**: Builds on existing gherkin-scanner infrastructure
 * - **Pure Functions**: No side effects, testable
 *
 * ### When to Use
 *
 * - When validating changes against process rules
 * - When computing protection levels for files
 * - When determining session scope
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { glob } from 'glob';
import { Result as R } from '../../types/index.js';
import { scanGherkinFiles } from '../../scanner/gherkin-scanner.js';
import { getProtectionLevel } from '../../validation/fsm/index.js';
import { PROCESS_STATUS_VALUES, normalizeStatus, } from '../../taxonomy/index.js';
/** Default spec patterns - generic defaults that work for package-level usage */
const DEFAULT_SPEC_PATTERNS = [
    'delivery-process/**/*.feature',
    'specs/**/*.feature', // For consumers
];
// =============================================================================
// Core Functions
// =============================================================================
/**
 * Derive complete process state from file annotations.
 *
 * Scans spec files and extracts:
 * - Status from @libar-docs-status tags
 * - Deliverables from Background tables
 * - Session state from active session files
 *
 * @param config - Configuration for state derivation
 * @returns Result containing ProcessState or error
 *
 * @example
 * ```typescript
 * const result = await deriveProcessState({
 *   baseDir: '/path/to/project',
 * });
 * if (result.ok) {
 *   const state = result.value;
 *   console.log(`Found ${state.files.size} spec files`);
 * }
 * ```
 */
export async function deriveProcessState(config) {
    const specPatterns = config.specPatterns ?? DEFAULT_SPEC_PATTERNS;
    // taxonomyPath is now optional - TypeScript is the source of truth for taxonomy
    const taxonomyPath = config.taxonomyPath ?? null;
    const sessionsDir = config.sessionsDir ?? path.join(config.baseDir, 'sessions');
    // Derive file states
    const filesResult = await deriveFileStates(config.baseDir, specPatterns);
    if (!filesResult.ok) {
        return filesResult;
    }
    // Compute taxonomy hash (only if JSON path provided for backwards compatibility)
    let taxonomyHash = '';
    if (taxonomyPath) {
        const hashResult = await computeTaxonomyHash(taxonomyPath);
        taxonomyHash = hashResult.ok ? hashResult.value : '';
    }
    // Find active session
    const sessionResult = await findActiveSession(sessionsDir, config.baseDir);
    const activeSession = sessionResult.ok ? sessionResult.value : undefined;
    // Build ProcessState (handle exactOptionalPropertyTypes)
    const processState = {
        files: filesResult.value,
        taxonomyHash,
        derivedAt: new Date().toISOString(),
    };
    // Only add activeSession if it exists
    if (activeSession !== undefined) {
        processState.activeSession = activeSession;
    }
    return R.ok(processState);
}
/**
 * Derive FileState for all spec files.
 */
async function deriveFileStates(baseDir, patterns) {
    // Scan feature files
    const scanResult = await scanGherkinFiles({
        patterns: patterns,
        baseDir,
    });
    if (!scanResult.ok) {
        return R.err(new Error(`Failed to scan files: ${String(scanResult.error)}`));
    }
    const { files } = scanResult.value;
    const fileStates = new Map();
    for (const file of files) {
        const relativePath = path.relative(baseDir, file.filePath);
        // Extract status from feature tags
        const status = extractStatusFromTags(file.feature.tags);
        const normalizedStatusValue = normalizeStatus(status);
        const protection = getProtectionLevel(status);
        // Extract deliverables from background
        const deliverables = extractDeliverablesFromBackground(file.background);
        // Check for unlock reason
        const unlockInfo = extractUnlockReason(file.feature.tags);
        // Build file state (handle exactOptionalPropertyTypes)
        const fileState = {
            path: file.filePath,
            relativePath,
            status,
            normalizedStatus: normalizedStatusValue,
            protection,
            deliverables,
            hasUnlockReason: unlockInfo.hasUnlockReason,
        };
        // Only add unlockReason if it exists (exactOptionalPropertyTypes compliance)
        if (unlockInfo.unlockReason !== undefined) {
            fileState.unlockReason = unlockInfo.unlockReason;
        }
        fileStates.set(relativePath, fileState);
    }
    return R.ok(fileStates);
}
/**
 * Extract status value from feature tags.
 */
function extractStatusFromTags(tags) {
    for (const tag of tags) {
        // Handle @libar-docs-status:value format
        if (tag.includes('status:')) {
            const match = /status:(\w+)/.exec(tag);
            if (match?.[1]) {
                const status = match[1].toLowerCase();
                if (PROCESS_STATUS_VALUES.includes(status)) {
                    return status;
                }
            }
        }
    }
    // Default to roadmap if no status found
    return 'roadmap';
}
/**
 * Extract deliverable names from background data table.
 * Uses unknown type to handle exactOptionalPropertyTypes compatibility.
 */
function extractDeliverablesFromBackground(background) {
    if (background === null || background === undefined || typeof background !== 'object')
        return [];
    const bg = background;
    if (bg.steps === undefined)
        return [];
    const deliverables = [];
    for (const step of bg.steps) {
        const rows = step.dataTable?.rows;
        if (rows) {
            for (const row of rows) {
                // Look for "Deliverable" column
                const deliverable = row['Deliverable'] ?? row['deliverable'];
                if (deliverable) {
                    deliverables.push(deliverable);
                }
            }
        }
    }
    return deliverables;
}
/**
 * Extract unlock reason from tags.
 */
function extractUnlockReason(tags) {
    for (const tag of tags) {
        if (tag.includes('unlock-reason:')) {
            const match = /unlock-reason:["']?([^"']+)["']?/.exec(tag);
            return {
                hasUnlockReason: true,
                unlockReason: match?.[1],
            };
        }
    }
    return { hasUnlockReason: false, unlockReason: undefined };
}
/**
 * Compute SHA256 hash of tag-registry.json.
 */
async function computeTaxonomyHash(taxonomyPath) {
    try {
        const content = await fs.readFile(taxonomyPath, 'utf-8');
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        return R.ok(hash.slice(0, 16)); // First 16 chars is enough
    }
    catch (error) {
        return R.err(error instanceof Error ? error : new Error(String(error)));
    }
}
/**
 * Find active session from sessions directory.
 */
async function findActiveSession(sessionsDir, baseDir) {
    try {
        // Check if sessions directory exists
        try {
            await fs.access(sessionsDir);
        }
        catch {
            // No sessions directory, that's fine
            return R.ok(undefined);
        }
        // Find session files
        const sessionFiles = await glob('*.feature', {
            cwd: sessionsDir,
            absolute: true,
        });
        for (const sessionFile of sessionFiles) {
            const session = await parseSessionFile(sessionFile, baseDir);
            if (session?.status === 'active') {
                return R.ok(session);
            }
        }
        return R.ok(undefined);
    }
    catch (error) {
        return R.err(error instanceof Error ? error : new Error(String(error)));
    }
}
/**
 * Parse a session definition file.
 */
async function parseSessionFile(filePath, baseDir) {
    const scanResult = await scanGherkinFiles({
        patterns: [filePath],
        baseDir,
    });
    if (!scanResult.ok || scanResult.value.files.length === 0) {
        return undefined;
    }
    const file = scanResult.value.files[0];
    if (!file)
        return undefined;
    const tags = file.feature.tags;
    // Extract session ID
    const sessionId = extractTagValue(tags, 'session-id');
    if (!sessionId)
        return undefined;
    // Extract session status
    const sessionStatusRaw = extractTagValue(tags, 'session-status');
    const sessionStatus = sessionStatusRaw === 'active' || sessionStatusRaw === 'closed' ? sessionStatusRaw : 'draft';
    // Extract scoped specs (from background table or tags)
    const scopedSpecs = extractScopedSpecs(file.background);
    const excludedSpecs = extractExcludedSpecs(file.background);
    return {
        id: sessionId,
        status: sessionStatus,
        scopedSpecs,
        excludedSpecs,
        sessionFile: filePath,
    };
}
/**
 * Extract a tag value by key.
 */
function extractTagValue(tags, key) {
    for (const tag of tags) {
        const pattern = new RegExp(`${key}:["']?([^"'\\s]+)["']?`);
        const match = tag.match(pattern);
        if (match?.[1]) {
            return match[1];
        }
    }
    return undefined;
}
/**
 * Extract scoped specs from session background.
 * Uses unknown type to handle exactOptionalPropertyTypes compatibility.
 */
function extractScopedSpecs(background) {
    if (background === null || background === undefined || typeof background !== 'object')
        return [];
    const bg = background;
    if (bg.steps === undefined)
        return [];
    const specs = [];
    for (const step of bg.steps) {
        const rows = step.dataTable?.rows;
        if (rows) {
            for (const row of rows) {
                const spec = row['spec'] ?? row['Spec'];
                if (spec) {
                    specs.push(spec);
                }
            }
        }
    }
    return specs;
}
/**
 * Extract excluded specs from session background.
 */
function extractExcludedSpecs(_background) {
    // For now, return empty - can be extended to parse exclusion tables
    return [];
}
// =============================================================================
// Utility Functions
// =============================================================================
/**
 * Get file state from process state.
 */
export function getFileState(state, relativePath) {
    return state.files.get(relativePath);
}
/**
 * Get all files with a specific protection level.
 */
export function getFilesByProtection(state, protection) {
    const files = [];
    for (const file of state.files.values()) {
        if (file.protection === protection) {
            files.push(file);
        }
    }
    return files;
}
/**
 * Check if a file is in the active session scope.
 */
export function isInSessionScope(state, relativePath) {
    if (!state.activeSession) {
        return true; // No session means all files are in scope
    }
    // Check if file is in scoped specs
    for (const spec of state.activeSession.scopedSpecs) {
        if (relativePath.includes(spec)) {
            return true;
        }
    }
    return false;
}
/**
 * Check if a file is explicitly excluded from session.
 */
export function isSessionExcluded(state, relativePath) {
    if (!state.activeSession) {
        return false;
    }
    for (const spec of state.activeSession.excludedSpecs) {
        if (relativePath.includes(spec)) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=derive-state.js.map