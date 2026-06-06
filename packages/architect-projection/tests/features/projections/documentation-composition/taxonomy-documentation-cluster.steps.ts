import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  applyManagedRegion,
  applyManagedRegions,
  managedRegionMarkers,
  ManagedRegionError,
  readManagedRegion,
  renderTaxonomyManagedRegion,
  taxonomyGroupSource,
  TaxonomyDigestSchema,
  TAXONOMY_CLASSIFICATION_SOURCE,
  TAXONOMY_ROLE_ENUM_SOURCE,
  TAXONOMY_TAG_COUNT_SOURCE,
} from '../../../../src/index.js';

/**
 * A cross-bucket digest: the `role` + `bounded-context` metadata tags live in the
 * Architecture Tags bucket and `product-area` in the PRD Tags bucket — the exact
 * shape the formal-spec `Classification` function group reads across. Drop
 * `product-area` (`withProductArea: false`) to exercise the fail-loud path.
 */
function buildClassificationDigest({
  withProductArea = true,
}: { withProductArea?: boolean } = {}): ReturnType<typeof TaxonomyDigestSchema.parse> {
  const architecture = {
    groupName: 'Architecture Tags',
    entries: [
      {
        kind: 'metadata' as const,
        tag: 'bounded-context',
        purpose: 'bounded-context grouping',
        format: 'value' as const,
        required: false,
        example: '@architect-bounded-context delivery-reporting',
      },
      {
        kind: 'metadata' as const,
        tag: 'role',
        purpose: 'canonical role tag',
        format: 'value' as const,
        required: false,
        values: ['projection', 'service'],
        example: '@architect-role projection',
      },
    ],
  };
  const prd = {
    groupName: 'PRD Tags',
    entries: [
      {
        kind: 'metadata' as const,
        tag: 'product-area',
        purpose: 'product-area grouping',
        format: 'value' as const,
        required: false,
        values: ['Annotation', 'Generation'],
        example: '@architect-product-area Annotation',
      },
    ],
  };
  // A decoy bucket: `adr-layer` IS digest-emitted but is NOT in the Classification
  // function group, so it proves the gather is a SELECTION (named tags) rather than
  // whole buckets surfacing.
  const adr = {
    groupName: 'ADR Tags',
    entries: [
      {
        kind: 'metadata' as const,
        tag: 'adr-layer',
        purpose: 'architecture layer of an ADR',
        format: 'enum' as const,
        required: false,
        example: '@architect-adr-layer domain',
      },
    ],
  };
  return TaxonomyDigestSchema.parse({
    kind: 'TaxonomyDigest',
    tags: withProductArea ? [architecture, prd, adr] : [architecture, adr],
    formatTypes: [],
  });
}

/**
 * A single-bucket Relationship Tags digest carrying the four canonical authored tags
 * PLUS the derived `enforces-decision` — so the `relationships` function group can prove
 * it SUBSETS the bucket (drops `enforces-decision`) rather than surfacing it whole. This
 * is the second function group's distinctive shape: a single-bucket SELECTION, the mirror
 * of `Classification`'s cross-bucket GATHER.
 */
function buildRelationshipsDigest(): ReturnType<typeof TaxonomyDigestSchema.parse> {
  const relationship = {
    groupName: 'Relationship Tags',
    entries: ['uses', 'implements', 'extends', 'see-also', 'enforces-decision'].map((tag) => ({
      kind: 'metadata' as const,
      tag,
      purpose: `${tag} relationship`,
      format: 'csv' as const,
      required: false,
      example: `@architect-${tag} Example`,
    })),
  };
  return TaxonomyDigestSchema.parse({
    kind: 'TaxonomyDigest',
    tags: [relationship],
    formatTypes: [],
  });
}

const feature = await loadFeature(
  'tests/features/projections/documentation-composition/taxonomy-documentation-cluster.feature',
);

/** A two-group digest fixture (Roles + ADR Tags) — validated through the schema, no casts. */
function buildDigest(): ReturnType<typeof TaxonomyDigestSchema.parse> {
  return TaxonomyDigestSchema.parse({
    kind: 'TaxonomyDigest',
    tags: [
      {
        groupName: 'Roles',
        entries: [
          {
            kind: 'role',
            tag: 'projection',
            purpose: 'projection role',
            domain: 'projection',
            priority: 1,
          },
          {
            kind: 'role',
            tag: 'service',
            purpose: 'service role',
            domain: 'application',
            priority: 2,
          },
        ],
      },
      {
        groupName: 'ADR Tags',
        entries: [
          {
            kind: 'metadata',
            tag: 'adr',
            purpose: 'ADR number',
            format: 'value',
            required: true,
            example: '@architect-adr 1',
          },
        ],
      },
    ],
    formatTypes: [],
  });
}

/** Build a host with one managed region for `regionId`, given before/inside/after text. */
function host(before: string, regionId: string, inside: string, after: string, eol = '\n'): string {
  const { begin, end } = managedRegionMarkers(regionId);
  return [before, begin, inside, end, after].join(eol);
}

describeFeature(feature, ({ Background, Rule }) => {
  let digest: ReturnType<typeof TaxonomyDigestSchema.parse>;

  Background(({ Given }) => {
    Given('a digest with a Roles group and an ADR Tags group', () => {
      digest = buildDigest();
      expect(digest.tags).toHaveLength(2);
    });
  });

  Rule(
    'Embedded-region shapes generate only inside their managed-region markers; the authored voice is host-owned',
    ({ RuleScenario }) => {
      RuleScenario(
        'regeneration rewrites only the marked region and preserves the authored voice',
        ({ Given, When, Then, And }) => {
          let source = '';
          let result = '';
          Given('a host with authored prose around a "taxonomy-role-enum" region', () => {
            source = host(
              '# Title\n\nauthored above',
              'taxonomy-role-enum',
              'OLD',
              'authored below\n',
            );
          });
          When('the region is rewritten with new generated content', () => {
            result = applyManagedRegion(source, 'taxonomy-role-enum', 'NEW BODY');
          });
          Then('the content between the markers is the new generated content', () => {
            expect(readManagedRegion(result, 'taxonomy-role-enum')).toBe('NEW BODY');
          });
          And('the authored prose outside the markers is preserved byte-for-byte', () => {
            expect(result.startsWith('# Title\n\nauthored above\n')).toBe(true);
            expect(result.endsWith('authored below\n')).toBe(true);
            expect(result).not.toContain('OLD');
          });
        },
      );

      RuleScenario(
        'a host with multiple regions rewrites each from its own selection and preserves the prose between them',
        ({ Given, When, Then, And }) => {
          const begin = managedRegionMarkers('taxonomy-role-enum');
          const count = managedRegionMarkers('taxonomy-tag-count');
          let source = '';
          let result = '';
          Given(
            'a host with a "taxonomy-role-enum" region and a "taxonomy-tag-count" region with authored prose between them',
            () => {
              source = [
                'top',
                begin.begin,
                'OLD ROLES',
                begin.end,
                'BETWEEN AUTHORED PROSE',
                count.begin,
                'OLD COUNT',
                count.end,
                'bottom',
              ].join('\n');
            },
          );
          When('both regions are rewritten from their own selections', () => {
            result = applyManagedRegions(source, [
              { regionId: 'taxonomy-role-enum', body: 'ROLES BODY' },
              { regionId: 'taxonomy-tag-count', body: 'COUNT BODY' },
            ]);
          });
          Then("each region holds its own selection's content", () => {
            expect(readManagedRegion(result, 'taxonomy-role-enum')).toBe('ROLES BODY');
            expect(readManagedRegion(result, 'taxonomy-tag-count')).toBe('COUNT BODY');
          });
          And('the authored prose between the two regions is preserved byte-for-byte', () => {
            expect(result).toContain('BETWEEN AUTHORED PROSE');
            expect(result.startsWith('top\n')).toBe(true);
            expect(result.endsWith('\nbottom')).toBe(true);
          });
        },
      );

      RuleScenario(
        'the same region id in two different host files is not a collision',
        ({ Given, When, Then }) => {
          let hostA = '';
          let hostB = '';
          let resultA = '';
          let resultB = '';
          Given('two separate hosts that each declare a "taxonomy-role-enum" region', () => {
            hostA = host('A-top', 'taxonomy-role-enum', 'OLD-A', 'A-bottom');
            hostB = host('B-top', 'taxonomy-role-enum', 'OLD-B', 'B-bottom');
          });
          When("each host's region is rewritten independently", () => {
            resultA = applyManagedRegion(hostA, 'taxonomy-role-enum', 'NEW-A', 'a.md');
            resultB = applyManagedRegion(hostB, 'taxonomy-role-enum', 'NEW-B', 'b.md');
          });
          Then('each host carries its own rewritten region without disturbing the other', () => {
            expect(readManagedRegion(resultA, 'taxonomy-role-enum')).toBe('NEW-A');
            expect(readManagedRegion(resultB, 'taxonomy-role-enum')).toBe('NEW-B');
            expect(resultA).toContain('A-top');
            expect(resultB).toContain('B-top');
          });
        },
      );

      RuleScenario(
        'a missing, duplicated, or nested region marker fails loudly rather than writing',
        ({ Then, And }) => {
          Then(
            'rewriting a region whose markers are absent throws and names the host and region',
            () => {
              try {
                applyManagedRegion('no markers here\n', 'taxonomy-role-enum', 'X', 'host.md');
                throw new Error('expected ManagedRegionError');
              } catch (error) {
                expect(error).toBeInstanceOf(ManagedRegionError);
                expect((error as ManagedRegionError).regionId).toBe('taxonomy-role-enum');
                expect((error as Error).message).toContain('host.md');
              }
            },
          );
          And('rewriting a region whose begin marker is duplicated throws', () => {
            const { begin, end } = managedRegionMarkers('dup');
            const source = [begin, 'a', begin, 'b', end].join('\n');
            expect(() => applyManagedRegion(source, 'dup', 'X')).toThrow(ManagedRegionError);
          });
          And('rewriting a region whose markers are unbalanced throws', () => {
            const { begin, end } = managedRegionMarkers('rev');
            const source = [end, 'body', begin].join('\n');
            expect(() => applyManagedRegion(source, 'rev', 'X')).toThrow(ManagedRegionError);
          });
          And('rewriting a region whose markers are nested inside another region throws', () => {
            const outer = managedRegionMarkers('outer');
            const inner = managedRegionMarkers('inner');
            const source = [outer.begin, inner.begin, inner.end, outer.end].join('\n');
            expect(() => applyManagedRegion(source, 'outer', 'X')).toThrow(ManagedRegionError);
          });
          And('rewriting a region whose begin and end markers share a line throws', () => {
            const { begin, end } = managedRegionMarkers('inline');
            // Begin and end on the SAME physical line: the line-based span math could
            // otherwise place the rewrite after the end marker and write OUTSIDE the
            // region — it must fail loud instead.
            const source = `${begin} ${end}\ntrailing authored line\n`;
            expect(() => applyManagedRegion(source, 'inline', 'X')).toThrow(ManagedRegionError);
          });
        },
      );
    },
  );

  Rule(
    'Region rewrites are byte-deterministic (the normalization contract)',
    ({ RuleScenario }) => {
      RuleScenario(
        'a no-op regeneration of an unchanged region is byte-stable across host EOL conventions',
        ({ Given, When, Then, And }) => {
          let source = '';
          let once = '';
          let twice = '';
          Given('a host saved with CRLF endings outside the markers and an LF region body', () => {
            source = host('authored-above', 'taxonomy-role-enum', 'OLD', 'authored-below', '\r\n');
            expect(source).toContain('\r\n');
          });
          When('the same region body is applied twice', () => {
            once = applyManagedRegion(source, 'taxonomy-role-enum', 'STABLE');
            twice = applyManagedRegion(once, 'taxonomy-role-enum', 'STABLE');
          });
          Then('both applications produce byte-identical host output', () => {
            expect(twice).toBe(once);
          });
          And('the CRLF bytes outside the markers are left untouched', () => {
            expect(once).toContain('authored-above\r\n');
            expect(once).toContain('\r\nauthored-below');
          });
        },
      );

      RuleScenario(
        'the in-region span is normalized to one blank line around LF content',
        ({ When, Then, And }) => {
          let result = '';
          When('a region body with stray blank lines and CRLF endings is applied', () => {
            const source = host('above', 'taxonomy-role-enum', 'OLD', 'below');
            result = applyManagedRegion(
              source,
              'taxonomy-role-enum',
              '\r\n\r\nline one\r\nline two\r\n\r\n',
            );
          });
          Then(
            'the inter-marker span has exactly one blank line after the begin marker and before the end marker',
            () => {
              const { begin, end } = managedRegionMarkers('taxonomy-role-enum');
              const span = result.slice(result.indexOf(begin) + begin.length, result.indexOf(end));
              expect(span).toBe('\n\nline one\nline two\n\n');
            },
          );
          And('the region body lines use LF endings', () => {
            expect(readManagedRegion(result, 'taxonomy-role-enum')).toBe('line one\nline two');
          });
        },
      );
    },
  );

  Rule(
    'The taxonomy documents are one generation family from the tag registry',
    ({ RuleScenario }) => {
      RuleScenario(
        'the skill role-enum and tag-count regions are emitted from the digest, not hand-restated',
        ({ Then, And }) => {
          Then('the "role-enum" region body lists the digest\'s role values', () => {
            const body = renderTaxonomyManagedRegion(digest, TAXONOMY_ROLE_ENUM_SOURCE);
            expect(body).toContain('projection · service');
          });
          And(
            'the "tag-count" region body states the digest\'s live role, metadata, and aggregation counts',
            () => {
              const body = renderTaxonomyManagedRegion(digest, TAXONOMY_TAG_COUNT_SOURCE);
              expect(body).toContain('**2 roles**');
              expect(body).toContain('**1 metadata tags**');
              expect(body).toContain('**0 aggregation tags**');
              expect(body).toContain('**3 total**');
            },
          );
        },
      );

      RuleScenario(
        'a digest tag-group renders as a canonical enumeration table',
        ({ Then, And }) => {
          Then(
            "the region body for a digest group source is a markdown table of that group's tags",
            () => {
              const body = renderTaxonomyManagedRegion(digest, taxonomyGroupSource('ADR Tags'));
              expect(body).toMatch(/^\| Tag\s+\| Format\s+\| Purpose/u);
              expect(body).toContain('| ---');
              expect(body).toContain('`adr`');
            },
          );
          And('an unknown region source is rejected rather than emitting an empty region', () => {
            expect(() => renderTaxonomyManagedRegion(digest, 'no-such-source')).toThrow(
              /Unknown taxonomy managed-region source/u,
            );
          });
        },
      );

      RuleScenario(
        'the classification function group gathers tags across digest buckets into one table',
        ({ Given, Then, And }) => {
          let body = '';
          Given(
            'a digest whose Architecture Tags hold role and bounded-context and whose PRD Tags hold product-area',
            () => {
              body = renderTaxonomyManagedRegion(
                buildClassificationDigest(),
                TAXONOMY_CLASSIFICATION_SOURCE,
              );
            },
          );
          Then(
            'the "classification" function-group region is one table enumerating product-area, bounded-context, and role',
            () => {
              expect(body).toMatch(/^\| Tag\s+\| Format\s+\| Purpose/u);
              expect(body).toContain('`product-area`');
              expect(body).toContain('`bounded-context`');
              expect(body).toContain('`role`');
            },
          );
          And(
            "those tags are gathered across the digest's domain buckets, not one bucket surfacing unchanged",
            () => {
              // RFC order: product-area (PRD bucket) precedes bounded-context + role
              // (Architecture bucket) — a single bucket rendered as-is could not produce
              // this order. And `adr-layer` (a digest-emitted tag in the ADR bucket, NOT
              // in the Classification set) is excluded, proving a selection, not a dump.
              const productAreaAt = body.indexOf('`product-area`');
              const boundedContextAt = body.indexOf('`bounded-context`');
              const roleAt = body.indexOf('`role`');
              expect(productAreaAt).toBeGreaterThan(-1);
              expect(productAreaAt).toBeLessThan(boundedContextAt);
              expect(boundedContextAt).toBeLessThan(roleAt);
              expect(body).not.toContain('adr-layer');
            },
          );
          And('the not-digest-emitted tag arch-layer is absent from the region', () => {
            expect(body).not.toContain('arch-layer');
          });
        },
      );

      RuleScenario(
        'a function group naming a tag absent from the digest fails loud',
        ({ Given, Then }) => {
          let digestWithoutProductArea: ReturnType<typeof TaxonomyDigestSchema.parse>;
          Given(
            'a digest whose Architecture Tags hold role and bounded-context but no product-area',
            () => {
              digestWithoutProductArea = buildClassificationDigest({ withProductArea: false });
            },
          );
          Then(
            'rendering the "classification" function group throws and names the absent tag rather than dropping a row',
            () => {
              expect(() =>
                renderTaxonomyManagedRegion(
                  digestWithoutProductArea,
                  TAXONOMY_CLASSIFICATION_SOURCE,
                ),
              ).toThrow(/product-area.*absent from the digest/u);
            },
          );
        },
      );

      RuleScenario(
        'the relationships function group subsets one digest bucket to the canonical authored set',
        ({ Given, Then, And }) => {
          let body = '';
          Given(
            'a digest whose Relationship Tags bucket holds uses, implements, extends, see-also, and enforces-decision',
            () => {
              // `relationships` is module-internal (deliberately NOT barrel-exported);
              // the test exercises it through its public region-source string.
              body = renderTaxonomyManagedRegion(buildRelationshipsDigest(), 'relationships');
            },
          );
          Then(
            'the "relationships" function-group region enumerates uses, implements, extends, and see-also in RFC order',
            () => {
              const usesAt = body.indexOf('`uses`');
              const implementsAt = body.indexOf('`implements`');
              const extendsAt = body.indexOf('`extends`');
              const seeAlsoAt = body.indexOf('`see-also`');
              expect(usesAt).toBeGreaterThan(-1);
              expect(usesAt).toBeLessThan(implementsAt);
              expect(implementsAt).toBeLessThan(extendsAt);
              expect(extendsAt).toBeLessThan(seeAlsoAt);
            },
          );
          And(
            'the derived enforces-decision tag is absent because the authored set subsets the bucket, not the whole bucket surfacing',
            () => {
              expect(body).not.toContain('enforces-decision');
            },
          );
        },
      );
    },
  );
});
