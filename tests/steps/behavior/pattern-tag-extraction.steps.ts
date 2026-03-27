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

describeFeature(feature, ({ Rule, Background, BeforeEachScenario }) => {
  BeforeEachScenario(() => {
    state = initState();
  });

  Background(({ Given }) => {
    Given('a pattern tag extraction context', () => {
      // State is already initialized in BeforeEachScenario
    });
  });

  // ===========================================================================
  // Rule: Single value tags produce scalar metadata fields
  // ===========================================================================

  Rule('Single value tags produce scalar metadata fields', ({ RuleScenario }) => {
    RuleScenario('Extract pattern name tag', ({ Given, When, Then }) => {
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

    RuleScenario('Extract phase number tag', ({ Given, When, Then }) => {
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

    RuleScenario('Extract status roadmap tag', ({ Given, When, Then }) => {
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

    RuleScenario('Extract status deferred tag', ({ Given, When, Then }) => {
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

    RuleScenario('Extract status completed tag', ({ Given, When, Then }) => {
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

    RuleScenario('Extract status active tag', ({ Given, When, Then }) => {
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

    RuleScenario('Extract brief path tag', ({ Given, When, Then }) => {
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
  });

  // ===========================================================================
  // Rule: Array value tags accumulate into list metadata fields
  // ===========================================================================

  Rule('Array value tags accumulate into list metadata fields', ({ RuleScenario }) => {
    RuleScenario('Extract single dependency', ({ Given, When, Then }) => {
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

    RuleScenario('Extract comma-separated dependencies', ({ Given, When, Then, And }) => {
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

    RuleScenario('Extract comma-separated enables', ({ Given, When, Then, And }) => {
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
  });

  // ===========================================================================
  // Rule: Category tags are colon-free tags filtered against known non-categories
  // ===========================================================================

  Rule(
    'Category tags are colon-free tags filtered against known non-categories',
    ({ RuleScenario }) => {
      RuleScenario('Extract category tags (no colon)', ({ Given, When, Then, And }) => {
        Given('feature tags "ddd", "core", "event-sourcing", and "acceptance-criteria"', () => {
          state!.tags = ['ddd', 'core', 'event-sourcing', 'acceptance-criteria'];
        });

        When('extracting pattern tags', () => {
          state!.metadata = extractPatternTags(state!.tags);
        });

        Then('the metadata categories should contain "ddd"', () => {
          expect(state!.metadata.categories).toContain('ddd');
        });

        And('the metadata core flag should be true', () => {
          expect(state!.metadata.core).toBe(true);
        });

        And('the metadata categories should contain "event-sourcing"', () => {
          expect(state!.metadata.categories).toContain('event-sourcing');
        });

        And('the metadata categories should not contain "acceptance-criteria"', () => {
          // acceptance-criteria is a known non-category tag that should be filtered out
          expect(state!.metadata.categories).not.toContain('acceptance-criteria');
        });
      });

      RuleScenario('architect opt-in marker is NOT a category', ({ Given, When, Then, And }) => {
        Given('feature tags "architect", "ddd", and "core"', () => {
          // @architect is the opt-in marker, NOT a domain category
          // "architect" should be excluded from categories
          state!.tags = ['architect', 'ddd', 'core'];
        });

        When('extracting pattern tags', () => {
          state!.metadata = extractPatternTags(state!.tags);
        });

        Then('the metadata categories should contain "ddd"', () => {
          expect(state!.metadata.categories).toContain('ddd');
        });

        And('the metadata core flag should be true', () => {
          expect(state!.metadata.core).toBe(true);
        });

        And('the metadata categories should not contain "architect"', () => {
          // architect is the opt-in marker, NOT a domain category
          expect(state!.metadata.categories).not.toContain('architect');
        });
      });
    }
  );

  // ===========================================================================
  // Rule: Complex tag lists produce fully populated metadata
  // ===========================================================================

  Rule('Complex tag lists produce fully populated metadata', ({ RuleScenario }) => {
    RuleScenario('Extract all metadata from complex tag list', ({ Given, When, Then, And }) => {
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

      And('the metadata core flag should be true', () => {
        expect(state!.metadata.core).toBe(true);
      });
    });
  });

  // ===========================================================================
  // Rule: Edge cases produce safe defaults
  // ===========================================================================

  Rule('Edge cases produce safe defaults', ({ RuleScenario }) => {
    RuleScenario('Empty tag list returns empty metadata', ({ Given, When, Then }) => {
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

    RuleScenario('Invalid phase number is ignored', ({ Given, When, Then }) => {
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

  // ===========================================================================
  // Rule: Convention tags support CSV values with whitespace trimming
  // ===========================================================================

  Rule('Convention tags support CSV values with whitespace trimming', ({ RuleScenario }) => {
    RuleScenario('Extract single convention tag', ({ Given, When, Then }) => {
      Given('feature tags containing "convention:testing-policy"', () => {
        state!.tags = ['convention:testing-policy'];
      });

      When('extracting pattern tags', () => {
        state!.metadata = extractPatternTags(state!.tags);
      });

      Then('the metadata convention should contain "testing-policy"', () => {
        expect(state!.metadata.convention).toContain('testing-policy');
      });
    });

    RuleScenario('Extract CSV convention tags', ({ Given, When, Then, And }) => {
      Given('feature tags containing "convention:fsm-rules,testing-policy"', () => {
        state!.tags = ['convention:fsm-rules,testing-policy'];
      });

      When('extracting pattern tags', () => {
        state!.metadata = extractPatternTags(state!.tags);
      });

      Then('the metadata convention should contain "fsm-rules"', () => {
        expect(state!.metadata.convention).toContain('fsm-rules');
      });

      And('the metadata convention should contain "testing-policy"', () => {
        expect(state!.metadata.convention).toContain('testing-policy');
      });
    });

    RuleScenario('Convention tag trims whitespace in CSV values', ({ Given, When, Then, And }) => {
      Given('feature tags containing "convention:fsm-rules, testing-policy , cli-patterns"', () => {
        state!.tags = ['convention:fsm-rules, testing-policy , cli-patterns'];
      });

      When('extracting pattern tags', () => {
        state!.metadata = extractPatternTags(state!.tags);
      });

      Then('the metadata convention should contain "fsm-rules"', () => {
        expect(state!.metadata.convention).toContain('fsm-rules');
      });

      And('the metadata convention should contain "testing-policy"', () => {
        expect(state!.metadata.convention).toContain('testing-policy');
      });

      And('the metadata convention should contain "cli-patterns"', () => {
        expect(state!.metadata.convention).toContain('cli-patterns');
      });
    });
  });

  // ===========================================================================
  // Rule: Registry-driven extraction handles enums, transforms, and value constraints
  // ===========================================================================

  Rule(
    'Registry-driven extraction handles enums, transforms, and value constraints',
    ({ RuleScenario }) => {
      RuleScenario(
        'Registry-driven enum tag without prior if/else branch',
        ({ Given, When, Then }) => {
          Given('feature tags containing "adr-theme:persistence"', () => {
            state!.tags = ['adr-theme:persistence'];
          });

          When('extracting pattern tags', () => {
            state!.metadata = extractPatternTags(state!.tags);
          });

          Then('the metadata adrTheme should be "persistence"', () => {
            expect(state!.metadata.adrTheme).toBe('persistence');
          });
        }
      );

      RuleScenario('Registry-driven enum rejects invalid value', ({ Given, When, Then }) => {
        Given('feature tags containing "adr-theme:invalid-theme"', () => {
          state!.tags = ['adr-theme:invalid-theme'];
        });

        When('extracting pattern tags', () => {
          state!.metadata = extractPatternTags(state!.tags);
        });

        Then('the metadata should not have adrTheme', () => {
          expect(state!.metadata.adrTheme).toBeUndefined();
        });
      });

      RuleScenario('Registry-driven CSV tag accumulates values', ({ Given, When, Then, And }) => {
        Given('feature tags containing "include:pipeline-overview,codec-transformation"', () => {
          state!.tags = ['include:pipeline-overview,codec-transformation'];
        });

        When('extracting pattern tags', () => {
          state!.metadata = extractPatternTags(state!.tags);
        });

        Then('the metadata include should contain "pipeline-overview"', () => {
          expect(state!.metadata.include).toContain('pipeline-overview');
        });

        And('the metadata include should contain "codec-transformation"', () => {
          expect(state!.metadata.include).toContain('codec-transformation');
        });
      });

      RuleScenario(
        'Transform applies hyphen-to-space on business value',
        ({ Given, When, Then }) => {
          Given('feature tags containing "business-value:eliminates-manual-docs"', () => {
            state!.tags = ['business-value:eliminates-manual-docs'];
          });

          When('extracting pattern tags', () => {
            state!.metadata = extractPatternTags(state!.tags);
          });

          Then('the metadata businessValue should be "eliminates manual docs"', () => {
            expect(state!.metadata.businessValue).toBe('eliminates manual docs');
          });
        }
      );

      RuleScenario('Transform applies ADR number padding', ({ Given, When, Then }) => {
        Given('feature tags containing "adr:5"', () => {
          state!.tags = ['adr:5'];
        });

        When('extracting pattern tags', () => {
          state!.metadata = extractPatternTags(state!.tags);
        });

        Then('the metadata adr should be "005"', () => {
          expect(state!.metadata.adr).toBe('005');
        });
      });

      RuleScenario('Transform strips quotes from title tag', ({ Given, When, Then }) => {
        Given('feature tags containing "title:\'Process Guard Linter\'"', () => {
          state!.tags = ["title:'Process Guard Linter'"];
        });

        When('extracting pattern tags', () => {
          state!.metadata = extractPatternTags(state!.tags);
        });

        Then('the metadata title should be "Process Guard Linter"', () => {
          expect(state!.metadata.title).toBe('Process Guard Linter');
        });
      });

      RuleScenario(
        'Repeatable value tag accumulates multiple occurrences',
        ({ Given, When, Then, And }) => {
          Given(
            'feature tags containing "discovered-gap:missing-tests" and "discovered-gap:no-validation"',
            () => {
              state!.tags = ['discovered-gap:missing-tests', 'discovered-gap:no-validation'];
            }
          );

          When('extracting pattern tags', () => {
            state!.metadata = extractPatternTags(state!.tags);
          });

          Then('the metadata discoveredGaps should contain "missing tests"', () => {
            expect(state!.metadata.discoveredGaps).toContain('missing tests');
          });

          And('the metadata discoveredGaps should contain "no validation"', () => {
            expect(state!.metadata.discoveredGaps).toContain('no validation');
          });
        }
      );

      RuleScenario(
        'CSV with values constraint rejects invalid values',
        ({ Given, When, Then, And }) => {
          Given(
            'feature tags containing "convention:testing-policy,nonexistent-value,fsm-rules"',
            () => {
              state!.tags = ['convention:testing-policy,nonexistent-value,fsm-rules'];
            }
          );

          When('extracting pattern tags', () => {
            state!.metadata = extractPatternTags(state!.tags);
          });

          Then('the metadata convention should contain "testing-policy"', () => {
            expect(state!.metadata.convention).toContain('testing-policy');
          });

          And('the metadata convention should contain "fsm-rules"', () => {
            expect(state!.metadata.convention).toContain('fsm-rules');
          });

          And('the metadata convention should not contain "nonexistent-value"', () => {
            expect(state!.metadata.convention).not.toContain('nonexistent-value');
          });
        }
      );
    }
  );
});
