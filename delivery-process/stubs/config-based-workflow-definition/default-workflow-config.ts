/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements ConfigBasedWorkflowDefinition
 * @libar-docs-product-area Configuration
 * @libar-docs-target src/config/workflow-loader.ts
 * @libar-docs-since DS-1
 *
 * ## DEFAULT_WORKFLOW_CONFIG — Inline Default Workflow Constant
 *
 * Replaces the dead file-based loading path (`catalogue/workflows/6-phase-standard.json`)
 * with an inline constant that satisfies the existing `WorkflowConfig` type.
 *
 * The constant uses only the 4 canonical statuses from `PROCESS_STATUS_VALUES`
 * (roadmap, active, completed, deferred) — not the stale 5-status set from
 * the deleted JSON (which included non-canonical `implemented` and `partial`).
 *
 * DD-1: Inline constant in workflow-loader.ts, not preset integration.
 * DD-2: Constant satisfies existing WorkflowConfig type from workflow-config.ts.
 * DD-4: loadDefaultWorkflow() returns LoadedWorkflow synchronously (not Promise).
 *
 * **When to Use:** When the workflow loader needs a default workflow config — import this constant instead of loading from a JSON file.
 */

import type { WorkflowConfig } from '../../src/validation-schemas/workflow-config.js';

// DD-2: Satisfies existing WorkflowConfig type — no new types needed.
// Fields included: status name + emoji, phase name + order, top-level name/version/defaultStatus.
// Fields omitted: transitionsTo, terminal, artifacts, statusOnEntry, description — all optional
// in WorkflowConfigSchema and never consumed by any code path.
//
// The sole functional consumer is transform-dataset.ts:610:
//   workflow?.config.phases.find((p) => p.order === phaseNumber)?.name
export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  name: '6-phase-standard',
  version: '1.0.0',
  statuses: [
    { name: 'roadmap', emoji: '\u{1F4CB}' },
    { name: 'active', emoji: '\u{1F6A7}' },
    { name: 'completed', emoji: '\u2705' },
    { name: 'deferred', emoji: '\u23F8\uFE0F' },
  ],
  phases: [
    { name: 'Inception', order: 1 },
    { name: 'Elaboration', order: 2 },
    { name: 'Session', order: 3 },
    { name: 'Construction', order: 4 },
    { name: 'Validation', order: 5 },
    { name: 'Retrospective', order: 6 },
  ],
  defaultStatus: 'roadmap',
};

// DD-4: loadDefaultWorkflow() becomes synchronous and infallible.
// Implementation will call createLoadedWorkflow(DEFAULT_WORKFLOW_CONFIG) directly.
// The function signature changes from:
//   export async function loadDefaultWorkflow(): Promise<LoadedWorkflow>
// To:
//   export function loadDefaultWorkflow(): LoadedWorkflow
//
// DD-3: Dead code to remove from workflow-loader.ts:
// - getCatalogueWorkflowsPath() — resolves to non-existent catalogue/workflows/
// - loadWorkflowConfig(name) — loads by name from dead catalogue path
// - DEFAULT_WORKFLOW_NAME constant — only used by loadWorkflowConfig
// - fs, path, fileURLToPath, import.meta.url imports — only used by above
