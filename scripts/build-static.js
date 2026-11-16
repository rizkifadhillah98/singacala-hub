const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const DIST_DIR = path.join(ROOT, 'dist');
const DIST_DATA_DIR = path.join(DIST_DIR, 'data');

function getLastDataModifiedIso() {
  try {
    const out = execSync(
      'git log -1 --format=%cI -- data/klasemen.json data/jadwal_dan_hasil.json',
      { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }
    )
      .toString()
      .trim();
    if (out) return out;
  } catch (_) {}

  try {
    const stat = fs.statSync(path.join(DATA_DIR, 'klasemen.json'));
    return stat.mtime.toISOString();
  } catch (_) {}

  return new Date().toISOString();
}

// Clean & rebuild dist/
fs.rmSync(DIST_DIR, { recursive: true, force: true });
fs.cpSync(PUBLIC_DIR, DIST_DIR, { recursive: true });
fs.mkdirSync(DIST_DATA_DIR, { recursive: true });

for (const filename of ['klasemen.json', 'jadwal_dan_hasil.json']) {
  const src = path.join(DATA_DIR, filename);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(DIST_DATA_DIR, filename));
  }
}

const meta = { lastModified: getLastDataModifiedIso() };
fs.writeFileSync(
  path.join(DIST_DATA_DIR, 'meta.json'),
  JSON.stringify(meta, null, 2) + '\n',
  'utf-8'
);

console.log(`[build:static] Built static bundle at dist/ (lastModified: ${meta.lastModified})`);
