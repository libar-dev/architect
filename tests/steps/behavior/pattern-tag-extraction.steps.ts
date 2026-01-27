/**
 * Pattern Tag Extraction Step Definitions
 *
 * BDD step definitions for testing the extractPatternTags function
 * which parses Gherkin feature tags into structured metadata objects.
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { extractPatternTags } from '../../../src/scanner/gherkin-ast-parser.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface PatternTagExtractionState {
  tags: string[];
  metadata: ReturnType<typeof extractPatternTags>;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: PatternTagExtractionState | null = null;

// =============================================================================
// Helper Functions
// =============================================================================

function initState(): PatternTagExtractionState {
  return {
    tags: [],
    metadata: {},
  };
}

// =============================================================================
// Feature: Pattern Tag Extraction from Gherkin Feature Tags
// =============================================================================

const feature = await loadFeature('tests/features/behavior/pattern-tag-extraction.feature');

describeFeature(feature, ({ Scenario, Background, BeforeEachScenario }) => {
  BeforeEachScenario(() => {
    state = initState();
  });

  Background(({ Given }) => {
    Given('a pattern tag extraction context', () => {
      // State is already initialized in BeforeEachScenario
    });
  });

  // ===========================================================================
  // Single Tag Extraction - Pattern Name
  // ===========================================================================

  Scenario('Extract pattern name tag', ({ Given, When, Then }) => {
    Given('feature tags containing "pattern:MyPattern"', () => {
      state!.tags = ['pattern:MyPattern', 'other:tag'];
    });

    When('extracting pattern tags', () => {
      state!.metadata = extractPatternTags(state!.tags);
    });

    Then('the metadata pattern should be "MyPattern"', () => {
      expect(state!.metadata.pattern).toBe('MyPattern');
    });
  });

  // ===========================================================================
  // Single Tag Extraction - Phase Number
  // ===========================================================================

  Scenario('Extract phase number tag', ({ Given, When, Then }) => {
    Given('feature tags containing "phase:15"', () => {
      state!.tags = ['phase:15', 'other:tag'];
    });

    When('extracting pattern tags', () => {
      state!.metadata = extractPatternTags(state!.tags);
    });

    Then('the metadata phase should be 15', () => {
      expect(state!.metadata.phase).toBe(15);
    });
  });

  // ===========================================================================
  // Single Tag Extraction - Status Values
  // ===========================================================================

  Scenario('Extract status roadmap tag', ({ Given, When, Then }) => {
    Given('feature tags containing "status:roadmap"', () => {
      state!.tags = ['status:roadmap', 'other:tag'];
    });

    When('extracting pattern tags', () => {
      state!.metadata = extractPatternTags(state!.tags);
    });

    Then('the metadata status should be "roadmap"', () => {
      expect(state!.metadata.status).toBe('roadmap');
    });
  });

  Scenario('Extract status deferred tag', ({ Given, When, Then }) => {
    Given('feature tags containing "status:deferred"', () => {
      state!.tags = ['status:deferred', 'other:tag'];
    });

    When('extracting pattern tags', () => {
      state!.metadata = extractPatternTags(state!.tags);
    });

    Then('the metadata status should be "deferred"', () => {
      expect(state!.metadata.status).toBe('deferred');
    });
  });

  Scenario('Extract status completed tag', ({ Given, When, Then }) => {
    Given('feature tags containing "status:completed"', () => {
      state!.tags = ['status:completed', 'other:tag'];
    });

    When('extracting pattern tags', () => {
      state!.metadata = extractPatternTags(state!.tags);
    });

    Then('the metadata status should be "completed"', () => {
      expect(state!.metadata.status).toBe('completed');
    });
  });

  Scenario('Extract status active tag', ({ Given, When, Then }) => {
    Given('feature tags containing "status:active"', () => {
      state!.tags = ['status:active', 'other:tag'];
    });

    When('extracting pattern tags', () => {
      state!.metadata = extractPatternTags(state!.tags);
    });

    Then('the metadata status should be "active"', () => {
      expect(state!.metadata.status).toBe('active');
    });
  });

  // ===========================================================================
  // Brief Path Tag
  // ===========================================================================

  Scenario('Extract brief path tag', ({ Given, When, Then }) => {
    Given('feature tags containing "brief:docs/pattern-briefs/01-my-pattern.md"', () => {
      state!.tags = ['brief:docs/pattern-briefs/01-my-pattern.md'];
    });

    When('extracting pattern tags', () => {
      state!.metadata = extractPatternTags(state!.tags);
    });

    Then('the metadata brief should be "docs/pattern-briefs/01-my-pattern.md"', () => {
      expect(state!.metadata.brief).toBe('docs/pattern-briefs/01-my-pattern.md');
    });
  });

  // ===========================================================================
  // Array Value Extraction (Dependencies/Enables)
  // ===========================================================================

  Scenario('Extract single dependency', ({ Given, When, Then }) => {
    Given('feature tags containing "depends-on:Pattern1"', () => {
      state!.tags = ['depends-on:Pattern1'];
    });

    When('extracting pattern tags', () => {
      state!.metadata = extractPatternTags(state!.tags);
    });

    Then('the metadata dependsOn should contain "Pattern1"', () => {
      expect(state!.metadata.dependsOn).toContain('Pattern1');
    });
  });

  Scenario('Extract comma-separated dependencies', ({ Given, When, Then, And }) => {
    Given(
      'feature tags containing "depends-on:Pattern1" and "depends-on:Pattern2,Pattern3"',
      () => {
        state!.tags = ['depends-on:Pattern1', 'depends-on:Pattern2,Pattern3'];
      }
    );

    When('extracting pattern tags', () => {
      state!.metadata = extractPatternTags(state!.tags);
    });

    Then('the metadata dependsOn should contain "Pattern1"', () => {
      expect(state!.metadata.dependsOn).toContain('Pattern1');
    });

    And('the metadata dependsOn should contain "Pattern2"', () => {
      expect(state!.metadata.dependsOn).toContain('Pattern2');
    });

    And('the metadata dependsOn should contain "Pattern3"', () => {
      expect(state!.metadata.dependsOn).toContain('Pattern3');
    });
  });

  Scenario('Extract comma-separated enables', ({ Given, When, Then, And }) => {
    Given('feature tags containing "enables:Pattern1,Pattern2"', () => {
      state!.tags = ['enables:Pattern1,Pattern2'];
    });

    When('extracting pattern tags', () => {
      state!.metadata = extractPatternTags(state!.tags);
    });

    Then('the metadata enables should contain "Pattern1"', () => {
      expect(state!.metadata.enables).toContain('Pattern1');
    });

    And('the metadata enables should contain "Pattern2"', () => {
      expect(state!.metadata.enables).toContain('Pattern2');
    });
  });

  // ===========================================================================
  // Category Tag Extraction
  // ===========================================================================

  Scenario('Extract category tags (no colon)', ({ Given, When, Then, And }) => {
    Given('feature tags "ddd", "core", "event-sourcing", and "acceptance-criteria"', () => {
      state!.tags = ['ddd', 'core', 'event-sourcing', 'acceptance-criteria'];
    });

    When('extracting pattern tags', () => {
      state!.metadata = extractPatternTags(state!.tags);
    });

    Then('the metadata categories should contain "ddd"', () => {
      expect(state!.metadata.categories).toContain('ddd');
    });

    And('the metadata categories should contain "core"', () => {
      expect(state!.metadata.categories).toContain('core');
    });

    And('the metadata categories should contain "event-sourcing"', () => {
      expect(state!.metadata.categories).toContain('event-sourcing');
    });

    And('the metadata categories should not contain "acceptance-criteria"', () => {
      // acceptance-criteria is a known non-category tag that should be filtered out
      expect(state!.metadata.categories).not.toContain('acceptance-criteria');
    });
  });

  Scenario('libar-docs opt-in marker is NOT a category', ({ Given, When, Then, And }) => {
    Given('feature tags "libar-docs", "ddd", and "core"', () => {
      // @libar-docs is the opt-in marker, NOT a domain category
      // After normalization, it becomes "libar-docs" and should be excluded
      state!.tags = ['libar-docs', 'ddd', 'core'];
    });

    When('extracting pattern tags', () => {
      state!.metadata = extractPatternTags(state!.tags);
    });

    Then('the metadata categories should contain "ddd"', () => {
      expect(state!.metadata.categories).toContain('ddd');
    });

    And('the metadata categories should contain "core"', () => {
      expect(state!.metadata.categories).toContain('core');
    });

    And('the metadata categories should not contain "libar-docs"', () => {
      // libar-docs is the opt-in marker, NOT a domain category
      expect(state!.metadata.categories).not.toContain('libar-docs');
    });
  });

  // ===========================================================================
  // Complex Tag Extraction
  // ===========================================================================

  Scenario('Extract all metadata from complex tag list', ({ Given, When, Then, And }) => {
    Given(
      'a complex tag list with pattern, phase, status, dependencies, enables, brief, and categories',
      () => {
        state!.tags = [
          'pattern:DCB',
          'phase:16',
          'status:roadmap',
          'depends-on:DeciderTypes',
          'enables:Reservations,MultiEntityOps',
          'brief:pattern-briefs/03-dcb.md',
          'ddd',
          'core',
        ];
      }
    );

    When('extracting pattern tags', () => {
      state!.metadata = extractPatternTags(state!.tags);
    });

    Then('the metadata should have pattern equal to "DCB"', () => {
      expect(state!.metadata.pattern).toBe('DCB');
    });

    And('the metadata should have phase equal to 16', () => {
      expect(state!.metadata.phase).toBe(16);
    });

    And('the metadata should have status equal to "roadmap"', () => {
      expect(state!.metadata.status).toBe('roadmap');
    });

    And('the metadata dependsOn should contain "DeciderTypes"', () => {
      expect(state!.metadata.dependsOn).toContain('DeciderTypes');
    });

    And('the metadata enables should contain "Reservations"', () => {
      expect(state!.metadata.enables).toContain('Reservations');
    });

    And('the metadata enables should contain "MultiEntityOps"', () => {
      expect(state!.metadata.enables).toContain('MultiEntityOps');
    });

    And('the metadata should have brief equal to "pattern-briefs/03-dcb.md"', () => {
      expect(state!.metadata.brief).toBe('pattern-briefs/03-dcb.md');
    });

    And('the metadata categories should contain "ddd"', () => {
      expect(state!.metadata.categories).toContain('ddd');
    });

    And('the metadata categories should contain "core"', () => {
      expect(state!.metadata.categories).toContain('core');
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  Scenario('Empty tag list returns empty metadata', ({ Given, When, Then }) => {
    Given('an empty tag list', () => {
      state!.tags = [];
    });

    When('extracting pattern tags', () => {
      state!.metadata = extractPatternTags(state!.tags);
    });

    Then('the metadata should be empty', () => {
      expect(state!.metadata).toEqual({});
    });
  });

  Scenario('Invalid phase number is ignored', ({ Given, When, Then }) => {
    Given('feature tags containing "phase:invalid"', () => {
      state!.tags = ['phase:invalid'];
    });

    When('extracting pattern tags', () => {
      state!.metadata = extractPatternTags(state!.tags);
    });

    Then('the metadata should not have phase', () => {
      expect(state!.metadata.phase).toBeUndefined();
    });
  });
});
