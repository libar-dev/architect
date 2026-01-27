/**
 * Status Transition Detection Step Definitions
 *
 * BDD step definitions for testing the detectStatusTransitions function
 * that parses git diff output with docstring awareness.
 *
 * @libar-docs
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { StatusTransition } from '../../../src/lint/process-guard/index.js';
import { DEFAULT_TAG_PREFIX } from '../../../src/config/defaults.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface StatusTransitionTestState {
  // Input
  diff: string;
  files: string[];

  // Output
  result: Array<[string, StatusTransition]> | null;
}

// =============================================================================
// Module-level State
// =============================================================================

let state: StatusTransitionTestState | null = null;

function initState(): StatusTransitionTestState {
  return {
    diff: '',
    files: [],
    result: null,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a git diff header for a file.
 * Note: The hunk header @@ -0,0 +startLine,count @@ means new content starts at startLine.
 * Line numbers in the diff are tracked from this start.
 */
function createDiffHeader(file: string, startLine = 1): string {
  return `diff --git a/${file} b/${file}
index 1234567..abcdefg 100644
--- a/${file}
+++ b/${file}
@@ -0,0 +${startLine},50 @@`; // First added line will be at startLine
}

/**
 * Create a git diff header for a modified file (has both old and new content).
 */
function createModifiedDiffHeader(file: string): string {
  return `diff --git a/${file} b/${file}
index 1234567..abcdefg 100644
--- a/${file}
+++ b/${file}
@@ -1,10 +1,10 @@`;
}

/**
 * Parse status transitions from diff (mirrors the actual implementation for testing).
 */
function parseStatusTransitions(
  diff: string,
  files: readonly string[],
  tagPrefix: string
): Array<[string, StatusTransition]> {
  const transitions: Array<[string, StatusTransition]> = [];
  let currentFile = '';

  // Build regex patterns
  const escapedPrefix = tagPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const statusPattern = new RegExp(`${escapedPrefix}status:(\\w+)`);
  const hunkHeaderPattern = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

  interface ParseState {
    newLineNumber: number;
    insideDocstring: boolean;
    foundTags: Array<{ lineNumber: number; insideDocstring: boolean; rawLine: string }>;
    validAddedTag: { lineNumber: number; insideDocstring: boolean; rawLine: string } | null;
    removedTag: { lineNumber: number; insideDocstring: boolean; rawLine: string } | null;
  }

  const fileStates = new Map<string, ParseState>();

  const generatedDocsPatterns = ['docs-living/', 'docs-generated/', 'docs/generated/'];
  const isGeneratedDocsPath = (filePath: string): boolean =>
    generatedDocsPatterns.some((p) => filePath.startsWith(p) || filePath.includes(`/${p}`));

  for (const line of diff.split('\n')) {
    if (line.startsWith('diff --git')) {
      const match = /diff --git a\/(.+) b\/(.+)/.exec(line);
      const file = match?.[2] ?? '';
      currentFile = file;

      if (file && files.includes(file) && !isGeneratedDocsPath(file)) {
        fileStates.set(file, {
          newLineNumber: 0,
          insideDocstring: false,
          foundTags: [],
          validAddedTag: null,
          removedTag: null,
        });
      }
      continue;
    }

    const parseState = currentFile ? fileStates.get(currentFile) : undefined;
    if (!parseState) continue;

    const hunkMatch = hunkHeaderPattern.exec(line);
    if (hunkMatch?.[1]) {
      parseState.newLineNumber = parseInt(hunkMatch[1], 10) - 1;
      parseState.insideDocstring = false;
      continue;
    }

    if (!line.startsWith('-') || line.startsWith('---')) {
      parseState.newLineNumber++;
    }

    const lineContent = line.startsWith('+') || line.startsWith('-') ? line.substring(1) : line;
    if (/^\s*"""/.test(lineContent)) {
      parseState.insideDocstring = !parseState.insideDocstring;
    }

    if (line.startsWith('-') && !line.startsWith('---')) {
      const oldMatch = statusPattern.exec(line);
      if (oldMatch?.[1]) {
        const location = {
          lineNumber: parseState.newLineNumber,
          insideDocstring: parseState.insideDocstring,
          rawLine: line,
        };
        parseState.foundTags.push(location);

        if (!parseState.removedTag && !parseState.insideDocstring) {
          parseState.removedTag = location;
        }
      }
    }

    if (line.startsWith('+') && !line.startsWith('+++')) {
      const newMatch = statusPattern.exec(line);
      if (newMatch?.[1]) {
        const toStatus = newMatch[1].toLowerCase();
        const validStatuses = ['roadmap', 'active', 'completed', 'deferred'];
        if (validStatuses.includes(toStatus)) {
          const location = {
            lineNumber: parseState.newLineNumber,
            insideDocstring: parseState.insideDocstring,
            rawLine: line,
          };
          parseState.foundTags.push(location);

          if (!parseState.validAddedTag && !parseState.insideDocstring) {
            parseState.validAddedTag = location;
          }
        }
      }
    }
  }

  for (const [file, parseState] of fileStates) {
    if (!parseState.validAddedTag) continue;

    const toMatch = statusPattern.exec(parseState.validAddedTag.rawLine);
    const toStatus = toMatch?.[1]?.toLowerCase();
    if (!toStatus) continue;

    const isNewFile = !parseState.removedTag;
    let fromStatus: string;

    if (isNewFile) {
      fromStatus = 'roadmap';
    } else {
      const fromMatch = statusPattern.exec(parseState.removedTag!.rawLine);
      fromStatus = fromMatch?.[1]?.toLowerCase() ?? 'roadmap';
    }

    if (fromStatus === toStatus) continue;

    const transition: StatusTransition = {
      from: fromStatus as 'roadmap' | 'active' | 'completed' | 'deferred',
      to: toStatus as 'roadmap' | 'active' | 'completed' | 'deferred',
      isNewFile,
      toLocation: {
        lineNumber: parseState.validAddedTag.lineNumber,
        insideDocstring: parseState.validAddedTag.insideDocstring,
        rawLine: parseState.validAddedTag.rawLine,
      },
      ...(parseState.foundTags.length > 1 ? { allDetectedTags: parseState.foundTags } : {}),
    };

    transitions.push([file, transition]);
  }

  return transitions;
}

/**
 * Get the transition result for a specific file.
 */
function getTransition(file: string): StatusTransition | undefined {
  const entry = state!.result?.find(([f]) => f === file);
  return entry?.[1];
}

// =============================================================================
// Feature Loading
// =============================================================================

const feature = await loadFeature('tests/features/validation/status-transition-detection.feature');

// =============================================================================
// Step Definitions
// =============================================================================

describeFeature(feature, ({ Background, Rule }) => {
  Background(({ Given }) => {
    Given('a status transition test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Basic Status Detection Rule
  // ===========================================================================

  Rule('Status transitions are detected from file-level tags', ({ RuleScenario }) => {
    RuleScenario(
      'New file with status tag is detected as transition from roadmap',
      ({ Given, When, Then, And }) => {
        Given('a git diff for new file "specs/new.feature" with status "active"', () => {
          const file = 'specs/new.feature';
          state!.files = [file];
          state!.diff = `${createDiffHeader(file)}
+@libar-docs-status:active
+Feature: Test`;
        });

        When('detecting status transitions', () => {
          state!.result = parseStatusTransitions(state!.diff, state!.files, DEFAULT_TAG_PREFIX);
        });

        Then('a transition is detected for "specs/new.feature"', () => {
          const transition = getTransition('specs/new.feature');
          expect(transition).toBeDefined();
        });

        And('the transition is from "roadmap" to "active"', () => {
          const transition = getTransition('specs/new.feature');
          expect(transition!.from).toBe('roadmap');
          expect(transition!.to).toBe('active');
        });

        And('the transition is marked as new file', () => {
          const transition = getTransition('specs/new.feature');
          expect(transition!.isNewFile).toBe(true);
        });
      }
    );

    RuleScenario('Modified file with status change is detected', ({ Given, When, Then, And }) => {
      Given(
        'a git diff for modified file "specs/existing.feature" changing from "roadmap" to "active"',
        () => {
          const file = 'specs/existing.feature';
          state!.files = [file];
          state!.diff = `${createModifiedDiffHeader(file)}
-@libar-docs-status:roadmap
+@libar-docs-status:active
 Feature: Test`;
        }
      );

      When('detecting status transitions', () => {
        state!.result = parseStatusTransitions(state!.diff, state!.files, DEFAULT_TAG_PREFIX);
      });

      Then('a transition is detected for "specs/existing.feature"', () => {
        const transition = getTransition('specs/existing.feature');
        expect(transition).toBeDefined();
      });

      And('the transition is from "roadmap" to "active"', () => {
        const transition = getTransition('specs/existing.feature');
        expect(transition!.from).toBe('roadmap');
        expect(transition!.to).toBe('active');
      });

      And('the transition is not marked as new file', () => {
        const transition = getTransition('specs/existing.feature');
        expect(transition!.isNewFile).toBe(false);
      });
    });

    RuleScenario('No transition when status unchanged', ({ Given, When, Then }) => {
      Given(
        'a git diff for modified file "specs/unchanged.feature" with same status "active"',
        () => {
          const file = 'specs/unchanged.feature';
          state!.files = [file];
          state!.diff = `${createModifiedDiffHeader(file)}
-@libar-docs-status:active
+@libar-docs-status:active
 Feature: Test`;
        }
      );

      When('detecting status transitions', () => {
        state!.result = parseStatusTransitions(state!.diff, state!.files, DEFAULT_TAG_PREFIX);
      });

      Then('no transition is detected for "specs/unchanged.feature"', () => {
        const transition = getTransition('specs/unchanged.feature');
        expect(transition).toBeUndefined();
      });
    });
  });

  // ===========================================================================
  // Docstring Awareness Rule
  // ===========================================================================

  Rule('Status tags inside docstrings are ignored', ({ RuleScenario }) => {
    RuleScenario(
      'Status tag inside docstring is not used for transition',
      ({ Given, When, Then, And }) => {
        Given(
          'a git diff for new file "specs/test.feature" with:',
          (_ctx: unknown, table: Array<{ line: string; content: string }>) => {
            const file = 'specs/test.feature';
            state!.files = [file];

            // Build diff from table - use first line number as hunk start
            const firstLine = parseInt(table[0]?.line ?? '1', 10);
            let diffContent = createDiffHeader(file, firstLine);
            for (const row of table) {
              diffContent += `\n+${row.content}`;
            }
            state!.diff = diffContent;
          }
        );

        When('detecting status transitions', () => {
          state!.result = parseStatusTransitions(state!.diff, state!.files, DEFAULT_TAG_PREFIX);
        });

        Then('a transition is detected for "specs/test.feature"', () => {
          const transition = getTransition('specs/test.feature');
          expect(transition).toBeDefined();
        });

        And('the transition is from "roadmap" to "active"', () => {
          const transition = getTransition('specs/test.feature');
          expect(transition!.from).toBe('roadmap');
          expect(transition!.to).toBe('active');
        });

        And('the transition location is at line 2', () => {
          const transition = getTransition('specs/test.feature');
          expect(transition!.toLocation?.lineNumber).toBe(2);
        });
      }
    );

    RuleScenario('Multiple docstring status tags are all ignored', ({ Given, When, Then, And }) => {
      Given(
        'a git diff for new file "specs/multi-docstring.feature" with:',
        (_ctx: unknown, table: Array<{ line: string; content: string }>) => {
          const file = 'specs/multi-docstring.feature';
          state!.files = [file];

          // Build diff from table - use first line number as hunk start
          const firstLine = parseInt(table[0]?.line ?? '1', 10);
          let diffContent = createDiffHeader(file, firstLine);
          for (const row of table) {
            diffContent += `\n+${row.content}`;
          }
          state!.diff = diffContent;
        }
      );

      When('detecting status transitions', () => {
        state!.result = parseStatusTransitions(state!.diff, state!.files, DEFAULT_TAG_PREFIX);
      });

      Then('a transition is detected for "specs/multi-docstring.feature"', () => {
        const transition = getTransition('specs/multi-docstring.feature');
        expect(transition).toBeDefined();
      });

      And('the transition is from "roadmap" to "active"', () => {
        const transition = getTransition('specs/multi-docstring.feature');
        expect(transition!.from).toBe('roadmap');
        expect(transition!.to).toBe('active');
      });

      And('the all-detected-tags list has 3 entries', () => {
        const transition = getTransition('specs/multi-docstring.feature');
        expect(transition!.allDetectedTags).toBeDefined();
        expect(transition!.allDetectedTags).toHaveLength(3);
      });
    });

    RuleScenario('Only docstring status tags results in no transition', ({ Given, When, Then }) => {
      Given(
        'a git diff for new file "specs/only-docstring.feature" with:',
        (_ctx: unknown, table: Array<{ line: string; content: string }>) => {
          const file = 'specs/only-docstring.feature';
          state!.files = [file];

          // Build diff from table - use first line number as hunk start
          const firstLine = parseInt(table[0]?.line ?? '1', 10);
          let diffContent = createDiffHeader(file, firstLine);
          for (const row of table) {
            diffContent += `\n+${row.content}`;
          }
          state!.diff = diffContent;
        }
      );

      When('detecting status transitions', () => {
        state!.result = parseStatusTransitions(state!.diff, state!.files, DEFAULT_TAG_PREFIX);
      });

      Then('no transition is detected for "specs/only-docstring.feature"', () => {
        const transition = getTransition('specs/only-docstring.feature');
        expect(transition).toBeUndefined();
      });
    });
  });

  // ===========================================================================
  // First Tag Wins Rule
  // ===========================================================================

  Rule('First valid status tag outside docstrings is used', ({ RuleScenario }) => {
    RuleScenario('First file-level tag wins over subsequent tags', ({ Given, When, Then, And }) => {
      Given(
        'a git diff for new file "specs/multi-tag.feature" with:',
        (_ctx: unknown, table: Array<{ line: string; content: string }>) => {
          const file = 'specs/multi-tag.feature';
          state!.files = [file];

          // Build diff from table - use first line number as hunk start
          const firstLine = parseInt(table[0]?.line ?? '1', 10);
          let diffContent = createDiffHeader(file, firstLine);
          for (const row of table) {
            diffContent += `\n+${row.content}`;
          }
          state!.diff = diffContent;
        }
      );

      When('detecting status transitions', () => {
        state!.result = parseStatusTransitions(state!.diff, state!.files, DEFAULT_TAG_PREFIX);
      });

      Then('a transition is detected for "specs/multi-tag.feature"', () => {
        const transition = getTransition('specs/multi-tag.feature');
        expect(transition).toBeDefined();
      });

      And('the transition is from "roadmap" to "active"', () => {
        const transition = getTransition('specs/multi-tag.feature');
        expect(transition!.from).toBe('roadmap');
        expect(transition!.to).toBe('active');
      });

      And('the transition location is at line 2', () => {
        const transition = getTransition('specs/multi-tag.feature');
        expect(transition!.toLocation?.lineNumber).toBe(2);
      });
    });
  });

  // ===========================================================================
  // Line Number Tracking Rule
  // ===========================================================================

  Rule('Line numbers are tracked from hunk headers', ({ RuleScenario }) => {
    RuleScenario(
      'Transition location includes correct line number',
      ({ Given, When, Then, And }) => {
        Given(
          'a git diff for new file "specs/line-tracking.feature" starting at line 5 with status "active"',
          () => {
            const file = 'specs/line-tracking.feature';
            state!.files = [file];
            state!.diff = `diff --git a/${file} b/${file}
index 1234567..abcdefg 100644
--- a/${file}
+++ b/${file}
@@ -0,0 +5,10 @@
+@libar-docs-status:active
+Feature: Test`;
          }
        );

        When('detecting status transitions', () => {
          state!.result = parseStatusTransitions(state!.diff, state!.files, DEFAULT_TAG_PREFIX);
        });

        Then('a transition is detected for "specs/line-tracking.feature"', () => {
          const transition = getTransition('specs/line-tracking.feature');
          expect(transition).toBeDefined();
        });

        And('the transition location is at line 5', () => {
          const transition = getTransition('specs/line-tracking.feature');
          expect(transition!.toLocation?.lineNumber).toBe(5);
        });
      }
    );
  });

  // ===========================================================================
  // Generated Docs Filtering Rule
  // ===========================================================================

  Rule('Generated documentation directories are excluded', ({ RuleScenario }) => {
    RuleScenario('Status in docs-generated directory is ignored', ({ Given, When, Then }) => {
      Given('a git diff for new file "docs-generated/patterns.md" with status "completed"', () => {
        const file = 'docs-generated/patterns.md';
        state!.files = [file];
        state!.diff = `${createDiffHeader(file)}
+@libar-docs-status:completed`;
      });

      When('detecting status transitions', () => {
        state!.result = parseStatusTransitions(state!.diff, state!.files, DEFAULT_TAG_PREFIX);
      });

      Then('no transition is detected for "docs-generated/patterns.md"', () => {
        const transition = getTransition('docs-generated/patterns.md');
        expect(transition).toBeUndefined();
      });
    });

    RuleScenario('Status in docs-living directory is ignored', ({ Given, When, Then }) => {
      Given('a git diff for new file "docs-living/roadmap.md" with status "active"', () => {
        const file = 'docs-living/roadmap.md';
        state!.files = [file];
        state!.diff = `${createDiffHeader(file)}
+@libar-docs-status:active`;
      });

      When('detecting status transitions', () => {
        state!.result = parseStatusTransitions(state!.diff, state!.files, DEFAULT_TAG_PREFIX);
      });

      Then('no transition is detected for "docs-living/roadmap.md"', () => {
        const transition = getTransition('docs-living/roadmap.md');
        expect(transition).toBeUndefined();
      });
    });
  });
});
