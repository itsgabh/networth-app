import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { HistorySnapshot } from '@/types/history';
import { Currency, ConversionRate } from '@/types/finance';
import { formatCurrency } from '@/lib/currency';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface NetWorthHistoryChartProps {
  snapshots: HistorySnapshot[];
  displayCurrency?: Currency;
  conversionRates?: ConversionRate[];
}

const convertFromEURTo = (amountEUR: number, targetCurrency: Currency, conversionRates: ConversionRate[]): number => {
  if (targetCurrency === 'EUR') return amountEUR;
  const rate = conversionRates.find((r) => r.currency === targetCurrency);
  if (!rate || rate.rate === 0) return amountEUR;
  return amountEUR / rate.rate;
};

export const NetWorthHistoryChart = ({ 
  snapshots, 
  displayCurrency = 'EUR', 
  conversionRates = [] 
}: NetWorthHistoryChartProps) => {
  const chartData = useMemo(() => {
    return [...snapshots]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((snapshot) => ({
        date: format(new Date(snapshot.timestamp), 'MMM d'),
        fullDate: format(new Date(snapshot.timestamp), 'PPP'),
        netWorth: convertFromEURTo(snapshot.netWorthEUR, displayCurrency, conversionRates),
        assets: convertFromEURTo(snapshot.totalAssetsEUR, displayCurrency, conversionRates),
        liabilities: convertFromEURTo(snapshot.totalLiabilitiesEUR, displayCurrency, conversionRates),
        liquidNetWorth: convertFromEURTo(snapshot.liquidNetWorthEUR, displayCurrency, conversionRates),
      }));
  }, [snapshots, displayCurrency, conversionRates]);

  if (snapshots.length < 2) {
    return null;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{data.fullDate}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-muted-foreground">Net Worth: </span>
              <span className="font-semibold text-primary">
                {formatCurrency(data.netWorth, displayCurrency)}
              </span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Assets: </span>
              <span className="font-semibold text-green-600">
                {formatCurrency(data.assets, displayCurrency)}
              </span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Liabilities: </span>
              <span className="font-semibold text-red-600">
                {formatCurrency(data.liabilities, displayCurrency)}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Net Worth Over Time</h2>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value.toString();
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
            />
            <Line 
              type="monotone" 
              dataKey="netWorth" 
              name="Net Worth"
              stroke="hsl(43, 90%, 48%)" 
              strokeWidth={3}
              dot={{ fill: 'hsl(43, 90%, 48%)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="assets" 
              name="Assets"
              stroke="hsl(142, 76%, 36%)" 
              strokeWidth={2}
              dot={{ fill: 'hsl(142, 76%, 36%)', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="liabilities" 
              name="Liabilities"
              stroke="hsl(0, 65%, 55%)" 
              strokeWidth={2}
              dot={{ fill: 'hsl(0, 65%, 55%)', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
