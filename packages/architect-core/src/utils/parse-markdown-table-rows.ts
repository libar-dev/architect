/**
 * Parse markdown pipe-delimited table rows from a description string.
 *
 * Used by ADR-table-vs-TS-constant sync tests to extract canonical-value
 * tables from Gherkin Rule descriptions and compare them to the
 * corresponding TypeScript constants. Drift between the two surfaces as
 * a failing assertion at CI time.
 */
export function parseMarkdownTableRows(description: string): Record<string, string>[] {
  const lines = description
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|'));

  if (lines.length < 2) return [];

  const cells = (line: string): string[] =>
    line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());

  const [headerLine, ...rowLines] = lines;
  if (headerLine === undefined) return [];

  const headers = cells(headerLine);
  return rowLines.map((rowLine) => {
    const row = cells(rowLine);
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx] ?? '';
    });
    return obj;
  });
}
