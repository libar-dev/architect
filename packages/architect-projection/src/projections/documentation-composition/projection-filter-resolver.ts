/**
 * @architect
 * @architect-pattern ProjectionFilterResolver
 * @architect-status active
 * @architect-role:decider
 * @architect-bounded-context:documentation-composition
 * @architect-uses ProjectionFilter, DocumentationTypeRegistry, ProgressiveDisclosureLevel
 *
 * ## ProjectionFilterResolver - Filter Precedence Policy
 *
 * Decides which patterns appear in a composed document at a given disclosure
 * level by merging the `DocumentationTypeRegistry`'s per-level default filter
 * with the runtime `context.projectionFilter` into one effective
 * `ProjectionFilter`. The precedence rule is fixed: the registry default seeds
 * the filter, and the runtime context overrides it field-by-field (maturity,
 * status). When neither side constrains a field the result is left unbounded.
 *
 * ### When to Use
 *
 * - Resolving the effective `ProjectionFilter` for a document type at a
 *   `ProgressiveDisclosureLevel`.
 * - Layering a runtime caller filter over the registry's disclosure-matrix
 *   default.
 * - Deciding whether a pattern is in scope for a given composed view.
 */
import type { ProjectionContext } from '../../context/projection-context.js';
import type { DisclosureSpec } from '../../disclosure/spec.js';
import {
  getSupportedDocumentationTypeMetadata,
  type SupportedDocumentationType,
} from './documentation-type-registry.js';
import type { ProgressiveDisclosureLevel } from '../../disclosure/levels.js';

export function resolveProjectionFilter(
  context: ProjectionContext,
  documentType: SupportedDocumentationType,
  disclosureLevel?: ProgressiveDisclosureLevel,
): DisclosureSpec['filter'] {
  const metadata = getSupportedDocumentationTypeMetadata(documentType);
  const level = disclosureLevel ?? metadata.defaultDisclosureLevel;
  const registryFilter = metadata.disclosureMatrix[level].filter;
  const runtimeFilter = context.projectionFilter;

  if (runtimeFilter === undefined) {
    return registryFilter;
  }

  const merged = {
    ...(registryFilter?.maturity !== undefined ? { maturity: registryFilter.maturity } : {}),
    ...(registryFilter?.status !== undefined ? { status: registryFilter.status } : {}),
    ...(runtimeFilter.maturity !== undefined ? { maturity: runtimeFilter.maturity } : {}),
    ...(runtimeFilter.status !== undefined ? { status: runtimeFilter.status } : {}),
  } satisfies DisclosureSpec['filter'];

  return merged.maturity === undefined && merged.status === undefined ? undefined : merged;
}
