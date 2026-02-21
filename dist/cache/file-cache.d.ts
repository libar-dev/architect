/**
 * @libar-docs
 * @libar-docs-pattern FileCache
 * @libar-docs-status active
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
 * File content cache interface
 */
export interface FileCache {
    /** Get cached content by absolute path */
    get(path: string): string | undefined;
    /** Store content in cache */
    set(path: string, content: string): void;
    /** Check if path is cached */
    has(path: string): boolean;
    /** Clear all cached content */
    clear(): void;
    /** Get cache statistics */
    getStats(): FileCacheStats;
}
/**
 * Cache statistics for performance analysis
 */
export interface FileCacheStats {
    /** Number of cache hits */
    hits: number;
    /** Number of cache misses */
    misses: number;
    /** Number of entries currently in cache */
    size: number;
    /** Hit rate as percentage (0-100) */
    hitRate: number;
}
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
export declare function createFileCache(): FileCache;
//# sourceMappingURL=file-cache.d.ts.map