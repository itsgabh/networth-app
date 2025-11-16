export type Currency = 'EUR' | 'USD' | 'GBP' | 'PHP' | 'OTHER';

export interface ConversionRate {
  currency: Currency;
  rate: number; // Rate to EUR (e.g., 1 USD = 0.92 EUR)
  label?: string; // For OTHER currency type
}

export type AccountCategory = 
  | 'current_asset'
  | 'non_current_asset'
  | 'current_liability'
  | 'non_current_liability';

export type AccessType = 'liquid' | 'retirement' | 'illiquid';

export interface Account {
  id: string;
  name: string;
  category: AccountCategory;
  currency: Currency;
  balance: number;
  accessType: AccessType;
  lastUpdated: Date;
}

export interface NetWorthSummary {
  totalAssets: Record<Currency, number>;
  totalLiabilities: Record<Currency, number>;
  netWorth: Record<Currency, number>;
  totalAssetsEUR: number;
  totalLiabilitiesEUR: number;
  netWorthEUR: number;
}
