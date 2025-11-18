import { Account, Currency, ConversionRate } from '@/types/finance';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatCurrency, getCategoryLabel } from '@/lib/currency';

interface FinancialChartsProps {
  accounts: Account[];
  conversionRates: ConversionRate[];
}

const COLORS = {
  assets: 'hsl(var(--success))',
  liabilities: 'hsl(var(--destructive))',
  currentAsset: 'hsl(142, 76%, 45%)',
  nonCurrentAsset: 'hsl(142, 76%, 30%)',
  currentLiability: 'hsl(0, 65%, 60%)',
  nonCurrentLiability: 'hsl(0, 65%, 45%)',
};

export const FinancialCharts = ({ accounts, conversionRates }: FinancialChartsProps) => {
  const getRateToEUR = (currency: Currency): number => {
    const rate = conversionRates.find((r) => r.currency === currency);
    return rate?.rate || 1;
  };

  // Calculate totals in EUR
  const totals = accounts.reduce(
    (acc, account) => {
      const valueInEUR = account.balance * getRateToEUR(account.currency);
      const isAsset = account.category.includes('asset');
      
      if (isAsset) {
        acc.totalAssets += valueInEUR;
        if (account.category === 'current_asset') {
          acc.currentAssets += valueInEUR;
        } else {
          acc.nonCurrentAssets += valueInEUR;
        }
      } else {
        acc.totalLiabilities += valueInEUR;
        if (account.category === 'current_liability') {
          acc.currentLiabilities += valueInEUR;
        } else {
          acc.nonCurrentLiabilities += valueInEUR;
        }
      }
      return acc;
    },
    {
      totalAssets: 0,
      totalLiabilities: 0,
      currentAssets: 0,
      nonCurrentAssets: 0,
      currentLiabilities: 0,
      nonCurrentLiabilities: 0,
    }
  );

  // Assets vs Liabilities pie chart data
  const assetLiabilityData = [
    { name: 'Assets', value: totals.totalAssets, color: COLORS.assets },
    { name: 'Liabilities', value: totals.totalLiabilities, color: COLORS.liabilities },
  ].filter(item => item.value > 0);

  // Category breakdown bar chart data
  const categoryData = [
    {
      name: 'Current Assets',
      value: totals.currentAssets,
      color: COLORS.currentAsset,
    },
    {
      name: 'Non-Current Assets',
      value: totals.nonCurrentAssets,
      color: COLORS.nonCurrentAsset,
    },
    {
      name: 'Current Liabilities',
      value: totals.currentLiabilities,
      color: COLORS.currentLiability,
    },
    {
      name: 'Non-Current Liabilities',
      value: totals.nonCurrentLiabilities,
      color: COLORS.nonCurrentLiability,
    },
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(payload[0].value, 'EUR')}
          </p>
        </div>
      );
    }
    return null;
  };

  if (accounts.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 mb-6 sm:mb-8">
      {/* Assets vs Liabilities */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">
          Assets vs Liabilities
        </h3>
        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
          <PieChart>
            <Pie
              data={assetLiabilityData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => {
                const isMobile = window.innerWidth < 640;
                if (isMobile) return '';
                return `${name}: ${(percent * 100).toFixed(0)}%`;
              }}
              outerRadius={window.innerWidth < 640 ? 60 : 80}
              fill="#8884d8"
              dataKey="value"
            >
              {assetLiabilityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-xs sm:text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Category Breakdown */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">
          Category Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={280} className="sm:h-[320px]">
          <BarChart data={categoryData} margin={{ bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: window.innerWidth < 640 ? 9 : 11 }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: window.innerWidth < 640 ? 9 : 11 }}
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              width={window.innerWidth < 640 ? 40 : 50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
