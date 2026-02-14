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

export default defineConfig({
  preset: 'libar-generic',
  sources: {
    typescript: ['src/**/*.ts'],
    stubs: ['delivery-process/stubs/**/*.ts'],
    features: [
      'delivery-process/specs/*.feature',
      'delivery-process/releases/*.feature',
    ],
  },
  output: {
    directory: 'docs-generated',
    overwrite: true,
  },
  referenceDocConfigs: [
    {
      title: 'Reference Generation Sample',
      conventionTags: ['reference-sample', 'output-format'],
      shapeSources: ['src/taxonomy/risk-levels.ts', 'src/renderable/schema.ts'],
      behaviorCategories: ['infra'],
      diagramScopes: [
        {
          archView: ['reference-sample'],
          direction: 'TB',
          title: 'Configuration Components',
        },
        {
          archContext: ['renderer'],
          direction: 'LR',
          title: 'Renderer Pipeline',
          diagramType: 'sequenceDiagram',
          showEdgeLabels: true,
        },
      ],
      claudeMdSection: 'architecture',
      docsFilename: 'REFERENCE-SAMPLE.md',
      claudeMdFilename: 'reference-sample.md',
    },
  ],
  generatorOverrides: {
    changelog: {
      additionalFeatures: ['delivery-process/decisions/*.feature'],
    },
    'doc-from-decision': {
      replaceFeatures: ['delivery-process/decisions/*.feature'],
    },
    'reference-docs': {
      additionalFeatures: ['delivery-process/decisions/*.feature'],
    },
  },
});
