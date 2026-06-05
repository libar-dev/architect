import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  projectPatternDetail,
  renderCompactText,
  renderJson,
  renderMarkdown,
  renderUi,
  type PatternDetail,
  type ProjectionBundle,
  type ProjectionContext,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext, createRelationshipEntry } from './support.js';

interface PatternDetailState {
  context: ProjectionContext | null;
  bundle: ProjectionBundle<PatternDetail> | null;
  markdown: string | Record<string, string> | null;
  compact: string;
  json: string | object | null;
  ui: object | null;
}

const feature = await loadFeature(
  'tests/features/projections/pattern-relations/pattern-detail.feature',
);

let state: PatternDetailState | null = null;

function createState(): PatternDetailState {
  return {
    context: null,
    bundle: null,
    markdown: null,
    compact: '',
    json: null,
    ui: null,
  };
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given, And }) => {
    Given('the Pattern Relations pattern detail state is initialized', () => {
      state = createState();
    });
    And('the following deliverables:', () => void 0);
  });

  Rule('Pattern details compose normalized sub-shapes only', ({ RuleScenario }) => {
    RuleScenario('projecting a full pattern detail bundle', ({ Given, When, Then, And }) => {
      Given('a rich pattern detail projection context', () => {
        const pattern = createPattern('PatternGraphAPI', {
          file: 'packages/architect-query/src/pattern-graph-api.ts',
          description:
            '**Problem:** Query consumers need one stable read model.\n\n**Solution:** The PatternGraph API centralizes those reads.',
          executableSpecs: ['tests/features/query/pattern-graph.feature'],
          deliverables: [
            {
              name: 'PatternGraph API module',
              status: 'in-progress',
              tests: 2,
              location: 'packages/architect-query/src/pattern-graph-api.ts',
              finding: 'Keeps read operations centralized.',
            },
          ],
          rules: [
            {
              name: 'Pattern relationships stay graph-derived',
              description:
                '**Invariant:** Relationships come from the graph.\n\n**Rationale:** Projections must not re-derive architecture.\n\n**Verified by:** Projection detail scenario',
              scenarioCount: 2,
              scenarioNames: ['Pattern detail happy path', 'Projection detail scenario'],
            },
          ],
        });
        const stub = createPattern('PatternGraphAPIStub', {
          file: 'architect/stubs/query/pattern-graph-api.stub.ts',
          targetPath: 'packages/architect-query/src/pattern-graph-api.ts',
        });

        state!.context = createProjectionContext({
          patterns: [pattern, stub],
          relationshipIndex: {
            PatternGraphAPI: createRelationshipEntry({
              dependsOn: ['PatternGraph'],
              enables: ['ArchitectMcpServer'],
              uses: ['PatternHelpers'],
              usedBy: ['PatternBrowserView'],
              implementsPatterns: ['PatternGraphReadModel'],
              implementedBy: [
                {
                  name: 'PatternGraphAPIStub',
                  file: 'architect/stubs/query/pattern-graph-api.stub.ts',
                  description: 'Stub for future implementation',
                },
              ],
              extendsPattern: 'QuerySurface',
              extendedBy: ['PatternGraphSearch'],
              seeAlso: ['ContextAssemblerImpl'],
              apiRef: ['architect_pattern'],
            }),
          },
        });
      });

      When('I project the pattern detail for "PatternGraphAPI"', () => {
        state!.bundle = projectPatternDetail(state!.context!, 'PatternGraphAPI');
      });

      And('I render the pattern detail bundle through every renderer', () => {
        state!.markdown = renderMarkdown(state!.bundle!, {
          includeChildren: true,
          splitStrategy: 'never',
        });
        state!.compact = renderCompactText(state!.bundle!);
        state!.json = renderJson(state!.bundle!);
        state!.ui = renderUi(state!.bundle!, { resolveChildLinks: true });
      });

      Then(
        'the pattern detail bundle should include normalized relationships, deliverables, rules, and stubs',
        () => {
          expect(state!.bundle?.children).toEqual({});
          expect(state!.bundle?.root).toMatchObject({
            kind: 'PatternDetail',
            patternName: 'PatternGraphAPI',
            description:
              'Problem: Query consumers need one stable read model. Solution: The PatternGraph API centralizes those reads.',
            // Problem + Solution are each a single sentence with nothing after the
            // Solution block, so the head is the whole directive — not truncated.
            descriptionTruncated: false,
            deliverables: [
              {
                name: 'PatternGraph API module',
                tests: ['tests/features/query/pattern-graph.feature'],
              },
            ],
            relationships: {
              dependsOn: ['PatternGraph'],
              enables: ['ArchitectMcpServer'],
              uses: ['PatternHelpers'],
              usedBy: ['PatternBrowserView'],
              implementsPatterns: ['PatternGraphReadModel'],
              extendedBy: ['PatternGraphSearch'],
              seeAlso: ['ContextAssemblerImpl'],
              apiRef: ['architect_pattern'],
            },
            rules: [
              {
                name: 'Pattern relationships stay graph-derived',
                invariant: 'Relationships come from the graph.',
                rationale: 'Projections must not re-derive architecture.',
                verifiedBy: ['Pattern detail happy path', 'Projection detail scenario'],
                scenarioCount: 2,
              },
            ],
            stubs: [
              {
                stubFile: 'architect/stubs/query/pattern-graph-api.stub.ts',
                targetPath: 'packages/architect-query/src/pattern-graph-api.ts',
                name: 'PatternGraphAPIStub',
              },
            ],
          });
        },
      );

      And('the renderer outputs should stay non-empty and type-valid', () => {
        expect(typeof state!.markdown === 'string' || typeof state!.markdown === 'object').toBe(
          true,
        );
        expect(state!.compact.length).toBeGreaterThan(0);
        expect(state!.json).toBeTruthy();
        expect(state!.ui).toBeTruthy();
      });
    });

    RuleScenario(
      'detail relationships fall back to raw pattern arrays when the relationship index is missing',
      ({ Given, When, Then }) => {
        Given('a pattern detail context without a relationship index', () => {
          state!.context = createProjectionContext({
            patterns: [
              createPattern('FallbackPattern', {
                dependsOn: ['BasePattern'],
                enables: ['ConsumerPattern'],
                uses: ['PatternHelpers'],
                usedBy: ['BrowserView'],
                implementsPatterns: ['ReadModel'],
                extendsPattern: 'BaseProjection',
                seeAlso: ['RelatedPattern'],
                apiRef: ['architect_pattern'],
              }),
            ],
          });
        });

        When('I project the pattern detail for "FallbackPattern"', () => {
          state!.bundle = projectPatternDetail(state!.context!, 'FallbackPattern');
        });

        Then('the pattern detail should fall back to raw relationship arrays', () => {
          expect(state!.bundle?.root.relationships).toEqual({
            dependsOn: ['BasePattern'],
            enables: ['ConsumerPattern'],
            uses: ['PatternHelpers'],
            usedBy: ['BrowserView'],
            implementsPatterns: ['ReadModel'],
            implementedBy: [],
            extendsPattern: 'BaseProjection',
            extendedBy: [],
            seeAlso: ['RelatedPattern'],
            apiRef: ['architect_pattern'],
          });
        });
      },
    );

    RuleScenario('detail projection keeps empty arrays explicit', ({ Given, When, Then }) => {
      Given('a pattern detail context with no deliverables, rules, or stub refs', () => {
        state!.context = createProjectionContext({
          patterns: [createPattern('EmptyPattern')],
          relationshipIndex: {
            EmptyPattern: createRelationshipEntry(),
          },
        });
      });

      When('I project the pattern detail for "EmptyPattern"', () => {
        state!.bundle = projectPatternDetail(state!.context!, 'EmptyPattern');
      });

      Then('the pattern detail should keep empty arrays and an empty manifest', () => {
        expect(state!.bundle?.root.deliverables).toEqual([]);
        expect(state!.bundle?.root.rules).toEqual([]);
        expect(state!.bundle?.root.stubs).toEqual([]);
        expect(state!.bundle?.root.deliverableManifest).toEqual({
          pattern: 'EmptyPattern',
          items: [],
        });
      });
    });

    RuleScenario('detail projection preserves hierarchy metadata', ({ Given, When, Then }) => {
      Given('a pattern detail context with hierarchy metadata', () => {
        state!.context = createProjectionContext({
          patterns: [
            createPattern('LifecycleMvpEpic', {
              status: 'candidate',
              level: 'epic',
              children: ['IdeaInbox', 'SpecInboxAndCandidates'],
            }),
          ],
          relationshipIndex: {
            LifecycleMvpEpic: createRelationshipEntry(),
          },
        });
      });

      When('I project the pattern detail for "LifecycleMvpEpic"', () => {
        state!.bundle = projectPatternDetail(state!.context!, 'LifecycleMvpEpic');
      });

      Then('the pattern detail should preserve hierarchy metadata', () => {
        expect(state!.bundle?.root.hierarchy).toEqual({
          level: 'epic',
          members: ['IdeaInbox', 'SpecInboxAndCandidates'],
        });
      });
    });

    RuleScenario(
      'detail projection flags a truncated description head',
      ({ Given, When, Then }) => {
        Given('a pattern detail context with prose beyond the description head', () => {
          state!.context = createProjectionContext({
            patterns: [
              createPattern('TruncatedPattern', {
                description:
                  '**User Story:** As an agent I want a compact head. The directive then continues with extensive design prose that the projected head deliberately omits.',
              }),
            ],
            relationshipIndex: {
              TruncatedPattern: createRelationshipEntry(),
            },
          });
        });

        When('I project the pattern detail for "TruncatedPattern"', () => {
          state!.bundle = projectPatternDetail(state!.context!, 'TruncatedPattern');
        });

        Then('the pattern detail head is flagged as truncated', () => {
          expect(state!.bundle?.root.description).toBe(
            '**User Story:** As an agent I want a compact head.',
          );
          expect(state!.bundle?.root.descriptionTruncated).toBe(true);
        });
      },
    );

    RuleScenario(
      'detail projection extracts open questions from normalized prose',
      ({ Given, When, Then }) => {
        Given('a pattern detail context with open questions prose', () => {
          state!.context = createProjectionContext({
            patterns: [
              createPattern('QuestionedPattern', {
                description:
                  '**Problem:** Some design facts remain unsettled.\n\n**Open Questions:**\n- Which owner accepts the next slice?\n- What is the durable rollout signal?\n\n**Solution:** Capture the questions as structured output.',
              }),
            ],
            relationshipIndex: {
              QuestionedPattern: createRelationshipEntry(),
            },
          });
        });

        When('I project the pattern detail for "QuestionedPattern"', () => {
          state!.bundle = projectPatternDetail(state!.context!, 'QuestionedPattern');
        });

        Then('the pattern detail should include the extracted open questions', () => {
          expect(state!.bundle?.root.openQuestions).toEqual([
            'Which owner accepts the next slice?',
            'What is the durable rollout signal?',
          ]);
        });
      },
    );
  });
});
