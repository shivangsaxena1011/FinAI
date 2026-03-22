import React, { useState } from 'react';
import { UserProfile, UserData } from '../types';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  IndianRupee, 
  TrendingUp, 
  ShieldCheck, 
  LogOut, 
  Edit2, 
  Save, 
  X,
  ChevronRight,
  Wallet,
  Activity
} from 'lucide-react';
import { cn, formatCurrency } from '../utils/ui';
import { calculateHealthScore } from '../utils/finance';

interface ProfileProps {
  userProfile: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => Promise<void>;
  onLogout: () => void;
}

export default function Profile({ userProfile, onUpdate, onLogout }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: userProfile.displayName,
    monthlyIncome: userProfile.userData.monthlyIncome,
    monthlyExpenses: userProfile.userData.monthlyExpenses,
    savings: userProfile.userData.savings,
  });

  const healthScore = calculateHealthScore(userProfile.userData);
  const netWorth = userProfile.userData.savings + 
                   Object.values(userProfile.userData.investments).reduce((a, b) => a + b, 0) - 
                   userProfile.userData.loans;

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate({
        displayName: formData.displayName,
        userData: {
          ...userProfile.userData,
          monthlyIncome: formData.monthlyIncome,
          monthlyExpenses: formData.monthlyExpenses,
          savings: formData.savings,
        }
      });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="relative group">
          <div className="w-32 h-32 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 border-4 border-white shadow-xl overflow-hidden">
            {userProfile.photoURL ? (
              <img src={userProfile.photoURL} alt={userProfile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-12 h-12" />
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-50 flex items-center justify-center text-slate-400">
            <Edit2 className="w-4 h-4" />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold text-slate-900">{userProfile.displayName}</h1>
          <p className="text-slate-500 flex items-center justify-center md:justify-start gap-2 mt-1">
            <Mail className="w-4 h-4" />
            {userProfile.email}
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">
              Premium Member
            </span>
            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
              Verified
            </span>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-bold hover:bg-rose-100 transition-all border border-rose-100"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Financial Summary Cards */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Net Worth</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(netWorth)}</div>
          <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +12% from last month
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Health Score</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{healthScore.total}/100</div>
          <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-1000",
                healthScore.total > 70 ? "bg-emerald-500" : healthScore.total > 40 ? "bg-amber-500" : "bg-rose-500"
              )}
              style={{ width: `${healthScore.total}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Risk Level</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 capitalize">{userProfile.settings?.riskPreference || 'Medium'}</div>
          <div className="mt-2 text-xs text-slate-400">Based on your portfolio</div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-bottom border-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Personal Details</h2>
            <p className="text-sm text-slate-500">Manage your basic information and financial baseline.</p>
          </div>
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          )}
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Display Name</label>
            <input 
              type="text"
              disabled={!isEditing}
              value={formData.displayName}
              onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Monthly Income (₹)</label>
            <input 
              type="number"
              disabled={!isEditing}
              value={formData.monthlyIncome}
              onChange={(e) => setFormData(prev => ({ ...prev, monthlyIncome: Number(e.target.value) }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Monthly Expenses (₹)</label>
            <input 
              type="number"
              disabled={!isEditing}
              value={formData.monthlyExpenses}
              onChange={(e) => setFormData(prev => ({ ...prev, monthlyExpenses: Number(e.target.value) }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Current Savings (₹)</label>
            <input 
              type="number"
              disabled={!isEditing}
              value={formData.savings}
              onChange={(e) => setFormData(prev => ({ ...prev, savings: Number(e.target.value) }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-60"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
