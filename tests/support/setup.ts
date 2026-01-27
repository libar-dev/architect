/**
 * BDD Test Setup - Test Initialization and Configuration
 *
 * This module provides common setup utilities for BDD tests.
 * It handles test lifecycle hooks and global configuration.
 *
 * @libar-docs
 */

import { beforeEach } from 'vitest';
import { resetPatternCounter } from '../fixtures/pattern-factories.js';

// =============================================================================
// Global Test Setup
// =============================================================================

/**
 * Setup function to be called in test suites that use pattern factories.
 * Resets the pattern counter between tests for deterministic IDs.
 */
export function setupPatternTests(): void {
  beforeEach(() => {
    resetPatternCounter();
  });
}

/**
 * Setup function for tests that need temp directory cleanup tracking.
 * Returns cleanup functions that should be called in afterEach.
 */
export function setupTempDirTests(): {
  registerCleanup: (cleanup: () => Promise<void>) => void;
  runCleanups: () => Promise<void>;
} {
  const cleanups: Array<() => Promise<void>> = [];

  return {
    registerCleanup: (cleanup: () => Promise<void>) => {
      cleanups.push(cleanup);
    },
    runCleanups: async () => {
      for (const cleanup of cleanups) {
        try {
          await cleanup();
        } catch {
          // Ignore cleanup errors (directory may already be deleted)
        }
      }
      cleanups.length = 0;
    },
  };
}

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Sleep for a specified number of milliseconds.
 * Useful for async tests that need timing control.
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a deterministic timestamp for stable test output.
 */
export function stableTimestamp(): string {
  return '2025-01-01T00:00:00.000Z';
}

/**
 * Create a test context object with common test configuration.
 */
export function createTestContext(): {
  timestamp: string;
  baseDir: string;
  outputDir: string;
} {
  return {
    timestamp: stableTimestamp(),
    baseDir: '/test/base',
    outputDir: '/test/output',
  };
}
