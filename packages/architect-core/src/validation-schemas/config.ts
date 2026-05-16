import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

import type { RegistryFilePath } from '../types/branded.js';
import { asRegistryFilePath } from '../types/branded.js';

function safeRealpathSync(filePath: string): string {
  try {
    return fs.realpathSync(filePath);
  } catch {
    return path.resolve(filePath);
  }
}

const GlobPatternSchema = z
  .string()
  .min(1, 'Glob pattern cannot be empty')
  .refine((pattern) => !pattern.includes('..'), {
    message: 'Glob patterns cannot contain parent directory traversal (..)',
  });

const BaseDirSchema = z
  .string()
  .min(1, 'Base directory cannot be empty')
  .transform((dir) => path.resolve(dir));

function createOutputDirSchema(baseDir: string): z.ZodType<string> {
  return z
    .string()
    .min(1, 'Output directory cannot be empty')
    .transform((dir) => path.normalize(path.resolve(dir)))
    .refine(
      (dir) => {
        const resolvedBase = safeRealpathSync(baseDir);
        const resolvedDir = safeRealpathSync(dir);
        if (dir.includes('..')) {
          return false;
        }
        return resolvedDir.startsWith(resolvedBase) || !path.isAbsolute(dir);
      },
      { message: 'Output directory must be within project (no parent traversal)' }
    );
}

const RegistryFilePathSchema = z
  .string()
  .min(1, 'Registry path cannot be empty')
  .refine((value) => value.endsWith('.json'), {
    message: 'Registry file must be a JSON file (.json)',
  })
  .transform((value) => asRegistryFilePath(path.normalize(value)));

export const ScannerConfigSchema = z.strictObject({
  patterns: z.array(GlobPatternSchema).min(1, 'At least one glob pattern required').readonly(),
  exclude: z.array(GlobPatternSchema).readonly().optional(),
  baseDir: BaseDirSchema,
});

export type ScannerConfig = z.output<typeof ScannerConfigSchema>;

export interface GeneratorConfig {
  outputDir: string;
  registryPath: RegistryFilePath;
  overwrite: boolean;
  readmeOnly: boolean;
}

export function createGeneratorConfigSchema(baseDir: string): z.ZodType<GeneratorConfig> {
  return z.strictObject({
    outputDir: createOutputDirSchema(baseDir),
    registryPath: RegistryFilePathSchema,
    overwrite: z.boolean().default(false),
    readmeOnly: z.boolean().default(false),
  });
}

export function isScannerConfig(value: unknown): value is ScannerConfig {
  return ScannerConfigSchema.safeParse(value).success;
}

export function isGeneratorConfig(
  value: unknown,
  baseDir = process.cwd()
): value is GeneratorConfig {
  return createGeneratorConfigSchema(baseDir).safeParse(value).success;
}
