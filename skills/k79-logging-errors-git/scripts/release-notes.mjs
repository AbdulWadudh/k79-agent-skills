#!/usr/bin/env node
/**
 * Generates release notes from the changelog ledger.
 *
 * The ledger is changelog/YYYY/MM/YYYY-MM-DD-<slug>.md, one file per logical change.
 * There is no aggregate changelog file.
 *
 * Boundary, in order:
 *   1. --baseline <git-ref>
 *   2. latest git tag (git describe --tags --abbrev=0)
 *   3. release-notes/.last-release.json (path + SHA-256 manifest)
 *
 * Usage:
 *   node scripts/release-notes.mjs --check
 *   node scripts/release-notes.mjs --dry-run --version 2.0.0
 *   node scripts/release-notes.mjs --version 2.0.0
 *
 * The first release in a repository with no tag and no manifest requires --baseline.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

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
const dryRun = flags.has('--dry-run');
const versionArgument = valueAfter('--version');
const baselineArgument = valueAfter('--baseline');

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
const releaseNotesRoot = join(repoRoot, 'release-notes');
const manifestFile = join(releaseNotesRoot, '.last-release.json');
const configFile = join(repoRoot, 'changelog.config.json');
const packageFile = join(repoRoot, 'package.json');
const versionFile = join(repoRoot, 'VERSION');

const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function readText(filePath) {
  return readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
}

function toPosix(filePath) {
  return filePath.split(sep).join('/');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function hashText(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function hashFile(filePath) {
  return hashText(readText(filePath));
}

function loadJson(filePath, label) {
  if (!existsSync(filePath)) return {};
  try {
    return JSON.parse(readText(filePath));
  } catch (error) {
    fail(`${label}: invalid JSON (${error.message})`);
    return {};
  }
}

const config = loadJson(configFile, 'changelog.config.json');
const packageJson = loadJson(packageFile, 'package.json');

function readVersion() {
  if (versionArgument) return versionArgument;
  if (packageJson.version) return String(packageJson.version);
  if (existsSync(versionFile)) return readText(versionFile).trim();
  return '';
}

const version = readVersion();

function parseFrontmatter(text, label) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    fail(`${label}: missing YAML frontmatter`);
    return null;
  }

  const fields = {};
  for (const rawLine of match[1].split('\n')) {
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

function loadEntries() {
  if (!existsSync(changelogRoot)) {
    fail('changelog/ is missing');
    return [];
  }

  const entries = [];
  for (const filePath of walk(changelogRoot)) {
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

    const text = readText(filePath);
    const parsed = parseFrontmatter(text, label);
    if (!parsed) continue;
    const { fields, body } = parsed;

    if (!fields.title) fail(`${label}: missing "title"`);
    if (!fields.date) fail(`${label}: missing "date"`);
    else if (!isRealDate(fields.date)) fail(`${label}: "date" must be a real YYYY-MM-DD date`);
    else if (fields.date !== fileDate) fail(`${label}: "date" ${fields.date} must match filename date ${fileDate}`);
    if (!fields.type) fail(`${label}: missing "type"`);
    else if (!types.includes(fields.type)) fail(`${label}: "type" must be one of ${types.join(', ')}`);
    if (!fields.scope) fail(`${label}: missing "scope"`);

    const breaking = fields.breaking ?? 'false';
    if (!['true', 'false'].includes(breaking)) fail(`${label}: "breaking" must be true or false`);

    const versionValue = fields.version ?? '';
    if (versionValue && !semverPattern.test(versionValue)) fail(`${label}: "version" must be x.y.z or empty`);
    const released = fields.released ?? '';
    if (released && !isRealDate(released)) fail(`${label}: "released" must be a real YYYY-MM-DD date`);

    if (!/^##\s+Why\s*$/m.test(body)) fail(`${label}: missing "## Why"`);
    if (!/^##\s+What\s*$/m.test(body)) fail(`${label}: missing "## What"`);
    if (!/^##\s+Verification\s*$/m.test(body)) fail(`${label}: missing "## Verification"`);
    if (breaking === 'true' && !/^##\s+Migration\s*$/m.test(body)) {
      fail(`${label}: breaking entries need "## Migration"`);
    }

    entries.push({
      path: `changelog/${relativePath}`,
      absolutePath: filePath,
      hash: hashText(text),
      slug,
      title: fields.title ?? slug,
      date: fields.date ?? fileDate,
      type: fields.type ?? 'changed',
      scope: fields.scope ?? '',
      version: versionValue,
      released,
      breaking: breaking === 'true',
      highlight: (fields.highlight ?? 'true') !== 'false',
      body,
    });
  }

  return entries;
}

function git(...gitArgs) {
  return execFileSync('git', gitArgs, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function tryGit(...gitArgs) {
  try {
    return git(...gitArgs);
  } catch {
    return '';
  }
}

function latestTag() {
  return tryGit('describe', '--tags', '--abbrev=0');
}

function entryVersionAt(ref, path) {
  try {
    const text = execFileSync('git', ['show', `${ref}:${path}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return text.match(/^version:\s*"?([^"\n]*)"?\s*$/m)?.[1] ?? '';
  } catch {
    return '';
  }
}

function parseNameStatus(output) {
  const changes = [];
  for (const line of output.split('\n')) {
    if (!line.trim()) continue;
    const parts = line.split('\t');
    const status = parts[0];
    if (status.startsWith('R') || status.startsWith('C')) {
      changes.push({ status: status[0], oldPath: parts[1], path: parts[2] });
    } else {
      changes.push({ status: status[0], path: parts[1] });
    }
  }
  return changes;
}

function selectWithGit(ref, entries) {
  const byPath = new Map(entries.map((entry) => [entry.path, entry]));
  const diff = tryGit('diff', '--name-status', ref, '--', 'changelog/');
  const changes = parseNameStatus(diff);
  const untracked = tryGit('ls-files', '--others', '--exclude-standard', '--', 'changelog/')
    .split('\n')
    .filter(Boolean)
    .map((path) => ({ status: 'A', path }));

  const selected = new Map();
  for (const change of [...changes, ...untracked]) {
    if (change.oldPath) {
      if (entryVersionAt(ref, change.oldPath) || manifestHas(change.oldPath)) {
        fail(`${change.oldPath}: released entries cannot be moved or renamed`);
      }
    }

    if (change.status === 'D') {
      const releasedVersion = entryVersionAt(ref, change.path);
      if (releasedVersion || manifestHas(change.path)) {
        fail(`${change.path}: released entries cannot be deleted (version ${releasedVersion || 'manifest'})`);
      } else {
        warnings.push(`${change.path}: deleted unreleased entry`);
      }
      continue;
    }

    const entry = byPath.get(change.path);
    if (!entry) continue;

    if (change.status === 'M') {
      if (entry.version || manifestHas(entry.path)) {
        fail(`${entry.path}: released entries cannot be modified; add a new entry instead`);
        continue;
      }
    }

    selected.set(entry.path, entry);
  }

  return [...selected.values()];
}

function selectWithManifest(manifest, entries) {
  const manifestPaths = new Set((manifest.entries ?? []).map((entry) => entry.path));
  const selected = [];

  for (const entry of entries) {
    if (!manifestPaths.has(entry.path)) selected.push(entry);
  }

  for (const recorded of manifest.entries ?? []) {
    const current = entries.find((entry) => entry.path === recorded.path);
    if (!current) {
      fail(`${recorded.path}: released entry is missing from the ledger`);
      continue;
    }
    if (current.hash !== recorded.sha256) {
      fail(`${recorded.path}: released entry changed; history is append-only`);
    }
  }

  return selected;
}

let manifestCache;
function readManifest() {
  if (manifestCache !== undefined) return manifestCache;
  if (!existsSync(manifestFile)) {
    manifestCache = null;
    return null;
  }
  manifestCache = loadJson(manifestFile, 'release-notes/.last-release.json');
  if (!Array.isArray(manifestCache.entries)) {
    fail('release-notes/.last-release.json: "entries" must be an array');
    manifestCache.entries = [];
  }
  return manifestCache;
}

function manifestHas(path) {
  const manifest = readManifest();
  return Boolean(manifest?.entries?.some((entry) => entry.path === path));
}

function selectEntries(entries) {
  if (baselineArgument) {
    if (!tryGit('rev-parse', '--verify', baselineArgument)) {
      fail(`--baseline ref "${baselineArgument}" does not exist`);
      return { boundary: baselineArgument, selected: [] };
    }
    return { boundary: baselineArgument, selected: selectWithGit(baselineArgument, entries) };
  }

  const tag = latestTag();
  if (tag) {
    const selected = selectWithGit(tag, entries);
    const manifest = readManifest();
    if (manifest) {
      for (const recorded of manifest.entries ?? []) {
        const current = entries.find((entry) => entry.path === recorded.path);
        if (!current) fail(`${recorded.path}: released entry is missing from the ledger`);
        else if (current.hash !== recorded.sha256) {
          fail(`${recorded.path}: released entry changed; history is append-only`);
        }
      }
    }
    return { boundary: tag, selected };
  }

  const manifest = readManifest();
  if (manifest) return { boundary: `manifest v${manifest.version}`, selected: selectWithManifest(manifest, entries) };

  fail('no git tag, no release-notes/.last-release.json, and no --baseline; refusing to treat all entries as new');
  return { boundary: 'none', selected: [] };
}

function resolveRepository() {
  if (config.repository) return String(config.repository).replace(/\/$/, '');
  const remote = tryGit('remote', 'get-url', 'origin');
  if (!remote) return '';
  const ssh = remote.match(/^git@([^:]+):(.+)$/);
  if (ssh) return `https://${ssh[1]}/${ssh[2].replace(/\.git$/, '')}`;
  return remote.replace(/\.git$/, '').replace(/\/$/, '');
}

function demoteHeadings(body) {
  return body
    .split('\n')
    .map((line) => {
      const heading = line.match(/^(#{2,4})\s+(.*)$/);
      if (!heading) return line;
      return `${'#'.repeat(Math.min(heading[1].length + 2, 6))} ${heading[2]}`;
    })
    .join('\n');
}

function sortEntries(entries) {
  return [...entries].sort((left, right) => {
    if (left.type !== right.type) return types.indexOf(left.type) - types.indexOf(right.type);
    if (left.date !== right.date) return left.date.localeCompare(right.date);
    return left.path.localeCompare(right.path);
  });
}

function generateReleaseNotes(targetVersion, boundary, selected) {
  const repositoryUrl = resolveRepository();
  const previousVersion = boundary.startsWith('manifest v')
    ? boundary.slice('manifest v'.length)
    : boundary.replace(/^v/, '');
  const releaseDate = today();
  const breaking = selected.filter((entry) => entry.breaking);
  const highlights = selected.filter((entry) => entry.highlight);
  const lines = [`**Release date:** ${releaseDate}`];
  const license = config.license || packageJson.license;
  if (license) lines.push(`**License:** ${license}`);
  if (repositoryUrl) {
    const compareUrl = previousVersion && previousVersion !== targetVersion
      ? `${repositoryUrl}/compare/v${previousVersion}...v${targetVersion}`
      : `${repositoryUrl}/releases/tag/v${targetVersion}`;
    lines.push(`**Full diff:** ${compareUrl}`);
  }
  lines.push('');

  lines.push('## Highlights', '');
  if (highlights.length === 0) lines.push('_See the change records below._');
  else lines.push(...highlights.map((entry) => `- ${entry.title}`));
  lines.push('');

  if (breaking.length > 0) {
    lines.push('## Breaking Changes', '');
    lines.push(...breaking.map((entry) => `- ${entry.title} — see [details](../${entry.path})`));
    lines.push('');
  }

  for (const type of types) {
    const matching = sortEntries(selected.filter((entry) => entry.type === type));
    if (matching.length === 0) continue;
    lines.push(`## ${typeLabels[type]}`, '');
    for (const entry of matching) {
      lines.push(`### ${entry.title}`, '');
      if (entry.scope) lines.push(`**Scope:** ${entry.scope}`, '');
      lines.push(demoteHeadings(entry.body), '');
    }
  }

  const verification = Array.isArray(config.verification) && config.verification.length > 0
    ? config.verification
    : ['See each change record for its verification steps.'];
  lines.push('## Verification', '', ...verification.map((item) => `- ${item}`), '');

  if (config.install) lines.push('## Installation', '', String(config.install), '');
  if (config.update) lines.push('## Updating', '', String(config.update), '');

  if (repositoryUrl) {
    lines.push('## Links', '');
    for (const entry of sortEntries(selected)) {
      lines.push(`- [Change record: ${entry.title}](${repositoryUrl}/blob/main/${entry.path})`);
    }
    if (license) lines.push(`- [License](${repositoryUrl}/blob/main/LICENSE)`);
    lines.push('');
  }

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}

function checkManifest(entries, targetVersion) {
  const manifest = readManifest();
  const tag = latestTag();

  if (manifest) {
    for (const recorded of manifest.entries ?? []) {
      const current = entries.find((entry) => entry.path === recorded.path);
      if (!current) {
        fail(`${recorded.path}: recorded in the release manifest but missing from the ledger`);
        continue;
      }
      if (current.hash !== recorded.sha256) {
        fail(`${recorded.path}: hash differs from the release manifest; history is append-only`);
      }
    }

    const manifestNote = join(releaseNotesRoot, `v${manifest.version}.md`);
    if (!existsSync(manifestNote)) {
      fail(`release-notes/v${manifest.version}.md is missing`);
    }
    if (tag && tag !== `v${manifest.version}`) {
      fail(`release-notes/.last-release.json is stale: manifest v${manifest.version}, latest tag ${tag}`);
    }
  } else if (tag && existsSync(join(releaseNotesRoot, `v${tag.replace(/^v/, '')}.md`))) {
    warnings.push('release-notes/.last-release.json is missing; run the generator to create it');
  }

  for (const entry of entries.filter((item) => item.version)) {
    const note = join(releaseNotesRoot, `v${entry.version}.md`);
    if (!existsSync(note)) fail(`release-notes/v${entry.version}.md is missing (${entry.path})`);
  }

  if (tag && targetVersion && `v${targetVersion}` === tag) {
    const note = join(releaseNotesRoot, `v${targetVersion}.md`);
    if (!existsSync(note)) fail(`release-notes/v${targetVersion}.md is missing for the current tag`);
  }
}

function main() {
  if (!version || !semverPattern.test(version)) {
    console.error(`error: version "${version || ''}" is not a valid x.y.z; pass --version or set package.json version`);
    process.exit(1);
  }
  if (checkOnly && dryRun) {
    console.error('error: pass only one of --check or --dry-run');
    process.exit(1);
  }

  const entries = loadEntries();
  if (errors.length > 0) {
    for (const message of errors) console.error(`  - ${message}`);
    console.error(`\nRelease-notes validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}).`);
    process.exit(1);
  }

  if (checkOnly) {
    checkManifest(entries, version);
    if (errors.length > 0) {
      for (const message of errors) console.error(`  - ${message}`);
      console.error(`\nRelease-notes check failed (${errors.length} issue${errors.length === 1 ? '' : 's'}).`);
      process.exit(1);
    }
    for (const message of warnings) console.warn(`warning: ${message}`);
    console.log(`Release notes OK (${entries.length} entries, ${entries.filter((entry) => entry.version).length} released).`);
    return;
  }

  const { boundary, selected } = selectEntries(entries);
  if (errors.length > 0) {
    for (const message of errors) console.error(`  - ${message}`);
    console.error(`\nRelease-notes validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}).`);
    process.exit(1);
  }

  if (dryRun) {
    console.log(`Release version: ${version}`);
    console.log(`Boundary: ${boundary}`);
    console.log(`Entries since boundary: ${selected.length}`);
    for (const entry of sortEntries(selected)) console.log(`  - [${entry.type}] ${entry.path} — ${entry.title}`);
    if (selected.length === 0) console.log('  (none)');
    console.log(`Target: release-notes/v${version}.md`);
    return;
  }

  if (selected.length === 0) {
    console.error(`error: no new changelog entries since ${boundary}; nothing to release`);
    process.exit(1);
  }

  const releaseFile = join(releaseNotesRoot, `v${version}.md`);
  mkdirSync(releaseNotesRoot, { recursive: true });
  writeFileSync(releaseFile, generateReleaseNotes(version, boundary, selected), 'utf8');
  console.log(`Wrote release-notes/v${version}.md from ${selected.length} entr${selected.length === 1 ? 'y' : 'ies'} since ${boundary}.`);

  const existing = readManifest();
  const merged = new Map();
  for (const recorded of existing?.entries ?? []) merged.set(recorded.path, recorded);
  for (const entry of entries.filter((item) => item.version)) {
    merged.set(entry.path, { path: entry.path, sha256: entry.hash });
  }
  for (const entry of selected) merged.set(entry.path, { path: entry.path, sha256: entry.hash });

  writeFileSync(
    manifestFile,
    `${JSON.stringify({
      version,
      tag: `v${version}`,
      generatedAt: new Date().toISOString(),
      entries: [...merged.values()].sort((left, right) => left.path.localeCompare(right.path)),
    }, null, 2)}\n`,
    'utf8',
  );
  console.log(`Updated release-notes/.last-release.json (${merged.size} covered entries).`);

  for (const message of warnings) console.warn(`warning: ${message}`);
}

main();
