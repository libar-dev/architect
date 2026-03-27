/**
 * @architect
 * @architect-core
 * @architect-pattern CodecBaseOptions
 * @architect-status completed
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

import type { z } from 'zod';
import type { NormalizedStatus } from '../../../taxonomy/index.js';
import type { MasterDatasetSchema } from '../../../validation-schemas/master-dataset.js';
import type { RenderableDocumentOutputSchema } from '../shared-schema.js';

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
