export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Google Apps Script (Code.gs)
 * Salin dan tempel kode ini di Editor Google Apps Script Anda (Ekstensi > Apps Script).
 * Deploy sebagai "Web App" (Aplikasi Web):
 * - Jalankan sebagai: "Saya" (Me)
 * - Yang memiliki akses: "Siapa saja" (Anyone)
 */

// Konfigurasi Bot Telegram (Opsional, bisa juga diatur via Webhook atau Web App)
// Jika Anda ingin Bot Telegram merespon otomatis, isi token bot di sini atau kirimkan via Webhook.
var TELEGRAM_BOT_TOKEN = ""; 

/**
 * Fungsi Pengujian Mandiri (Bisa dipilih dan diklik "Jalankan" di Editor Apps Script).
 * Memastikan skrip terhubung dengan benar ke spreadsheet aktif.
 */
function testSheet() {
  var sheet = getOrCreateSheet();
  var rows = sheet.getLastRow();
  Logger.log("✅ Berhasil terhubung ke spreadsheet: " + sheet.getParent().getName());
  Logger.log("Nama Sheet: " + sheet.getName() + " | Total Baris: " + rows);
  return "Sukses! Spreadsheet aktif terhubung. Total baris saat ini: " + rows;
}

function doGet(e) {
  try {
    // Pengamanan parameter agar tidak error saat diuji langsung via tombol 'Jalankan'
    e = e || {};
    var parameter = e.parameter || {};
    
    // 1. Dukungan Aksi dari Web App via GET (Fallback handal jika POST terkendala jaringan/CORS)
    if (parameter.action === 'add' || parameter.action === 'delete' || parameter.action === 'clear') {
      var payload = { action: parameter.action };
      if (parameter.data) {
        try {
          var parsedData = JSON.parse(parameter.data);
          payload = Object.assign(payload, parsedData);
        } catch (err) {}
      }
      if (parameter.transaction) {
        try {
          payload.transaction = typeof parameter.transaction === 'string' ? JSON.parse(parameter.transaction) : parameter.transaction;
        } catch(err) {}
      }
      if (parameter.id) {
        payload.id = parameter.id;
      }
      return handleWebAppAction(payload);
    }
    
    var sheet = getOrCreateSheet();
    var rows = sheet.getDataRange().getValues();
    var transactions = [];
    
    // Lewati baris pertama (header)
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      if (!row[0]) continue; // Skip jika ID kosong

      var dateVal = row[1];
      if (dateVal instanceof Date) {
        dateVal = dateVal.toISOString();
      } else if (dateVal) {
        dateVal = dateVal.toString();
      } else {
        dateVal = new Date().toISOString();
      }

      transactions.push({
        id: row[0].toString(),
        date: dateVal,
        type: row[2] ? row[2].toString() : 'pengeluaran',
        amount: Number(row[3]) || 0,
        description: row[4] ? row[4].toString() : '',
        category: row[5] ? row[5].toString() : 'Lainnya',
        source: row[6] ? row[6].toString() : 'web'
      });
    }
    
    // 2. Handle PDF Export Page Request
    if (parameter.action === 'pdf') {
      var period = parameter.period || 'all';
      var filtered = [];
      var periodTitle = 'Semua Transaksi';
      var now = new Date();

      if (period === 'week') {
        var sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filtered = transactions.filter(function(t) {
          return new Date(t.date) >= sevenDaysAgo;
        });
        periodTitle = '7 Hari Terakhir (Minggu Ini)';
      } else if (period === 'month') {
        var thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = transactions.filter(function(t) {
          return new Date(t.date) >= thirtyDaysAgo;
        });
        periodTitle = '30 Hari Terakhir (Bulan Ini)';
      } else if (period === 'year') {
        var currentYear = now.getFullYear();
        filtered = transactions.filter(function(t) {
          return new Date(t.date).getFullYear() === currentYear;
        });
        periodTitle = 'Tahun ' + currentYear;
      } else {
        filtered = transactions;
        periodTitle = 'Semua Transaksi';
      }

      var htmlTemplate = getPdfHtmlTemplate(filtered, periodTitle);
      return HtmlService.createHtmlOutput(htmlTemplate)
        .setTitle("Unduh Rekap PDF - FahKeu")
        .setXObjectHeaderMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    
    // 3. Urutkan berdasarkan tanggal terbaru
    transactions.sort(function(a, b) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: transactions
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log("doGet error: " + err.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    e = e || {};
    var postData = null;
    
    // 1. Coba baca dari e.postData.contents
    if (e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        Logger.log("Bukan JSON langsung: " + parseErr.toString());
      }
    }
    
    // 2. Coba baca dari e.parameter (jika dikirim sebagai URL-encoded form atau query)
    if (!postData && e.parameter) {
      postData = e.parameter;
      if (postData.data && typeof postData.data === 'string') {
        try {
          var parsedData = JSON.parse(postData.data);
          postData = Object.assign({}, postData, parsedData);
        } catch (err) {}
      }
      if (postData.transaction && typeof postData.transaction === 'string') {
        try {
          postData.transaction = JSON.parse(postData.transaction);
        } catch (err) {}
      }
    }
    
    if (!postData) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Payload kosong atau tidak dapat di-parse"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // CASE A: Request dari Aplikasi Web (Web App)
    if (postData.action) {
      return handleWebAppAction(postData);
    }
    
    // CASE B: Request dari Webhook Telegram
    if (postData.message) {
      return handleTelegramMessage(postData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Payload tidak dikenali"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch(err) {
    Logger.log("doPost error: " + err.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handler untuk aksi dari Web App
function handleWebAppAction(payload) {
  try {
    var sheet = getOrCreateSheet();
    
    if (payload.action === 'add') {
      var t = payload.transaction;
      if (!t && payload.data) {
        t = payload.data;
      }
      if (typeof t === 'string') {
        try { t = JSON.parse(t); } catch(e) {}
      }
      if (!t) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: "Data transaksi tidak ditemukan dalam payload"
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      var txId = t.id || ("tx_" + Date.now());
      var txDate = t.date || new Date().toISOString();
      var txType = t.type || 'pengeluaran';
      var txAmount = Number(t.amount) || 0;
      var txDesc = t.description || '';
      var txCat = t.category || 'Lainnya';
      var txSource = t.source || 'web';

      sheet.appendRow([
        txId,
        txDate,
        txType,
        txAmount,
        txDesc,
        txCat,
        txSource
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Transaksi berhasil dicatat ke spreadsheet",
        id: txId
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (payload.action === 'delete') {
      var idToDelete = payload.id;
      var rows = sheet.getDataRange().getValues();
      var foundIndex = -1;
      
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] && rows[i][0].toString() === idToDelete.toString()) {
          foundIndex = i + 1; // +1 karena baris di spreadsheet mulai dari 1 dan lompati header
          break;
        }
      }
      
      if (foundIndex !== -1) {
        sheet.deleteRow(foundIndex);
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: "Transaksi berhasil dihapus dari spreadsheet"
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: "Transaksi tidak ditemukan di spreadsheet"
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    if (payload.action === 'clear') {
      // Hapus semua baris kecuali header
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Seluruh data transaksi di spreadsheet berhasil dibersihkan"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Aksi tidak dikenal: " + payload.action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    Logger.log("handleWebAppAction error: " + err.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handler untuk Pesan dari Bot Telegram
function handleTelegramMessage(payload) {
  var message = payload.message;
  var chatId = message.chat.id;
  
  // A. Handle Foto / Struk Belanja (Offline OCR)
  if (message.photo && message.photo.length > 0) {
    sendTelegramMessage(chatId, "⏳ <i>Sedang menganalisis foto struk belanja Anda... Mohon tunggu sebentar.</i>");
    try {
      var photoObj = message.photo[message.photo.length - 1]; // Resolusi tertinggi
      var fileId = photoObj.file_id;
      
      var token = getBotToken();
      var fileUrl = "https://api.telegram.org/bot" + token + "/getFile?file_id=" + fileId;
      var fileResponse = UrlFetchApp.fetch(fileUrl);
      var fileResult = JSON.parse(fileResponse.getContentText());
      
      if (fileResult.ok) {
        var filePath = fileResult.result.file_path;
        var downloadUrl = "https://api.telegram.org/file/bot" + token + "/" + filePath;
        var imageBlob = UrlFetchApp.fetch(downloadUrl).getBlob();
        
        // OCR menggunakan Google Drive API
        var scannedText = ocrImageFromBlob(imageBlob);
        
        // Parse hasil teks struk
        var parsed = parseReceiptTextInScript(scannedText);
        
        // Simpan ke Google Sheet
        var sheet = getOrCreateSheet();
        var id = "tg_ocr_" + Date.now();
        var dateIso = new Date().toISOString();
        
        sheet.appendRow([
          id,
          dateIso,
          parsed.type,
          parsed.amount,
          parsed.description,
          parsed.category,
          'telegram_ocr'
        ]);
        
        var totals = calculateBalance(sheet);
        
        var reply = "🧾 <b>Struk Berhasil Di-scan &amp; Dicatat!</b>\\n\\n" +
                    "• Keterangan: <b>" + parsed.description + "</b>\\n" +
                    "• Nominal: <b>" + formatRupiah(parsed.amount) + "</b>\\n" +
                    "• Kategori: <b>" + parsed.category + "</b>\\n" +
                    "• Jenis: <b>Pengeluaran (Uang Keluar)</b>\\n\\n" +
                    "💰 Sisa Saldo Anda: <b>" + formatRupiah(totals.balance) + "</b>";
                    
        sendTelegramMessage(chatId, reply);
      } else {
        sendTelegramMessage(chatId, "⚠️ Gagal mengambil file foto dari server Telegram.");
      }
    } catch (err) {
      Logger.log(err.toString());
      sendTelegramMessage(chatId, "⚠️ Gagal membaca struk belanja: " + err.toString());
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  }

  var text = message.text || "";
  var cleanText = text.toLowerCase().trim();
  
  // Cek apakah user meminta PDF / rekapitulasi download
  var pdfTriggers = [
    'download rekap', 'unduh rekap', 'rekap pdf', 'pdf rekap', 
    'rekap keuangan', 'laporan keuangan', 'export pdf', 'pdf report', 
    'download laporan', 'unduh laporan', 'rekap bulanan', 'rekap harian',
    'pdf rekapitulasi', 'cetak rekap', 'download pdf', 'cetak pdf', 'buat pdf',
    'rekap minggu', 'rekap tahun', 'rekap'
  ];
  var matchesPdf = false;
  for (var p = 0; p < pdfTriggers.length; p++) {
    if (cleanText.indexOf(pdfTriggers[p]) !== -1) {
      matchesPdf = true;
      break;
    }
  }
  if (!matchesPdf && ((cleanText.indexOf('pdf') !== -1 && cleanText.indexOf('unduh') !== -1) || 
                      (cleanText.indexOf('rekap') !== -1 && cleanText.indexOf('cetak') !== -1))) {
    matchesPdf = true;
  }

  if (matchesPdf) {
    var webAppUrl = "";
    try {
      webAppUrl = ScriptApp.getService().getUrl();
    } catch (e) {
      Logger.log("Gagal mendapatkan URL: " + e.toString());
    }

    if (!webAppUrl) {
      sendTelegramMessage(chatId, "⚠️ <b>Gagal Mendeteksi URL Web App</b>\\n\\nPastikan Anda telah melakukan <b>Deploy > New Deployment > Web App</b> dengan konfigurasi:\\n• Execute as: <b>Me</b>\\n• Who has access: <b>Anyone</b>\\n\\nSilakan deploy kembali agar tautan rekap PDF Anda aktif secara otomatis!");
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    var replyText = "📄 <b>Laporan Keuangan PDF (FahKeu)</b>\\n\\n" +
                    "Saya bisa membuatkan berkas laporan PDF rekapitulasi transaksi Anda secara otomatis, rapi, dan siap diunduh!\\n\\n" +
                    "Silakan klik link di bawah ini untuk mengunduh rekap keuangan sesuai jangka waktu pilihan Anda:\\n\\n" +
                    "📂 <a href=\\"" + webAppUrl + "?action=pdf&period=all\\"><b>Unduh Rekap Semua Transaksi</b></a>\\n" +
                    "📅 <a href=\\"" + webAppUrl + "?action=pdf&period=week\\"><b>Unduh Rekap Minggu Ini (7 Hari)</b></a>\\n" +
                    "📆 <a href=\\"" + webAppUrl + "?action=pdf&period=month\\"><b>Unduh Rekap Bulan Ini (30 Hari)</b></a>\\n" +
                    "🗓️ <a href=\\"" + webAppUrl + "?action=pdf&period=year\\"><b>Unduh Rekap Tahun Ini</b></a>\\n\\n" +
                    "<i>Tautan di atas akan langsung mengunduh berkas PDF ke perangkat Anda secara otomatis dan aman.</i>";

    sendTelegramMessage(chatId, replyText);
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  }

  // Jika ini perintah /start atau bantuan
  if (text.startsWith('/start') || text.toLowerCase() === 'help' || text.toLowerCase() === 'bantuan') {
    var welcomeText = "👋 <b>Halo! Saya Bot Pencatat Keuangan Pintar.</b>\\n\\n" +
                      "Anda bisa mencatat keuangan langsung lewat chat ini!\\n\\n" +
                      "<b>Contoh Input:</b>\\n" +
                      "• <code>gaji masuk 3juta</code> (Pemasukan)\\n" +
                      "• <code>beli bakso 15k</code> (Pengeluaran)\\n" +
                      "• <code>bayar kos 1.5jt</code> (Pengeluaran)\\n" +
                      "• <code>sisa saldo</code> (Melihat saldo saat ini)\\n" +
                      "• <code>download rekap</code> (Mendapatkan rekap PDF instan)\\n\\n" +
                      "<b>📷 Scan Nota / Struk Belanja:</b>\\n" +
                      "Kirim foto nota/struk belanja Anda langsung ke chat ini. Saya akan mendeteksi nominal dan toko secara otomatis (100% Offline OCR tanpa API key) dan menyimpannya!\\n\\n" +
                      "Ketik apa saja, saya akan mencoba memahaminya menggunakan logika pintar!";
    sendTelegramMessage(chatId, welcomeText);
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  }

  var sheet = getOrCreateSheet();
  
  // Cek apakah user hanya meminta sisa saldo
  var cleanText = text.toLowerCase().trim();
  if (cleanText === 'sisa saldo' || cleanText === 'saldo' || cleanText === 'cek saldo') {
    var totals = calculateBalance(sheet);
    var balanceText = "📊 <b>Status Keuangan Anda saat ini:</b>\\n\\n" +
                      "• Sisa Saldo: <b>" + formatRupiah(totals.balance) + "</b>\\n" +
                      "• Total Pemasukan: " + formatRupiah(totals.income) + "\\n" +
                      "• Total Pengeluaran: " + formatRupiah(totals.expense);
    sendTelegramMessage(chatId, balanceText);
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  }

  // Parse Pesan Keuangan menggunakan logika regex mirip di React Web App
  var parsed = parseTransactionTextInScript(text);
  
  if (!parsed.success) {
    var errorReply = "⚠️ Maaf, saya tidak dapat memahami format transaksi tersebut.\\n\\n" +
                     "Pastikan Anda memasukkan keterangan dan nominal, contoh:\\n" +
                     "• <i>gaji masuk 3juta</i>\\n" +
                     "• <i>bakso 4k</i>";
    sendTelegramMessage(chatId, errorReply);
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Simpan ke Google Sheet
  var id = "tg_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  var dateIso = new Date().toISOString();
  
  sheet.appendRow([
    id,
    dateIso,
    parsed.type,
    parsed.amount,
    parsed.description,
    parsed.category,
    'telegram'
  ]);
  
  // Hitung saldo terbaru
  var totals = calculateBalance(sheet);
  
  // Buat balasan konfirmasi
  var feedbackWord = parsed.type === 'pemasukan' ? 'Uang masuk: ' : 'Uang keluar: ';
  var reply = "✅ <b>Terima kasih, sudah tercatat!</b>\\n\\n" +
              "• Keterangan: <b>" + parsed.description + "</b>\\n" +
              "• Kategori: " + parsed.category + "\\n" +
              "• " + feedbackWord + "<b>" + formatRupiah(parsed.amount) + "</b>\\n" +
              "• Sisa Saldo: <b>" + formatRupiah(totals.balance) + "</b>";
              
  sendTelegramMessage(chatId, reply);
  
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

// Fungsi untuk membuat / mengambil Sheet 'Transactions'
function getOrCreateSheet() {
  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    Logger.log("getActiveSpreadsheet error: " + e.toString());
  }

  // Jika script dibuat secara standalone (terpisah di script.google.com)
  if (!ss) {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (sheetId) {
      try {
        ss = SpreadsheetApp.openById(sheetId.trim());
      } catch (openErr) {
        Logger.log("openById error: " + openErr.toString());
      }
    }
  }

  if (!ss) {
    throw new Error("Spreadsheet aktif tidak ditemukan! Pastikan skrip ini dibuat langsung dari Google Spreadsheet Anda (menu Ekstensi > Apps Script). Jika membuat skrip terpisah, tambahkan SPREADSHEET_ID di Pengaturan Proyek > Properti Script.");
  }

  var sheet = ss.getSheetByName('Transactions');
  if (!sheet) {
    sheet = ss.insertSheet('Transactions');
    // Set Header
    sheet.appendRow(['ID', 'Tanggal', 'Tipe', 'Jumlah', 'Deskripsi', 'Kategori', 'Sumber']);
    // Format Header
    sheet.getRange("A1:G1").setFontWeight("bold").setBackground("#F3F4F6");
    // Format kolom Jumlah sebagai angka
    sheet.getRange("D2:D").setNumberFormat("#,##0");
  }
  return sheet;
}

// Hitung saldo dan rekap pemasukan/pengeluaran
function calculateBalance(sheet) {
  var rows = sheet.getDataRange().getValues();
  var totalIncome = 0;
  var totalExpense = 0;
  
  for (var i = 1; i < rows.length; i++) {
    var type = rows[i][2];
    var amount = Number(rows[i][3]);
    if (isNaN(amount)) continue;
    
    if (type === 'pemasukan') {
      totalIncome += amount;
    } else if (type === 'pengeluaran') {
      totalExpense += amount;
    }
  }
  
  return {
    income: totalIncome,
    expense: totalExpense,
    balance: totalIncome - totalExpense
  };
}

// Kirim pesan kembali ke Telegram
function sendTelegramMessage(chatId, text) {
  if (!TELEGRAM_BOT_TOKEN) {
    // Ambil token dari script properties sebagai alternatif
    TELEGRAM_BOT_TOKEN = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN') || "";
  }
  
  if (!TELEGRAM_BOT_TOKEN) {
    Logger.log("TELEGRAM_BOT_TOKEN belum diset.");
    return;
  }
  
  var url = "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage";
  var payload = {
    "chat_id": chatId,
    "text": text,
    "parse_mode": "HTML"
  };
  
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };
  
  UrlFetchApp.fetch(url, options);
}

// Fungsi bantu mendaftarkan webhook dari Web App
function setTelegramWebhook(botToken, webAppUrl) {
  var url = "https://api.telegram.org/bot" + botToken + "/setWebhook?url=" + encodeURIComponent(webAppUrl);
  var response = UrlFetchApp.fetch(url);
  return response.getContentText();
}

// Logika parser di Google Apps Script (Javascript murni)
function parseTransactionTextInScript(text) {
  var cleanText = text.trim().toLowerCase();
  var type = 'pengeluaran'; // Default
  
  var incomeKeywords = ['gaji', 'masuk', 'terima', 'pemasukan', 'transfer', 'freelance', 'sampingan', 'bonus', 'untung', 'dapat', 'cuan', 'laba', 'plus', '+'];
  var expenseKeywords = ['pengeluaran', 'beli', 'bayar', 'untuk', 'makan', 'bakso', 'kopi', 'bensin', 'pulsa', 'listrik', 'belanja', 'jajan', 'ongkir', 'kos', 'tiket', 'nonton', 'keluar', 'minum', 'gojek', 'grab', 'shopee', 'tokopedia', 'minus', '-'];
  
  if (cleanText.indexOf('+') === 0) {
    type = 'pemasukan';
  } else if (cleanText.indexOf('-') === 0) {
    type = 'pengeluaran';
  } else {
    var hasIncome = false;
    for (var i = 0; i < incomeKeywords.length; i++) {
      if (cleanText.indexOf(incomeKeywords[i]) !== -1) { hasIncome = true; break; }
    }
    var hasExpense = false;
    for (var j = 0; j < expenseKeywords.length; j++) {
      if (cleanText.indexOf(expenseKeywords[j]) !== -1) { hasExpense = true; break; }
    }
    
    if (hasIncome && !hasExpense) {
      type = 'pemasukan';
    } else {
      type = 'pengeluaran';
    }
  }
  
  // Extract amount
  var amountRegex = /(?:rp\\.?\\s*)?(\\d+[\\d.,]*)\\s*(juta|miliar|jt|ribu|rb|k|m|r)?\\b/gi;
  var match = amountRegex.exec(cleanText);
  
  if (!match) {
    return { success: false };
  }
  
  var rawNumber = match[1];
  var suffix = match[2] ? match[2].toLowerCase() : "";
  var numVal = 0;
  
  if (suffix) {
    var normalizedNum = rawNumber.replace(/,/g, '.');
    numVal = parseFloat(normalizedNum);
  } else {
    var dotCount = (rawNumber.match(/\\./g) || []).length;
    if (dotCount > 1) {
      numVal = parseFloat(rawNumber.replace(/\\./g, ''));
    } else if (rawNumber.indexOf(',') !== -1) {
      numVal = parseFloat(rawNumber.replace(/\\./g, '').replace(/,/g, '.'));
    } else {
      var dotIndex = rawNumber.indexOf('.');
      if (dotIndex !== -1) {
        var digitsAfter = rawNumber.length - 1 - dotIndex;
        if (digitsAfter === 3) {
          numVal = parseFloat(rawNumber.replace(/\\./g, ''));
        } else {
          numVal = parseFloat(rawNumber);
        }
      } else {
        numVal = parseFloat(rawNumber);
      }
    }
  }
  
  if (isNaN(numVal)) return { success: false };
  
  var multiplier = 1;
  if (suffix === 'k' || suffix === 'rb' || suffix === 'ribu' || suffix === 'r') {
    multiplier = 1000;
  } else if (suffix === 'jt' || suffix === 'juta') {
    multiplier = 1000000;
  } else if (suffix === 'm' || suffix === 'miliar') {
    multiplier = 1000000000;
  }
  
  var amount = numVal * multiplier;
  
  // Clean description
  var originalAmountText = match[0];
  var description = text.replace(new RegExp(escapeRegExp(originalAmountText), 'i'), '');
  
  var noiseWords = ['sebesar', 'untuk', 'beli', 'bayar', 'pemasukan', 'pengeluaran', 'nominal', 'sebanyak', 'harga', 'rupiah', 'rp', 'buat', 'jajan', 'uang', 'masuk', 'keluar', 'dapat', 'terima', 'plus', 'minus', '+', '-'];
  var words = description.split(/\\s+/);
  var filteredWords = [];
  
  for (var k = 0; k < words.length; k++) {
    var cleanWord = words[k].toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanWord.length > 0 && noiseWords.indexOf(cleanWord) === -1) {
      // Capitalize first letter
      var word = words[k];
      var capitalized = word.charAt(0).toUpperCase() + word.slice(1);
      filteredWords.push(capitalized);
    }
  }
  
  var cleanedDesc = filteredWords.join(' ').trim();
  if (!cleanedDesc) {
    cleanedDesc = type === 'pemasukan' ? 'Pemasukan Umum' : 'Pengeluaran Umum';
  }
  
  // Simple category assignment
  var category = type === 'pemasukan' ? 'Pemasukan Lain' : 'Lain-lain';
  var descLower = cleanedDesc.toLowerCase();
  
  var categoriesList = [
    { name: 'Makanan & Minuman', keywords: ['bakso', 'makan', 'kopi', 'minum', 'sate', 'nasgor', 'warteg', 'mie', 'jajan', 'boba', 'roti', 'cafe', 'restoran', 'kuliner'] },
    { name: 'Transportasi', keywords: ['bensin', 'ojek', 'gojek', 'grab', 'mobil', 'motor', 'toll', 'tol', 'parkir', 'tiket', 'kereta', 'pesawat', 'bus', 'travel'] },
    { name: 'Belanja & Pribadi', keywords: ['belanja', 'baju', 'shopee', 'tokopedia', 'celana', 'sepatu', 'skincare', 'makeup', 'salon', 'potong rambut', 'mall', 'supermarket'] },
    { name: 'Tagihan & Utilitas', keywords: ['kos', 'kontrakan', 'listrik', 'air', 'pdam', 'wifi', 'internet', 'pulsa', 'kuota', 'langganan', 'netflix', 'spotify', 'asuransi', 'pajak'] },
    { name: 'Hiburan & Liburan', keywords: ['nonton', 'bioskop', 'game', 'topup', 'liburan', 'hotel', 'wisata', 'konser', 'karaoke', 'healing'] },
    { name: 'Kesehatan', keywords: ['obat', 'dokter', 'rs', 'rumah sakit', 'klinik', 'vitamin', 'apotek', 'sakit', 'gigi'] }
  ];
  
  if (type === 'pemasukan') {
    categoriesList = [
      { name: 'Gaji & Pendapatan Tetap', keywords: ['gaji', 'salary', 'bulanan', 'upah', 'pemasukan utama'] },
      { name: 'Freelance & Sampingan', keywords: ['freelance', 'sampingan', 'proyek', 'project', 'desain', 'coding', 'jasa'] },
      { name: 'Hasil Investasi & Cuan', keywords: ['investasi', 'saham', 'reksadana', 'crypto', 'cuan', 'bunga', 'dividen', 'untung'] },
      { name: 'Penjualan & Bisnis', keywords: ['jualan', 'dagang', 'bisnis', 'laba', 'omset', 'olshop', 'toko'] },
      { name: 'Pemberian & Transfer', keywords: ['transfer', 'kiriman', 'orang tua', 'hadiah', 'angpao', 'thr', 'gift'] }
    ];
  }
  
  for (var m = 0; m < categoriesList.length; m++) {
    var cat = categoriesList[m];
    var matchFound = false;
    for (var n = 0; n < cat.keywords.length; n++) {
      if (descLower.indexOf(cat.keywords[n]) !== -1) {
        matchFound = true;
        break;
      }
    }
    if (matchFound) {
      category = cat.name;
      break;
    }
  }
  
  return {
    success: true,
    type: type,
    amount: amount,
    description: cleanedDesc,
    category: category
  };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^\\\\\${}()|[\\]\\\\]/g, '\\\\$&');
}

function formatRupiah(amount) {
  // Format manual Rupiah tanpa Intl jika locale id-ID tidak didukung penuh di GAS
  var str = Math.round(amount).toString();
  var result = "";
  var count = 0;
  for (var i = str.length - 1; i >= 0; i--) {
    result = str.charAt(i) + result;
    count++;
    if (count % 3 === 0 && i !== 0) {
      result = "." + result;
    }
  }
  return "Rp " + result;
}

function getBotToken() {
  if (!TELEGRAM_BOT_TOKEN) {
    TELEGRAM_BOT_TOKEN = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN') || "";
  }
  return TELEGRAM_BOT_TOKEN;
}

function ocrImageFromBlob(blob) {
  var metadata = {
    title: "Temp_OCR_" + Date.now(),
    mimeType: blob.getContentType()
  };
  var payload = {
    metadata: Utilities.newBlob(JSON.stringify(metadata), "application/json"),
    file: blob
  };
  
  var response = UrlFetchApp.fetch("https://www.googleapis.com/upload/drive/v2/files?uploadType=multipart&ocr=true&ocrLanguage=en", {
    method: "post",
    headers: {
      "Authorization": "Bearer " + ScriptApp.getOAuthToken()
    },
    payload: payload,
    muteHttpExceptions: true
  });
  
  var result = JSON.parse(response.getContentText());
  if (result.id) {
    var doc = DocumentApp.openById(result.id);
    var text = doc.getBody().getText();
    
    // Hapus file temporary
    UrlFetchApp.fetch("https://www.googleapis.com/drive/v2/files/" + result.id, {
      method: "delete",
      headers: {
        "Authorization": "Bearer " + ScriptApp.getOAuthToken()
      },
      muteHttpExceptions: true
    });
    
    return text;
  }
  throw new Error("Gagal mengunggah foto ke Google Drive untuk OCR.");
}

function parseReceiptTextInScript(text) {
  var lines = text.split('\\n');
  var detectedAmount = 0;
  var detectedDescription = 'Belanja Nota';
  var detectedCategory = 'Lain-lain';

  var totalKeywords = ['total', 'grand total', 'subtotal', 'jumlah', 'netto', 'nett', 'amount', 'bayar', 'cash', 'tunai', 'debit', 'total bayar', 'jml'];
  var excludeKeywords = ['kembali', 'change', 'diskon', 'discount', 'promo', 'tax', 'pajak', 'ppn', 'service', 'ongkir'];

  var potentialAmounts = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    var lowerLine = line.toLowerCase();

    // Extract numbers
    var cleanLine = lowerLine.replace(/rp\\.?/g, '').replace(/\\s+/g, '');
    var matches = cleanLine.match(/\\d+[\\d.,]*/g) || [];
    
    for (var j = 0; j < matches.length; j++) {
      var m = matches[j];
      var hasMultipleDots = (m.match(/\\./g) || []).length > 1;
      var hasCommas = m.indexOf(',') !== -1;
      var hasDots = m.indexOf('.') !== -1;
      var numVal = 0;

      if (hasMultipleDots) {
        numVal = parseFloat(m.replace(/\\./g, ''));
      } else if (hasCommas && hasDots) {
        numVal = parseFloat(m.replace(/[^0-9]/g, ''));
      } else if (hasCommas) {
        var parts = m.split(',');
        if (parts[1] && parts[1].length === 3) {
          numVal = parseFloat(m.replace(/,/g, ''));
        } else {
          numVal = parseFloat(parts[0].replace(/\\./g, ''));
        }
      } else if (hasDots) {
        var parts = m.split('.');
        if (parts[1] && parts[1].length === 3) {
          numVal = parseFloat(m.replace(/\\./g, ''));
        } else {
          numVal = parseFloat(parts[0]);
        }
      } else {
        numVal = parseFloat(m);
      }

      if (numVal > 100 && numVal < 10000000) {
        var isTotalLine = false;
        for (var k = 0; k < totalKeywords.length; k++) {
          if (lowerLine.indexOf(totalKeywords[k]) !== -1) {
            isTotalLine = true;
            break;
          }
        }
        var isExcludedLine = false;
        for (var l = 0; l < excludeKeywords.length; l++) {
          if (lowerLine.indexOf(excludeKeywords[l]) !== -1) {
            isExcludedLine = true;
            break;
          }
        }
        potentialAmounts.push({
          value: numVal,
          isTotalLine: isTotalLine && !isExcludedLine
        });
      }
    }
  }

  // Find total amount
  var totalLineMatches = potentialAmounts.filter(function(p) { return p.isTotalLine; });
  if (totalLineMatches.length > 0) {
    var maxVal = 0;
    for (var n = 0; n < totalLineMatches.length; n++) {
      if (totalLineMatches[n].value > maxVal) maxVal = totalLineMatches[n].value;
    }
    detectedAmount = maxVal;
  } else if (potentialAmounts.length > 0) {
    var sorted = potentialAmounts.filter(function(p) { return p.value < 5000000; });
    sorted.sort(function(a, b) { return b.value - a.value; });
    if (sorted.length > 0) {
      detectedAmount = sorted[0].value;
    }
  }

  // Detect Store Name / Description
  var storeKeywords = ['mart', 'cafe', 'coffee', 'restoran', 'resto', 'pertamina', 'apotek', 'laundry', 'trans', 'supermarket', 'indomaret', 'alfamart', 'kopi', 'bakso'];
  var foundStoreName = '';
  for (var i = 0; i < Math.min(5, lines.length); i++) {
    var line = lines[i].trim();
    if (line.length > 3 && line.length < 35 && !/\\d{4,}/.test(line)) {
      var isStore = false;
      for (var s = 0; s < storeKeywords.length; s++) {
        if (line.toLowerCase().indexOf(storeKeywords[s]) !== -1) {
          isStore = true;
          break;
        }
      }
      if (isStore) {
        foundStoreName = line;
        break;
      }
      if (!foundStoreName && /[a-zA-Z]{4,}/.test(line)) {
        foundStoreName = line;
      }
    }
  }

  if (foundStoreName) {
    detectedDescription = 'Nota ' + foundStoreName.replace(/[^a-zA-Z0-9\\s-]/g, '').trim();
  } else {
    detectedDescription = 'Nota Belanja';
  }

  // Assign category
  var fullLower = text.toLowerCase();
  var detectedCategory = 'Lain-lain';
  if (fullLower.indexOf('kopi') !== -1 || fullLower.indexOf('coffee') !== -1 || fullLower.indexOf('cafe') !== -1 || fullLower.indexOf('teh') !== -1) {
    detectedCategory = 'Makanan & Minuman';
  } else if (fullLower.indexOf('makan') !== -1 || fullLower.indexOf('bakso') !== -1 || fullLower.indexOf('resto') !== -1 || fullLower.indexOf('mie') !== -1 || fullLower.indexOf('nasi') !== -1 || fullLower.indexOf('sate') !== -1) {
    detectedCategory = 'Makanan & Minuman';
  } else if (fullLower.indexOf('bensin') !== -1 || fullLower.indexOf('pertamina') !== -1 || fullLower.indexOf('spbu') !== -1 || fullLower.indexOf('shell') !== -1 || fullLower.indexOf('parkir') !== -1 || fullLower.indexOf('tol') !== -1) {
    detectedCategory = 'Transportasi';
  } else if (fullLower.indexOf('listrik') !== -1 || fullLower.indexOf('pln') !== -1 || fullLower.indexOf('token') !== -1 || fullLower.indexOf('pulsa') !== -1 || fullLower.indexOf('kuota') !== -1 || fullLower.indexOf('wifi') !== -1) {
    detectedCategory = 'Tagihan & Utilitas';
  } else if (fullLower.indexOf('indomaret') !== -1 || fullLower.indexOf('alfamart') !== -1 || fullLower.indexOf('belanja') !== -1 || fullLower.indexOf('supermarket') !== -1) {
    detectedCategory = 'Belanja & Pribadi';
  } else if (fullLower.indexOf('nonton') !== -1 || fullLower.indexOf('bioskop') !== -1 || fullLower.indexOf('game') !== -1 || fullLower.indexOf('liburan') !== -1) {
    detectedCategory = 'Hiburan & Liburan';
  } else if (fullLower.indexOf('obat') !== -1 || fullLower.indexOf('apotek') !== -1 || fullLower.indexOf('klinik') !== -1 || fullLower.indexOf('sehat') !== -1) {
    detectedCategory = 'Kesehatan';
  }

  return {
    amount: detectedAmount || 15000,
    description: detectedDescription,
    category: detectedCategory,
    type: 'pengeluaran'
  };
}

function getPdfHtmlTemplate(transactions, periodTitle) {
  var htmlString = '<!DOCTYPE html>\\n' +
'<html>\\n' +
'<head>\\n' +
'  <meta charset="utf-8">\\n' +
'  <title>Unduh Rekap PDF - FahKeu</title>\\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">\\n' +
'  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>\\n' +
'  <script src="https://cdn.tailwindcss.com"></script>\\n' +
'  <style>\\n' +
'    @import url(\\'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap\\');\\n' +
'    body { font-family: \\'Inter\\', sans-serif; }\\n' +
'  </style>\\n' +
'</head>\\n' +
'<body class="bg-slate-900 flex items-center justify-center min-h-screen text-slate-100 p-4 antialiased">\\n' +
'  <div class="w-full max-w-md bg-slate-950 rounded-2xl border border-slate-800 p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">\\n' +
'    <div class="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"></div>\\n' +
'    <div class="flex justify-center">\\n' +
'      <div id="spinner" class="relative flex items-center justify-center w-20 h-20">\\n' +
'        <div class="absolute inset-0 rounded-full border-4 border-slate-800"></div>\\n' +
'        <div class="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>\\n' +
'        <span class="text-2xl text-emerald-500 font-black">FK</span>\\n' +
'      </div>\\n' +
'      <div id="success-icon" class="hidden flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30">\\n' +
'        <span class="text-3xl text-emerald-400">✨</span>\\n' +
'      </div>\\n' +
'    </div>\\n' +
'    <div class="space-y-2">\\n' +
'      <h1 class="text-2xl font-bold tracking-tight text-emerald-400">FahKeu PDF</h1>\\n' +
'      <p id="status-message" class="text-sm text-slate-400 font-medium">Menghubungkan ke database dan mengumpulkan transaksi Anda...</p>\\n' +
'    </div>\\n' +
'    <div id="download-container" class="hidden transition-all duration-300 transform scale-95 opacity-0">\\n' +
'      <button id="download-btn" class="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/10 transition cursor-pointer flex items-center justify-center space-x-2">\\n' +
'        <span>📥</span>\\n' +
'        <span>Unduh File PDF Manual</span>\\n' +
'      </button>\\n' +
'      <p class="text-xs text-slate-500 mt-3">Laporan PDF sudah diunduh secara otomatis. Jika tidak ada respon, silakan klik tombol di atas.</p>\\n' +
'    </div>\\n' +
'    <div class="border-t border-slate-900 pt-4 text-[10px] text-slate-600 font-medium">\\n' +
'      Laporan Keuangan Otomatis FahKeu — by Faiz_Fahmi_Id since 2026\\n' +
'    </div>\\n' +
'  </div>\\n' +
'  <script>\\n' +
'    const transactions = JSON_DATA_HERE;\\n' +
'    const periodTitle = "PERIOD_TITLE_HERE";\\n' +
'    function formatRupiah(amount) {\\n' +
'      const str = Math.round(amount).toString();\\n' +
'      let result = "";\\n' +
'      let count = 0;\\n' +
'      for (let i = str.length - 1; i >= 0; i--) {\\n' +
'        result = str.charAt(i) + result;\\n' +
'        count++;\\n' +
'        if (count % 3 === 0 && i !== 0) {\\n' +
'          result = "." + result;\\n' +
'        }\\n' +
'      }\\n' +
'      return "Rp " + result;\\n' +
'    }\\n' +
'    function generateAndDownload() {\\n' +
'      try {\\n' +
'        const { jsPDF } = window.jspdf;\\n' +
'        const doc = new jsPDF({\\n' +
'          orientation: \\'portrait\\',\\n' +
'          unit: \\'mm\\',\\n' +
'          format: \\'a4\\',\\n' +
'        });\\n' +
'        const pageWidth = doc.internal.pageSize.getWidth();\\n' +
'        const pageHeight = doc.internal.pageSize.getHeight();\\n' +
'        const margin = 15;\\n' +
'        const contentWidth = pageWidth - margin * 2;\\n' +
'        let currentY = 15;\\n' +
'        function drawFooter(pdf, w, h, m) {\\n' +
'          pdf.saveGraphicsState();\\n' +
'          pdf.setFont(\\'helvetica\\', \\'italic\\');\\n' +
'          pdf.setFontSize(8);\\n' +
'          pdf.setTextColor(148, 163, 184);\\n' +
'          pdf.setDrawColor(241, 245, 249);\\n' +
'          pdf.line(m, h - 12, w - m, h - 12);\\n' +
'          pdf.text(\\'Laporan Keuangan Otomatis FahKeu — by Faiz_Fahmi_Id since 2026\\', m, h - 8);\\n' +
'          const pageNum = pdf.getNumberOfPages();\\n' +
'          pdf.text("Halaman " + pageNum, w - m - pdf.getTextWidth("Halaman " + pageNum), h - 8);\\n' +
'          pdf.restoreGraphicsState();\\n' +
'        }\\n' +
'        function checkPageOverflow(heightNeeded, isTableSection) {\\n' +
'          if (currentY + heightNeeded > pageHeight - 15) {\\n' +
'            doc.addPage();\\n' +
'            currentY = 15;\\n' +
'            drawFooter(doc, pageWidth, pageHeight, margin);\\n' +
'            if (isTableSection) {\\n' +
'              drawTableHeader(currentY);\\n' +
'              currentY += 8;\\n' +
'            }\\n' +
'            return true;\\n' +
'          }\\n' +
'          return false;\\n' +
'        }\\n' +
'        doc.setFillColor(15, 23, 42);\\n' +
'        doc.rect(0, 0, pageWidth, 5, \\'F\\');\\n' +
'        currentY = 14;\\n' +
'        doc.setFillColor(16, 185, 129);\\n' +
'        doc.roundedRect(margin, currentY - 5, 8, 8, 1.5, 1.5, \\'F\\');\\n' +
'        doc.setFont(\\'helvetica\\', \\'bold\\');\\n' +
'        doc.setFontSize(10);\\n' +
'        doc.setTextColor(255, 255, 255);\\n' +
'        doc.text(\\'FK\\', margin + 1.5, currentY + 0.5);\\n' +
'        doc.setFont(\\'helvetica\\', \\'bold\\');\\n' +
'        doc.setFontSize(20);\\n' +
'        doc.setTextColor(15, 23, 42);\\n' +
'        doc.text(\\'FahKeu\\', margin + 11, currentY + 1.5);\\n' +
'        doc.setFont(\\'helvetica\\', \\'normal\\');\\n' +
'        doc.setFontSize(7.5);\\n' +
'        doc.setTextColor(100, 116, 139);\\n' +
'        doc.text(\\'PENCATAT KEUANGAN PINTAR & INTERAKTIF\\', margin, currentY + 6.5);\\n' +
'        const filterStr = "PERIODE REKAP: " + periodTitle.toUpperCase();\\n' +
'        doc.setFont(\\'helvetica\\', \\'bold\\');\\n' +
'        doc.setFontSize(9);\\n' +
'        doc.setTextColor(15, 23, 42);\\n' +
'        doc.text(filterStr, pageWidth - margin - doc.getTextWidth(filterStr), currentY - 1);\\n' +
'        const dateStr = "Tanggal Cetak: " + new Date().toLocaleDateString(\\'id-ID\\', {\\n' +
'          day: \\'2-digit\\',\\n' +
'          month: \\'long\\',\\n' +
'          year: \\'numeric\\',\\n' +
'          hour: \\'2-digit\\',\\n' +
'          minute: \\'2-digit\\',\\n' +
'        }) + " WIB";\\n' +
'        doc.setFont(\\'helvetica\\', \\'normal\\');\\n' +
'        doc.setFontSize(7.5);\\n' +
'        doc.setTextColor(100, 116, 139);\\n' +
'        doc.text(dateStr, pageWidth - margin - doc.getTextWidth(dateStr), currentY + 3.5);\\n' +
'        currentY += 10;\\n' +
'        doc.setDrawColor(226, 232, 240);\\n' +
'        doc.setLineWidth(0.5);\\n' +
'        doc.line(margin, currentY, pageWidth - margin, currentY);\\n' +
'        currentY += 8;\\n' +
'        const sortedTransactions = [...transactions].sort(function(a, b) {\\n' +
'          return new Date(a.date).getTime() - new Date(b.date).getTime();\\n' +
'        });\\n' +
'        let totalIncome = 0;\\n' +
'        let totalExpense = 0;\\n' +
'        sortedTransactions.forEach(function(t) {\\n' +
'          if (t.type === \\'pemasukan\\') {\\n' +
'            totalIncome += t.amount;\\n' +
'          } else {\\n' +
'            totalExpense += t.amount;\\n' +
'          }\\n' +
'        });\\n' +
'        const balance = totalIncome - totalExpense;\\n' +
'        doc.setFont(\\'helvetica\\', \\'bold\\');\\n' +
'        doc.setFontSize(11);\\n' +
'        doc.setTextColor(15, 23, 42);\\n' +
'        doc.text(\\'RINGKASAN LAPORAN KEUANGAN\\', margin, currentY);\\n' +
'        currentY += 4;\\n' +
'        const cardWidth = contentWidth / 3 - 3;\\n' +
'        const cardHeight = 22;\\n' +
'        const card1X = margin;\\n' +
'        doc.setFillColor(248, 250, 252);\\n' +
'        doc.setDrawColor(226, 232, 240);\\n' +
'        doc.roundedRect(card1X, currentY, cardWidth, cardHeight, 3, 3, \\'FD\\');\\n' +
'        doc.setFillColor(79, 70, 229);\\n' +
'        doc.rect(card1X, currentY, 1.5, cardHeight, \\'F\\');\\n' +
'        doc.setFont(\\'helvetica\\', \\'normal\\');\\n' +
'        doc.setFontSize(7.5);\\n' +
'        doc.setTextColor(100, 116, 139);\\n' +
'        doc.text(\\'SISA SALDO\\', card1X + 4, currentY + 6);\\n' +
'        doc.setFont(\\'helvetica\\', \\'bold\\');\\n' +
'        doc.setFontSize(11);\\n' +
'        doc.setTextColor(15, 23, 42);\\n' +
'        doc.text(formatRupiah(balance), card1X + 4, currentY + 14);\\n' +
'        const card2X = margin + cardWidth + 4.5;\\n' +
'        doc.setFillColor(248, 250, 252);\\n' +
'        doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 3, 3, \\'FD\\');\\n' +
'        doc.setFillColor(16, 185, 129);\\n' +
'        doc.rect(card2X, currentY, 1.5, cardHeight, \\'F\\');\\n' +
'        doc.setFont(\\'helvetica\\', \\'normal\\');\\n' +
'        doc.setFontSize(7.5);\\n' +
'        doc.setTextColor(100, 116, 139);\\n' +
'        doc.text(\\'TOTAL PEMASUKAN\\', card2X + 4, currentY + 6);\\n' +
'        doc.setFont(\\'helvetica\\', \\'bold\\');\\n' +
'        doc.setFontSize(11);\\n' +
'        doc.setTextColor(16, 185, 129);\\n' +
'        doc.text("+ " + formatRupiah(totalIncome), card2X + 4, currentY + 14);\\n' +
'        const card3X = margin + (cardWidth * 2) + 9;\\n' +
'        doc.setFillColor(248, 250, 252);\\n' +
'        doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 3, 3, \\'FD\\');\\n' +
'        doc.setFillColor(244, 63, 94);\\n' +
'        doc.rect(card3X, currentY, 1.5, cardHeight, \\'F\\');\\n' +
'        doc.setFont(\\'helvetica\\', \\'normal\\');\\n' +
'        doc.setFontSize(7.5);\\n' +
'        doc.setTextColor(100, 116, 139);\\n' +
'        doc.text(\\'TOTAL PENGELUARAN\\', card3X + 4, currentY + 6);\\n' +
'        doc.setFont(\\'helvetica\\', \\'bold\\');\\n' +
'        doc.setFontSize(11);\\n' +
'        doc.setTextColor(225, 29, 72);\\n' +
'        doc.text("- " + formatRupiah(totalExpense), card3X + 4, currentY + 14);\\n' +
'        currentY += cardHeight + 10;\\n' +
'        doc.setFont(\\'helvetica\\', \\'bold\\');\\n' +
'        doc.setFontSize(11);\\n' +
'        doc.setTextColor(15, 23, 42);\\n' +
'        doc.text(\\'RIWAYAT TRANSAKSI LENGKAP (\\' + sortedTransactions.length + \\' item)\\', margin, currentY);\\n' +
'        currentY += 5;\\n' +
'        const colWidths = {\\n' +
'          no: 8,\\n' +
'          tanggal: 32,\\n' +
'          tipe: 22,\\n' +
'          kategori: 26,\\n' +
'          deskripsi: 54,\\n' +
'          nominal: 38,\\n' +
'        };\\n' +
'        function drawTableHeader(y) {\\n' +
'          doc.setFillColor(15, 23, 42);\\n' +
'          doc.rect(margin, y, contentWidth, 8, \\'F\\');\\n' +
'          doc.setFont(\\'helvetica\\', \\'bold\\');\\n' +
'          doc.setFontSize(8.5);\\n' +
'          doc.setTextColor(255, 255, 255);\\n' +
'          let currentX = margin;\\n' +
'          doc.text(\\'No\\', currentX + 2, y + 5.5);\\n' +
'          currentX += colWidths.no;\\n' +
'          doc.text(\\'Tanggal & Waktu\\', currentX + 2, y + 5.5);\\n' +
'          currentX += colWidths.tanggal;\\n' +
'          doc.text(\\'Jenis Aliran\\', currentX + 2, y + 5.5);\\n' +
'          currentX += colWidths.tipe;\\n' +
'          doc.text(\\'Kategori\\', currentX + 2, y + 5.5);\\n' +
'          currentX += colWidths.kategori;\\n' +
'          doc.text(\\'Deskripsi / Catatan\\', currentX + 2, y + 5.5);\\n' +
'          currentX += colWidths.deskripsi;\\n' +
'          doc.text(\\'Nominal (Rp)\\', currentX + colWidths.nominal - doc.getTextWidth(\\'Nominal (Rp)\\') - 2, y + 5.5);\\n' +
'        }\\n' +
'        drawTableHeader(currentY);\\n' +
'        currentY += 8;\\n' +
'        if (sortedTransactions.length === 0) {\\n' +
'          doc.setFillColor(248, 250, 252);\\n' +
'          doc.rect(margin, currentY, contentWidth, 12, \\'F\\');\\n' +
'          doc.setDrawColor(226, 232, 240);\\n' +
'          doc.rect(margin, currentY, contentWidth, 12, \\'D\\');\\n' +
'          doc.setFont(\\'helvetica\\', \\'italic\\');\\n' +
'          doc.setFontSize(9);\\n' +
'          doc.setTextColor(148, 163, 184);\\n' +
'          doc.text(\\'Tidak ada data transaksi pada periode ini.\\', pageWidth / 2, currentY + 7.5, { align: \\'center\\' });\\n' +
'          currentY += 12;\\n' +
'        } else {\\n' +
'          doc.setFont(\\'helvetica\\', \\'normal\\');\\n' +
'          doc.setFontSize(8);\\n' +
'          sortedTransactions.forEach(function(t, index) {\\n' +
'            const dateObj = new Date(t.date);\\n' +
'            const formattedDate = dateObj.toLocaleDateString(\\'id-ID\\', {\\n' +
'              day: \\'2-digit\\',\\n' +
'              month: \\'short\\',\\n' +
'              year: \\'numeric\\',\\n' +
'            }) + \\' \\' + dateObj.toLocaleTimeString(\\'id-ID\\', {\\n' +
'              hour: \\'2-digit\\',\\n' +
'              minute: \\'2-digit\\',\\n' +
'            });\\n' +
'            const splitCategory = doc.splitTextToSize(t.category || \\'-\\', colWidths.kategori - 4);\\n' +
'            const splitDesc = doc.splitTextToSize(t.description || \\'-\\', colWidths.deskripsi - 4);\\n' +
'            const numLines = Math.max(1, splitCategory.length, splitDesc.length);\\n' +
'            const rowHeight = 6 + (numLines * 3.5);\\n' +
'            checkPageOverflow(rowHeight, true);\\n' +
'            if (index % 2 === 0) {\\n' +
'              doc.setFillColor(255, 255, 255);\\n' +
'            } else {\\n' +
'              doc.setFillColor(248, 250, 252);\\n' +
'            }\\n' +
'            doc.rect(margin, currentY, contentWidth, rowHeight, \\'F\\');\\n' +
'            doc.setDrawColor(241, 245, 249);\\n' +
'            doc.setLineWidth(0.3);\\n' +
'            doc.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);\\n' +
'            let currentX = margin;\\n' +
'            doc.setTextColor(51, 65, 85);\\n' +
'            doc.text((index + 1).toString(), currentX + 2, currentY + 5.5);\\n' +
'            currentX += colWidths.no;\\n' +
'            doc.text(formattedDate, currentX + 2, currentY + 5.5);\\n' +
'            currentX += colWidths.tanggal;\\n' +
'            if (t.type === \\'pemasukan\\') {\\n' +
'              doc.setTextColor(16, 185, 129);\\n' +
'              doc.setFont(\\'helvetica\\', \\'bold\\');\\n' +
'              doc.text(\\'PEMASUKAN\\', currentX + 2, currentY + 5.5);\\n' +
'            } else {\\n' +
'              doc.setTextColor(225, 29, 72);\\n' +
'              doc.setFont(\\'helvetica\\', \\'bold\\');\\n' +
'              doc.text(\\'PENGELUARAN\\', currentX + 2, currentY + 5.5);\\n' +
'            }\\n' +
'            doc.setFont(\\'helvetica\\', \\'normal\\');\\n' +
'            doc.setTextColor(51, 65, 85);\\n' +
'            currentX += colWidths.tipe;\\n' +
'            splitCategory.forEach(function(line, i) {\\n' +
'              doc.text(line, currentX + 2, currentY + 5.5 + (i * 3.5));\\n' +
'            });\\n' +
'            currentX += colWidths.kategori;\\n' +
'            splitDesc.forEach(function(line, i) {\\n' +
'              doc.text(line, currentX + 2, currentY + 5.5 + (i * 3.5));\\n' +
'            });\\n' +
'            currentX += colWidths.deskripsi;\\n' +
'            const amountSign = t.type === \\'pemasukan\\' ? \\'+\\' : \\'-\\';\\n' +
'            const amountVal = amountSign + " Rp " + t.amount.toLocaleString(\\'id-ID\\');\\n' +
'            if (t.type === \\'pemasukan\\') {\\n' +
'              doc.setTextColor(5, 150, 105);\\n' +
'              doc.setFont(\\'helvetica\\', \\'bold\\');\\n' +
'            } else {\\n' +
'              doc.setTextColor(220, 38, 38);\\n' +
'              doc.setFont(\\'helvetica\\', \\'bold\\');\\n' +
'            }\\n' +
'            doc.text(amountVal, currentX + colWidths.nominal - doc.getTextWidth(amountVal) - 2, currentY + 5.5);\\n' +
'            doc.setFont(\\'helvetica\\', \\'normal\\');\\n' +
'            currentY += rowHeight;\\n' +
'          });\\n' +
'        }\\n' +
'        drawFooter(doc, pageWidth, pageHeight, margin);\\n' +
'        const sanitizedPeriod = periodTitle.toLowerCase().replace(/\\\\s+/g, \\'_\\');\\n' +
'        doc.save(\\'fahkeu_rekap_\\' + sanitizedPeriod + \\'_\\' + new Date().toISOString().split(\\'T\\')[0] + \\'.pdf\\');\\n' +
'        document.getElementById(\\'spinner\\').classList.add(\\'hidden\\');\\n' +
'        document.getElementById(\\'success-icon\\').classList.remove(\\'hidden\\');\\n' +
'        document.getElementById(\\'status-message\\').innerText = "Selesai! Laporan PDF Anda berhasil diunduh secara otomatis.";\\n' +
'        document.getElementById(\\'status-message\\').classList.remove(\\'text-slate-400\\');\\n' +
'        document.getElementById(\\'status-message\\').classList.add(\\'text-emerald-400\\');\\n' +
'        document.getElementById(\\'download-container\\').classList.remove(\\'hidden\\');\\n' +
'        setTimeout(() => {\\n' +
'          document.getElementById(\\'download-container\\').classList.remove(\\'scale-95\\', \\'opacity-0\\');\\n' +
'        }, 100);\\n' +
'      } catch (e) {\\n' +
'        document.getElementById(\\'status-message\\').innerText = "Gagal membuat PDF: " + e.toString();\\n' +
'        document.getElementById(\\'status-message\\').classList.add(\\'text-rose-500\\');\\n' +
'      }\\n' +
'    }\\n' +
'    document.getElementById(\\'download-btn\\').addEventListener(\\'click\\', function() {\\n' +
'      generateAndDownload();\\n' +
'    });\\n' +
'    window.addEventListener(\\'DOMContentLoaded\\', function() {\\n' +
'      setTimeout(function() {\\n' +
'        document.getElementById(\\'status-message\\').innerText = "Mengompilasi desain laporan dan mengekspor ke berkas PDF...";\\n' +
'        setTimeout(function() {\\n' +
'          generateAndDownload();\\n' +
'        }, 800);\\n' +
'      }, 1000);\\n' +
'    });\\n' +
'  </script>\\n' +
'</body>\\n' +
'</html>';

  return htmlString
    .replace('JSON_DATA_HERE', JSON.stringify(transactions))
    .replace('PERIOD_TITLE_HERE', periodTitle);
}

function dummyReferences() {
  // Dipanggil agar Apps Script otomatis mendeteksi scope Google Drive & Google Docs
  try {
    DriveApp.getRootFolder();
    DocumentApp.create("Dummy_OCR");
  } catch (e) {}
}
`;
