#!/usr/bin/env node
/**
 * Cuts a release: bumps every version marker, updates the changelog,
 * commits, creates an annotated tag, and pushes when a remote exists.
 *
 * Usage:
 *   bun run release patch
 *   bun run release minor
 *   bun run release major
 *   bun run release 1.4.0
 *
 * Node fallback:
 *   npm run release -- patch
 *
 * Flags:
 *   --dry-run      Show the plan without writing, committing, or tagging.
 *   --no-push      Commit and tag locally, but do not push.
 *   --allow-dirty  Skip the clean-working-tree check (not recommended).
 *   --allow-branch Allow releasing from a branch other than main.
 *   --allow-empty-changelog  Permit a release with no unreleased changelog entries.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillsRoot = join(repoRoot, 'skills');
const versionFile = join(repoRoot, 'VERSION');
const changelogFile = join(repoRoot, 'CHANGELOG.md');
const changelogScript = join(repoRoot, 'scripts', 'changelog.mjs');
const changelogRoot = join(repoRoot, 'changelog');
const releaseNotesFile = (tag) => join(repoRoot, 'release-notes', `${tag}.md`);
const packageFile = join(repoRoot, 'package.json');
const conductorVersionFile = join(skillsRoot, 'k79-conductor', 'VERSION');
const semverPattern = /^\d+\.\d+\.\d+$/;

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith('--')));
const bumpArgument = args.find((arg) => !arg.startsWith('--'));
const dryRun = flags.has('--dry-run');
const noPush = flags.has('--no-push');
const allowDirty = flags.has('--allow-dirty');
const allowBranch = flags.has('--allow-branch');
const allowEmptyChangelog = flags.has('--allow-empty-changelog');

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function readText(filePath) {
  return readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
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

function parseSemver(version, label) {
  if (!semverPattern.test(version)) fail(`${label} "${version}" is not a valid x.y.z semver`);
  return version.split('.').map(Number);
}

function isGreaterVersion(candidate, current) {
  const next = parseSemver(candidate, 'candidate version');
  const previous = parseSemver(current, 'current version');
  for (let index = 0; index < 3; index += 1) {
    if (next[index] > previous[index]) return true;
    if (next[index] < previous[index]) return false;
  }
  return false;
}

function bumpVersion(current, bump) {
  const [major, minor, patch] = parseSemver(current, 'current version');
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  if (bump === 'patch') return `${major}.${minor}.${patch + 1}`;
  if (semverPattern.test(bump)) return bump;
  fail('pass one of: patch, minor, major, or an explicit x.y.z version');
}

function updateSkillVersion(text, nextVersion, filePath) {
  const newline = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  let inMetadata = false;
  let updated = false;

  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index] === '---') break;
    if (/^metadata:\s*$/.test(lines[index])) {
      inMetadata = true;
      continue;
    }
    if (inMetadata) {
      if (/^\S/.test(lines[index])) break;
      if (/^\s+version:/.test(lines[index])) {
        lines[index] = `  version: "${nextVersion}"`;
        updated = true;
        break;
      }
    }
  }

  if (!updated) fail(`${filePath}: could not find metadata.version in frontmatter`);
  return lines.join(newline);
}

if (!existsSync(versionFile)) fail('VERSION is missing at the repository root');
if (!bumpArgument) fail('usage: npm run release -- <patch|minor|major|x.y.z>');

if (tryGit('rev-parse', '--is-inside-work-tree') !== 'true') {
  fail('this script must run inside a git repository');
}

const branch = tryGit('rev-parse', '--abbrev-ref', 'HEAD');
if (!branch || branch === 'HEAD') {
  fail('repository has no commits yet; create the initial commit before releasing');
}
if (branch !== 'main' && !allowBranch) {
  fail(`current branch is "${branch}"; switch to main or pass --allow-branch`);
}

const workingTree = tryGit('status', '--porcelain');
if (workingTree && !allowDirty && !dryRun) {
  fail('working tree is not clean; commit or stash your changes before releasing');
}

const currentVersion = readText(versionFile).trim();
const nextVersion = bumpVersion(currentVersion, bumpArgument);
if (!isGreaterVersion(nextVersion, currentVersion)) {
  fail(`next version ${nextVersion} must be greater than current version ${currentVersion}`);
}

const tag = `v${nextVersion}`;
if (tryGit('rev-parse', '-q', '--verify', `refs/tags/${tag}`)) {
  fail(`tag ${tag} already exists`);
}

console.log(`Releasing ${currentVersion} -> ${nextVersion}${dryRun ? ' (dry run)' : ''}`);

console.log('Validating skills...');
execFileSync(process.execPath, [join(repoRoot, 'scripts', 'validate-skills.mjs')], {
  cwd: repoRoot,
  stdio: 'inherit',
});

console.log('Checking the AGENTS.md router block...');
execFileSync(process.execPath, [join(repoRoot, 'scripts', 'sync-agents.mjs'), '--check'], {
  cwd: repoRoot,
  stdio: 'inherit',
});

const releaseDate = new Date().toISOString().slice(0, 10);

function readChangelogEntries() {
  if (!existsSync(changelogRoot)) return [];
  const entries = [];
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'TEMPLATE.md') {
        const text = readText(fullPath);
        const version = text.match(/^version:\s*"?([^"\n]*)"?\s*$/m)?.[1] ?? '';
        const title = text.match(/^title:\s*"?(.*?)"?\s*$/m)?.[1] ?? relative(changelogRoot, fullPath);
        if (!version) entries.push({ file: fullPath, title });
      }
    }
  };
  walk(changelogRoot);
  return entries;
}

const unreleasedEntries = readChangelogEntries();
if (unreleasedEntries.length === 0 && !allowEmptyChangelog) {
  fail('no unreleased changelog entries; add changelog/YYYY/MM/YYYY-MM-DD-<slug>.md or pass --allow-empty-changelog');
}

const skillFiles = readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
  .map((entry) => join(skillsRoot, entry.name, 'SKILL.md'))
  .filter((filePath) => existsSync(filePath));

const changedFiles = [
  'VERSION',
  'CHANGELOG.md',
  'package.json',
  'skills/k79-conductor/VERSION',
  ...skillFiles.map((filePath) => relative(repoRoot, filePath).split(sep).join('/')),
  'changelog',
  `release-notes/${tag}.md`,
];

if (dryRun) {
  console.log(`Would update: ${changedFiles.join(', ')}`);
  console.log(`Would commit "chore(release): ${tag}" and create tag ${tag}.`);
  console.log(`Would stamp ${unreleasedEntries.length} changelog entr${unreleasedEntries.length === 1 ? 'y' : 'ies'}:`);
  for (const entry of unreleasedEntries) console.log(`  - ${entry.title}`);
  process.exit(0);
}

console.log('Stamping changelog entries and generating release notes...');
execFileSync(
  process.execPath,
  [
    changelogScript,
    '--stamp', nextVersion,
    '--release', nextVersion,
    '--previous', currentVersion,
    '--date', releaseDate,
    '--quiet',
  ],
  { cwd: repoRoot, stdio: 'inherit' },
);

writeFileSync(versionFile, `${nextVersion}\n`, 'utf8');
writeFileSync(conductorVersionFile, `${nextVersion}\n`, 'utf8');

if (existsSync(packageFile)) {
  const packageJson = JSON.parse(readText(packageFile));
  packageJson.version = nextVersion;
  writeFileSync(packageFile, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
}

for (const skillFile of skillFiles) {
  writeFileSync(skillFile, updateSkillVersion(readText(skillFile), nextVersion, skillFile), 'utf8');
}

if (!existsSync(changelogFile)) fail('CHANGELOG.md was not generated by scripts/changelog.mjs');
if (!existsSync(releaseNotesFile(tag))) fail(`release-notes/${tag}.md was not generated`);

git('add', ...changedFiles);

git('commit', '-m', `chore(release): ${tag}`);
git('tag', '-a', tag, '-m', tag);

console.log(`Created commit and tag ${tag}.`);

const remote = tryGit('remote', 'get-url', 'origin');
if (!remote) {
  console.log('No "origin" remote configured; skipping push.');
  console.log('Add one with: git remote add origin https://github.com/AbdulWadudh/k79-agent-skills.git');
  console.log(`Then push with: git push origin ${branch} --follow-tags`);
} else if (noPush) {
  console.log(`Skipping push (--no-push). Push with: git push origin ${branch} --follow-tags`);
} else {
  git('push', 'origin', branch, '--follow-tags');
  console.log(`Pushed ${branch} and ${tag}; GitHub Actions will publish the release.`);
}
