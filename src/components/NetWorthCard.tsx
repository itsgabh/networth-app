import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface NetWorthCardProps {
  assetsEUR: number;
  liabilitiesEUR: number;
  isMainCard?: boolean;
}

export const NetWorthCard = ({ assetsEUR, liabilitiesEUR, isMainCard = false }: NetWorthCardProps) => {
  const netWorth = assetsEUR - liabilitiesEUR;
  const isPositive = netWorth >= 0;

  return (
    <Card className={`p-4 sm:p-6 ${isMainCard ? 'border-4 border-primary bg-gradient-to-br from-primary/5 to-primary/10' : 'border-2 bg-gradient-to-br from-card to-secondary/20'}`}>
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isMainCard && <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {isMainCard ? 'Total Net Worth (EUR)' : 'Net Worth (EUR)'}
            </h3>
          </div>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
          ) : (
            <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
          )}
        </div>
        
        <div>
          <p className={`${isMainCard ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-2xl sm:text-3xl lg:text-4xl'} font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {formatCurrency(netWorth, 'EUR')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Assets</p>
            <p className={`${isMainCard ? 'text-base sm:text-lg lg:text-xl' : 'text-sm sm:text-base lg:text-lg'} font-semibold text-foreground`}>
              {formatCurrency(assetsEUR, 'EUR')}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Liabilities</p>
            <p className={`${isMainCard ? 'text-base sm:text-lg lg:text-xl' : 'text-sm sm:text-base lg:text-lg'} font-semibold text-foreground`}>
              {formatCurrency(liabilitiesEUR, 'EUR')}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
