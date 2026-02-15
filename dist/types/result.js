/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern ResultMonadTypes
 * @libar-docs-status completed
 * @libar-docs-implements ResultMonad
 * @libar-docs-product-area CoreTypes
 *
 * ## Result Monad - Type Definitions
 *
 * Explicit error handling via discriminated union.
 * Functions return `Result.ok(value)` or `Result.err(error)` instead of throwing.
 */
/**
 * Result utilities for creating and inspecting Result values
 */
export const Result = {
    /**
     * Create a success result
     */
    ok: (value) => ({ ok: true, value }),
    /**
     * Create an error result
     */
    err: (error) => ({ ok: false, error }),
    /**
     * Type guard for success results
     */
    isOk: (result) => result.ok,
    /**
     * Type guard for error results
     */
    isErr: (result) => !result.ok,
    /**
     * Extract value or throw error.
     * If the error is not an Error instance, it will be wrapped in one
     * to ensure proper stack traces and error handling.
     */
    unwrap: (result) => {
        if (result.ok) {
            return result.value;
        }
        // Ensure we always throw an Error instance for proper stack traces
        if (result.error instanceof Error) {
            throw result.error;
        }
        // Wrap non-Error objects to preserve information and provide stack trace
        const errorMessage = typeof result.error === 'object' && result.error !== null
            ? JSON.stringify(result.error)
            : String(result.error);
        throw new Error(errorMessage);
    },
    /**
     * Extract value or return default
     */
    unwrapOr: (result, defaultValue) => result.ok ? result.value : defaultValue,
    /**
     * Transform success value
     */
    map: (result, fn) => {
        if (result.ok) {
            return { ok: true, value: fn(result.value) };
        }
        return result;
    },
    /**
     * Transform error value
     */
    mapErr: (result, fn) => {
        if (result.ok) {
            return result;
        }
        return { ok: false, error: fn(result.error) };
    },
};
//# sourceMappingURL=result.js.map