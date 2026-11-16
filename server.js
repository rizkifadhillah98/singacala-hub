const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { runAndSaveStandings } = require('./scrapers/scraper-standings');
const { scrapeAllWeeks } = require('./scrapers/scraper-fixtures');

// Automatically load .env file if available (Node.js 20.6.0+)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
  } catch (err) {
    console.warn('[Server] Could not load .env file:', err.message);
  }
}

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = path.join(__dirname, 'data');

/**
 * Get local IPv4 address for LAN/Wi-Fi access
 */
function getNetworkIp() {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (_) {}
  return 'localhost';
}

// Secret token for administrative operations (scraping / refresh)
// Set via environment variable ADMIN_TOKEN or fallback to default
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin123';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Constant-time string comparison to prevent timing attacks
 */
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Constant-time dummy comparison to prevent length timing leakage
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Extract token from header, Authorization Bearer, or query parameter
 */
function extractToken(req) {
  let token = req.headers['x-admin-token'] || req.query.token;
  if (!token && req.headers['authorization']) {
    const parts = req.headers['authorization'].split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    }
  }
  return token;
}

/**
 * Authentication middleware for admin actions
 */
function requireAdminAuth(req, res, next) {
  const token = extractToken(req);
  if (!token || !safeCompare(token, ADMIN_TOKEN)) {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak: Token otentikasi tidak valid atau tidak disediakan.',
    });
  }
  next();
}

// Helper baca file JSON dengan aman dari direktori data/
function readJsonFile(filename, fallback = []) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return fallback;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return fallback;
  }
}

// Fallback direct static route for JSON files
app.get('/klasemen.json', (req, res) => {
  res.sendFile(path.join(DATA_DIR, 'klasemen.json'));
});
app.get('/jadwal_dan_hasil.json', (req, res) => {
  res.sendFile(path.join(DATA_DIR, 'jadwal_dan_hasil.json'));
});

// Endpoint: Ambil data klasemen saat ini (mendukung alias /api/standings dan /api/klasemen)
app.get(['/api/standings', '/api/klasemen'], (req, res) => {
  const data = readJsonFile('klasemen.json', []);
  const stat = fs.existsSync(path.join(DATA_DIR, 'klasemen.json'))
    ? fs.statSync(path.join(DATA_DIR, 'klasemen.json'))
    : null;
  const requestedGroup = req.query.group;
  const selected = requestedGroup
    ? data.find((g) => g.grup.toLowerCase() === requestedGroup.toLowerCase()) || data[0]
    : data[0];
  res.json({
    success: true,
    data: selected || null,
    groups: data,
    lastModified: stat ? stat.mtime : null,
  });
});

// Endpoint: Ambil data jadwal & hasil saat ini (mendukung alias /api/fixtures dan /api/jadwal)
app.get(['/api/fixtures', '/api/jadwal'], (req, res) => {
  const data = readJsonFile('jadwal_dan_hasil.json', []);
  const stat = fs.existsSync(path.join(DATA_DIR, 'jadwal_dan_hasil.json'))
    ? fs.statSync(path.join(DATA_DIR, 'jadwal_dan_hasil.json'))
    : null;
  res.json({
    success: true,
    data: data,
    lastModified: stat ? stat.mtime : null,
  });
});

// Endpoint: Verifikasi apakah token admin valid
app.get('/api/verify-admin', (req, res) => {
  const token = extractToken(req);
  const isValid = token ? safeCompare(token, ADMIN_TOKEN) : false;
  if (!isValid) {
    return res.status(403).json({ success: false, message: 'Token tidak valid' });
  }
  res.json({ success: true, message: 'Token valid' });
});

// Endpoint: Refresh data klasemen (PROTECTED BY ADMIN TOKEN)
let isScrapingStandings = false;
app.post('/api/refresh-standings', requireAdminAuth, async (req, res) => {
  if (isScrapingStandings) {
    return res.status(429).json({ success: false, message: 'Scraping klasemen sedang berjalan. Harap tunggu...' });
  }
  isScrapingStandings = true;
  try {
    console.log('[API Admin] Memulai pembaruan data klasemen...');
    const data = await runAndSaveStandings();
    res.json({
      success: true,
      message: 'Klasemen berhasil diperbarui!',
      data: data[0] || null,
      groups: data,
      updatedAt: new Date(),
    });
  } catch (err) {
    console.error('[API Error]', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui klasemen: ' + err.message });
  } finally {
    isScrapingStandings = false;
  }
});

// Endpoint: Refresh data jadwal & hasil (PROTECTED BY ADMIN TOKEN)
let isScrapingFixtures = false;
app.post('/api/refresh-fixtures', requireAdminAuth, async (req, res) => {
  if (isScrapingFixtures) {
    return res.status(429).json({ success: false, message: 'Scraping jadwal sedang berjalan. Harap tunggu...' });
  }
  isScrapingFixtures = true;
  try {
    console.log('[API Admin] Memulai pembaruan data jadwal & hasil (27 Pekan)...');
    const data = await scrapeAllWeeks(1, 27);
    res.json({
      success: true,
      message: 'Jadwal & hasil berhasil diperbarui!',
      data: data,
      updatedAt: new Date(),
    });
  } catch (err) {
    console.error('[API Error]', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui jadwal: ' + err.message });
  } finally {
    isScrapingFixtures = false;
  }
});

app.listen(PORT, HOST, () => {
  const networkIp = getNetworkIp();
  console.log(`=======================================================`);
  console.log(` 🏆 Server Singacala Hub Aktif!`);
  console.log(` 💻 Akses Laptop:   http://localhost:${PORT}`);
  console.log(` 📱 Akses HP / LAN: http://${networkIp}:${PORT}`);
  console.log(`=======================================================`);
});
