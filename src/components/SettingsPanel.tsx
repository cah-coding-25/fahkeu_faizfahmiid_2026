import React, { useState, useEffect } from 'react';
import {
  Clipboard,
  Check,
  ExternalLink,
  Bot,
  Database,
  RefreshCw,
  AlertTriangle,
  Code,
  HelpCircle,
  Play,
  Palette,
  Sun,
  Moon,
  Crown,
  Download,
  Smartphone,
  Laptop
} from 'lucide-react';
import { AppSettings } from '../types';
import { GOOGLE_APPS_SCRIPT_CODE } from '../utils/code.gs';

// ============================================================================
// KONFIGURASI TAUTAN UNDUHAN GOOGLE DRIVE (Android & Desktop)
// Masukkan link Google Drive / file APK / file Installer Desktop Anda di sini:
// ============================================================================
export const DOWNLOAD_LINK_ANDROID = "https://drive.google.com/drive/folders/YOUR_ANDROID_DRIVE_LINK";
export const DOWNLOAD_LINK_DESKTOP = "https://drive.google.com/drive/folders/YOUR_DESKTOP_DRIVE_LINK";

interface SettingsPanelProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onTestConnection: (urlToTest?: string) => Promise<boolean>;
  theme: 'light' | 'dark' | 'luxury-gold';
  onChangeTheme: (theme: 'light' | 'dark' | 'luxury-gold') => void;
}

export default function SettingsPanel({ 
  settings, 
  onSaveSettings, 
  onTestConnection,
  theme,
  onChangeTheme
}: SettingsPanelProps) {
  const [googleSheetUrl, setGoogleSheetUrl] = useState(settings.googleSheetUrl || '');
  const [telegramBotToken, setTelegramBotToken] = useState(settings.telegramBotToken || '');
  const [telegramChatId, setTelegramChatId] = useState(settings.telegramChatId || '');
  const [useCloudStorage, setUseCloudStorage] = useState(
    settings.useCloudStorage !== undefined 
      ? settings.useCloudStorage 
      : Boolean(settings.googleSheetUrl)
  );

  const [copied, setCopied] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'failed'>('idle');
  
  // Sync state when settings prop changes
  useEffect(() => {
    setGoogleSheetUrl(settings.googleSheetUrl || '');
    setTelegramBotToken(settings.telegramBotToken || '');
    setTelegramChatId(settings.telegramChatId || '');
    setUseCloudStorage(
      settings.useCloudStorage !== undefined 
        ? settings.useCloudStorage 
        : Boolean(settings.googleSheetUrl)
    );
  }, [settings]);

  // Telegram webhook states
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');
  const [webhookMessage, setWebhookMessage] = useState('');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    const trimmedUrl = googleSheetUrl.trim();
    // Jika URL diisi, otomatis aktifkan cloud storage
    const enableCloud = Boolean(trimmedUrl && useCloudStorage !== false);
    onSaveSettings({
      googleSheetUrl: trimmedUrl,
      telegramBotToken: telegramBotToken.trim(),
      telegramChatId: telegramChatId.trim(),
      useCloudStorage: enableCloud,
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleTestConnect = async () => {
    setTestingConnection(true);
    setTestResult('idle');
    try {
      const res = await onTestConnection(googleSheetUrl.trim());
      setTestResult(res ? 'success' : 'failed');
    } catch {
      setTestResult('failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleRegisterWebhook = async () => {
    if (!telegramBotToken.trim()) {
      setWebhookStatus('failed');
      setWebhookMessage('Mohon masukkan Token Bot Telegram terlebih dahulu.');
      return;
    }
    if (!googleSheetUrl.trim()) {
      setWebhookStatus('failed');
      setWebhookMessage('Mohon masukkan URL Apps Script Web App terlebih dahulu.');
      return;
    }

    setWebhookStatus('loading');
    setWebhookMessage('');
    
    try {
      // We registers webhook via Telegram API call directly from browser
      const response = await fetch(
        `https://api.telegram.org/bot${telegramBotToken.trim()}/setWebhook?url=${encodeURIComponent(googleSheetUrl.trim())}`
      );
      const data = await response.json();

      if (data.ok) {
        setWebhookStatus('success');
        setWebhookMessage(`Sukses! Webhook berhasil didaftarkan. Tanggapan Telegram: "${data.description}"`);
      } else {
        setWebhookStatus('failed');
        setWebhookMessage(`Telegram mengembalikan error: ${data.description || 'Kesalahan tidak diketahui'}`);
      }
    } catch (err: any) {
      setWebhookStatus('failed');
      setWebhookMessage(`Gagal menghubungi server Telegram. Error: ${err.message || err}`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-6 space-y-6">
      
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Integrasi & Pengaturan</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Hubungkan pencatat keuangan ini ke Google Spreadsheet Anda serta Bot Telegram secara mandiri.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Settings Area (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Theme Premium Card */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-900">
              <Palette className="w-4 h-4 text-amber-500" />
              <span>Pilih Tema Tampilan (Premium)</span>
            </h2>
            
            <div className="grid grid-cols-3 gap-3">
              {/* Light Mode */}
              <button
                onClick={() => onChangeTheme('light')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all duration-300 ${
                  theme === 'light'
                    ? 'border-indigo-500 bg-indigo-50/30 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span className="text-[10px] tracking-wide uppercase">Terang</span>
              </button>

              {/* Dark Mode */}
              <button
                onClick={() => onChangeTheme('dark')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all duration-300 ${
                  theme === 'dark'
                    ? 'border-indigo-500 bg-slate-900 text-indigo-400 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span className="text-[10px] tracking-wide uppercase">Gelap Standard</span>
              </button>

              {/* Luxury Gold Mode */}
              <button
                onClick={() => onChangeTheme('luxury-gold')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all duration-300 relative overflow-hidden ${
                  theme === 'luxury-gold'
                    ? 'border-amber-500 bg-gradient-to-br from-amber-950 to-slate-950 text-amber-400 font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)] scale-105'
                    : 'border-slate-200 dark:border-slate-800 bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                }`}
              >
                {theme === 'luxury-gold' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping opacity-75"></span>
                )}
                <Crown className={`w-4 h-4 ${theme === 'luxury-gold' ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
                <span className="text-[10px] tracking-wide uppercase font-black text-center leading-tight">Royal Gold (Termahal)</span>
              </button>
            </div>
          </div>

          {/* ======================================================================================================== */}
          {/* [SECTION MULAI] FITUR UNDUH APLIKASI (ANDROID & DESKTOP VIA GOOGLE DRIVE)                                 */}
          {/* PETUNJUK:                                                                                                */}
          {/* 1. Ganti tautan DOWNLOAD_LINK_ANDROID & DOWNLOAD_LINK_DESKTOP di baris 26-27 dengan link Google Drive.   */}
          {/* 2. Jika Anda TIDAK INGIN menampilkan kartu unduhan ini, HAPUS seluruh blok <div> di bawah ini           */}
          {/*    dari [SECTION MULAI] sampai [SECTION SELESAI].                                                        */}
          {/* ======================================================================================================== */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-900">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                <Download className="w-4.5 h-4.5 text-emerald-500" />
                <span>Unduh Aplikasi FahKeu (Android & Desktop)</span>
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-md border border-emerald-200 dark:border-emerald-900/40">
                Google Drive Ready
              </span>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Unduh berkas instalasi resmi FahKeu untuk perangkat Android (APK) atau Desktop PC/Laptop (Windows) melalui penyimpanan Google Drive Anda:
            </p>

            {/* 2 Tombol Unduhan: Android & Desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* 1. Unduh Android APK */}
              <a
                href={DOWNLOAD_LINK_ANDROID}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 rounded-xl border border-emerald-200/70 dark:border-emerald-900/60 flex items-center justify-between transition-all group shadow-sm hover:shadow active:scale-[0.98]"
              >
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Unduh Android</h4>
                      <span className="px-1.5 py-0.5 text-[9px] bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 font-bold rounded-md">APK</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Google Drive / Smartphone</p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:translate-y-0.5 transition-transform">
                  <Download className="w-4 h-4" />
                </div>
              </a>

              {/* 2. Unduh Desktop Windows / PC */}
              <a
                href={DOWNLOAD_LINK_DESKTOP}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-sky-50/70 hover:bg-sky-100/70 dark:bg-sky-950/30 dark:hover:bg-sky-950/50 rounded-xl border border-sky-200/70 dark:border-sky-900/60 flex items-center justify-between transition-all group shadow-sm hover:shadow active:scale-[0.98]"
              >
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-11 h-11 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-500/20 group-hover:scale-105 transition-transform">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Unduh Desktop</h4>
                      <span className="px-1.5 py-0.5 text-[9px] bg-sky-200/80 dark:bg-sky-900/80 text-sky-800 dark:text-sky-300 font-bold rounded-md">PC / EXE</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Google Drive / Laptop Windows</p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:translate-y-0.5 transition-transform">
                  <Download className="w-4 h-4" />
                </div>
              </a>
            </div>
          </div>
          {/* ======================================================================================================== */}
          {/* [SECTION SELESAI] FITUR UNDUH APLIKASI (ANDROID & DESKTOP VIA GOOGLE DRIVE)                               */}
          {/* ======================================================================================================== */}

          {/* Main Credentials Card */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-900">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Konfigurasi Google Spreadsheet</span>
            </h2>

            {/* Cloud Storage toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Aktifkan Database Cloud (Spreadsheet)</span>
                <p className="text-[10px] text-slate-400">Jika mati, data hanya disimpan lokal di browser (Local Storage).</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCloudStorage}
                  onChange={(e) => setUseCloudStorage(e.target.checked)}
                  disabled={!googleSheetUrl}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 disabled:opacity-50"></div>
              </label>
            </div>

            {/* Google Apps Script Web App URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">URL Web App Google Apps Script</label>
              <input
                type="text"
                value={googleSheetUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  setGoogleSheetUrl(val);
                  if (val.trim()) {
                    setUseCloudStorage(true);
                  } else {
                    setUseCloudStorage(false);
                  }
                }}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              <p className="text-[10px] text-slate-400">Masukkan URL deployment Aplikasi Web yang didapat dari langkah set up Apps Script.</p>
            </div>

            {/* Test Connection and Save Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
              >
                Simpan Konfigurasi
              </button>

              {googleSheetUrl && (
                <button
                  onClick={handleTestConnect}
                  disabled={testingConnection}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection && 'animate-spin'}`} />
                  <span>Uji Hubungkan</span>
                </button>
              )}

              {savedToast && (
                <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Tersimpan & Aktif!</span>
                </div>
              )}

              {testResult === 'success' && (
                <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Koneksi Berhasil!</span>
                </div>
              )}
              {testResult === 'failed' && (
                <div className="flex items-center space-x-1 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Koneksi Gagal / Salah URL.</span>
                </div>
              )}
            </div>
          </div>

          {/* Telegram Bot Integration Card */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-900">
              <Bot className="w-4 h-4 text-blue-500" />
              <span>Konfigurasi BOT Telegram</span>
            </h2>

            {/* Bot Token field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Token Bot Telegram</label>
              <input
                type="text"
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
                placeholder="e.g. 1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              <p className="text-[10px] text-slate-400">Token rahasia didapatkan dari BotFather saat membuat Bot Baru.</p>
            </div>

            {/* Set Webhook (Hubungkan Bot) */}
            <div className="p-4 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl space-y-3">
              <div className="flex items-start space-x-2.5">
                <HelpCircle className="w-4.5 h-4.5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-blue-800 dark:text-blue-300 block">Hubungkan Otomatis Telegram ke Google Sheets</span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed mt-1">
                    Untuk mengaktifkan chat di Telegram langsung masuk ke Spreadsheet yang sama, klik tombol di bawah untuk mendaftarkan Webhook Telegram ke Apps Script Anda secara instan.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={handleRegisterWebhook}
                  disabled={webhookStatus === 'loading' || !telegramBotToken || !googleSheetUrl}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Daftarkan Webhook Bot</span>
                </button>
              </div>

              {webhookStatus === 'success' && (
                <div className="text-emerald-600 dark:text-emerald-400 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                  {webhookMessage}
                </div>
              )}
              {webhookStatus === 'failed' && (
                <div className="text-rose-600 dark:text-rose-400 text-xs font-medium bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900/30">
                  {webhookMessage}
                </div>
              )}
            </div>
          </div>

          {/* Guide Steps Panel */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-900">
              <HelpCircle className="w-4.5 h-4.5 text-amber-500" />
              <span>Langkah Penyiapan Mandiri (100% Gratis)</span>
            </h2>

            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-4 leading-relaxed">
              {/* Spreadsheet Guide */}
              <div className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center">
                  <span className="w-4.5 h-4.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 flex items-center justify-center text-[10px] font-bold mr-2">1</span>
                  Langkah Google Spreadsheet & Apps Script:
                </span>
                <ol className="list-decimal list-inside space-y-1.5 pl-6 text-[11px] text-slate-500">
                  <li>Buat sebuah Spreadsheet baru di Google Drive Anda.</li>
                  <li>Di Spreadsheet, klik menu <b>Ekstensi &gt; Apps Script</b>.</li>
                  <li>Hapus semua kode bawaan, lalu salin dan tempel kode <b>Code.gs</b> yang ada di sebelah kanan panel ini.</li>
                  <li>Klik tombol Simpan 💾 di bar atas editor Apps Script.</li>
                  <li>Klik tombol <b>Terapkan &gt; Penerapan Baru</b> (Deploy &gt; New Deployment).</li>
                  <li>Klik ikon gerigi di sebelah "Pilih Jenis", pilih <b>Aplikasi Web</b> (Web App).</li>
                  <li>Ubah pengaturannya menjadi:
                    <ul className="list-disc list-inside pl-4 mt-0.5 space-y-0.5 font-medium">
                      <li><i>Jalankan sebagai:</i> <b>Saya (Email Anda)</b></li>
                      <li><i>Yang memiliki akses:</i> <b>Siapa saja (Anyone)</b></li>
                    </ul>
                  </li>
                  <li>Klik <b>Terapkan</b> (Deploy). Izinkan akses dari akun Google Anda jika muncul popup verifikasi keamanan.</li>
                  <li>Salin <b>URL Aplikasi Web</b> yang ditampilkan, lalu tempel di kolom "URL Web App" di atas. Selesai!</li>
                </ol>
              </div>

              {/* Telegram Bot Guide */}
              <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-900">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center">
                  <span className="w-4.5 h-4.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 flex items-center justify-center text-[10px] font-bold mr-2">2</span>
                  Langkah Pembuatan Bot Telegram:
                </span>
                <ol className="list-decimal list-inside space-y-1.5 pl-6 text-[11px] text-slate-500">
                  <li>Buka Telegram, cari akun bot resmi <b>@BotFather</b>.</li>
                  <li>Kirim perintah <code>/newbot</code> lalu ikuti instruksinya (beri nama bot & username unik).</li>
                  <li>BotFather akan memberikan sebuah <b>Bot Token</b>. Salin token tersebut dan tempel di kolom di atas.</li>
                  <li>Isi URL Apps Script di atas terlebih dahulu, simpan, lalu klik tombol <b>"Daftarkan Webhook Bot"</b> di atas.</li>
                  <li>Buka bot Telegram Anda, kirim perintah <code>/start</code>. Sekarang Anda bisa langsung mencatat keuangan lewat HP!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Code View Area (1 col on lg) */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <Code className="w-4.5 h-4.5 text-emerald-600" />
              <span>Kode Google Apps Script (Code.gs)</span>
            </h2>
            
            <button
              onClick={handleCopyCode}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition ${
                copied
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950 dark:border-emerald-900'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
              <span>{copied ? 'Tersalin' : 'Salin Kode'}</span>
            </button>
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed">
            Klik "Salin Kode" di atas lalu tempelkan ke halaman editor Google Apps Script Anda. Kode ini sudah otomatis dibekali parser regex pintar yang sama.
          </p>

          <textarea
            readOnly
            value={GOOGLE_APPS_SCRIPT_CODE}
            className="flex-1 w-full min-h-[350px] p-3.5 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-xl border border-slate-800 focus:outline-none resize-none scrollbar-thin overflow-y-auto"
          />

          {/* Bot Explanation Box */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-amber-500/30 rounded-xl space-y-4 text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-200 shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.07)]">
            <div className="flex items-center space-x-2 font-bold text-xs border-b border-slate-100 dark:border-slate-800 pb-2 text-slate-800 dark:text-white">
              <Bot className="w-4.5 h-4.5 text-indigo-600 dark:text-amber-400 shrink-0" />
              <span className="text-slate-800 dark:text-amber-400">💡 Cara Penggunaan & Tips Penting:</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-bold mb-1 text-slate-900 dark:text-white">1. Tanpa Setup Ribet (Siap Pakai)</h4>
                <p className="text-slate-600 dark:text-slate-200">
                  Anda <b className="text-indigo-600 dark:text-amber-300 font-bold">tidak perlu membuat kolom atau tabel secara manual</b> di Google Spreadsheet Anda. 
                  Setelah script di atas dipasang, sistem akan otomatis mendeteksi spreadsheet Anda dan 
                  <b className="text-indigo-600 dark:text-amber-300 font-bold"> membuat baris kolom transaksi secara otomatis</b> (<i>ID, Tanggal, Jenis, Kategori, Nominal, Deskripsi</i>) saat pertama kali data terkirim.
                </p>
              </div>

              <div>
                <h4 className="font-bold mb-1 text-slate-900 dark:text-white">2. Langkah Pemasangan:</h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-200 pl-1">
                  <li>Buat Google Spreadsheet baru, lalu buka menu <b className="text-indigo-600 dark:text-amber-300 font-bold">Ekstensi &gt; Apps Script</b>.</li>
                  <li>Hapus semua kode bawaan, lalu <b className="text-indigo-600 dark:text-amber-300 font-bold">tempelkan (paste)</b> kode Apps Script dari box di atas.</li>
                  <li>Klik tombol <b className="text-indigo-600 dark:text-amber-300 font-bold">Terapkan &gt; Penerapan Baru</b> (Deploy &gt; New Deployment).</li>
                  <li>Pilih jenis <b className="text-indigo-600 dark:text-amber-300 font-bold">Aplikasi Web</b>. Atur "Siapa yang memiliki akses" menjadi <b className="text-indigo-600 dark:text-amber-300 font-bold">Siapa saja (Anyone)</b>.</li>
                  <li>Klik <b className="text-indigo-600 dark:text-amber-300 font-bold">Terapkan</b>, lalu salin (copy) <b className="text-indigo-600 dark:text-amber-300 font-bold">URL Aplikasi Web</b> yang dihasilkan dan masukkan ke kolom URL Google Sheet di aplikasi ini.</li>
                </ol>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold mb-1 text-slate-900 dark:text-white flex items-center gap-1">
                  <span className="text-indigo-600 dark:text-amber-400">✨ Tips & Fitur Pintar:</span>
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-200 pl-1">
                  <li>
                    <b className="text-slate-800 dark:text-white">Pencatatan Berbasis AI:</b> Cukup ketik seperti biasa di menu chat, contoh: <i className="text-indigo-600 dark:text-amber-200 not-italic font-semibold">"makan siang 25 ribu"</i> atau <i className="text-indigo-600 dark:text-amber-200 not-italic font-semibold">"gajian 5 juta masuk rekening"</i>. AI akan mengkategorikan dan mencatatnya otomatis.
                  </li>
                  <li>
                    <b className="text-slate-800 dark:text-white">Sinkronisasi Offline Instan:</b> Jika internet HP Anda terputus (offline), transaksi yang Anda catat akan otomatis disimpan di penyimpanan lokal HP Anda. Begitu Anda tersambung kembali ke internet, aplikasi akan <b className="text-indigo-600 dark:text-amber-300 font-bold">langsung menyinkronkan data secara otomatis</b> ke Google Sheets tanpa kehilangan data!
                  </li>
                  <li>
                    <b className="text-slate-800 dark:text-white">Scan Foto Nota/Struk via Telegram Bot:</b> Anda sekarang bisa mengirim foto nota, bon, atau struk belanja Anda langsung ke bot Telegram Anda! Bot akan otomatis membaca nama toko & jumlah total pembayaran secara instan menggunakan Google OCR gratis tanpa perlu kunci API, lalu mencatatnya otomatis ke Spreadsheet Anda.
                  </li>
                  <li>
                    <b className="text-slate-800 dark:text-white">Bersihkan Riwayat Chat:</b> Ketik perintah chat seperti <i className="text-indigo-600 dark:text-amber-200 not-italic font-semibold">"hapus chat"</i>, <i className="text-indigo-600 dark:text-amber-200 not-italic font-semibold">"bersihkan chat"</i>, atau klik tombol <b className="text-indigo-600 dark:text-amber-300 font-bold">Hapus Chat</b> di atas ruang obrolan untuk mengosongkan layar obrolan agar selalu rapi.
                  </li>
                  <li>
                    <b className="text-slate-800 dark:text-white">Uji Coba di Apps Script:</b> Jika ingin mencoba menjalankan fungsi langsung di editor Apps Script dengan tombol <b>Jalankan (Run)</b>, pilih fungsi <code className="text-indigo-600 dark:text-amber-300 font-bold">testSheet</code> (jangan pilih doGet/doPost karena kedua fungsi tersebut hanya dipanggil oleh sistem Web App).
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
