import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/currency';
import { Calculator, TrendingUp } from 'lucide-react';

interface RetirementCalculatorProps {
  liquidNetWorthEUR: number;
  monthlyExpenses: number;
  onMonthlyExpensesChange: (value: number) => void;
}

export const RetirementCalculator = ({
  liquidNetWorthEUR,
  monthlyExpenses,
  onMonthlyExpensesChange,
}: RetirementCalculatorProps) => {
  const annualExpenses = monthlyExpenses * 12;
  const yearsToRetirement = annualExpenses > 0 ? liquidNetWorthEUR / annualExpenses : 0;
  const safeWithdrawalRate = 0.04; // 4% rule
  const retirementTarget = annualExpenses / safeWithdrawalRate;
  const progressPercent = retirementTarget > 0 ? (liquidNetWorthEUR / retirementTarget) * 100 : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Retirement Calculator</h2>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="monthlyExpenses" className="text-sm font-medium">
            Monthly Expenses (EUR)
          </Label>
          <Input
            id="monthlyExpenses"
            type="number"
            value={monthlyExpenses || ''}
            onChange={(e) => onMonthlyExpensesChange(Number(e.target.value))}
            placeholder="Enter your monthly expenses"
            className="mt-2"
          />
        </div>

        {monthlyExpenses > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Liquid Net Worth</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(liquidNetWorthEUR, 'EUR')}
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Annual Expenses</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(annualExpenses, 'EUR')}
                </p>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Years to Retirement</p>
                <p className="text-2xl font-bold text-primary flex items-center gap-2">
                  {yearsToRetirement.toFixed(1)} years
                  <TrendingUp className="h-5 w-5" />
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on current liquid assets
                </p>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Retirement Target (4% rule)</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(retirementTarget, 'EUR')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Progress: {progressPercent.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Years to retirement assumes you spend only your liquid net worth.
                The retirement target uses the 4% safe withdrawal rate, meaning you'd need{' '}
                {formatCurrency(retirementTarget, 'EUR')} to safely withdraw{' '}
                {formatCurrency(annualExpenses, 'EUR')} annually.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
