/**
 * Process API CLI Shared Test State and Fixture Builders
 *
 * Extracted from pattern-graph-cli.steps.ts to be shared across
 * the split test files (core, subcommands, modifiers-rules).
 *
 * @architect
 */

import { writeTempFile, createTsFileWithDirective, type TempDirContext } from './file-system.js';
import { runCommand, type CLIResult } from './cli-runner.js';

// =============================================================================
// Type Definitions
// =============================================================================

export interface CLITestState {
  tempContext: TempDirContext | null;
  result: CLIResult | null;
}

// =============================================================================
// State Management
// =============================================================================

export function initState(): CLITestState {
  return {
    tempContext: null,
    result: null,
  };
}

// =============================================================================
// State Accessors
// =============================================================================

export function getState(state: CLITestState | null): CLITestState {
  if (!state) throw new Error('State not initialized');
  return state;
}

export function getTempDir(state: CLITestState | null): string {
  const s = getState(state);
  if (!s.tempContext) throw new Error('Temp context not initialized');
  return s.tempContext.tempDir;
}

export function getResult(state: CLITestState | null): CLIResult {
  const s = getState(state);
  if (!s.result) throw new Error('CLI result not available - did you run a command?');
  return s.result;
}

export async function runCLICommand(
  state: CLITestState | null,
  commandString: string,
  options: { timeout?: number } = {}
): Promise<void> {
  const s = getState(state);
  s.result = await runCommand(commandString, {
    cwd: getTempDir(state),
    ...(options.timeout !== undefined ? { timeout: options.timeout } : {}),
  });
}

// =============================================================================
// Fixture Content Builders
// =============================================================================

export function createPatternFiles(): Array<{ path: string; content: string }> {
  return [
    {
      path: 'src/completed.ts',
      content: createTsFileWithDirective({
        patternName: 'CompletedPattern',
        status: 'completed',
      }),
    },
    {
      path: 'src/active.ts',
      content: createTsFileWithDirective({
        patternName: 'ActivePattern',
        status: 'active',
      }),
    },
    {
      path: 'src/roadmap.ts',
      content: createTsFileWithDirective({
        patternName: 'RoadmapPattern',
        status: 'roadmap',
      }),
    },
  ];
}

export function createFeatureFilesWithRules(): Array<{ path: string; content: string }> {
  return [
    {
      path: 'specs/validation-rules.feature',
      content: [
        '@architect',
        '@architect-pattern:ValidationRulesTest',
        '@architect-status:completed',
        '@architect-unlock-reason:Split-from-original',
        '@architect-product-area:Validation',
        '@architect-phase:10',
        'Feature: Validation Rules Test',
        '',
        '  Rule: Completed files require unlock',
        '',
        '    **Invariant:** Completed files need unlock-reason.',
        '',
        '    **Rationale:** Prevents accidental regression.',
        '',
        '    **Verified by:** Unlock test',
        '',
        '    @acceptance-criteria',
        '    Scenario: Unlock test',
        '      Given a completed file',
        '      Then it needs unlock',
        '',
        '  Rule: Status transitions follow FSM',
        '',
        '    **Invariant:** Only valid FSM transitions allowed.',
        '',
        '    @acceptance-criteria',
        '    Scenario: Valid transition',
        '      Given a roadmap pattern',
        '      Then it can transition to active',
      ].join('\n'),
    },
    {
      path: 'specs/core-utils.feature',
      content: [
        '@architect',
        '@architect-pattern:CoreUtilsTest',
        '@architect-status:completed',
        '@architect-product-area:CoreTypes',
        '@architect-phase:5',
        'Feature: Core Utils Test',
        '',
        '  Rule: Slugify produces URL-safe slugs',
        '',
        '    **Invariant:** Output must be lowercase alphanumeric with hyphens.',
        '',
        '    @acceptance-criteria',
        '    Scenario: Slug generation',
        '      Given text input',
        '      Then slug is URL-safe',
        '',
        '  Rule: Edge cases handled',
        '',
        '    No invariant here, just a plain rule.',
        '',
        '    @acceptance-criteria',
        '    Scenario: Edge case',
        '      Given empty input',
        '      Then empty slug returned',
      ].join('\n'),
    },
  ];
}

export function createArchPatternFiles(): Array<{ path: string; content: string }> {
  return [
    {
      path: 'src/scanner.ts',
      content: createTsFileWithDirective({
        patternName: 'TestScanner',
        status: 'completed',
        archRole: 'infrastructure',
        archContext: 'testctx',
        archLayer: 'infrastructure',
      }),
    },
    {
      path: 'src/codec.ts',
      content: createTsFileWithDirective({
        patternName: 'TestCodec',
        status: 'completed',
        archRole: 'projection',
        archContext: 'testctx',
        archLayer: 'application',
      }),
    },
  ];
}

export function createDanglingRefFiles(): Array<{ path: string; content: string }> {
  return [
    {
      path: 'src/consumer.ts',
      content: createTsFileWithDirective({
        patternName: 'ConsumerPattern',
        status: 'active',
        uses: ['NonExistentDep'],
      }),
    },
  ];
}

export function createArchPatternFilesWithDeps(): Array<{ path: string; content: string }> {
  return [
    {
      path: 'src/scanner-service.ts',
      content: createTsFileWithDirective({
        patternName: 'ScannerService',
        status: 'completed',
        archRole: 'service',
        archContext: 'scanner',
        archLayer: 'application',
        uses: ['FileCache'],
      }),
    },
    {
      path: 'src/file-cache.ts',
      content: createTsFileWithDirective({
        patternName: 'FileCache',
        status: 'completed',
        archRole: 'infrastructure',
        archContext: 'scanner',
        archLayer: 'infrastructure',
        usedBy: ['ScannerService'],
      }),
    },
  ];
}

// =============================================================================
// File Writers
// =============================================================================

export async function writePatternFiles(state: CLITestState | null): Promise<void> {
  const dir = getTempDir(state);
  for (const file of createPatternFiles()) {
    await writeTempFile(dir, file.path, file.content);
  }
}

export async function writeFeatureFilesWithRules(state: CLITestState | null): Promise<void> {
  const dir = getTempDir(state);
  for (const file of createFeatureFilesWithRules()) {
    await writeTempFile(dir, file.path, file.content);
  }
}

export async function writeArchPatternFiles(state: CLITestState | null): Promise<void> {
  const dir = getTempDir(state);
  for (const file of createArchPatternFiles()) {
    await writeTempFile(dir, file.path, file.content);
  }
}

export async function writeDanglingRefFiles(state: CLITestState | null): Promise<void> {
  const dir = getTempDir(state);
  for (const file of createDanglingRefFiles()) {
    await writeTempFile(dir, file.path, file.content);
  }
}

export async function writeArchPatternFilesWithDeps(state: CLITestState | null): Promise<void> {
  const dir = getTempDir(state);
  for (const file of createArchPatternFilesWithDeps()) {
    await writeTempFile(dir, file.path, file.content);
  }
}

export async function writeTwoContextFiles(state: CLITestState | null): Promise<void> {
  const dir = getTempDir(state);
  const files = [
    {
      path: 'src/scanner-svc.ts',
      content: createTsFileWithDirective({
        patternName: 'ScannerSvc',
        status: 'completed',
        archRole: 'service',
        archContext: 'scanner',
        archLayer: 'application',
        uses: ['SharedUtil'],
      }),
    },
    {
      path: 'src/codec-svc.ts',
      content: createTsFileWithDirective({
        patternName: 'CodecSvc',
        status: 'completed',
        archRole: 'projection',
        archContext: 'codec',
        archLayer: 'application',
        uses: ['SharedUtil'],
      }),
    },
    {
      path: 'src/shared-util.ts',
      content: createTsFileWithDirective({
        patternName: 'SharedUtil',
        status: 'completed',
        archRole: 'infrastructure',
        archContext: 'shared',
        archLayer: 'infrastructure',
        usedBy: ['ScannerSvc', 'CodecSvc'],
      }),
    },
  ];
  for (const file of files) {
    await writeTempFile(dir, file.path, file.content);
  }
}

export async function writeMixedAnnotationFiles(state: CLITestState | null): Promise<void> {
  const dir = getTempDir(state);
  const files = [
    ...createPatternFiles(),
    {
      path: 'src/unannotated.ts',
      content: '/** No @architect marker */\nexport const x = 1;\n',
    },
  ];
  for (const file of files) {
    await writeTempFile(dir, file.path, file.content);
  }
}

// =============================================================================
// Re-exports
// =============================================================================

export { createTempDir } from './file-system.js';
export type { CLIResult } from './cli-runner.js';
