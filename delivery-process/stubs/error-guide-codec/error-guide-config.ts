/**
 * @libar-docs
 * @libar-docs-status roadmap
 * @libar-docs-implements ErrorGuideCodec
 * @libar-docs-target delivery-process.config.ts
 *
 * ## ReferenceDocConfig Entry for Process Guard Error Guide — DD-2, DD-4 Decisions
 *
 * **Decision DD-2 (Convention tag approach):** Register a new `process-guard-errors`
 * convention tag value in `CONVENTION_VALUES` rather than reusing `fsm-rules`.
 *
 * **Rationale (DD-2):** The `fsm-rules` tag covers FSM state definitions,
 * transition matrices, and protection levels — structural FSM documentation.
 * Error diagnosis content (rationale for why a rule exists, alternative
 * approaches, common mistake patterns) is a distinct concern. Co-locating
 * both under `fsm-rules` would conflate "how the FSM works" with "how to
 * debug Process Guard errors". A dedicated tag keeps convention bundles
 * focused and enables independent content routing.
 *
 * Existing convention tags for reference:
 * - `fsm-rules` — FSM structure (transitions, states, protection levels)
 * - `cli-patterns` — CLI argument parsing conventions
 * - `codec-registry` — Codec catalog and factory patterns
 * - `pipeline-architecture` — Pipeline stage responsibilities
 *
 * The new `process-guard-errors` tag covers:
 * - Per-error-code rationale ("why this rule exists")
 * - Alternative approaches and escape hatches
 * - Common mistake patterns and debugging hints
 *
 * **Decision DD-4 (Husky/CI content):** Use the `ReferenceDocConfig.preamble`
 * mechanism for integration recipes. Preamble is `SectionBlock[]` prepended
 * before all generated content. This is the established pattern — no new
 * annotation type is needed.
 *
 * **Rationale (DD-4):** Integration recipes (Husky hook setup, CI YAML
 * patterns, programmatic API examples, architecture diagrams) describe how
 * external systems consume Process Guard, not how Process Guard is
 * implemented. This content cannot come from `@libar-docs-convention`
 * annotations because it is not attached to any source code entity.
 * The preamble mechanism was designed precisely for this case:
 * - Already proven by product-area docs (e.g., `PRODUCT_AREA_META` preamble)
 * - Appears in both detailed and summary outputs
 * - Lives in the config, not in a separate manual file
 * - Changes at editorial cadence, not code cadence
 *
 * ### Config Structure
 *
 * The `ReferenceDocConfig` entry composes three content layers:
 *
 * | Layer | Source | Content |
 * |-------|--------|---------|
 * | Preamble | Config `preamble: SectionBlock[]` | Husky setup, CI recipes, programmatic API, architecture diagram |
 * | Conventions | `conventionTags: ['process-guard-errors']` | Per-error rationale, alternatives, debugging hints |
 * | Existing codec | `validation-rules` generator override | Error catalog, FSM transitions, protection levels |
 *
 * **Integration with ValidationRulesCodec:**
 * The ReferenceDocConfig uses `conventionTags: ['process-guard-errors']` to
 * pull rationale content through the reference codec's convention extraction
 * pipeline. The `validation-rules` generator continues to produce its
 * existing detail files (`error-catalog.md`, `fsm-transitions.md`,
 * `protection-levels.md`) independently. The reference doc entry creates
 * a unified PROCESS-GUARD.md that composes preamble + convention content +
 * links to the validation-rules detail files.
 */

// ---------------------------------------------------------------------------
// Example ReferenceDocConfig entry (would be added to delivery-process.config.ts)
// ---------------------------------------------------------------------------

/**
 * This stub demonstrates the config entry shape. The actual entry goes in
 * `delivery-process.config.ts` under the `referenceDocConfigs` array.
 *
 * The preamble sections below show the editorial content structure for
 * Husky setup, programmatic API, and architecture diagram. Each preamble
 * entry is a SectionBlock (heading, paragraph, code, table, or mermaid).
 */
export const ERROR_GUIDE_REFERENCE_CONFIG = {
  title: 'Process Guard Reference',
  conventionTags: ['process-guard-errors'],
  shapeSources: [],
  behaviorCategories: [],
  claudeMdSection: 'validation',
  docsFilename: 'PROCESS-GUARD.md',
  claudeMdFilename: 'process-guard.md',
  preamble: [
    // --- Husky Pre-commit Setup ---
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
      content: [
        '# .husky/pre-commit',
        '#!/usr/bin/env sh',
        '. "$(dirname -- "$0")/_/husky.sh"',
        '',
        'npx lint-process --staged',
      ].join('\n'),
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
      headers: ['Category', 'Function', 'Description'],
      rows: [
        ['State', 'deriveProcessState(cfg)', 'Build state from file annotations'],
        ['Changes', 'detectStagedChanges(dir)', 'Parse staged git diff'],
        ['Changes', 'detectBranchChanges(dir)', 'Parse all changes vs main'],
        ['Validate', 'validateChanges(input)', 'Run all validation rules'],
        ['Results', 'hasErrors(result)', 'Check for blocking errors'],
        ['Results', 'summarizeResult(result)', 'Human-readable summary'],
      ],
    },

    // --- Architecture Diagram ---
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
        '    B[detectStagedChanges / detectBranchChanges] --> C',
        '    C --> D[ValidationResult]',
      ].join('\n'),
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// Convention tag registration (goes in src/taxonomy/conventions.ts)
// ---------------------------------------------------------------------------

/**
 * DD-2: 'process-guard-errors' is already registered in
 * `src/taxonomy/conventions.ts` CONVENTION_VALUES.
 * No additional registration needed.
 */
export function _conventionTagRegistrationPlaceholder(): never {
  throw new Error('ErrorGuideCodec not yet implemented - roadmap pattern');
}
