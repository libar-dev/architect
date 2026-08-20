import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeatureFromText } from '@amiceli/vitest-cucumber';
import { ProjectionError } from '@libar-dev/architect-projection';
import { expect } from 'vitest';

import { invokeTool, type ToolResult } from '../../src/tool-registry.js';
import { createTestSessionManager, TEST_PATTERN_NAME } from '../support/session-fixtures.js';
import type { PipelineSessionManager } from '../../src/pipeline-session.js';

const feature = loadFeatureFromText(
  readFileSync('tests/features/mcp-pipeline-session-no-facade.feature', 'utf8'),
);

const FACADE_TYPE = ['PatternGraph', 'API'].join('');
const FACADE_FACTORY = ['createPatternGraph', 'API'].join('');
const UNKNOWN_HANDOFF_PATTERN = 'GhostPatternThatDoesNotExist';
const COVERAGE_ROOT_KEYS = [
  'annotatedFiles',
  'coveragePercentage',
  'gapsByTag',
  'kind',
  'totalSourceFiles',
  'unannotatedFiles',
] as const;
const DEPENDENCY_CONTEXT_ROOT_KEYS = [
  'downstream',
  'focal',
  'kind',
  'options',
  'summary',
  'upstream',
] as const;
const DEPENDENCY_SUMMARY_KEYS = [
  'downstreamDirect',
  'downstreamTransitive',
  'upstreamDirect',
  'upstreamTransitive',
] as const;
const HANDOFF_ROOT_KEYS = [
  'blockers',
  'completed',
  'discovered',
  'filesModified',
  'inProgress',
  'kind',
  'nextSession',
  'pattern',
  'sessionType',
  'status',
] as const;
const BUNDLE_KEYS = ['children', 'root'] as const;

interface LookupState {
  sessionManager: PipelineSessionManager;
  result: ToolResult | null;
  caughtError: unknown;
}

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

let state: LookupState | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sortedKeys(value: Record<string, unknown>): readonly string[] {
  return Object.keys(value).sort();
}

function requireRoot(output: unknown): Record<string, unknown> {
  if (!isRecord(output) || !isRecord(output['root'])) {
    throw new Error('Tool output root is unavailable');
  }
  return output['root'];
}

function listTypeScriptFiles(dir: string): readonly string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listTypeScriptFiles(fullPath));
      continue;
    }
    if (entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function runTool(
  name: 'architect_coverage' | 'architect_dep_tree' | 'architect_handoff',
  args: unknown,
): Promise<void> {
  if (state === null) {
    throw new Error('Test session is unavailable');
  }
  state.result = null;
  state.caughtError = null;
  try {
    state.result = await invokeTool(state.sessionManager, name, args);
  } catch (error) {
    state.caughtError = error;
  }
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a test session manager seeded with a rich pattern graph', () => {
      state = {
        sessionManager: createTestSessionManager(),
        result: null,
        caughtError: null,
      };
    });
  });

  Rule('PipelineSession exposes no query facade', ({ RuleScenario }) => {
    RuleScenario('PipelineSession has no api property', ({ Then }) => {
      Then('the pipeline session has no api property', () => {
        if (state === null) {
          throw new Error('Test session is unavailable');
        }
        const session = state.sessionManager.getSession();
        expect(Object.hasOwn(session, 'api')).toBe(false);
        expect('api' in session).toBe(false);
      });
    });

    RuleScenario('MCP source and tests do not import or construct the query facade', ({ Then }) => {
      Then('MCP source and tests do not import or construct the query facade', () => {
        const hits: string[] = [];
        for (const file of [
          ...listTypeScriptFiles(path.join(packageRoot, 'src')),
          ...listTypeScriptFiles(path.join(packageRoot, 'tests')),
        ]) {
          const source = readFileSync(file, 'utf8');
          if (source.includes(FACADE_TYPE) || source.includes(FACADE_FACTORY)) {
            hits.push(path.relative(packageRoot, file));
          }
        }
        expect(hits).toEqual([]);
      });
    });
  });

  Rule('Coverage, dependency-tree, and handoff payloads stay frozen', ({ RuleScenario }) => {
    RuleScenario(
      'architect_coverage keeps the annotation coverage payload keys',
      ({ When, Then }) => {
        When('I invoke the "architect_coverage" tool with {}', async () => {
          await runTool('architect_coverage', {});
        });
        Then('the coverage payload includes coveragePercentage and the frozen root keys', () => {
          expect(state?.caughtError).toBeNull();
          const parsed: unknown = JSON.parse(state?.result?.text ?? '');
          expect(isRecord(parsed)).toBe(true);
          if (!isRecord(parsed)) {
            return;
          }
          expect(sortedKeys(parsed)).toEqual([...BUNDLE_KEYS]);
          const root = requireRoot(state?.result?.output);
          expect(root['kind']).toBe('AnnotationCoverage');
          expect(typeof root['coveragePercentage']).toBe('number');
          expect(sortedKeys(root)).toEqual([...COVERAGE_ROOT_KEYS]);
        });
      },
    );

    RuleScenario(
      'architect_dep_tree keeps the dependency context payload keys',
      ({ When, Then }) => {
        When(
          'I invoke the "architect_dep_tree" tool with a name arg targeting the seeded pattern',
          async () => {
            await runTool('architect_dep_tree', { name: TEST_PATTERN_NAME });
          },
        );
        Then('the dependency-tree payload includes the frozen DependencyContext keys', () => {
          expect(state?.caughtError).toBeNull();
          expect((state?.result?.text.length ?? 0) > 0).toBe(true);
          const output = state?.result?.output;
          expect(isRecord(output)).toBe(true);
          if (!isRecord(output)) {
            return;
          }
          expect(sortedKeys(output)).toEqual([...BUNDLE_KEYS]);
          const root = requireRoot(output);
          expect(root['kind']).toBe('DependencyContext');
          expect(root['focal']).toBe(TEST_PATTERN_NAME);
          expect(sortedKeys(root)).toEqual([...DEPENDENCY_CONTEXT_ROOT_KEYS]);
          expect(isRecord(root['summary'])).toBe(true);
          if (isRecord(root['summary'])) {
            expect(sortedKeys(root['summary'])).toEqual([...DEPENDENCY_SUMMARY_KEYS]);
          }
        });
      },
    );

    RuleScenario('architect_handoff keeps the handoff record payload keys', ({ When, Then }) => {
      When(
        'I invoke the "architect_handoff" tool with a name arg targeting the seeded pattern',
        async () => {
          await runTool('architect_handoff', { name: TEST_PATTERN_NAME });
        },
      );
      Then('the handoff payload includes the frozen HandoffRecord keys', () => {
        expect(state?.caughtError).toBeNull();
        expect((state?.result?.text.length ?? 0) > 0).toBe(true);
        const output = state?.result?.output;
        expect(isRecord(output)).toBe(true);
        if (!isRecord(output)) {
          return;
        }
        expect(sortedKeys(output)).toEqual([...BUNDLE_KEYS]);
        const root = requireRoot(output);
        expect(root['kind']).toBe('HandoffRecord');
        expect(root['pattern']).toBe(TEST_PATTERN_NAME);
        expect(root['sessionType']).toBe('implement');
        expect(root['status']).toBe('active');
        expect(sortedKeys(root)).toEqual([...HANDOFF_ROOT_KEYS]);
      });
    });

    RuleScenario(
      'architect_handoff on an unknown pattern follows the existing not-found path',
      ({ When, Then }) => {
        When('I invoke the "architect_handoff" tool with an unknown pattern name', async () => {
          await runTool('architect_handoff', { name: UNKNOWN_HANDOFF_PATTERN });
        });
        Then('invokeTool throws PATTERN_NOT_FOUND for the unknown pattern', () => {
          expect(state?.result).toBeNull();
          expect(state?.caughtError).toBeInstanceOf(ProjectionError);
          if (!(state?.caughtError instanceof ProjectionError)) {
            return;
          }
          expect(state.caughtError.code).toBe('PATTERN_NOT_FOUND');
          expect(state.caughtError.message).toContain(UNKNOWN_HANDOFF_PATTERN);
        });
      },
    );
  });
});
