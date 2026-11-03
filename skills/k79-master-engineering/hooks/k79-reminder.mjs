#!/usr/bin/env node
/**
 * Prints the k79 reminder as plain text.
 *
 * Claude Code SessionStart hooks add stdout to the model context. Wire it with the
 * matcher "startup|resume|compact" so the reminder survives context compaction.
 * It only adds context; it does not block anything.
 */
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const candidates = [
  join(here, '..', 'K79.reminder.md'),
  join(homedir(), '.agents', 'skills', 'k79-master-engineering', 'K79.reminder.md'),
  join(process.cwd(), '.agents', 'skills', 'k79-master-engineering', 'K79.reminder.md'),
  join(process.cwd(), 'K79.reminder.md'),
];

const file = candidates.find((candidate) => existsSync(candidate));
process.stdout.write(
  file
    ? readFileSync(file, 'utf8')
    : 'k79: load the matching k79-* skill before coding.\n',
);
