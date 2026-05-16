import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  ProjectionError,
  projectDecisionCatalog,
  projectDecisionRecord,
  type DecisionCatalog,
  type DecisionRecord,
  type ProjectionBundle,
  type ProjectionContext,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext, createRule } from './support.js';

interface DecisionProjectionState {
  context: ProjectionContext | null;
  decision: DecisionRecord | null;
  bundle: ProjectionBundle<DecisionCatalog> | null;
  error: unknown;
}

const feature = await loadFeature('tests/features/projections/governance/decision-records.feature');

let state: DecisionProjectionState | null = null;

function createState(): DecisionProjectionState {
  return {
    context: null,
    decision: null,
    bundle: null,
    error: null,
  };
}

function createDecisionContext(): ProjectionContext {
  return createProjectionContext({
    patterns: [
      createPattern('ADR006SingleReadModelArchitecture', {
        title: 'Single Read Model Architecture',
        status: 'completed',
        phase: 49,
        productArea: 'Generation',
        file: 'packages/architect/architect/decisions/adr-006-single-read-model-architecture.feature',
        adr: '006',
        adrStatus: 'accepted',
        adrCategory: 'architecture',
        adrSupersedes: '005',
        adrSupersededBy: '007',
        dependsOn: ['ADR005CodecBasedMarkdownRendering'],
        uses: ['PatternGraphAPI'],
        seeAlso: ['McpOutputSchemaValidation'],
        description: `
**Context:**
The PatternGraph already computes relationship data for every consumer.

**Decision:**
All read paths should project from the PatternGraph instead of rebuilding their own DTOs.

**Consequences:**
| Type | Impact |
| ---- | ------ |
| Positive | Shared projections stop query/codec drift |
| Negative | Legacy helpers have to be removed in one pass |
        `,
        rules: [
          createRule({
            name: 'Decision - enforce the read model boundary',
            description:
              '**Invariant:** Consumers read from PatternGraph only.\n**Rationale:** Re-deriving relationships causes drift.',
            scenarioNames: [
              'Feature consumers import from PatternGraph not from raw pipeline stages',
            ],
            scenarioCount: 1,
          }),
        ],
      }),
      createPattern('PDR001SessionWorkflowCommands', {
        title: 'Session Workflow Commands Design Decisions',
        status: 'completed',
        phase: 49,
        productArea: 'DeliveryProcess',
        file: 'packages/architect/architect/decisions/pdr-001-session-workflow-commands.feature',
        adr: '001',
        adrStatus: 'accepted',
        adrCategory: 'process',
        description: '**Context:** Session commands coordinate workflow orchestration.',
      }),
    ],
  });
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given, And }) => {
    Given('the Governance decision projection state is initialized', () => {
      state = createState();
    });
    And('the following deliverables:', () => void 0);
  });

  Rule('Decision record lookup returns normalized decision fragments', ({ RuleScenario }) => {
    RuleScenario(
      'Projecting a decision record from a decision spec',
      ({ Given, When, Then, And }) => {
        Given('a decision projection context with ADR-006 and PDR-001', () => {
          state!.context = createDecisionContext();
        });

        When('I project the decision record for {string}', (_ctx: unknown, id: string) => {
          state!.decision = projectDecisionRecord(state!.context!, id).root;
        });

        Then('the decision record should expose the canonical decision fields', () => {
          expect(state!.decision).toMatchObject({
            kind: 'DecisionRecord',
            id: 'ADR-006',
            type: 'ADR',
            status: 'accepted',
            title: 'Single Read Model Architecture',
            relatedDecisions: ['ADR-005', 'ADR-007'],
            affectedPatterns: ['McpOutputSchemaValidation', 'PatternGraphAPI'],
          });
          expect(state!.decision?.context[0]).toEqual({
            type: 'paragraph',
            text: 'The PatternGraph already computes relationship data for every consumer.',
          });
          expect(state!.decision?.decision).toContainEqual({
            type: 'paragraph',
            text: '**Invariant:** Consumers read from PatternGraph only. **Rationale:** Re-deriving relationships causes drift.',
          });
        });

        And('the decision consequences should include a structured table block', () => {
          expect(state!.decision?.consequences).toContainEqual({
            type: 'table',
            columns: ['Type', 'Impact'],
            rows: [
              ['Positive', 'Shared projections stop query/codec drift'],
              ['Negative', 'Legacy helpers have to be removed in one pass'],
            ],
          });
        });
      }
    );

    RuleScenario('Missing decisions surface the available ids', ({ Given, When, Then }) => {
      Given('a decision projection context with ADR-006 and PDR-001', () => {
        state!.context = createDecisionContext();
      });

      When('I project the missing decision record for {string}', (_ctx: unknown, id: string) => {
        try {
          projectDecisionRecord(state!.context!, id);
        } catch (error) {
          state!.error = error;
        }
      });

      Then('the decision projection should fail with the available ids', () => {
        expect(state!.error).toBeInstanceOf(ProjectionError);
        expect((state!.error as Error).message).toContain('Decision not found: "ADR-999"');
        expect((state!.error as Error).message).toContain('Available decisions: ADR-006, PDR-001');
      });
    });
  });

  Rule('Decision catalogs use a typed catalog root and decision children', ({ RuleScenario }) => {
    RuleScenario('Projecting the decision catalog bundle', ({ Given, When, Then, And }) => {
      Given('a decision projection context with ADR-006 and PDR-001', () => {
        state!.context = createDecisionContext();
      });

      When('I project the decision catalog', () => {
        state!.bundle = projectDecisionCatalog(state!.context!);
      });

      Then('the decision catalog root should include both normalized decisions', () => {
        expect(state!.bundle?.root).toMatchObject({
          kind: 'DecisionCatalog',
          decisions: [
            { kind: 'DecisionRecord', id: 'ADR-006' },
            { kind: 'DecisionRecord', id: 'PDR-001' },
          ],
        });
      });

      And('the decision catalog child keys should be deterministic', () => {
        expect(Object.keys(state!.bundle?.children ?? {})).toEqual(['adr-006', 'pdr-001']);
      });
    });
  });
});
