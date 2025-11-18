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
  Heart,
  Building2,
  Calculator,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Target
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
  fine: {
    icon: Heart,
    title: 'FINE',
    description: 'Financial Independence, Next Endeavor - pursue passion projects and meaningful work',
    color: 'text-pink-600',
  },
  traditional: {
    icon: Building2,
    title: 'Traditional Retirement',
    description: 'Standard retirement at traditional age with Social Security',
    color: 'text-gray-600',
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

  const [desiredMonthlySpending, setDesiredMonthlySpending] = useState<number>(monthlyExpenses || 3000);
  const [multiplier, setMultiplier] = useState<number>(25);

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

  const renderProjectionCard = (strategy: RetirementStrategy, projection: RetirementProjection) => {
    const config = strategyConfig[strategy];
    const Icon = config.icon;
    const isFeasible = projection.isFeasible;
    const yearsRounded = Math.ceil(projection.yearsToTarget);

    return (
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Icon className={`h-8 w-8 ${config.color}`} />
            <div>
              <h3 className="text-xl font-bold text-foreground">{config.title}</h3>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
          {isFeasible ? (
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          ) : yearsRounded > 50 ? (
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          ) : (
            <XCircle className="h-6 w-6 text-red-600" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Target Amount</p>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(projection.targetAmount, 'EUR')}
            </p>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Years to Target</p>
            <p className="text-lg font-bold text-primary">
              {yearsRounded < 100 ? `${yearsRounded} years` : '100+ years'}
            </p>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Retirement Age</p>
            <p className="text-lg font-bold text-foreground">
              {projection.retirementAge.toFixed(0)}
            </p>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Monthly Investment</p>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(projection.monthlyInvestment, 'EUR')}
            </p>
          </div>
        </div>

        <div className="bg-primary/10 p-4 rounded-lg mb-4">
          <p className="text-sm font-semibold text-foreground mb-2">Annual Income Needed</p>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(projection.safeWithdrawalAmount, 'EUR')}
          </p>
        </div>

        <div className="space-y-2">
          {projection.notes.map((note, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground flex-1">{note}</p>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Retirement Planning Module</h2>
      </div>

      {/* FIRE Progress Section */}
      <Card className="p-4 mb-6 bg-muted/30">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">FIRE Progress</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Desired Monthly Spending (EUR)</Label>
            <Input
              type="number"
              value={desiredMonthlySpending}
              onChange={(e) => setDesiredMonthlySpending(Number(e.target.value))}
              min={0}
            />
          </div>
          <div>
            <Label>Multiplier (4% rule = 25)</Label>
            <Input
              type="number"
              value={multiplier}
              onChange={(e) => setMultiplier(Number(e.target.value))}
              min={1}
            />
          </div>
        </div>

        {desiredMonthlySpending > 0 && multiplier > 0 && (
          <>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your FIRE number:</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(desiredMonthlySpending * 12 * multiplier, 'EUR')}
                </span>
              </div>
              <Progress 
                value={Math.min(((liquidAssetsEUR + retirementAssetsEUR) / (desiredMonthlySpending * 12 * multiplier)) * 100, 100)} 
                className="h-3"
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress:</span>
                <span className="font-semibold text-primary">
                  {(((liquidAssetsEUR + retirementAssetsEUR) / (desiredMonthlySpending * 12 * multiplier)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              You have reached <span className="font-semibold text-foreground">
                {(((liquidAssetsEUR + retirementAssetsEUR) / (desiredMonthlySpending * 12 * multiplier)) * 100).toFixed(1)}%
              </span> of your FIRE target.
            </p>
          </>
        )}
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
                            <CheckCircle2 className="h-5 w-5 text-green-600 inline" />
                          ) : yearsRounded > 50 ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-600 inline" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 inline" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Strategy Notes</h3>
                {(Object.keys(strategyConfig) as RetirementStrategy[]).map((strategy) => {
                  const projection = projections[strategy];
                  const config = strategyConfig[strategy];
                  const Icon = config.icon;

                  return (
                    <Card key={`notes-${strategy}`} className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`h-5 w-5 ${config.color}`} />
                        <h4 className="font-semibold text-foreground">{config.title}</h4>
                      </div>
                      <ul className="space-y-1 ml-7">
                        {projection.notes.map((note, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};
