/**
 * @libar-docs
 * @libar-docs-pattern GitNameStatusParser
 * @libar-docs-status active
 * @libar-docs-arch-role utility
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer infrastructure
 * @libar-docs-used-by GitBranchDiff, DetectChanges
 *
 * ## GitNameStatusParser - Shared Parsing for `git diff --name-status -z`
 *
 * Parses NUL-delimited git name-status output into categorized file lists.
 * Using `-z` preserves filenames with spaces and rename/copy pairs without
 * relying on whitespace splitting.
 */

export interface ParsedGitNameStatus {
  readonly modified: string[];
  readonly added: string[];
  readonly deleted: string[];
}

/**
 * Parse NUL-delimited `git diff --name-status -z` output.
 *
 * Git emits records as:
 * - `M\0path\0`
 * - `A\0path\0`
 * - `D\0path\0`
 * - `R100\0old_path\0new_path\0`
 * - `C087\0source_path\0copy_path\0`
 */
export function parseGitNameStatus(output: string): ParsedGitNameStatus {
  const modified: string[] = [];
  const added: string[] = [];
  const deleted: string[] = [];

  const tokens = output.split('\0');
  let index = 0;

  while (index < tokens.length) {
    const status = tokens[index++];
    if (!status) continue;

    const kind = status[0];
    if (!kind) continue;

    if (kind === 'R' || kind === 'C') {
      const oldPath = tokens[index++];
      const newPath = tokens[index++];
      if (!oldPath || !newPath) continue;
      modified.push(newPath);
      continue;
    }

    const filePath = tokens[index++];
    if (!filePath) continue;

    switch (kind) {
      case 'M':
        modified.push(filePath);
        break;
      case 'A':
        added.push(filePath);
        break;
      case 'D':
        deleted.push(filePath);
        break;
      default:
        break;
    }
  }

  return { modified, added, deleted };
}
