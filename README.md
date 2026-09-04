# FahKeu 🪙 — Product Requirement Document (PRD) & Blueprint Spesifikasi Lengkap

> **Dokumen Spesifikasi Teknis & Kebutuhan Produk (PRD) Komprehensif**  
> *Panduan referensi 100% lengkap untuk merekonstruksi, mengembangkan, dan memelihara aplikasi **FahKeu** secara identik dari nol.*

---

## 📑 Daftar Isi
1. [Ringkasan Eksekutif & Visi Produk](#1-ringkasan-eksekutif--visi-produk)
2. [Persona Pengguna & Skenario Penggunaan](#2-persona-pengguna--skenario-penggunaan)
3. [Arsitektur Sistem & Alur Data](#3-arsitektur-sistem--alur-data)
4. [Struktur Data & Skema TypeScript](#4-struktur-data--skema-typescript)
5. [Spesifikasi Fitur Utama (Deep Dive)](#5-spesifikasi-fitur-utama-deep-dive)
   - [5.1 Antarmuka Chat & Local NLP Parser](#51-antarmuka-chat--local-nlp-parser)
   - [5.2 Pemindai Kamera Langsung (In-Memory MediaDevices)](#52-pemindai-kamera-langsung-in-memory-mediadevices)
   - [5.3 Mesin Offline OCR (Tesseract.js) & Heuristik Struk](#53-mesin-offline-ocr-tesseractjs--heuristik-struk)
   - [5.4 Dasbor Analisis Keuangan & Visualisasi Interaktif](#54-dasbor-analisis-keuangan--visualisasi-interaktif)
   - [5.5 Generator Laporan PDF Profesional (jsPDF Vector Engine)](#55-generator-laporan-pdf-profesional-jspdf-vector-engine)
   - [5.6 Integrasi Google Sheets & Backend Google Apps Script](#56-integrasi-google-sheets--backend-google-apps-script)
   - [5.7 Integrasi Asisten Bot Telegram](#57-integrasi-asisten-bot-telegram)
   - [5.8 Fitur Unduh Aplikasi (Android & Desktop via Google Drive)](#58-fitur-unduh-aplikasi-android--desktop-via-google-drive)
6. [Spesifikasi Desain & Antarmuka Pengguna (UI/UX)](#6-spesifikasi-desain--antarmuka-pengguna-uiux)
7. [Panduan Rekonstruksi Langkah-demi-Langkah (Build 100% Identik)](#7-panduan-rekonstruksi-langkah-demi-langkah-build-100-identik)
8. [Matriks Penanganan Error & Kasus Tepi (Edge Cases)](#8-matriks-penanganan-error--kasus-tepi-edge-cases)
9. [Panduan Deployment & Konfigurasi Lingkungan](#9-panduan-deployment--konfigurasi-lingkungan)
10. [Panduan Pengaturan Tautan Google Drive & Modifikasi di GitHub](#10-panduan-pengaturan-tautan-google-drive--modifikasi-di-github)
    - [10.1 Cara Memasukkan Link Google Drive Sendiri (Android & Desktop)](#101-cara-memasukkan-link-google-drive-sendiri-android--desktop)
    - [10.2 Cara Menghapus Kartu Unduh Jika Tidak Diinginkan di Website](#102-cara-menghapus-kartu-unduh-jika-tidak-diinginkan-di-website)

---

## 1. Ringkasan Eksekutif & Visi Produk

### 1.1 Latar Belakang & Masalah
Sebagian besar aplikasi pencatat keuangan konvensional mengharuskan pengguna mengisi formulir multi-langkah yang rumit (memilih tanggal, memilih dropdown kategori yang panjang, mengisi kolom jumlah, dan mengetik keterangan). Gesekan (*friction*) ini menyebabkan pengguna malas mencatat pengeluaran harian mereka. Selain itu, banyak aplikasi bergantung pada API AI berbayar atau server pihak ketiga yang mengorbankan privasi data finansial pengguna.

### 1.2 Solusi FahKeu
**FahKeu** menghadirkan pengalaman pencatatan keuangan berkecepatan tinggi melalui antarmuka percakapan interaktif (*Chat UI*) bergaya aplikasi pesan instan (WhatsApp/Telegram/Instagram). FahKeu memproses bahasa alami Bahasa Indonesia secara instan langsung di peramban (*client-side NLP*) tanpa biaya API, memungkinkan pemindaian struk berbasis kamera in-memory tanpa membebani penyimpanan perangkat, serta menyediakan analitik visual, ekspor PDF kustom, dan sinkronisasi opsional ke Google Sheets & Bot Telegram.

### 1.3 Prinsip Utama Desain Sistem
1. **Zero-Cost & Privacy-First:** 100% fungsi inti (NLP parser, OCR, kalkulasi analitik, dan generator PDF) berjalan sepenuhnya di peramban klien tanpa wajib langganan backend atau API AI berbayar.
2. **Kamera In-Memory (Storage-Saving):** Pemotretan struk diproses di memori RAM dan langsung diubah menjadi transaksi tanpa disimpan di galeri file ponsel.
3. **Dual-Platform Access:** Sinkronisasi dua arah (*two-way sync*) ke Google Sheets dan Bot Telegram pribadi pengguna.
4. **Resilience (Offline-First):** Tetap berfungsi optimal saat jaringan internet terputus menggunakan `localStorage` dan antrean aksi offline (*offline action queue*).

---

## 2. Persona Pengguna & Skenario Penggunaan

| Persona | Kebutuhan Utama | Fitur FahKeu yang Digunakan |
|---|---|---|
| **Mahasiswa / Freelancer** | Mencatat jajan harian, bensin, dan uang makan secara cepat tanpa repot membuka formulir. | Chat NLP (*"bakso 15k"*, *"kopi 20rb"*), Suggestion Chips, Ringkasan Saldo Cepat. |
| **Ibu Rumah Tangga / Pengelola Belanja** | Merekam tumpukan struk belanja bulanan dari supermarket/minimarket. | In-App Camera OCR Scanner, Auto Categorization, Rekap Bulanan PDF. |
| **Pengguna Telegram Aktif** | Mencatat transaksi saat bepergian langsung dari aplikasi Telegram tanpa membuka browser. | Integrasi Bot Telegram via Webhook Google Apps Script. |
| **Pecinta Spreadsheet** | Ingin data keuangannya tersimpan rapi di Google Sheets untuk backup dan analisis lanjutan. | Google Sheets Cloud Sync & Ekspor PDF Otomatis. |

---

## 3. Arsitektur Sistem & Alur Data

```
               ┌────────────────────────────────────────────────────────┐
               │                     KLIEN / BROWSER                    │
               │  (React 19 + TypeScript + Vite + Tailwind CSS + PWA)  │
               └───────────┬────────────────────────────────┬───────────┘
                           │                                │
            ┌──────────────┴──────────────┐  ┌──────────────┴──────────────┐
            ▼                             ▼  ▼                             ▼
   ┌─────────────────┐           ┌─────────────────┐              ┌─────────────────┐
   │ Local NLP Parser│           │ Tesseract.js    │              │ jsPDF Generator │
   │ (Regex + Suffix)│           │ (In-Memory OCR) │              │ (Vector Engine) │
   └────────┬────────┘           └────────┬────────┘              └────────┬────────┘
            │                             │                                │
            └──────────────┬──────────────┘                                │
                           ▼                                               │
             ┌───────────────────────────┐                                 │
             │   State & LocalStorage    │◄────────────────────────────────┘
             │ (Transactions & Messages) │
             └─────────────┬─────────────┘
                           │ (Jika Cloud Storage Aktif)
                           ▼
          ┌───────────────────────────────────┐
          │     Google Apps Script Webhook    │
          │             (Code.gs)             │
          └─────────┬───────────────┬─────────┘
                    │               │
                    ▼               ▼
          ┌───────────────────┐   ┌──────────────────────────┐
          │   Google Sheets   │   │ Telegram Bot API Webhook │
          │ (Database Utama)  │   │  (Catat via Telegram)    │
          └───────────────────┘   └──────────────────────────┘
```

---

## 4. Struktur Data & Skema TypeScript

Semua tipe data global didefinisikan secara modular di `/src/types.ts`:

```typescript
// 1. Skema Transaksi Finansial
export interface Transaction {
  id: string;                      // Format: 'tx_' + timestamp + '_' + randomString
  date: string;                    // ISO 8601 String (e.g. '2026-06-28T14:20:00.000Z')
  type: 'pemasukan' | 'pengeluaran';
  amount: number;                  // Integer positif (e.g. 150000)
  description: string;             // Nama transaksi (e.g. 'Beli Bakso Urat')
  category: string;                // Kategori resmi (e.g. 'Makanan & Minuman')
  source: 'web' | 'telegram';      // Asal pencatatan transaksi
}

// 2. Skema Pesan Chat Interaktif
export interface Message {
  id: string;                      // Format: 'msg_' + timestamp
  sender: 'user' | 'bot';
  text: string;                    // Teks konten pesan (dukung format Markdown sederhana)
  timestamp: string;               // Jam:Menit (e.g. '14:25')
  parsedTransaction?: {            // Metadata transaksi jika pesan memicu pencatatan
    type: 'pemasukan' | 'pengeluaran';
    amount: number;
    description: string;
    category: string;
    feedback: string;
    balanceAfter: number;
  };
  isPdfSelector?: boolean;         // Menampilkan selector unduh PDF langsung di chat
  pdfDownloadUrl?: string;
  pdfPeriod?: string;
}

// 3. Konfigurasi Pengaturan & Sinkronisasi
export interface AppSettings {
  googleSheetUrl: string;          // Google Apps Script Web App Deployment URL
  telegramBotToken: string;        // Token HTTP BotFather Telegram
  telegramChatId: string;          // ID Obrolan / User ID Telegram Pengguna
  useCloudStorage: boolean;        // Saklar aktivasi sinkronisasi cloud
}

// 4. Antrean Aksi Offline (Queue)
export interface OfflineAction {
  id: string;
  action: 'add' | 'delete' | 'clear';
  transaction?: Transaction;
  transactionId?: string;
}

// 5. Konfigurasi Kategori & Palet Warna
export interface CategoryConfig {
  name: string;
  color: string;                   // Kode warna HEX (e.g. '#10b981')
  keywords: string[];              // Kata kunci pemicu pencocokan otomatis
  icon: string;                    // Nama komponen icon Lucide-React
}
```

---

## 5. Spesifikasi Fitur Utama (Deep Dive)

### 5.1 Antarmuka Chat & Local NLP Parser

#### Algoritma Pemrosesan Bahasa Alami (`/src/utils/parser.ts`)
Parser mengeksekusi 4 tahapan pencocokan berurutan:

1. **Deteksi Tipe Transaksi (`type`):**
   - **Prefix Sign:** Teks berawalan `+` otomatis `pemasukan`, berawalan `-` otomatis `pengeluaran`.
   - **Kata Kunci Pemasukan:** `gaji`, `masuk`, `terima`, `pemasukan`, `transfer`, `freelance`, `sampingan`, `bonus`, `untung`, `dapat`, `cuan`, `laba`, `plus`.
   - **Kata Kunci Pengeluaran:** `pengeluaran`, `beli`, `bayar`, `untuk`, `makan`, `bakso`, `kopi`, `bensin`, `pulsa`, `listrik`, `belanja`, `jajan`, `ongkir`, `kos`, `tiket`, `keluar`, `minum`, `gojek`, `grab`, `shopee`, `tokopedia`, `minus`.
   - **Resolusi Konflik:** Jika kedua tipe kata kunci ada dalam satu kalimat, posisi kata kunci pertama yang muncul menentukan tipe.

2. **Ekstraksi Nominal & Akhiran Suffix:**
   - **Regex Pattern:** `/(?:rp\.?\s*)?(\d+[\d.,]*)\s*(juta|miliar|jt|ribu|rb|k|m|r)?\b/gi`
   - **Aturan Konversi Suffix:**
     - `k`, `rb`, `ribu`, `r` $\rightarrow \times 1.000$
     - `jt`, `juta`, `m` $\rightarrow \times 1.000.000$
     - `miliar` $\rightarrow \times 1.000.000.000$
   - **Penanganan Desimal & Pemisah Ribuan Indonesia:**
     - Nilai ber-suffix seperti `1.5jt` atau `2,5k` diubah titik/komanya menjadi desimal numerik ($1.5 \times 1.000.000 = 1.500.000$).
     - Nilai tanpa suffix: jika memiliki lebih dari 1 tanda titik (misal `1.000.000`) atau format ribuan standar, seluruh titik dihilangkan.

3. **Pembersihan Deskripsi (`description`):**
   - Angka nominal, simbol uang, serta kata kunci tipe transaksi dihapus dari kalimat mentah.
   - Karakter sisa dibersihkan dari spasi ganda dan dikapitalisasi dengan rapi.

4. **Klasifikasi Kategori Otomatis (`category`):**
   - Mencocokkan kata kunci deskripsi terhadap 9 kategori standar:
     1. *Makanan & Minuman* (makan, minum, nasi, kopi, cafe, resto, bakso, martabak, indomaret, dll.)
     2. *Transportasi* (bensin, pertalite, pertamax, gojek, grab, tarif, parkir, kereta, busway, toll)
     3. *Belanja & Pribadi* (baju, pakaian, sepatu, celana, skin care, shopee, lazada, tokopedia, mall)
     4. *Tagihan & Utilitas* (listrik, pln, pdam, air, wifi, indihome, kuota, pulsa, kosan, kontrakan)
     5. *Gaji & Pendapatan Tetap* (gaji, salary, honor, thr, upah, bulanan)
     6. *Freelance & Sampingan* (proyek, project, freelance, client, komisi, dividen, royalti)
     7. *Kesehatan & Medis* (obat, apotek, dokter, rumah sakit, klinik, vitamin, periksa)
     8. *Hiburan & Liburan* (bioskop, tiket, bioskop, nonton, netflix, spotify, game, staycation)
     9. *Lain-lain* (Kategori *fallback* default)

---

### 5.2 Pemindai Kamera Langsung (In-Memory MediaDevices)

#### Fitur & Arsitektur
- **In-Memory Capture:** Tidak menggunakan `<input type="file" capture>` default browser yang memaksa sistem operasi menyimpan foto ke galeri perangkat.
- **Kamera Kustom Berbasis `navigator.mediaDevices.getUserMedia`:**
  - Mengalirkan *live stream* video beresolusi optimal ($1280 \times 720$).
  - Menyediakan tombol pembalik kamera (*Camera Flip Toggle*): beralih antara `environment` (kamera belakang) dan `user` (kamera depan).
  - Dilengkapi *Framing Overlay Box* berpemandu sudut hijau dengan rasio struk proporsional.
  - Saat tombol *shutter* ditekan, frame aktif dirender ke elemen `<canvas>`, dikonversi menjadi `Blob` format JPEG kualitas 0.85, lalu langsung dioperasikan sebagai objek `File` sementara di memori RAM.
  - Setelah pemindaian selesai, stream kamera dihentikan (`track.stop()`), menjamin **zero-footprint** pada memori penyimpanan fisik perangkat.

---

### 5.3 Mesin Offline OCR (Tesseract.js) & Heuristik Struk

1. **Inisialisasi Worker Tesseract.js:**
   - Memanfaatkan library `tesseract.js` yang dikompilasi ke WebAssembly.
   - Menjalankan pengenalan teks bahasa Indonesia (`ind`) dan Inggris (`eng`) secara offline.
   - Memberikan indikator progres pengenalan teks secara real-time ($0\% - 100\%$).

2. **Mesin Heuristik Struk (`/src/utils/receiptParser.ts`):**
   - **Pencarian Total:** Mencari baris teks yang memuat kata kunci: `TOTAL`, `GRAND TOTAL`, `JUMLAH`, `TAGIHAN`, `BAYAR`, `TUNAI`, `CASH`, `NETTO`.
   - **Filter Validitas Nominal:** Mengabaikan angka kembalian (*Change / Kembali*), nomor telepon kasir, atau nomor seri invoice struk.
   - **Pencarian Nama Toko/Deskripsi:** Mengambil baris teratas struk sebagai nama merchant/toko (misal: *"INDOMARET"*, *"ALFAMART"*, *"SUPERINDO"*).

3. **Dialog Konfirmasi Interaktif:**
   - Hasil deteksi OCR (Nominal, Deskripsi, Kategori) ditampilkan dalam kartu konfirmasi sebelum dimasukkan ke dalam buku kas, memungkinkan pengguna mengoreksi kesalahan baca secara manual.

---

### 5.4 Dasbor Analisis Keuangan & Visualisasi Interaktif

#### 1. Kartu Metrik Ringkasan (Summary Cards)
- **Total Pemasukan:** Akumulasi seluruh nominal bertipe `pemasukan` pada periode terpilih.
- **Total Pengeluaran:** Akumulasi seluruh nominal bertipe `pengeluaran` pada periode terpilih.
- **Saldo Bersih (Net Cash Flow):** Total Pemasukan dikurangi Total Pengeluaran.
- **Rasio Tabungan / Cashflow:** Persentase efisiensi tabungan $\left(\frac{\text{Pemasukan} - \text{Pengeluaran}}{\text{Pemasukan}} \times 100\%\right)$.

#### 2. Visualisasi Grafik Recharts (D3-Powered)
- **Grafik Garis Tren Saldo Harian (`LineChart`):** Menampilkan pergerakan saldo kumulatif harian dengan kurva halus (*Monotone*), titik data interaktif, dan *Custom Glassmorphism Tooltip*.
- **Grafik Donat Kontribusi Kategori (`PieChart`):** Memetakan distribusi pengeluaran per kategori dengan palet warna dinamis, label persentase, dan *hover effect*.

#### 3. Filter Rentang Waktu Komprehensif
- **Hari Ini (`today`):** Transaksi pada tanggal berjalan.
- **7 Hari Terakhir (`7days`):** Transaksi dalam 7 hari terakhir.
- **Bulan Ini (`month`):** Transaksi sejak tanggal 1 pada bulan berjalan.
- **Tahun Ini (`year`):** Transaksi dari 1 Januari pada tahun berjalan.
- **Rentang Kustom (`custom`):** Pemilihan tanggal awal (*Start Date*) dan tanggal akhir (*End Date*) secara bebas.

#### 4. Buku Kas & Manajemen Transaksi
- Pencarian cerdas berbasis teks (pencocokan nama & kategori).
- Filter khusus: Semua, Hanya Pemasukan, Hanya Pengeluaran.
- Pengurutan dinamis berdasarkan tanggal terbaru atau nominal terbesar.
- Opsi penghapusan transaksi satuan serta pengosongan seluruh data dengan modal konfirmasi keamanan ganda.

---

### 5.5 Generator Laporan PDF Profesional (jsPDF Vector Engine)

File generator `/src/utils/pdfGenerator.ts` mengimplementasikan pembuatan dokumen PDF berstandar akuntansi:

1. **Geometri & Tata Letak:**
   - Ukuran kertas A4 ($210\text{ mm} \times 297\text{ mm}$) dengan margin seimbang $14\text{ mm}$.
   - Kop Laporan: Badge logo `FK` berwarna emerald, tipografi tegas `FahKeu`, metadata periode rekap, dan tanggal pencetakan berstempel WIB.

2. **Ringkasan Finansial Matriks (Summary Grid):**
   - 3 Kartu statistik horizontal: Total Pemasukan (Emerald), Total Pengeluaran (Rose), dan Saldo Akhir (Slate/Emerald).

3. **Tabel Transaksi Multi-Halaman Dinamis:**
   - **Kalkulasi Overflow Cerdas:** Memeriksa batas tinggi halaman (`pageHeight - 15mm`). Jika baris transaksi melebihi batas, halaman baru ditambahkan secara otomatis.
   - **Repeating Table Header:** Setiap halaman baru secara otomatis menggambar ulang kepala tabel transaksi lengkap dengan styling latar belakang gelap `#0f172a`.
   - **Multi-line Text Wrapping:** Kolom kategori dan deskripsi yang panjang dipotong rapi menggunakan `doc.splitTextToSize`, mencegah teks terpotong atau menimpa kolom lain.
   - **Format Angka Rupiah Bersih:** Penataan teks rata kanan (*right-aligned*) untuk kolom nominal rupiah.

4. **Footer Dokumen Resmi:**
   - Garis pemisah tipis di bagian bawah halaman.
   - Watermark teks: *"Laporan Keuangan Otomatis FahKeu — by Faiz_Fahmi_Id since 2026"*.
   - Penomoran halaman otomatis (*"Halaman X"*).

---

### 5.6 Integrasi Google Sheets & Backend Google Apps Script

Skrip backend Google Apps Script mandiri (`/src/utils/code.gs.ts`) menyediakan layanan API tanpa server (*serverless endpoint*):

1. **`doGet(e)` - Sinkronisasi & Penarikan Data:**
   - Parameter `action=get_data`: Membaca seluruh baris dari sheet `Transaksi`, mengonversinya ke format JSON array, dan mengembalikannya ke aplikasi web.
   - Parameter `action=get_pdf`: Menghasilkan dokumen PDF langsung dari sisi Google Apps Script dan mengirimkannya kembali dalam bentuk stream base64.

2. **`doPost(e)` - Penyimpanan Transaksi & Webhook Telegram:**
   - Menerima payload transaksi baru dari aplikasi web atau pesan masuk dari webhook Telegram.
   - Menambahkan baris baru ke sheet: `[ID, Tanggal ISO, Waktu, Tipe, Kategori, Deskripsi, Nominal, Saldo, Sumber]`.
   - Melakukan formatting otomatis pada sel spreadsheet (format mata uang IDR, penebalan teks header, dan penyesuaian lebar kolom otomatis).

---

### 5.7 Integrasi Asisten Bot Telegram

Aplikasi mendukung pencatatan langsung dari aplikasi Telegram:
1. Pengguna membuat bot via `@BotFather` di Telegram dan mendapatkan Token API.
2. Webhook didaftarkan secara otomatis ke URL Google Apps Script.
3. **Perintah Telegram yang Didukung:**
   - `/start` atau `/help`: Panduan penggunaan bot.
   - `/saldo`: Menampilkan total saldo, pemasukan, dan pengeluaran terkini.
   - `/rekap`: Menampilkan rekap ringkas 5 transaksi terakhir.
   - `/pdf`: Mengirimkan berkas laporan PDF langsung ke obrolan Telegram.
   - *Pesan teks bebas:* Memproses bahasa alami (misal: *"beli bensin 30rb"*) dan langsung merekamnya ke Google Sheets.

---

### 5.8 Fitur Unduh Aplikasi (Android & Desktop via Google Drive)

FahKeu menyediakan antarmuka unduhan multi-platform yang terintegrasi di halaman Pengaturan (*Settings*):
1. **📱 Unduh Android (APK):**
   - Tombol unduh berikon smartphone yang mengarahkan pengguna ke tautan Google Drive file `.apk` instalasi Android.
   - Konstanta tautan: `DOWNLOAD_LINK_ANDROID` di `/src/components/SettingsPanel.tsx`.
2. **💻 Unduh Desktop (Windows / PC):**
   - Tombol unduh berikon laptop yang mengarahkan pengguna ke tautan Google Drive file `.exe` / installer desktop PC.
   - Konstanta tautan: `DOWNLOAD_LINK_DESKTOP` di `/src/components/SettingsPanel.tsx`.
3. **Penyimpanan Offline-First & Dukungan Web Manifest:**
   - **Web App Manifest (`public/manifest.json`):** Konfigurasi ikon aplikasi resolusi tinggi, tema `#0f172a`, mode tampilan `standalone`, dan orientasi `portrait-primary`.
   - **Dukungan Tema Dinamis:** Terang (*Light Mode*), Gelap (*Dark Mode*), dan *Luxury Gold*. Preferensi disimpan di `localStorage` (`catatkeu_theme`).
   - **Kunci Penyimpanan LocalStorage:**
     - `fahkeu_transactions`: Daftar seluruh objek transaksi.
     - `fahkeu_messages`: Riwayat percakapan chat bot.
     - `fahkeu_settings`: Konfigurasi integrasi Google Sheets & Telegram.
     - `fahkeu_offline_queue`: Antrean mutasi data saat offline.

---

## 6. Spesifikasi Desain & Antarmuka Pengguna (UI/UX)

### 6.1 Palet Warna Sistem
- **Primary Accent (Emerald):** `#10b981` (Emerald-500), `#059669` (Emerald-600), `#047857` (Emerald-700)
- **Expense Alert (Rose):** `#f43f5e` (Rose-500), `#e11d48` (Rose-600)
- **Neutral Dark Canvas (Slate):** `#020617` (Slate-950), `#0f172a` (Slate-900), `#1e293b` (Slate-800)
- **Neutral Light Canvas:** `#ffffff` (White), `#f8fafc` (Slate-50), `#f1f5f9` (Slate-100), `#e2e8f0` (Slate-200)

### 6.2 Tipografi & Hierarki Teks
- **Body Font:** Inter / System UI Sans-Serif (Legibilitas tinggi untuk angka moneter).
- **Scale:** H1 (24px/30px), H2 (18px/24px), Body (14px/20px), Caption (11px–12px), Micro (9px–10px).

### 6.3 Tata Letak Responsif
- **Mobile Viewport ($< 1024\text{px}$):** Tab navigasi bawah (*Bottom Navigation Bar*) tetap (*sticky*) dengan 3 tombol utama: *Chat*, *Grafik Analisis*, dan *Pengaturan*.
- **Desktop/Tablet Viewport ($\ge 1024\text{px}$):** Tata letak *Master-Detail Split Grid* 2 kolom: Sisi kiri menampilkan Chat Interaktif berkecepatan tinggi, sisi kanan menampilkan Dasbor Analitik & Statistik secara bersamaan.

---

## 7. Panduan Rekonstruksi Langkah-demi-Langkah (Build 100% Identik)

Untuk membangun ulang proyek ini dari awal secara presisi, ikuti langkah berikut:

### Langkah 1: Inisialisasi Proyek Vite React TypeScript
```bash
npm create vite@latest fahkeu -- --template react-ts
cd fahkeu
```

### Langkah 2: Instalasi Dependensi Inti
```bash
npm install lucide-react recharts jspdf tesseract.js motion clsx tailwind-merge
npm install -D tailwindcss @tailwindcss/vite
```

### Langkah 3: Konfigurasi Tailwind CSS di `vite.config.ts`
Pastikan plugin Tailwind telah diaktifkan:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
});
```

### Langkah 4: Susunan Struktur Folder
Bangun struktur direktori persis seperti berikut:
```
/
├── public/
│   ├── manifest.json
│   ├── favicon.ico
│   └── icon-512.png
├── src/
│   ├── components/
│   │   ├── ChatInterface.tsx    # Antarmuka chat, in-app camera, & OCR handler
│   │   ├── Dashboard.tsx        # Grafik Recharts, filter periode, & buku kas
│   │   └── SettingsPanel.tsx    # Konfigurasi Google Sheets & panduan Telegram
│   ├── utils/
│   │   ├── categories.ts        # Daftar 9 kategori, ikon, dan keyword matcher
│   │   ├── code.gs.ts           # Template skrip backend Google Apps Script
│   │   ├── parser.ts            # Parser NLP bahasa alami Bahasa Indonesia
│   │   ├── pdfGenerator.ts      # Generator laporan PDF profesional jsPDF
│   │   └── receiptParser.ts     # Heuristik pembersih teks OCR struk
│   ├── App.tsx                  # Root state management & layout orchestration
│   ├── index.css                # @import "tailwindcss";
│   ├── main.tsx                 # Entrypoint React
│   └── types.ts                 # Definisi tipe & interface TypeScript
├── index.html
├── package.json
└── tsconfig.json
```

---

## 8. Matriks Penanganan Error & Kasus Tepi (Edge Cases)

| Skenario Kasus Tepi | Potensi Masalah | Solusi Penanganan yang Diimplementasikan |
|---|---|---|
| **Izin Kamera Ditolak Pengguna** | Aplikasi crash atau video hitam kosong saat buka kamera. | Penangkapan blok `try/catch` pada `getUserMedia`, menampilkan notifikasi peringatan santun, dan otomatis mengalihkan pengguna ke tombol pilih file dari galeri. |
| **Foto Struk Buram / Terbalik** | OCR menghasilkan teks acak (*garbage text*). | Heuristik *fallback* nilai default $0$, disertai dialog pratinjau hasil deteksi di mana pengguna dapat mengedit angka & deskripsi sebelum disimpan. |
| **Pesan Chat Tanpa Angka** (misal *"halo bot"*) | Parser menghasilkan transaksi bernilai 0 atau salah rekam. | Parser mengembalikan status `success: false`. Bot memberikan respons panduan ramah dengan contoh penulisan yang benar. |
| **Tabel PDF Lebih dari 5 Halaman** | Teks terpotong di tepi bawah kertas. | Logika `checkPageOverflow` dinamis otomatis membuat halaman baru dan menggambar ulang `drawTableHeader` serta footer penomoran. |
| **Koneksi Internet Putus Saat Simpan** | Data hilang jika sinkronisasi Google Sheets gagal. | Data selalu disimpan terlebih dahulu ke `localStorage`, mutasi gagal dimasukkan ke `offlineActionQueue` untuk dicoba kembali saat online. |
| **Tombol Run di Apps Script Error `Cannot read properties of undefined (parameter)`** | Mengklik "Jalankan" pada fungsi `doGet` atau `doPost` di editor Google Apps Script tanpa parameter event `e`. | Skrip telah diproteksi dengan `e = e || {}` serta disediakan fungsi khusus `testSheet()` untuk uji coba koneksi & pembuatan tabel sheet secara aman langsung dari editor Apps Script. |
| **Data Web Tidak Masuk ke Spreadsheet (CORS / Payload Block)** | Browser memblokir pengiriman POST lintas domain (*CORS preflight*). | Menggunakan payload `text/plain;charset=utf-8` dengan mode `no-cors` dan mekanisme fallback otomatis ke endpoint `doGet` (`?action=add&data=...`) untuk menjamin 100% data tersimpan di Google Sheet. |

---

## 9. Panduan Deployment & Konfigurasi Lingkungan

### 9.1 Berkas `.env`
Buat berkas `.env` dari contoh `.env.example`:
```env
# URL tempat aplikasi di-hosting (opsional untuk referensi webhook)
APP_URL="http://localhost:3000"

# Kunci API Gemini (jika mengaktifkan asisten AI server-side tambahan)
GEMINI_API_KEY=""
```

### 9.2 Kompilasi & Build Produksi
```bash
npm run build
```
Output berkas statis siap saji akan dibuat di folder `/dist`, kompatibel 100% dengan platform hosting modern:
- **Vercel / Netlify / Cloudflare Pages:** Drag-and-drop folder `dist` atau hubungkan repositori GitHub.
- **GitHub Pages:** Atur direktori publik ke `dist`.
- **Cloud Run / Docker Container:** Sajikan folder `dist` menggunakan web server ringan Nginx atau Node.js static server.

---

## 10. Panduan Pengaturan Tautan Google Drive & Modifikasi di GitHub

Bagian ini menjelaskan cara mengelola tombol unduhan Android & Desktop secara manual di GitHub:

### 10.1 Cara Memasukkan Link Google Drive Sendiri (Android & Desktop)

1. Buka berkas **`/src/components/SettingsPanel.tsx`** di repositori GitHub Anda.
2. Klik ikon pensil (**Edit this file**) di GitHub.
3. Di bagian paling atas berkas (baris 25–28), temukan variabel tautan:
   ```typescript
   // ============================================================================
   // KONFIGURASI TAUTAN UNDUHAN GOOGLE DRIVE (Android & Desktop)
   // Masukkan link Google Drive / file APK / file Installer Desktop Anda di sini:
   // ============================================================================
   export const DOWNLOAD_LINK_ANDROID = "https://drive.google.com/drive/folders/LINK_GOOGLE_DRIVE_APK_ANDA";
   export const DOWNLOAD_LINK_DESKTOP = "https://drive.google.com/drive/folders/LINK_GOOGLE_DRIVE_DESKTOP_ANDA";
   ```
4. Ganti URL contoh di atas dengan tautan file / folder Google Drive Anda yang sudah diatur izin publiknya (*Anyone with the link can view/download*).
5. Klik tombol hijau **Commit changes...**.

---

### 10.2 Cara Menghapus Kartu Unduh Jika Tidak Diinginkan di Website

Jika di masa mendatang Anda ingin menonaktifkan fitur unduh aplikasi ini di website:
1. Buka berkas **`/src/components/SettingsPanel.tsx`** di GitHub Anda.
2. Cari blok yang telah diapit penanda komentar:
   - **Mulai:** `{/* [SECTION MULAI] FITUR UNDUH APLIKASI (ANDROID & DESKTOP VIA GOOGLE DRIVE) */}`
   - **Selesai:** `{/* [SECTION SELESAI] FITUR UNDUH APLIKASI (ANDROID & DESKTOP VIA GOOGLE DRIVE) */}`
3. Hapus seluruh blok tag `<div>` di antara kedua penanda tersebut.
4. Klik **Commit changes...**. Halaman Pengaturan akan bersih tanpa error.

---

## 📜 Lisensi & Atribusi
* **Pengembang:** Faiz_Fahmi_Id  
* **Tahun Pembuatan:** 2026  
* **Lisensi:** MIT License — Bebas digunakan, dipelajari, dan dikembangkan kembali.
