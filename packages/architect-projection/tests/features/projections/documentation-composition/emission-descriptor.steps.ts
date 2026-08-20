import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import { EmissionDescriptorSchema } from '../../../../src/index.js';

const feature = await loadFeature(
  'tests/features/projections/documentation-composition/emission-descriptor.feature',
);

const wholeArtifact = (
  rootTarget: string,
  routeExtra: Record<string, unknown> = {},
  descriptorExtra: Record<string, unknown> = {},
): unknown => ({
  mode: 'whole-artifact',
  markdownFileRoute: { rootTarget, ...routeExtra },
  ...descriptorExtra,
});

const embedded = (hostFile: string, regions: unknown[]): unknown => ({
  mode: 'embedded-region',
  hostFile,
  regions,
});

const region = (source: string, regionId: string): unknown => ({ source, regionId });

const parses = (value: unknown): void => {
  expect(EmissionDescriptorSchema.safeParse(value).success).toBe(true);
};

const rejects = (value: unknown): void => {
  expect(EmissionDescriptorSchema.safeParse(value).success).toBe(false);
};

const rejectsWith = (value: unknown, needle: string): void => {
  const result = EmissionDescriptorSchema.safeParse(value);
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(JSON.stringify(result.error.issues)).toContain(needle);
  }
};

describeFeature(feature, ({ Background, Rule }) => {
  Background(({ Given }) => {
    Given('the emission descriptor contract state is initialized', () => {
      // The schema is the contract; no mutable state to seed.
      expect(typeof EmissionDescriptorSchema.safeParse).toBe('function');
    });
  });

  Rule(
    'Emission mode is a discriminated union of the two markdown-file placements',
    ({ RuleScenario }) => {
      RuleScenario(
        'a whole-artifact descriptor names the markdown file it writes',
        ({ Then, And }) => {
          Then('a whole-artifact descriptor with a repo-relative ".md" root target parses', () => {
            parses(wholeArtifact('docs-live/TAXONOMY.md'));
          });

          And('a whole-artifact descriptor with no markdown file route is rejected', () => {
            rejects({ mode: 'whole-artifact' });
          });
        },
      );

      RuleScenario(
        'an embedded-region descriptor requires a host file and at least one region',
        ({ Then, And }) => {
          Then('an embedded-region descriptor with a host file and one region parses', () => {
            parses(
              embedded('.agents/skills/architect-base/references/taxonomy.md', [
                region('role-enum', 'taxonomy-role-enum'),
              ]),
            );
          });

          And('an embedded-region descriptor with an empty region list is rejected', () => {
            rejects(embedded('docs-live/host.md', []));
          });
        },
      );

      RuleScenario('an unknown emission mode is rejected', ({ Then, And }) => {
        Then(
          'a descriptor whose mode is neither whole-artifact nor embedded-region is rejected',
          () => {
            rejects({ mode: 'inline', markdownFileRoute: { rootTarget: 'docs-live/X.md' } });
          },
        );

        And('a whole-artifact strictObject variant rejects an unexpected extra property', () => {
          rejects(wholeArtifact('docs-live/TAXONOMY.md', {}, { unexpected: true }));
        });

        And('an embedded-region strictObject variant rejects an unexpected extra property', () => {
          rejects({
            mode: 'embedded-region',
            hostFile: 'docs-live/host.md',
            regions: [region('role-enum', 'taxonomy-role-enum')],
            unexpected: true,
          });
        });
      });

      RuleScenario(
        'the whole-artifact route validates its optional entity-layout enum',
        ({ Then, And }) => {
          Then('a whole-artifact route with a nested-index entity layout parses', () => {
            parses(
              wholeArtifact('docs-live/ARCHITECTURE.md', { entityPathLayout: 'nested-index' }),
            );
          });

          And('a whole-artifact route with an out-of-enum entity layout is rejected', () => {
            rejects(wholeArtifact('docs-live/ARCHITECTURE.md', { entityPathLayout: 'tree' }));
          });
        },
      );
    },
  );

  Rule(
    'Descriptor paths stay repo-contained at the parse-once trust boundary',
    ({ RuleScenario }) => {
      RuleScenario(
        'a whole-artifact root target rejects repo-escaping and non-markdown paths',
        ({ Then, And }) => {
          Then('an absolute root target is rejected', () => {
            rejects(wholeArtifact('/etc/passwd.md'));
          });

          And('a parent-traversal root target is rejected', () => {
            rejects(wholeArtifact('../escape.md'));
          });

          And('a home-rooted root target is rejected', () => {
            rejects(wholeArtifact('~/secrets.md'));
          });

          And('a Windows drive-rooted root target is rejected', () => {
            rejects(wholeArtifact('C:/Users/x.md'));
          });

          And('a backslash-bearing root target is rejected', () => {
            rejects(wholeArtifact('docs-live\\TAXONOMY.md'));
          });

          And('a non-".md" root target is rejected', () => {
            rejects(wholeArtifact('docs-live/TAXONOMY.txt'));
          });

          And('an empty interior path segment is rejected', () => {
            rejects(wholeArtifact('docs-live//TAXONOMY.md'));
          });

          And('a single-dot path segment is rejected', () => {
            rejects(wholeArtifact('docs-live/./TAXONOMY.md'));
          });

          And('a non-leading parent-traversal segment is rejected', () => {
            rejects(wholeArtifact('docs-live/../escape.md'));
          });
        },
      );

      RuleScenario(
        'an embedded host file is held to the same repo-relative markdown contract',
        ({ Then, And }) => {
          Then('a parent-traversal host file is rejected', () => {
            rejects(embedded('../outside/host.md', [region('role-enum', 'taxonomy-role-enum')]));
          });

          And(
            'an accepted out-of-docs-live host file ".agents/skills/architect-base/references/taxonomy.md" parses',
            () => {
              parses(
                embedded('.agents/skills/architect-base/references/taxonomy.md', [
                  region('tag-count', 'taxonomy-tag-count'),
                ]),
              );
            },
          );
        },
      );

      RuleScenario(
        'a child directory shares containment but carries no markdown-suffix rule',
        ({ Then, And }) => {
          Then('a bare repo-relative child directory parses', () => {
            parses(wholeArtifact('docs-live/ARCHITECTURE.md', { childDirectory: 'architecture' }));
          });

          And('a parent-traversal child directory is rejected', () => {
            rejects(
              wholeArtifact('docs-live/ARCHITECTURE.md', { childDirectory: '../architecture' }),
            );
          });
        },
      );
    },
  );

  Rule(
    'Region identity is (hostFile, regionId) and is unique within a host',
    ({ RuleScenario }) => {
      RuleScenario('a duplicate region id within one host is rejected', ({ Then, And }) => {
        Then('two regions sharing a region id in the same host are rejected', () => {
          rejects(
            embedded('formal-spec/04-tag-registry.md', [
              region('core-identity', 'tag-group'),
              region('classification', 'tag-group'),
            ]),
          );
        });

        And('the rejection names the duplicate region id', () => {
          rejectsWith(
            embedded('formal-spec/04-tag-registry.md', [
              region('core-identity', 'tag-group'),
              region('classification', 'tag-group'),
            ]),
            'duplicate regionId',
          );
        });
      });

      RuleScenario(
        'the same region id slug in two different hosts is not a collision',
        ({ Then }) => {
          Then(
            'the same region id slug parses independently in two separate host descriptors',
            () => {
              parses(
                embedded('.agents/skills/architect-base/references/taxonomy.md', [
                  region('role-enum', 'shared-slug'),
                ]),
              );
              parses(
                embedded('formal-spec/04-tag-registry.md', [
                  region('core-identity', 'shared-slug'),
                ]),
              );
            },
          );
        },
      );

      RuleScenario(
        'a region source or id that is not a lowercase-kebab slug is rejected',
        ({ Then, And }) => {
          Then('a region source containing a space is rejected', () => {
            rejects(embedded('docs-live/host.md', [region('core identity', 'tag-group')]));
          });

          And('a region id containing an underscore is rejected', () => {
            rejects(embedded('docs-live/host.md', [region('core-identity', 'tag_group')]));
          });
        },
      );
    },
  );
});
