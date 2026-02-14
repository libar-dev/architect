import * as Gherkin from '@cucumber/gherkin';
import * as Messages from '@cucumber/messages';
import fs from 'fs';

const content = fs.readFileSync('delivery-process/decisions/adr-005-codec-based-markdown-rendering.feature', 'utf-8');
const uuidFn = Messages.IdGenerator.uuid();
const builder = new Gherkin.AstBuilder(uuidFn);
const matcher = new Gherkin.GherkinClassicTokenMatcher();
const parser = new Gherkin.Parser(builder, matcher);
const doc = parser.parse(content);

if (doc.feature) {
  for (const child of doc.feature.children) {
    if (child.rule && child.rule.name.includes('ADR content')) {
      const description = child.rule.description;

      // NEW ordering: table lines FIRST, then annotation regexes
      let stripped = description
        .split('\n')
        .filter((line: string) => {
          const trimmed = line.trim();
          return !(trimmed.startsWith('|') && trimmed.endsWith('|'));
        })
        .join('\n');

      stripped = stripped.replace(/\*\*Invariant:\*\*\s*[\s\S]*?(?=\*\*[A-Z]|\*\*$|$)/i, '');
      stripped = stripped.replace(/\*\*Rationale:\*\*\s*[\s\S]*?(?=\*\*[A-Z]|\*\*$|$)/i, '');
      stripped = stripped.replace(/\*\*Verified by:\*\*\s*[\s\S]*?(?=\*\*[A-Z]|\*\*$|$)/i, '');

      const strippedTrimmed = stripped.trim();
      console.log('REMAINING:', JSON.stringify(strippedTrimmed));
      console.log('LENGTH:', strippedTrimmed.length);
    }
  }
}
