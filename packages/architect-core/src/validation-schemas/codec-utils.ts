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

export interface CodecError {
  type: 'codec-error';
  operation: 'parse' | 'serialize';
  source?: string | undefined;
  message: string;
  validationErrors?: string[] | undefined;
}

export interface JsonInputCodec<T> {
  parse(content: string, source?: string): Result<T, CodecError>;
  safeParse(content: string): T | undefined;
}

export interface JsonOutputCodec<T> {
  serialize(data: T, source?: string): Result<string, CodecError>;
  serializeWithOptions(
    data: T,
    options: { indent?: number | undefined; source?: string | undefined }
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
          ? (({ $schema: _, ...rest }) => rest)(data as Record<string, unknown>)
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

export function createJsonOutputCodec<T>(
  schema: ZodType<T>,
  defaultIndent = 2
): JsonOutputCodec<T> {
  return {
    serialize(data: T, source?: string): Result<string, CodecError> {
      return this.serializeWithOptions(data, { source, indent: defaultIndent });
    },

    serializeWithOptions(
      data: T,
      options: { indent?: number | undefined; source?: string | undefined }
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

export function createFileLoader<T>(
  codec: JsonInputCodec<T>,
  readFile?: (filePath: string) => Promise<string>
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
