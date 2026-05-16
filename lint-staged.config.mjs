// Architect state folders (stubs, step-stubs) hold design artifacts that are
// intentionally outside the TS project — they are parsed as Architect state,
// not compiled or linted. Filter them out before invoking ESLint so a staged
// stub edit does not fail the hook with "file not in project".
//
// Mirrors the root lint-staged.config.mjs behavior; this package-level config
// supersedes the inline `lint-staged` field that previously lived in
// package.json (which lacked the filter).
const ARCHITECT_STATE_PATH = /\/architect\/(stubs|step-stubs)\//u;
const isArchitectStateFile = (file) => ARCHITECT_STATE_PATH.test(file);

export default {
  '{tests,architect,scripts}/**/*.ts': (files) => {
    const lintable = files.filter((file) => !isArchitectStateFile(file));
    const commands = [];
    if (lintable.length > 0) {
      commands.push(`eslint --fix ${lintable.join(' ')}`);
    }
    commands.push(`prettier --write ${files.join(' ')}`);
    return commands;
  },
};
