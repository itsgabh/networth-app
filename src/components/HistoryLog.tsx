import { Card } from '@/components/ui/card';
import { HistorySnapshot } from '@/types/history';
import { formatCurrency } from '@/lib/currency';
import { History, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

interface HistoryLogProps {
  snapshots: HistorySnapshot[];
}

export const HistoryLog = ({ snapshots }: HistoryLogProps) => {
  const sortedSnapshots = [...snapshots].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (snapshots.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <History className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">History Log</h2>
      </div>

      <div className="space-y-3">
        {sortedSnapshots.map((snapshot, index) => {
          const prevSnapshot = sortedSnapshots[index + 1];
          const change = prevSnapshot
            ? snapshot.netWorthEUR - prevSnapshot.netWorthEUR
            : 0;
          const changePercent = prevSnapshot
            ? ((change / prevSnapshot.netWorthEUR) * 100)
            : 0;

          return (
            <div
              key={snapshot.id}
              className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(snapshot.timestamp), 'PPpp')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {snapshot.accountCount} accounts
                  </p>
                </div>
                {prevSnapshot && change !== 0 && (
                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {change > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {change > 0 ? '+' : ''}
                    {formatCurrency(change, 'EUR')} ({changePercent.toFixed(1)}%)
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <div>
                  <p className="text-xs text-muted-foreground">Net Worth</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(snapshot.netWorthEUR, 'EUR')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assets</p>
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(snapshot.totalAssetsEUR, 'EUR')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Liabilities</p>
                  <p className="text-sm font-semibold text-red-600">
                    {formatCurrency(snapshot.totalLiabilitiesEUR, 'EUR')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Liquid Net Worth</p>
                  <p className="text-sm font-semibold text-primary">
                    {formatCurrency(snapshot.liquidNetWorthEUR, 'EUR')}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
