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
 * Success result containing a value
 */
export type Ok<T> = {
    ok: true;
    value: T;
};
/**
 * Error result containing an error
 */
export type Err<E> = {
    ok: false;
    error: E;
};
/**
 * Result type representing either success (Ok) or failure (Err)
 *
 * @libar-docs-shape
 * @libar-docs-include core-types
 * @typeParam T - The success value type
 * @typeParam E - The error type (defaults to Error)
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;
/**
 * Result utilities for creating and inspecting Result values
 */
export declare const Result: {
    /**
     * Create a success result
     */
    ok: <T>(value: T) => Result<T, never>;
    /**
     * Create an error result
     */
    err: <E = Error>(error: E) => Result<never, E>;
    /**
     * Type guard for success results
     */
    isOk: <T, E>(result: Result<T, E>) => result is Ok<T>;
    /**
     * Type guard for error results
     */
    isErr: <T, E>(result: Result<T, E>) => result is Err<E>;
    /**
     * Extract value or throw error.
     * If the error is not an Error instance, it will be wrapped in one
     * to ensure proper stack traces and error handling.
     */
    unwrap: <T, E>(result: Result<T, E>) => T;
    /**
     * Extract value or return default
     */
    unwrapOr: <T, E>(result: Result<T, E>, defaultValue: T) => T;
    /**
     * Transform success value
     */
    map: <T, U, E>(result: Result<T, E>, fn: (value: T) => U) => Result<U, E>;
    /**
     * Transform error value
     */
    mapErr: <T, E, F>(result: Result<T, E>, fn: (error: E) => F) => Result<T, F>;
};
//# sourceMappingURL=result.d.ts.map