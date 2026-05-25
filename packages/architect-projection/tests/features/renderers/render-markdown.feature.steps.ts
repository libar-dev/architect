import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { describe, expect, it } from 'vitest';

import {
  REQUIREMENTS_EXECUTABLE_AREA_LABEL,
  REQUIREMENTS_SPECS_AREA_LABEL,
} from '../../../src/fragments/operational-insights/requirement-digest.js';
import {
  type DisclosureSpec,
  getSupportedDocumentationTypeMetadata,
  renderMarkdown,
  type Block,
  type BusinessRuleSet,
  type Fragment,
  type MarkdownRenderEvent,
  type ProjectionBundle,
} from '../../../src/index.js';

interface DocumentationSectionFixture {
  readonly id: string;
  readonly title: string;
  readonly blocks: readonly Block[];
}

interface SectionedDocumentFixture {
  readonly kind: 'SectionedDocumentFixture';
  readonly documentType: string;
  readonly title: string;
  readonly sections: readonly DocumentationSectionFixture[];
}

function documentationFixtureToFragment(view: SectionedDocumentFixture): Fragment {
  return {
    kind: 'ProjectConfigSnapshot',
    baseDir: view.title,
    configPath: view.documentType,
    sourceGlobs: [],
    buildTimeMs: 0,
    patternCount: 0,
    phaseCount: 0,
    roleCount: 0,
    title: view.title,
    sections: view.sections,
  } as unknown as Fragment;
}

interface RenderMarkdownBlockState {
  input: Fragment | ProjectionBundle<Fragment> | null;
  rendered: string | Record<string, string> | null;
  renderEvents: MarkdownRenderEvent[];
}

function assertRenderedString(value: string | Record<string, string> | null): string {
  expect(value).not.toBeNull();
  expect(typeof value).toBe('string');

  if (typeof value !== 'string') {
    throw new Error('Expected renderMarkdown to return a markdown string.');
  }

  return value;
}

function assertRenderedRecord(
  value: string | Record<string, string> | null,
): Record<string, string> {
  expect(value).not.toBeNull();
  expect(typeof value).toBe('object');

  if (!value || typeof value === 'string') {
    throw new Error('Expected renderMarkdown to return a routed markdown record.');
  }

  return value;
}

const feature = await loadFeature('tests/features/renderers/render-markdown.feature');

let state: RenderMarkdownBlockState | null = null;

function createState(): RenderMarkdownBlockState {
  return {
    input: null,
    rendered: null,
    renderEvents: [],
  };
}

function createAllBlocksFixture(): Fragment {
  return documentationFixtureToFragment({
    kind: 'SectionedDocumentFixture',
    documentType: 'reference',
    title: 'Markdown Reference',
    sections: [
      {
        id: 'all-blocks',
        title: 'All Blocks',
        blocks: [
          { type: 'heading', level: 3, text: 'Nested heading' },
          { type: 'paragraph', text: 'Paragraph content for the markdown renderer.' },
          { type: 'separator' },
          {
            type: 'table',
            columns: ['Name', 'Notes'],
            rows: [
              ['Pipe', 'A | B'],
              ['Break', 'Line 1\nLine 2'],
            ],
            alignment: ['left', 'center'],
          },
          {
            type: 'list',
            ordered: false,
            items: [
              'unordered item',
              {
                text: 'checkbox parent',
                checked: true,
                children: ['nested child', { text: 'nested task', checked: false }],
              },
            ],
          },
          {
            type: 'code',
            language: 'ts',
            content: 'const fence = "```";\nconsole.log(fence);',
          },
          {
            type: 'mermaid',
            content: 'graph TD; A[Markdown] --> B[Blocks]',
          },
          {
            type: 'collapsible',
            summary: 'Danger <summary> & notes',
            content: [{ type: 'paragraph', text: 'Collapsed body.' }],
          },
          {
            type: 'link-out',
            text: 'Docs with spaces',
            path: 'guides/My Guide.md',
          },
        ],
      },
    ],
  });
}

function createUnsafeMarkdownFixture(): Fragment {
  return documentationFixtureToFragment({
    kind: 'SectionedDocumentFixture',
    documentType: 'security',
    title: 'Markdown Security',
    sections: [
      {
        id: 'unsafe-blocks',
        title: 'Unsafe Blocks',
        blocks: [
          {
            type: 'paragraph',
            text: '<script>alert("x")</script> [trap](javascript:alert(1)) **bold**',
          },
          {
            type: 'paragraph',
            text: '# heading trap\n> quote trap\n- list trap\n1. ordered trap\n---',
          },
          {
            type: 'list',
            ordered: false,
            items: ['![img](https://example.com/x.png)', '[link](javascript:alert(2))'],
          },
          {
            type: 'link-out',
            text: 'Click](javascript:alert(3))',
            path: 'javascript:alert(3)',
          },
          {
            type: 'link-out',
            text: 'Safe Docs',
            path: 'https://example.com/docs path',
          },
          {
            type: 'link-out',
            text: 'Protocol Relative',
            path: '//evil.example/docs',
          },
          {
            type: 'link-out',
            text: 'Encoded Colon',
            path: 'javascript&#58;alert(11)',
          },
          {
            type: 'link-out',
            text: 'Named Colon',
            path: 'javascript&colon;alert(12)',
          },
          {
            type: 'link-out',
            text: 'Hex Scheme Letter',
            path: 'jav&#x61;script:alert(13)',
          },
          {
            type: 'link-out',
            text: 'Decimal Scheme Letter',
            path: 'java&#115;cript:alert(14)',
          },
          {
            type: 'link-out',
            text: 'Encoded Scheme And Colon',
            path: 'jav&#x61;script&#58;alert(15)',
          },
          {
            type: 'link-out',
            text: 'Semicolonless Colon',
            path: 'javascript&#58alert(16)',
          },
          {
            type: 'link-out',
            text: 'Encoded Protocol Relative',
            path: '&#47;&#47;evil.example/docs',
          },
          {
            type: 'link-out',
            text: 'Named Protocol Relative',
            path: '&sol;&sol;evil.example/docs',
          },
          {
            type: 'link-out',
            text: 'Named Tab Scheme Split',
            path: 'jav&Tab;ascript:alert(19)',
          },
          {
            type: 'link-out',
            text: 'Named NewLine Scheme Split',
            path: 'java&NewLine;script&colon;alert(20)',
          },
          {
            type: 'link-out',
            text: 'Tab Scheme Split',
            path: 'jav&#x09;ascript:alert(17)',
          },
          {
            type: 'link-out',
            text: 'Line Feed Scheme Split',
            path: 'jav&#10;ascript:alert(18)',
          },
          {
            type: 'link-out',
            text: 'Leading Named Tab HTTPS',
            path: '&Tab;https://example.com/ok',
          },
          {
            type: 'link-out',
            text: 'Trailing Named NewLine Relative',
            path: 'docs/guide.md&NewLine;',
          },
          {
            type: 'link-out',
            text: 'Leading Numeric Tab Relative',
            path: '&#9;docs/guide.md',
          },
          {
            type: 'link-out',
            text: 'Trailing Numeric NewLine HTTPS',
            path: 'https://example.com/ok&#10;',
          },
          {
            type: 'collapsible',
            summary: '**Summary** [trap](javascript:alert(9)) <b>tag</b>',
            content: [{ type: 'paragraph', text: 'Summary body.' }],
          },
          {
            type: 'link-out',
            text: 'Safe Colonized Path',
            path: 'docs/&colonization-guide.md',
          },
        ],
      },
    ],
  });
}

function createHostileReleaseNotesFixture(): Fragment {
  return {
    kind: 'ReleaseNotesDigest',
    releases: [
      {
        release: 'v1.0](javascript:alert(1))',
        date: '<script>alert(2)</script>',
        patterns: [
          {
            kind: 'PatternSummary',
            patternName: 'Pattern **bold** [trap](javascript:alert(3))',
            role: 'Pattern',
            file: 'packages/foo.ts',
            source: 'typescript',
          },
        ],
        deliverables: [
          {
            name: 'Deliverable [click](javascript:alert(4))',
            status: 'active',
            tests: [],
            location: '<script>alert(5)</script>',
          },
        ],
        notes: 'Release note [trap](javascript:alert(6))',
      },
    ],
  } as unknown as Fragment;
}

function createHostileRequirementDigestFixture(): ProjectionBundle<Fragment> {
  const pattern = 'RendererRequirement [trap](javascript:alert(7))';
  const requirement = {
    pattern,
    status: 'active **bold** [trap](javascript:alert(8))',
    description: [
      {
        type: 'paragraph',
        text: 'Requirement body remains plain text.',
      },
    ],
    testFiles: ['tests/features/renderers/render-markdown.feature'],
  };

  return {
    root: {
      kind: 'RequirementDigest',
      productArea: REQUIREMENTS_EXECUTABLE_AREA_LABEL,
      requirements: [requirement],
      businessRuleReferences: [],
    } as unknown as Fragment,
    children: {
      'requirements-executable:renderer-threat': {
        kind: 'RequirementDigest',
        productArea: pattern,
        requirements: [requirement],
        businessRuleReferences: [],
      } as unknown as Fragment,
    },
    routing: {
      rootRouteId: 'requirements-executable:index',
      childRouteIds: {
        'requirements-executable:renderer-threat':
          'requirements-executable:renderer-package:requirement:renderer-threat',
      },
      childPathStrategy: 'nested',
      anchorStrategy: 'heading-slug',
    },
  };
}

function createSplitBundle(): ProjectionBundle<Fragment> {
  const root: SectionedDocumentFixture = {
    kind: 'SectionedDocumentFixture',
    documentType: 'index',
    title: 'Projection Docs',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        blocks: [{ type: 'paragraph', text: 'Root index for routed documentation output.' }],
      },
    ],
  };

  const child: SectionedDocumentFixture = {
    kind: 'SectionedDocumentFixture',
    documentType: 'guide',
    title: 'Renderer Guide',
    sections: [
      {
        id: 'alpha',
        title: 'Alpha Section',
        blocks: [{ type: 'paragraph', text: 'Alpha details stay together.' }],
      },
      {
        id: 'beta',
        title: 'Beta Section',
        blocks: [{ type: 'paragraph', text: 'Beta details stay together too.' }],
      },
      {
        id: 'gamma',
        title: 'Gamma Section',
        blocks: [{ type: 'paragraph', text: 'Gamma details push the file over budget.' }],
      },
    ],
  };

  return {
    root: documentationFixtureToFragment(root),
    children: {
      'renderer-guide': documentationFixtureToFragment(child),
    },
    routing: {
      rootRouteId: 'index:index',
      childRouteIds: {
        'renderer-guide': 'guides:renderer-guide',
      },
      childPathStrategy: 'nested',
      anchorStrategy: 'heading-slug',
    },
  };
}

function createBusinessRulesDisclosureBundle(): ProjectionBundle<Fragment> {
  const root: SectionedDocumentFixture = {
    kind: 'SectionedDocumentFixture',
    documentType: 'business-rules',
    title: 'Business Rules',
    sections: [
      {
        id: 'rules',
        title: 'Rules',
        blocks: [
          {
            type: 'table',
            columns: ['Feature', 'Rule', 'Invariant'],
            rows: [
              [
                'Projection API',
                'Canonical document types',
                'Full invariant detail stays in the child page.',
              ],
            ],
            alignment: ['left', 'left', 'left'],
          },
        ],
      },
    ],
  };
  const child: SectionedDocumentFixture = {
    kind: 'SectionedDocumentFixture',
    documentType: 'business-rules',
    title: 'Projection API Business Rules',
    sections: [
      {
        id: 'summary',
        title: 'Summary',
        blocks: [{ type: 'paragraph', text: 'Business-rule detail for Projection API.' }],
      },
      {
        id: 'invariant',
        title: 'Invariant',
        blocks: [{ type: 'paragraph', text: 'Full invariant detail stays in the child page.' }],
      },
    ],
  };

  return withBundleDisclosureSpec(
    {
      root: documentationFixtureToFragment(root),
      children: {
        'business-rules:projection-api': documentationFixtureToFragment(child),
      },
      routing: {
        rootRouteId: 'business-rules:index',
        childRouteIds: {
          'business-rules:projection-api': 'business-rules:projection-api',
        },
        childPathStrategy: 'nested',
        anchorStrategy: 'heading-slug',
      },
    },
    {
      grouping: 'flat',
      richness: 'full',
      emitChildren: true,
      committed: true,
    },
  );
}

function createBusinessRuleSetDisclosureBundle(): ProjectionBundle<BusinessRuleSet> {
  const projectionRules = [
    {
      kind: 'BusinessRule' as const,
      feature: 'ProjectionAPI',
      ruleName: 'Canonical document types',
      package: 'architect-projection',
      invariant: 'Full invariant detail should not appear in essential disclosure.',
      rationale: 'Essential pages are orientation surfaces.',
      verifiedBy: ['business-rule markdown richness is driven by disclosure policy'],
      scenarioCount: 1,
      pattern: 'ProjectionAPI',
      phase: 49,
      productArea: 'Projection Platform',
    },
  ];
  const cliRules = [
    {
      kind: 'BusinessRule' as const,
      feature: 'GenerateDocsCli',
      ruleName: 'Registry dispatch',
      package: 'architect-cli',
      invariant: 'CLI dispatch details should remain outside the grouped count surface.',
      rationale: 'Renderer policy decides markdown richness.',
      verifiedBy: ['business-rule markdown richness is driven by disclosure policy'],
      scenarioCount: 1,
      pattern: 'GenerateDocsCli',
      phase: 49,
      productArea: 'CLI',
    },
  ];

  return withBundleDisclosureSpec(
    {
      root: {
        kind: 'BusinessRuleSet',
        scope: 'all',
        rules: [...projectionRules, ...cliRules],
        groupedBy: 'package',
        groupingEntries: [
          {
            childKey: 'architect-cli',
            label: 'architect-cli',
            featureCount: 1,
            ruleCount: 1,
            invariantCount: 1,
          },
          {
            childKey: 'architect-projection',
            label: 'architect-projection',
            featureCount: 1,
            ruleCount: 1,
            invariantCount: 1,
          },
        ],
      },
      children: {
        'architect-cli': {
          kind: 'BusinessRuleSet',
          scope: 'package',
          scopeValue: 'architect-cli',
          rules: cliRules,
          groupedBy: 'package',
        },
        'architect-projection': {
          kind: 'BusinessRuleSet',
          scope: 'package',
          scopeValue: 'architect-projection',
          rules: projectionRules,
          groupedBy: 'package',
        },
      },
      routing: {
        rootRouteId: 'business-rules:index',
        childRouteIds: {
          'architect-cli': 'business-rules:architect-cli',
          'architect-projection': 'business-rules:architect-projection',
        },
        childPathStrategy: 'nested',
        anchorStrategy: 'heading-slug',
      },
    },
    getSupportedDocumentationTypeMetadata('business-rules').disclosureMatrix.important,
  );
}

function createBusinessRuleSetHostileGroupingBundle(): ProjectionBundle<BusinessRuleSet> {
  const bundle = createBusinessRuleSetDisclosureBundle();
  const routing = bundle.routing;
  const cliChild = bundle.children['architect-cli'];

  if (routing === undefined) {
    throw new Error('Expected business-rule disclosure bundle routing to be defined.');
  }

  if (cliChild === undefined) {
    throw new Error('Expected architect-cli child bundle entry to be defined.');
  }

  const root: BusinessRuleSet = {
    kind: 'BusinessRuleSet',
    scope: 'all',
    rules: bundle.root.rules,
    groupedBy: 'package',
    groupingEntries: [
      {
        childKey: 'architect-cli',
        label: '[CLI Trap](javascript:alert(10))',
        featureCount: 1,
        ruleCount: 1,
        invariantCount: 1,
      },
    ],
  };

  return {
    root,
    children: {
      'architect-cli': cliChild,
    },
    routing: {
      rootRouteId: routing.rootRouteId,
      childRouteIds: {
        'architect-cli': 'business-rules:architect-cli',
      },
      childPathStrategy: routing.childPathStrategy,
      anchorStrategy: routing.anchorStrategy,
      ...(routing.disclosureSpec !== undefined ? { disclosureSpec: routing.disclosureSpec } : {}),
    },
  };
}

function createBusinessRuleSetRichnessFixture(
  disclosureSpec: DisclosureSpec,
): ProjectionBundle<Fragment> {
  return withBundleDisclosureSpec(
    {
      root: {
        kind: 'BusinessRuleSet',
        scope: 'all',
        rules: [
          {
            kind: 'BusinessRule',
            feature: 'ProjectionAPI',
            ruleName: 'Canonical document types',
            package: 'architect-projection',
            invariant: 'Business rules expose stable disclosure-driven columns.',
            rationale: 'Renderer richness should be explicit and testable.',
            verifiedBy: ['BusinessRule table column count per richness'],
            scenarioCount: 1,
            pattern: 'ProjectionAPI',
            phase: 49,
            productArea: 'Projection Platform',
          },
          {
            kind: 'BusinessRule',
            feature: 'GenerateDocsCli',
            ruleName: 'Registry dispatch',
            package: 'architect-cli',
            invariant: 'CLI business rules render through the same table policy.',
            rationale: 'Disclosure richness should not be consumer-specific.',
            verifiedBy: ['BusinessRule table column count per richness'],
            scenarioCount: 1,
            pattern: 'GenerateDocsCli',
            phase: 49,
            productArea: 'CLI',
          },
          {
            kind: 'BusinessRule',
            feature: 'ArchitectMcp',
            ruleName: 'Documentation tool parity',
            package: 'architect-mcp',
            invariant: 'MCP business rules follow the same markdown richness policy.',
            rationale: 'Boundary surfaces should share disclosure semantics.',
            verifiedBy: ['BusinessRule table column count per richness'],
            scenarioCount: 1,
            pattern: 'ArchitectMcp',
            phase: 49,
            productArea: 'MCP',
          },
        ],
      },
      children: {},
    },
    disclosureSpec,
  );
}

function withBundleDisclosureSpec<TFragment extends Fragment>(
  bundle: ProjectionBundle<TFragment>,
  disclosureSpec: DisclosureSpec,
): ProjectionBundle<TFragment> {
  const routing = bundle.routing;

  return {
    ...bundle,
    routing: {
      rootRouteId: routing?.rootRouteId ?? 'documentation:index',
      childRouteIds: routing?.childRouteIds ?? {},
      childPathStrategy: routing?.childPathStrategy ?? 'nested',
      anchorStrategy: routing?.anchorStrategy ?? 'heading-slug',
      disclosureSpec,
      ...(routing?.markdownRootTarget !== undefined
        ? { markdownRootTarget: routing.markdownRootTarget }
        : {}),
      ...(routing?.markdownChildDirectory !== undefined
        ? { markdownChildDirectory: routing.markdownChildDirectory }
        : {}),
      ...(routing?.entityPathLayout !== undefined
        ? { entityPathLayout: routing.entityPathLayout }
        : {}),
    },
  };
}

function countRuleTableColumns(document: string): number {
  const rulesHeadingIndex = document.indexOf('## Rules');
  if (rulesHeadingIndex === -1) {
    throw new Error('Rules heading not found in rendered markdown.');
  }
  const afterRules = document.slice(rulesHeadingIndex).split('\n');
  const headerRow = afterRules.find((line) => line.startsWith('| '));
  if (headerRow === undefined) {
    throw new Error('Rule table header row not found in rendered markdown.');
  }
  return headerRow
    .split('|')
    .map((part) => part.trim())
    .filter((part) => part.length > 0).length;
}

function createDuplicatePathBundle(): ProjectionBundle<Fragment> {
  const root: SectionedDocumentFixture = {
    kind: 'SectionedDocumentFixture',
    documentType: 'patterns',
    title: 'Patterns',
    sections: [
      {
        id: 'summary',
        title: 'Summary',
        blocks: [{ type: 'paragraph', text: 'Pattern index summary.' }],
      },
      {
        id: 'details',
        title: 'Pattern Details',
        blocks: [
          { type: 'link-out', text: 'First Pattern', path: 'first-pattern' },
          { type: 'link-out', text: 'Second Pattern', path: 'second-pattern' },
          { type: 'link-out', text: 'Ambiguous Detail Alias', path: 'patterns:detail' },
        ],
      },
    ],
  };
  const first: SectionedDocumentFixture = {
    kind: 'SectionedDocumentFixture',
    documentType: 'patterns',
    title: 'First Pattern',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        blocks: [{ type: 'paragraph', text: 'First detail body.' }],
      },
    ],
  };
  const second: SectionedDocumentFixture = {
    kind: 'SectionedDocumentFixture',
    documentType: 'patterns',
    title: 'Second Pattern',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        blocks: [{ type: 'paragraph', text: 'Second detail body.' }],
      },
    ],
  };

  return {
    root: documentationFixtureToFragment(root),
    children: {
      'first-pattern': documentationFixtureToFragment(first),
      'second-pattern': documentationFixtureToFragment(second),
    },
    routing: {
      rootRouteId: 'patterns:index',
      childRouteIds: {
        'first-pattern': 'patterns:detail',
        'second-pattern': 'patterns:detail',
      },
      childPathStrategy: 'nested',
      anchorStrategy: 'heading-slug',
    },
  };
}

function createRouteIdCollisionBundle(): ProjectionBundle<Fragment> {
  const root: SectionedDocumentFixture = {
    kind: 'SectionedDocumentFixture',
    documentType: 'patterns',
    title: 'Patterns',
    sections: [
      {
        id: 'details',
        title: 'Pattern Details',
        blocks: [{ type: 'link-out', text: 'Colliding Alias', path: 'patterns:detail' }],
      },
    ],
  };

  const routeIdKeyChild: SectionedDocumentFixture = {
    kind: 'SectionedDocumentFixture',
    documentType: 'patterns',
    title: 'Route Id Key Child',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        blocks: [{ type: 'paragraph', text: 'Key child body.' }],
      },
    ],
  };

  const aliasedChild: SectionedDocumentFixture = {
    kind: 'SectionedDocumentFixture',
    documentType: 'patterns',
    title: 'Aliased Child',
    sections: [
      {
        id: 'overview',
        title: 'Overview',
        blocks: [{ type: 'paragraph', text: 'Aliased child body.' }],
      },
    ],
  };

  return {
    root: documentationFixtureToFragment(root),
    children: {
      'patterns:detail': documentationFixtureToFragment(routeIdKeyChild),
      'first-pattern': documentationFixtureToFragment(aliasedChild),
    },
    routing: {
      rootRouteId: 'patterns:index',
      childRouteIds: {
        'patterns:detail': 'patterns:key-child',
        'first-pattern': 'patterns:detail',
      },
      childPathStrategy: 'nested',
      anchorStrategy: 'heading-slug',
    },
  };
}

function createRequirementsDisclosureBundle(
  documentType: 'requirements-executable' | 'requirements-specs',
): ProjectionBundle<Fragment> {
  const label =
    documentType === 'requirements-executable'
      ? REQUIREMENTS_EXECUTABLE_AREA_LABEL
      : REQUIREMENTS_SPECS_AREA_LABEL;
  const requirementPattern =
    documentType === 'requirements-executable'
      ? 'RendererExecutableRequirement'
      : 'RendererSpecsRequirement';
  const childKey = `${documentType}:renderer-requirement`;
  const childRouteId =
    documentType === 'requirements-executable'
      ? 'requirements-executable:renderer-package:requirement:renderer-requirement'
      : 'requirements-specs:renderer-requirement';
  const root: SectionedDocumentFixture = {
    kind: 'SectionedDocumentFixture',
    documentType,
    title: label,
    sections: [
      {
        id: 'summary',
        title: 'Summary',
        blocks: [
          {
            type: 'table',
            columns: ['Pattern', 'Status', 'Test Files'],
            rows: [
              [requirementPattern, 'active', 'tests/features/renderers/render-markdown.feature'],
            ],
            alignment: ['left', 'left', 'left'],
          },
        ],
      },
      {
        id: 'requirement',
        title: 'Requirement',
        blocks: [
          {
            type: 'paragraph',
            text: `${requirementPattern} full requirement body must stay out of the root page.`,
          },
        ],
      },
      {
        id: 'additional-files',
        title: 'Additional Files',
        blocks: [{ type: 'link-out', text: requirementPattern, path: childKey }],
      },
    ],
  };
  const child: SectionedDocumentFixture = {
    kind: 'SectionedDocumentFixture',
    documentType,
    title: requirementPattern,
    sections: [
      {
        id: 'status',
        title: 'Status',
        blocks: [{ type: 'paragraph', text: 'active' }],
      },
      {
        id: 'requirement',
        title: 'Requirement',
        blocks: [
          {
            type: 'paragraph',
            text: `${requirementPattern} full requirement body is retained in the detail page.`,
          },
        ],
      },
    ],
  };

  return {
    root: documentationFixtureToFragment(root),
    children: {
      [childKey]: documentationFixtureToFragment(child),
    },
    routing: {
      rootRouteId: `${documentType}:index`,
      childRouteIds: {
        [childKey]: childRouteId,
      },
      childPathStrategy: 'nested',
      anchorStrategy: 'heading-slug',
    },
  };
}

function createRequirementsDisclosureBundleWithRejectedChildren(
  documentType: 'requirements-executable' | 'requirements-specs',
): ProjectionBundle<Fragment> {
  const label =
    documentType === 'requirements-executable'
      ? REQUIREMENTS_EXECUTABLE_AREA_LABEL
      : REQUIREMENTS_SPECS_AREA_LABEL;

  const primaryPattern =
    documentType === 'requirements-executable'
      ? 'RendererExecutableRequirement'
      : 'RendererSpecsRequirement';
  const secondaryPattern =
    documentType === 'requirements-executable'
      ? 'RendererExecutableRequirementTxt'
      : 'RendererSpecsRequirementTxt';

  const primaryChildKey = `${documentType}:renderer-requirement`;
  const secondaryChildKey = `${documentType}:renderer-requirement-text`;
  const primaryChildRouteId =
    documentType === 'requirements-executable'
      ? 'requirements-executable:renderer-package:requirement:renderer-requirement'
      : 'requirements-specs:renderer-requirement';
  const secondaryChildRouteId =
    documentType === 'requirements-executable'
      ? 'requirements-executable:renderer-package:requirement:renderer-requirement-text'
      : 'requirements-specs:renderer-requirement-text';

  const root: SectionedDocumentFixture = {
    kind: 'SectionedDocumentFixture',
    documentType,
    title: label,
    sections: [
      {
        id: 'summary',
        title: 'Summary',
        blocks: [
          {
            type: 'table',
            columns: ['Pattern', 'Status', 'Test Files'],
            rows: [
              [primaryPattern, 'active', 'tests/features/renderers/render-markdown.feature'],
              [secondaryPattern, 'active', 'tests/features/renderers/render-markdown.feature'],
            ],
            alignment: ['left', 'left', 'left'],
          },
        ],
      },
      {
        id: 'additional-files',
        title: 'Additional Files',
        blocks: [
          { type: 'link-out', text: primaryPattern, path: primaryChildKey },
          { type: 'link-out', text: secondaryPattern, path: secondaryChildKey },
        ],
      },
    ],
  };

  const createChild = (title: string): SectionedDocumentFixture => ({
    kind: 'SectionedDocumentFixture',
    documentType,
    title,
    sections: [
      {
        id: 'status',
        title: 'Status',
        blocks: [{ type: 'paragraph', text: 'active' }],
      },
      {
        id: 'requirement',
        title: 'Requirement',
        blocks: [
          {
            type: 'paragraph',
            text: `${title} full requirement body is retained in the detail page.`,
          },
        ],
      },
    ],
  });

  return {
    root: documentationFixtureToFragment(root),
    children: {
      [primaryChildKey]: documentationFixtureToFragment(createChild(primaryPattern)),
      [secondaryChildKey]: documentationFixtureToFragment(createChild(secondaryPattern)),
    },
    routing: {
      rootRouteId: `${documentType}:index`,
      childRouteIds: {
        [primaryChildKey]: primaryChildRouteId,
        [secondaryChildKey]: secondaryChildRouteId,
      },
      childPathStrategy: 'nested',
      anchorStrategy: 'heading-slug',
    },
  };
}

const expectedAllBlocksMarkdown = [
  '# Markdown Reference',
  '',
  '## All Blocks',
  '',
  '### Nested heading',
  '',
  'Paragraph content for the markdown renderer.',
  '',
  '---',
  '',
  '| Name  | Notes            |',
  '| ----- | :--------------: |',
  '| Pipe  | A \\| B           |',
  '| Break | Line 1<br>Line 2 |',
  '',
  '- unordered item',
  '- [x] checkbox parent',
  '  - nested child',
  '  - [ ] nested task',
  '',
  '````ts',
  'const fence = "' + '```' + '";',
  'console.log(fence);',
  '````',
  '',
  '```mermaid',
  'graph TD; A[Markdown] --> B[Blocks]',
  '```',
  '',
  '<details>',
  '<summary>Danger &lt;summary&gt; &amp; notes</summary>',
  '',
  'Collapsed body.',
  '',
  '</details>',
  '',
  '[Docs with spaces](guides/My%20Guide.md)',
  '',
].join('\n');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the renderMarkdown block test state is initialized', () => {
      state = createState();
    });
  });

  Rule('Canonical blocks render with stable markdown semantics', ({ RuleScenario }) => {
    RuleScenario('All nine block types render in canonical markdown', ({ Given, When, Then }) => {
      Given('a SectionedDocumentFixture fixture containing all canonical block types', () => {
        state!.input = createAllBlocksFixture();
      });

      When('I render the fragment as markdown', () => {
        state!.rendered = renderMarkdown(state!.input!);
      });

      Then('the markdown output should match the canonical block rendering', () => {
        expect(state!.rendered).toBe(expectedAllBlocksMarkdown);
      });
    });

    RuleScenario(
      'Plain-text markdown blocks escape hostile text and block unsafe URLs',
      ({ Given, When, Then, And }) => {
        Given(
          'a SectionedDocumentFixture fixture containing hostile markdown text and unsafe links',
          () => {
            state!.input = createUnsafeMarkdownFixture();
          },
        );

        When('I render the fragment as markdown', () => {
          state!.rendered = renderMarkdown(state!.input!);
        });

        Then('the markdown output should escape hostile plain text', () => {
          const markdown = assertRenderedString(state!.rendered);
          expect(markdown).toContain(
            '&lt;script&gt;alert\\("x"\\)&lt;/script&gt; \\[trap\\]\\(javascript:alert\\(1\\)\\) \\*\\*bold\\*\\*',
          );
          expect(markdown).toContain('- \\!\\[img\\]\\(https://example.com/x.png\\)');
          expect(markdown).toContain('- \\[link\\]\\(javascript:alert\\(2\\)\\)');
        });

        And('the markdown output should neutralize block-level markdown markers', () => {
          const markdown = assertRenderedString(state!.rendered);
          expect(markdown).toContain('\\# heading trap');
          expect(markdown).toContain('&gt; quote trap');
          expect(markdown).toContain('\\- list trap');
          expect(markdown).toContain('1\\. ordered trap');
          expect(markdown).toContain('\\---');
        });

        And('the markdown output should escape hostile collapsible summaries', () => {
          const markdown = assertRenderedString(state!.rendered);
          expect(markdown).toContain(
            '<summary>\\*\\*Summary\\*\\* \\[trap\\]\\(javascript:alert\\(9\\)\\) &lt;b&gt;tag&lt;/b&gt;</summary>',
          );
        });

        And('the markdown output should block unsafe link targets', () => {
          const markdown = assertRenderedString(state!.rendered);
          expect(markdown).not.toContain('[Click');
          expect(markdown).toContain('Click\\]\\(javascript:alert\\(3\\)\\)');
          expect(markdown).toContain('[Safe Docs](https://example.com/docs%20path)');
          expect(markdown).toContain('Protocol Relative');
          expect(markdown).not.toContain('[Protocol Relative](');
          expect(markdown).toContain('Encoded Colon');
          expect(markdown).not.toContain('[Encoded Colon](');
          expect(markdown).toContain('Named Colon');
          expect(markdown).not.toContain('[Named Colon](');
          expect(markdown).toContain('Hex Scheme Letter');
          expect(markdown).not.toContain('[Hex Scheme Letter](');
          expect(markdown).toContain('Decimal Scheme Letter');
          expect(markdown).not.toContain('[Decimal Scheme Letter](');
          expect(markdown).toContain('Encoded Scheme And Colon');
          expect(markdown).not.toContain('[Encoded Scheme And Colon](');
          expect(markdown).toContain('Semicolonless Colon');
          expect(markdown).not.toContain('[Semicolonless Colon](');
          expect(markdown).toContain('Encoded Protocol Relative');
          expect(markdown).not.toContain('[Encoded Protocol Relative](');
          expect(markdown).toContain('Named Protocol Relative');
          expect(markdown).not.toContain('[Named Protocol Relative](');
          expect(markdown).toContain('Named Tab Scheme Split');
          expect(markdown).not.toContain('[Named Tab Scheme Split](');
          expect(markdown).toContain('Named NewLine Scheme Split');
          expect(markdown).not.toContain('[Named NewLine Scheme Split](');
          expect(markdown).toContain('Tab Scheme Split');
          expect(markdown).not.toContain('[Tab Scheme Split](');
          expect(markdown).toContain('Line Feed Scheme Split');
          expect(markdown).not.toContain('[Line Feed Scheme Split](');
          expect(markdown).toContain('Leading Named Tab HTTPS');
          expect(markdown).not.toContain('[Leading Named Tab HTTPS](');
          expect(markdown).toContain('Trailing Named NewLine Relative');
          expect(markdown).not.toContain('[Trailing Named NewLine Relative](');
          expect(markdown).toContain('Leading Numeric Tab Relative');
          expect(markdown).not.toContain('[Leading Numeric Tab Relative](');
          expect(markdown).toContain('Trailing Numeric NewLine HTTPS');
          expect(markdown).not.toContain('[Trailing Numeric NewLine HTTPS](');
          expect(markdown).toContain('[Safe Colonized Path](docs/&colonization-guide.md)');
        });
      },
    );

    RuleScenario(
      'Release notes trusted markdown escapes interpolated fragment values',
      ({ Given, When, Then }) => {
        Given('a ReleaseNotesDigest fixture containing hostile release metadata', () => {
          state!.input = createHostileReleaseNotesFixture();
        });

        When('I render the fragment as markdown', () => {
          state!.rendered = renderMarkdown(state!.input!);
        });

        Then('the release notes markdown should escape trusted interpolation values', () => {
          const markdown = assertRenderedString(state!.rendered);
          expect(markdown).toContain(
            '## [v1.0\\]\\(javascript:alert\\(1\\)\\)] - &lt;script&gt;alert\\(2\\)&lt;/script&gt;',
          );
          expect(markdown).toContain(
            '- **Deliverable \\[click\\]\\(javascript:alert\\(4\\)\\)**: &lt;script&gt;alert\\(5\\)&lt;/script&gt;',
          );
          expect(markdown).toContain(
            '- Pattern \\*\\*bold\\*\\* \\[trap\\]\\(javascript:alert\\(3\\)\\)',
          );
          expect(markdown).toContain('Release note \\[trap\\]\\(javascript:alert\\(6\\)\\)');
        });
      },
    );

    RuleScenario(
      'Requirement digests escape interpolated trusted markdown values',
      ({ Given, When, Then }) => {
        Given('a RequirementDigest fixture containing hostile requirement values', () => {
          state!.input = createHostileRequirementDigestFixture();
        });

        When('I render the hostile requirement bundle as markdown without H2 splitting', () => {
          state!.rendered = renderMarkdown(state!.input!, {
            disclosureLevel: 'useful',
            includeChildren: true,
            splitStrategy: 'never',
          });
        });

        Then('the requirement markdown should escape trusted interpolation values', () => {
          const rendered = assertRenderedRecord(state!.rendered);
          expect(rendered['REQUIREMENTS-EXECUTABLE.md']).toContain(
            '[RendererRequirement \\[trap\\]\\(javascript:alert\\(7\\)\\)](requirements-executable/renderer-package/renderer-threat.md)',
          );
          expect(rendered['requirements-executable/renderer-package/renderer-threat.md']).toContain(
            '**Status:** active \\*\\*bold\\*\\* \\[trap\\]\\(javascript:alert\\(8\\)\\)',
          );
          expect(rendered['requirements-executable/renderer-package/renderer-threat.md']).toContain(
            'Requirement body remains plain text.',
          );
        });
      },
    );
  });

  Rule(
    'Routed markdown output can auto-split oversized files at H2 boundaries',
    ({ RuleScenario }) => {
      RuleScenario(
        'Oversized routed output splits into child files with backlinks',
        ({ Given, When, Then, And }) => {
          Given(
            'a routed SectionedDocumentFixture bundle fixture that exceeds the markdown size budget',
            () => {
              state!.input = createSplitBundle();
            },
          );

          When('I render the bundle as markdown with an H2 size budget', () => {
            state!.renderEvents = [];
            state!.rendered = renderMarkdown(state!.input!, {
              includeChildren: true,
              sizeBudget: 12,
              splitStrategy: 'h2-boundary',
              onRenderDocument: (event) => state!.renderEvents.push(event),
            });
          });

          Then('the markdown output should be a routed file record', () => {
            const rendered = assertRenderedRecord(state!.rendered);
            expect(Object.keys(rendered)).toEqual([
              'guides/alpha-section.md',
              'guides/beta-section.md',
              'guides/gamma-section.md',
              'guides/renderer-guide.md',
              'INDEX.md',
            ]);
          });

          And('the oversized child file should split at H2 boundaries', () => {
            const rendered = assertRenderedRecord(state!.rendered);
            expect(rendered['guides/renderer-guide.md']).toBe(
              [
                '# Renderer Guide',
                '',
                '## Alpha Section',
                '',
                '[See Alpha Section](alpha-section.md)',
                '',
                '## Beta Section',
                '',
                '[See Beta Section](beta-section.md)',
                '',
                '## Gamma Section',
                '',
                '[See Gamma Section](gamma-section.md)',
                '',
              ].join('\n'),
            );
            expect(rendered['guides/alpha-section.md']).toContain(
              '[← Back to Renderer Guide](renderer-guide.md)',
            );
            expect(rendered['guides/beta-section.md']).toContain('Beta details stay together too.');
            expect(rendered['guides/gamma-section.md']).toContain(
              'Gamma details push the file over budget.',
            );
          });

          And('each split-path routed fragment should render at most twice', () => {
            const counts = new Map<string, number>();
            for (const event of state!.renderEvents) {
              counts.set(event.renderKey, (counts.get(event.renderKey) ?? 0) + 1);
            }

            expect(Object.fromEntries(counts.entries())).toEqual({
              'INDEX.md': 1,
              'guides/renderer-guide.md': 2,
              'guides/renderer-guide.md#0:alpha-section': 2,
              'guides/renderer-guide.md#1:beta-section': 2,
              'guides/renderer-guide.md#2:gamma-section': 2,
            });
            expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
          });
        },
      );
    },
  );

  Rule(
    'Routed documentation roots follow progressive disclosure policy',
    ({ RuleScenario, RuleScenarioOutline }) => {
      RuleScenario(
        'Documentation root pages render summary links instead of detail bodies',
        ({ Given, When, Then, And }) => {
          Given(
            'a routed business-rules SectionedDocumentFixture bundle with detailed children',
            () => {
              state!.input = createBusinessRulesDisclosureBundle();
            },
          );

          When('I render the bundle as markdown without H2 splitting', () => {
            state!.rendered = renderMarkdown(state!.input!, {
              includeChildren: true,
              splitStrategy: 'never',
            });
          });

          Then(
            'the documentation root should contain child links without full detail bodies',
            () => {
              const rendered = assertRenderedRecord(state!.rendered);
              expect(rendered['BUSINESS-RULES.md']).toContain('Canonical document types');
            },
          );

          And('the documentation detail child should retain its detail body', () => {
            const rendered = assertRenderedRecord(state!.rendered);
            expect(rendered['business-rules/projection-api.md']).toContain(
              'Full invariant detail stays in the child page.',
            );
          });
        },
      );

      RuleScenario(
        'business-rules root is navigation-only at default disclosure',
        ({ Given, When, Then, And }) => {
          Given('a routed BusinessRuleSet bundle grouped by package', () => {
            state!.input = createBusinessRuleSetDisclosureBundle();
          });

          When('I render the bundle as important business-rules markdown disclosure', () => {
            state!.rendered = renderMarkdown(state!.input!, {
              disclosureLevel: 'important',
              includeChildren: true,
              splitStrategy: 'never',
            });
          });

          Then('the business-rules root should contain a Packages counts table', () => {
            const rendered = assertRenderedRecord(state!.rendered);
            expect(rendered['BUSINESS-RULES.md']).toContain('## Packages');
            expect(rendered['BUSINESS-RULES.md']).toContain(
              '| Package              | Features | Rules | With Invariants |',
            );
          });

          And('the business-rules root should contain a Package Detail links section', () => {
            const rendered = assertRenderedRecord(state!.rendered);
            expect(rendered['BUSINESS-RULES.md']).toContain('## Package Detail');
            expect(rendered['BUSINESS-RULES.md']).toContain('[architect-cli](');
            expect(rendered['BUSINESS-RULES.md']).toContain('[architect-projection](');
          });

          And('the business-rules root should not contain a Rules table', () => {
            const rendered = assertRenderedRecord(state!.rendered);
            expect(rendered['BUSINESS-RULES.md']).not.toContain('## Rules');
          });

          And('the business-rules detail child should retain its Rules table', () => {
            const rendered = assertRenderedRecord(state!.rendered);
            expect(rendered['business-rules/architect-projection.md']).toContain('## Rules');
          });
        },
      );

      RuleScenario(
        'business-rules grouping labels stay plain text when route targets are rejected',
        ({ Given, When, Then, And }) => {
          Given('a routed BusinessRuleSet bundle with a hostile grouping label', () => {
            state!.input = createBusinessRuleSetHostileGroupingBundle();
          });

          When('I render the bundle with an unsafe business-rules route profile', () => {
            state!.rendered = renderMarkdown(state!.input!, {
              disclosureLevel: 'important',
              includeChildren: true,
              splitStrategy: 'never',
              routeProfile: {
                mapPath: (routeId) =>
                  routeId === 'business-rules:index' ? 'BUSINESS-RULES.md' : 'javascript:alert(10)',
              },
            });
          });

          Then(
            'the business-rules root should render the hostile grouping label as plain text',
            () => {
              const rendered = assertRenderedRecord(state!.rendered);
              expect(rendered['BUSINESS-RULES.md']).toContain(
                '| \\[CLI Trap\\]\\(javascript:alert\\(10\\)\\) | 1        | 1     | 1               |',
              );
              expect(rendered['BUSINESS-RULES.md']).not.toMatch(/\]\(\s*javascript:alert\(10\)\)/i);
              expect(rendered['BUSINESS-RULES.md']).not.toContain('## Package Detail');
            },
          );

          And('the routed output should not contain the rejected child path', () => {
            const rendered = assertRenderedRecord(state!.rendered);
            expect(rendered['javascript:alert(10)']).toBeUndefined();
          });
        },
      );

      RuleScenario(
        'business-rules routed output rejects traversal and absolute child paths',
        ({ Given, When, Then, And }) => {
          Given('a routed BusinessRuleSet bundle with a hostile grouping label', () => {
            state!.input = createBusinessRuleSetHostileGroupingBundle();
          });

          When('I render the bundle with traversal business-rules route targets', () => {
            state!.rendered = renderMarkdown(state!.input!, {
              disclosureLevel: 'important',
              includeChildren: true,
              splitStrategy: 'never',
              routeProfile: {
                mapPath: (routeId) => {
                  if (routeId === 'business-rules:index') {
                    return 'BUSINESS-RULES.md';
                  }

                  if (routeId === 'business-rules:architect-cli') {
                    return '../outside.md';
                  }

                  return '/tmp/absolute.md';
                },
              },
            });
          });

          Then('the business-rules root should render traversal labels as plain text', () => {
            const rendered = assertRenderedRecord(state!.rendered);
            expect(rendered['BUSINESS-RULES.md']).toContain(
              '| \\[CLI Trap\\]\\(javascript:alert\\(10\\)\\) | 1        | 1     | 1               |',
            );
            expect(rendered['BUSINESS-RULES.md']).not.toContain(
              '[architect-projection](/tmp/absolute.md)',
            );
            expect(rendered['BUSINESS-RULES.md']).not.toContain('## Package Detail');
          });

          And('the routed output should not contain traversal or absolute child paths', () => {
            const rendered = assertRenderedRecord(state!.rendered);
            expect(rendered['../outside.md']).toBeUndefined();
            expect(rendered['/tmp/absolute.md']).toBeUndefined();
          });
        },
      );

      RuleScenario(
        'business-rules root keeps projected grouping summary without emitted children',
        ({ Given, When, Then, And }) => {
          Given('a routed BusinessRuleSet bundle grouped by package', () => {
            state!.input = createBusinessRuleSetDisclosureBundle();
          });

          When(
            'I render the bundle as important business-rules markdown disclosure without child pages',
            () => {
              const importantDisclosure = withBundleDisclosureSpec(
                createBusinessRuleSetDisclosureBundle(),
                {
                  ...getSupportedDocumentationTypeMetadata('business-rules').disclosureMatrix
                    .important,
                  emitChildren: false,
                },
              );
              state!.input = importantDisclosure;
              state!.rendered = renderMarkdown(state!.input!, {
                disclosureLevel: 'important',
                includeChildren: false,
                splitStrategy: 'never',
              });
            },
          );

          Then('the business-rules root should contain a Packages counts table', () => {
            expect(typeof state!.rendered).toBe('string');
            const markdown = state!.rendered as string;
            expect(markdown).toContain('## Packages');
            expect(markdown).toContain(
              '| Package              | Features | Rules | With Invariants |',
            );
          });

          And('the business-rules root should not contain a Package Detail links section', () => {
            expect(typeof state!.rendered).toBe('string');
            const markdown = state!.rendered as string;
            expect(markdown).not.toContain('## Package Detail');
          });

          And('the business-rules root should not contain a Rules table', () => {
            expect(typeof state!.rendered).toBe('string');
            const markdown = state!.rendered as string;
            expect(markdown).not.toContain('## Rules');
          });
        },
      );

      RuleScenarioOutline(
        'BusinessRule table column count per richness',
        ({ Given, When, Then }, examples: Record<string, unknown>) => {
          Given('a BusinessRuleSet bundle of 3 rules', () => void 0);

          When('I render the bundle to markdown at disclosure {string}', () => {
            const level = examples['level'] as 'essential' | 'important' | 'useful' | 'advanced';
            state!.input = createBusinessRuleSetRichnessFixture(
              getSupportedDocumentationTypeMetadata('business-rules').disclosureMatrix[level],
            );
            state!.rendered = renderMarkdown(state!.input!, {
              disclosureLevel: level,
              includeChildren: false,
              splitStrategy: 'never',
            });
          });

          Then('the rendered markdown should use the expected <columns> rule table columns', () => {
            expect(typeof state!.rendered).toBe('string');
            const markdown = state!.rendered as string;
            expect(countRuleTableColumns(markdown)).toBe(Number(examples['columns']));
          });
        },
      );

      RuleScenario(
        'Duplicate routed child paths are disambiguated by stable child ids',
        ({ Given, When, Then, And }) => {
          Given(
            'a routed SectionedDocumentFixture bundle whose children request duplicate paths',
            () => {
              state!.input = createDuplicatePathBundle();
            },
          );

          When('I render the bundle as markdown without H2 splitting', () => {
            state!.rendered = renderMarkdown(state!.input!, {
              disclosureLevel: 'useful',
              includeChildren: true,
              splitStrategy: 'never',
            });
          });

          Then('the duplicate child paths should be deterministically disambiguated', () => {
            const rendered = assertRenderedRecord(state!.rendered);
            expect(Object.keys(rendered)).toEqual([
              'PATTERNS.md',
              'patterns/detail--second-pattern.md',
              'patterns/detail.md',
            ]);
            expect(rendered['patterns/detail.md']).toContain('First detail body.');
            expect(rendered['patterns/detail--second-pattern.md']).toContain('Second detail body.');
          });

          And('root child links should target the disambiguated paths', () => {
            const rendered = assertRenderedRecord(state!.rendered);
            expect(rendered['PATTERNS.md']).toContain('[First Pattern](patterns/detail.md)');
            expect(rendered['PATTERNS.md']).toContain(
              '[Second Pattern](patterns/detail--second-pattern.md)',
            );
          });
        },
      );

      RuleScenario(
        'Duplicate child route ids do not resolve to an arbitrary child link',
        ({ Given, When, Then }) => {
          Given(
            'a routed SectionedDocumentFixture bundle whose children request duplicate paths',
            () => {
              state!.input = createDuplicatePathBundle();
            },
          );

          When('I render the bundle as markdown without H2 splitting', () => {
            state!.rendered = renderMarkdown(state!.input!, {
              disclosureLevel: 'useful',
              includeChildren: true,
              splitStrategy: 'never',
            });
          });

          Then('ambiguous route-id references should stay plain text', () => {
            const rendered = assertRenderedRecord(state!.rendered);
            expect(rendered['PATTERNS.md']).toContain('Ambiguous Detail Alias');
            expect(rendered['PATTERNS.md']).not.toContain('[Ambiguous Detail Alias](');
          });
        },
      );

      RuleScenario(
        'Child keys that collide with route-id aliases stay plain text',
        ({ Given, When, Then }) => {
          Given(
            'a routed SectionedDocumentFixture bundle with a child-key and route-id collision',
            () => {
              state!.input = createRouteIdCollisionBundle();
            },
          );

          When('I render the bundle as markdown without H2 splitting', () => {
            state!.rendered = renderMarkdown(state!.input!, {
              disclosureLevel: 'useful',
              includeChildren: true,
              splitStrategy: 'never',
            });
          });

          Then('route-id collisions with child keys should stay plain text', () => {
            const rendered = assertRenderedRecord(state!.rendered);
            expect(rendered['PATTERNS.md']).toContain('Colliding Alias');
            expect(rendered['PATTERNS.md']).not.toContain('[Colliding Alias](');
          });
        },
      );

      RuleScenario(
        'Requirements executable root renders summary links instead of requirement bodies',
        ({ Given, When, Then, And }) => {
          Given(
            'a routed requirements-executable SectionedDocumentFixture bundle with detailed children',
            () => {
              state!.input = createRequirementsDisclosureBundle('requirements-executable');
            },
          );

          When('I render the bundle as markdown without H2 splitting', () => {
            state!.rendered = renderMarkdown(state!.input!, {
              disclosureLevel: 'useful',
              includeChildren: true,
              splitStrategy: 'never',
            });
          });

          Then(
            'the requirements-executable root should link to requirement detail children without full requirement bodies',
            () => {
              const rendered = assertRenderedRecord(state!.rendered);
              expect(rendered['REQUIREMENTS-EXECUTABLE.md']).toContain(
                '[RendererExecutableRequirement](requirements-executable/renderer-package/renderer-requirement.md)',
              );
              expect(rendered['REQUIREMENTS-EXECUTABLE.md']).toContain(
                'RendererExecutableRequirement',
              );
              expect(rendered['REQUIREMENTS-EXECUTABLE.md']).not.toContain(
                'RendererExecutableRequirement full requirement body is retained in the detail page.',
              );
            },
          );

          And('the requirements-executable detail child should retain its requirement body', () => {
            const rendered = assertRenderedRecord(state!.rendered);
            expect(
              rendered['requirements-executable/renderer-package/renderer-requirement.md'],
            ).toContain(
              'RendererExecutableRequirement full requirement body is retained in the detail page.',
            );
          });
        },
      );

      RuleScenario(
        'requirements-executable routed output rejects traversal child paths',
        ({ Given, When, Then, And }) => {
          Given(
            'a routed requirements-executable SectionedDocumentFixture bundle with detailed children',
            () => {
              state!.input = createRequirementsDisclosureBundle('requirements-executable');
            },
          );

          When('I render the requirements-executable bundle with traversal route targets', () => {
            state!.rendered = renderMarkdown(state!.input!, {
              disclosureLevel: 'useful',
              includeChildren: true,
              splitStrategy: 'never',
              routeProfile: {
                mapPath: (routeId) =>
                  routeId === 'requirements-executable:index'
                    ? 'REQUIREMENTS-EXECUTABLE.md'
                    : '../outside.md',
              },
            });
          });

          Then(
            'the requirements-executable root should keep requirement references as plain text',
            () => {
              const rendered = assertRenderedRecord(state!.rendered);
              expect(rendered['REQUIREMENTS-EXECUTABLE.md']).toContain(
                'RendererExecutableRequirement',
              );
              expect(rendered['REQUIREMENTS-EXECUTABLE.md']).not.toContain(
                '[RendererExecutableRequirement](../outside.md)',
              );
            },
          );

          And(
            'the requirements-executable routed output should not contain the rejected child path',
            () => {
              const rendered = assertRenderedRecord(state!.rendered);
              expect(rendered['../outside.md']).toBeUndefined();
            },
          );
        },
      );

      RuleScenario(
        'requirements-executable routed output rejects encoded traversal child paths',
        ({ Given, When, Then, And }) => {
          Given(
            'a routed requirements-executable SectionedDocumentFixture bundle with detailed children',
            () => {
              state!.input = createRequirementsDisclosureBundle('requirements-executable');
            },
          );

          When(
            'I render the requirements-executable bundle with encoded traversal route targets',
            () => {
              state!.rendered = renderMarkdown(state!.input!, {
                disclosureLevel: 'useful',
                includeChildren: true,
                splitStrategy: 'never',
                routeProfile: {
                  mapPath: (routeId) =>
                    routeId === 'requirements-executable:index'
                      ? 'REQUIREMENTS-EXECUTABLE.md'
                      : '..%2Foutside.md',
                },
              });
            },
          );

          Then(
            'the requirements-executable root should keep encoded-traversal references as plain text',
            () => {
              const rendered = assertRenderedRecord(state!.rendered);
              expect(rendered['REQUIREMENTS-EXECUTABLE.md']).toContain(
                'RendererExecutableRequirement',
              );
              expect(rendered['REQUIREMENTS-EXECUTABLE.md']).not.toContain(
                '[RendererExecutableRequirement](..%2Foutside.md)',
              );
            },
          );

          And(
            'the requirements-executable routed output should not contain the encoded rejected child path',
            () => {
              const rendered = assertRenderedRecord(state!.rendered);
              expect(rendered['..%2Foutside.md']).toBeUndefined();
            },
          );
        },
      );

      RuleScenario(
        'requirements-executable routed output rejects encoded control-byte child paths',
        ({ Given, When, Then, And }) => {
          Given(
            'a routed requirements-executable SectionedDocumentFixture bundle with detailed children',
            () => {
              state!.input = createRequirementsDisclosureBundle('requirements-executable');
            },
          );

          When(
            'I render the requirements-executable bundle with encoded control-byte route targets',
            () => {
              state!.rendered = renderMarkdown(state!.input!, {
                disclosureLevel: 'useful',
                includeChildren: true,
                splitStrategy: 'never',
                routeProfile: {
                  mapPath: (routeId) =>
                    routeId === 'requirements-executable:index'
                      ? 'REQUIREMENTS-EXECUTABLE.md'
                      : '%09renderer.md',
                },
              });
            },
          );

          Then(
            'the requirements-executable root should keep encoded-control references as plain text',
            () => {
              const rendered = assertRenderedRecord(state!.rendered);
              expect(rendered['REQUIREMENTS-EXECUTABLE.md']).toContain(
                'RendererExecutableRequirement',
              );
              expect(rendered['REQUIREMENTS-EXECUTABLE.md']).not.toContain(
                '[RendererExecutableRequirement](%09renderer.md)',
              );
            },
          );

          And(
            'the requirements-executable routed output should not contain the encoded control-byte child path',
            () => {
              const rendered = assertRenderedRecord(state!.rendered);
              expect(rendered['%09renderer.md']).toBeUndefined();
            },
          );
        },
      );

      RuleScenario(
        'requirements-executable routed output rejects non-markdown and padded child paths',
        ({ Given, When, Then, And }) => {
          Given(
            'a routed requirements-executable SectionedDocumentFixture bundle with detailed children',
            () => {
              state!.input =
                createRequirementsDisclosureBundleWithRejectedChildren('requirements-executable');
            },
          );

          When(
            'I render the requirements-executable bundle with non-markdown and padded route targets',
            () => {
              state!.rendered = renderMarkdown(state!.input!, {
                disclosureLevel: 'useful',
                includeChildren: true,
                splitStrategy: 'never',
                routeProfile: {
                  mapPath: (routeId) =>
                    routeId === 'requirements-executable:index'
                      ? 'REQUIREMENTS-EXECUTABLE.md'
                      : routeId.endsWith('renderer-requirement')
                        ? ' renderer.md '
                        : 'renderer.txt',
                },
              });
            },
          );

          Then(
            'the requirements-executable root should keep rejected child references as plain text',
            () => {
              const rendered = assertRenderedRecord(state!.rendered);
              expect(rendered['REQUIREMENTS-EXECUTABLE.md']).toContain(
                'RendererExecutableRequirement',
              );
              expect(rendered['REQUIREMENTS-EXECUTABLE.md']).toContain(
                'RendererExecutableRequirementTxt',
              );
              expect(rendered['REQUIREMENTS-EXECUTABLE.md']).not.toContain(
                '[RendererExecutableRequirement](',
              );
              expect(rendered['REQUIREMENTS-EXECUTABLE.md']).not.toContain(
                '[RendererExecutableRequirementTxt](',
              );
            },
          );

          And(
            'the requirements-executable routed output should not contain non-markdown or padded child paths',
            () => {
              const rendered = assertRenderedRecord(state!.rendered);
              expect(rendered[' renderer.md ']).toBeUndefined();
              expect(rendered['renderer.txt']).toBeUndefined();
            },
          );
        },
      );

      RuleScenario(
        'requirements-executable routed output normalizes padded valid root paths',
        ({ Given, When, Then }) => {
          Given(
            'a routed requirements-executable SectionedDocumentFixture bundle with detailed children',
            () => {
              state!.input = createRequirementsDisclosureBundle('requirements-executable');
            },
          );

          When(
            'I render the requirements-executable bundle with a padded valid root route target',
            () => {
              state!.rendered = renderMarkdown(state!.input!, {
                disclosureLevel: 'useful',
                includeChildren: true,
                splitStrategy: 'never',
                routeProfile: {
                  mapPath: (routeId) =>
                    routeId === 'requirements-executable:index'
                      ? ' REQUIREMENTS-EXECUTABLE.md '
                      : 'requirements-executable/renderer-package/renderer-requirement.md',
                },
              });
            },
          );

          Then(
            'the requirements-executable routed output should normalize the root markdown path',
            () => {
              const rendered = assertRenderedRecord(state!.rendered);
              expect(rendered['REQUIREMENTS-EXECUTABLE.md']).toBeDefined();
              expect(rendered[' REQUIREMENTS-EXECUTABLE.md ']).toBeUndefined();
            },
          );
        },
      );

      RuleScenario(
        'Requirements specs root renders summary links instead of requirement bodies',
        ({ Given, When, Then, And }) => {
          Given(
            'a routed requirements-specs SectionedDocumentFixture bundle with detailed children',
            () => {
              state!.input = createRequirementsDisclosureBundle('requirements-specs');
            },
          );

          When('I render the bundle as markdown without H2 splitting', () => {
            state!.rendered = renderMarkdown(state!.input!, {
              disclosureLevel: 'useful',
              includeChildren: true,
              splitStrategy: 'never',
            });
          });

          Then(
            'the requirements-specs root should link to requirement detail children without full requirement bodies',
            () => {
              const rendered = assertRenderedRecord(state!.rendered);
              expect(rendered['REQUIREMENTS-SPECS.md']).toContain(
                '[RendererSpecsRequirement](requirements-specs/renderer-requirement.md)',
              );
              expect(rendered['REQUIREMENTS-SPECS.md']).toContain('RendererSpecsRequirement');
              expect(rendered['REQUIREMENTS-SPECS.md']).not.toContain(
                'RendererSpecsRequirement full requirement body is retained in the detail page.',
              );
            },
          );

          And('the requirements-specs detail child should retain its requirement body', () => {
            const rendered = assertRenderedRecord(state!.rendered);
            expect(rendered['requirements-specs/renderer-requirement.md']).toContain(
              'RendererSpecsRequirement full requirement body is retained in the detail page.',
            );
          });
        },
      );
    },
  );
});

describe('renderMarkdown adversarial security coverage', () => {
  it('uses bundle routing disclosure instead of a per-render-call override', () => {
    const bundle = createBusinessRuleSetDisclosureBundle();
    const rendered = renderMarkdown(bundle, {
      disclosureLevel: 'important',
      disclosureSpec: {
        grouping: 'flat',
        richness: 'full',
        emitChildren: true,
        committed: true,
      },
      includeChildren: true,
      splitStrategy: 'never',
    });

    const markdown = assertRenderedRecord(rendered)['BUSINESS-RULES.md'];
    expect(markdown).toContain('## Package Detail');
    expect(markdown).not.toContain('## Rules');
  });

  it('uses five-backtick fences when code and mermaid content contains four-backtick runs', () => {
    const rendered = renderMarkdown(
      documentationFixtureToFragment({
        kind: 'SectionedDocumentFixture',
        documentType: 'security',
        title: 'Fence Security',
        sections: [
          {
            id: 'fences',
            title: 'Fences',
            blocks: [
              { type: 'code', language: 'ts', content: 'const nested = "````";' },
              { type: 'mermaid', content: 'graph TD; A[````] --> B[ok]' },
            ],
          },
        ],
      }),
    );

    const markdown = assertRenderedString(rendered);
    expect(markdown).toContain('`````ts\nconst nested = "````";\n`````');
    expect(markdown).toContain('`````mermaid\ngraph TD; A[````] --> B[ok]\n`````');
  });

  it('renders data URL link targets as plain text', () => {
    const rendered = renderMarkdown(
      documentationFixtureToFragment({
        kind: 'SectionedDocumentFixture',
        documentType: 'security',
        title: 'Link Security',
        sections: [
          {
            id: 'links',
            title: 'Links',
            blocks: [
              { type: 'link-out', text: 'Data URL', path: 'data:text/html,<script>x</script>' },
            ],
          },
        ],
      }),
    );

    const markdown = assertRenderedString(rendered);
    expect(markdown).toContain('Data URL');
    expect(markdown).not.toContain('[Data URL](');
  });

  it('renders file URL link targets as plain text', () => {
    const rendered = renderMarkdown(
      documentationFixtureToFragment({
        kind: 'SectionedDocumentFixture',
        documentType: 'security',
        title: 'Link Security',
        sections: [
          {
            id: 'links',
            title: 'Links',
            blocks: [{ type: 'link-out', text: 'File URL', path: 'file:///etc/passwd' }],
          },
        ],
      }),
    );

    const markdown = assertRenderedString(rendered);
    expect(markdown).toContain('File URL');
    expect(markdown).not.toContain('[File URL](');
  });

  it('renders entity-encoded javascript URL link targets as plain text', () => {
    const rendered = renderMarkdown(
      documentationFixtureToFragment({
        kind: 'SectionedDocumentFixture',
        documentType: 'security',
        title: 'Link Security',
        sections: [
          {
            id: 'links',
            title: 'Links',
            blocks: [
              { type: 'link-out', text: 'Encoded JavaScript', path: 'javascript&#x3a;alert(1)' },
            ],
          },
        ],
      }),
    );

    const markdown = assertRenderedString(rendered);
    expect(markdown).toContain('Encoded JavaScript');
    expect(markdown).not.toContain('[Encoded JavaScript](');
  });

  it('renders control-character link targets as plain text', () => {
    const rendered = renderMarkdown(
      documentationFixtureToFragment({
        kind: 'SectionedDocumentFixture',
        documentType: 'security',
        title: 'Link Security',
        sections: [
          {
            id: 'links',
            title: 'Links',
            blocks: [
              { type: 'link-out', text: 'Control Target', path: 'https://example.com/\u0000x' },
            ],
          },
        ],
      }),
    );

    const markdown = assertRenderedString(rendered);
    expect(markdown).toContain('Control Target');
    expect(markdown).not.toContain('[Control Target](');
  });
});
