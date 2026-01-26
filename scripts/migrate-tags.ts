#!/usr/bin/env npx tsx
/**
 * @libar-docs
 * @libar-docs-cli
 * @libar-docs-pattern MigrateTagsCLI
 * @libar-docs-status implemented
 *
 * ## Migrate Tags CLI - Unified Tag Prefix Migration Tool
 *
 * Migrates tags from old formats to the unified `@libar-docs-*` prefix per PDR-004.
 *
 * Handles three migration paths:
 * 1. Short-form: `@pattern:X` → `@libar-docs-pattern:X`
 * 2. Old prefix: `@libar-process-pattern:X` → `@libar-docs-pattern:X`
 * 3. Already correct: `@libar-docs-pattern:X` (no change)
 *
 * ### Usage
 *
 * ```bash
 * # Dry run (default) - show what would change
 * npx tsx scripts/migrate-tags.ts --file path/to/file.feature
 *
 * # Apply changes
 * npx tsx scripts/migrate-tags.ts --file path/to/file.feature --apply
 *
 * # Migrate directory
 * npx tsx scripts/migrate-tags.ts --dir delivery-process/decisions/ --apply
 *
 * # Migrate with glob pattern
 * npx tsx scripts/migrate-tags.ts --glob "*.feature" --apply
 * ```
 */

import * as fs from "fs/promises";
import * as path from "path";
import { glob } from "glob";

// Tag prefixes
const OLD_PREFIX = "@libar-process-";
const NEW_PREFIX = "@libar-docs-";

// Short-form tags that need full prefix
const SHORT_FORM_TAGS = [
  "pattern",
  "status",
  "phase",
  "quarter",
  "effort",
  "effort-actual",
  "team",
  "workflow",
  "risk",
  "priority",
  "completed",
  "depends-on",
  "enables",
  "brief",
  "product-area",
  "user-role",
  "business-value",
  "constraint",
  "level",
  "parent",
  "title",
  "behavior-file",
  "adr",
  "adr-status",
  "adr-category",
  "adr-supersedes",
  "adr-superseded-by",
  "discovered-gap",
  "discovered-improvement",
  "discovered-risk",
  "discovered-learning",
];

interface MigrationResult {
  file: string;
  changes: Array<{
    line: number;
    before: string;
    after: string;
  }>;
  unchanged: boolean;
}

interface CLIOptions {
  files: string[];
  dryRun: boolean;
  verbose: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): CLIOptions {
  const options: CLIOptions = {
    files: [],
    dryRun: true, // Safe default
    verbose: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--apply" || arg === "-a") {
      options.dryRun = false;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--file" || arg === "-f") {
      const nextArg = argv[++i];
      if (nextArg) options.files.push(nextArg);
    } else if (arg === "--dir" || arg === "-d") {
      const nextArg = argv[++i];
      if (nextArg) options.files.push(path.join(nextArg, "**/*.feature"));
    } else if (arg === "--glob" || arg === "-g") {
      const nextArg = argv[++i];
      if (nextArg) options.files.push(nextArg);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
migrate-tags - Migrate to unified @libar-docs-* tag prefix (PDR-004)

Usage:
  npx tsx scripts/migrate-tags.ts [options]

Options:
  -f, --file <path>    Single file to migrate
  -d, --dir <path>     Directory to migrate (adds **/*.feature)
  -g, --glob <pattern> Glob pattern for files
  -a, --apply          Apply changes (default: dry-run)
  -v, --verbose        Show all files, not just changed ones
  -h, --help           Show this help

Examples:
  # Preview changes (dry-run)
  npx tsx scripts/migrate-tags.ts -d delivery-process/decisions/

  # Apply changes to a single file
  npx tsx scripts/migrate-tags.ts -f delivery-process/decisions/pdr-001.feature --apply

  # Migrate all feature files
  npx tsx scripts/migrate-tags.ts -g "**/*.feature" --apply

Migration Rules:
  @libar-process-*  →  @libar-docs-*     (old prefix → new prefix)
  @pattern:X        →  @libar-docs-pattern:X  (short-form → full prefix)

Safe by default: Use --apply to actually modify files.
`);
}

/**
 * Migrate a single line, returning the transformed line and whether it changed
 *
 * Only migrates TAGS (lines starting with @) not prose mentions.
 * This preserves documentation that describes the old prefix.
 */
function migrateLine(line: string): { result: string; changed: boolean } {
  const trimmed = line.trim();

  // Only process lines that start with @ (actual Gherkin tags)
  // Skip prose lines that merely mention @libar-process-*
  if (!trimmed.startsWith("@")) {
    return { result: line, changed: false };
  }

  let result = line;
  let changed = false;

  // 1. Replace old prefix with new prefix (only on tag lines)
  if (result.includes(OLD_PREFIX)) {
    result = result.replace(new RegExp(OLD_PREFIX.replace("@", "\\@"), "g"), NEW_PREFIX);
    changed = true;
  }

  // 2. Replace short-form tags (only at start of line or after whitespace)
  // Match @tag: but NOT @libar-docs-tag: or @libar-process-tag:
  for (const tag of SHORT_FORM_TAGS) {
    const shortFormPattern = new RegExp(`(@)${tag}:`, "g");
    const alreadyPrefixed =
      result.includes(`@libar-docs-${tag}:`) || result.includes(`@libar-process-${tag}:`);

    if (!alreadyPrefixed && shortFormPattern.test(result)) {
      result = result.replace(shortFormPattern, `@libar-docs-${tag}:`);
      changed = true;
    }
  }

  return { result, changed };
}

/**
 * Migrate a file's content
 */
function migrateContent(content: string): {
  result: string;
  changes: Array<{ line: number; before: string; after: string }>;
} {
  const lines = content.split("\n");
  const changes: Array<{ line: number; before: string; after: string }> = [];

  const migratedLines = lines.map((line, index) => {
    const { result, changed } = migrateLine(line);
    if (changed) {
      changes.push({
        line: index + 1,
        before: line.trim(),
        after: result.trim(),
      });
    }
    return result;
  });

  return {
    result: migratedLines.join("\n"),
    changes,
  };
}

/**
 * Process a single file
 */
async function processFile(filePath: string, dryRun: boolean): Promise<MigrationResult> {
  const content = await fs.readFile(filePath, "utf-8");
  const { result, changes } = migrateContent(content);

  if (changes.length > 0 && !dryRun) {
    await fs.writeFile(filePath, result, "utf-8");
  }

  return {
    file: filePath,
    changes,
    unchanged: changes.length === 0,
  };
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (options.files.length === 0) {
    console.error("Error: No files specified. Use --file, --dir, or --glob");
    printHelp();
    process.exit(1);
  }

  // Resolve glob patterns
  const files: string[] = [];
  for (const pattern of options.files) {
    if (pattern.includes("*")) {
      const matched = await glob(pattern, { nodir: true });
      files.push(...matched);
    } else {
      files.push(pattern);
    }
  }

  if (files.length === 0) {
    console.log("No files matched the patterns.");
    process.exit(0);
  }

  console.log(
    options.dryRun ? "\n🔍 DRY RUN - No files will be modified\n" : "\n✏️  APPLYING CHANGES\n"
  );
  console.log(`Processing ${files.length} file(s)...\n`);

  let totalChanges = 0;
  let filesChanged = 0;

  for (const file of files) {
    try {
      const result = await processFile(file, options.dryRun);

      if (!result.unchanged) {
        filesChanged++;
        totalChanges += result.changes.length;

        console.log(`📄 ${result.file}`);
        for (const change of result.changes) {
          console.log(`   Line ${change.line}:`);
          console.log(`   - ${change.before}`);
          console.log(`   + ${change.after}`);
        }
        console.log("");
      } else if (options.verbose) {
        console.log(`✓ ${result.file} (no changes)`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }

  // Summary
  console.log("─".repeat(60));
  if (totalChanges > 0) {
    console.log(
      `\n${options.dryRun ? "Would change" : "Changed"}: ${totalChanges} tag(s) in ${filesChanged} file(s)`
    );
    if (options.dryRun) {
      console.log("\n💡 Run with --apply to make changes");
    }
  } else {
    console.log("\n✅ All files already use @libar-docs-* prefix");
  }
}

// Entry point
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
