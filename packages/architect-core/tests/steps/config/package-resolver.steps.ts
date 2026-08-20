import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  ProjectionError,
  createPackageResolver,
  type Package,
  type PackageConfig,
} from '../../../src/index.js';

interface ResolverState {
  entries: PackageConfig[];
  resolver: ReturnType<typeof createPackageResolver> | null;
  resolved: Package | null;
  resolvedAgain: Package | null;
  caughtError: unknown;
}

let state: ResolverState | null = null;

function init(): ResolverState {
  return {
    entries: [],
    resolver: null,
    resolved: null,
    resolvedAgain: null,
    caughtError: null,
  };
}

function ensureResolver(): ReturnType<typeof createPackageResolver> {
  if (state!.resolver === null) {
    state!.resolver = createPackageResolver(state!.entries);
  }
  return state!.resolver;
}

const feature = await loadFeature('tests/features/config/package-resolver.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a package-resolver test context', () => {
      state = init();
    });
  });

  Rule('Resolver returns the configured Package for a matching path', ({ RuleScenario }) => {
    RuleScenario(
      'RegExp match resolves to the configured Package',
      ({ Given, When, Then, And }) => {
        Given(
          'a resolver configured with entry {string} matching regex {string}',
          (_ctx: unknown, id: string, pattern: string) => {
            state!.entries.push({
              id,
              displayName: titleize(id),
              match: new RegExp(pattern, 'u'),
            });
          },
        );

        When('resolving the source file {string}', (_ctx: unknown, sourceFile: string) => {
          state!.resolved = ensureResolver()(sourceFile);
        });

        Then('the resolved package id should be {string}', (_ctx: unknown, id: string) => {
          expect(state!.resolved?.id).toBe(id);
        });

        And(
          'the resolved package displayName should be {string}',
          (_ctx: unknown, displayName: string) => {
            expect(state!.resolved?.displayName).toBe(displayName);
          },
        );
      },
    );

    RuleScenario(
      'String prefix match resolves to the configured Package',
      ({ Given, When, Then }) => {
        Given(
          'a resolver configured with entry {string} matching prefix {string}',
          (_ctx: unknown, id: string, prefix: string) => {
            state!.entries.push({ id, displayName: titleize(id), match: prefix });
          },
        );

        When('resolving the source file {string}', (_ctx: unknown, sourceFile: string) => {
          state!.resolved = ensureResolver()(sourceFile);
        });

        Then('the resolved package id should be {string}', (_ctx: unknown, id: string) => {
          expect(state!.resolved?.id).toBe(id);
        });
      },
    );

    RuleScenario('First match wins when multiple entries could match', ({ Given, When, Then }) => {
      Given('a resolver configured with two entries', (_ctx: unknown, docString: string) => {
        for (const line of docString.split('\n')) {
          const trimmed = line.trim();
          if (trimmed === '') continue;
          const cells = trimmed.split('|').map((cell) => cell.trim());
          const id = cells[1] ?? '';
          const pattern = cells[2] ?? '';
          if (id === '' || pattern === '') continue;
          state!.entries.push({
            id,
            displayName: titleize(id),
            match: new RegExp(pattern, 'u'),
          });
        }
      });

      When('resolving the source file {string}', (_ctx: unknown, sourceFile: string) => {
        state!.resolved = ensureResolver()(sourceFile);
      });

      Then('the resolved package id should be {string}', (_ctx: unknown, id: string) => {
        expect(state!.resolved?.id).toBe(id);
      });
    });
  });

  Rule('Unmatched files raise UNMAPPED_PACKAGE per D-5 = A', ({ RuleScenario }) => {
    RuleScenario('Unmatched path raises UNMAPPED_PACKAGE', ({ Given, When, Then, And }) => {
      Given(
        'a resolver configured with entry {string} matching regex {string}',
        (_ctx: unknown, id: string, pattern: string) => {
          state!.entries.push({
            id,
            displayName: titleize(id),
            match: new RegExp(pattern, 'u'),
          });
        },
      );

      When('resolving the source file {string}', (_ctx: unknown, sourceFile: string) => {
        try {
          state!.resolved = ensureResolver()(sourceFile);
        } catch (error) {
          state!.caughtError = error;
        }
      });

      Then(
        'the resolution should raise ProjectionError with code {string}',
        (_ctx: unknown, code: string) => {
          expect(state!.caughtError).toBeInstanceOf(ProjectionError);
          expect((state!.caughtError as ProjectionError).code).toBe(code);
        },
      );

      And(
        'the error message should mention the source file {string}',
        (_ctx: unknown, sourceFile: string) => {
          expect((state!.caughtError as Error).message).toContain(sourceFile);
        },
      );

      And('the error message should list the matcher for {string}', (_ctx: unknown, id: string) => {
        expect((state!.caughtError as Error).message).toContain(id);
      });
    });

    RuleScenario(
      'Empty config raises UNMAPPED_PACKAGE on the first call',
      ({ Given, When, Then }) => {
        Given('a resolver configured with no entries', () => {
          // entries already empty
        });

        When('resolving the source file {string}', (_ctx: unknown, sourceFile: string) => {
          try {
            state!.resolved = ensureResolver()(sourceFile);
          } catch (error) {
            state!.caughtError = error;
          }
        });

        Then(
          'the resolution should raise ProjectionError with code {string}',
          (_ctx: unknown, code: string) => {
            expect(state!.caughtError).toBeInstanceOf(ProjectionError);
            expect((state!.caughtError as ProjectionError).code).toBe(code);
          },
        );
      },
    );
  });

  Rule('Resolution is cached per source file', ({ RuleScenario }) => {
    RuleScenario('Repeat resolution returns cached value', ({ Given, When, And, Then }) => {
      Given(
        'a resolver configured with entry {string} matching regex {string}',
        (_ctx: unknown, id: string, pattern: string) => {
          state!.entries.push({
            id,
            displayName: titleize(id),
            match: new RegExp(pattern, 'u'),
          });
        },
      );

      When('resolving the source file {string}', (_ctx: unknown, sourceFile: string) => {
        state!.resolved = ensureResolver()(sourceFile);
      });

      And('resolving the source file {string} again', (_ctx: unknown, sourceFile: string) => {
        state!.resolvedAgain = ensureResolver()(sourceFile);
      });

      Then('both resolutions should return the same Package object reference', () => {
        expect(state!.resolved).toBe(state!.resolvedAgain);
      });
    });
  });
});

function titleize(id: string): string {
  return id
    .split('-')
    .map((part) => (part.length === 0 ? part : part[0]!.toUpperCase() + part.slice(1)))
    .join(' ');
}
