#!/usr/bin/env node
/**
 * Changelog ledger: one markdown file per change under changelog/YYYY/MM/.
 * CHANGELOG.md and release-notes/vX.Y.Z.md are generated from those entries.
 * Dependency-free, so it runs under Bun or Node 22+ in any project.
 *
 * Usage:
 *   node scripts/changelog.mjs --init                 # create changelog/ and CHANGELOG.md
 *   node scripts/changelog.mjs                        # regenerate CHANGELOG.md
 *   node scripts/changelog.mjs --check                # fail if stale or malformed
 *   node scripts/changelog.mjs --stamp 0.2.0 --date 2026-11-03
 *   node scripts/changelog.mjs --release 0.2.0 --previous 0.1.0
 *
 * Optional changelog.config.json at the repository root:
 *   {
 *     "project": "my-app",
 *     "repository": "https://github.com/owner/my-app",
 *     "license": "MIT",
 *     "verification": ["`bun test`"],
 *     "install": "```bash\\nnpm install my-app\\n```",
 *     "update": "Run `npm update my-app`."
 *   }
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';

const templateText = `# Changelog entry template

Copy this to \`changelog/YYYY/MM/YYYY-MM-DD-<slug>.md\`. The date in the path and in
\`date\` must match. Leave \`version\` and \`released\` empty; the release step stamps them.

\`\`\`markdown
---
title: "User-facing, verb-led summary of the change"
date: "YYYY-MM-DD"
type: added # added | changed | deprecated | removed | fixed | security
scope: "packages/foo, apps/api"
version: ""
released: ""
breaking: false
highlight: true
---

## Why

The problem, constraint, or failure mode that forced this change.

## What

What was added, changed, or removed. Name the files, contracts, and behaviours.

## Verification

The exact commands or checks that prove it works.

## Notes

Follow-ups, rejected alternatives, or migration steps. Required when \`breaking: true\`.
\`\`\`
`;

function findRepoRoot(start) {
  let current = resolve(start);
  for (let depth = 0; depth < 20; depth += 1) {
    if (existsSync(join(current, '.git')) || existsSync(join(current, 'changelog'))) return current;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return resolve(start);
}

const repoRoot = findRepoRoot(process.cwd());
const changelogRoot = join(repoRoot, 'changelog');
const changelogFile = join(repoRoot, 'CHANGELOG.md');
const releaseNotesRoot = join(repoRoot, 'release-notes');
const skillsRoot = join(repoRoot, 'skills');
const configFile = join(repoRoot, 'changelog.config.json');
const packageFile = join(repoRoot, 'package.json');

const types = ['added', 'changed', 'deprecated', 'removed', 'fixed', 'security'];
const typeLabels = {
  added: 'Added',
  changed: 'Changed',
  deprecated: 'Deprecated',
  removed: 'Removed',
  fixed: 'Fixed',
  security: 'Security',
};
const entryPathPattern = /^(\d{4})\/(\d{2})\/(\d{4})-(\d{2})-(\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;
const semverPattern = /^\d+\.\d+\.\d+$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const args = process.argv.slice(2);
const flags = new Set(args.filter((argument) => argument.startsWith('--')));
const valueAfter = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};

const checkOnly = flags.has('--check');
const quiet = flags.has('--quiet');
const force = flags.has('--force');
const init = flags.has('--init');

const errors = [];
const warnings = [];

function readText(filePath) {
  return readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
}

function toPosix(filePath) {
  return filePath.split(sep).join('/');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function fail(message) {
  errors.push(message);
}

function loadConfig() {
  if (!existsSync(configFile)) return {};
  try {
    return JSON.parse(readText(configFile));
  } catch (error) {
    fail(`changelog.config.json: invalid JSON (${error.message})`);
    return {};
  }
}

const config = loadConfig();

function loadPackage() {
  if (!existsSync(packageFile)) return {};
  try {
    return JSON.parse(readText(packageFile));
  } catch (error) {
    fail(`package.json: invalid JSON (${error.message})`);
    return {};
  }
}

const packageJson = loadPackage();
const projectName = config.project || packageJson.name || basename(repoRoot);
const license = config.license || packageJson.license || '';

function normalizeRemote(remote) {
  const ssh = remote.match(/^git@([^:]+):(.+)$/);
  if (ssh) return `https://${ssh[1]}/${ssh[2].replace(/\.git$/, '')}`;
  return remote.replace(/\.git$/, '').replace(/\/$/, '');
}

function detectRepository() {
  if (config.repository) return normalizeRemote(String(config.repository));
  try {
    const remote = execFileSync('git', ['remote', 'get-url', 'origin'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return remote ? normalizeRemote(remote) : '';
  } catch {
    return '';
  }
}

const repositoryUrl = detectRepository();

function parseFrontmatter(text, label) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    fail(`${label}: missing YAML frontmatter`);
    return null;
  }

  const fields = {};
  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const keyValue = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyValue) {
      fail(`${label}: unsupported frontmatter line "${line}"`);
      continue;
    }
    const [, key, rawValue] = keyValue;
    fields[key] = rawValue.trim().replace(/^["']|["']$/g, '');
  }

  return { fields, body: text.slice(match[0].length).trim() };
}

function walk(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(fullPath);
  }
  return files;
}

function isRealDate(value) {
  if (!datePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function compareVersions(left, right) {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) return leftParts[index] - rightParts[index];
  }
  return 0;
}

function loadEntries() {
  const files = walk(changelogRoot);
  const entries = [];

  for (const filePath of files) {
    const relativePath = toPosix(relative(changelogRoot, filePath));
    const label = `changelog/${relativePath}`;

    if (relativePath === 'TEMPLATE.md') continue;

    const pathMatch = relativePath.match(entryPathPattern);
    if (!pathMatch) {
      fail(`${label}: expected changelog/YYYY/MM/YYYY-MM-DD-<slug>.md`);
      continue;
    }

    const [, pathYear, pathMonth, year, month, day, slug] = pathMatch;
    const fileDate = `${year}-${month}-${day}`;

    if (pathYear !== year || pathMonth !== month) {
      fail(`${label}: folder ${pathYear}/${pathMonth} does not match filename date ${fileDate}`);
    }

    const parsed = parseFrontmatter(readText(filePath), label);
    if (!parsed) continue;
    const { fields, body } = parsed;

    if (!fields.title) fail(`${label}: missing "title"`);
    if (!fields.date) fail(`${label}: missing "date"`);
    else if (!isRealDate(fields.date)) fail(`${label}: "date" must be a real YYYY-MM-DD date`);
    else if (fields.date !== fileDate) fail(`${label}: "date" ${fields.date} must match filename date ${fileDate}`);

    if (!fields.type) fail(`${label}: missing "type"`);
    else if (!types.includes(fields.type)) fail(`${label}: "type" must be one of ${types.join(', ')}`);

    if (!fields.scope) fail(`${label}: missing "scope"`);

    const version = fields.version ?? '';
    if (version && !semverPattern.test(version)) fail(`${label}: "version" must be x.y.z or empty`);

    const released = fields.released ?? '';
    if (released && !isRealDate(released)) fail(`${label}: "released" must be a real YYYY-MM-DD date`);

    const breaking = fields.breaking ?? 'false';
    if (!['true', 'false'].includes(breaking)) fail(`${label}: "breaking" must be true or false`);

    const highlight = fields.highlight ?? 'true';
    if (!['true', 'false'].includes(highlight)) fail(`${label}: "highlight" must be true or false`);

    if (!body) fail(`${label}: body is empty; add Why / What / Verification`);

    entries.push({
      file: filePath,
      relativePath: `changelog/${relativePath}`,
      slug,
      title: fields.title ?? slug,
      date: fields.date ?? fileDate,
      type: fields.type ?? 'changed',
      scope: fields.scope ?? '',
      version,
      released,
      breaking: breaking === 'true',
      highlight: highlight === 'true',
      body,
    });
  }

  return entries;
}

function groupByVersion(entries) {
  const groups = new Map();
  for (const entry of entries) {
    const key = entry.version || '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }
  return groups;
}

function sortEntries(entries) {
  return [...entries].sort((left, right) => {
    if (left.date !== right.date) return right.date.localeCompare(left.date);
    return left.relativePath.localeCompare(right.relativePath);
  });
}

function bulletFor(entry) {
  const breaking = entry.breaking ? ' **BREAKING**' : '';
  return `- ${entry.title}${breaking} ([details](${entry.relativePath}))`;
}

function sectionsFor(entries) {
  const lines = [];
  for (const type of types) {
    const matching = sortEntries(entries.filter((entry) => entry.type === type));
    if (matching.length === 0) continue;
    lines.push(`### ${typeLabels[type]}`, '', ...matching.map(bulletFor), '');
  }
  return lines;
}

function changelogHeader() {
  return [
    '# Changelog',
    '',
    'All notable changes to this project are documented here. Generated from',
    '[`changelog/`](./changelog) by the changelog generator — do not edit by hand.',
    'This project follows [Semantic Versioning](https://semver.org/).',
    '',
  ];
}

function generateChangelog(entries) {
  const groups = groupByVersion(entries);
  const lines = changelogHeader();

  const unreleased = groups.get('') ?? [];
  lines.push('## Unreleased', '');
  if (unreleased.length === 0) {
    lines.push('_No unreleased changes._', '');
  } else {
    lines.push(...sectionsFor(unreleased));
  }

  const releasedVersions = [...groups.keys()]
    .filter((version) => version !== '')
    .sort(compareVersions)
    .reverse();

  for (const version of releasedVersions) {
    const versionEntries = groups.get(version);
    const releaseDate = versionEntries.find((entry) => entry.released)?.released
      ?? sortEntries(versionEntries)[0].date;
    lines.push(`## [${version}] - ${releaseDate}`, '');
    lines.push(...sectionsFor(versionEntries));
    lines.push(`[Full release notes](./release-notes/v${version}.md)`, '');
  }

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}

function demoteHeadings(body) {
  return body
    .split(/\r?\n/)
    .map((line) => {
      const heading = line.match(/^(#{2,4})\s+(.*)$/);
      if (!heading) return line;
      return `${'#'.repeat(Math.min(heading[1].length + 2, 6))} ${heading[2]}`;
    })
    .join('\n');
}

function countSkills() {
  if (!existsSync(skillsRoot)) return 0;
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && existsSync(join(skillsRoot, entry.name, 'SKILL.md')))
    .length;
}

function generateReleaseNotes(version, previousVersion) {
  const entries = loadEntries().filter((entry) => entry.version === version);
  if (entries.length === 0) {
    errors.push(`release ${version}: no changelog entries have "version: \\"${version}\\""`);
    return null;
  }

  const sorted = sortEntries(entries);
  const releaseDate = sorted.find((entry) => entry.released)?.released ?? today();
  const primaryEntry = sorted[0].relativePath;
  const breaking = sorted.filter((entry) => entry.breaking);
  const highlighted = sorted.filter((entry) => entry.highlight);
  const highlights = highlighted.length > 0 ? highlighted : sorted;
  const skillCount = countSkills();

  const lines = [`**Release date:** ${releaseDate}`];
  if (license) lines.push(`**License:** ${license}`);
  if (skillCount > 0) lines.push(`**Skills:** ${skillCount}`);
  if (repositoryUrl) {
    const compareUrl = previousVersion
      ? `${repositoryUrl}/compare/v${previousVersion}...v${version}`
      : `${repositoryUrl}/releases/tag/v${version}`;
    lines.push(`**Full diff:** ${compareUrl}`);
  }
  lines.push('');

  lines.push('## Highlights', '', ...highlights.map((entry) => `- ${entry.title}`), '');

  if (breaking.length > 0) {
    lines.push('## Breaking Changes', '', ...breaking.map((entry) => `- ${entry.title} — see [details](${entry.relativePath})`), '');
  }

  lines.push('## Changes', '');
  for (const type of types) {
    const matching = sorted.filter((entry) => entry.type === type);
    if (matching.length === 0) continue;
    lines.push(`### ${typeLabels[type]}`, '');
    for (const entry of matching) {
      lines.push(`#### ${entry.title}`, '');
      if (entry.scope) lines.push(`**Scope:** ${entry.scope}`, '');
      lines.push(demoteHeadings(entry.body), '');
    }
  }

  const verification = Array.isArray(config.verification) && config.verification.length > 0
    ? config.verification
    : ['See each change record for its verification steps.'];
  lines.push('## Verification', '', ...verification.map((item) => `- ${item}`), '');

  if (config.install) {
    lines.push('## Installation', '', String(config.install), '');
  }

  if (config.update) {
    lines.push('## Updating', '', String(config.update), '');
  }

  if (repositoryUrl) {
    lines.push('## Links', '');
    lines.push(`- [Changelog](${repositoryUrl}/blob/main/CHANGELOG.md)`);
    lines.push(`- [Change record](${repositoryUrl}/blob/main/${primaryEntry})`);
    if (license) lines.push(`- [License](${repositoryUrl}/blob/main/LICENSE)`);
    lines.push('');
  }

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}

function writeStampedEntries(version, date) {
  const files = walk(changelogRoot);
  let stamped = 0;

  for (const filePath of files) {
    const relativePath = toPosix(relative(changelogRoot, filePath));
    if (!entryPathPattern.test(relativePath)) continue;

    const text = readText(filePath);
    const parsed = parseFrontmatter(text, relativePath);
    if (!parsed) continue;
    if (parsed.fields.version) continue;

    let next = text;
    if (/^version:\s*(?:""|'')?\s*$/m.test(next)) {
      next = next.replace(/^version:\s*(?:""|'')?\s*$/m, `version: "${version}"`);
    } else if (/^version:\s*.+$/m.test(next)) {
      continue;
    } else {
      next = next.replace(/^---\n/, `---\nversion: "${version}"\n`);
    }

    if (/^released:\s*(?:""|'')?\s*$/m.test(next)) {
      next = next.replace(/^released:\s*(?:""|'')?\s*$/m, `released: "${date}"`);
    } else if (!/^released:\s*.+$/m.test(next)) {
      next = next.replace(new RegExp(`^version: "${version}"$`, 'm'), `version: "${version}"\nreleased: "${date}"`);
    }

    writeFileSync(filePath, next, 'utf8');
    stamped += 1;
  }

  return stamped;
}

function initProject() {
  mkdirSync(changelogRoot, { recursive: true });
  mkdirSync(releaseNotesRoot, { recursive: true });
  const templateFile = join(changelogRoot, 'TEMPLATE.md');
  if (!existsSync(templateFile)) writeFileSync(templateFile, templateText, 'utf8');
  if (!existsSync(changelogFile)) writeFileSync(changelogFile, `${changelogHeader().join('\n').trimEnd()}\n`, 'utf8');
  if (!quiet) {
    console.log(`Initialized ${toPosix(relative(repoRoot, changelogRoot))}/ for ${projectName}.`);
    console.log('Add one file per change, then run the generator to refresh CHANGELOG.md.');
  }
}

function main() {
  if (init) {
    initProject();
    return;
  }

  if (!existsSync(changelogRoot)) {
    console.error('error: changelog/ is missing; run with --init to create it');
    process.exit(1);
  }

  const entries = loadEntries();

  if (errors.length > 0) {
    console.error(`\nChangelog validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
    for (const message of errors) console.error(`  - ${message}`);
    process.exit(1);
  }

  const stampVersion = valueAfter('--stamp');
  const releaseVersion = valueAfter('--release');
  const date = valueAfter('--date') ?? today();
  const previousVersion = valueAfter('--previous');

  if (stampVersion) {
    if (!semverPattern.test(stampVersion)) {
      console.error(`error: --stamp expects x.y.z, received "${stampVersion}"`);
      process.exit(1);
    }
    const stamped = writeStampedEntries(stampVersion, date);
    if (stamped === 0) warnings.push(`no unreleased entries were stamped for ${stampVersion}`);
    else if (!quiet) console.log(`Stamped ${stamped} changelog entr${stamped === 1 ? 'y' : 'ies'} as ${stampVersion}.`);
  }

  const currentEntries = loadEntries();
  const generated = generateChangelog(currentEntries);

  if (releaseVersion) {
    if (!semverPattern.test(releaseVersion)) {
      console.error(`error: --release expects x.y.z, received "${releaseVersion}"`);
      process.exit(1);
    }
    const releaseFile = join(releaseNotesRoot, `v${releaseVersion}.md`);
    if (existsSync(releaseFile) && !force) {
      if (!quiet) console.log(`Kept existing release-notes/v${releaseVersion}.md.`);
    } else {
      const notes = generateReleaseNotes(releaseVersion, previousVersion);
      if (!notes) {
        for (const message of errors) console.error(`  - ${message}`);
        process.exit(1);
      }
      mkdirSync(releaseNotesRoot, { recursive: true });
      writeFileSync(releaseFile, notes, 'utf8');
      if (!quiet) console.log(`Wrote release-notes/v${releaseVersion}.md.`);
    }
  }

  if (checkOnly) {
    const existing = existsSync(changelogFile) ? readText(changelogFile).replace(/\r\n/g, '\n') : '';
    if (existing !== generated) {
      console.error('error: CHANGELOG.md is out of date; run the changelog generator and commit the result');
      process.exit(1);
    }
    if (!quiet) console.log(`Changelog OK (${currentEntries.length} entries, ${new Set(currentEntries.map((entry) => entry.version || 'unreleased')).size} groups).`);
    return;
  }

  writeFileSync(changelogFile, generated, 'utf8');
  if (!quiet) console.log(`Wrote CHANGELOG.md from ${currentEntries.length} changelog entries.`);

  for (const message of warnings) console.warn(`warning: ${message}`);
}

main();
