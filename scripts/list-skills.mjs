#!/usr/bin/env node
/**
 * Lists the skills available in this repository with their versions.
 * Runs under Bun or Node with zero dependencies.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillsRoot = join(repoRoot, 'skills');
const versionFile = join(repoRoot, 'VERSION');

function readText(filePath) {
  return readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
}

function readName(skillFile) {
  const match = readText(skillFile).match(/^---\r?\n[\s\S]*?^name:\s*["']?([^"'\r\n]+)["']?\s*$/m);
  return match ? match[1].trim() : null;
}

const suiteVersion = existsSync(versionFile) ? readText(versionFile).trim() : 'unknown';
const skills = readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
  .map((entry) => ({
    directory: entry.name,
    name: readName(join(skillsRoot, entry.name, 'SKILL.md')),
  }))
  .sort((left, right) => left.directory.localeCompare(right.directory));

console.log(`Available skills (${skills.length}) — suite version ${suiteVersion}:`);
for (const skill of skills) {
  const suffix = skill.name && skill.name !== skill.directory ? ` (name mismatch: ${skill.name})` : '';
  console.log(`  - ${skill.directory}${suffix}`);
}
