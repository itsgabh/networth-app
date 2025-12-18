import { AccountCategory, AccessType, Currency } from '@/types/finance';

export interface YNABParsedAccount {
  name: string;
  balance: number;
  ynabType?: 'Asset' | 'Liability';
  suggestedCategory: AccountCategory;
  suggestedAccessType: AccessType;
}

export interface YNABParseResult {
  format: 'register' | 'networth';
  accounts: YNABParsedAccount[];
  parseDate: Date;
}

// Detect format by checking headers
export const detectYNABFormat = (headers: string[]): 'register' | 'networth' | null => {
  const headerSet = new Set(headers.map(h => h.toLowerCase().trim()));
  
  // Net Worth report has "Month" and "Account Type"
  if (headerSet.has('month') && headerSet.has('account type')) {
    return 'networth';
  }
  
  // Register has "Inflow" and "Outflow"
  if (headerSet.has('inflow') && headerSet.has('outflow') && headerSet.has('account')) {
    return 'register';
  }
  
  return null;
};

// Parse CSV text into rows, handling quoted fields
export const parseCSV = (text: string): string[][] => {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',' || char === ';') {
        currentLine.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentLine.push(currentField.trim());
        if (currentLine.some(f => f.length > 0)) {
          lines.push(currentLine);
        }
        currentLine = [];
        currentField = '';
        if (char === '\r') i++; // Skip \n after \r
      } else if (char !== '\r') {
        currentField += char;
      }
    }
  }
  
  // Don't forget the last field/line
  currentLine.push(currentField.trim());
  if (currentLine.some(f => f.length > 0)) {
    lines.push(currentLine);
  }
  
  return lines;
};

// Parse currency value (handles €1,234.56 or 1234.56 or -€500)
export const parseCurrencyValue = (value: string): number => {
  if (!value || value.trim() === '') return 0;
  
  // Remove currency symbols and spaces
  let cleaned = value.replace(/[€$£₱\s]/g, '');
  
  // Handle European number format (1.234,56 -> 1234.56)
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Check which is the decimal separator (last one)
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // European format: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,234.56
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    // Could be 1,234 (thousands) or 1,23 (decimal)
    const parts = cleaned.split(',');
    if (parts[parts.length - 1].length === 2) {
      // Likely decimal separator
      cleaned = cleaned.replace(',', '.');
    } else {
      // Likely thousands separator
      cleaned = cleaned.replace(/,/g, '');
    }
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// Suggest category and access type based on account name
export const suggestAccountType = (
  name: string,
  ynabType?: 'Asset' | 'Liability'
): { category: AccountCategory; accessType: AccessType } => {
  const lower = name.toLowerCase();
  
  // Check for liability indicators first
  if (ynabType === 'Liability' || 
      /credit|visa|mastercard|amex|card|loan|mortgage|debt|owe/.test(lower)) {
    // Mortgage and long-term loans
    if (/mortgage|home\s*loan|car\s*loan|student\s*loan|auto\s*loan/.test(lower)) {
      return { category: 'non_current_liability', accessType: 'illiquid' };
    }
    // Credit cards and short-term debt
    return { category: 'current_liability', accessType: 'liquid' };
  }
  
  // Check for retirement accounts
  if (/401k|401\(k\)|ira|roth|pension|retirement|super|sss|pag-?ibig/.test(lower)) {
    return { category: 'non_current_asset', accessType: 'retirement' };
  }
  
  // Check for investment accounts
  if (/invest|brokerage|stock|etf|fund|portfolio|trading/.test(lower)) {
    return { category: 'non_current_asset', accessType: 'liquid' };
  }
  
  // Check for real estate / property
  if (/property|real\s*estate|house|home|condo|apartment|land/.test(lower)) {
    return { category: 'non_current_asset', accessType: 'illiquid' };
  }
  
  // Check for liquid accounts
  if (/check|saving|cash|wallet|emergency|petty|current\s*account/.test(lower)) {
    return { category: 'current_asset', accessType: 'liquid' };
  }
  
  // Default based on YNAB type
  if (ynabType === 'Asset') {
    return { category: 'current_asset', accessType: 'liquid' };
  }
  
  // Unknown - default to current asset
  return { category: 'current_asset', accessType: 'liquid' };
};

// Parse Net Worth Report format
export const parseNetWorthReport = (rows: string[][]): YNABParsedAccount[] => {
  if (rows.length < 2) return [];
  
  const headers = rows[0].map(h => h.toLowerCase().trim());
  const accountIdx = headers.indexOf('account');
  const typeIdx = headers.indexOf('account type');
  const balanceIdx = headers.findIndex(h => h === 'balance' || h.includes('balance'));
  const monthIdx = headers.indexOf('month');
  
  if (accountIdx === -1 || balanceIdx === -1) {
    throw new Error('Invalid Net Worth report: missing Account or Balance columns');
  }
  
  // Group by account, take most recent month's data
  const accountMap = new Map<string, { balance: number; type?: 'Asset' | 'Liability' }>();
  
  // Find the most recent month
  let mostRecentMonth = '';
  for (let i = 1; i < rows.length; i++) {
    const month = rows[i][monthIdx];
    if (month && month > mostRecentMonth) {
      mostRecentMonth = month;
    }
  }
  
  // Extract balances for the most recent month
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const month = monthIdx >= 0 ? row[monthIdx] : mostRecentMonth;
    
    if (month !== mostRecentMonth) continue;
    
    const accountName = row[accountIdx];
    if (!accountName || accountName.trim() === '') continue;
    
    const balance = parseCurrencyValue(row[balanceIdx]);
    const ynabType = typeIdx >= 0 ? (row[typeIdx] as 'Asset' | 'Liability') : undefined;
    
    accountMap.set(accountName, { balance, type: ynabType });
  }
  
  return Array.from(accountMap.entries()).map(([name, data]) => {
    const suggested = suggestAccountType(name, data.type);
    return {
      name,
      balance: data.balance,
      ynabType: data.type,
      suggestedCategory: suggested.category,
      suggestedAccessType: suggested.accessType,
    };
  });
};

// Parse Transaction Register format
export const parseRegister = (rows: string[][]): YNABParsedAccount[] => {
  if (rows.length < 2) return [];
  
  const headers = rows[0].map(h => h.toLowerCase().trim());
  const accountIdx = headers.indexOf('account');
  const inflowIdx = headers.indexOf('inflow');
  const outflowIdx = headers.indexOf('outflow');
  
  if (accountIdx === -1 || inflowIdx === -1 || outflowIdx === -1) {
    throw new Error('Invalid Register format: missing Account, Inflow, or Outflow columns');
  }
  
  // Sum transactions by account
  const accountBalances = new Map<string, number>();
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const accountName = row[accountIdx];
    if (!accountName || accountName.trim() === '') continue;
    
    const inflow = parseCurrencyValue(row[inflowIdx]);
    const outflow = parseCurrencyValue(row[outflowIdx]);
    const netAmount = inflow - outflow;
    
    const currentBalance = accountBalances.get(accountName) || 0;
    accountBalances.set(accountName, currentBalance + netAmount);
  }
  
  return Array.from(accountBalances.entries()).map(([name, balance]) => {
    const suggested = suggestAccountType(name);
    return {
      name,
      balance,
      suggestedCategory: suggested.category,
      suggestedAccessType: suggested.accessType,
    };
  });
};

// Main parse function
export const parseYNABCSV = (csvText: string): YNABParseResult => {
  const rows = parseCSV(csvText);
  
  if (rows.length === 0) {
    throw new Error('Empty CSV file');
  }
  
  const format = detectYNABFormat(rows[0]);
  
  if (!format) {
    throw new Error('Unrecognized YNAB CSV format. Please export from YNAB as either a Register or Net Worth report.');
  }
  
  const accounts = format === 'networth' 
    ? parseNetWorthReport(rows) 
    : parseRegister(rows);
  
  if (accounts.length === 0) {
    throw new Error('No accounts found in the CSV file');
  }
  
  return {
    format,
    accounts,
    parseDate: new Date(),
  };
};

// Calculate string similarity (Levenshtein distance based)
export const stringSimilarity = (a: string, b: string): number => {
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();
  
  if (aLower === bLower) return 1;
  if (aLower.length === 0 || bLower.length === 0) return 0;
  
  // Check if one contains the other
  if (aLower.includes(bLower) || bLower.includes(aLower)) {
    const ratio = Math.min(aLower.length, bLower.length) / Math.max(aLower.length, bLower.length);
    return 0.7 + (0.3 * ratio);
  }
  
  // Levenshtein distance
  const matrix: number[][] = [];
  
  for (let i = 0; i <= bLower.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= aLower.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= bLower.length; i++) {
    for (let j = 1; j <= aLower.length; j++) {
      if (bLower[i - 1] === aLower[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const distance = matrix[bLower.length][aLower.length];
  const maxLength = Math.max(aLower.length, bLower.length);
  return 1 - distance / maxLength;
};
