/**
 * @libar-docs
 * @libar-docs-generator @libar-docs-infra
 * @libar-docs-pattern PipelineModule
 * @libar-docs-status completed
 * @libar-docs-uses TransformDataset
 * @libar-docs-used-by Orchestrator, Generators
 *
 * ## Pipeline Module - Unified Transformation Infrastructure
 *
 * Barrel export for the unified transformation pipeline components.
 * This module provides single-pass pattern transformation.
 *
 * ### When to Use
 *
 * - When transforming extracted patterns into a MasterDataset
 * - When building custom generation pipelines
 * - When accessing pre-computed indexes and views from the dataset
 *
 * NOTE: Report codecs have been replaced by RDM codecs in src/renderable/codecs/
 */
// ═══════════════════════════════════════════════════════════════════════════
// Transform Dataset
// ═══════════════════════════════════════════════════════════════════════════
export { transformToMasterDataset, transformToMasterDatasetWithValidation, completionPercentage, isFullyCompleted, } from './transform-dataset.js';
// ═══════════════════════════════════════════════════════════════════════════
// Pipeline Factory
// ═══════════════════════════════════════════════════════════════════════════
export { buildMasterDataset, } from './build-pipeline.js';
//# sourceMappingURL=index.js.map