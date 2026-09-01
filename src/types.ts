export interface Transaction {
  id: string;
  date: string; // ISO String
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  description: string;
  category: string;
  source: 'web' | 'telegram';
}

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string; // HH:MM
  parsedTransaction?: {
    type: 'pemasukan' | 'pengeluaran';
    amount: number;
    description: string;
    category: string;
    feedback: string;
    balanceAfter: number;
  };
  isPdfSelector?: boolean;
  pdfDownloadUrl?: string;
  pdfPeriod?: string;
}

export interface AppSettings {
  googleSheetUrl: string; // Apps Script Web App URL
  telegramBotToken: string;
  telegramChatId: string;
  useCloudStorage: boolean;
}

export interface OfflineAction {
  id: string;
  action: 'add' | 'delete' | 'clear';
  transaction?: Transaction;
  transactionId?: string;
}

export interface CategoryConfig {
  name: string;
  color: string;
  keywords: string[];
  icon: string; // Lucide icon name
}
