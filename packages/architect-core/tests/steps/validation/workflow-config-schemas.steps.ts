import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  WorkflowConfigSchema,
  createLoadedWorkflow,
  isWorkflowConfig,
  type WorkflowConfig,
  type LoadedWorkflow,
} from '../../../src/validation-schemas/workflow-config.js';

interface WorkflowConfigTestState {
  validationResult:
    | { success: true; data: WorkflowConfig }
    | { success: false; error: unknown }
    | null;
  loadedWorkflow: LoadedWorkflow | null;
  typeGuardResult: boolean;
  config: WorkflowConfig | null;
}

let state: WorkflowConfigTestState | null = null;

function initState(): WorkflowConfigTestState {
  return { validationResult: null, loadedWorkflow: null, typeGuardResult: false, config: null };
}

function createMinimalWorkflowConfig(overrides: Partial<WorkflowConfig> = {}): WorkflowConfig {
  return {
    name: overrides.name ?? 'test-workflow',
    version: overrides.version ?? '1.0.0',
    statuses: overrides.statuses ?? [{ name: 'roadmap', emoji: '📋' }],
    phases: overrides.phases ?? [{ name: 'Inception' }],
    ...('description' in overrides ? { description: overrides.description } : {}),
    ...('defaultStatus' in overrides ? { defaultStatus: overrides.defaultStatus } : {}),
    ...('metadata' in overrides ? { metadata: overrides.metadata } : {}),
  };
}

const feature = await loadFeature('tests/features/validation/workflow-config-schemas.feature');

describeFeature(feature, ({ Rule, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a workflow config test context', () => {
      state = initState();
    });
  });

  Rule('WorkflowConfigSchema validates workflow configurations', ({ RuleScenario }) => {
    RuleScenario('Valid workflow config passes schema validation', ({ When, Then }) => {
      When(
        'I validate a workflow config with name "standard" and version "1.0.0" with 1 status and 1 phase',
        () => {
          state!.validationResult = WorkflowConfigSchema.safeParse({
            name: 'standard',
            version: '1.0.0',
            statuses: [{ name: 'roadmap', emoji: '📋' }],
            phases: [{ name: 'Inception' }],
          });
        }
      );
      Then('the workflow config should be valid', () => {
        expect(state!.validationResult!.success).toBe(true);
      });
    });

    RuleScenario('Config without name is rejected', ({ When, Then }) => {
      When('I validate a workflow config without a name', () => {
        state!.validationResult = WorkflowConfigSchema.safeParse({
          version: '1.0.0',
          statuses: [{ name: 'roadmap', emoji: '📋' }],
          phases: [{ name: 'Inception' }],
        });
      });
      Then('the workflow config should be invalid', () => {
        expect(state!.validationResult!.success).toBe(false);
      });
    });

    RuleScenario('Config with invalid semver version is rejected', ({ When, Then }) => {
      When('I validate a workflow config with name "standard" and version "not-semver"', () => {
        state!.validationResult = WorkflowConfigSchema.safeParse({
          name: 'standard',
          version: 'not-semver',
          statuses: [{ name: 'roadmap', emoji: '📋' }],
          phases: [{ name: 'Inception' }],
        });
      });
      Then('the workflow config should be invalid', () => {
        expect(state!.validationResult!.success).toBe(false);
      });
    });

    RuleScenario('Config without statuses is rejected', ({ When, Then }) => {
      When(
        'I validate a workflow config with name "standard" and version "1.0.0" with 0 statuses',
        () => {
          state!.validationResult = WorkflowConfigSchema.safeParse({
            name: 'standard',
            version: '1.0.0',
            statuses: [],
            phases: [{ name: 'Inception' }],
          });
        }
      );
      Then('the workflow config should be invalid', () => {
        expect(state!.validationResult!.success).toBe(false);
      });
    });

    RuleScenario('Config without phases is rejected', ({ When, Then }) => {
      When(
        'I validate a workflow config with name "standard" and version "1.0.0" with 0 phases',
        () => {
          state!.validationResult = WorkflowConfigSchema.safeParse({
            name: 'standard',
            version: '1.0.0',
            statuses: [{ name: 'roadmap', emoji: '📋' }],
            phases: [],
          });
        }
      );
      Then('the workflow config should be invalid', () => {
        expect(state!.validationResult!.success).toBe(false);
      });
    });
  });

  Rule('createLoadedWorkflow builds efficient lookup maps', ({ RuleScenario }) => {
    RuleScenario('Loaded workflow has status lookup map', ({ Given, When, Then, And }) => {
      Given('a valid workflow config with status "roadmap" and status "active"', () => {
        state!.config = createMinimalWorkflowConfig({
          statuses: [
            { name: 'roadmap', emoji: '📋' },
            { name: 'active', emoji: '🔨' },
          ],
        });
      });
      When('I create a loaded workflow', () => {
        state!.loadedWorkflow = createLoadedWorkflow(state!.config!);
      });
      Then('the status map should contain "roadmap"', () => {
        expect(state!.loadedWorkflow!.statusMap.has('roadmap')).toBe(true);
      });
      And('the status map should contain "active"', () => {
        expect(state!.loadedWorkflow!.statusMap.has('active')).toBe(true);
      });
      And('the status map should have 2 entries', () => {
        expect(state!.loadedWorkflow!.statusMap.size).toBe(2);
      });
    });

    RuleScenario('Status lookup is case-insensitive', ({ Given, When, Then, And }) => {
      Given('a valid workflow config with status "Roadmap" and status "Active"', () => {
        state!.config = createMinimalWorkflowConfig({
          statuses: [
            { name: 'Roadmap', emoji: '📋' },
            { name: 'Active', emoji: '🔨' },
          ],
        });
      });
      When('I create a loaded workflow', () => {
        state!.loadedWorkflow = createLoadedWorkflow(state!.config!);
      });
      Then('the status map should contain "roadmap"', () => {
        expect(state!.loadedWorkflow!.statusMap.has('roadmap')).toBe(true);
      });
      And('the status map should contain "active"', () => {
        expect(state!.loadedWorkflow!.statusMap.has('active')).toBe(true);
      });
    });

    RuleScenario('Loaded workflow has phase lookup map', ({ Given, When, Then, And }) => {
      Given('a valid workflow config with phase "Inception" and phase "Construction"', () => {
        state!.config = createMinimalWorkflowConfig({
          phases: [{ name: 'Inception' }, { name: 'Construction' }],
        });
      });
      When('I create a loaded workflow', () => {
        state!.loadedWorkflow = createLoadedWorkflow(state!.config!);
      });
      Then('the phase map should contain "inception"', () => {
        expect(state!.loadedWorkflow!.phaseMap.has('inception')).toBe(true);
      });
      And('the phase map should contain "construction"', () => {
        expect(state!.loadedWorkflow!.phaseMap.has('construction')).toBe(true);
      });
      And('the phase map should have 2 entries', () => {
        expect(state!.loadedWorkflow!.phaseMap.size).toBe(2);
      });
    });

    RuleScenario('Phase lookup is case-insensitive', ({ Given, When, Then, And }) => {
      Given('a valid workflow config with phase "Inception" and phase "Construction"', () => {
        state!.config = createMinimalWorkflowConfig({
          phases: [{ name: 'Inception' }, { name: 'Construction' }],
        });
      });
      When('I create a loaded workflow', () => {
        state!.loadedWorkflow = createLoadedWorkflow(state!.config!);
      });
      Then('the phase map should contain "inception"', () => {
        expect(state!.loadedWorkflow!.phaseMap.has('inception')).toBe(true);
      });
      And('the phase map should contain "construction"', () => {
        expect(state!.loadedWorkflow!.phaseMap.has('construction')).toBe(true);
      });
    });
  });

  Rule('isWorkflowConfig type guard validates at runtime', ({ RuleScenario }) => {
    RuleScenario('Type guard accepts valid workflow config', ({ When, Then }) => {
      When('I check isWorkflowConfig with a valid config', () => {
        state!.typeGuardResult = isWorkflowConfig(createMinimalWorkflowConfig());
      });
      Then('isWorkflowConfig should return true', () => {
        expect(state!.typeGuardResult).toBe(true);
      });
    });

    RuleScenario('Type guard rejects null', ({ When, Then }) => {
      When('I check isWorkflowConfig with null', () => {
        state!.typeGuardResult = isWorkflowConfig(null);
      });
      Then('isWorkflowConfig should return false', () => {
        expect(state!.typeGuardResult).toBe(false);
      });
    });

    RuleScenario('Type guard rejects partial config', ({ When, Then }) => {
      When('I check isWorkflowConfig with a partial config missing statuses', () => {
        state!.typeGuardResult = isWorkflowConfig({
          name: 'test',
          version: '1.0.0',
          phases: [{ name: 'Inception' }],
        });
      });
      Then('isWorkflowConfig should return false', () => {
        expect(state!.typeGuardResult).toBe(false);
      });
    });

    RuleScenario('Type guard rejects non-object', ({ When, Then }) => {
      When('I check isWorkflowConfig with the string "not a config"', () => {
        state!.typeGuardResult = isWorkflowConfig('not a config');
      });
      Then('isWorkflowConfig should return false', () => {
        expect(state!.typeGuardResult).toBe(false);
      });
    });
  });
});
