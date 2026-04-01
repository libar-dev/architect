/**
 * @architect
 * @architect-core
 * @architect-pattern CodecBaseOptions
 * @architect-status completed
 * @architect-unlock-reason:Add-createDecodeOnlyCodec-helper
 *
 * ## Base Codec Options
 *
 * Shared types, interfaces, and utilities for all document codecs.
 * Individual codec files define their own specific option types that extend BaseCodecOptions.
 *
 * ### When to Use
 *
 * - When creating custom codec options that extend the base
 * - When implementing new codecs that need standard configuration
 * - When importing shared types like DetailLevel or NormalizedStatusFilter
 */

import { z } from 'zod';
import type { NormalizedStatus, FormatType } from '../../../taxonomy/index.js';
import type { ProjectMetadata } from '../../../config/project-config.js';
import { MasterDatasetSchema } from '../../../validation-schemas/master-dataset.js';
import type { MasterDataset } from '../../../validation-schemas/master-dataset.js';
import { RenderableDocumentOutputSchema } from '../shared-schema.js';
import type { RenderableDocument } from '../../schema.js';

/**
 * Detail level for progressive disclosure
 * - summary: Minimal output, no detail files
 * - standard: Default behavior with detail files
 * - detailed: Maximum detail, all optional sections included
 */
export type DetailLevel = 'summary' | 'standard' | 'detailed';

/**
 * Normalized status values that match normalizeStatus() output.
 * Use this type for filterStatus options to ensure type safety.
 *
 * @see taxonomy/normalized-status.ts - Single source of truth for normalized values
 */
export type NormalizedStatusFilter = NormalizedStatus;

/**
 * Common limits for all codecs
 */
export interface CodecLimits {
  /** Maximum recent items to show in summary sections (default: 10) */
  recentItems?: number;
  /** Maximum detail files to generate (default: unlimited) */
  maxDetailFiles?: number;
  /** Maximum items per section before collapsing (default: varies by codec) */
  collapseThreshold?: number;
}

/**
 * Base options shared by all codecs
 */
export interface BaseCodecOptions {
  /** Generate additional detail files for progressive disclosure (default: true) */
  generateDetailFiles?: boolean;

  /** Level of detail to include (default: "standard") */
  detailLevel?: DetailLevel;

  /** Common limits for the codec */
  limits?: CodecLimits;
}

// ═══════════════════════════════════════════════════════════════════════════
// Default Options
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Default codec limits
 */
export const DEFAULT_LIMITS: Required<CodecLimits> = {
  recentItems: 10,
  maxDetailFiles: Number.MAX_SAFE_INTEGER, // Effectively unlimited
  collapseThreshold: 5,
};

/**
 * Default base options
 */
export const DEFAULT_BASE_OPTIONS: Required<BaseCodecOptions> = {
  generateDetailFiles: true,
  detailLevel: 'standard',
  limits: DEFAULT_LIMITS,
};

// ═══════════════════════════════════════════════════════════════════════════
// Utility: Merge Options with Defaults
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Merge user options with defaults
 */
export function mergeOptions<T extends BaseCodecOptions>(
  defaults: Required<T>,
  options?: T
): Required<T> {
  if (!options) {
    return defaults;
  }

  return {
    ...defaults,
    ...options,
    limits: {
      ...defaults.limits,
      ...options.limits,
    },
  } as Required<T>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Document Codec Type
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Type alias for decode-only document codecs.
 *
 * These codecs transform MasterDataset → RenderableDocument.
 * The reverse direction (encode) is not supported and throws at runtime,
 * matching Zod's behavior for unidirectional transforms.
 *
 * @see zod-codecs.md - "encode() throws for unidirectional transforms"
 * @see https://zod.dev/codecs
 */
export type DocumentCodec = z.ZodCodec<
  typeof MasterDatasetSchema,
  typeof RenderableDocumentOutputSchema
>;

// ═══════════════════════════════════════════════════════════════════════════
// Codec Meta (Self-Describing Codecs)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Self-describing metadata for document codecs.
 *
 * Each codec file exports a `codecMeta` object that provides all
 * registration metadata. `generate.ts` auto-registers from these exports,
 * eliminating the 7-point registration ceremony.
 */
export interface CodecMeta {
  /** Document type key (matches DOCUMENT_TYPES key) */
  readonly type: string;
  /** Output file path (e.g., 'PATTERNS.md') */
  readonly outputPath: string;
  /** Human-readable description */
  readonly description: string;
  /** Factory function to create codec with options */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly factory: (options?: any) => DocumentCodec;
  /** Default codec instance (factory called with no options) */
  readonly defaultInstance: DocumentCodec;
  /** Custom renderer (default: renderToMarkdown) */
  readonly renderer?: (doc: RenderableDocument) => string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Codec Context
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Context provided to all codec decode functions.
 *
 * Separates extraction products (dataset) from runtime context
 * (project metadata, workflow, tag overrides). This keeps MasterDataset
 * as a pure read model (ADR-006) while giving codecs access to
 * config-derived runtime data.
 *
 * Fields beyond `dataset` are populated when available from resolved config.
 * Codecs should fall back gracefully when optional fields are absent.
 */
export interface CodecContext {
  /** The extraction read model — patterns, views, indexes */
  readonly dataset: MasterDataset;
  /** Project identity metadata (package name, purpose, license, regeneration commands) */
  readonly projectMetadata?: ProjectMetadata;
  /** Format type example overrides for TaxonomyCodec */
  readonly tagExampleOverrides?: Partial<
    Record<FormatType, { description?: string; example?: string }>
  >;
}

// ═══════════════════════════════════════════════════════════════════════════
// Codec Context Enrichment (Runtime)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Context fields beyond `dataset` that are set at generation time.
 *
 * These are populated by `generate.ts` before each codec decode call and
 * cleared in a `finally` block. The module-level state is safe because
 * generation is synchronous — no concurrent decode calls can race.
 */
export type CodecContextEnrichment = Omit<CodecContext, 'dataset'>;

/**
 * Module-level CodecContext enrichment, set by generate.ts before each
 * generation run. Synchronous execution guarantees no race conditions.
 */
let _contextEnrichment: CodecContextEnrichment = {};

/**
 * Set the runtime context enrichment for all codec decode calls.
 * Called by generate.ts before running codec.decode().
 *
 * @param enrichment - Context fields to merge into CodecContext alongside dataset
 */
export function setCodecContextEnrichment(enrichment: CodecContextEnrichment): void {
  _contextEnrichment = enrichment;
}

/**
 * Clear the runtime context enrichment.
 * Called by generate.ts in a finally block after codec.decode() completes.
 */
export function clearCodecContextEnrichment(): void {
  _contextEnrichment = {};
}

/**
 * Get the current context enrichment (for testing).
 */
export function getCodecContextEnrichment(): CodecContextEnrichment {
  return _contextEnrichment;
}

// ═══════════════════════════════════════════════════════════════════════════
// Codec Factory Helper
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a decode-only document codec.
 *
 * Wraps Zod's `z.codec()` with the standard encode-throws pattern
 * used by all document codecs. This eliminates repeated boilerplate
 * across ~24 codec factories.
 *
 * The public-facing `decode` parameter receives a `CodecContext` wrapper,
 * while the internal Zod boundary still operates on `MasterDataset` directly.
 * This keeps MasterDataset as a pure read model (ADR-006) and allows the
 * context to be extended with runtime fields (e.g. projectMetadata) without
 * touching every Zod schema.
 *
 * @param decode - Transform function: CodecContext → RenderableDocument
 * @returns DocumentCodec with standard encode-throws behavior
 */
export function createDecodeOnlyCodec(
  decode: (context: CodecContext) => RenderableDocument
): DocumentCodec {
  return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
    decode: (dataset: MasterDataset) => decode({ dataset, ..._contextEnrichment }),
    encode: (): never => {
      throw new Error('Codec is decode-only. See zod-codecs.md');
    },
  });
}
