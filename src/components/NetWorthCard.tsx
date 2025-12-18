import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Currency } from '@/types/finance';

interface NetWorthCardProps {
  assetsEUR: number;
  liabilitiesEUR: number;
  isMainCard?: boolean;
  displayCurrency?: Currency;
  previousNetWorth?: number;
  previousAssets?: number;
  previousLiabilities?: number;
}

const formatPercentage = (current: number, previous: number): { value: string; isPositive: boolean; isZero: boolean } => {
  if (previous === 0) {
    return { value: current === 0 ? '0%' : '+∞%', isPositive: current >= 0, isZero: current === 0 };
  }
  const change = ((current - previous) / Math.abs(previous)) * 100;
  const isZero = Math.abs(change) < 0.01;
  return {
    value: isZero ? '0%' : `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
    isPositive: change >= 0,
    isZero,
  };
};

const ChangeIndicator = ({ current, previous }: { current: number; previous: number }) => {
  const { value, isPositive, isZero } = formatPercentage(current, previous);
  
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${
      isZero 
        ? 'text-muted-foreground bg-muted' 
        : isPositive 
          ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30' 
          : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
    }`}>
      {isZero ? (
        <Minus className="h-3 w-3" />
      ) : isPositive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {value}
    </span>
  );
};

export const NetWorthCard = ({ 
  assetsEUR, 
  liabilitiesEUR, 
  isMainCard = false, 
  displayCurrency = 'EUR',
  previousNetWorth,
  previousAssets,
  previousLiabilities,
}: NetWorthCardProps) => {
  const netWorth = assetsEUR - liabilitiesEUR;
  const isPositive = netWorth >= 0;
  const hasPreviousData = previousNetWorth !== undefined;

  return (
    <Card className={`p-4 sm:p-6 ${isMainCard ? 'border-4 border-primary bg-gradient-to-br from-primary/5 to-primary/10' : 'border-2 bg-gradient-to-br from-card to-secondary/20'}`}>
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isMainCard && <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {isMainCard ? `Total Net Worth (${displayCurrency})` : `Net Worth (${displayCurrency})`}
            </h3>
          </div>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
          ) : (
            <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
          )}
        </div>
        
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <p className={`${isMainCard ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-2xl sm:text-3xl lg:text-4xl'} font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(netWorth, displayCurrency)}
            </p>
            {hasPreviousData && (
              <ChangeIndicator current={netWorth} previous={previousNetWorth} />
            )}
          </div>
          {hasPreviousData && (
            <p className="text-xs text-muted-foreground mt-1">
              vs previous snapshot
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Assets</p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`${isMainCard ? 'text-base sm:text-lg lg:text-xl' : 'text-sm sm:text-base lg:text-lg'} font-semibold text-foreground`}>
                {formatCurrency(assetsEUR, displayCurrency)}
              </p>
              {previousAssets !== undefined && (
                <ChangeIndicator current={assetsEUR} previous={previousAssets} />
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Liabilities</p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`${isMainCard ? 'text-base sm:text-lg lg:text-xl' : 'text-sm sm:text-base lg:text-lg'} font-semibold text-foreground`}>
                {formatCurrency(liabilitiesEUR, displayCurrency)}
              </p>
              {previousLiabilities !== undefined && (
                <ChangeIndicator current={liabilitiesEUR} previous={previousLiabilities} />
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
