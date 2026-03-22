import { UserData, HealthScore, TaxResult, FIREResult } from '../types';

export const calculateHealthScore = (data: UserData): HealthScore => {
  const breakdown = {
    emergencyFund: 0,
    insurance: 0,
    debt: 0,
    diversification: 0,
    savingsRate: 0,
  };

  // Emergency Fund (Target: 6 months of expenses)
  const targetEF = data.monthlyExpenses * 6;
  const currentEF = data.investments.cash;
  breakdown.emergencyFund = Math.min(20, (currentEF / targetEF) * 20);

  // Insurance
  if (data.insurance.health) breakdown.insurance += 10;
  if (data.insurance.life) breakdown.insurance += 10;

  // Debt (Target: EMI < 30% of income)
  // Assuming 1% of loan as monthly EMI for simplicity
  const estimatedEMI = data.loans * 0.01;
  const debtRatio = estimatedEMI / data.monthlyIncome;
  breakdown.debt = Math.max(0, 20 * (1 - debtRatio));

  // Diversification
  const totalInvestments = data.investments.equity + data.investments.debt + data.investments.gold;
  if (totalInvestments > 0) {
    const equityRatio = data.investments.equity / totalInvestments;
    const debtRatioInv = data.investments.debt / totalInvestments;
    if (equityRatio > 0.3 && equityRatio < 0.7) breakdown.diversification += 10;
    if (debtRatioInv > 0.2) breakdown.diversification += 10;
  }

  // Savings Rate (Target: > 20%)
  const savingsRate = (data.monthlyIncome - data.monthlyExpenses) / data.monthlyIncome;
  breakdown.savingsRate = Math.min(20, savingsRate * 100);

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

  const suggestions = [];
  if (breakdown.emergencyFund < 15) suggestions.push("Build an emergency fund covering 6 months of expenses.");
  if (!data.insurance.health) suggestions.push("Get a comprehensive health insurance policy.");
  if (!data.insurance.life) suggestions.push("Consider a term life insurance if you have dependents.");
  if (breakdown.debt < 15) suggestions.push("Focus on reducing high-interest loans.");
  if (breakdown.diversification < 15) suggestions.push("Diversify your portfolio across Equity, Debt, and Gold.");

  return { total: Math.round(total), breakdown, suggestions };
};

export const calculateTaxIndia = (annualIncome: number, deductions: number = 0): TaxResult => {
  // Simplified FY 2024-25 logic
  
  const calculateOldRegime = (income: number, ded: number) => {
    const taxable = Math.max(0, income - ded - 50000); // 50k standard deduction
    if (taxable <= 250000) return 0;
    let tax = 0;
    if (taxable > 250000) tax += Math.min(taxable - 250000, 250000) * 0.05;
    if (taxable > 500000) tax += Math.min(taxable - 500000, 500000) * 0.20;
    if (taxable > 1000000) tax += (taxable - 1000000) * 0.30;
    
    // Rebate u/s 87A
    if (taxable <= 500000) tax = 0;
    return tax * 1.04; // 4% cess
  };

  const calculateNewRegime = (income: number) => {
    const taxable = Math.max(0, income - 50000); // 50k standard deduction
    if (taxable <= 300000) return 0;
    let tax = 0;
    if (taxable > 300000) tax += Math.min(taxable - 300000, 300000) * 0.05;
    if (taxable > 600000) tax += Math.min(taxable - 600000, 300000) * 0.10;
    if (taxable > 900000) tax += Math.min(taxable - 900000, 300000) * 0.15;
    if (taxable > 1200000) tax += Math.min(taxable - 1200000, 300000) * 0.20;
    if (taxable > 1500000) tax += (taxable - 1500000) * 0.30;

    // Rebate u/s 87A
    if (taxable <= 700000) tax = 0;
    return tax * 1.04;
  };

  const oldTax = calculateOldRegime(annualIncome, deductions);
  const newTax = calculateNewRegime(annualIncome);

  return {
    oldRegime: Math.round(oldTax),
    newRegime: Math.round(newTax),
    suggestedRegime: oldTax < newTax ? 'old' : 'new',
    savingsPotential: Math.abs(oldTax - newTax),
  };
};

export const calculateFIRE = (data: UserData, retirementAge: number = 50): FIREResult => {
  const currentAge = data.age;
  const yearsToRetire = Math.max(0, retirementAge - currentAge);
  const monthlyExpenses = data.monthlyExpenses;
  const inflation = 0.06;
  const returnRate = 0.12;
  
  // Future expenses at retirement
  const futureMonthlyExpenses = monthlyExpenses * Math.pow(1 + inflation, yearsToRetire);
  const annualFutureExpenses = futureMonthlyExpenses * 12;
  
  // Required Corpus (25x rule adjusted for India inflation/returns)
  // Safe Withdrawal Rate of 4%
  const requiredCorpus = annualFutureExpenses / 0.04;
  
  // Current Savings growth
  const currentSavingsValue = (data.investments.equity + data.investments.debt + data.investments.gold + data.investments.cash) * Math.pow(1 + returnRate, yearsToRetire);
  
  const gap = Math.max(0, requiredCorpus - currentSavingsValue);
  
  // Monthly SIP required to bridge the gap
  // FV = P * [((1 + r)^n - 1) / r] * (1 + r)
  const r = returnRate / 12;
  const n = yearsToRetire * 12;
  const monthlySIP = n > 0 ? gap / (((Math.pow(1 + r, n) - 1) / r) * (1 + r)) : 0;

  return {
    yearsToRetire,
    requiredCorpus: Math.round(requiredCorpus),
    monthlySIP: Math.round(monthlySIP),
    futureCorpus: Math.round(currentSavingsValue + gap),
    allocation: {
      equity: 70,
      debt: 20,
      gold: 10
    }
  };
};
