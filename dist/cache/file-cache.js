/**
 * @libar-docs
 * @libar-docs-pattern FileCache
 * @libar-docs-status active
 * @libar-docs-phase 27
 * @libar-docs-arch-role infrastructure
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer infrastructure
 *
 * ## File Cache - Request-Scoped Content Caching
 *
 * Simple Map-based cache for file contents during a single generation run.
 * Avoids repeated disk reads for files accessed multiple times during
 * extraction and deduplication phases.
 *
 * ### Design Rationale
 *
 * - **Request-scoped**: Created fresh per orchestrator run, naturally cleared when done
 * - **No eviction needed**: Generation runs are bounded in duration and file count
 * - **Thread-safe**: Single-threaded Node.js, no locking required
 * - **Stats tracking**: Optional hit/miss tracking for performance analysis
 */
/**
 * Create a new file content cache
 *
 * @returns Fresh FileCache instance
 *
 * @example
 * ```typescript
 * const cache = createFileCache();
 *
 * // First access reads from disk
 * const content = await readFile(path);
 * cache.set(path, content);
 *
 * // Subsequent access uses cache
 * if (cache.has(path)) {
 *   return cache.get(path);
 * }
 * ```
 */
export function createFileCache() {
    const store = new Map();
    let hits = 0;
    let misses = 0;
    return {
        get(path) {
            const content = store.get(path);
            if (content !== undefined) {
                hits++;
            }
            else {
                misses++;
            }
            return content;
        },
        set(path, content) {
            store.set(path, content);
        },
        has(path) {
            return store.has(path);
        },
        clear() {
            store.clear();
            hits = 0;
            misses = 0;
        },
        getStats() {
            const total = hits + misses;
            return {
                hits,
                misses,
                size: store.size,
                hitRate: total > 0 ? (hits / total) * 100 : 0,
            };
        },
    };
}
//# sourceMappingURL=file-cache.js.map