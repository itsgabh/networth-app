import { RetirementInputs, RetirementProjection, RetirementStrategy } from '@/types/retirement';

const SAFE_WITHDRAWAL_RATE = 0.04; // 4% rule
const MONTHS_PER_YEAR = 12;

// Future value calculation
function futureValue(
  presentValue: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / MONTHS_PER_YEAR;
  const months = years * MONTHS_PER_YEAR;
  
  // FV of present value
  const fvPresent = presentValue * Math.pow(1 + monthlyRate, months);
  
  // FV of monthly contributions (annuity)
  const fvContributions = monthlyContribution * 
    ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  
  return fvPresent + fvContributions;
}

// Calculate years to reach target
function yearsToTarget(
  currentSavings: number,
  targetAmount: number,
  monthlyContribution: number,
  annualRate: number
): number {
  if (monthlyContribution === 0 && currentSavings < targetAmount) {
    return Infinity;
  }
  
  const monthlyRate = annualRate / MONTHS_PER_YEAR;
  
  // If monthly contribution is zero, use simple compound interest
  if (monthlyContribution === 0) {
    return Math.log(targetAmount / currentSavings) / Math.log(1 + monthlyRate) / MONTHS_PER_YEAR;
  }
  
  // Binary search for years
  let low = 0;
  let high = 100;
  let years = 0;
  
  while (high - low > 0.01) {
    years = (low + high) / 2;
    const fv = futureValue(currentSavings, monthlyContribution, annualRate, years);
    
    if (fv < targetAmount) {
      low = years;
    } else {
      high = years;
    }
  }
  
  return years;
}

// Adjust for inflation
function adjustForInflation(amount: number, years: number, inflationRate: number): number {
  return amount * Math.pow(1 + inflationRate, years);
}

// Regular FIRE: Full retirement using 4% rule
export function calculateRegularFIRE(inputs: RetirementInputs): RetirementProjection {
  const annualExpenses = inputs.monthlyExpenses * MONTHS_PER_YEAR;
  const targetAmount = annualExpenses / SAFE_WITHDRAWAL_RATE;
  const monthlyInvestment = (inputs.annualIncome * inputs.savingsRate / 100) / MONTHS_PER_YEAR;
  const years = yearsToTarget(inputs.currentSavings, targetAmount, monthlyInvestment, inputs.expectedReturn / 100);
  
  const notes = [
    `Retire completely when you reach ${(targetAmount / 1000).toFixed(0)}K`,
    `Based on ${(SAFE_WITHDRAWAL_RATE * 100).toFixed(0)}% safe withdrawal rate`,
    `Assumes ${(inputs.expectedReturn).toFixed(1)}% annual investment returns`,
  ];
  
  return {
    strategy: 'regular_fire',
    targetAmount,
    yearsToTarget: years,
    monthlyInvestment,
    retirementAge: inputs.currentAge + years,
    projectedAnnualExpenses: annualExpenses,
    safeWithdrawalAmount: targetAmount * SAFE_WITHDRAWAL_RATE,
    isFeasible: years < 100 && years > 0,
    notes,
  };
}

// Coast FIRE: Stop saving, let existing investments grow
export function calculateCoastFIRE(inputs: RetirementInputs): RetirementProjection {
  const yearsUntilRetirement = inputs.retirementAge - inputs.currentAge;
  const annualExpenses = inputs.monthlyExpenses * MONTHS_PER_YEAR;
  const futureExpenses = adjustForInflation(annualExpenses, yearsUntilRetirement, inputs.inflationRate / 100);
  const targetAmount = futureExpenses / SAFE_WITHDRAWAL_RATE;
  
  // How much do we need NOW to coast to retirement?
  const coastNumber = targetAmount / Math.pow(1 + inputs.expectedReturn / 100, yearsUntilRetirement);
  
  const monthlyInvestment = (inputs.annualIncome * inputs.savingsRate / 100) / MONTHS_PER_YEAR;
  const years = yearsToTarget(inputs.currentSavings, coastNumber, monthlyInvestment, inputs.expectedReturn / 100);
  
  const notes = [
    `Reach Coast FIRE number: ${(coastNumber / 1000).toFixed(0)}K`,
    `Then stop saving and let it grow to ${(targetAmount / 1000).toFixed(0)}K by age ${inputs.retirementAge}`,
    `You can work part-time or cover only living expenses`,
  ];
  
  return {
    strategy: 'coast_fire',
    targetAmount: coastNumber,
    yearsToTarget: years,
    monthlyInvestment,
    retirementAge: inputs.currentAge + years,
    projectedAnnualExpenses: futureExpenses,
    safeWithdrawalAmount: targetAmount * SAFE_WITHDRAWAL_RATE,
    isFeasible: years < 100 && years > 0 && inputs.currentSavings < coastNumber,
    notes,
  };
}

// Lean FIRE: Minimalist retirement
export function calculateLeanFIRE(inputs: RetirementInputs): RetirementProjection {
  const leanExpenses = inputs.monthlyExpenses * 0.7 * MONTHS_PER_YEAR; // 30% less than current
  const targetAmount = leanExpenses / SAFE_WITHDRAWAL_RATE;
  const monthlyInvestment = (inputs.annualIncome * inputs.savingsRate / 100) / MONTHS_PER_YEAR;
  const years = yearsToTarget(inputs.currentSavings, targetAmount, monthlyInvestment, inputs.expectedReturn / 100);
  
  const notes = [
    `Minimalist lifestyle: ${(leanExpenses / MONTHS_PER_YEAR).toFixed(0)} EUR/month`,
    `Target: ${(targetAmount / 1000).toFixed(0)}K`,
    `Requires significant lifestyle adjustments and frugality`,
  ];
  
  return {
    strategy: 'lean_fire',
    targetAmount,
    yearsToTarget: years,
    monthlyInvestment,
    retirementAge: inputs.currentAge + years,
    projectedAnnualExpenses: leanExpenses,
    safeWithdrawalAmount: targetAmount * SAFE_WITHDRAWAL_RATE,
    isFeasible: years < 100 && years > 0,
    notes,
  };
}

// Fat FIRE: Luxurious retirement
export function calculateFatFIRE(inputs: RetirementInputs): RetirementProjection {
  const fatExpenses = inputs.monthlyExpenses * 2 * MONTHS_PER_YEAR; // Double current expenses
  const targetAmount = fatExpenses / SAFE_WITHDRAWAL_RATE;
  const monthlyInvestment = (inputs.annualIncome * inputs.savingsRate / 100) / MONTHS_PER_YEAR;
  const years = yearsToTarget(inputs.currentSavings, targetAmount, monthlyInvestment, inputs.expectedReturn / 100);
  
  const notes = [
    `Luxurious lifestyle: ${(fatExpenses / MONTHS_PER_YEAR).toFixed(0)} EUR/month`,
    `Target: ${(targetAmount / 1000).toFixed(0)}K`,
    `Maintain or improve current lifestyle without compromise`,
  ];
  
  return {
    strategy: 'fat_fire',
    targetAmount,
    yearsToTarget: years,
    monthlyInvestment,
    retirementAge: inputs.currentAge + years,
    projectedAnnualExpenses: fatExpenses,
    safeWithdrawalAmount: targetAmount * SAFE_WITHDRAWAL_RATE,
    isFeasible: years < 100 && years > 0,
    notes,
  };
}

// Barista FIRE: Semi-retirement with part-time income
export function calculateBaristaFIRE(inputs: RetirementInputs): RetirementProjection {
  const annualExpenses = inputs.monthlyExpenses * MONTHS_PER_YEAR;
  const partTimeCoverage = inputs.partTimeIncome * MONTHS_PER_YEAR;
  const gapToFill = Math.max(0, annualExpenses - partTimeCoverage);
  const targetAmount = gapToFill / SAFE_WITHDRAWAL_RATE;
  const monthlyInvestment = (inputs.annualIncome * inputs.savingsRate / 100) / MONTHS_PER_YEAR;
  const years = yearsToTarget(inputs.currentSavings, targetAmount, monthlyInvestment, inputs.expectedReturn / 100);
  
  const notes = [
    `Part-time income covers ${(partTimeCoverage / annualExpenses * 100).toFixed(0)}% of expenses`,
    `Only need ${(targetAmount / 1000).toFixed(0)}K to cover the gap`,
    `Work part-time doing something you enjoy`,
  ];
  
  return {
    strategy: 'barista_fire',
    targetAmount,
    yearsToTarget: years,
    monthlyInvestment,
    retirementAge: inputs.currentAge + years,
    projectedAnnualExpenses: annualExpenses,
    safeWithdrawalAmount: targetAmount * SAFE_WITHDRAWAL_RATE + partTimeCoverage,
    isFeasible: years < 100 && years > 0,
    notes,
  };
}

// FINE: Financial Independence, No Early retirement
export function calculateFINE(inputs: RetirementInputs): RetirementProjection {
  const annualExpenses = inputs.monthlyExpenses * MONTHS_PER_YEAR;
  const targetAmount = annualExpenses / SAFE_WITHDRAWAL_RATE;
  const monthlyInvestment = (inputs.annualIncome * inputs.savingsRate / 100) / MONTHS_PER_YEAR;
  const years = yearsToTarget(inputs.currentSavings, targetAmount, monthlyInvestment, inputs.expectedReturn / 100);
  
  const notes = [
    `Achieve FI number: ${(targetAmount / 1000).toFixed(0)}K`,
    `Continue working because you want to, not because you have to`,
    `Ultimate financial security and freedom of choice`,
  ];
  
  return {
    strategy: 'fine',
    targetAmount,
    yearsToTarget: years,
    monthlyInvestment,
    retirementAge: inputs.currentAge + years,
    projectedAnnualExpenses: annualExpenses,
    safeWithdrawalAmount: targetAmount * SAFE_WITHDRAWAL_RATE,
    isFeasible: years < 100 && years > 0,
    notes,
  };
}

// Traditional Retirement: With Social Security
export function calculateTraditionalRetirement(inputs: RetirementInputs): RetirementProjection {
  const yearsUntilRetirement = inputs.retirementAge - inputs.currentAge;
  const annualExpenses = inputs.monthlyExpenses * MONTHS_PER_YEAR;
  const futureExpenses = adjustForInflation(annualExpenses, yearsUntilRetirement, inputs.inflationRate / 100);
  
  // Account for Social Security
  const socialSecurityIncome = inputs.estimatedSocialSecurity * MONTHS_PER_YEAR;
  const gapToFill = Math.max(0, futureExpenses - socialSecurityIncome);
  const targetAmount = gapToFill / SAFE_WITHDRAWAL_RATE;
  
  const monthlyInvestment = (inputs.annualIncome * inputs.savingsRate / 100) / MONTHS_PER_YEAR;
  const projectedSavings = futureValue(
    inputs.currentSavings,
    monthlyInvestment,
    inputs.expectedReturn / 100,
    yearsUntilRetirement
  );
  
  const notes = [
    `Retire at age ${inputs.retirementAge}`,
    `Social Security covers ${(socialSecurityIncome / futureExpenses * 100).toFixed(0)}% of expenses`,
    `Need ${(targetAmount / 1000).toFixed(0)}K, projected to have ${(projectedSavings / 1000).toFixed(0)}K`,
  ];
  
  return {
    strategy: 'traditional',
    targetAmount,
    yearsToTarget: yearsUntilRetirement,
    monthlyInvestment,
    retirementAge: inputs.retirementAge,
    projectedAnnualExpenses: futureExpenses,
    safeWithdrawalAmount: targetAmount * SAFE_WITHDRAWAL_RATE + socialSecurityIncome,
    isFeasible: projectedSavings >= targetAmount * 0.8, // 80% threshold
    notes,
  };
}

export function calculateAllStrategies(inputs: RetirementInputs): Record<RetirementStrategy, RetirementProjection> {
  return {
    regular_fire: calculateRegularFIRE(inputs),
    coast_fire: calculateCoastFIRE(inputs),
    lean_fire: calculateLeanFIRE(inputs),
    fat_fire: calculateFatFIRE(inputs),
    barista_fire: calculateBaristaFIRE(inputs),
    fine: calculateFINE(inputs),
    traditional: calculateTraditionalRetirement(inputs),
  };
}
