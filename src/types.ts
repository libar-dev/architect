/**
 * Type definitions for the modular CLAUDE.md system.
 *
 * @module @libar-dev/modular-claude-md/types
 */

/**
 * A subsection represents a single markdown module file.
 */
export interface Subsection {
  /** Relative path to the module file (e.g., "core/the-third-way.md") */
  path: string;
  /** Tags for filtering (e.g., ["core-mandatory", "delivery-process"]) */
  tags: string[];
  /** Optional description of what the module covers */
  description?: string;
}

/**
 * A section groups related subsections under a common heading.
 */
export interface Section {
  /** Section heading in output (e.g., "Core Mental Models") */
  title: string;
  /** Tags for section-level matching */
  tags: string[];
  /** Optional section description */
  description?: string;
  /** Array of module references */
  subsections: Subsection[];
}

/**
 * A complete variation generates a full CLAUDE.md file.
 */
export interface Variation {
  /** Unique identifier (e.g., "default", "delivery-process") */
  name: string;
  /** Output location ("/" for root, "/packages/..." for subdirs) */
  path: string;
  /** Tags this variation includes */
  tags: string[];
  /** Token budget for context management (e.g., 8000) */
  budget_tokens: number;
  /** Human description of the variation's purpose */
  description?: string;
  /** Optional, informational (e.g., "4%") */
  target_context_percentage?: string;
}

/**
 * An additive variation generates a layer file for --add-dir composition.
 * Unlike complete variations, additive variations contain ONLY their specific
 * content, not the base/core-mandatory content.
 */
export interface AdditiveVariation {
  /** Layer name (e.g., "delivery-process") */
  name: string;
  /** Output directory for layer file (e.g., ".claude-layers/delivery-process") */
  output_dir: string;
  /** Tags specific to this layer (should NOT include core-mandatory) */
  tags: string[];
  /** Human description of what this layer adds */
  description?: string;
  /** Optional token budget for the layer (defaults to 2000 if not specified) */
  budget_tokens?: number;
}

/**
 * Preamble content displayed at the top of generated CLAUDE.md files.
 */
export interface Preamble {
  /** Subtitle displayed after title */
  tagline?: string;
  /** Array of key rules displayed prominently */
  critical_rules?: string[];
}

/**
 * Document metadata for the generated CLAUDE.md header.
 */
export interface DocumentMeta {
  /** Document title (e.g., "@libar-dev Platform: ...") */
  title: string;
  /** Schema version (e.g., "1.0") */
  version: string;
  /** Document description/tagline */
  description?: string;
  /** Philosophy statement */
  philosophy?: string;
}

/**
 * Complete metadata configuration for the modular CLAUDE.md system.
 */
export interface Metadata {
  /** Document metadata */
  document: DocumentMeta;
  /** Optional preamble with tagline and critical rules */
  preamble?: Preamble;
  /** Array of content sections */
  sections: Section[];
  /** Complete variations (generate full CLAUDE.md files) */
  variations: Variation[];
  /** Additive variations (generate layer files for --add-dir) */
  additive_variations?: AdditiveVariation[];
}

/**
 * Result of building a variation.
 */
export interface BuildResult {
  /** The variation that was built */
  variation: Variation | AdditiveVariation;
  /** Generated content */
  content: string;
  /** Output file path */
  outputPath: string;
  /** Estimated token count */
  tokens: number;
  /** Whether within budget */
  withinBudget: boolean;
}

/**
 * Result of validation.
 */
export interface ValidationResult {
  /** Whether the configuration is valid */
  valid: boolean;
  /** Array of error messages */
  errors: string[];
  /** Array of warning messages */
  warnings: string[];
}

/**
 * Configuration for the builder.
 */
export interface BuilderConfig {
  /** Base directory containing metadata.json and modules */
  baseDir: string;
  /** Project root directory for output */
  projectRoot: string;
  /** Whether to write files (false for preview) */
  write: boolean;
}
