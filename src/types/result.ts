/**
 * Success result containing a value
 */
export type Ok<T> = { ok: true; value: T };

/**
 * Error result containing an error
 */
export type Err<E> = { ok: false; error: E };

/**
 * Result type representing either success (Ok) or failure (Err)
 *
 * @typeParam T - The success value type
 * @typeParam E - The error type (defaults to Error)
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

/**
 * Result utilities for creating and inspecting Result values
 */
export const Result = {
  /**
   * Create a success result
   */
  ok: <T>(value: T): Result<T, never> => ({ ok: true, value }),

  /**
   * Create an error result
   */
  err: <E = Error>(error: E): Result<never, E> => ({ ok: false, error }),

  /**
   * Type guard for success results
   */
  isOk: <T, E>(result: Result<T, E>): result is Ok<T> => result.ok,

  /**
   * Type guard for error results
   */
  isErr: <T, E>(result: Result<T, E>): result is Err<E> => !result.ok,

  /**
   * Extract value or throw error.
   * If the error is not an Error instance, it will be wrapped in one
   * to ensure proper stack traces and error handling.
   */
  unwrap: <T, E>(result: Result<T, E>): T => {
    if (result.ok) {
      return result.value;
    }
    // Ensure we always throw an Error instance for proper stack traces
    if (result.error instanceof Error) {
      throw result.error;
    }
    // Wrap non-Error objects to preserve information and provide stack trace
    const errorMessage =
      typeof result.error === 'object' && result.error !== null
        ? JSON.stringify(result.error)
        : String(result.error);
    throw new Error(errorMessage);
  },

  /**
   * Extract value or return default
   */
  unwrapOr: <T, E>(result: Result<T, E>, defaultValue: T): T =>
    result.ok ? result.value : defaultValue,

  /**
   * Transform success value
   */
  map: <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
    if (result.ok) {
      return { ok: true, value: fn(result.value) };
    }
    return result;
  },

  /**
   * Transform error value
   */
  mapErr: <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
    if (result.ok) {
      return result;
    }
    return { ok: false, error: fn(result.error) };
  },
};
