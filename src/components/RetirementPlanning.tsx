import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RetirementInputs, RetirementProjection, RetirementStrategy } from '@/types/retirement';
import { calculateAllStrategies } from '@/lib/retirementCalculations';
import { formatCurrency } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Coffee, 
  Leaf, 
  Crown, 
  Briefcase,
  Calculator,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LineChart as LineChartIcon
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RetirementPlanningProps {
  liquidNetWorthEUR: number;
  liquidAssetsEUR: number;
  retirementAssetsEUR: number;
  monthlyExpenses: number;
  onInputsChange: (inputs: RetirementInputs) => void;
  savedInputs?: RetirementInputs;
}

const strategyConfig: Record<RetirementStrategy, { 
  icon: any; 
  title: string; 
  description: string;
  color: string;
}> = {
  regular_fire: {
    icon: TrendingUp,
    title: 'Regular FIRE',
    description: 'Full financial independence and early retirement using the 4% rule',
    color: 'text-primary',
  },
  coast_fire: {
    icon: Coffee,
    title: 'Coast FIRE',
    description: 'Stop saving aggressively, let investments grow while working stress-free',
    color: 'text-blue-600',
  },
  lean_fire: {
    icon: Leaf,
    title: 'Lean FIRE',
    description: 'Minimalist early retirement with reduced expenses',
    color: 'text-green-600',
  },
  fat_fire: {
    icon: Crown,
    title: 'Fat FIRE',
    description: 'Luxurious early retirement without financial constraints',
    color: 'text-yellow-600',
  },
  barista_fire: {
    icon: Briefcase,
    title: 'Barista FIRE',
    description: 'Semi-retirement with enjoyable part-time work',
    color: 'text-purple-600',
  },
};

export const RetirementPlanning = ({ 
  liquidNetWorthEUR, 
  liquidAssetsEUR,
  retirementAssetsEUR,
  monthlyExpenses,
  onInputsChange,
  savedInputs,
}: RetirementPlanningProps) => {
  const { toast } = useToast();
  const [inputs, setInputs] = useState<RetirementInputs>(savedInputs || {
    currentAge: 30,
    retirementAge: 65,
    currentSavings: liquidNetWorthEUR,
    monthlyExpenses: monthlyExpenses || 3000,
    annualIncome: 60000,
    savingsRate: 30,
    expectedReturn: 7,
    inflationRate: 3,
    socialSecurityAge: 67,
    estimatedSocialSecurity: 1500,
    partTimeIncome: 1500,
    desiredLifestyle: 'moderate',
  });

  const [projectionMode, setProjectionMode] = useState<'all' | 'retirement'>('all');

  const [projections, setProjections] = useState<Record<RetirementStrategy, RetirementProjection> | null>(null);
  
  type SortColumn = 'targetAmount' | 'yearsToTarget' | 'retirementAge' | 'monthlyInvestment' | 'annualIncome';
  const [sortColumn, setSortColumn] = useState<SortColumn>('yearsToTarget');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleCalculate = () => {
    const updatedInputs = { ...inputs, currentSavings: liquidNetWorthEUR };
    setInputs(updatedInputs);
    const results = calculateAllStrategies(updatedInputs);
    setProjections(results);
    onInputsChange(updatedInputs);
    
    toast({
      title: "Calculations Complete",
      description: "All retirement strategies have been calculated. Switch to the Strategy Comparison tab to view results.",
    });
  };

  const handleInputChange = (field: keyof RetirementInputs, value: number | string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Calculate portfolio projection with three scenarios
  const calculateProjection = () => {
    const currentPortfolioValue = projectionMode === 'all' 
      ? liquidAssetsEUR + retirementAssetsEUR 
      : retirementAssetsEUR;
    
    const monthlyContribution = (inputs.annualIncome * inputs.savingsRate / 100) / 12;
    const yearsToRetirement = Math.max(0, inputs.retirementAge - inputs.currentAge);
    
    // Define three return scenarios
    const pessimisticReturn = 0.04; // 4%
    const realisticReturn = inputs.expectedReturn / 100; // User's input (default 7%)
    const optimisticReturn = 0.10; // 10%
    
    const projectionData = [];
    
    // Add current year (all scenarios start at the same value)
    projectionData.push({
      age: inputs.currentAge,
      year: new Date().getFullYear(),
      pessimistic: currentPortfolioValue,
      realistic: currentPortfolioValue,
      optimistic: currentPortfolioValue,
    });
    
    // Calculate yearly projections for each scenario
    let pessimisticValue = currentPortfolioValue;
    let realisticValue = currentPortfolioValue;
    let optimisticValue = currentPortfolioValue;
    
    for (let i = 1; i <= yearsToRetirement; i++) {
      pessimisticValue = pessimisticValue * (1 + pessimisticReturn) + monthlyContribution * 12;
      realisticValue = realisticValue * (1 + realisticReturn) + monthlyContribution * 12;
      optimisticValue = optimisticValue * (1 + optimisticReturn) + monthlyContribution * 12;
      
      projectionData.push({
        age: inputs.currentAge + i,
        year: new Date().getFullYear() + i,
        pessimistic: pessimisticValue,
        realistic: realisticValue,
        optimistic: optimisticValue,
      });
    }
    
    return projectionData;
  };

  const projectionData = calculateProjection();

  const getSortedStrategies = (): RetirementStrategy[] => {
    if (!projections) return [];
    
    const strategies = Object.keys(strategyConfig) as RetirementStrategy[];
    
    return strategies.sort((a, b) => {
      const projA = projections[a];
      const projB = projections[b];
      
      let comparison = 0;
      
      switch (sortColumn) {
        case 'targetAmount':
          comparison = projA.targetAmount - projB.targetAmount;
          break;
        case 'yearsToTarget':
          comparison = projA.yearsToTarget - projB.yearsToTarget;
          break;
        case 'retirementAge':
          comparison = projA.retirementAge - projB.retirementAge;
          break;
        case 'monthlyInvestment':
          comparison = projA.monthlyInvestment - projB.monthlyInvestment;
          break;
        case 'annualIncome':
          comparison = projA.safeWithdrawalAmount - projB.safeWithdrawalAmount;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1 inline" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1 inline" />
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Retirement Planning Module</h2>
      </div>

      {/* Portfolio Projection Chart */}
      <Card className="p-4 mb-6 bg-muted/30">
        <Alert className="mb-4">
          <AlertDescription className="text-sm">
            <strong>Three scenarios based on your portfolio mix</strong> (All World, S&P 500, NASDAQ, Philippine equity):
            <ul className="mt-2 ml-4 space-y-1 list-disc text-xs">
              <li><strong>Pessimistic (4%):</strong> Economic downturns, bear markets</li>
              <li><strong>Realistic ({inputs.expectedReturn}%):</strong> Conservative balanced long-term expectation</li>
              <li><strong>Optimistic (10%):</strong> Strong economic growth, bull markets</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LineChartIcon className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Portfolio Projection</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant={projectionMode === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setProjectionMode('all')}
            >
              Total Portfolio
            </Button>
            <Button
              variant={projectionMode === 'retirement' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setProjectionMode('retirement')}
            >
              Retirement Only
            </Button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={projectionData}
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="age" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              label={{ value: 'Age', position: 'insideBottom', offset: -5, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              label={{ value: 'Portfolio Value', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => [
                formatCurrency(value, 'EUR'), 
                name === 'pessimistic' ? 'Pessimistic (4%)' :
                name === 'realistic' ? `Realistic (${inputs.expectedReturn}%)` : 
                'Optimistic (10%)'
              ]}
              labelFormatter={(age) => `Age: ${age} (Year: ${projectionData.find(d => d.age === age)?.year})`}
            />
            <Legend 
              verticalAlign="top"
              height={36}
              formatter={(value) => 
                value === 'pessimistic' ? 'Pessimistic (4%)' :
                value === 'realistic' ? `Realistic (${inputs.expectedReturn}%)` : 
                'Optimistic (10%)'
              }
            />
            
            {/* Pessimistic line - red/orange */}
            <Line 
              type="monotone" 
              dataKey="pessimistic" 
              stroke="#ef4444" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="pessimistic"
            />
            
            {/* Realistic line - primary color (main focus) */}
            <Line 
              type="monotone" 
              dataKey="realistic" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', r: 3 }}
              activeDot={{ r: 5 }}
              name="realistic"
            />
            
            {/* Optimistic line - green */}
            <Line 
              type="monotone" 
              dataKey="optimistic" 
              stroke="#22c55e" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="optimistic"
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Pessimistic Scenario */}
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="font-semibold text-red-900 dark:text-red-100 text-sm">Pessimistic (4%)</span>
            </div>
            <p className="text-red-700 dark:text-red-300 text-xs font-medium">
              At Retirement: {formatCurrency(projectionData[projectionData.length - 1]?.pessimistic || 0, 'EUR')}
            </p>
            <p className="text-red-600 dark:text-red-400 text-xs mt-1">Bear market conditions</p>
          </div>
          
          {/* Realistic Scenario */}
          <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground text-sm">Realistic ({inputs.expectedReturn}%)</span>
            </div>
            <p className="text-foreground text-xs font-medium">
              At Retirement: {formatCurrency(projectionData[projectionData.length - 1]?.realistic || 0, 'EUR')}
            </p>
            <p className="text-muted-foreground text-xs mt-1">Conservative long-term average</p>
          </div>
          
          {/* Optimistic Scenario */}
          <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-900 dark:text-green-100 text-sm">Optimistic (10%)</span>
            </div>
            <p className="text-green-700 dark:text-green-300 text-xs font-medium">
              At Retirement: {formatCurrency(projectionData[projectionData.length - 1]?.optimistic || 0, 'EUR')}
            </p>
            <p className="text-green-600 dark:text-green-400 text-xs mt-1">Strong bull market conditions</p>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-muted-foreground space-y-1">
          <p>• Starting Portfolio: {formatCurrency(projectionData[0]?.realistic || 0, 'EUR')}</p>
          <p>• Monthly Contribution: {formatCurrency((inputs.annualIncome * inputs.savingsRate / 100) / 12, 'EUR')}</p>
        </div>
      </Card>

      <Tabs defaultValue="inputs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inputs">Your Inputs</TabsTrigger>
          <TabsTrigger value="strategies">Strategy Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="inputs" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Current Age</Label>
              <Input
                type="number"
                value={inputs.currentAge}
                onChange={(e) => handleInputChange('currentAge', Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Target Retirement Age</Label>
              <Input
                type="number"
                value={inputs.retirementAge}
                onChange={(e) => handleInputChange('retirementAge', Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Current Savings (EUR)</Label>
              <Input
                type="number"
                value={liquidNetWorthEUR.toFixed(0)}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">Auto-filled from liquid net worth</p>
            </div>
            <div>
              <Label>Monthly Expenses (EUR)</Label>
              <Input
                type="number"
                value={inputs.monthlyExpenses}
                onChange={(e) => handleInputChange('monthlyExpenses', Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Annual Income (EUR)</Label>
              <Input
                type="number"
                value={inputs.annualIncome}
                onChange={(e) => handleInputChange('annualIncome', Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Savings Rate (%)</Label>
              <Input
                type="number"
                value={inputs.savingsRate}
                onChange={(e) => handleInputChange('savingsRate', Number(e.target.value))}
                min="0"
                max="100"
              />
            </div>
            <div>
              <Label>Expected Return (%)</Label>
              <Input
                type="number"
                value={inputs.expectedReturn}
                onChange={(e) => handleInputChange('expectedReturn', Number(e.target.value))}
                step="0.1"
              />
            </div>
            <div>
              <Label>Inflation Rate (%)</Label>
              <Input
                type="number"
                value={inputs.inflationRate}
                onChange={(e) => handleInputChange('inflationRate', Number(e.target.value))}
                step="0.1"
              />
            </div>
            <div>
              <Label>Part-Time Income (EUR/month)</Label>
              <Input
                type="number"
                value={inputs.partTimeIncome}
                onChange={(e) => handleInputChange('partTimeIncome', Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">For Barista FIRE</p>
            </div>
            <div>
              <Label>Social Security Age</Label>
              <Input
                type="number"
                value={inputs.socialSecurityAge}
                onChange={(e) => handleInputChange('socialSecurityAge', Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Est. Social Security (EUR/month)</Label>
              <Input
                type="number"
                value={inputs.estimatedSocialSecurity}
                onChange={(e) => handleInputChange('estimatedSocialSecurity', Number(e.target.value))}
              />
            </div>
          </div>

          <Button onClick={handleCalculate} size="lg" className="w-full gap-2">
            <Calculator className="h-5 w-5" />
            Calculate All Retirement Strategies
          </Button>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-6">
          {!projections ? (
            <div className="text-center py-12">
              <Calculator className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Calculations Yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Switch to the "Your Inputs" tab and click "Calculate" to see all strategies
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <TooltipProvider>
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Strategy</TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('targetAmount')}
                    >
                      Target Amount
                      <SortIcon column="targetAmount" />
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('yearsToTarget')}
                    >
                      Years to Target
                      <SortIcon column="yearsToTarget" />
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('retirementAge')}
                    >
                      Retirement Age
                      <SortIcon column="retirementAge" />
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('monthlyInvestment')}
                    >
                      Monthly Investment
                      <SortIcon column="monthlyInvestment" />
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('annualIncome')}
                    >
                      Annual Income
                      <SortIcon column="annualIncome" />
                    </TableHead>
                    <TableHead className="text-center">Feasible</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSortedStrategies().map((strategy) => {
                    const projection = projections[strategy];
                    const config = strategyConfig[strategy];
                    const Icon = config.icon;
                    const yearsRounded = Math.ceil(projection.yearsToTarget);
                    const isFeasible = projection.isFeasible;

                    return (
                      <TableRow key={strategy} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-5 w-5 ${config.color}`} />
                            <div>
                              <div className="font-semibold text-foreground">{config.title}</div>
                              <div className="text-xs text-muted-foreground">{config.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(projection.targetAmount, 'EUR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-primary">
                            {yearsRounded < 100 ? `${yearsRounded} years` : '100+ years'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {projection.retirementAge.toFixed(0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(projection.monthlyInvestment, 'EUR')}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatCurrency(projection.safeWithdrawalAmount, 'EUR')}
                        </TableCell>
                        <TableCell className="text-center">
                          {isFeasible ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <CheckCircle2 className="h-5 w-5 text-green-600 inline cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Achievable within your lifetime ({yearsRounded} years)</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : yearsRounded > 50 ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="h-5 w-5 text-yellow-600 inline cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Very long timeframe ({yearsRounded} years) - consider adjusting your strategy</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <XCircle className="h-5 w-5 text-red-600 inline cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Not feasible with current inputs - increase savings rate or reduce expenses</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </TooltipProvider>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};
