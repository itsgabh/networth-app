export interface HistorySnapshot {
  id: string;
  timestamp: Date;
  netWorthEUR: number;
  totalAssetsEUR: number;
  totalLiabilitiesEUR: number;
  liquidNetWorthEUR: number;
  accountCount: number;
}
