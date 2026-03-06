/**
 * Delivery-process package configuration.
 *
 * Unified config replacing repeated CLI globs across 15+ package.json scripts.
 * Uses @libar-docs- prefix with simplified 3-category taxonomy.
 *
 * Categories:
 * - @libar-docs-core: Core patterns and utilities
 * - @libar-docs-api: Public API exports
 * - @libar-docs-infra: Infrastructure and configuration
 */
import { defineConfig } from './src/config/define-config.js';
import { createProductAreaConfigs } from './src/generators/built-in/reference-generators.js';
import { loadPreambleFromMarkdown } from './src/renderable/load-preamble.js';
import type { DocumentEntry } from './src/renderable/codecs/index-codec.js';

const sessionWorkflowGuidePreamble = loadPreambleFromMarkdown(
  'docs-sources/session-workflow-guide.md'
);

const annotationGuidePreamble = loadPreambleFromMarkdown(
  'docs-sources/annotation-guide.md'
);

const indexNavigationPreamble = loadPreambleFromMarkdown(
  'docs-sources/index-navigation.md'
);

// DD-2: Document entries configured statically, not via filesystem discovery.
// All paths are relative to docs-live/ (where INDEX.md is generated).
const INDEX_DOCUMENT_ENTRIES: readonly DocumentEntry[] = [
  // --- Overview ---
  { title: 'Architecture', path: 'ARCHITECTURE.md', description: 'Architecture diagram from source annotations', audience: 'Developers', topic: 'Overview' },
  { title: 'Product Areas', path: 'PRODUCT-AREAS.md', description: 'Product area overviews with live statistics and diagrams', audience: 'Everyone', topic: 'Overview' },
  { title: 'Taxonomy', path: 'TAXONOMY.md', description: 'Tag taxonomy configuration and format types', audience: 'Reference', topic: 'Overview' },
  { title: 'Changelog', path: 'CHANGELOG-GENERATED.md', description: 'Project changelog from release specs', audience: 'Everyone', topic: 'Overview' },
  // --- Governance ---
  { title: 'Decisions', path: 'DECISIONS.md', description: 'Architecture Decision Records extracted from specs', audience: 'Developers', topic: 'Governance' },
  { title: 'Business Rules', path: 'BUSINESS-RULES.md', description: 'Domain constraints and invariants from feature files', audience: 'Developers', topic: 'Governance' },
  { title: 'Validation Rules', path: 'VALIDATION-RULES.md', description: 'Process Guard validation rules and FSM reference', audience: 'CI/CD', topic: 'Governance' },
  // --- Reference Guides ---
  { title: 'Annotation Reference', path: 'reference/ANNOTATION-REFERENCE.md', description: 'Annotation mechanics, shape extraction, tag reference', audience: 'Developers', topic: 'Reference Guides' },
  { title: 'Session Workflow Guide', path: 'reference/SESSION-WORKFLOW-GUIDE.md', description: 'Planning, Design, Implementation session workflows', audience: 'AI/Devs', topic: 'Reference Guides' },
  { title: 'Process API Reference', path: 'reference/PROCESS-API-REFERENCE.md', description: 'CLI command reference with flags and examples', audience: 'AI/Devs', topic: 'Reference Guides' },
  { title: 'Process API Recipes', path: 'reference/PROCESS-API-RECIPES.md', description: 'CLI workflow recipes and session guides', audience: 'AI/Devs', topic: 'Reference Guides' },
  { title: 'Process Guard Reference', path: 'reference/PROCESS-GUARD-REFERENCE.md', description: 'Pre-commit hooks, error codes, programmatic API', audience: 'Team Leads', topic: 'Reference Guides' },
  { title: 'Architecture Codecs', path: 'reference/ARCHITECTURE-CODECS.md', description: 'All codecs with factory patterns and options', audience: 'Developers', topic: 'Reference Guides' },
  { title: 'Architecture Types', path: 'reference/ARCHITECTURE-TYPES.md', description: 'MasterDataset interface and type shapes', audience: 'Developers', topic: 'Reference Guides' },
  // --- Product Area Details ---
  { title: 'Annotation', path: 'product-areas/ANNOTATION.md', description: 'Annotation product area patterns and statistics', audience: 'Developers', topic: 'Product Area Details' },
  { title: 'Configuration', path: 'product-areas/CONFIGURATION.md', description: 'Configuration product area patterns and statistics', audience: 'Users', topic: 'Product Area Details' },
  { title: 'Core Types', path: 'product-areas/CORE-TYPES.md', description: 'Core types product area patterns and statistics', audience: 'Developers', topic: 'Product Area Details' },
  { title: 'Data API', path: 'product-areas/DATA-API.md', description: 'Data API product area patterns and statistics', audience: 'AI/Devs', topic: 'Product Area Details' },
  { title: 'Generation', path: 'product-areas/GENERATION.md', description: 'Generation product area patterns and statistics', audience: 'Developers', topic: 'Product Area Details' },
  { title: 'Process', path: 'product-areas/PROCESS.md', description: 'Process product area patterns and statistics', audience: 'Team Leads', topic: 'Product Area Details' },
  { title: 'Validation', path: 'product-areas/VALIDATION.md', description: 'Validation product area patterns and statistics', audience: 'CI/CD', topic: 'Product Area Details' },
];

export default defineConfig({
  preset: 'libar-generic',
  sources: {
    typescript: ['src/**/*.ts'],
    stubs: ['delivery-process/stubs/**/*.ts'],
    features: [
      'delivery-process/specs/*.feature',
      'delivery-process/decisions/*.feature',
      'delivery-process/releases/*.feature',
      'tests/features/**/*.feature',
    ],
  },
  output: {
    directory: 'docs-generated',
    overwrite: true,
  },
  referenceDocConfigs: [
    // Product area overview docs (ADR-001 canonical values)
    // Output redirected to docs-live/ via product-area-docs generatorOverride
    ...createProductAreaConfigs(),
    {
      title: 'Process Guard Reference',
      conventionTags: ['process-guard-errors'],
      shapeSources: [],
      behaviorCategories: [],
      claudeMdSection: 'validation',
      docsFilename: 'PROCESS-GUARD-REFERENCE.md',
      claudeMdFilename: 'process-guard.md',
      preamble: [
        // --- Pre-commit Setup ---
        {
          type: 'heading' as const,
          level: 2,
          text: 'Pre-commit Setup',
        },
        {
          type: 'paragraph' as const,
          text: 'Configure Process Guard as a pre-commit hook using Husky.',
        },
        {
          type: 'code' as const,
          language: 'bash',
          content:
            '#!/usr/bin/env sh\n. "$(dirname -- "$0")/_/husky.sh"\n\nnpx lint-process --staged',
        },
        {
          type: 'heading' as const,
          level: 3,
          text: 'package.json Scripts',
        },
        {
          type: 'code' as const,
          language: 'json',
          content: JSON.stringify(
            {
              scripts: {
                'lint:process': 'lint-process --staged',
                'lint:process:ci': 'lint-process --all --strict',
              },
            },
            null,
            2
          ),
        },
        // --- Programmatic API ---
        {
          type: 'heading' as const,
          level: 2,
          text: 'Programmatic API',
        },
        {
          type: 'paragraph' as const,
          text: 'Use Process Guard programmatically for custom validation workflows.',
        },
        {
          type: 'code' as const,
          language: 'typescript',
          content: [
            "import {",
            "  deriveProcessState,",
            "  detectStagedChanges,",
            "  validateChanges,",
            "  hasErrors,",
            "  summarizeResult,",
            "} from '@libar-dev/delivery-process/lint';",
            "",
            "// 1. Derive state from annotations",
            "const state = (await deriveProcessState({ baseDir: '.' })).value;",
            "",
            "// 2. Detect changes",
            "const changes = detectStagedChanges('.').value;",
            "",
            "// 3. Validate",
            "const { result } = validateChanges({",
            "  state,",
            "  changes,",
            "  options: { strict: false, ignoreSession: false },",
            "});",
            "",
            "// 4. Handle results",
            "if (hasErrors(result)) {",
            "  console.log(summarizeResult(result));",
            "  process.exit(1);",
            "}",
          ].join('\n'),
        },
        {
          type: 'heading' as const,
          level: 3,
          text: 'API Functions',
        },
        {
          type: 'table' as const,
          columns: ['Category', 'Function', 'Description'],
          rows: [
            ['State', 'deriveProcessState(cfg)', 'Build state from file annotations'],
            ['Changes', 'detectStagedChanges(dir)', 'Parse staged git diff'],
            ['Changes', 'detectBranchChanges(dir)', 'Parse all changes vs main'],
            ['Validate', 'validateChanges(input)', 'Run all validation rules'],
            ['Results', 'hasErrors(result)', 'Check for blocking errors'],
            ['Results', 'summarizeResult(result)', 'Human-readable summary'],
          ],
        },
        // --- Architecture ---
        {
          type: 'heading' as const,
          level: 2,
          text: 'Architecture',
        },
        {
          type: 'paragraph' as const,
          text: 'Process Guard uses the Decider pattern: pure functions with no I/O.',
        },
        {
          type: 'mermaid' as const,
          content: [
            'graph LR',
            '    A[deriveProcessState] --> C[validateChanges]',
            '    B[detectChanges] --> C',
            '    C --> D[ValidationResult]',
          ].join('\n'),
        },
      ],
    },
    {
      title: 'Available Codecs Reference',
      conventionTags: ['codec-registry'],
      shapeSources: [],
      behaviorCategories: [],
      claudeMdSection: 'architecture',
      docsFilename: 'ARCHITECTURE-CODECS.md',
      claudeMdFilename: 'architecture-codecs.md',
    },
    {
      title: 'Architecture Types Reference',
      conventionTags: ['pipeline-architecture'],
      shapeSources: [],
      shapeSelectors: [{ group: 'master-dataset' }],
      behaviorCategories: [],
      shapesFirst: true,
      claudeMdSection: 'architecture',
      docsFilename: 'ARCHITECTURE-TYPES.md',
      claudeMdFilename: 'architecture-types.md',
      diagramScopes: [
        {
          title: 'MasterDataset View Fan-out',
          source: 'master-dataset-views',
        },
      ],
    },
    {
      title: 'Reference Generation Sample',
      conventionTags: ['taxonomy-rules'],
      shapeSources: [],
      shapeSelectors: [
        { group: 'reference-sample' },
      ],
      behaviorCategories: [],
      includeTags: ['reference-sample'],
      diagramScopes: [
        {
          include: ['reference-sample'],
          direction: 'TB',
          title: 'Configuration Components',
        },
        {
          title: 'Generation Pipeline',
          diagramType: 'sequenceDiagram',
          source: 'generation-pipeline',
        },
        {
          archContext: ['generator'],
          title: 'Generator Class Model',
          diagramType: 'classDiagram',
        },
        {
          title: 'Delivery Lifecycle FSM',
          diagramType: 'stateDiagram-v2',
          source: 'fsm-lifecycle',
        },
        {
          archContext: ['scanner', 'extractor'],
          title: 'Scanning & Extraction Boundary',
          diagramType: 'C4Context',
        },
        {
          archLayer: ['domain'],
          direction: 'LR',
          title: 'Domain Layer Overview',
        },
      ],
      claudeMdSection: 'architecture',
      docsFilename: 'REFERENCE-SAMPLE.md',
      claudeMdFilename: 'reference-sample.md',
    },
    {
      title: 'Session Workflow Guide',
      conventionTags: [],
      shapeSources: [],
      behaviorCategories: [],
      includeTags: ['session-workflows'],
      claudeMdSection: 'workflow',
      docsFilename: 'SESSION-WORKFLOW-GUIDE.md',
      claudeMdFilename: 'session-workflow-guide.md',
      preamble: [...sessionWorkflowGuidePreamble],
    },
    {
      title: 'Annotation Reference Guide',
      conventionTags: ['annotation-system'],
      shapeSources: [],
      behaviorCategories: [],
      claudeMdSection: 'annotation',
      docsFilename: 'ANNOTATION-REFERENCE.md',
      claudeMdFilename: 'annotation-reference.md',
      preamble: [...annotationGuidePreamble],
    },
  ],
  generatorOverrides: {
    'business-rules': {
      replaceFeatures: ['tests/features/**/*.feature'],
      outputDirectory: 'docs-live',
    },
    changelog: {
      additionalFeatures: ['delivery-process/decisions/*.feature'],
      outputDirectory: 'docs-live',
    },
    architecture: {
      outputDirectory: 'docs-live',
    },
    'doc-from-decision': {
      replaceFeatures: ['delivery-process/decisions/*.feature'],
    },
    'reference-docs': {
      additionalFeatures: ['delivery-process/decisions/*.feature'],
      outputDirectory: 'docs-live',
    },
    'product-area-docs': {
      outputDirectory: 'docs-live',
    },
    adrs: {
      outputDirectory: 'docs-live',
    },
    taxonomy: {
      outputDirectory: 'docs-live',
    },
    'validation-rules': {
      outputDirectory: 'docs-live',
    },
    requirements: {
      outputDirectory: 'docs-live',
    },
    'claude-modules': {
      outputDirectory: '_claude-md',
    },
    'process-api-reference': {
      outputDirectory: 'docs-live',
    },
    'cli-recipe': {
      outputDirectory: 'docs-live',
    },
    index: {
      outputDirectory: 'docs-live',
    },
  },
  codecOptions: {
    index: {
      preamble: [...indexNavigationPreamble],
      documentEntries: [...INDEX_DOCUMENT_ENTRIES],
    },
  },
});
