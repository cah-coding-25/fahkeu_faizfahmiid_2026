import { getCategoryAndIcon } from './categories';

interface ParsedReceipt {
  amount: number;
  description: string;
  category: string;
  rawText: string;
}

export function parseReceiptText(text: string): ParsedReceipt {
  const lines = text.split('\n').map(line => line.trim());
  
  let detectedAmount = 0;
  let detectedDescription = 'Belanja Nota';
  let detectedCategory = 'Belanja';

  // 1. Clean and scan for total amounts
  const totalKeywords = [
    'grand total', 'subtotal', 'total', 'jumlah', 'netto', 'nett', 'amount', 
    'bayar', 'cash', 'tunai', 'credit', 'debit', 'total bayar', 'jml'
  ];

  const excludeKeywords = [
    'kembali', 'change', 'diskon', 'discount', 'promo', 'tax', 'pajak', 
    'ppn', 'service', 'ongkir', 'delivery'
  ];

  let potentialAmounts: { value: number; isTotalLine: boolean; lineText: string }[] = [];

  // Helper to extract numeric values from a line
  const extractNumbers = (lineStr: string): number[] => {
    // Replace standard Indonesian thousands separator (dot) if followed by 3 digits, or commas
    // Clean spaces and currency prefixes
    const cleanLine = lineStr.toLowerCase()
      .replace(/rp\.?/g, '')
      .replace(/\s+/g, '');

    // Match numbers with optional decimal/thousands formatting
    // Handles formats like: 150.000, 150000, 12,500, 2.500.000
    const matches = cleanLine.match(/\d+[\d.,]*/g) || [];
    
    return matches.map(m => {
      // If there are multiple dots/commas, it's likely thousands separator.
      // In IDR, decimals are rare except for tax/service, so let's simplify.
      const hasMultipleDots = (m.match(/\./g) || []).length > 1;
      const hasCommas = m.includes(',');
      const hasDots = m.includes('.');

      let numVal = 0;
      if (hasMultipleDots) {
        numVal = parseFloat(m.replace(/\./g, ''));
      } else if (hasCommas && hasDots) {
        // mixed, e.g. 1,250.00 or 1.250,00
        // Strip non-digits and treat the last separator as decimal if it's small,
        // but for IDR we can just clear everything except the main digit grouping
        numVal = parseFloat(m.replace(/[^0-9]/g, ''));
      } else if (hasCommas) {
        // In Indonesia, comma is decimal, dot is thousands. But some machines use english style.
        // Let's check digits after comma. If exactly 3, it's thousands separator.
        const parts = m.split(',');
        if (parts[1] && parts[1].length === 3) {
          numVal = parseFloat(m.replace(/,/g, ''));
        } else {
          // Decimal, let's round or drop decimals
          numVal = parseFloat(parts[0].replace(/\./g, ''));
        }
      } else if (hasDots) {
        const parts = m.split('.');
        if (parts[1] && parts[1].length === 3) {
          numVal = parseFloat(m.replace(/\./g, ''));
        } else {
          numVal = parseFloat(parts[0]);
        }
      } else {
        numVal = parseFloat(m);
      }

      return numVal;
    }).filter(v => v > 100 && v < 10000000); // Filter out too small (cents/quantities) and too large (ID codes)
  };

  // Scan lines
  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    const numbers = extractNumbers(line);

    if (numbers.length > 0) {
      const isTotalLine = totalKeywords.some(kw => lowerLine.includes(kw));
      const isExcludedLine = excludeKeywords.some(kw => lowerLine.includes(kw));

      numbers.forEach(num => {
        potentialAmounts.push({
          value: num,
          isTotalLine: isTotalLine && !isExcludedLine,
          lineText: line
        });
      });
    }
  });

  // Decide the amount
  // Priority 1: High confidence total lines
  const totalLineMatches = potentialAmounts.filter(p => p.isTotalLine);
  if (totalLineMatches.length > 0) {
    // Get the maximum value from total lines, as it's typically the final grand total
    detectedAmount = Math.max(...totalLineMatches.map(p => p.value));
  } else if (potentialAmounts.length > 0) {
    // Priority 2: Use the largest number found overall (excluding extremely large ones like date or ID)
    // In receipts, the largest printed number below 10 million is almost always the grand total
    const sortedPotential = potentialAmounts
      .filter(p => p.value < 5000000) // safety limit for normal receipts
      .sort((a, b) => b.value - a.value);
    
    if (sortedPotential.length > 0) {
      detectedAmount = sortedPotential[0].value;
    }
  }

  // 2. Identify Description / Store Name
  // The store name is usually in the first 3 lines of the receipt
  const storeKeywords = [
    'mart', 'cafe', 'coffee', 'restoran', 'resto', 'pertamina', 'apotek', 
    'laundry', 'trans', 'supermarket', 'indomaret', 'alfamart', 'kopi', 
    'bakso', 'pariwisata', 'hotel', 'mall'
  ];

  let foundStoreName = '';
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (line.length > 3 && line.length < 35 && !/\d{4,}/.test(line)) {
      // If it contains store-like keywords, pick it immediately
      if (storeKeywords.some(kw => line.toLowerCase().includes(kw))) {
        foundStoreName = line;
        break;
      }
      // Otherwise, save the first clean non-numeric line as potential store
      if (!foundStoreName && /[a-zA-Z]{4,}/.test(line)) {
        foundStoreName = line;
      }
    }
  }

  if (foundStoreName) {
    detectedDescription = `Nota ${foundStoreName.replace(/[^a-zA-Z0-9\s-]/g, '').trim()}`;
  } else {
    detectedDescription = 'Nota Belanja';
  }

  // 3. Determine Category based on words in the receipt
  const fullLowerText = text.toLowerCase();
  
  if (
    fullLowerText.includes('kopi') || 
    fullLowerText.includes('coffee') || 
    fullLowerText.includes('cafe') || 
    fullLowerText.includes('starbucks') ||
    fullLowerText.includes('teh') ||
    fullLowerText.includes('drink') ||
    fullLowerText.includes('beverage')
  ) {
    detectedCategory = 'Makanan';
  } else if (
    fullLowerText.includes('makan') || 
    fullLowerText.includes('bakso') || 
    fullLowerText.includes('mie') || 
    fullLowerText.includes('resto') ||
    fullLowerText.includes('nasi') ||
    fullLowerText.includes('ayam') ||
    fullLowerText.includes('burger') ||
    fullLowerText.includes('pizza') ||
    fullLowerText.includes('kuliner')
  ) {
    detectedCategory = 'Makanan';
  } else if (
    fullLowerText.includes('bensin') || 
    fullLowerText.includes('pertamina') || 
    fullLowerText.includes('spbu') || 
    fullLowerText.includes('shell') ||
    fullLowerText.includes('gojek') ||
    fullLowerText.includes('grab') ||
    fullLowerText.includes('parkir') ||
    fullLowerText.includes('tol')
  ) {
    detectedCategory = 'Transportasi';
  } else if (
    fullLowerText.includes('listrik') || 
    fullLowerText.includes('pln') || 
    fullLowerText.includes('pdam') || 
    fullLowerText.includes('token') ||
    fullLowerText.includes('pulsa') ||
    fullLowerText.includes('kuota') ||
    fullLowerText.includes('wifi') ||
    fullLowerText.includes('indihome')
  ) {
    detectedCategory = 'Tagihan';
  } else if (
    fullLowerText.includes('obat') || 
    fullLowerText.includes('apotek') || 
    fullLowerText.includes('klinik') || 
    fullLowerText.includes('dokter') ||
    fullLowerText.includes('sehat') ||
    fullLowerText.includes('sakit')
  ) {
    detectedCategory = 'Kesehatan';
  } else if (
    fullLowerText.includes('bioskop') || 
    fullLowerText.includes('nonton') || 
    fullLowerText.includes('cinema') || 
    fullLowerText.includes('tiket') ||
    fullLowerText.includes('spotify') ||
    fullLowerText.includes('netflix') ||
    fullLowerText.includes('game')
  ) {
    detectedCategory = 'Hiburan';
  } else if (
    fullLowerText.includes('indomaret') || 
    fullLowerText.includes('alfamart') || 
    fullLowerText.includes('supermarket') || 
    fullLowerText.includes('grosir') ||
    fullLowerText.includes('belanja') ||
    fullLowerText.includes('hypermart') ||
    fullLowerText.includes('transmart')
  ) {
    detectedCategory = 'Belanja';
  } else {
    // Dynamic category matching helper from existing logic
    const { category } = getCategoryAndIcon(detectedDescription, 'pengeluaran');
    detectedCategory = category;
  }

  return {
    amount: detectedAmount || 15000, // fallback to a reasonable default if not matched
    description: detectedDescription,
    category: detectedCategory,
    rawText: text
  };
}
