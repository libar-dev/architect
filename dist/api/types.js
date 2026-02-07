/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern ProcessStateTypes
 * @libar-docs-status active
 * @libar-docs-depends-on:MasterDataset
 *
 * ## Process State API Types
 *
 * Type definitions for the ProcessStateAPI query interface.
 * Designed for programmatic access by Claude Code and other tools.
 *
 * ### When to Use
 *
 * - Import types when working with ProcessStateAPI responses
 * - Use QueryResult<T> for typed response handling
 */
// =============================================================================
// Helper Type for Creating Responses
// =============================================================================
/**
 * Create a success response
 */
export function createSuccess(data, patternCount) {
    return {
        success: true,
        data,
        metadata: {
            timestamp: new Date().toISOString(),
            patternCount,
        },
    };
}
/**
 * Create an error response
 */
export function createError(code, message) {
    return {
        success: false,
        error: message,
        code,
    };
}
/**
 * Structured error for API and CLI domain errors.
 * Caught at the CLI boundary and converted to QueryError envelope.
 */
export class QueryApiError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = 'QueryApiError';
        this.code = code;
    }
}
//# sourceMappingURL=types.js.map