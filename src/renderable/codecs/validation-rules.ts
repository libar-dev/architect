/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern ValidationRulesCodec
 * @libar-docs-status completed
 *
 * ## Validation Rules Document Codec
 *
 * Transforms MasterDataset into a RenderableDocument for Process Guard validation
 * rules reference. Generates VALIDATION-RULES.md and detail files (validation/*.md).
 *
 * ### When to Use
 *
 * - When generating validation rules reference documentation
 * - When creating FSM state transition diagrams
 * - When building protection level reference files
 *
 * ### Factory Pattern
 *
 * Use `createValidationRulesCodec(options)` to create a configured codec:
 * ```typescript
 * const codec = createValidationRulesCodec({ includeFSMDiagram: false });
 * const doc = codec.decode(dataset);
 * ```
 *
 * Or use the default export for standard behavior:
 * ```typescript
 * const doc = ValidationRulesCodec.decode(dataset);
 * ```
 */

import { z } from 'zod';
import {
  MasterDatasetSchema,
  type MasterDataset,
} from '../../validation-schemas/master-dataset.js';
import {
  type RenderableDocument,
  type SectionBlock,
  heading,
  paragraph,
  separator,
  table,
  code,
  mermaid,
  linkOut,
  document,
} from '../schema.js';
import { type BaseCodecOptions, DEFAULT_BASE_OPTIONS, mergeOptions } from './types/base.js';
import { RenderableDocumentOutputSchema } from './shared-schema.js';
import { VALID_TRANSITIONS } from '../../validation/fsm/transitions.js';
import {
  PROTECTION_LEVELS,
  type ProtectionLevel,
  type ProcessStatusValue,
} from '../../validation/fsm/states.js';
import type { ProcessGuardRule } from '../../lint/process-guard/types.js';

// ═══════════════════════════════════════════════════════════════════════════
// ValidationRules Codec Options (co-located with codec)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Options for ValidationRulesCodec
 */
export interface ValidationRulesCodecOptions extends BaseCodecOptions {
  /** Include FSM state diagram (default: true) */
  includeFSMDiagram?: boolean;

  /** Include CLI usage section (default: true) */
  includeCLIUsage?: boolean;

  /** Include escape hatches section (default: true) */
  includeEscapeHatches?: boolean;

  /** Include protection levels matrix (default: true) */
  includeProtectionMatrix?: boolean;
}

/**
 * Default options for ValidationRulesCodec
 */
export const DEFAULT_VALIDATION_RULES_OPTIONS: Required<ValidationRulesCodecOptions> = {
  ...DEFAULT_BASE_OPTIONS,
  includeFSMDiagram: true,
  includeCLIUsage: true,
  includeEscapeHatches: true,
  includeProtectionMatrix: true,
};

// ═══════════════════════════════════════════════════════════════════════════
// Rule Definitions (Centralized for Documentation)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Rule definition for documentation
 */
interface RuleDefinition {
  id: ProcessGuardRule;
  severity: 'error' | 'warning';
  description: string;
  cause: string;
  fix: string;
}

/**
 * Process Guard rule definitions for documentation
 *
 * Centralized definitions ensure consistency between code and docs.
 * These match the implementations in src/lint/process-guard/decider.ts
 */
const RULE_DEFINITIONS: readonly RuleDefinition[] = [
  {
    id: 'completed-protection',
    severity: 'error',
    description: 'Completed specs require unlock-reason tag to modify',
    cause: 'File has `completed` status but no `@libar-docs-unlock-reason` tag',
    fix: "Add `@libar-docs-unlock-reason:'your reason'` to proceed",
  },
  {
    id: 'invalid-status-transition',
    severity: 'error',
    description: 'Status transitions must follow FSM path',
    cause: 'Attempted transition not in VALID_TRANSITIONS matrix',
    fix: 'Follow path: roadmap -> active -> completed',
  },
  {
    id: 'scope-creep',
    severity: 'error',
    description: 'Active specs cannot add new deliverables',
    cause: 'Added deliverable to spec with `active` status',
    fix: 'Create new spec OR revert to `roadmap` status first',
  },
  {
    id: 'session-scope',
    severity: 'warning',
    description: 'File outside session scope',
    cause: "Modified file not in session's scopedSpecs list",
    fix: 'Add to session scope OR use `--ignore-session` flag',
  },
  {
    id: 'session-excluded',
    severity: 'error',
    description: 'File explicitly excluded from session',
    cause: "File in session's excludedSpecs list",
    fix: 'Remove from exclusion OR use different session',
  },
  {
    id: 'deliverable-removed',
    severity: 'warning',
    description: 'Deliverable was removed from spec',
    cause: 'Deliverable removed from Background table',
    fix: 'Document reason for removal (completed or descoped)',
  },
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// ValidationRules Document Codec
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a ValidationRulesCodec with custom options.
 *
 * @param options - Codec configuration options
 * @returns Configured Zod codec
 *
 * @example
 * ```typescript
 * // Disable detail files for summary output
 * const codec = createValidationRulesCodec({ generateDetailFiles: false });
 *
 * // Disable FSM diagram section
 * const codec = createValidationRulesCodec({ includeFSMDiagram: false });
 * ```
 */
export function createValidationRulesCodec(
  options?: ValidationRulesCodecOptions
): z.ZodCodec<typeof MasterDatasetSchema, typeof RenderableDocumentOutputSchema> {
  const opts = mergeOptions(DEFAULT_VALIDATION_RULES_OPTIONS, options);

  return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
    decode: (_dataset: MasterDataset): RenderableDocument => {
      return buildValidationRulesDocument(opts);
    },
    /** @throws Always - this codec is decode-only. See zod-codecs.md */
    encode: (): never => {
      throw new Error('ValidationRulesCodec is decode-only. See zod-codecs.md');
    },
  });
}

/**
 * Default ValidationRules Document Codec
 *
 * Transforms MasterDataset -> RenderableDocument for validation rules reference.
 * Uses default options with all features enabled.
 *
 * @example
 * ```typescript
 * const doc = ValidationRulesCodec.decode(masterDataset);
 * const markdown = renderToMarkdown(doc);
 * ```
 */
export const ValidationRulesCodec = createValidationRulesCodec();

// ═══════════════════════════════════════════════════════════════════════════
// Document Builder
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build the validation rules document
 */
function buildValidationRulesDocument(
  options: Required<ValidationRulesCodecOptions>
): RenderableDocument {
  const sections: SectionBlock[] = [];

  // 1. Overview section (always included)
  sections.push(...buildOverviewSection());

  // 2. Validation rules table (always included)
  sections.push(...buildRulesTableSection());

  // 3. FSM diagram (if enabled)
  if (options.includeFSMDiagram) {
    sections.push(...buildFSMDiagramSection());
  }

  // 4. Protection matrix (if enabled)
  if (options.includeProtectionMatrix) {
    sections.push(...buildProtectionMatrixSection());
  }

  // 5. CLI usage (if enabled)
  if (options.includeCLIUsage) {
    sections.push(...buildCLISection());
  }

  // 6. Escape hatches (if enabled)
  if (options.includeEscapeHatches) {
    sections.push(...buildEscapeHatchesSection());
  }

  // Build additional files for progressive disclosure (if enabled)
  const additionalFiles = options.generateDetailFiles ? buildDetailFiles() : {};

  const docOpts: {
    purpose: string;
    detailLevel: string;
    additionalFiles?: Record<string, RenderableDocument>;
  } = {
    purpose: 'Process Guard validation rules and FSM reference',
    detailLevel: options.generateDetailFiles ? 'Overview with links to details' : 'Compact summary',
  };

  if (Object.keys(additionalFiles).length > 0) {
    docOpts.additionalFiles = additionalFiles;
  }

  return document('Validation Rules', sections, docOpts);
}

// ═══════════════════════════════════════════════════════════════════════════
// Section Builders
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build overview section explaining Process Guard
 */
function buildOverviewSection(): SectionBlock[] {
  const ruleCount = RULE_DEFINITIONS.length;
  const stateCount = Object.keys(VALID_TRANSITIONS).length;
  const protectionLevelCount = new Set(Object.values(PROTECTION_LEVELS)).size;

  return [
    heading(2, 'Overview'),
    paragraph(
      'Process Guard validates delivery workflow changes at commit time using a ' +
        'Decider pattern. It enforces the 4-state FSM defined in PDR-005 and ' +
        'prevents common workflow violations.'
    ),
    paragraph(
      `**${ruleCount} validation rules** | **${stateCount} FSM states** | **${protectionLevelCount} protection levels**`
    ),
    separator(),
  ];
}

/**
 * Build validation rules table section
 */
function buildRulesTableSection(): SectionBlock[] {
  const rows = RULE_DEFINITIONS.map((rule) => [`\`${rule.id}\``, rule.severity, rule.description]);

  return [
    heading(2, 'Validation Rules'),
    paragraph('Rules are checked in order. Errors block commit; warnings are informational.'),
    table(['Rule ID', 'Severity', 'Description'], rows),
    linkOut('Full error catalog with fix instructions', 'validation/error-catalog.md'),
    separator(),
  ];
}

/**
 * Build FSM state diagram section from VALID_TRANSITIONS
 */
function buildFSMDiagramSection(): SectionBlock[] {
  // Generate Mermaid diagram from VALID_TRANSITIONS constant
  const lines: string[] = ['stateDiagram-v2'];
  lines.push('    [*] --> roadmap: new pattern');

  // Add transitions from the constant
  for (const [from, targets] of Object.entries(VALID_TRANSITIONS)) {
    for (const to of targets as readonly string[]) {
      if (from !== to) {
        // Skip self-transitions in diagram for clarity
        // Add labels for notable transitions
        if (from === 'active' && to === 'roadmap') {
          lines.push(`    ${from} --> ${to}: blocked/regressed`);
        } else {
          lines.push(`    ${from} --> ${to}`);
        }
      }
    }
  }

  lines.push('    completed --> [*]: terminal');

  return [
    heading(2, 'FSM State Diagram'),
    paragraph('Valid transitions per PDR-005 MVP Workflow:'),
    mermaid(lines.join('\n')),
    paragraph(
      '**Valid Transitions:**\n' +
        '- `roadmap` -> `active` -> `completed` (normal flow)\n' +
        '- `active` -> `roadmap` (blocked/regressed)\n' +
        '- `roadmap` <-> `deferred` (parking)'
    ),
    linkOut('Detailed transition matrix', 'validation/fsm-transitions.md'),
    separator(),
  ];
}

/**
 * Build protection levels matrix section
 */
function buildProtectionMatrixSection(): SectionBlock[] {
  const rows = (
    Object.entries(PROTECTION_LEVELS) as Array<[ProcessStatusValue, ProtectionLevel]>
  ).map(([status, level]) => {
    const canAdd = level === 'none' ? 'Yes' : 'No';
    const needsUnlock = level === 'hard' ? 'Yes' : 'No';
    return [`\`${status}\``, level, canAdd, needsUnlock];
  });

  return [
    heading(2, 'Protection Levels'),
    paragraph('Protection levels determine what modifications are allowed per status.'),
    table(['Status', 'Protection', 'Can Add Deliverables', 'Needs Unlock'], rows),
    linkOut('Protection level details', 'validation/protection-levels.md'),
    separator(),
  ];
}

/**
 * Build CLI usage section
 */
function buildCLISection(): SectionBlock[] {
  const cliCode = `# Pre-commit (default mode)
lint-process --staged

# CI pipeline with strict mode
lint-process --all --strict

# Override session scope checking
lint-process --staged --ignore-session

# Debug: show derived process state
lint-process --staged --show-state`;

  return [
    heading(2, 'CLI Usage'),
    code(cliCode, 'bash'),
    heading(3, 'Options'),
    table(
      ['Flag', 'Description'],
      [
        ['`--staged`', 'Validate staged files only (pre-commit)'],
        ['`--all`', 'Validate all tracked files (CI)'],
        ['`--strict`', 'Treat warnings as errors (exit 1)'],
        ['`--ignore-session`', 'Skip session scope validation'],
        ['`--show-state`', 'Debug: show derived process state'],
        ['`--format json`', 'Machine-readable JSON output'],
      ]
    ),
    heading(3, 'Exit Codes'),
    table(
      ['Code', 'Meaning'],
      [
        ['`0`', 'No errors (warnings allowed unless `--strict`)'],
        ['`1`', 'Errors found or warnings with `--strict`'],
      ]
    ),
    separator(),
  ];
}

/**
 * Build escape hatches section
 */
function buildEscapeHatchesSection(): SectionBlock[] {
  return [
    heading(2, 'Escape Hatches'),
    paragraph('Override mechanisms for exceptional situations.'),
    table(
      ['Situation', 'Solution', 'Example'],
      [
        [
          'Fix bug in completed spec',
          'Add unlock reason tag',
          "`@libar-docs-unlock-reason:'Fix-typo'`",
        ],
        [
          'Modify outside session scope',
          'Use ignore flag',
          '`lint-process --staged --ignore-session`',
        ],
        ['CI treats warnings as errors', 'Use strict flag', '`lint-process --all --strict`'],
      ]
    ),
    separator(),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// Additional Detail Files (Progressive Disclosure)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build additional validation detail files
 */
function buildDetailFiles(): Record<string, RenderableDocument> {
  const files: Record<string, RenderableDocument> = {};

  // validation/fsm-transitions.md - Full transition matrix with descriptions
  files['validation/fsm-transitions.md'] = buildFSMTransitionsDetailDocument();

  // validation/error-catalog.md - Full error messages with causes/fixes
  files['validation/error-catalog.md'] = buildErrorCatalogDetailDocument();

  // validation/protection-levels.md - Detailed protection explanations
  files['validation/protection-levels.md'] = buildProtectionLevelsDetailDocument();

  return files;
}

/**
 * Get a description for a specific transition
 */
function getTransitionDescription(from: string, to: string): string {
  const descriptions: Record<string, string> = {
    'roadmap-active': 'Start implementation work',
    'roadmap-deferred': 'Park work for later',
    'roadmap-roadmap': 'Stay in planning (self-transition)',
    'active-completed': 'Finish implementation',
    'active-roadmap': 'Regress due to blocker or scope change',
    'deferred-roadmap': 'Reactivate deferred work',
  };

  return descriptions[`${from}-${to}`] ?? 'Standard transition';
}

/**
 * Build FSM transitions detail document
 */
function buildFSMTransitionsDetailDocument(): RenderableDocument {
  const sections: SectionBlock[] = [];

  sections.push(
    heading(2, 'FSM Transition Matrix'),
    paragraph('Complete transition matrix showing all valid state changes per PDR-005.')
  );

  // Full table with all transitions
  const allRows: string[][] = [];
  for (const [from, targets] of Object.entries(VALID_TRANSITIONS)) {
    if ((targets as readonly string[]).length === 0) {
      allRows.push([`\`${from}\``, '(none)', 'Terminal state - no valid transitions']);
    } else {
      for (const to of targets as readonly string[]) {
        allRows.push([`\`${from}\``, `\`${to}\``, getTransitionDescription(from, to)]);
      }
    }
  }

  sections.push(table(['From', 'To', 'Description'], allRows));

  // Per-state breakdown
  sections.push(heading(2, 'Transitions by State'));

  for (const [from, targets] of Object.entries(VALID_TRANSITIONS)) {
    sections.push(heading(3, `From \`${from}\``));

    if ((targets as readonly string[]).length === 0) {
      sections.push(
        paragraph(
          `**Terminal state** - no valid transitions. Use \`@libar-docs-unlock-reason\` to modify.`
        )
      );
    } else {
      const rows = (targets as readonly string[]).map((to) => [
        `\`${to}\``,
        getTransitionDescription(from, to),
      ]);
      sections.push(table(['Target', 'Description'], rows));
    }
  }

  // Back link
  sections.push(separator(), linkOut('Back to Validation Rules', '../VALIDATION-RULES.md'));

  return document('FSM Transitions', sections, {
    purpose: 'Complete state transition reference for Process Guard FSM',
  });
}

/**
 * Build error catalog detail document
 */
function buildErrorCatalogDetailDocument(): RenderableDocument {
  const sections: SectionBlock[] = [];

  sections.push(
    heading(2, 'Error Catalog'),
    paragraph(
      `Complete error messages and fix instructions for all ${RULE_DEFINITIONS.length} validation rules.`
    )
  );

  // Summary table
  const summaryRows = RULE_DEFINITIONS.map((rule) => [
    `\`${rule.id}\``,
    rule.severity,
    rule.description,
  ]);
  sections.push(table(['Rule ID', 'Severity', 'Description'], summaryRows));

  // Detailed breakdown per rule
  sections.push(heading(2, 'Rule Details'));

  for (const rule of RULE_DEFINITIONS) {
    sections.push(
      heading(3, `\`${rule.id}\``),
      table(
        ['Property', 'Value'],
        [
          ['Severity', rule.severity],
          ['Description', rule.description],
          ['Cause', rule.cause],
          ['Fix', rule.fix],
        ]
      )
    );
  }

  // Back link
  sections.push(separator(), linkOut('Back to Validation Rules', '../VALIDATION-RULES.md'));

  return document('Error Catalog', sections, {
    purpose: 'Complete error message reference with fix instructions',
  });
}

/**
 * Build protection levels detail document
 */
function buildProtectionLevelsDetailDocument(): RenderableDocument {
  const sections: SectionBlock[] = [];

  sections.push(
    heading(2, 'Protection Levels'),
    paragraph('Detailed explanation of protection levels per PDR-005 MVP Workflow.')
  );

  const protectionDetails: Array<{
    level: ProtectionLevel;
    statuses: readonly ProcessStatusValue[];
    meaning: string;
    allowed: string;
    blocked: string;
  }> = [
    {
      level: 'none',
      statuses: ['roadmap', 'deferred'],
      meaning: 'Fully editable, no restrictions',
      allowed: 'All modifications including adding new deliverables',
      blocked: 'Nothing',
    },
    {
      level: 'scope',
      statuses: ['active'],
      meaning: 'Scope-locked, prevents adding new deliverables',
      allowed: 'Edit existing deliverables, change status',
      blocked: 'Adding new deliverables (scope creep)',
    },
    {
      level: 'hard',
      statuses: ['completed'],
      meaning: 'Hard-locked, requires explicit unlock to modify',
      allowed: 'Nothing (without unlock-reason tag)',
      blocked: 'All modifications',
    },
  ];

  // Summary table
  const summaryRows = protectionDetails.map((detail) => [
    `\`${detail.level}\``,
    detail.statuses.map((s) => `\`${s}\``).join(', '),
    detail.meaning,
  ]);
  sections.push(table(['Level', 'Applies To', 'Meaning'], summaryRows));

  // Detailed breakdown
  sections.push(heading(2, 'Level Details'));

  for (const detail of protectionDetails) {
    sections.push(
      heading(3, `\`${detail.level}\` Protection`),
      paragraph(`**Applies to:** ${detail.statuses.map((s) => `\`${s}\``).join(', ')}`),
      table(
        ['Aspect', 'Description'],
        [
          ['Meaning', detail.meaning],
          ['Allowed', detail.allowed],
          ['Blocked', detail.blocked],
        ]
      )
    );
  }

  // Back link
  sections.push(separator(), linkOut('Back to Validation Rules', '../VALIDATION-RULES.md'));

  return document('Protection Levels', sections, {
    purpose: 'Detailed protection level reference per PDR-005',
  });
}
