/**
 * Architect package configuration.
 *
 * Unified config replacing repeated CLI globs across 15+ package.json scripts.
 * Uses @architect- prefix with simplified 3-category taxonomy.
 *
 * Categories:
 * - @architect-core: Core patterns and utilities
 * - @architect-api: Public API exports
 * - @architect-infra: Infrastructure and configuration
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

const processGuardPreamble = loadPreambleFromMarkdown(
  'docs-sources/process-guard.md'
);

const configurationGuidePreamble = loadPreambleFromMarkdown(
  'docs-sources/configuration-guide.md'
);

const validationToolsGuidePreamble = loadPreambleFromMarkdown(
  'docs-sources/validation-tools-guide.md'
);

const gherkinPatternsPreamble = loadPreambleFromMarkdown(
  'docs-sources/gherkin-patterns.md'
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
  { title: 'Architecture Types', path: 'reference/ARCHITECTURE-TYPES.md', description: 'PatternGraph interface and type shapes', audience: 'Developers', topic: 'Reference Guides' },
  { title: 'Configuration Guide', path: 'reference/CONFIGURATION-GUIDE.md', description: 'Presets, config files, sources, output, and monorepo setup', audience: 'Users', topic: 'Reference Guides' },
  { title: 'Validation Tools Guide', path: 'reference/VALIDATION-TOOLS-GUIDE.md', description: 'lint-patterns, lint-steps, lint-process, validate-patterns reference', audience: 'CI/CD', topic: 'Reference Guides' },
  { title: 'Gherkin Authoring Guide', path: 'reference/GHERKIN-AUTHORING-GUIDE.md', description: 'Roadmap specs, Rule blocks, DataTables, tag conventions', audience: 'Developers', topic: 'Reference Guides' },
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
    stubs: ['architect/stubs/**/*.ts'],
    features: [
      'architect/specs/*.feature',
      'architect/decisions/*.feature',
      'architect/releases/*.feature',
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
      behaviorCategories: [],
      claudeMdSection: 'validation',
      docsFilename: 'PROCESS-GUARD-REFERENCE.md',
      claudeMdFilename: 'process-guard.md',
      preamble: [...processGuardPreamble],
    },
    {
      title: 'Available Codecs Reference',
      conventionTags: ['codec-registry'],
      behaviorCategories: [],
      claudeMdSection: 'architecture',
      docsFilename: 'ARCHITECTURE-CODECS.md',
      claudeMdFilename: 'architecture-codecs.md',
    },
    {
      title: 'Architecture Types Reference',
      conventionTags: ['pipeline-architecture'],
      shapeSelectors: [{ group: 'pattern-graph' }],
      behaviorCategories: [],
      shapesFirst: true,
      claudeMdSection: 'architecture',
      docsFilename: 'ARCHITECTURE-TYPES.md',
      claudeMdFilename: 'architecture-types.md',
      diagramScopes: [
        {
          title: 'PatternGraph View Fan-out',
          source: 'pattern-graph-views',
        },
      ],
    },
    {
      title: 'Reference Generation Sample',
      conventionTags: ['taxonomy-rules'],
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
      behaviorCategories: [],
      claudeMdSection: 'annotation',
      docsFilename: 'ANNOTATION-REFERENCE.md',
      claudeMdFilename: 'annotation-reference.md',
      preamble: [...annotationGuidePreamble],
    },
    {
      title: 'Configuration Guide',
      conventionTags: [],
      behaviorCategories: [],
      claudeMdSection: 'configuration',
      docsFilename: 'CONFIGURATION-GUIDE.md',
      claudeMdFilename: 'configuration-guide.md',
      preamble: [...configurationGuidePreamble],
    },
    {
      title: 'Validation Tools Guide',
      conventionTags: [],
      behaviorCategories: [],
      claudeMdSection: 'validation',
      docsFilename: 'VALIDATION-TOOLS-GUIDE.md',
      claudeMdFilename: 'validation-tools-guide.md',
      preamble: [...validationToolsGuidePreamble],
    },
    {
      title: 'Gherkin Authoring Guide',
      conventionTags: [],
      behaviorCategories: [],
      claudeMdSection: 'authoring',
      docsFilename: 'GHERKIN-AUTHORING-GUIDE.md',
      claudeMdFilename: 'gherkin-authoring-guide.md',
      preamble: [...gherkinPatternsPreamble],
    },
  ],
  generatorOverrides: {
    'business-rules': {
      replaceFeatures: ['tests/features/**/*.feature'],
      outputDirectory: 'docs-live',
    },
    changelog: {
      additionalFeatures: ['architect/decisions/*.feature'],
      outputDirectory: 'docs-live',
    },
    architecture: {
      outputDirectory: 'docs-live',
    },
    'doc-from-decision': {
      replaceFeatures: ['architect/decisions/*.feature'],
    },
    'reference-docs': {
      additionalFeatures: ['architect/decisions/*.feature'],
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
    'design-review': {
      outputDirectory: 'architect',
    },
  },
  codecOptions: {
    index: {
      preamble: [...indexNavigationPreamble],
      documentEntries: [...INDEX_DOCUMENT_ENTRIES],
    },
  },
});
