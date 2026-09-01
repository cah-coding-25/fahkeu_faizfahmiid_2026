/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, BarChart3, Settings, Bot, RefreshCw, Smartphone, Laptop, Coins } from 'lucide-react';
import { Transaction, Message, AppSettings, OfflineAction } from './types';
import { parseTransactionText, formatRupiah } from './utils/parser';
import { generatePDFReport } from './utils/pdfGenerator';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import SettingsPanel from './components/SettingsPanel';

// High quality initial seed data in Indonesian
const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 'seed_1',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    type: 'pemasukan',
    amount: 7500000,
    description: 'Gaji Bulanan',
    category: 'Gaji & Pendapatan Tetap',
    source: 'web',
  },
  {
    id: 'seed_2',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    type: 'pengeluaran',
    amount: 1500000,
    description: 'Bayar Kosan',
    category: 'Tagihan & Utilitas',
    source: 'web',
  },
  {
    id: 'seed_3',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    type: 'pengeluaran',
    amount: 650000,
    description: 'Belanja Bulanan Supermarket',
    category: 'Belanja & Pribadi',
    source: 'web',
  },
  {
    id: 'seed_4',
    date: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(), // 1.5 days ago
    type: 'pengeluaran',
    amount: 35000,
    description: 'Makan Bakso Lapangan Tembak',
    category: 'Makanan & Minuman',
    source: 'telegram',
  },
  {
    id: 'seed_5',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    type: 'pemasukan',
    amount: 1200000,
    description: 'Freelance Landing Page UMKM',
    category: 'Freelance & Sampingan',
    source: 'web',
  },
  {
    id: 'seed_6',
    date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    type: 'pengeluaran',
    amount: 25000,
    description: 'Kopi Susu Aren',
    category: 'Makanan & Minuman',
    source: 'telegram',
  },
  {
    id: 'seed_7',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    type: 'pengeluaran',
    amount: 50000,
    description: 'Isi Bensin Motor',
    category: 'Transportasi',
    source: 'web',
  },
];

const SEED_MESSAGES: Message[] = [
  {
    id: 'msg_1',
    sender: 'bot',
    text: '👋 Halo! Saya **Bot FahKeu**. Saya di sini untuk membantu Anda mencatat pemasukan dan pengeluaran secara cepat dan menyenangkan!',
    timestamp: '09:00',
  },
  {
    id: 'msg_2',
    sender: 'bot',
    text: 'Anda cukup mengetik transaksi dalam bahasa alami, misalnya:\n✍️ *gaji masuk 3juta*\n✍️ *bakso 15k*\n✍️ *bayar internet 150.000*\n\nSaya akan secara otomatis merekam transaksi, mengategorikannya, dan menampilkan saldo keuangan Anda saat ini!',
    timestamp: '09:01',
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  googleSheetUrl: '',
  telegramBotToken: '',
  telegramChatId: '',
  useCloudStorage: false,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'grafik' | 'pengaturan'>('chat');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  const [isTyping, setIsTyping] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');
  const [isDesktopOrTablet, setIsDesktopOrTablet] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'luxury-gold'>(() => {
    return (localStorage.getItem('catatkeu_theme') as any) || 'light';
  });

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'luxury-gold');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'luxury-gold') {
      root.classList.add('dark', 'luxury-gold');
    }
    localStorage.setItem('catatkeu_theme', theme);
  }, [theme]);

  // Responsive layout detection (Desktop / Tablet)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    setIsDesktopOrTablet(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsDesktopOrTablet(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Load Settings & Data on Mount
  useEffect(() => {
    // 1. Settings
    const storedSettings = localStorage.getItem('catatkeu_settings');
    let parsedSettings = DEFAULT_SETTINGS;
    if (storedSettings) {
      try {
        parsedSettings = JSON.parse(storedSettings);
        setSettings(parsedSettings);
      } catch (e) {
        console.error('Failed to parse settings');
      }
    }

    // 2. Chat history
    const storedMessages = localStorage.getItem('catatkeu_chat_history');
    if (storedMessages) {
      try {
        setMessages(JSON.parse(storedMessages));
      } catch (e) {
        setMessages(SEED_MESSAGES);
      }
    } else {
      setMessages(SEED_MESSAGES);
    }

    // 3. Transactions
    const storedTrans = localStorage.getItem('catatkeu_transactions');
    if (storedTrans) {
      try {
        setTransactions(JSON.parse(storedTrans));
      } catch (e) {
        setTransactions([]);
      }
    } else {
      setTransactions([]);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('catatkeu_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('catatkeu_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Sync data automatically if Sheets URL is configured
  useEffect(() => {
    if (settings.googleSheetUrl && settings.useCloudStorage) {
      syncWithGoogleSheets();
    }
  }, [settings.googleSheetUrl, settings.useCloudStorage]);

  // Calculate Cumulative Balance
  const totalBalance = useMemo(() => {
    return transactions.reduce((acc, curr) => {
      if (curr.type === 'pemasukan') {
        return acc + curr.amount;
      } else {
        return acc - curr.amount;
      }
    }, 0);
  }, [transactions]);

  // Get current time formatted (HH:MM)
  const getCurrentTime = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const [isSyncingOffline, setIsSyncingOffline] = useState(false);

  // Helper to add an action to offline queue
  const queueOfflineAction = (action: Omit<OfflineAction, 'id'>) => {
    const storedQueue = localStorage.getItem('catatkeu_offline_queue');
    let queue: OfflineAction[] = [];
    if (storedQueue) {
      try {
        queue = JSON.parse(storedQueue);
      } catch (e) {
        queue = [];
      }
    }
    const newAction: OfflineAction = {
      ...action,
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    };
    queue.push(newAction);
    localStorage.setItem('catatkeu_offline_queue', JSON.stringify(queue));
  };

  // Helper to process any pending offline transactions when we go online
  const processOfflineQueue = async () => {
    if (!settings.googleSheetUrl || !settings.useCloudStorage || isSyncingOffline) return;

    const storedQueue = localStorage.getItem('catatkeu_offline_queue');
    if (!storedQueue) return;

    let queue: OfflineAction[] = [];
    try {
      queue = JSON.parse(storedQueue);
    } catch (e) {
      return;
    }

    if (queue.length === 0) return;

    setIsSyncingOffline(true);
    setSyncStatus('loading');

    const remainingQueue = [...queue];

    try {
      for (const item of queue) {
        let payload: any = null;
        if (item.action === 'add') {
          payload = { action: 'add', transaction: item.transaction };
        } else if (item.action === 'delete') {
          payload = { action: 'delete', id: item.transactionId };
        } else if (item.action === 'clear') {
          payload = { action: 'clear' };
        }

        if (payload) {
          await fetch(settings.googleSheetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }

        // Successfully sent, pop from memory and localStorage
        remainingQueue.shift();
        localStorage.setItem('catatkeu_offline_queue', JSON.stringify(remainingQueue));
      }

      // Refresh data from sheets to align local and sheet state
      await syncWithGoogleSheets();
    } catch (err) {
      console.error('Failed to flush offline queue to cloud:', err);
      setSyncStatus('failed');
    } finally {
      setIsSyncingOffline(false);
    }
  };

  // Process offline queue on mount or when online event is triggered
  useEffect(() => {
    const handleOnline = () => {
      console.log('Online detected. Syncing offline data...');
      processOfflineQueue();
    };

    window.addEventListener('online', handleOnline);

    if (navigator.onLine) {
      processOfflineQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [settings.googleSheetUrl, settings.useCloudStorage, isSyncingOffline]);

  // Sync / Fetch Transactions from Google Sheets Web App
  const syncWithGoogleSheets = async () => {
    if (!settings.googleSheetUrl) return;
    setSyncStatus('loading');
    try {
      // Simple fetch GET request pulls data as JSON
      const res = await fetch(settings.googleSheetUrl);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTransactions(data.data);
        setSyncStatus('success');
      } else {
        setSyncStatus('failed');
      }
    } catch (err) {
      console.error('Error syncing with sheets:', err);
      setSyncStatus('failed');
    }
  };

  // Handles adding transaction to local + cloud
  const handleAddTransaction = async (newT: Transaction) => {
    // 1. Snappy Local Update
    const updated = [newT, ...transactions];
    setTransactions(updated);

    // 2. Cloud Update if enabled
    if (settings.googleSheetUrl && settings.useCloudStorage) {
      try {
        await fetch(settings.googleSheetUrl, {
          method: 'POST',
          mode: 'no-cors', // bypass CORS preflight restrictions beautifully for script.google.com
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add',
            transaction: newT,
          }),
        });
      } catch (err) {
        console.error('Failed to post transaction to cloud, queuing for offline sync:', err);
        queueOfflineAction({ action: 'add', transaction: newT });
      }
    }
  };

  // Handles deleting single transaction
  const handleDeleteTransaction = async (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));

    if (settings.googleSheetUrl && settings.useCloudStorage) {
      try {
        await fetch(settings.googleSheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete',
            id,
          }),
        });
      } catch (err) {
        console.error('Failed to delete transaction on cloud, queuing for offline sync:', err);
        queueOfflineAction({ action: 'delete', transactionId: id });
      }
    }
  };

  // Handles deleting multiple transactions
  const handleDeleteMultipleTransactions = async (ids: string[]) => {
    setTransactions(prev => prev.filter((t) => !ids.includes(t.id)));

    if (settings.googleSheetUrl && settings.useCloudStorage) {
      try {
        await Promise.all(
          ids.map(id =>
            fetch(settings.googleSheetUrl, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'delete',
                id,
              }),
            })
          )
        );
      } catch (err) {
        console.error('Failed to batch delete transactions on cloud, queuing for offline sync:', err);
        ids.forEach(id => {
          queueOfflineAction({ action: 'delete', transactionId: id });
        });
      }
    }
  };

  // Handles clearing all data
  const handleClearTransactions = async () => {
    setTransactions([]);
    localStorage.removeItem('catatkeu_transactions');

    if (settings.googleSheetUrl && settings.useCloudStorage) {
      try {
        await fetch(settings.googleSheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'clear',
          }),
        });
      } catch (err) {
        console.error('Failed to clear transactions on cloud, queuing for offline sync:', err);
        queueOfflineAction({ action: 'clear' });
      }
    }
  };

  // Handles clearing chat history
  const handleClearChat = () => {
    setMessages([]);
    localStorage.setItem('catatkeu_chat_history', JSON.stringify([]));
  };

  // Handles directly recorded transactions (e.g. from receipt OCR scan)
  const handleDirectTransaction = (tx: {
    type: 'pemasukan' | 'pengeluaran';
    amount: number;
    description: string;
    category: string;
  }) => {
    const newTransaction: Transaction = {
      id: `tx_${Date.now()}`,
      date: new Date().toISOString(),
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      category: tx.category,
      source: 'web',
    };

    handleAddTransaction(newTransaction);

    const userMsgId = `msg_${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text: `🧾 Mengunggah struk/nota: "${tx.description}"`,
      timestamp: getCurrentTime(),
    };

    const balanceAfter = totalBalance + (tx.type === 'pemasukan' ? tx.amount : -tx.amount);
    const botMsgId = `msg_${Date.now() + 1}`;
    const feedbackWord = tx.type === 'pemasukan' ? 'pemasukan' : 'pengeluaran';
    const detailFeedbackWord = tx.type === 'pemasukan' ? 'uang masuk' : 'uang keluar';
    const botMsg: Message = {
      id: botMsgId,
      sender: 'bot',
      text: `Hasil scan struk berhasil dicatat! 🧾✨\nAda ${feedbackWord} **${tx.description}** sebesar **${formatRupiah(tx.amount)}** (${tx.category}). Sisa saldo Anda sekarang menjadi **${formatRupiah(balanceAfter)}**.`,
      timestamp: getCurrentTime(),
      parsedTransaction: {
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        category: tx.category,
        feedback: `${detailFeedbackWord} ${formatRupiah(tx.amount)}`,
        balanceAfter: balanceAfter,
      }
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  // Generate PDF report for selected period and trigger download
  const handleGeneratePDFReport = (period: 'all' | 'week' | 'month' | 'year') => {
    let filtered = [...transactions];
    let periodName = 'Semua Transaksi';

    if (period === 'week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = transactions.filter(t => new Date(t.date) >= sevenDaysAgo);
      periodName = '7 Hari Terakhir (Minggu Ini)';
    } else if (period === 'month') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
      periodName = '30 Hari Terakhir (Bulan Ini)';
    } else if (period === 'year') {
      const currentYear = new Date().getFullYear();
      filtered = transactions.filter(t => new Date(t.date).getFullYear() === currentYear);
      periodName = `Tahun ${currentYear}`;
    }

    generatePDFReport(filtered, periodName);

    const successReply: Message = {
      id: `msg_pdf_ok_${Date.now()}`,
      sender: 'bot',
      text: `✅ **Laporan PDF Berhasil Dibuat!**\n\nRekapitulasi untuk periode **${periodName}** (${filtered.length} transaksi) berhasil diunduh secara otomatis ke perangkat Anda.\n\n_Jika unduhan tidak berjalan otomatis, silakan klik tombol unduh di bawah ini:_`,
      timestamp: getCurrentTime(),
      pdfPeriod: period,
    };
    
    setMessages((prev) => [...prev, successReply]);
  };

  // Handles user messages sent from Chat component
  const handleUserMessage = (text: string) => {
    const cleanText = text.toLowerCase().trim();

    // Check if user wants to clear the chat via message command
    if (
      cleanText === 'hapus chat' ||
      cleanText === 'bersihkan chat' ||
      cleanText === 'hapus riwayat' ||
      cleanText === 'hapus semua chat' ||
      cleanText === 'clear chat' ||
      cleanText === 'hapus semua'
    ) {
      handleClearChat();
      return;
    }

    const userMsgId = `msg_${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: getCurrentTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Handle bot reply after 800ms
    setTimeout(() => {
      setIsTyping(false);
      const cleanText = text.toLowerCase().trim();

      // Check if user just queried for balance
      if (cleanText === 'sisa saldo' || cleanText === 'saldo' || cleanText === 'cek saldo') {
        const income = transactions.filter(t => t.type === 'pemasukan').reduce((a, b) => a + b.amount, 0);
        const expense = transactions.filter(t => t.type === 'pengeluaran').reduce((a, b) => a + b.amount, 0);
        
        const balanceReply: Message = {
          id: `msg_${Date.now()}`,
          sender: 'bot',
          text: `📊 **Status Keuangan Anda saat ini:**\n\n• Sisa Saldo: **${formatRupiah(totalBalance)}**\n• Total Pemasukan: ${formatRupiah(income)}\n• Total Pengeluaran: ${formatRupiah(expense)}`,
          timestamp: getCurrentTime(),
        };
        setMessages((prev) => [...prev, balanceReply]);
        return;
      }

      // Check if user is asking for PDF / rekapitulasi download
      const pdfTriggers = [
        'download rekap', 'unduh rekap', 'rekap pdf', 'pdf rekap', 
        'rekap keuangan', 'laporan keuangan', 'export pdf', 'pdf report', 
        'download laporan', 'unduh laporan', 'rekap bulanan', 'rekap harian',
        'pdf rekapitulasi', 'cetak rekap', 'download pdf', 'cetak pdf', 'buat pdf',
        'rekap minggu', 'rekap tahun', 'rekap'
      ];
      const matchesPdf = pdfTriggers.some(trigger => cleanText.includes(trigger)) || 
                          (cleanText.includes('pdf') && cleanText.includes('unduh')) || 
                          (cleanText.includes('rekap') && cleanText.includes('cetak'));

      if (matchesPdf) {
        const pdfSelectorReply: Message = {
          id: `msg_pdf_sel_${Date.now()}`,
          sender: 'bot',
          text: `📄 **Laporan Keuangan PDF (FahKeu)**\n\nSaya dapat membuatkan berkas laporan PDF rekapitulasi transaksi Anda secara otomatis, rapi, dan aman.\n\nSilakan tentukan jangka waktu data transaksi yang ingin Anda masukkan ke dalam laporan PDF:`,
          timestamp: getCurrentTime(),
          isPdfSelector: true,
        };
        setMessages((prev) => [...prev, pdfSelectorReply]);
        return;
      }

      // Parse Transaction
      const parsed = parseTransactionText(text);

      if (!parsed.success) {
        const errorReply: Message = {
          id: `msg_${Date.now()}`,
          sender: 'bot',
          text: `⚠️ Maaf, saya tidak dapat memahami format transaksi tersebut.\n\nPastikan Anda menyertakan keterangan dan nominal uang, misalnya:\n• _gaji masuk 3juta_\n• _bakso 15k_`,
          timestamp: getCurrentTime(),
        };
        setMessages((prev) => [...prev, errorReply]);
        return;
      }

      // Generate New Transaction
      const newTransaction: Transaction = {
        id: `tx_${Date.now()}`,
        date: new Date().toISOString(),
        type: parsed.type,
        amount: parsed.amount,
        description: parsed.description,
        category: parsed.category,
        source: 'web',
      };

      // Add to database
      handleAddTransaction(newTransaction);

      // Compute balance after
      const balanceAfter = totalBalance + (parsed.type === 'pemasukan' ? parsed.amount : -parsed.amount);

      // Generate Bot Success Message
      const feedbackWord = parsed.type === 'pemasukan' ? 'uang masuk' : 'uang keluar';
      const botReply: Message = {
        id: `msg_${Date.now()}`,
        sender: 'bot',
        text: `Terima kasih, sudah tercatat! 💰\nAda ${feedbackWord} ${formatRupiah(parsed.amount)}, sisa saldo Anda sekarang menjadi ${formatRupiah(balanceAfter)}.`,
        timestamp: getCurrentTime(),
        parsedTransaction: {
          type: parsed.type,
          amount: parsed.amount,
          description: parsed.description,
          category: parsed.category,
          feedback: `${feedbackWord} ${formatRupiah(parsed.amount)}`,
          balanceAfter,
        },
      };

      setMessages((prev) => [...prev, botReply]);
    }, 800);
  };

  // Handles updating credentials settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('catatkeu_settings', JSON.stringify(newSettings));
  };

  // Test Web App connectivity
  const handleTestConnection = async (): Promise<boolean> => {
    if (!settings.googleSheetUrl) return false;
    try {
      const res = await fetch(settings.googleSheetUrl);
      const data = await res.json();
      return !!data.success;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const getTabClass = (tab: 'chat' | 'grafik' | 'pengaturan') => {
    const isActive = activeTab === tab;
    if (isActive) {
      if (theme === 'luxury-gold') {
        return 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.45)] font-black scale-105';
      }
      return 'bg-emerald-500 text-slate-950 font-bold';
    }
    return 'text-slate-300 hover:text-white hover:bg-slate-700/50';
  };

  return (
    <div className={`flex flex-col h-screen bg-slate-100 dark:bg-slate-900 font-sans ${theme === 'luxury-gold' ? 'luxury-gold' : ''}`}>
      
      {/* Top Navbar */}
      <header className={`bg-slate-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between border-b shadow-sm shrink-0 ${
        theme === 'luxury-gold' ? 'border-amber-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)]' : 'border-slate-800'
      }`}>
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative ${
            theme === 'luxury-gold'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
              : 'bg-emerald-500'
          }`}>
            <div className="relative w-6.5 h-6.5 flex items-center justify-center">
              <Bot className={`w-4.5 h-4.5 absolute top-0.5 left-0.5 ${theme === 'luxury-gold' ? 'text-slate-950' : 'text-white'}`} />
              <Coins className={`w-3.5 h-3.5 absolute -bottom-0.5 -right-0.5 ${
                theme === 'luxury-gold' ? 'text-amber-950' : 'text-amber-300 dark:text-amber-400'
              } drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.45)]`} />
            </div>
          </div>
          <div className="truncate">
            <h1 className="text-base font-bold tracking-tight text-white">FahKeu</h1>
            <p className="text-[10px] text-slate-400 font-medium truncate">Pencatat Keuangan AI</p>
          </div>
        </div>

        {/* Header Right Content: Sisa Saldo & Navigation */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Balance Display */}
          <div className={`hidden xs:flex flex-col items-end bg-slate-800/40 px-2.5 py-1 rounded-xl border ${
            theme === 'luxury-gold' ? 'border-amber-500/10' : 'border-slate-700/30'
          }`}>
            <span className="text-[8px] text-slate-400 uppercase tracking-wider font-bold">Saldo</span>
            <span className={`text-xs font-mono font-black ${
              theme === 'luxury-gold' ? 'text-amber-400 font-extrabold' : 'text-emerald-400'
            }`}>
              {formatRupiah(totalBalance)}
            </span>
          </div>

          {/* Navigation Tab Pills */}
          <div className={`flex p-0.5 rounded-xl border ${
            theme === 'luxury-gold' ? 'bg-amber-950/25 border-amber-500/15' : 'bg-slate-800 border-slate-700/40'
          }`}>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${getTabClass('chat')}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('grafik')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${getTabClass('grafik')}`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grafik</span>
            </button>

            <button
              onClick={() => setActiveTab('pengaturan')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${getTabClass('pengaturan')}`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pengaturan</span>
            </button>
          </div>

          {/* Sync Button (If sheet URL set) */}
          {settings.googleSheetUrl && settings.useCloudStorage && (
            <button
              onClick={syncWithGoogleSheets}
              disabled={syncStatus === 'loading'}
              className={`flex items-center justify-center p-2 rounded-xl transition border shrink-0 ${
                theme === 'luxury-gold'
                  ? 'bg-amber-950/40 hover:bg-amber-900/30 border-amber-500/20 text-amber-400 hover:text-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              }`}
              title="Sinkronisasi Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'loading' && 'animate-spin'}`} />
            </button>
          )}
        </div>
      </header>

      {/* Main Single-Panel Content Layout */}
      <div className="flex-1 flex overflow-hidden bg-slate-50 dark:bg-slate-950">
        
        {/* Chat Interface (Centered panel for premium readability) */}
        {activeTab === 'chat' && (
          <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col h-full bg-white dark:bg-slate-950 shadow-sm border-x border-slate-200/50 dark:border-slate-800/50">
            <ChatInterface
              messages={messages}
              onSendMessage={handleUserMessage}
              onClearChat={handleClearChat}
              isTyping={isTyping}
              totalBalance={totalBalance}
              onAddTransactionDirect={handleDirectTransaction}
              onGeneratePDFReport={handleGeneratePDFReport}
            />
          </div>
        )}

        {/* Dashboard/Grafik */}
        {activeTab === 'grafik' && (
          <div className="flex-1 flex flex-col h-full min-w-0">
            <Dashboard
              transactions={transactions}
              onDeleteTransaction={handleDeleteTransaction}
              onDeleteMultipleTransactions={handleDeleteMultipleTransactions}
              onClearTransactions={handleClearTransactions}
            />
          </div>
        )}

        {/* SettingsPanel */}
        {activeTab === 'pengaturan' && (
          <div className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto">
            <SettingsPanel
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onTestConnection={handleTestConnection}
              theme={theme}
              onChangeTheme={setTheme}
            />
          </div>
        )}

      </div>
    </div>
  );
}
