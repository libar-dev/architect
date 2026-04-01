/**
 * @architect
 * @architect-core
 * @architect-pattern CodecRegistryBarrel
 * @architect-status active
 * @architect-arch-role service
 * @architect-arch-context renderer
 * @architect-arch-layer application
 *
 * ## Codec Registry Barrel
 *
 * Collects all codecMeta exports into a single array.
 * Adding a new codec requires two steps:
 * 1. Export a `codecMeta` (or `codecMetas`) from the codec file
 * 2. Import it here
 *
 * `generate.ts` auto-registers from ALL_CODEC_METAS, eliminating
 * the 7-point registration ceremony (imports, DOCUMENT_TYPES, CodecOptions,
 * register calls, registerFactory calls).
 */

import type { CodecMeta } from './types/base.js';

// Single-codec files
import { codecMeta as patternsMeta } from './patterns.js';
import { codecMeta as requirementsMeta } from './requirements.js';
import { codecMeta as prChangesMeta } from './pr-changes.js';
import { codecMeta as adrMeta } from './adr.js';
import { codecMeta as businessRulesMeta } from './business-rules.js';
import { codecMeta as architectureMeta } from './architecture.js';
import { codecMeta as taxonomyMeta } from './taxonomy.js';
import { codecMeta as validationRulesMeta } from './validation-rules.js';
import { codecMeta as claudeModuleMeta } from './claude-module.js';
import { codecMeta as indexMeta } from './index-codec.js';

// Multi-codec files
import { codecMetas as timelineMetas } from './timeline.js';
import { codecMetas as sessionMetas } from './session.js';
import { codecMetas as planningMetas } from './planning.js';
import { codecMetas as reportingMetas } from './reporting.js';

/** All registered codec metadata, collected from individual codec files. */
export const ALL_CODEC_METAS: readonly CodecMeta[] = [
  patternsMeta as CodecMeta,
  ...(timelineMetas as readonly CodecMeta[]),
  requirementsMeta as CodecMeta,
  ...(sessionMetas as readonly CodecMeta[]),
  prChangesMeta as CodecMeta,
  adrMeta as CodecMeta,
  ...(planningMetas as readonly CodecMeta[]),
  ...(reportingMetas as readonly CodecMeta[]),
  businessRulesMeta as CodecMeta,
  architectureMeta as CodecMeta,
  taxonomyMeta as CodecMeta,
  validationRulesMeta as CodecMeta,
  claudeModuleMeta as CodecMeta,
  indexMeta as CodecMeta,
];
