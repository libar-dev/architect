/**
 * File System Helpers for BDD Tests
 *
 * Provides utilities for managing temporary directories and files
 * during scanner and CLI tests. Ensures proper cleanup after each scenario.
 *
 * @libar-docs
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

// =============================================================================
// Types
// =============================================================================

/**
 * Context for managing a temporary directory.
 */
export interface TempDirContext {
  /** Path to the temporary directory */
  tempDir: string;
  /** Cleanup function to remove the directory */
  cleanup: () => Promise<void>;
}

/**
 * Options for creating a temporary directory.
 */
export interface TempDirOptions {
  /** Prefix for the temp directory name (default: "delivery-process-test-") */
  prefix?: string;
  /** Whether to keep the directory after cleanup (for debugging) */
  keepOnCleanup?: boolean;
}

// =============================================================================
// Temp Directory Management
// =============================================================================

/**
 * Create a temporary directory for test files.
 *
 * @example
 * ```typescript
 * const { tempDir, cleanup } = await createTempDir("scanner-test-");
 * try {
 *   await writeTempFile(tempDir, "src/test.ts", "export const x = 1;");
 *   // ... run tests ...
 * } finally {
 *   await cleanup();
 * }
 * ```
 */
export async function createTempDir(options: TempDirOptions = {}): Promise<TempDirContext> {
  const { prefix = 'delivery-process-test-', keepOnCleanup = false } = options;

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));

  return {
    tempDir,
    cleanup: async () => {
      if (!keepOnCleanup) {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    },
  };
}

/**
 * Write a file to a temporary directory, creating parent directories as needed.
 *
 * @param dir - Base directory path
 * @param relativePath - Relative path within the directory
 * @param content - File content to write
 * @returns Full path to the created file
 */
export async function writeTempFile(
  dir: string,
  relativePath: string,
  content: string
): Promise<string> {
  const fullPath = path.join(dir, relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content);
  return fullPath;
}

/**
 * Read a file from a directory.
 *
 * @param dir - Base directory path
 * @param relativePath - Relative path within the directory
 * @returns File content as string
 */
export async function readTempFile(dir: string, relativePath: string): Promise<string> {
  const fullPath = path.join(dir, relativePath);
  return fs.readFile(fullPath, 'utf-8');
}

/**
 * Check if a file exists in a directory.
 *
 * @param dir - Base directory path
 * @param relativePath - Relative path within the directory
 * @returns True if the file exists
 */
export async function fileExists(dir: string, relativePath: string): Promise<boolean> {
  const fullPath = path.join(dir, relativePath);
  try {
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * List files in a directory recursively.
 *
 * @param dir - Directory to list
 * @param pattern - Optional glob pattern to filter files
 * @returns Array of relative file paths
 */
export async function listFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string, baseDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);

      if (entry.isDirectory()) {
        await walk(fullPath, baseDir);
      } else {
        files.push(relativePath);
      }
    }
  }

  await walk(dir, dir);
  return files.sort();
}

// =============================================================================
// Test File Content Builders
// =============================================================================

/**
 * Create TypeScript source file content with @libar-docs directive.
 *
 * @example
 * ```typescript
 * const content = createTsFileWithDirective({
 *   category: "core",
 *   patternName: "TestPattern",
 *   description: "A test pattern for validation.",
 * });
 * ```
 */
export function createTsFileWithDirective(options: {
  category?: string;
  patternName?: string;
  description?: string;
  status?: string;
  useCases?: string[];
  uses?: string[];
  usedBy?: string[];
  archRole?: string;
  archContext?: string;
  archLayer?: string;
  includeFileOptIn?: boolean;
}): string {
  const {
    category = 'core',
    patternName,
    description = 'A test pattern.',
    status,
    useCases = [],
    usedBy = [],
    uses = [],
    archRole,
    archContext,
    archLayer,
    includeFileOptIn = true,
  } = options;

  const lines: string[] = [];

  // File-level opt-in
  if (includeFileOptIn) {
    lines.push('/** @libar-docs */');
    lines.push('');
  }

  // Pattern directive
  lines.push('/**');
  lines.push(` * @libar-docs-${category}`);

  if (patternName) {
    lines.push(` * @libar-docs-pattern ${patternName}`);
  }

  if (status) {
    lines.push(` * @libar-docs-status ${status}`);
  }

  for (const useCase of useCases) {
    lines.push(` * @libar-docs-usecase "${useCase}"`);
  }

  for (const uses_ of uses) {
    lines.push(` * @libar-docs-uses ${uses_}`);
  }

  for (const usedBy_ of usedBy) {
    lines.push(` * @libar-docs-used-by ${usedBy_}`);
  }

  if (archRole) {
    lines.push(` * @libar-docs-arch-role ${archRole}`);
  }
  if (archContext) {
    lines.push(` * @libar-docs-arch-context ${archContext}`);
  }
  if (archLayer) {
    lines.push(` * @libar-docs-arch-layer ${archLayer}`);
  }

  lines.push(' *');
  lines.push(` * ## ${patternName || 'Test Pattern'}`);
  lines.push(' *');
  lines.push(` * ${description}`);
  lines.push(' */');
  lines.push(`export interface ${(patternName || 'TestPattern').replace(/\s+/g, '')} {`);
  lines.push('  id: string;');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

/**
 * Create a minimal TypeScript file without @libar-docs directive.
 */
export function createTsFileWithoutDirective(): string {
  return `/**
 * A regular TypeScript file without @libar-docs.
 */
export interface RegularType {
  value: string;
}
`;
}

/**
 * Create a Gherkin feature file with @libar-docs-* tags.
 *
 * @example
 * ```typescript
 * const content = createFeatureFile({
 *   phase: 1,
 *   status: "completed",
 *   quarter: "Q4-2025",
 *   name: "Foundation Types",
 * });
 * ```
 */
export function createFeatureFile(options: {
  phase?: number;
  status?: string;
  quarter?: string;
  effort?: string;
  team?: string;
  name?: string;
  description?: string;
  deliverables?: Array<{ name: string; status: string; tests: number; location?: string }>;
}): string {
  const {
    phase = 1,
    status = 'completed',
    quarter = 'Q4-2025',
    effort = '1w',
    team = 'platform',
    name = 'Test Feature',
    description = 'A test feature for validation.',
    deliverables = [],
  } = options;

  const lines: string[] = [];

  // Process tags (using @libar-docs-* prefix per PDR-004)
  lines.push(`@libar-docs-phase:${phase}`);
  lines.push(`@libar-docs-status:${status}`);
  lines.push(`@libar-docs-quarter:${quarter}`);
  lines.push(`@libar-docs-effort:${effort}`);
  lines.push(`@libar-docs-team:${team}`);
  lines.push(`Feature: ${name}`);
  lines.push(`  ${description}`);
  lines.push('');

  if (deliverables.length > 0) {
    lines.push('  Background:');
    lines.push('    Given the following deliverables:');
    lines.push('      | Deliverable | Status | Tests | Location |');
    for (const d of deliverables) {
      lines.push(`      | ${d.name} | ${d.status} | ${d.tests} | ${d.location || ''} |`);
    }
  }

  lines.push('');

  return lines.join('\n');
}
