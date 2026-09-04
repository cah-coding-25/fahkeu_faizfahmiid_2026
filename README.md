# FahKeu 🪙 — Aplikasi Pencatat Keuangan Pintar & Interaktif
### *Smart Personal Finance Assistant with Natural Language, In-Memory Camera OCR, and Two-Way Cloud Sync*

> **Diciptakan & Dikembangkan oleh:** **`faiz_fahmi_id`** (Faiz Fahmi Id)  
> **Tahun Rilis:** 2026  
> **Status:** Siap Produksi (Production Ready) • 100% Bebas Biaya API (Zero-Cost AI) • Privasi Terjamin (Privacy-First)

---

## 🌟 Ringkasan Produk

**FahKeu** (*Faiz Keuangan*) adalah platform asisten pencatatan dan manajemen keuangan pribadi modern yang memadukan kenyamanan percakapan alami (*chat-driven UX*), pemindaian struk belanja otomatis via kamera *in-memory* tanpa membebani penyimpanan perangkat, analitik visual interaktif, ekspor laporan PDF berstandar perbankan, serta sinkronisasi awan (*cloud sync*) dua arah dengan Google Sheets dan Bot Telegram.

Didesain secara khusus oleh **faiz_fahmi_id** untuk mengatasi rasa malas mencatat keuangan harian yang diakibatkan oleh formulir berbelit-belit pada aplikasi finansial konvensional.

---

## 🏆 Daftar Fitur-Fitur Unggulan FahKeu (Feature Showcase)

Berikut adalah rincian mendalam mengenai 10 fitur unggulan utama yang dibangun di dalam **FahKeu by faiz_fahmi_id**:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          FITUR-FITUR UNGGULAN FAHKEU                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  1. 💬 Interaktif Chat UI & Natural Language Parser (100% Client-Side NLP)      │
│  2. 📷 In-Memory Camera Scanner (Bebas Memori & Galeri Bersih)                 │
│  3. 🔍 Offline Struk OCR (Tesseract.js) & Auto-Categorization Pintar            │
│  4. 📊 Dashboard Analitik Interaktif & Grafik Tren Real-Time                    │
│  5. 📄 Generator Laporan PDF Vektor Profesional (jsPDF High-Res Engine)        │
│  6. ☁️ Sinkronisasi Dua Arah Google Sheets (Auto-Table Creation)               │
│  7. 🤖 Asisten Keuangan Bot Telegram 24/7 (Multi-Platform Webhook)             │
│  8. 🎨 3 Pilihan Tema Estetik (Light, Dark, & Luxury Gold)                      │
│  9. ⚡ Offline-First & Zero-Loss Data Persistence (PWA Ready)                   │
│  10. 📲 Portal Unduhan Multi-Platform (Android APK & Desktop via Google Drive) │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 1. 💬 Chat-Driven Interface & NLP Parser Cerdas (Tanpa Biaya API)
* **Pencatatan Secepat Mengetik Pesan:** Catat pengeluaran dan pemasukan seperti mengirim chat ke teman di WhatsApp atau Telegram.
* **100% Pemrosesan Klien (Zero-Cost AI):** Menggunakan pustaka *heuristic regex parser* karya **faiz_fahmi_id** yang berjalan langsung di browser tanpa ketergantungan API LLM berbayar (OpenAI/Gemini/Claude).
* **Fleksibilitas Satuan Mata Uang:** Mengenali berbagai variasi penulisan bahasa Indonesia:
  * Singkatan: `15k`, `50rb`, `1.5jt`, `2juta`, `25.000`, `Rp 150.000`
  * Operasi Pengeluaran: *"makan siang 25k"*, *"bensin motor 20rb"*, *"kopi janji jiwa 18k"*
  * Operasi Pemasukan: *"gaji masuk 5jt"*, *"dapat bonus 500k"*, *"terima transfer 200rb"*
  * Cek Saldo: *"saldo"*, *"sisa saldo"*, *"cek uang"*
  * Rekap Laporan: *"download rekap"*, *"unduh pdf"*, *"laporan bulanan"*
  * Manajemen Obrolan: *"hapus chat"*, *"bersihkan layar"*
* **Suggestion Chips Cepat:** Dilengkapi tombol pintas dinamis di atas kolom chat untuk mencatat transaksi umum (Kopi, Makan Siang, Bensin, Gaji) hanya dengan 1 sentuhan.

---

### 2. 📷 Pemindai Kamera Langsung In-Memory (Zero Storage Burden)
* **Kamera Terintegrasi (*In-App Viewport*):** Mengakses perangkat keras kamera secara langsung melalui HTML5 `navigator.mediaDevices.getUserMedia` tanpa perlu membuka aplikasi kamera eksternal ponsel.
* **Hemat Memori HP (Zero Storage Overhead):** Citra foto struk belanja diproses langsung di memori RAM peramban (*HTML5 Canvas Bitmap*) dan langsung diekstraksi. **Foto tidak disimpan di memori internal/galeri perangkat**, menjaga galeri ponsel pengguna tetap bersih dan tidak penuh oleh tumpukan foto struk bekas.
* **Dukungan Kamera Depan & Belakang:** Tombol peralihan kamera (*camera flip*) instan antara lensa belakang (*environment*) dan depan (*user*), serta pengaman izin akses (*permission recovery*).

---

### 3. 🔍 Offline Struk OCR (Tesseract.js) & Auto-Categorization
* **Pengenalan Karakter Optik di Sisi Klien:** Membaca teks nota/struk belanja secara offline menggunakan *WebAssembly worker* Tesseract.js tanpa mengirim data sensitif belanjaan pengguna ke server asing.
* **Algoritma Ekstraksi Nominal Pintar:**
  * Memfilter deretan tanggal, nomor nota/faktur, dan nomor kasir agar tidak salah terdeteksi sebagai harga.
  * Mengisolasi kata kunci penentu seperti `TOTAL`, `GRAND TOTAL`, `JUMLAH`, `SUBTOTAL`, `TUNAI`, `BAYAR`.
* **Deteksi Otomatis 8 Kategori Finansial:**
  * 🍔 **Makanan & Minuman:** Resto, Bakso, Kopi, Mie, Nasi, Cafe, Teh, Warung.
  * 🚗 **Transportasi:** Bensin, Pertamina, Shell, Parkir, Tol, Gojek, Grab.
  * 💡 **Tagihan & Utilitas:** PLN, Token, Listrik, PDAM, Pulsa, Kuota, WiFi, Internet.
  * 🛍️ **Belanja & Pribadi:** Indomaret, Alfamart, Supermarket, Mall, Pakaian.
  * 🎬 **Hiburan & Liburan:** Bioskop, Game, Liburan, Netflix, Spotify.
  * 💊 **Kesehatan:** Apotek, Obat, Klinik, Dokter, Rumah Sakit.
  * 🎓 **Pendidikan & Kerja:** Kursus, Buku, Kuliah, Alat Tulis, Kantor.
  * 📦 **Lain-lain:** Kategori fleksibel untuk pengeluaran khusus lainnya.

---

### 4. 📊 Dashboard Analitik Interaktif & Visualisasi Multi-Dimensi
* **Metrik Utama (KPI Cards):**
  * Sisa Saldo Kumulatif (*Total Balance*)
  * Total Pemasukan (*Total Income*)
  * Total Pengeluaran (*Total Expense*)
  * Persentase Arus Kas (*Savings Ratio*)
* **Grafik Tren Arus Kas Dinamis (Recharts):** Visualisasi grafik area/batang yang responsif menampilkan fluktuasi harian dan mingguan pemasukan vs pengeluaran.
* **Diagram Donat Distribusi Pengeluaran:** Memecah porsi pengeluaran berdasarkan 8 kategori dengan kode warna modern untuk mempermudah evaluasi anggaran (*budget evaluation*).
* **Filter Rentang Waktu Komprehensif:** Pilihan filter 1-klik untuk **Semua**, **Minggu Ini (7 Hari Terakhir)**, **Bulan Ini (30 Hari Terakhir)**, dan **Tahun Ini**.
* **Manajemen Transaksi Lengkap:** Tabel riwayat mutasi dengan pencarian kata kunci, pengurutan, pengeditan modal instan, dan penghapusan transaksi dengan konfirmasi aman.

---

### 5. 📄 Generator Laporan PDF Vektor Profesional (jsPDF High-Res)
* **Desain Eksklusif Standar Perbankan:** Dokumen berukuran A4 yang dirancang secara matematis menggunakan *vector graphics rendering* murni (garis tajam, tipografi Helvetica terukur, dan palet warna korporat).
* **Fitur Dokumen PDF Otomatis:**
  * Header Laporan Resmi & Tanggal Cetak Waktu Nyata (WIB).
  * Kartu Ringkasan Keuangan (Saldo Akhir, Total Pemasukan, Total Pengeluaran).
  * Tabel Rincian Transaksi Lengkap (Nomor, Waktu, Jenis Arus, Kategori, Deskripsi, Nominal).
  * *Dynamic Multi-Page Overflow Handler:* Otomatis membagi halaman baru jika transaksi melebihi 1 halaman, lengkap dengan pengulangan header tabel di tiap halaman.
  * Footer Penomoran Otomatis (*"Halaman X dari Y"*).
  * Tanda Tangan Lisensi Otomatis: **`Laporan Keuangan Otomatis FahKeu — by Faiz_Fahmi_Id since 2026`**.

---

### 6. ☁️ Sinkronisasi Dua Arah Google Sheets (Auto-Table Creation)
* **Spreadsheet sebagai Database Mandiri:** Data tersimpan aman di akun Google Drive pribadi pengguna sendiri tanpa risiko kebocoran data.
* **Otomasi Pembuatan Kolom:** Pengguna **tidak perlu membuat format tabel manual**. Saat pertama kali dihubungkan, Google Apps Script (`Code.gs`) otomatis membuat tab sheet `"Transactions"` lengkap dengan styling header dan format angka nominal (`#,##0`).
* **Konektivitas Tahan Banting (Anti-CORS):**
  * Protokol utama: `POST` payload `text/plain` tanpa preflight CORS.
  * Protokol cadangan (*Auto-Fallback*): `GET` query string otomatis aktif jika koneksi jaringan klien mengalami blokir browser.
* **Fungsi Pengujian Mandiri (`testSheet`):** Disediakan tombol uji koneksi langsung di editor Google Apps Script yang aman dari error `parameter undefined`.

---

### 7. 🤖 Asisten Keuangan Bot Telegram 24/7 (Multi-Platform Webhook)
* **Catat Keuangan saat Mobilitas Tinggi:** Cukup buka Telegram dari smartphone atau smartwatch Anda dan ketik pengeluaran secara langsung.
* **Kamera Telegram OCR:** Kirim foto struk belanja langsung ke ruang obrolan Telegram. Bot akan memproses OCR dan mencatat transaksi ke Google Sheets secara otomatis.
* **Perintah Cepat Telegram:**
  * `/start` atau `help` — Panduan lengkap penggunaan bot.
  * `sisa saldo` — Cek total tabungan & mutasi saat ini.
  * `download rekap` — Bot mengirimkan tautan unduhan rekap PDF langsung ke obrolan Telegram.
* **Pendaftaran Webhook 1-Klik:** Tombol pendaftaran webhook otomatis di panel Pengaturan FahKeu tanpa perlu menulis curl manual.

---

### 8. 🎨 3 Pilihan Tema Estetik Modern
* ☀️ **Light Mode (Mode Bersih & Segar):** Desain bernuansa slate-putih yang nyaman di bawah sinar matahari dengan rasio kontras tinggi standar WCAG AA.
* 🌙 **Dark Mode (Mode Malam Elegan):** Latar belakang *deep slate* (`#0f172a` / `#020617`) yang ramah mata dan menghemat konsumsi baterai layar OLED/AMOLED.
* 👑 **Luxury Gold (Tema Eksklusif Sultan):** Perpaduan mewah antara latar gelap pekat dan aksen emas berkilau (*amber-400 / gold*), memberikan sensasi premium kelas atas bagi pengguna setia FahKeu.

---

### 9. ⚡ Offline-First & Zero-Loss Data Persistence
* **Bekerja Tanpa Sinyal:** Seluruh data transaksi dan percakapan disimpan secara instan di `localStorage` peramban.
* **Antrean Aksi Offline (*Offline Queue*):** Jika transaksi dicatat saat internet terputus, mutasi disimpan di antrean lokal dan otomatis disinkronkan ke Google Sheets ketika jaringan internet terhubung kembali.
* **PWA Installable:** Dapat diinstal ke layar utama (*Add to Home Screen*) pada Android, iPhone (iOS), macOS, dan Windows layaknya aplikasi *native*.

---

### 10. 📲 Portal Unduhan Multi-Platform (Android APK & Desktop)
* **Pusat Distribusi Mandiri:** Kartu unduhan terintegrasi di tab Pengaturan yang memungkinkan pemilik aplikasi membagikan berkas APK Android dan Installer Desktop (Windows/Mac) langsung melalui tautan Google Drive pribadi.
* **Mudah Dikonfigurasi:** Tautan unduhan dapat diperbarui kapan saja hanya dengan mengubah variabel di bagian atas file `SettingsPanel.tsx`.

---

## 🏛️ Arsitektur Sistem & Aliran Data

Berikut adalah diagram alur integrasi menyeluruh aplikasi **FahKeu**:

```
                                    ┌────────────────────────────────────┐
                                    │          PENGGUNA / USER           │
                                    └──────────────┬─────────────────────┘
                                                   │
                         ┌─────────────────────────┴─────────────────────────┐
                         ▼                                                   ▼
         ┌───────────────────────────────┐                   ┌───────────────────────────────┐
         │     APLIKASI WEB FAHKEU       │                   │         BOT TELEGRAM          │
         │  (React 19 + Tailwind CSS)    │                   │   (@YourPersonalFinanceBot)   │
         └───────────────┬───────────────┘                   └───────────────┬───────────────┘
                         │                                                   │
          ┌──────────────┴──────────────┐                                    │
          ▼                             ▼                                    │
 ┌─────────────────┐           ┌─────────────────┐                           │
 │ Local NLP Engine│           │ In-Memory OCR   │                           │
 │ (Bebas Biaya)   │           │ (Tesseract.js)  │                           │
 └────────┬────────┘           └────────┬────────┘                           │
          │                             │                                    │
          └──────────────┬──────────────┘                                    │
                         ▼                                                   │
           ┌───────────────────────────┐                                     │
           │  Penyimpanan Lokal Klien  │                                     │
           │  (Browser LocalStorage)   │                                     │
           └─────────────┬─────────────┘                                     │
                         │ (Sinkronisasi Otomatis)                           │
                         ▼                                                   │
         ┌────────────────────────────────────────────────────────┐          │
         │              GOOGLE APPS SCRIPT (Code.gs)              │◄─────────┘
         │      (Web App Endpoint & Webhook Serverless)           │
         └───────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
         ┌────────────────────────────────────────────────────────┐
         │               GOOGLE SPREADSHEET PRIBADI               │
         │       (Database Sheet: 'Transactions' Auto-Created)    │
         └────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

| Lapisan | Teknologi yang Digunakan | Penjelasan |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript | Komponen modular dengan pengetikan statis ketat (*type safety*). |
| **Styling & Theme** | Tailwind CSS v4 | Antarmuka adaptif, responsive mobile-first, dan transisi mulus. |
| **Ikonografi** | Lucide React | Koleksi ikon vektor modern dan konsisten. |
| **Mesin Grafik / Charts** | Recharts & Lucide | Diagram area finansial responsif dan donat distribusi kategori. |
| **Offline OCR Scanner** | Tesseract.js (WASM) | Ekstraksi teks nota langsung di memori browser tanpa server. |
| **Mesin Laporan PDF** | jsPDF | Pembuatan dokumen vektor A4 resolusi tinggi di peramban. |
| **Database Cloud** | Google Sheets + Google Apps Script | Penyimpanan basis data cloud gratis, aman, dan dapat diakses mandiri. |
| **Integrasi Chatbot** | Telegram Bot API | Notifikasi dan pencatatan transaksi dua arah via pesan Telegram. |
| **Bundler & Tooling** | Vite + ESBuild | Kompilasi ultra-cepat dengan arsitektur SPA modern. |

---

## 📁 Struktur Direktori Proyek

```bash
fahkeu/
├── public/                      # Aset publik statis (favicon, manifest)
├── src/
│   ├── components/              # Komponen antarmuka pengguna (UI)
│   │   ├── ChatInterface.tsx    # Antarmuka ruang obrolan cerdas & suggestion chips
│   │   ├── Dashboard.tsx        # Dasbor metrik, grafik recharts, & riwayat mutasi
│   │   ├── ReceiptScanner.tsx   # Pemindai kamera in-memory & penampil hasil OCR
│   │   └── SettingsPanel.tsx    # Konfigurasi Google Sheets, Telegram, & unduhan APK
│   ├── utils/                   # Pustaka logika, parser, & generator
│   │   ├── code.gs.ts           # Skrip Google Apps Script terpusat & siap salin
│   │   ├── nlpParser.ts         # Mesin parser regex bahasa Indonesia alami
│   │   ├── ocrService.ts        # Algoritma ekstraksi teks struk belanjaan
│   │   └── pdfGenerator.ts      # Mesin perender PDF vektor profesional
│   ├── App.tsx                  # Komponen induk, state global, & pengelola tema
│   ├── index.css                # Konfigurasi global Tailwind CSS
│   ├── main.tsx                 # Titik masuk utama aplikasi React
│   └── types.ts                 # Skema data & antarmuka TypeScript lengkap
├── index.html                   # Entry point dokumen HTML dengan meta SEO
├── package.json                 # Daftar dependensi dan skrip proyek
├── tsconfig.json                # Konfigurasi kompilator TypeScript
└── README.md                    # Dokumentasi lengkap & spesifikasi produk
```

---

## 🚀 Panduan Memulai Cepat (Quickstart)

### 1. Prasyarat Sistem
Pastikan perangkat Anda telah terpasang:
* **Node.js:** Versi 18.0.0 atau lebih baru.
* **npm:** Versi 9.0.0 atau lebih baru (atau pnpm / yarn).

### 2. Pemasangan Dependensi & Menjalankan Lokal
```bash
# 1. Pasang semua dependensi
npm install

# 2. Jalankan server pengembangan lokal
npm run dev
```
Buka peramban di `http://localhost:3000` untuk mulai menggunakan aplikasi FahKeu.

### 3. Kompilasi Produksi (Production Build)
```bash
npm run build
```
Hasil berkas produksi siap diunggah ke Vercel, Netlify, Cloudflare Pages, atau server Nginx melalui folder `/dist`.

---

## 📖 Panduan Menghubungkan Google Spreadsheet & Apps Script

Aplikasi FahKeu menggunakan Google Spreadsheet milik Anda sendiri sebagai database. Ikuti langkah 1 menit berikut:

1. Buka [Google Sheets](https://sheets.new) dan buat lembar kerja baru.
2. Klik menu **Ekstensi > Apps Script**.
3. Di dalam editor `Code.gs`, hapus semua kode bawaan (tekan **`Ctrl + A`** lalu **`Backspace`** sampai bersih).
4. Buka tab **Pengaturan** di aplikasi FahKeu, klik tombol **"Salin Kode"** pada kotak kode Apps Script di sebelah kanan.
5. Tempelkan (**`Ctrl + V`**) ke editor `Code.gs`, lalu klik tombol **Simpan 💾 (`Ctrl + S`)**.
6. Klik tombol **Terapkan > Penerapan Baru** (Deploy > New Deployment).
7. Klik ikon gerigi (Pilih Jenis), pilih **Aplikasi Web** (Web App).
   * *Jalankan sebagai:* **Saya** (Email Google Anda)
   * *Yang memiliki akses:* **Siapa saja** (Anyone)
8. Klik **Terapkan** (Deploy). Izinkan akses keamanan akun Google Anda.
9. Salin **URL Aplikasi Web** yang berakhiran `/exec`, lalu masukkan ke kolom **"URL Web App Google Apps Script"** di menu Pengaturan FahKeu, lalu klik **Simpan Konfigurasi**.
10. Selesai! Seluruh pencatatan keuangan Anda sekarang otomatis tersinkronisasi ke Google Spreadsheet.

---

## 🤖 Panduan Menghubungkan Bot Telegram

1. Buka aplikasi Telegram, cari akun resmi **@BotFather**.
2. Kirim perintah `/newbot`, lalu ikuti petunjuk untuk menentukan nama dan username bot Anda.
3. BotFather akan memberikan sebuah **Bot Token** (contoh: `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`).
4. Masuk ke tab **Pengaturan** di FahKeu:
   * Masukkan **Bot Token** tersebut ke kolom yang disediakan.
   * Pastikan URL Google Apps Script Anda sudah terisi dan tersimpan.
   * Klik tombol **"Daftarkan Webhook Bot"**.
5. Buka bot Telegram Anda, kirim pesan `/start`.
6. Sekarang Anda dapat mencatat keuangan langsung dari chat Telegram kapan pun dan di mana pun!

---

## 💬 Format Contoh Perintah Chat FahKeu

| Tujuan | Contoh Pesan yang Bisa Diketik | Kategori Otomatis |
|---|---|---|
| **Catat Pengeluaran** | `beli kopi kenangan 24k` | Makanan & Minuman |
| **Catat Pengeluaran** | `makan nasi padang 18rb` | Makanan & Minuman |
| **Catat Pengeluaran** | `isi bensin motor 25000` | Transportasi |
| **Catat Pengeluaran** | `bayar token listrik pln 100k` | Tagihan & Utilitas |
| **Catat Pengeluaran** | `belanja indomaret sabun odol 45k` | Belanja & Pribadi |
| **Catat Pengeluaran** | `nonton bioskop xxi 50rb` | Hiburan & Liburan |
| **Catat Pengeluaran** | `beli obat panadol di apotek 15k` | Kesehatan |
| **Catat Pemasukan** | `gaji bulanan kantor 6jt` | Gaji & Pemasukan |
| **Catat Pemasukan** | `dapat transferan bonus 750k` | Bonus & Freelance |
| **Cek Keuangan** | `sisa saldo` / `cek saldo` / `saldo` | Menampilkan Saldo & Mutasi |
| **Unduh Laporan** | `download rekap` / `unduh pdf` | Membuat Berkas PDF Otomatis |
| **Bersihkan Layar** | `hapus chat` / `bersihkan chat` | Mengosongkan Riwayat Obrolan |

---

## 🛡️ Penanganan Error & FAQ (Troubleshooting)

### Q: Mengapa muncul error `SyntaxError: Unexpected identifier 'doc'` di Apps Script?
> **Solusi:** Error ini terjadi jika masih terdapat sisa potongan kode lama di file `Code.gs` Anda. Buka file `Code.gs` di Google Apps Script, tekan **`Ctrl + A`** lalu tekan tombol **`Backspace/Delete`** pada keyboard sampai editor benar-benar kosong bersih. Setelah itu, tempelkan kode baru dari FahKeu dan klik Simpan 💾.

### Q: Mengapa muncul error `TypeError: Cannot read properties of undefined (reading 'parameter')` saat klik "Jalankan"?
> **Solusi:** Fungsi `doGet` dan `doPost` hanya bekerja saat dipanggil oleh aplikasi web via internet, bukan saat diklik manual. Jika ingin mencoba langsung di Apps Script, pilih fungsi **`testSheet`** pada menu dropdown fungsi di samping tombol "Jalankan", lalu klik "Jalankan".

### Q: Apakah data keuangan saya aman?
> **100% Aman.** FahKeu tidak menyimpan data keuangan Anda di server pihak ketiga. Semua data tersimpan di `localStorage` peramban Anda sendiri dan di Google Spreadsheet pribadi akun Google Anda.

---

## 👨‍💻 Hak Cipta & Lisensi

* **Aplikasi:** FahKeu (Pencatat Keuangan Pintar & Interaktif)
* **Karya Asli & Dikembangkan oleh:** **`faiz_fahmi_id`** (Faiz Fahmi Id)
* **Tahun Pembuatan:** 2026
* **Lisensi:** MIT License — Terbuka untuk digunakan, dipelajari, dan dikembangkan secara bebas dengan tetap menyertakan atribusi pengembang asli.

---

<div align="center">
  <b>FahKeu — Dibuat dengan penuh dedikasi oleh faiz_fahmi_id © 2026</b><br/>
  <i>Mencatat Keuangan Jadi Semudah Mengirim Pesan Chat.</i>
</div>
