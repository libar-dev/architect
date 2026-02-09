/**
 * @libar-docs
 * @libar-docs-lint
 * @libar-docs-pattern DeriveProcessState
 * @libar-docs-status active
 * @libar-docs-implements ProcessGuardLinter
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
import { glob } from 'glob';
import { Result as R } from '../../types/index.js';
import { scanGherkinFiles } from '../../scanner/gherkin-scanner.js';
import { extractDeliverables } from '../../extractor/dual-source-extractor.js';
import { getProtectionLevel } from '../../validation/fsm/index.js';
import { DEFAULT_STATUS, PROCESS_STATUS_VALUES, normalizeStatus, } from '../../taxonomy/index.js';
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
    const sessionsDir = config.sessionsDir ?? path.join(config.baseDir, 'sessions');
    // Derive file states
    const filesResult = await deriveFileStates(config.baseDir, specPatterns);
    if (!filesResult.ok) {
        return filesResult;
    }
    // Find active session
    const sessionResult = await findActiveSession(sessionsDir, config.baseDir);
    const activeSession = sessionResult.ok ? sessionResult.value : undefined;
    // Build ProcessState (handle exactOptionalPropertyTypes)
    const processState = {
        files: filesResult.value,
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
        // Extract deliverables from background (canonical extractor with case-insensitive headers)
        const deliverables = extractDeliverables(file).map((d) => d.name);
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
    return DEFAULT_STATUS;
}
/**
 * Extract unlock reason from tags.
 *
 * Validates that unlock reasons are meaningful:
 * - Minimum 10 characters
 * - Not a placeholder value (test, xxx, bypass, temp, todo, fixme)
 *
 * If the tag exists but the reason is invalid, hasUnlockReason is false
 * so the completed-protection rule will catch it.
 */
function extractUnlockReason(tags) {
    const PLACEHOLDER_VALUES = /^(test|xxx|bypass|temp|todo|fixme)$/i;
    const MIN_LENGTH = 10;
    for (const tag of tags) {
        if (tag.includes('unlock-reason:')) {
            const match = /unlock-reason:["']?([^"']+)["']?/.exec(tag);
            const value = match?.[1]?.trim();
            // Require meaningful reason (10+ chars, not a placeholder)
            if (value && value.length >= MIN_LENGTH && !PLACEHOLDER_VALUES.test(value)) {
                return { hasUnlockReason: true, unlockReason: value };
            }
            // Tag exists but reason is invalid - treat as no unlock reason
            // This allows the completed-protection rule to catch it
        }
    }
    return { hasUnlockReason: false, unlockReason: undefined };
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
 *
 * Uses smart matching based on spec format:
 * - If spec contains path separator: Use path-aware matching
 *   - `specs/auth.feature` matches exactly `specs/auth.feature`
 *   - `specs/auth/` matches `specs/auth/login.feature`
 * - If spec is just a name: Use substring matching
 *   - `auth` matches `specs/auth.feature` or `tests/auth/test.ts`
 */
export function isInSessionScope(state, relativePath) {
    if (!state.activeSession) {
        return true; // No session means all files are in scope
    }
    const normalizedPath = path.normalize(relativePath);
    for (const spec of state.activeSession.scopedSpecs) {
        if (matchesSpec(normalizedPath, spec)) {
            return true;
        }
    }
    return false;
}
/**
 * Check if a file is explicitly excluded from session.
 *
 * Uses smart matching based on spec format:
 * - If spec contains path separator: Use path-aware matching
 *   - `specs/legacy.feature` matches exactly `specs/legacy.feature`
 *   - `specs/legacy/` matches `specs/legacy/old.feature`
 * - If spec is just a name: Use substring matching
 *   - `legacy` matches `specs/phase-legacy.feature`
 */
export function isSessionExcluded(state, relativePath) {
    if (!state.activeSession) {
        return false;
    }
    const normalizedPath = path.normalize(relativePath);
    for (const spec of state.activeSession.excludedSpecs) {
        if (matchesSpec(normalizedPath, spec)) {
            return true;
        }
    }
    return false;
}
/**
 * Match a file path against a spec pattern.
 *
 * Two matching modes:
 * 1. Path-aware: If spec contains path separator, use strict path matching
 *    - Exact match or directory prefix match
 * 2. Substring: If spec is just a name, match anywhere in the path
 *
 * @param normalizedPath - The normalized file path to check
 * @param spec - The spec pattern to match against
 * @returns true if the path matches the spec
 */
function matchesSpec(normalizedPath, spec) {
    const normalizedSpec = path.normalize(spec);
    // If spec contains a path separator, use path-aware matching
    if (spec.includes('/') || spec.includes(path.sep)) {
        return (normalizedPath === normalizedSpec || normalizedPath.startsWith(normalizedSpec + path.sep));
    }
    // Otherwise, use substring matching for simple names
    return normalizedPath.includes(spec);
}
//# sourceMappingURL=derive-state.js.map