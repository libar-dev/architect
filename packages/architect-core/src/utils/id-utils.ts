import * as crypto from 'crypto';

export function generatePatternId(filePath: string, line: number): string {
  const input = `${filePath}:${String(line)}`;
  const hash = crypto.createHash('md5').update(input).digest('hex').slice(0, 8);
  return `pattern-${hash}`;
}
