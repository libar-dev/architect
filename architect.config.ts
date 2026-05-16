/**
 * Architect package configuration.
 *
 * The role list is `ARCHITECT_PACKAGE_ROLES` — the 8 roles actually used
 * across `architect-{core,projection,guard,cli,mcp}/src/`. The list is
 * declared in `packages/architect-core/src/config/self-hosting.ts` so the
 * static `WORKSPACE_TAG_REGISTRY` (used by CLI/MCP fast paths) and this
 * config consume the same source. The decision record is ADR-001 Rule 10
 * in `architect/decisions/adr-001-taxonomy-canonical-values.feature`.
 */
import {
  defineConfig,
  ARCHITECT_PACKAGE_ROLES,
  ARCHITECT_PACKAGE_PRODUCT_AREAS,
  DEFAULT_GENERATORS,
  PACKAGE_SELF_HOSTING_SOURCES,
} from '@libar-dev/architect-core';

export default defineConfig({
  roles: ARCHITECT_PACKAGE_ROLES,
  productAreas: ARCHITECT_PACKAGE_PRODUCT_AREAS,
  sources: {
    typescript: [...PACKAGE_SELF_HOSTING_SOURCES.typescript],
    stubs: [...PACKAGE_SELF_HOSTING_SOURCES.stubs],
    features: [...PACKAGE_SELF_HOSTING_SOURCES.features],
  },
  output: {
    directory: 'docs-live',
    overwrite: true,
  },
  generators: [...DEFAULT_GENERATORS],
  packages: [
    { id: 'architect-core', displayName: 'Architect Core', match: /^packages\/architect-core\// },
    {
      id: 'architect-projection',
      displayName: 'Architect Projection',
      match: /^packages\/architect-projection\//,
    },
    { id: 'architect-cli', displayName: 'Architect CLI', match: /^packages\/architect-cli\// },
    { id: 'architect-mcp', displayName: 'Architect MCP', match: /^packages\/architect-mcp\// },
    { id: 'architect-guard', displayName: 'Architect Guard', match: /^packages\/architect-guard\// },
    { id: 'architect-dev', displayName: 'Architect Host (Dev)', match: 'tests/features/' },
    { id: 'architect-pkg-content', displayName: 'Architect Package Content', match: 'architect/' },
  ],
});
