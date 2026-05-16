#!/usr/bin/env node

/**
 * Fetch unresolved PR comments from GitHub and save to individual markdown files
 *
 * Usage:
 *   npm run pr:comments -- --pr 108
 *   npm run pr:comments -- --pr 108 --output-dir _pr-review/pr-108-comments/
 *   npm run pr:comments -- --pr 108 --after-comment 050
 *   npm run pr:comments -- --owner darko-mijic --repo libar-accounting-brain --pr 108
 *
 * Notes:
 *   - Uses cursor-based pagination to fetch all review threads (no limit)
 */

import { execSync, execFileSync } from "child_process";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";

// Maximum pages to fetch to prevent infinite loops
const MAX_PAGES = 100;

// Parse CodeRabbit embedded comments from review body
// These are comments that can't be posted inline (outside diff range, nitpicks in body)
function parseCodeRabbitEmbeddedComments(reviewBody, reviewUrl, author) {
  const comments = [];
  if (!reviewBody) return comments;

  // Detect which category section we're in
  // Categories: "Outside diff range", "Nitpick comments", "Duplicate comments"
  const categorySections = [
    { pattern: /Outside diff range comments/gi, category: "outside-diff" },
    { pattern: /Nitpick comments/gi, category: "nitpick" },
    { pattern: /Duplicate comments/gi, category: "duplicate" },
  ];

  // Find all category positions in the body
  const categoryPositions = [];
  for (const { pattern, category } of categorySections) {
    let match;
    const regex = new RegExp(pattern.source, "gi");
    while ((match = regex.exec(reviewBody)) !== null) {
      categoryPositions.push({ position: match.index, category });
    }
  }
  // Sort by position
  categoryPositions.sort((a, b) => a.position - b.position);

  // Find category at a given position (last category header before this position)
  function getCategoryAtPosition(pos) {
    let currentCategory = "other";
    for (const { position, category } of categoryPositions) {
      if (position < pos) {
        currentCategory = category;
      } else {
        break;
      }
    }
    return currentCategory;
  }

  // Pattern to match file sections: <summary>filename.ext (N)</summary>
  // Only match actual file paths (must contain . or / to be a file, not section headers like "🧹 Nitpick comments")
  // Note: Content may have markdown blockquote prefixes ("> ") so we use [>\s]* to handle them
  const fileSectionRegex =
    /[>\s]*<details>[>\s]*<summary>([^<]*?[./][^<]*?)\s*\((\d+)\)<\/summary><blockquote>([\s\S]*?)<\/blockquote><\/details>/g;

  // Pattern to match individual comments within a file section
  // Format: `line-range`: **Title**\n\nContent
  const commentRegex =
    /`(\d+(?:-\d+)?)`:\s*\*\*([^*]+)\*\*\s*([\s\S]*?)(?=(?:`\d|---\s*$|<\/blockquote>|$))/g;

  let fileSectionMatch;
  while ((fileSectionMatch = fileSectionRegex.exec(reviewBody)) !== null) {
    const fileName = fileSectionMatch[1].trim();
    const sectionContent = fileSectionMatch[3];
    const matchPosition = fileSectionMatch.index;

    // Skip if this looks like a section header, not a file
    if (fileName.includes("comment") || fileName.startsWith("⚠") || fileName.startsWith("🧹")) {
      continue;
    }

    // Determine what category this file section belongs to
    const category = getCategoryAtPosition(matchPosition);

    let commentMatch;
    const commentPatternCopy = new RegExp(commentRegex.source, "g");
    while ((commentMatch = commentPatternCopy.exec(sectionContent)) !== null) {
      const lineRange = commentMatch[1];
      const title = commentMatch[2].trim();
      const content = commentMatch[3]
        .trim()
        .replace(/---\s*$/, "")
        .trim();

      // Extract first line number from range
      const line = parseInt(lineRange.split("-")[0], 10);

      comments.push({
        file: fileName,
        line: line || 0,
        url: reviewUrl,
        author: author,
        comment: `**${title}**\n\n${content}`,
        isEmbedded: true,
        category: category, // nitpick, outside-diff, duplicate, or other
      });
    }
  }

  return comments;
}

// Fetch review bodies and extract embedded comments
function fetchEmbeddedReviewComments(owner, repo, prNumber) {
  const prNum = parseInt(prNumber, 10);
  const query = `
    query($owner: String!, $repo: String!, $prNumber: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $prNumber) {
          reviews(first: 100) {
            nodes {
              author { login }
              body
              url
            }
          }
        }
      }
    }
  `;

  try {
    const args = [
      "api",
      "graphql",
      "-f",
      `query=${query}`,
      "-F",
      `owner=${owner}`,
      "-F",
      `repo=${repo}`,
      "-F",
      `prNumber=${prNum}`,
    ];

    const result = execFileSync("gh", args, {
      encoding: "utf8",
      timeout: 30000,
    });

    const data = JSON.parse(result);
    const reviews = data?.data?.repository?.pullRequest?.reviews?.nodes || [];

    const allEmbeddedComments = [];
    for (const review of reviews) {
      if (review.body && review.body.length > 100) {
        // Only parse substantial bodies
        const embedded = parseCodeRabbitEmbeddedComments(
          review.body,
          review.url,
          review.author?.login || "unknown"
        );
        allEmbeddedComments.push(...embedded);
      }
    }

    return allEmbeddedComments;
  } catch (error) {
    console.warn("Warning: Could not fetch embedded review comments:", error.message);
    return [];
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    owner: null,
    repo: null,
    pr: null,
    outputDir: null, // Will be set dynamically based on PR number
    afterComment: null,
    type: "all", // all, thread, nitpick, outside-diff, embedded
    exclude: [], // types to exclude: nitpick, outside-diff, duplicate, thread
  };

  for (let i = 0; i < args.length; i++) {
    const flag = args[i];

    switch (flag) {
      case "--owner":
        if (i + 1 >= args.length || args[i + 1].startsWith("--")) {
          console.error(`Error: ${flag} requires a value`);
          process.exit(1);
        }
        options.owner = args[++i];
        break;
      case "--repo":
        if (i + 1 >= args.length || args[i + 1].startsWith("--")) {
          console.error(`Error: ${flag} requires a value`);
          process.exit(1);
        }
        options.repo = args[++i];
        break;
      case "--pr":
        if (i + 1 >= args.length || args[i + 1].startsWith("--")) {
          console.error(`Error: ${flag} requires a value`);
          process.exit(1);
        }
        options.pr = args[++i];
        break;
      case "--output-dir":
        if (i + 1 >= args.length || args[i + 1].startsWith("--")) {
          console.error(`Error: ${flag} requires a value`);
          process.exit(1);
        }
        options.outputDir = args[++i];
        break;
      case "--after-comment":
        if (i + 1 >= args.length || args[i + 1].startsWith("--")) {
          console.error(`Error: ${flag} requires a value`);
          process.exit(1);
        }
        options.afterComment = args[++i];
        break;
      case "--type":
        if (i + 1 >= args.length || args[i + 1].startsWith("--")) {
          console.error(`Error: ${flag} requires a value`);
          process.exit(1);
        }
        const typeValue = args[++i].toLowerCase();
        const validTypes = ["all", "thread", "nitpick", "outside-diff", "embedded"];
        if (!validTypes.includes(typeValue)) {
          console.error(
            `Error: Invalid type "${typeValue}". Valid types: ${validTypes.join(", ")}`
          );
          process.exit(1);
        }
        options.type = typeValue;
        break;
      case "--exclude":
        if (i + 1 >= args.length || args[i + 1].startsWith("--")) {
          console.error(`Error: ${flag} requires a value`);
          process.exit(1);
        }
        const excludeValues = args[++i].toLowerCase().split(",");
        const validExcludes = ["nitpick", "outside-diff", "duplicate", "thread", "other"];
        for (const val of excludeValues) {
          if (!validExcludes.includes(val.trim())) {
            console.error(
              `Error: Invalid exclude type "${val}". Valid types: ${validExcludes.join(", ")}`
            );
            process.exit(1);
          }
          options.exclude.push(val.trim());
        }
        break;
      case "--":
        // Ignore -- separator (used by npm/pnpm to separate script args)
        break;
      default:
        if (flag.startsWith("--")) {
          console.error(`Unknown flag: ${flag}`);
          process.exit(1);
        }
    }
  }

  return options;
}

// Auto-detect repo info from git remote
function getRepoInfo() {
  try {
    const remote = execSync("git remote get-url origin", {
      encoding: "utf8",
    }).trim();

    // Handle both SSH and HTTPS URLs
    let match;
    if (remote.startsWith("git@github.com:")) {
      // SSH format: git@github.com:owner/repo.git
      match = remote.match(/git@github\.com:([^/]+)\/(.+)\.git$/);
    } else if (remote.startsWith("https://github.com/")) {
      // HTTPS format: https://github.com/owner/repo.git
      match = remote.match(/https:\/\/github\.com\/([^/]+)\/(.+)(?:\.git)?$/);
    }

    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ""),
      };
    }
  } catch (error) {
    // Fall back to manual specification
  }

  return { owner: null, repo: null };
}

// Check if gh CLI is available
function checkGhCli() {
  try {
    execSync("gh --version", { stdio: "ignore" });
    return true;
  } catch (error) {
    console.error("Error: GitHub CLI (gh) is not installed or not in PATH");
    console.error("Please install it from: https://cli.github.com/");
    return false;
  }
}

// Generate timestamp for file naming
function generateTimestamp() {
  return new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15); // YYYYMMDDTHHMMSS
}

// Format comment data as markdown
function formatCommentAsMarkdown(comment, index, prNumber, timestamp) {
  const paddedIndex = String(index).padStart(3, "0");
  const typeLabel = comment.isEmbedded ? ` (${comment.category || "embedded"})` : "";

  let typeDescription;
  if (comment.isEmbedded) {
    const categoryLabels = {
      nitpick: "Nitpick (embedded)",
      "outside-diff": "Outside diff range (embedded)",
      duplicate: "Duplicate (embedded)",
      other: "Embedded",
    };
    typeDescription = categoryLabels[comment.category] || "Embedded";
  } else {
    typeDescription = "Review thread";
  }

  return `# PR Comment ${paddedIndex} - ${prNumber}${typeLabel}

## Comment Details
- **Author**: ${comment.author}
- **File**: ${comment.file}:${comment.line}
- **URL**: ${comment.url}
- **Type**: ${typeDescription}
- **Fetched**: ${timestamp}

## Comment
${comment.comment}
`;
}

// Generate filename for markdown comment
function generateCommentFilename(prNumber, index, timestamp) {
  const paddedIndex = String(index).padStart(3, "0");
  return `pr-${prNumber}-comment-${paddedIndex}-${timestamp}.md`;
}

// Fetch unresolved PR comments using GraphQL with pagination
// Uses execFileSync to prevent command injection
function fetchUnresolvedComments(owner, repo, prNumber) {
  // Validate prNumber is a valid integer
  const prNum = parseInt(prNumber, 10);
  if (isNaN(prNum) || prNum <= 0) {
    console.error(`Error: PR number must be a positive integer, got: ${prNumber}`);
    process.exit(1);
  }

  const allUnresolvedComments = [];
  let cursor = null;
  let hasNextPage = true;
  let pageCount = 0;

  while (hasNextPage && pageCount < MAX_PAGES) {
    pageCount++;
    const query = `
      query($owner: String!, $repo: String!, $prNumber: Int!${cursor ? ", $cursor: String" : ""}) {
        repository(owner: $owner, name: $repo) {
          pullRequest(number: $prNumber) {
            reviewThreads(first: 100${cursor ? ", after: $cursor" : ""}) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                isResolved
                path
                line
                comments(first: 100) {
                  nodes {
                    author {
                      login
                    }
                    bodyText
                    url
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      // Build args array for execFileSync (no shell interpolation, prevents command injection)
      const args = [
        "api",
        "graphql",
        "-f",
        `query=${query}`,
        "-F",
        `owner=${owner}`,
        "-F",
        `repo=${repo}`,
        "-F",
        `prNumber=${prNum}`,
      ];
      if (cursor) {
        args.push("-F", `cursor=${cursor}`);
      }

      const result = execFileSync("gh", args, {
        encoding: "utf8",
        timeout: 30000, // 30 second timeout per page
      });

      const data = JSON.parse(result);

      // Validate response structure
      if (!data?.data?.repository?.pullRequest?.reviewThreads) {
        console.error("Error: Unexpected API response structure");
        console.error("Response:", JSON.stringify(data, null, 2));
        process.exit(1);
      }

      const reviewThreads = data.data.repository.pullRequest.reviewThreads;

      if (!Array.isArray(reviewThreads.nodes) || !reviewThreads.pageInfo) {
        console.error("Error: Invalid reviewThreads structure");
        console.error("reviewThreads:", JSON.stringify(reviewThreads, null, 2));
        process.exit(1);
      }

      // Extract unresolved comments from this page
      for (const thread of reviewThreads.nodes) {
        if (!thread.isResolved && thread.comments.nodes.length > 0) {
          // Iterate through ALL comments in the thread, not just the first one
          for (const comment of thread.comments.nodes) {
            allUnresolvedComments.push({
              file: thread.path,
              line: thread.line,
              url: comment.url,
              author: comment.author?.login || "unknown",
              comment: comment.bodyText,
            });
          }
        }
      }

      // Check if there are more pages
      hasNextPage = reviewThreads.pageInfo.hasNextPage;
      cursor = reviewThreads.pageInfo.endCursor;

      if (hasNextPage) {
        console.log(
          `Fetched page ${pageCount}, found ${allUnresolvedComments.length} unresolved so far...`
        );
      }
    } catch (error) {
      if (error.killed) {
        console.error("Error: Request timed out after 30 seconds");
      } else {
        console.error("Error fetching PR comments:", error.message);
      }
      process.exit(1);
    }
  }

  if (pageCount >= MAX_PAGES && hasNextPage) {
    console.warn(
      `Warning: Reached maximum page limit (${MAX_PAGES}). Some comments may not be fetched.`
    );
  }

  // Return as JSON lines format (same as before)
  if (allUnresolvedComments.length === 0) {
    return "";
  }

  return allUnresolvedComments.map((c) => JSON.stringify(c)).join("\n");
}

// Main function
function main() {
  if (!checkGhCli()) {
    process.exit(1);
  }

  const options = parseArgs();

  // Auto-detect repo info if not provided
  if (!options.owner || !options.repo) {
    const repoInfo = getRepoInfo();
    options.owner = options.owner || repoInfo.owner;
    options.repo = options.repo || repoInfo.repo;
  }

  // Set default output directory based on PR number
  if (!options.outputDir) {
    options.outputDir = `_pr-review/pr-${options.pr}-comments/`;
  }

  // Validate required options
  if (!options.owner || !options.repo || !options.pr) {
    console.error("Error: Missing required arguments");
    console.error(
      "Usage: npm run pr:comments -- --pr <number> [--type <type>] [--exclude <types>] [options]"
    );
    console.error("");
    console.error("Options:");
    console.error("  --pr <number>          PR number to fetch comments from");
    console.error(
      "  --type <type>          Filter by type: all, thread, nitpick, outside-diff, embedded"
    );
    console.error(
      "  --exclude <types>      Exclude types (comma-separated): nitpick, outside-diff, duplicate, thread, other"
    );
    console.error("  --owner <owner>        GitHub repo owner (auto-detected)");
    console.error("  --repo <repo>          GitHub repo name (auto-detected)");
    console.error(
      "  --output-dir <dir>     Output directory (default: _pr-review/pr-{number}-comments/)"
    );
    console.error("  --after-comment <num>  Only comments after this number (e.g., 050)");
    console.error("");
    console.error("Examples:");
    console.error("  pnpm pr:comments -- --pr 2                          # All comments");
    console.error("  pnpm pr:comments -- --pr 2 --type thread            # Only thread comments");
    console.error("  pnpm pr:comments -- --pr 2 --type nitpick           # Only nitpicks");
    console.error("  pnpm pr:comments -- --pr 2 --exclude nitpick        # All except nitpicks");
    console.error("  pnpm pr:comments -- --pr 2 --exclude nitpick,duplicate  # Exclude multiple");
    process.exit(1);
  }

  console.log(
    `Fetching unresolved comments for PR #${options.pr} from ${options.owner}/${options.repo}...`
  );

  // Fetch thread comments
  const rawComments = fetchUnresolvedComments(options.owner, options.repo, options.pr);

  // Parse JSON lines into array
  let threadComments = [];
  if (rawComments) {
    try {
      threadComments = rawComments
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));
    } catch (error) {
      console.error("Error parsing comment data:", error.message);
      console.error("Raw output:", rawComments);
      process.exit(1);
    }
  }

  console.log(`Found ${threadComments.length} review thread comment(s)`);

  // Fetch embedded comments from review bodies (CodeRabbit outside-diff-range, nitpicks)
  console.log("Fetching embedded comments from review bodies...");
  const embeddedComments = fetchEmbeddedReviewComments(options.owner, options.repo, options.pr);
  console.log(`Found ${embeddedComments.length} embedded comment(s) in review bodies`);

  // Combine all comments
  let comments = [...threadComments, ...embeddedComments];

  // Filter by type if specified
  if (options.type !== "all") {
    const originalCount = comments.length;
    if (options.type === "thread") {
      comments = comments.filter((c) => !c.isEmbedded);
    } else if (options.type === "embedded") {
      comments = comments.filter((c) => c.isEmbedded);
    } else if (options.type === "nitpick") {
      comments = comments.filter((c) => c.isEmbedded && c.category === "nitpick");
    } else if (options.type === "outside-diff") {
      comments = comments.filter((c) => c.isEmbedded && c.category === "outside-diff");
    }
    console.log(
      `Filtered to ${comments.length} ${options.type} comment(s) (from ${originalCount} total)`
    );
  }

  // Apply exclusions if specified
  if (options.exclude.length > 0) {
    const beforeExclude = comments.length;
    comments = comments.filter((c) => {
      // For thread comments
      if (!c.isEmbedded) {
        return !options.exclude.includes("thread");
      }
      // For embedded comments, check category
      return !options.exclude.includes(c.category);
    });
    console.log(
      `Excluded ${options.exclude.join(", ")}: ${comments.length} remaining (from ${beforeExclude})`
    );
  }

  if (comments.length === 0) {
    console.log("No comments found matching the specified type.");
    return;
  }

  // Generate timestamp for consistent file naming
  const timestamp = generateTimestamp();
  const fetchedAt = new Date().toISOString();

  // Markdown file output format
  const outputDir = resolve(options.outputDir);

  // Ensure output directory exists
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (error) {
    console.error(`Error creating output directory: ${error.message}`);
    process.exit(1);
  }

  // Filter comments if afterComment option is provided
  let filteredComments = comments;
  if (options.afterComment) {
    const afterCommentNum = parseInt(options.afterComment, 10);
    if (isNaN(afterCommentNum) || afterCommentNum < 0) {
      console.error(
        `Error: --after-comment must be a non-negative number, got: ${options.afterComment}`
      );
      process.exit(1);
    }
    console.log(`Filtering comments after comment ${String(afterCommentNum).padStart(3, "0")}...`);

    // Since comments are fetched in order, we can filter by index
    filteredComments = comments.slice(afterCommentNum);
    console.log(`Filtered to ${filteredComments.length} comments (from ${comments.length} total)`);
  }

  // Generate individual markdown files
  const createdFiles = [];
  for (let i = 0; i < filteredComments.length; i++) {
    const comment = filteredComments[i];
    // Use original comment index for numbering
    const commentIndex = options.afterComment ? comments.indexOf(comment) + 1 : i + 1;

    const filename = generateCommentFilename(options.pr, commentIndex, timestamp);
    const filePath = resolve(outputDir, filename);
    const markdownContent = formatCommentAsMarkdown(comment, commentIndex, options.pr, fetchedAt);

    writeFileSync(filePath, markdownContent);
    createdFiles.push(filename);
  }

  console.log(
    `\nTotal: ${comments.length} comment(s) (${threadComments.length} thread + ${embeddedComments.length} embedded)`
  );
  if (options.afterComment) {
    console.log(
      `Processed ${filteredComments.length} comments after comment ${options.afterComment}`
    );
  }
  console.log(`Created ${createdFiles.length} markdown files in: ${outputDir}`);

  if (createdFiles.length > 0) {
    console.log("\nCreated files:");
    createdFiles.forEach((file) => console.log(`  - ${file}`));
  }

  // Show summary
  if (filteredComments.length > 0) {
    console.log("\nSummary:");
    const fileCount = [...new Set(filteredComments.map((c) => c.file))].length;
    const authorCount = [...new Set(filteredComments.map((c) => c.author))].length;
    const threadCount = filteredComments.filter((c) => !c.isEmbedded).length;
    const embeddedCount = filteredComments.filter((c) => c.isEmbedded).length;
    console.log(`- ${fileCount} file(s) with comments`);
    console.log(`- ${authorCount} author(s) involved`);
    console.log(`- ${threadCount} review thread comment(s)`);
    console.log(`- ${embeddedCount} embedded comment(s) from review bodies`);
  }
}

main();
