/**
 * @architect
 * @architect-pattern CodecUtils
 * @architect-status active
 * @architect-role:codec
 * @architect-bounded-context:validation-schemas
 *
 * ## CodecUtils - Zod-backed JSON Codec Factories
 *
 * Factory utilities for type-safe JSON parse/serialize pipelines built
 * on Zod schemas. Returns `Result` types for explicit error handling
 * instead of throwing on validation failure.
 *
 * ### When to Use
 *
 * - Boundary code: parse untrusted JSON into validated typed data
 * - Persistence: serialize typed records to disk via a single codec
 */
import type { ZodType } from 'zod';

import type { Result } from '../types/index.js';
import { Result as R } from '../types/index.js';
import { formatZodError } from '../utils/errors.js';

/**
 * Failure value returned by codec parse/serialize operations.
 *
 * @architect-shape
 */
export interface CodecError {
  /** Discriminator literal identifying a codec error. */
  type: 'codec-error';
  /** Which operation failed. */
  operation: 'parse' | 'serialize';
  /** Originating source label (e.g. file path), if known. */
  source?: string | undefined;
  /** Human-readable error message. */
  message: string;
  /** Formatted schema validation errors, if the failure was a validation failure. */
  validationErrors?: string[] | undefined;
}

/**
 * Codec that parses JSON strings into validated typed values.
 *
 * @architect-shape
 */
export interface JsonInputCodec<T> {
  /** Parse and validate `content`, returning a `Result` with the typed value or a {@link CodecError}. */
  parse(content: string, source?: string): Result<T, CodecError>;
  /** Parse and validate `content`, returning the typed value or `undefined` on any failure. */
  safeParse(content: string): T | undefined;
}

/**
 * Codec that serializes typed values into validated JSON strings.
 *
 * @architect-shape
 */
export interface JsonOutputCodec<T> {
  /** Validate and serialize `data`, returning a `Result` with the JSON string or a {@link CodecError}. */
  serialize(data: T, source?: string): Result<string, CodecError>;
  /** Validate and serialize `data` with explicit indent/source options. */
  serializeWithOptions(
    data: T,
    options: { indent?: number | undefined; source?: string | undefined },
  ): Result<string, CodecError>;
}

function formatFileReadError(filePath: string, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const code = (error as NodeJS.ErrnoException | undefined)?.code;

  switch (code) {
    case 'ENOENT':
      return `File not found: ${filePath}`;
    case 'EACCES':
    case 'EPERM':
      return `Permission denied: ${filePath}`;
    case 'EISDIR':
      return `Not a file: ${filePath}`;
    default:
      return `Failed to read ${filePath}: ${message}`;
  }
}

/**
 * Build a {@link JsonInputCodec} that parses JSON against the given schema,
 * stripping a leading `$schema` key before validation.
 *
 * @architect-shape
 * @param schema - Zod schema the parsed JSON must satisfy.
 * @returns A codec exposing `parse` (Result-returning) and `safeParse`.
 */
export function createJsonInputCodec<T>(schema: ZodType<T>): JsonInputCodec<T> {
  return {
    parse(content: string, source?: string): Result<T, CodecError> {
      let data: unknown;
      try {
        data = JSON.parse(content);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return R.err({
          type: 'codec-error',
          operation: 'parse',
          source,
          message: source ? `Invalid JSON in ${source}: ${message}` : `Invalid JSON: ${message}`,
        });
      }

      const configData =
        typeof data === 'object' && data !== null && '$schema' in data
          ? (({ $schema: _, ...rest }) => rest)(data)
          : data;

      const parseResult = schema.safeParse(configData);
      if (!parseResult.success) {
        return R.err({
          type: 'codec-error',
          operation: 'parse',
          source,
          message: source ? `Schema validation failed for ${source}` : 'Schema validation failed',
          validationErrors: [formatZodError(parseResult.error)],
        });
      }

      return R.ok(parseResult.data);
    },

    safeParse(content: string): T | undefined {
      const result = this.parse(content);
      return result.ok ? result.value : undefined;
    },
  };
}

/**
 * Build a {@link JsonOutputCodec} that validates a value against the schema
 * before serializing it to JSON.
 *
 * @architect-shape
 * @param schema - Zod schema the value must satisfy before serialization.
 * @param defaultIndent - Indent width used when `serialize` is called without options (defaults to 2).
 * @returns A codec exposing `serialize` and `serializeWithOptions`.
 */
export function createJsonOutputCodec<T>(
  schema: ZodType<T>,
  defaultIndent = 2,
): JsonOutputCodec<T> {
  return {
    serialize(data: T, source?: string): Result<string, CodecError> {
      return this.serializeWithOptions(data, { source, indent: defaultIndent });
    },

    serializeWithOptions(
      data: T,
      options: { indent?: number | undefined; source?: string | undefined },
    ): Result<string, CodecError> {
      const parseResult = schema.safeParse(data);
      if (!parseResult.success) {
        return R.err({
          type: 'codec-error',
          operation: 'serialize',
          source: options.source,
          message: options.source
            ? `Schema validation failed for ${options.source}`
            : 'Schema validation failed',
          validationErrors: [formatZodError(parseResult.error)],
        });
      }

      try {
        return R.ok(JSON.stringify(parseResult.data, null, options.indent ?? defaultIndent));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return R.err({
          type: 'codec-error',
          operation: 'serialize',
          source: options.source,
          message: options.source
            ? `Failed to serialize JSON for ${options.source}: ${message}`
            : `Failed to serialize JSON: ${message}`,
        });
      }
    },
  };
}

/**
 * Build a file loader that reads a file and parses it through the given codec,
 * mapping filesystem failures to a {@link CodecError}.
 *
 * @architect-shape
 * @param codec - Input codec used to parse the file contents.
 * @param readFile - Optional reader override; defaults to `fs/promises.readFile` with UTF-8.
 * @returns An object whose `load` resolves to a `Result` with the typed value or a {@link CodecError}.
 */
export function createFileLoader<T>(
  codec: JsonInputCodec<T>,
  readFile?: (filePath: string) => Promise<string>,
): { load(filePath: string): Promise<Result<T, CodecError>> } {
  return {
    async load(filePath: string): Promise<Result<T, CodecError>> {
      try {
        const content = readFile
          ? await readFile(filePath)
          : await (await import('fs/promises')).readFile(filePath, 'utf-8');
        return codec.parse(content, filePath);
      } catch (error) {
        return R.err({
          type: 'codec-error',
          operation: 'parse',
          source: filePath,
          message: formatFileReadError(filePath, error),
        });
      }
    },
  };
}

/**
 * Render a {@link CodecError} into a multi-line human-readable string,
 * including the source and any validation errors.
 *
 * @architect-shape
 * @param error - The codec error to format.
 * @returns A formatted, newline-joined error report.
 */
export function formatCodecError(error: CodecError): string {
  const lines = [`Codec error (${error.operation}): ${error.message}`];
  if (error.source) {
    lines.push(`Source: ${error.source}`);
  }
  if (error.validationErrors && error.validationErrors.length > 0) {
    lines.push('Validation errors:');
    lines.push(...error.validationErrors);
  }
  return lines.join('\n');
}
