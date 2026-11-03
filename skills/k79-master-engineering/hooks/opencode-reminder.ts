/**
 * OpenCode reminder plugin.
 *
 * Place this file at ~/.config/opencode/plugins/k79-reminder.ts (or
 * .opencode/plugins/k79-reminder.ts for one project). OpenCode loads it at startup.
 *
 * It re-injects the k79 reminder into the compaction summary so long sessions do not
 * silently lose the rules. It does not block tools or change permissions.
 */
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

function reminder() {
  const candidates = [
    join(homedir(), '.agents', 'skills', 'k79-master-engineering', 'K79.reminder.md'),
    join(process.cwd(), '.agents', 'skills', 'k79-master-engineering', 'K79.reminder.md'),
    join(process.cwd(), 'K79.reminder.md'),
  ];
  const file = candidates.find((candidate) => existsSync(candidate));
  return file
    ? readFileSync(file, 'utf8')
    : 'k79: load the matching k79-* skill before coding.';
}

export const K79Reminder = async () => ({
  'experimental.session.compacting': async (_input, output) => {
    output.context.push(reminder());
  },
});
