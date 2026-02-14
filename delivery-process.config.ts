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
import { LIBAR_REFERENCE_CONFIGS } from './src/generators/built-in/reference-generators.js';

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
  referenceDocConfigs: LIBAR_REFERENCE_CONFIGS,
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
