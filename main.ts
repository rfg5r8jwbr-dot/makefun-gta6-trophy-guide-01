// Leonida Trophy Guide — the hand-in program (Node 22, standard library only).
// The guide itself is plain static files under app/: index.html opens in a
// browser, app/data/trophies.json holds the 55 trophies with their guides,
// and nothing is fetched over the network at run time. This program copies
// app/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json with the vendored make.fun library, exactly as the
// scorer expects. Leave vendor/makefun-frontend.ts as it is: the scorer
// rebuilds the dossier with its own copy and compares the two byte for byte.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve it locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files and directories in
// app/ or 48 MiB of app files: app/ counts beside /output's own 1000-entry
// cap, its screenshots/ and dossier.json).
const DOSSIER_OPTIONS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

/** Copy the guide (app/) and its screenshots into the output directory. */
function copyEntryFiles(repoRoot, outDir) {
  mkdirSync(outDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  if (existsSync(join(repoRoot, 'screenshots'))) {
    cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
  }
}

/** Write the dossier the judge reads, built from the copied files. */
function writeEntryDossier(outDir) {
  writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, DOSSIER_OPTIONS));
}

const EXPECTED_TROPHIES = 55;

/** Collect every file under a directory, relative to it. */
function listFiles(dir, prefix = '') {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...listFiles(join(dir, entry.name), rel));
    else if (entry.isFile()) out.push(rel);
  }
  return out;
}

/**
 * Validate the built bundle and fail loudly instead of silently handing the
 * scorer a broken output: the dossier must parse with the expected schema,
 * trophies.json must hold all 55 trophies, and every source file we copied
 * (app files and screenshots) must actually be present in the output.
 */
function validateOutput(repoRoot, outDir) {
  const fail = (msg) => { throw new Error(`build validation failed: ${msg}`); };

  const dossierPath = join(outDir, 'dossier.json');
  if (!existsSync(dossierPath)) fail('dossier.json is missing from the output');
  let dossier;
  try {
    dossier = JSON.parse(readFileSync(dossierPath, 'utf8'));
  } catch (err) {
    fail(`dossier.json does not parse as JSON: ${err.message}`);
  }
  if (dossier.schema !== 'makefun/dossier/v1') {
    fail(`dossier schema is ${JSON.stringify(dossier.schema)}, expected "makefun/dossier/v1"`);
  }
  if (typeof dossier.text !== 'string' || dossier.text.length === 0) {
    fail('dossier has no text content');
  }

  const trophiesPath = join(outDir, 'app', 'data', 'trophies.json');
  if (!existsSync(trophiesPath)) fail('app/data/trophies.json is missing from the output');
  let trophies;
  try {
    trophies = JSON.parse(readFileSync(trophiesPath, 'utf8'));
  } catch (err) {
    fail(`trophies.json does not parse as JSON: ${err.message}`);
  }
  const list = Array.isArray(trophies) ? trophies : trophies.trophies;
  if (!Array.isArray(list) || list.length !== EXPECTED_TROPHIES) {
    fail(`trophies.json holds ${Array.isArray(list) ? list.length : 'no'} trophies, expected ${EXPECTED_TROPHIES}`);
  }
  for (const trophy of list) {
    const label = `trophy ${trophy.id ?? JSON.stringify(trophy.name)}`;
    if (typeof trophy.name !== 'string' || trophy.name.trim() === '') fail(`${label} has no name`);
    if (typeof trophy.guide !== 'string' || trophy.guide.trim() === '') {
      fail(`${label} (${trophy.name}) has an empty guide`);
    }
    if (!Array.isArray(trophy.sources) || trophy.sources.length === 0) {
      fail(`${label} (${trophy.name}) has no sources`);
    }
  }

  for (const rel of listFiles(join(repoRoot, 'app'))) {
    if (!existsSync(join(outDir, 'app', rel))) fail(`app file missing from output: app/${rel}`);
  }
  const shotsDir = join(repoRoot, 'screenshots');
  if (existsSync(shotsDir)) {
    for (const rel of listFiles(shotsDir)) {
      const shotPath = join(outDir, 'screenshots', rel);
      if (!existsSync(shotPath)) fail(`screenshot missing from output: screenshots/${rel}`);
      if (statSync(shotPath).size === 0) fail(`screenshot is empty in output: screenshots/${rel}`);
    }
  } else {
    fail('screenshots/ is missing from the entry');
  }

  // Build summary: file count and total bytes of everything produced.
  const outFiles = listFiles(outDir);
  const totalBytes = outFiles.reduce((sum, rel) => sum + statSync(join(outDir, rel)).size, 0);
  const shotCount = existsSync(join(outDir, 'screenshots')) ? listFiles(join(outDir, 'screenshots')).length : 0;
  console.log(
    `build ok: ${list.length} trophies, ${outFiles.length} files, ${totalBytes} bytes total, ${shotCount} screenshots -> ${outDir}`,
  );
}

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

copyEntryFiles(repoRoot, outDir);
writeEntryDossier(outDir);
validateOutput(repoRoot, outDir);
