import React, { useState } from 'react';
import { UserProfile, UserSettings } from '../types';
import { 
  Moon, 
  Sun, 
  Globe, 
  Shield, 
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../utils/ui';

interface SettingsProps {
  userProfile: UserProfile;
  onUpdate: (settings: UserSettings) => Promise<void>;
}

export default function Settings({ userProfile, onUpdate }: SettingsProps) {
  const [settings, setSettings] = useState<UserSettings>(userProfile.settings || {
    riskPreference: 'medium',
    currency: '₹',
    darkMode: false
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (newSettings: UserSettings) => {
    setLoading(true);
    setSuccess(false);
    try {
      await onUpdate(newSettings);
      setSettings(newSettings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500">Customize your financial experience and preferences.</p>
        </div>
        {success && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold border border-emerald-100 animate-in fade-in slide-in-from-right-4">
            <CheckCircle2 className="w-4 h-4" />
            Saved Successfully
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Rail */}
        <div className="space-y-2">
          {['General', 'Security', 'Notifications', 'Preferences'].map((item, i) => (
            <button 
              key={item}
              className={cn(
                "w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold transition-all text-left",
                i === 0 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"
              )}
            >
              {item}
              <ChevronRight className={cn("w-4 h-4", i === 0 ? "text-white/60" : "text-slate-300")} />
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Preferences Card */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <div className="flex items-center gap-3 mb-1">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-slate-900">Risk Profile</h2>
              </div>
              <p className="text-sm text-slate-500">Determine how your AI mentor suggests investment allocations.</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {(['low', 'medium', 'high'] as const).map((pref) => (
                  <button
                    key={pref}
                    onClick={() => handleUpdate({ ...settings, riskPreference: pref })}
                    disabled={loading}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                      settings.riskPreference === pref 
                        ? "border-indigo-600 bg-indigo-50/30 text-indigo-700" 
                        : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                    )}
                  >
                    <span className="text-sm font-bold capitalize">{pref}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Appearance Card */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <div className="flex items-center gap-3 mb-1">
                <Sun className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-bold text-slate-900">Appearance</h2>
              </div>
              <p className="text-sm text-slate-500">Customize the look and feel of your dashboard.</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
                    {settings.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Dark Mode</div>
                    <div className="text-xs text-slate-500">Switch to a dark color palette.</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleUpdate({ ...settings, darkMode: !settings.darkMode })}
                  disabled={loading}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    settings.darkMode ? "bg-indigo-600" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    settings.darkMode ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Currency</div>
                    <div className="text-xs text-slate-500">Select your preferred currency symbol.</div>
                  </div>
                </div>
                <select 
                  value={settings.currency}
                  disabled={loading}
                  onChange={(e) => handleUpdate({ ...settings, currency: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="₹">INR (₹)</option>
                  <option value="$">USD ($)</option>
                  <option value="€">EUR (€)</option>
                  <option value="£">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
