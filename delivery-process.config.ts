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
  ],
  generatorOverrides: {
    'business-rules': {
      replaceFeatures: ['tests/features/**/*.feature'],
    },
    changelog: {
      additionalFeatures: ['delivery-process/decisions/*.feature'],
    },
    'doc-from-decision': {
      replaceFeatures: ['delivery-process/decisions/*.feature'],
    },
    'reference-docs': {
      additionalFeatures: ['delivery-process/decisions/*.feature'],
    },
    'product-area-docs': {
      outputDirectory: 'docs-live',
    },
    adrs: {
      outputDirectory: 'docs-live',
    },
    requirements: {
      outputDirectory: 'docs-live',
    },
  },
});
