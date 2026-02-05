#!/usr/bin/env npx tsx

/**
 * Auto-generate documentation from annotated source code.
 *
 * This script generates documentation using the doc-from-decision generator
 * which extracts content from:
 * - TypeScript files with @libar-docs-extract-shapes annotations
 * - Gherkin feature files with source mapping tables
 *
 * Usage:
 *   npx tsx scripts/generate-docs-auto.ts [feature-pattern]
 *
 * Examples:
 *   npx tsx scripts/generate-docs-auto.ts                    # All feature files in specs/docs/
 *   npx tsx scripts/generate-docs-auto.ts process-guard      # Only process-guard-reference.feature
 */

import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '..');

// Configuration
const CONFIG = {
  // TypeScript source files for shape extraction
  typescriptSources: [
    'src/lint/process-guard/**/*.ts',
    'src/lint/rules.ts',
    'src/lint/engine.ts',
    'src/validation/fsm/**/*.ts',
    'src/validation/anti-patterns.ts',
    'src/validation/dod-validator.ts',
    'src/validation/types.ts',
    'src/cli/lint-process.ts',
    'src/cli/lint-patterns.ts',
    'src/cli/validate-patterns.ts',
    'src/taxonomy/**/*.ts',
    'src/config/**/*.ts',
    // Architecture documentation sources
    'src/validation-schemas/master-dataset.ts',
    'src/validation-schemas/extracted-pattern.ts',
    'src/generators/pipeline/transform-dataset.ts',
    'src/generators/types.ts',
    'src/generators/orchestrator.ts',
    'src/renderable/schema.ts',
    'src/renderable/render.ts',
    'src/renderable/codecs/types/base.ts',
    'src/scanner/pattern-scanner.ts',
    'src/scanner/gherkin-scanner.ts',
    'src/extractor/doc-extractor.ts',
  ],

  // Feature file patterns for decision documents
  featureFiles: 'specs/docs/*.feature',

  // Output directory (separate from manually maintained docs)
  outputDir: 'docs-generated',

  // Force overwrite existing files
  force: true,
};

function main(): void {
  const filterPattern = process.argv[2];

  console.log('='.repeat(60));
  console.log('Auto-Generated Documentation');
  console.log('='.repeat(60));
  console.log();
  console.log('Configuration:');
  console.log(`  TypeScript sources: ${CONFIG.typescriptSources.join(', ')}`);
  console.log(`  Feature files: ${CONFIG.featureFiles}`);
  console.log(`  Output: ${CONFIG.outputDir}`);
  if (filterPattern) {
    console.log(`  Filter: *${filterPattern}*`);
  }
  console.log();

  // Build the generate-docs command
  const inputFlags = CONFIG.typescriptSources.map((src) => `-i '${src}'`).join(' ');

  const featurePattern = filterPattern
    ? `specs/docs/*${filterPattern}*.feature`
    : CONFIG.featureFiles;

  const cmd = [
    'npx tsx src/cli/generate-docs.ts',
    '-g doc-from-decision',
    inputFlags,
    `--features '${featurePattern}'`,
    `-o ${CONFIG.outputDir}`,
    CONFIG.force ? '-f' : '',
  ]
    .filter(Boolean)
    .join(' ');

  console.log('Running:');
  console.log(`  ${cmd}`);
  console.log();

  try {
    execSync(cmd, {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      shell: true,
    });

    console.log();
    console.log('='.repeat(60));
    console.log('Generation complete!');
    console.log('='.repeat(60));
    console.log();
    console.log('Output files:');
    console.log(`  Detailed: ${CONFIG.outputDir}/docs/`);
    console.log(`  Compact:  ${CONFIG.outputDir}/_claude-md/`);
    console.log();
  } catch (_error) {
    console.error('Generation failed!');
    process.exit(1);
  }
}

main();
