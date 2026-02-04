/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern StringUtilities
 * @libar-docs-status completed
 * @libar-docs-used-by DocExtractor, SectionRenderer
 *
 * ## StringUtilities - Text Transformation Functions
 *
 * Provides shared utilities for string manipulation used across the delivery-process package,
 * including slugification for URLs/filenames and Markdown formatting cleanup.
 *
 * ### When to Use
 *
 * - Use `slugify()` when generating URL-safe identifiers for HTML anchors or filenames
 * - Use when normalizing text for consistent formatting across generated docs
 */

/**
 * Convert a string to a URL/filename-safe slug (lowercase, alphanumeric, hyphens)
 *
 * Transforms text into a normalized format suitable for:
 * - HTML anchor IDs
 * - Filenames
 * - URL slugs
 *
 * **Note:** Non-ASCII characters (including Unicode) are removed, not transliterated.
 * For example, `"hello-日本語"` becomes `"hello"`.
 *
 * @param text - Input text to slugify
 * @returns Slug string (lowercase, alphanumeric with hyphens)
 *
 * @example
 * ```typescript
 * slugify('User Authentication');    // 'user-authentication'
 * slugify('Create User (v2)');       // 'create-user-v2'
 * slugify('---test---');             // 'test'
 * slugify('Hello  World!');          // 'hello-world'
 * slugify('UPPER_CASE_TEXT');        // 'upper-case-text'
 * ```
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Convert CamelCase or PascalCase text to kebab-case with proper word separation
 *
 * Handles various naming conventions:
 * - PascalCase: `DeciderPattern` → `decider-pattern`
 * - Mixed case: `BddTestingInfrastructure` → `bdd-testing-infrastructure`
 * - Consecutive uppercase: `APIEndpoint` → `api-endpoint`
 * - Numbers: `OAuth2Flow` → `o-auth-2-flow`
 * - Already kebab-case: `already-kebab` → `already-kebab`
 *
 * **Note:** Unlike `slugify()`, this function properly splits CamelCase words
 * instead of just lowercasing them together.
 *
 * @param text - Input text (CamelCase, PascalCase, or mixed)
 * @returns kebab-case string
 *
 * @example
 * ```typescript
 * toKebabCase('DeciderPattern');               // 'decider-pattern'
 * toKebabCase('BddTestingInfrastructure');     // 'bdd-testing-infrastructure'
 * toKebabCase('APIEndpoint');                  // 'api-endpoint'
 * toKebabCase('OAuth2Flow');                   // 'o-auth-2-flow'
 * toKebabCase('DCB');                          // 'dcb'
 * toKebabCase('ProcessGuardLinter');           // 'process-guard-linter'
 * toKebabCase('already-kebab');                // 'already-kebab'
 * toKebabCase('Pattern (v2)');                 // 'pattern-v2'
 * ```
 */
export function toKebabCase(text: string): string {
  return (
    text
      // Insert hyphen between lowercase/digit and uppercase: camelCase → camel-Case
      .replace(/([a-z\d])([A-Z])/g, '$1-$2')
      // Insert hyphen between consecutive uppercase and uppercase+lowercase: HTTPServer → HTTP-Server
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
      // Insert hyphen between letter and digit: Auth2 → Auth-2
      .replace(/([a-zA-Z])(\d)/g, '$1-$2')
      // Convert to lowercase
      .toLowerCase()
      // Replace any non-alphanumeric characters with hyphens
      .replace(/[^a-z0-9]+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '')
  );
}

/**
 * Convert PascalCase or camelCase text to UPPER-KEBAB-CASE
 *
 * This is useful for generating constant-style identifiers or
 * documentation file names that use uppercase conventions.
 *
 * @param text - Input text in PascalCase or camelCase
 * @returns UPPER-KEBAB-CASE string
 *
 * @example
 * ```typescript
 * toUpperKebabCase('ProcessGuard');           // 'PROCESS-GUARD'
 * toUpperKebabCase('DecisionDocCodec');       // 'DECISION-DOC-CODEC'
 * toUpperKebabCase('OAuth2Flow');             // 'O-AUTH-2-FLOW'
 * ```
 */
export function toUpperKebabCase(text: string): string {
  return toKebabCase(text).toUpperCase();
}

/**
 * Known acronyms that should not be split during case conversion.
 *
 * These terms are protected with placeholders before regex processing,
 * then restored afterward to preserve their correct formatting.
 *
 * IMPORTANT: Sorted by length (longest first) to ensure longer acronyms
 * are matched before shorter ones they might contain.
 * e.g., "TypeScript" must be matched before "AST" in "TypeScriptAST"
 */
const KNOWN_ACRONYMS = [
  // Multi-word technical terms (longest first)
  'JavaScript', // 10 chars
  'TypeScript', // 10 chars
  'WebSocket', // 9 chars
  'GraphQL', // 7 chars
  'Gherkin', // 7 chars
  'RegExp', // 6 chars
  'GitHub', // 6 chars
  // 5-char acronyms
  'HTTPS',
  'OAuth',
  // 4-char acronyms
  'JSON',
  'HTML',
  'HTTP',
  'UUID',
  'REST',
  'CRUD',
  // 3-char acronyms
  'DoD', // Definition of Done
  'PRD', // Product Requirements Document
  'API',
  'CLI',
  'AST',
  'DOM',
  'URL',
  'XML',
  'CSS',
  'SQL',
  'JWT',
  'NPM',
  'ESM',
  'CJS',
  'SSO',
  'MCP',
  'LLM',
  'RAG',
  'ADR',
];

/**
 * Convert CamelCase or PascalCase text to "Title Case" with spaces
 *
 * Handles various naming conventions:
 * - PascalCase: `RemainingWorkEnhancement` → `Remaining Work Enhancement`
 * - Acronyms: `HTTPServer` → `HTTP Server`
 * - Mixed: `OAuth2Client` → `OAuth2 Client`
 * - kebab-case: `remaining-work` → `remaining work`
 * - Known acronyms: `DoDValidator` → `DoD Validator` (not `Do D Validator`)
 *
 * @param text - Input text in CamelCase, PascalCase, or kebab-case
 * @returns Human-readable title case string
 *
 * @example
 * ```typescript
 * camelCaseToTitleCase('RemainingWorkEnhancement'); // 'Remaining Work Enhancement'
 * camelCaseToTitleCase('HTTPServer');                // 'HTTP Server'
 * camelCaseToTitleCase('OAuth2Client');              // 'OAuth2 Client'
 * camelCaseToTitleCase('XMLParser');                 // 'XML Parser'
 * camelCaseToTitleCase('parseJSON');                 // 'parse JSON'
 * camelCaseToTitleCase('DoDValidator');              // 'DoD Validator'
 * camelCaseToTitleCase('TypeScriptAST');             // 'TypeScript AST'
 * ```
 */
export function camelCaseToTitleCase(text: string): string {
  // Step 1: Protect known acronyms with placeholders
  // Add space marker after placeholder when followed by uppercase (word boundary)
  let result = text;
  const placeholders: Array<{ placeholder: string; acronym: string }> = [];

  for (const acronym of KNOWN_ACRONYMS) {
    // Case-sensitive match for acronyms
    if (result.includes(acronym)) {
      const placeholder = `__ACRONYM_${placeholders.length}__`;
      placeholders.push({ placeholder, acronym });
      const escapedAcronym = acronym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Replace acronym with placeholder:
      // 1. When preceded by lowercase and followed by uppercase: add spaces both sides
      result = result.replace(
        new RegExp('([a-z])' + escapedAcronym + '([A-Z])', 'g'),
        '$1 ' + placeholder + ' $2'
      );
      // 2. When followed by uppercase only: add space after
      result = result.replace(new RegExp(escapedAcronym + '([A-Z])', 'g'), placeholder + ' $1');
      // 2b. When followed by digit: add space after (PDR006 → PDR 006)
      result = result.replace(new RegExp(escapedAcronym + '(\\d)', 'g'), placeholder + ' $1');
      // 3. When preceded by lowercase only: add space before
      result = result.replace(
        new RegExp('([a-z])' + escapedAcronym + '(?![A-Za-z])', 'g'),
        '$1 ' + placeholder
      );
      // 4. Standalone occurrences (start of string, or between non-letters)
      result = result.replace(
        new RegExp('(?<![A-Za-z])' + escapedAcronym + '(?![A-Za-z])', 'g'),
        placeholder
      );
    }
  }

  // Step 2: Apply standard CamelCase splitting
  result = result
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // HTTPServer → HTTP Server
    .replace(/([a-z\d])([A-Z])/g, '$1 $2') // camelCase → camel Case
    .replace(/([A-Z]+)(\d)/g, '$1 $2') // V2 → V 2 (only when followed by digit)
    .replace(/(\d)([A-Z])/g, '$1 $2') // 006T → 006 T (digit-to-uppercase)
    .replace(/(\d)(__ACRONYM_\d+__)/g, '$1 $2') // 006__ACRONYM__ → 006 __ACRONYM__
    .replace(/-/g, ' ') // kebab-case → kebab case
    .trim();

  // Step 3: Restore acronyms from placeholders
  for (const { placeholder, acronym } of placeholders) {
    result = result.split(placeholder).join(acronym);
  }

  return result;
}

/**
 * Normalize line endings from Windows CRLF to Unix LF.
 *
 * Used when processing text that may have been created on Windows systems
 * or transferred through systems that preserve Windows line endings.
 *
 * @param text - Text that may contain CRLF line endings
 * @returns Text with all CRLF sequences replaced by LF
 *
 * @example
 * ```typescript
 * normalizeLineEndings('line1\r\nline2\r\n'); // 'line1\nline2\n'
 * normalizeLineEndings('already\nunix\n');    // 'already\nunix\n'
 * ```
 */
export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '\n');
}
