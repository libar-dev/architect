/**
 * @architect-bounded-context:documentation-composition
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
