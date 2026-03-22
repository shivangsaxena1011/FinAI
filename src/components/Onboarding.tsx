import React, { useState } from 'react';
import { UserData } from '../types';
import { motion } from 'motion/react';
import { handleFirestoreError, OperationType } from '../utils/firebase-errors';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  IndianRupee, 
  TrendingUp, 
  ShieldCheck, 
  PieChart,
  Target
} from 'lucide-react';
import { cn } from '../utils/ui';

interface OnboardingProps {
  onComplete: (data: UserData) => void;
  uid: string;
}

const steps = [
  { id: 'basics', title: 'The Basics', icon: IndianRupee, description: 'Tell us about your age and income.' },
  { id: 'expenses', title: 'Spending', icon: PieChart, description: 'How much do you spend monthly?' },
  { id: 'investments', title: 'Wealth', icon: TrendingUp, description: 'Your current savings and investments.' },
  { id: 'protection', title: 'Protection', icon: ShieldCheck, description: 'Insurance and safety nets.' },
  { id: 'goals', title: 'Dreams', icon: Target, description: 'What are you saving for?' },
];

export default function Onboarding({ onComplete, uid }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<UserData>({
    age: 25,
    monthlyIncome: 50000,
    monthlyExpenses: 25000,
    savings: 100000,
    loans: 0,
    investments: { equity: 50000, debt: 20000, gold: 10000, cash: 20000 },
    insurance: { health: true, life: false },
    emergencyFundMonths: 1,
    goals: [],
    expensesBreakdown: { food: 5000, rent: 10000, travel: 2000, shopping: 3000, others: 5000 }
  });

  const next = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const path = `users/${uid}`;
      try {
        onComplete(formData);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    }
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...(prev as any)[parent], [field]: value }
    }));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="flex justify-between mb-12">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex flex-col items-center gap-2 flex-1">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
                idx <= currentStep ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
              )}>
                {idx < currentStep ? <CheckCircle2 className="w-6 h-6" /> : <step.icon className="w-5 h-5" />}
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest hidden sm:block",
                idx <= currentStep ? "text-indigo-600" : "text-slate-400"
              )}>
                {step.title}
              </span>
            </div>
          ))}
        </div>

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-50 rounded-3xl p-8 sm:p-12 border border-slate-100"
        >
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{steps[currentStep].title}</h2>
          <p className="text-slate-500 mb-8">{steps[currentStep].description}</p>

          <div className="space-y-6">
            {currentStep === 0 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">How old are you?</label>
                  <input 
                    type="number" 
                    value={formData.age}
                    onChange={(e) => updateField('age', parseInt(e.target.value))}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Monthly In-hand Salary (₹)</label>
                  <input 
                    type="number" 
                    value={formData.monthlyIncome}
                    onChange={(e) => updateField('monthlyIncome', parseInt(e.target.value))}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </>
            )}

            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Total Monthly Expenses (₹)</label>
                  <input 
                    type="number" 
                    value={formData.monthlyExpenses}
                    onChange={(e) => updateField('monthlyExpenses', parseInt(e.target.value))}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Rent (₹)</label>
                    <input type="number" value={formData.expensesBreakdown.rent} onChange={(e) => updateNestedField('expensesBreakdown', 'rent', parseInt(e.target.value))} className="w-full p-3 bg-white border border-slate-200 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Food (₹)</label>
                    <input type="number" value={formData.expensesBreakdown.food} onChange={(e) => updateNestedField('expensesBreakdown', 'food', parseInt(e.target.value))} className="w-full p-3 bg-white border border-slate-200 rounded-xl" />
                  </div>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Equity/Stocks (₹)</label>
                    <input type="number" value={formData.investments.equity} onChange={(e) => updateNestedField('investments', 'equity', parseInt(e.target.value))} className="w-full p-4 bg-white border border-slate-200 rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">FD/Debt (₹)</label>
                    <input type="number" value={formData.investments.debt} onChange={(e) => updateNestedField('investments', 'debt', parseInt(e.target.value))} className="w-full p-4 bg-white border border-slate-200 rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Total Loans (₹)</label>
                    <input type="number" value={formData.loans} onChange={(e) => updateField('loans', parseInt(e.target.value))} className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-rose-600" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Cash/Bank (₹)</label>
                    <input type="number" value={formData.investments.cash} onChange={(e) => updateNestedField('investments', 'cash', parseInt(e.target.value))} className="w-full p-4 bg-white border border-slate-200 rounded-2xl" />
                  </div>
                </div>
              </>
            )}

            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><ShieldCheck className="w-6 h-6" /></div>
                    <div>
                      <p className="font-bold text-slate-800">Health Insurance</p>
                      <p className="text-xs text-slate-500">Do you have a policy?</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => updateNestedField('insurance', 'health', !formData.insurance.health)}
                    className={cn("w-14 h-8 rounded-full transition-colors relative", formData.insurance.health ? "bg-emerald-500" : "bg-slate-200")}
                  >
                    <div className={cn("absolute top-1 w-6 h-6 bg-white rounded-full transition-all", formData.insurance.health ? "left-7" : "left-1")} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><ShieldCheck className="w-6 h-6" /></div>
                    <div>
                      <p className="font-bold text-slate-800">Term Life Insurance</p>
                      <p className="text-xs text-slate-500">For your dependents</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => updateNestedField('insurance', 'life', !formData.insurance.life)}
                    className={cn("w-14 h-8 rounded-full transition-colors relative", formData.insurance.life ? "bg-indigo-500" : "bg-slate-200")}
                  >
                    <div className={cn("absolute top-1 w-6 h-6 bg-white rounded-full transition-all", formData.insurance.life ? "left-7" : "left-1")} />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">All set!</h3>
                <p className="text-slate-500">We're ready to build your financial plan.</p>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-12">
            <button 
              onClick={prev}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-0 transition-all"
            >
              <ArrowLeft className="w-5 h-5" /> Back
            </button>
            <button 
              onClick={next}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              {currentStep === steps.length - 1 ? "Finish" : "Next"} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
