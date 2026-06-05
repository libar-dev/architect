/**
 * @architect
 * @architect-implements TaxonomyDocumentationCluster
 * @architect-role:utility
 * @architect-bounded-context:documentation-composition
 * @architect-enforces-decision ADR010DocumentationCompositionHelpers
 *
 * Managed-region marker engine — the pure string substrate the `embedded-region`
 * emission mode writes through (epic DocumentationProjection, "emission mode";
 * cluster `TaxonomyDocumentationCluster`). A host `.md` file carries one or more
 * marker-bounded regions:
 *
 *   <!-- architect:gen <regionId> begin -->
 *   …generated body…
 *   <!-- architect:gen <regionId> end -->
 *
 * `applyManagedRegion` rewrites ONLY the span between a region's begin/end
 * sentinels; everything else — the markers themselves, the authored prose around
 * and between regions, and that content's original (possibly CRLF) line endings —
 * is preserved byte-for-byte. This is why the determinism gate is automatically
 * region-scoped: regenerating and re-applying can only ever change inter-marker
 * bytes, so a diff against the on-disk host surfaces exactly a drifted region.
 *
 * NORMALIZATION CONTRACT (cluster Rule "Region rewrites are byte-deterministic"):
 * inside the rewritten span line endings are LF, there is exactly one blank line
 * between each sentinel and the body it bounds, and the host's trailing-newline
 * state is untouched (the splice never reaches the file's end). A no-op
 * regeneration is therefore byte-stable regardless of the host's surrounding EOL
 * convention.
 *
 * FAIL LOUD, NEVER PARTIAL (cluster Rule "…fails loudly rather than writing"):
 * a missing, unbalanced, duplicated, or nested/interleaved marker pair throws a
 * {@link ManagedRegionError} naming the region (and, when the caller supplies it,
 * the host file) instead of writing mislocated content. This is a PURE module —
 * no filesystem access; the CLI owns read/write and stamps `hostFile` onto errors.
 *
 * This is a write-target engine, never a content framework (DD-3 / ADR-010): the
 * body it places is rendered elsewhere by the shared block renderer.
 */

const MARKER_PREFIX = 'architect:gen';

/** All begin/end sentinels in a host, captured with their slug and byte offsets. */
const MARKER_PATTERN = /<!-- architect:gen ([a-z0-9-]+) (begin|end) -->/gu;

interface MarkerOccurrence {
  readonly regionId: string;
  readonly kind: 'begin' | 'end';
  /** Offset of the `<` that opens the marker comment. */
  readonly start: number;
  /** Offset one past the `>` that closes the marker comment. */
  readonly end: number;
}

/** A located, validated begin/end pair plus the splice bounds of its body span. */
interface ResolvedRegion {
  readonly begin: MarkerOccurrence;
  readonly end: MarkerOccurrence;
  /** First offset of the body span (immediately after the begin marker's line break). */
  readonly spanStart: number;
  /** Offset of the start of the end marker's line (exclusive upper bound of the body span). */
  readonly spanEnd: number;
}

/**
 * Thrown when a host file's markers for a region are missing, unbalanced,
 * duplicated, or nested/interleaved with another region. Carries the offending
 * `regionId` and, once the CLI stamps it, the `hostFile`, so generation can abort
 * with a diagnostic that names exactly what to fix.
 */
export class ManagedRegionError extends Error {
  readonly regionId: string;
  hostFile: string | undefined;

  constructor(regionId: string, reason: string, hostFile?: string) {
    const where = hostFile === undefined ? '' : ` in ${hostFile}`;
    super(`managed region "${regionId}"${where}: ${reason}`);
    this.name = 'ManagedRegionError';
    this.regionId = regionId;
    this.hostFile = hostFile;
  }
}

/** The begin/end sentinel strings for a region id (the marker grammar). */
export function managedRegionMarkers(regionId: string): { begin: string; end: string } {
  return {
    begin: `<!-- ${MARKER_PREFIX} ${regionId} begin -->`,
    end: `<!-- ${MARKER_PREFIX} ${regionId} end -->`,
  };
}

function collectMarkers(host: string): MarkerOccurrence[] {
  const markers: MarkerOccurrence[] = [];
  for (const match of host.matchAll(MARKER_PATTERN)) {
    const regionId = match[1];
    const kind = match[2];
    if (regionId === undefined || (kind !== 'begin' && kind !== 'end')) {
      continue;
    }
    const start = match.index;
    markers.push({ regionId, kind, start, end: start + match[0].length });
  }
  return markers;
}

function resolveRegion(
  host: string,
  regionId: string,
  hostFile: string | undefined,
): ResolvedRegion {
  const markers = collectMarkers(host);
  const begins = markers.filter(
    (marker) => marker.regionId === regionId && marker.kind === 'begin',
  );
  const ends = markers.filter((marker) => marker.regionId === regionId && marker.kind === 'end');

  if (begins.length === 0 || ends.length === 0) {
    throw new ManagedRegionError(
      regionId,
      'begin/end markers are missing — the host has not been region-prepared',
      hostFile,
    );
  }
  if (begins.length > 1 || ends.length > 1) {
    throw new ManagedRegionError(
      regionId,
      'markers are duplicated — exactly one begin and one end are required',
      hostFile,
    );
  }

  const begin = begins[0];
  const end = ends[0];
  if (begin === undefined || end === undefined || begin.start >= end.start) {
    throw new ManagedRegionError(
      regionId,
      'markers are unbalanced — the begin marker must precede its end marker',
      hostFile,
    );
  }

  // Nesting / interleaving: no other region's marker may fall inside this span.
  for (const marker of markers) {
    if (marker.regionId === regionId) {
      continue;
    }
    if (marker.start > begin.end && marker.start < end.start) {
      throw new ManagedRegionError(
        regionId,
        `region "${marker.regionId}" markers are nested inside it — regions may not interleave`,
        hostFile,
      );
    }
  }

  const newlineAfterBegin = host.indexOf('\n', begin.end);
  // The end marker exists after the begin marker, so a line break always separates them.
  const spanStart = newlineAfterBegin === -1 ? begin.end : newlineAfterBegin + 1;
  const newlineBeforeEnd = host.lastIndexOf('\n', end.start);
  const spanEnd = newlineBeforeEnd === -1 ? end.start : newlineBeforeEnd + 1;

  return { begin, end, spanStart, spanEnd: Math.max(spanStart, spanEnd) };
}

/** Strip leading/trailing blank lines and force LF — the in-region byte policy. */
function normalizeRegionBody(body: string): string {
  return body
    .replace(/\r\n/gu, '\n')
    .replace(/\r/gu, '\n')
    .replace(/^\n+/u, '')
    .replace(/\n+$/u, '');
}

/**
 * Rewrite the body of one managed region in `host`, returning the new host text.
 * Only the inter-sentinel span changes; the markers and every byte outside them
 * are preserved exactly. Throws {@link ManagedRegionError} (loud, no partial
 * write) when the region's markers are missing/unbalanced/duplicated/nested.
 */
export function applyManagedRegion(
  host: string,
  regionId: string,
  body: string,
  hostFile?: string,
): string {
  const region = resolveRegion(host, regionId, hostFile);
  const normalizedBody = normalizeRegionBody(body);
  const replacement = normalizedBody.length === 0 ? '\n\n' : `\n${normalizedBody}\n\n`;
  return host.slice(0, region.spanStart) + replacement + host.slice(region.spanEnd);
}

/**
 * Apply several regions to one host in order. Region bodies never contain
 * markers, so each application leaves the other regions' markers intact; a
 * malformed marker for any region aborts the whole host (fail loud, no partial).
 */
export function applyManagedRegions(
  host: string,
  regions: readonly { regionId: string; body: string }[],
  hostFile?: string,
): string {
  return regions.reduce(
    (current, region) => applyManagedRegion(current, region.regionId, region.body, hostFile),
    host,
  );
}

/**
 * Extract the current normalized body of a managed region (the inter-sentinel
 * span, LF, blank lines trimmed). Throws the same {@link ManagedRegionError} as
 * {@link applyManagedRegion} when the markers are malformed. Used by tests and
 * by callers that want to inspect a region without rewriting it.
 */
export function readManagedRegion(host: string, regionId: string, hostFile?: string): string {
  const region = resolveRegion(host, regionId, hostFile);
  return normalizeRegionBody(host.slice(region.spanStart, region.spanEnd));
}
