export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function toKebabCase(text: string): string {
  return text
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-zA-Z])(\d)/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function toUpperKebabCase(text: string): string {
  return toKebabCase(text).toUpperCase();
}

const KNOWN_ACRONYMS = [
  'JavaScript',
  'TypeScript',
  'WebSocket',
  'GraphQL',
  'Gherkin',
  'RegExp',
  'GitHub',
  'HTTPS',
  'OAuth',
  'JSON',
  'HTML',
  'HTTP',
  'UUID',
  'REST',
  'CRUD',
  'DoD',
  'PRD',
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
] as const;

export function camelCaseToTitleCase(text: string): string {
  let result = text;
  const placeholders: { placeholder: string; acronym: string }[] = [];

  for (const acronym of KNOWN_ACRONYMS) {
    if (result.includes(acronym)) {
      const placeholder = `§§${String.fromCharCode(97 + placeholders.length)}§§`;
      placeholders.push({ placeholder, acronym });
      const escapedAcronym = acronym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      result = result.replace(
        new RegExp('([a-z])' + escapedAcronym + '([A-Z])', 'g'),
        '$1 ' + placeholder + ' $2',
      );
      result = result.replace(new RegExp(escapedAcronym + '([A-Z])', 'g'), placeholder + ' $1');
      result = result.replace(new RegExp(escapedAcronym + '(\\d)', 'g'), placeholder + ' $1');
      result = result.replace(
        new RegExp('([a-z])' + escapedAcronym + '(?![A-Za-z])', 'g'),
        '$1 ' + placeholder,
      );
      result = result.replace(
        new RegExp('(?<![A-Za-z])' + escapedAcronym + '(?![A-Za-z])', 'g'),
        placeholder,
      );
    }
  }

  result = result
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  for (const { placeholder, acronym } of placeholders) {
    result = result.replaceAll(placeholder, acronym);
  }

  return result;
}

export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}
