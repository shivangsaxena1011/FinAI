export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  userData: UserData;
  settings: UserSettings;
}

export interface UserSettings {
  riskPreference: 'low' | 'medium' | 'high';
  currency: string;
  darkMode: boolean;
}

export interface UserData {
  age: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  loans: number;
  investments: {
    equity: number;
    debt: number;
    gold: number;
    cash: number;
  };
  insurance: {
    health: boolean;
    life: boolean;
  };
  emergencyFundMonths: number;
  goals: Goal[];
  expensesBreakdown: {
    food: number;
    rent: number;
    travel: number;
    shopping: number;
    others: number;
  };
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  targetYear: number;
  currentAmount: number;
}

export interface TaxResult {
  oldRegime: number;
  newRegime: number;
  suggestedRegime: 'old' | 'new';
  savingsPotential: number;
}

export interface HealthScore {
  total: number;
  breakdown: {
    emergencyFund: number;
    insurance: number;
    debt: number;
    diversification: number;
    savingsRate: number;
  };
  suggestions: string[];
}

export interface FIREResult {
  yearsToRetire: number;
  requiredCorpus: number;
  monthlySIP: number;
  futureCorpus: number;
  allocation: {
    equity: number;
    debt: number;
    gold: number;
  };
}
