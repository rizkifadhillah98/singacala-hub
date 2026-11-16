# Laporan Audit Keamanan & Keandalan (Security & Reliability Audit)
**Proyek:** Visualisasi Pegadaian Championship  
**Fokus Audit:** Fitur Update (Refresh) & Get Data Klasemen dan Jadwal Hasil  
**Tanggal:** 31 Oktober 2026  
**Status:** Draf Rekomendasi Remediasi  

---

## 1. Ringkasan Eksekutif

Audit ini bertujuan untuk mengidentifikasi potensi celah keamanan (*vulnerabilities*), risiko keandalan (*race conditions* / ketersediaan), serta kelemahan implementasi pada alur pengambilan (*Get*) dan pembaruan (*Update / Refresh*) data klasemen dan jadwal pertandingan pada aplikasi Pegadaian Championship.

### Ringkasan Temuan:
| ID | Area / Fitur | Isu / Celah | Tingkat Keparahan | Status |
|---|---|---|---|---|
| **SEC-01** | Otentikasi Admin | Default Token Lemah (*Hardcoded Fallback Secret*) | **Tinggi (High)** | Perlu Dibereskan |
| **SEC-02** | Otentikasi Admin | Kebocoran Token via URL Query Parameter (`?token=...`) | **Sedang - Tinggi** | Perlu Dibereskan |
| **SEC-03** | Proteksi API | Ketiadaan Rate Limiting & Proteksi Brute-Force | **Tinggi (High)** | Perlu Dibereskan |
| **SEC-04** | Penyimpanan Data | *Race Condition* & File Corruption (Non-Atomic Write) | **Tinggi (High)** | Perlu Dibereskan |
| **SEC-05** | Scraper Update | Risiko Data Wipeout jika Scraping Gagal/Kosong | **Sedang (Medium)** | Perlu Dibereskan |
| **SEC-06** | Pembaruan Jadwal | Potensi DoS & Gateway Timeout (Scraping 27 Pekan) | **Sedang (Medium)** | Perlu Dibereskan |
| **SEC-07** | Frontend / Klien | Stored Cross-Site Scripting (XSS) & Pencurian Token | **Tinggi (High)** | Perlu Dibereskan |
| **SEC-08** | Konfigurasi Server | Ketiadaan HTTP Security Headers & Leakage Fingerprint | **Rendah (Low)** | Perlu Dibereskan |

---

## 2. Analisis Mendalam Celah Keamanan

### 2.1. SEC-01: Default Secret Token Hardcoded (`ADMIN_TOKEN = 'admin123'`)
* **File Terkait:** [`server.js`](file:///d:/MyProject/Pegadaian%20Championship/server.js#L14)
* **Kondisi Kode:**
  ```javascript
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin123';
  ```
* **Mekanisme Celah:**
  Jika aplikasi dijalankan di server produksi tanpa mengisi environment variable `ADMIN_TOKEN`, nilai fallback `'admin123'` akan digunakan. Siapa pun dapat mengakses endpoint administratif `/api/refresh-standings` dan `/api/refresh-fixtures`.
* **Dampak:**
  Penyerang dapat menjalankan scraping terus-menerus, memicu *resource exhaustion*, membuat IP server terkena blokir oleh situs sumber (`ileague.id`), serta mengacaukan integritas waktu pembaruan data.

---

### 2.2. SEC-02: Kebocoran Token Otentikasi Melalui URL Query Parameter
* **File Terkait:** [`server.js`](file:///d:/MyProject/Pegadaian%20Championship/server.js#L38), [`public/js/modules/ui.js`](file:///d:/MyProject/Pegadaian%20Championship/public/js/modules/ui.js#L39)
* **Kondisi Kode:**
  ```javascript
  // server.js
  let token = req.headers['x-admin-token'] || req.query.token;
  ```
* **Mekanisme Celah:**
  Aplikasi mengizinkan token dikirimkan melalui URL: `http://localhost:3000/?admin=...` atau `http://localhost:3000/api/refresh-standings?token=...`.
  URL yang mengandung parameter query akan otomatis tercatat pada:
  1. File log server (Access Log Apache/Nginx/NodeJS).
  2. Riwayat peramban (*browser history*).
  3. Log proksi atau CDN perantara.
  4. Header HTTP `Referer` jika pengguna membuka link eksternal.
* **Dampak:**
  Pencurian kredensial admin secara pasif oleh pihak yang memiliki akses ke log sistem atau melalui riwayat browser.

---

### 2.3. SEC-03: Ketiadaan Rate Limiting & Proteksi Serangan Brute-Force
* **File Terkait:** [`server.js`](file:///d:/MyProject/Pegadaian%20Championship/server.js#L115-L171) (`/api/verify-admin`, `/api/refresh-*`)
* **Mekanisme Celah:**
  Endpoint verifikasi admin dan pembaruan data tidak memiliki pembatas frekuensi request (*rate limiter*). Meskipun perbandingan string menggunakan `crypto.timingSafeEqual` yang mencegah *timing attack*, penyerang tetap dapat mengirimkan puluhan ribu request per menit untuk menebak token admin (*automated dictionary attack*).
* **Dampak:**
  Penyerang dapat menemukan token yang digunakan, serta membebani CPU server saat memproses enkripsi/verifikasi berulang.

---

### 2.4. SEC-04: Race Condition pada Pembacaan & Penulisan File Data (Non-Atomic Write)
* **File Terkait:** [`server.js`](file:///d:/MyProject/Pegadaian%20Championship/server.js#L63-L73) (`readJsonFile`) & Scrapers (`runAndSaveStandings`, `scrapeAllWeeks`)
* **Kondisi Kode:**
  ```javascript
  // scrapers/scraper-standings.js
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  ```
* **Mekanisme Celah:**
  Fungsi `fs.writeFileSync` membuka file dengan flag `'w'` (truncate). File akan seketika dikosongkan (0 bytes) sebelum isi baru selesai ditulis secara tuntas.
  Jika pada saat bersamaan pengguna biasa membuka halaman web dan memanggil `GET /api/standings` atau `GET /api/fixtures`:
  1. `fs.readFileSync` di `server.js` membaca file yang sedang kosong atau belum lengkap terisi.
  2. Fungsi `JSON.parse(raw)` akan gagal (*throw error* `SyntaxError: Unexpected end of JSON input`).
  3. API mengembalikan data kosong `[]`, menyebabkan antarmuka pengunjung rusak/blank.
* **Dampak:**
  Ketersediaan data terganggu (*inconsistent state* dan *data flickering* bagi pengguna).

---

### 2.5. SEC-05: Risiko Data Wipeout jika Scraping Menghasilkan Array Kosong
* **File Terkait:** [`scrapers/scraper-standings.js`](file:///d:/MyProject/Pegadaian%20Championship/scrapers/scraper-standings.js#L95) & [`scrapers/scraper-fixtures.js`](file:///d:/MyProject/Pegadaian%20Championship/scrapers/scraper-fixtures.js#L191)
* **Mekanisme Celah:**
  Jika terjadi perubahan struktur DOM pada situs web sumber atau jika situs sumber merespons dengan halaman captcha/blokir:
  - Scraper gagal mendeteksi baris tabel dan menghasilkan `hasil = []`.
  - Scraper tetap langsung mengeksekusi penulisan file `fs.writeFileSync(...)`.
* **Dampak:**
  Data jadwal atau klasemen yang sebelumnya valid dan lengkap akan tertimpa menjadi array kosong, merusak visualisasi web secara permanen sampai scraping berikutnya berhasil.

---

### 2.6. SEC-06: Potensi DoS dan HTTP Gateway Timeout (Scraping 27 Pekan)
* **File Terkait:** [`server.js`](file:///d:/MyProject/Pegadaian%20Championship/server.js#L151-L171) & [`scrapers/scraper-fixtures.js`](file:///d:/MyProject/Pegadaian%20Championship/scrapers/scraper-fixtures.js#L173-L194)
* **Mekanisme Celah:**
  Panggilan `POST /api/refresh-fixtures` menjalankan fungsi `scrapeAllWeeks(1, 27)`. Fungsi ini mengeksekusi request HTTP ke 27 halaman web secara berurutan, masing-masing dengan jeda tidur (*sleep*) dan sistem percobaan ulang (*retry* hingga 3 kali dengan jeda 1000ms).
  Waktu eksekusi rata-rata berkisar antara 15 hingga 45 detik.
* **Dampak:**
  1. Koneksi HTTP klien ditahan sangat lama.
  2. Reverse proxy di lingkungan produksi (seperti Nginx atau Cloudflare) akan memutus koneksi dengan status **504 Gateway Timeout**.
  3. Rentan disalahgunakan untuk menguras koneksi server (*slow HTTP exhaustion*).

---

### 2.7. SEC-07: Stored Cross-Site Scripting (XSS) & Eskalasi Pencurian Token Admin
* **File Terkait:**
  - [`public/js/modules/standings.js`](file:///d:/MyProject/Pegadaian%20Championship/public/js/modules/standings.js#L112-L114)
  - [`public/js/modules/fixtures.js`](file:///d:/MyProject/Pegadaian%20Championship/public/js/modules/fixtures.js#L125-L138)
  - [`public/js/modules/ui.js`](file:///d:/MyProject/Pegadaian%20Championship/public/js/modules/ui.js#L127-L135)
* **Kondisi Kode:**
  ```javascript
  // standings.js
  <span class="club-title">${team.klub}</span>
  <img src="${team.logo}" alt="${team.klub}">
  ```
  ```javascript
  // fixtures.js
  <span class="match-team-name">${m.timHome}</span>
  <div class="match-stadium-name">${stadiumName}</div>
  ```
* **Mekanisme Celah:**
  Data teks yang berasal dari web pihak ketiga (`ileague.id`) atau file JSON langsung digabungkan ke dalam `innerHTML` tanpa proses pelepasan karakter khusus (*HTML escaping*).
  Jika nama tim, stadion, atau URL logo disusupi kode injeksi (misal: `Persikad <img src=x onerror=alert(1)>`), browser akan mengeksekusinya sebagai skrip aktif.
* **Eskalasi Serangan (Chained Exploit):**
  Frontend menyimpan token otentikasi admin di `sessionStorage`:
  ```javascript
  sessionStorage.getItem('pc_admin_token')
  ```
  Skrip XSS yang berhasil berjalan di browser pengguna admin dapat langsung mengekstrak `pc_admin_token` dari `sessionStorage` dan mengirimkannya ke server penyerang. Penyerang mendapatkan akses penuh ke fitur update data.

---

### 2.8. SEC-08: Ketiadaan HTTP Security Headers & Kebocoran Stack
* **File Terkait:** [`server.js`](file:///d:/MyProject/Pegadaian%20Championship/server.js#L8-L18)
* **Mekanisme Celah:**
  - Header `X-Powered-By: Express` dikirimkan secara terbuka pada setiap respons.
  - Tidak ada konfigurasi header perlindungan dasar seperti `X-Frame-Options` (perlindungan clickjacking), `X-Content-Type-Options: nosniff`, maupun `Content-Security-Policy` (CSP).

---

## 3. Panduan Remediasi Kode (Remediation Patches)

### 3.1. Perbaikan Backend: `server.js`

Ganti mekanisme penanganan token, proteksi header, dan penulisan file:

```javascript
// 1. Matikan identitas Express & wajibkan ADMIN_TOKEN aman
app.disable('x-powered-by');

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
if (!ADMIN_TOKEN) {
  console.warn('[SECURITY WARNING] Variabel lingkungan ADMIN_TOKEN tidak disetel. Fitur pembaruan dinonaktifkan.');
}

// 2. Batasi penerimaan token HANYA via Header (hapus req.query.token)
function extractToken(req) {
  let token = req.headers['x-admin-token'];
  if (!token && req.headers['authorization']) {
    const parts = req.headers['authorization'].split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    }
  }
  return token;
}

// 3. Tambahkan pemeriksaan jika ADMIN_TOKEN belum disetel
function requireAdminAuth(req, res, next) {
  if (!ADMIN_TOKEN) {
    return res.status(503).json({
      success: false,
      message: 'Fitur pembaruan dinonaktifkan: ADMIN_TOKEN server belum dikonfigurasi.',
    });
  }
  const token = extractToken(req);
  if (!token || !safeCompare(token, ADMIN_TOKEN)) {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak: Token otentikasi tidak valid atau tidak disediakan.',
    });
  }
  next();
}
```

---

### 3.2. Perbaikan Scraper: Atomic File Write & Validasi Integritas

Terapkan *Atomic Write* pada [`scrapers/scraper-standings.js`](file:///d:/MyProject/Pegadaian%20Championship/scrapers/scraper-standings.js) dan [`scrapers/scraper-fixtures.js`](file:///d:/MyProject/Pegadaian%20Championship/scrapers/scraper-fixtures.js):

```javascript
// Helper Atomic Write: Tulis ke file .tmp lalu rename instan
function writeJsonAtomic(filePath, data) {
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, filePath); // Atomic operation di level OS
}

async function runAndSaveStandings() {
  const data = await scrapeKlasemen();

  // Guard: Batalkan penyimpanan jika data terindikasi rusak/kosong
  if (!data || !Array.isArray(data) || data.length === 0 || !data[0].klasemen || data[0].klasemen.length < 2) {
    throw new Error('Hasil scraping klasemen tidak valid atau kosong. Penimpaan file dibatalkan demi keamanan data.');
  }

  const outputPath = path.join(__dirname, '..', 'data', 'klasemen.json');
  writeJsonAtomic(outputPath, data);
  return data;
}
```

---

### 3.3. Perbaikan Frontend: Pencegahan XSS di Seluruh Render View

Tambahkan fungsi sanitasi teks di [`public/js/modules/utils.js`](file:///d:/MyProject/Pegadaian%20Championship/public/js/modules/utils.js):

```javascript
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

Gunakan `escapeHtml(...)` saat merender data dinamis di [`standings.js`](file:///d:/MyProject/Pegadaian%20Championship/public/js/modules/standings.js) dan [`fixtures.js`](file:///d:/MyProject/Pegadaian%20Championship/public/js/modules/fixtures.js):

```javascript
// Contoh pada standings.js
<span class="club-title">${escapeHtml(team.klub)}</span>
<img src="${encodeURI(team.logo)}" alt="${escapeHtml(team.klub)}" ...>

// Contoh pada fixtures.js
<span class="match-team-name">${escapeHtml(m.timHome)}</span>
<div class="match-stadium-name">${escapeHtml(stadiumName)}</div>
```

---

## 4. Matriks Checklist Perbaikan

- [ ] **[Penting]** Hapus default `'admin123'` di `server.js` dan gunakan `.env` untuk menyimpan `ADMIN_TOKEN`.
- [ ] **[Penting]** Hapus parsing token dari URL query string (`req.query.token` dan `window.location.search`).
- [ ] **[Penting]** Terapkan *Atomic Write* (`.tmp` + `fs.renameSync`) di semua fungsi penyimpanan data JSON.
- [ ] **[Penting]** Terapkan validasi *data guard* sebelum menimpa file data JSON yang ada.
- [ ] **[Penting]** Tambahkan modul sanitasi `escapeHtml()` pada seluruh komponen tampilan frontend.
- [ ] **[Saran]** Pasang library `express-rate-limit` untuk membatasi frekuensi percobaan verifikasi token admin.
- [ ] **[Saran]** Pasang library `helmet` pada Express untuk menambahkan HTTP security headers.
- [ ] **[Saran]** Ubah proses update jadwal 27 pekan menjadi proses asinkron latar belakang (*background job*) dengan polling status.
