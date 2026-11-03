#!/usr/bin/env node
/**
 * Validates every skill in skills/ before it can be installed or released.
 * Zero dependencies so it runs anywhere Node 22+ is available.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillsRoot = join(repoRoot, 'skills');
const skillNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const semverPattern = /^\d+\.\d+\.\d+$/;

const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function readText(filePath) {
  return readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
}

function parseFrontmatter(text, label) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    fail(`${label}: missing YAML frontmatter`);
    return null;
  }

  const fields = {};
  let parentKey = null;

  for (const rawLine of match[1].split(/\r?\n/)) {
    if (!rawLine.trim() || rawLine.trimStart().startsWith('#')) continue;

    const keyValue = rawLine.trim().match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyValue) continue;

    const [, key, rawValue] = keyValue;
    const isIndented = /^\s+/.test(rawLine);
    const value = rawValue.trim().replace(/^["']|["']$/g, '');

    if (isIndented) {
      if (!parentKey) {
        fail(`${label}: unexpected nested frontmatter field "${key}"`);
        continue;
      }
      if (typeof fields[parentKey] !== 'object' || fields[parentKey] === null) {
        fields[parentKey] = {};
      }
      fields[parentKey][key] = value;
      continue;
    }

    if (value === '') {
      fields[key] = {};
      parentKey = key;
    } else {
      fields[key] = value;
      parentKey = null;
    }
  }

  return fields;
}

function checkVersionFile(filePath, expectedVersion, label) {
  if (!existsSync(filePath)) {
    fail(`${label}: missing ${filePath}`);
    return;
  }
  const actualVersion = readText(filePath).trim();
  if (actualVersion !== expectedVersion) {
    fail(`${label}: version ${actualVersion} does not match root VERSION ${expectedVersion}`);
  }
}

const versionFile = join(repoRoot, 'VERSION');
if (!existsSync(versionFile)) {
  fail('VERSION: file is missing at the repository root');
  process.exitCode = 1;
}

const suiteVersion = existsSync(versionFile) ? readText(versionFile).trim() : '';
if (suiteVersion && !semverPattern.test(suiteVersion)) {
  fail(`VERSION: "${suiteVersion}" is not a valid x.y.z semver`);
}

const packageFile = join(repoRoot, 'package.json');
if (existsSync(packageFile)) {
  try {
    const pkg = JSON.parse(readText(packageFile));
    if (pkg.version !== suiteVersion && pkg.private === true) {
      fail(`package.json: version ${pkg.version} does not match VERSION ${suiteVersion}`);
    }
  } catch (error) {
    fail(`package.json: invalid JSON (${error.message})`);
  }
}

if (!existsSync(skillsRoot)) {
  fail('skills/: directory is missing');
  process.exit(1);
}

const skillDirectories = readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
  .map((entry) => entry.name)
  .sort();

if (skillDirectories.length === 0) {
  fail('skills/: no skill directories found');
}

const skillNames = new Set();

for (const directoryName of skillDirectories) {
  const label = `skills/${directoryName}`;
  const skillFile = join(skillsRoot, directoryName, 'SKILL.md');

  if (!existsSync(skillFile)) {
    fail(`${label}: missing SKILL.md`);
    continue;
  }

  const frontmatter = parseFrontmatter(readText(skillFile), label);
  if (!frontmatter) continue;

  const name = frontmatter.name;
  const description = frontmatter.description;

  if (!name) {
    fail(`${label}: frontmatter is missing "name"`);
  } else {
    if (name !== directoryName) {
      fail(`${label}: frontmatter name "${name}" must match the directory name "${directoryName}"`);
    }
    if (name.length > 64) fail(`${label}: name exceeds 64 characters`);
    if (!skillNamePattern.test(name)) {
      fail(`${label}: name "${name}" must be lowercase alphanumeric with single hyphens`);
    }
    if (skillNames.has(name)) fail(`${label}: duplicate skill name "${name}"`);
    skillNames.add(name);
  }

  if (!description) {
    fail(`${label}: frontmatter is missing "description"`);
  } else if (description.length > 1024) {
    fail(`${label}: description exceeds 1024 characters`);
  }

  const metadata = frontmatter.metadata;
  if (!metadata || typeof metadata !== 'object') {
    fail(`${label}: frontmatter is missing the "metadata" map`);
  } else {
    if (metadata.version !== suiteVersion) {
      fail(`${label}: metadata.version "${metadata.version ?? ''}" does not match VERSION ${suiteVersion}`);
    }
    if (!metadata.source) {
      warn(`${label}: metadata.source is missing`);
    }
  }

  const ownVersionFile = join(skillsRoot, directoryName, 'VERSION');
  if (directoryName === 'k79-conductor') {
    checkVersionFile(ownVersionFile, suiteVersion, label);
  } else if (existsSync(ownVersionFile)) {
    checkVersionFile(ownVersionFile, suiteVersion, label);
  }
}

const conductorSkillFile = join(skillsRoot, 'k79-conductor', 'SKILL.md');
const routerFile = join(skillsRoot, 'k79-conductor', 'AGENTS.router.md');

for (const [label, filePath] of [
  ['k79-conductor/SKILL.md', conductorSkillFile],
  ['k79-conductor/AGENTS.router.md', routerFile],
]) {
  if (!existsSync(filePath)) {
    fail(`${label}: file is missing`);
    continue;
  }

  const text = readText(filePath);
  const references = [
    ...text.matchAll(/(k79-[a-z0-9-]+)\/SKILL\.md/g),
    ...text.matchAll(/`(k79-[a-z0-9-]+)`/g),
  ];
  for (const match of new Set(references.map((item) => item[1]))) {
    if (!existsSync(join(skillsRoot, match, 'SKILL.md'))) {
      fail(`${label}: references "${match}" but skills/${match} does not exist`);
    }
  }
}

for (const message of warnings) {
  console.warn(`warning: ${message}`);
}

if (errors.length > 0) {
  console.error(`\nSkill validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}

console.log(`Validated ${skillDirectories.length} skills at version ${suiteVersion}.`);
