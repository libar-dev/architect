import * as fs from 'fs/promises';

import type {
  DirectiveValidationError,
  DocDirective,
  ExportInfo,
  FileParseError,
  Result,
  ScannerConfig,
} from '../types/index.js';
import { Result as R, createFileParseError } from '../types/index.js';
import type { TagRegistry } from '../validation-schemas/tag-registry.js';
import { parseFileDirectives } from './ast-parser.js';
import { findFilesToScan, hasDocDirectives, hasFileOptIn } from './pattern-scanner.js';

export interface ScannedFile {
  readonly filePath: string;
  readonly directives: readonly {
    readonly directive: DocDirective;
    readonly code: string;
    readonly exports: readonly ExportInfo[];
  }[];
}

export interface FileError {
  readonly file: string;
  readonly error: FileParseError;
}

export interface SkippedDirective {
  readonly file: string;
  readonly error: DirectiveValidationError;
}

export interface ScanResults {
  readonly files: readonly ScannedFile[];
  readonly errors: readonly FileError[];
  readonly skippedDirectives: readonly SkippedDirective[];
}

export async function scanPatterns(
  config: ScannerConfig,
  registry?: TagRegistry,
): Promise<Result<ScanResults, never>> {
  const files = await findFilesToScan(config);

  const scanned: ScannedFile[] = [];
  const errors: FileError[] = [];
  const skippedDirectives: SkippedDirective[] = [];

  for (const filePath of files) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      if (!hasFileOptIn(content, registry)) continue;
      if (!hasDocDirectives(content, registry)) continue;

      const parseResult = parseFileDirectives(content, filePath, registry);
      if (R.isErr(parseResult)) {
        errors.push({ file: filePath, error: parseResult.error });
        continue;
      }

      const { directives, skippedDirectives: fileSkipped } = parseResult.value;
      for (const skipped of fileSkipped) {
        skippedDirectives.push({ file: filePath, error: skipped });
      }

      if (directives.length === 0) continue;
      scanned.push({ filePath, directives });
    } catch (error) {
      errors.push({
        file: filePath,
        error: createFileParseError(
          filePath,
          error instanceof Error ? error.message : String(error),
          undefined,
          error,
        ),
      });
    }
  }

  return R.ok({ files: scanned, errors, skippedDirectives });
}

export { findFilesToScan, hasDocDirectives, hasFileOptIn } from './pattern-scanner.js';
export { parseFileDirectives, type ParseDirectivesResult } from './ast-parser.js';
export {
  findFeatureFiles,
  scanGherkinFiles,
  parseFeatureFile,
  extractPatternTags,
  type GherkinScannerConfig,
  type ScannedGherkinFile,
  type GherkinFileError,
  type GherkinScanResults,
  type GherkinBackground,
  type GherkinRule,
  type GherkinStep,
  type GherkinDataTable,
  type GherkinDataTableRow,
} from './gherkin-scanner.js';
