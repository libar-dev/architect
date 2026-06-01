/**
 * Pattern Graph CLI Shared Test State and Fixture Builders
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
  options: { timeout?: number } = {},
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

export function createBlockedPatternFiles(): Array<{ path: string; content: string }> {
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
        dependsOn: ['RoadmapPattern'],
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

export function createCandidateAndDeliveryPatternFiles(): Array<{ path: string; content: string }> {
  return [
    {
      path: 'src/candidate.ts',
      content: createTsFileWithDirective({
        patternName: 'CandidatePattern',
        status: 'candidate',
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

export function createDiagnosticFeatureFiles(): Array<{ path: string; content: string }> {
  return [
    {
      path: 'architect/specs/missing-status.feature',
      content: [
        '@architect',
        '@architect-pattern:MissingStatusPattern',
        'Feature: Missing Status Pattern',
        '',
        '  Rule: Diagnostic coverage',
        '',
        '    **Invariant:** Gated files without status produce diagnostics.',
        '',
        '    **Rationale:** Missing status must not fail silently.',
        '',
        '    @acceptance-criteria',
        '    Scenario: Missing status',
        '      Given a gated file',
        '      Then a diagnostic is emitted',
      ].join('\n'),
    },
  ];
}

export function createFeatureFilesWithRules(): Array<{ path: string; content: string }> {
  return [
    {
      path: 'packages/architect-core/specs/validation-rules.feature',
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
      path: 'packages/architect-cli/specs/core-utils.feature',
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
    {
      path: 'tests/features/cli/package-host-rules.feature',
      content: [
        '@architect',
        '@architect-pattern:PackageHostRulesTest',
        '@architect-status:completed',
        '@architect-product-area:DataAPI',
        'Feature: Package Host Rules Test',
        '',
        '  Rule: Package host feature paths are repo-relative',
        '',
        '    **Invariant:** Feature filters accept repo-relative package-host paths.',
        '',
        '    @acceptance-criteria',
        '    Scenario: Repo-relative feature filter',
        '      Given a package-host feature path',
        '      Then the matching rules are returned',
      ].join('\n'),
    },
  ];
}

export function createDecisionEnforcingFeatureFiles(): Array<{ path: string; content: string }> {
  return [
    {
      path: 'architect/decisions/adr-777-sample.feature',
      content: [
        '@architect',
        '@architect-adr:777',
        '@architect-pattern:ADR777Sample',
        '@architect-status:completed',
        '@architect-product-area:Validation',
        'Feature: ADR-777 Sample Decision',
        '',
        '  Rule: Decision record owns its rationale',
        '',
        '    **Invariant:** The decision feature carries its own rule.',
        '',
        '    @acceptance-criteria',
        '    Scenario: Own rule',
        '      Given the decision record',
        '      Then it owns a rule',
      ].join('\n'),
    },
    {
      path: 'packages/architect-core/specs/enforcer-rules.feature',
      content: [
        '@architect',
        '@architect-pattern:DecisionEnforcerTest',
        '@architect-status:completed',
        '@architect-product-area:Validation',
        '@architect-enforces-decision:777',
        'Feature: Decision Enforcer Test',
        '',
        '  Rule: Enforcer keeps the decision invariant',
        '',
        '    **Invariant:** This rule enforces ADR-777.',
        '',
        '    @acceptance-criteria',
        '    Scenario: Enforced invariant',
        '      Given a guarded operation',
        '      Then ADR-777 holds',
      ].join('\n'),
    },
    {
      path: 'packages/architect-cli/specs/unrelated-rules.feature',
      content: [
        '@architect',
        '@architect-pattern:UnrelatedRulesTest',
        '@architect-status:completed',
        '@architect-product-area:CoreTypes',
        'Feature: Unrelated Rules Test',
        '',
        '  Rule: Unrelated rule is excluded from the decision set',
        '',
        '    **Invariant:** This rule does not enforce ADR-777.',
        '',
        '    @acceptance-criteria',
        '    Scenario: Unrelated invariant',
        '      Given an unrelated operation',
        '      Then nothing about ADR-777 applies',
      ].join('\n'),
    },
    // Numeric-id collision: an ADR and a PDR that share the bare `adr` tag
    // value (555), mirroring the real ADR-005 / PDR-005 pair. The decision-scope
    // self-match must resolve `--decision ADR-555` to the ADR's OWN rules by
    // pattern identity — re-canonicalizing the ambiguous bare `555` tag refuses
    // and would drop them (the regressed bug).
    {
      path: 'architect/decisions/adr-555-collision.feature',
      content: [
        '@architect',
        '@architect-adr:555',
        '@architect-pattern:ADR555Collision',
        '@architect-status:completed',
        '@architect-product-area:Validation',
        'Feature: ADR-555 Collision Decision',
        '',
        '  Rule: Collision ADR owns its rationale',
        '',
        '    **Invariant:** The ADR-555 record carries its own rule.',
        '',
        '    @acceptance-criteria',
        '    Scenario: Own rule',
        '      Given the colliding ADR record',
        '      Then it owns a rule',
      ].join('\n'),
    },
    {
      path: 'architect/decisions/pdr-555-collision.feature',
      content: [
        '@architect',
        '@architect-adr:555',
        '@architect-pattern:PDR555Collision',
        '@architect-status:completed',
        '@architect-product-area:Process',
        'Feature: PDR-555 Collision Decision',
        '',
        '  Rule: Sibling PDR owns an unrelated rationale',
        '',
        '    **Invariant:** The PDR-555 record is not the queried ADR.',
        '',
        '    @acceptance-criteria',
        '    Scenario: Sibling rule',
        '      Given the colliding PDR record',
        '      Then it owns a different rule',
      ].join('\n'),
    },
  ];
}

export function createParentHierarchyFeatureFiles(): Array<{ path: string; content: string }> {
  return [
    {
      path: 'tests/features/parent-epic.feature',
      content: [
        '@architect',
        '@architect-pattern:ParentEpic',
        '@architect-status:completed',
        '@architect-level:epic',
        '@architect-unlock-reason:SeedParentFilterCoverage',
        'Feature: Parent Epic',
        '  **Problem:** Parent bundles need one query.',
        '',
        '  **Solution:** Keep immediate child slices grouped under the epic.',
        '',
        '  Scenario: Parent shell',
        '    Given a parent epic',
        '    Then children can attach to it',
      ].join('\n'),
    },
    {
      path: 'tests/features/empty-epic.feature',
      content: [
        '@architect',
        '@architect-pattern:EmptyEpic',
        '@architect-status:completed',
        '@architect-level:epic',
        '@architect-unlock-reason:SeedEmptyParentCoverage',
        'Feature: Empty Epic',
        '',
        '  Scenario: Empty parent shell',
        '    Given an empty parent epic',
        '    Then no children attach to it',
      ].join('\n'),
    },
    {
      path: 'tests/features/child-alpha.feature',
      content: [
        '@architect',
        '@architect-pattern:ChildAlpha',
        '@architect-status:active',
        '@architect-level:slice',
        '@architect-parent:ParentEpic',
        '@architect-uses:ChildBeta',
        'Feature: Child Alpha',
        '  **Problem:** Alpha needs a delivery owner.',
        '',
        '  **Open Questions:**',
        '  - Who owns the alpha follow-up?',
        '  - Which signal closes the alpha gap?',
        '',
        '  Rule: Alpha bundle data stays grouped',
        '',
        '    **Invariant:** Alpha bundle data must keep its open questions and dependencies together.',
        '',
        '    **Verified by:** Alpha child',
        '',
        '  Scenario: Alpha child',
        '    Given a parent-scoped child',
        '    Then it appears under its parent',
      ].join('\n'),
    },
    {
      path: 'tests/features/child-beta.feature',
      content: [
        '@architect',
        '@architect-pattern:ChildBeta',
        '@architect-status:completed',
        '@architect-level:slice',
        '@architect-parent:ParentEpic',
        '@architect-unlock-reason:SeedCompletedChildCoverage',
        'Feature: Child Beta',
        '  **Problem:** Beta still needs a rollout signal.',
        '',
        '  **Open Questions:**',
        '  - What beta rollout signal is durable?',
        '',
        '  Rule: Beta scenarios remain visible',
        '',
        '    **Invariant:** Bundle scenario extraction must preserve beta scenario names.',
        '',
        '    **Verified by:** Beta child',
        '',
        '  Scenario: Beta child',
        '    Given another parent-scoped child',
        '    Then it appears under its parent',
      ].join('\n'),
    },
    {
      path: 'tests/features/unrelated.feature',
      content: [
        '@architect',
        '@architect-pattern:UnrelatedPattern',
        '@architect-status:completed',
        '@architect-level:slice',
        '@architect-unlock-reason:SeedUnrelatedCoverage',
        'Feature: Unrelated Pattern',
        '',
        '  Scenario: Unrelated pattern',
        '    Given an unrelated pattern',
        '    Then it stays outside the parent filter',
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
        patternName: 'ContextFormatterImpl',
        status: 'completed',
        archRole: 'service',
        archContext: 'api',
        archLayer: 'application',
        uses: ['ContextAssemblerImpl'],
      }),
    },
    {
      path: 'src/file-cache.ts',
      content: createTsFileWithDirective({
        patternName: 'ContextAssemblerImpl',
        status: 'completed',
        archRole: 'service',
        archContext: 'api',
        archLayer: 'application',
        usedBy: ['ContextFormatterImpl'],
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

export async function writeBlockedPatternFiles(state: CLITestState | null): Promise<void> {
  const dir = getTempDir(state);
  for (const file of createBlockedPatternFiles()) {
    await writeTempFile(dir, file.path, file.content);
  }
}

export async function writeCandidateAndDeliveryPatternFiles(
  state: CLITestState | null,
): Promise<void> {
  const dir = getTempDir(state);
  for (const file of createCandidateAndDeliveryPatternFiles()) {
    await writeTempFile(dir, file.path, file.content);
  }
}

export async function writeDiagnosticFeatureFiles(state: CLITestState | null): Promise<void> {
  const dir = getTempDir(state);
  for (const file of createDiagnosticFeatureFiles()) {
    await writeTempFile(dir, file.path, file.content);
  }
}

export async function writeFeatureFilesWithRules(state: CLITestState | null): Promise<void> {
  const dir = getTempDir(state);
  await writeTempFile(
    dir,
    'architect.config.js',
    [
      'export default {',
      '  packages: [',
      "    { id: 'architect-cli', displayName: 'Architect CLI', match: 'packages/architect-cli/' },",
      "    { id: 'architect-core', displayName: 'Architect Core', match: 'packages/architect-core/' },",
      "    { id: 'architect-dev', displayName: 'Architect Host', match: 'tests/features/' },",
      '  ],',
      '};',
      '',
    ].join('\n'),
  );
  for (const file of createFeatureFilesWithRules()) {
    await writeTempFile(dir, file.path, file.content);
  }
}

export async function writeDecisionEnforcingFeatureFiles(
  state: CLITestState | null,
): Promise<void> {
  const dir = getTempDir(state);
  await writeTempFile(
    dir,
    'architect.config.js',
    [
      'export default {',
      '  packages: [',
      "    { id: 'architect-cli', displayName: 'Architect CLI', match: 'packages/architect-cli/' },",
      "    { id: 'architect-core', displayName: 'Architect Core', match: 'packages/architect-core/' },",
      "    { id: 'architect-dev', displayName: 'Architect Host', match: 'architect/' },",
      '  ],',
      '};',
      '',
    ].join('\n'),
  );
  for (const file of createDecisionEnforcingFeatureFiles()) {
    await writeTempFile(dir, file.path, file.content);
  }
}

/**
 * One feature whose pattern declares NO `@architect-product-area`, so its rule
 * buckets under the projection's `DEFAULT_PRODUCT_AREA` ('Platform'). Fixture for
 * the regression that `rules --product-area Platform` must ACCEPT the default
 * bucket rather than fail-loud "invalid value": the accepted set is derived from
 * the rule projection (`collectBusinessRuleProductAreas`), not the pattern-keyed
 * `byProductArea` (which omits the default bucket and so false-rejected it).
 */
export function createDefaultProductAreaRuleFeatureFiles(): Array<{ path: string; content: string }> {
  return [
    {
      path: 'packages/architect-core/specs/default-area-rule.feature',
      content: [
        '@architect',
        '@architect-pattern:DefaultAreaRuleTest',
        '@architect-status:completed',
        'Feature: Default Area Rule Test',
        '',
        '  Rule: Default-area rule has no product area',
        '',
        '    **Invariant:** A rule whose pattern declares no product area buckets under the default product area.',
        '',
        '    @acceptance-criteria',
        '    Scenario: Default bucket',
        '      Given a pattern with no product area',
        '      Then its rule buckets under the default product area',
      ].join('\n'),
    },
  ];
}

export async function writeDefaultProductAreaRuleFeatureFiles(
  state: CLITestState | null,
): Promise<void> {
  const dir = getTempDir(state);
  await writeTempFile(
    dir,
    'architect.config.js',
    [
      'export default {',
      '  packages: [',
      "    { id: 'architect-core', displayName: 'Architect Core', match: 'packages/architect-core/' },",
      '  ],',
      '};',
      '',
    ].join('\n'),
  );
  for (const file of createDefaultProductAreaRuleFeatureFiles()) {
    await writeTempFile(dir, file.path, file.content);
  }
}

export async function writeParentHierarchyFeatureFiles(state: CLITestState | null): Promise<void> {
  const dir = getTempDir(state);
  await writeTempFile(
    dir,
    'architect.config.js',
    [
      'export default {',
      '  packages: [',
      "    { id: 'architect-dev', displayName: 'Architect Host', match: 'tests/features/' },",
      '  ],',
      '};',
      '',
    ].join('\n'),
  );
  for (const file of createPatternFiles()) {
    await writeTempFile(dir, file.path, file.content);
  }
  for (const file of createParentHierarchyFeatureFiles()) {
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
