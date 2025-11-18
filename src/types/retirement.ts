export type RetirementStrategy = 
  | 'regular_fire'
  | 'coast_fire'
  | 'lean_fire'
  | 'fat_fire'
  | 'barista_fire';

export interface RetirementInputs {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyExpenses: number;
  annualIncome: number;
  savingsRate: number; // percentage
  expectedReturn: number; // percentage
  inflationRate: number; // percentage
  socialSecurityAge: number;
  estimatedSocialSecurity: number;
  partTimeIncome: number; // for Barista/Coast FIRE
  desiredLifestyle: 'lean' | 'moderate' | 'fat';
}

export interface RetirementProjection {
  strategy: RetirementStrategy;
  targetAmount: number;
  yearsToTarget: number;
  monthlyInvestment: number;
  retirementAge: number;
  projectedAnnualExpenses: number;
  safeWithdrawalAmount: number;
  isFeasible: boolean;
  notes: string[];
}
