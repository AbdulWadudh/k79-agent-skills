#!/usr/bin/env node
/**
 * Keeps the router block inside AGENTS.md identical to the canonical template.
 *
 * Usage:
 *   node scripts/sync-agents.mjs --check   # fail when the marked block drifts
 *   node scripts/sync-agents.mjs --sync    # replace only the marked block
 *
 * The block is delimited by:
 *   <!-- k79:router:start -->
 *   <!-- k79:router:end -->
 *
 * Everything outside the markers is preserved byte-for-byte. The template is
 * k79-conductor/AGENTS.router.md from the project, project-local skills, or global skills.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';

const startMarker = '<!-- k79:router:start -->';
const endMarker = '<!-- k79:router:end -->';
const markerPattern = /<!-- k79:router:start -->\r?\n([\s\S]*?)\r?\n<!-- k79:router:end -->/;

const args = process.argv.slice(2);
const check = args.includes('--check');
const sync = args.includes('--sync');
const fileArgumentIndex = args.indexOf('--file');
const explicitFile = fileArgumentIndex === -1 ? '' : args[fileArgumentIndex + 1];

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function findRepoRoot(start) {
  let current = resolve(start);
  for (let depth = 0; depth < 20; depth += 1) {
    if (existsSync(join(current, '.git')) || existsSync(join(current, 'AGENTS.md'))) return current;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return resolve(start);
}

function findTemplate(repoRoot) {
  const candidates = [
    join(repoRoot, 'skills', 'k79-conductor', 'AGENTS.router.md'),
    join(repoRoot, '.agents', 'skills', 'k79-conductor', 'AGENTS.router.md'),
    join(repoRoot, '.claude', 'skills', 'k79-conductor', 'AGENTS.router.md'),
    join(repoRoot, 'agent', 'skills', 'k79-conductor', 'AGENTS.router.md'),
    join(homedir(), '.agents', 'skills', 'k79-conductor', 'AGENTS.router.md'),
    join(homedir(), '.claude', 'skills', 'k79-conductor', 'AGENTS.router.md'),
    join(homedir(), '.config', 'opencode', 'skills', 'k79-conductor', 'AGENTS.router.md'),
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

function firstDifference(expected, actual) {
  const expectedLines = expected.split('\n');
  const actualLines = actual.split('\n');
  const length = Math.max(expectedLines.length, actualLines.length);
  for (let index = 0; index < length; index += 1) {
    if (expectedLines[index] !== actualLines[index]) {
      return {
        line: index + 1,
        expected: expectedLines[index] ?? '<missing>',
        actual: actualLines[index] ?? '<missing>',
      };
    }
  }
  return null;
}

if (!check && !sync) {
  fail('pass --check or --sync');
}
if (check && sync) {
  fail('pass only one of --check or --sync');
}

const repoRoot = findRepoRoot(process.cwd());
const agentsFile = explicitFile ? resolve(process.cwd(), explicitFile) : join(repoRoot, 'AGENTS.md');
const templateFile = findTemplate(repoRoot);

if (!templateFile) {
  fail('cannot find k79-conductor/AGENTS.router.md in the project, .agents/skills, or ~/.agents/skills');
}
if (!existsSync(agentsFile)) {
  fail(`${agentsFile} is missing; create it with the reminder and the marked router block first`);
}

const agentsText = readFileSync(agentsFile, 'utf8').replace(/^\uFEFF/, '');
const newline = agentsText.includes('\r\n') ? '\r\n' : '\n';
const template = readFileSync(templateFile, 'utf8')
  .replace(/^\uFEFF/, '')
  .replace(/\r\n/g, '\n')
  .trim();

const match = agentsText.match(markerPattern);
if (!match) {
  fail(`${agentsFile} has no ${startMarker} / ${endMarker} block; add the markers or re-run the bootstrap`);
}

const current = match[1].replace(/\r\n/g, '\n').trim();

if (check) {
  if (current === template) {
    console.log('AGENTS.md router block is up to date.');
    process.exit(0);
  }
  const difference = firstDifference(template, current);
  console.error('error: AGENTS.md router block differs from the canonical template');
  if (difference) {
    console.error(`  first difference at line ${difference.line}`);
    console.error(`  expected: ${difference.expected}`);
    console.error(`  actual:   ${difference.actual}`);
  }
  console.error('run `node scripts/sync-agents.mjs --sync` and review the result');
  process.exit(1);
}

const block = `${startMarker}${newline}${template.replace(/\n/g, newline)}${newline}${endMarker}`;
const next = agentsText.replace(markerPattern, block);

if (next === agentsText) {
  console.log('AGENTS.md router block is already in sync.');
  process.exit(0);
}

writeFileSync(agentsFile, next, 'utf8');
console.log('Updated the marked router block in AGENTS.md; project content outside the markers is unchanged.');
