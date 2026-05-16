/**
 * @architect
 * @architect-pattern GherkinScanner
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:scanner
 *
 * ## GherkinScanner - Feature File Discovery
 *
 * Globs and reads `.feature` files matching the configured patterns,
 * surfacing them as `ScannedFile` records for the extractor pipeline.
 *
 * ### When to Use
 *
 * - Build pipeline: discover all `.feature` inputs to ingest
 * - Validation: enumerate features for cross-checks
 */
import * as fs from 'fs/promises';
import { glob } from 'glob';

import type { Result } from '../types/index.js';
import { Result as R } from '../types/index.js';
import type {
  GherkinBackground,
  GherkinDataTable,
  GherkinDataTableRow,
  GherkinFileError,
  GherkinRule,
  GherkinScanResults,
  GherkinStep,
  ScannedGherkinFile,
} from '../validation-schemas/feature.js';
import {
  parseFeatureFile,
  extractPatternTags,
  recoverPatternNameFromFeatureText,
} from './gherkin-ast-parser.js';

export interface GherkinScannerConfig {
  readonly patterns: string | readonly string[];
  readonly baseDir?: string;
  readonly exclude?: readonly string[];
}

export async function findFeatureFiles(config: GherkinScannerConfig): Promise<readonly string[]> {
  const defaultExclude = ['node_modules/**', 'dist/**'];
  const excludePatterns = config.exclude ? [...defaultExclude, ...config.exclude] : defaultExclude;
  const patterns = Array.isArray(config.patterns) ? config.patterns : [config.patterns];

  const files = await glob(patterns, {
    cwd: config.baseDir ?? process.cwd(),
    ignore: excludePatterns,
    absolute: true,
  });

  files.sort();
  return files.filter((file) => file.endsWith('.feature') || file.endsWith('.feature.md'));
}

export async function scanGherkinFiles(
  config: GherkinScannerConfig
): Promise<Result<GherkinScanResults, never>> {
  const files = await findFeatureFiles(config);
  const results = await Promise.all(files.map((filePath) => scanGherkinFile(filePath)));
  const scanned = results.flatMap((result) => (result.scanned ? [result.scanned] : []));
  const errors = results.flatMap((result) => (result.error ? [result.error] : []));

  return R.ok({ files: scanned, errors });
}

async function scanGherkinFile(
  filePath: string
): Promise<{ scanned?: ScannedGherkinFile; error?: GherkinFileError }> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const parseResult = parseFeatureFile(content, filePath);

    if (R.isErr(parseResult)) {
      const patternName = recoverPatternNameFromFeatureText(content);
      return {
        error: {
          ...parseResult.error,
          ...(patternName !== undefined ? { patternName } : {}),
        },
      };
    }

    const { feature, background, rules, scenarios } = parseResult.value;
    return {
      scanned: {
        filePath,
        feature,
        ...(background && { background }),
        ...(rules && rules.length > 0 && { rules }),
        scenarios,
      },
    };
  } catch (error) {
    return {
      error: {
        file: filePath,
        error: {
          message: error instanceof Error ? error.message : String(error),
        },
      },
    };
  }
}

export { parseFeatureFile, extractPatternTags, recoverPatternNameFromFeatureText };
export type {
  GherkinBackground,
  GherkinDataTable,
  GherkinDataTableRow,
  GherkinFileError,
  GherkinRule,
  GherkinScanResults,
  GherkinStep,
  ScannedGherkinFile,
};
