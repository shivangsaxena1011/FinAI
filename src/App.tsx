import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Calculator, 
  TrendingUp, 
  ShieldCheck, 
  Calendar, 
  PieChart as PieChartIcon,
  User,
  ChevronRight,
  Send,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  IndianRupee,
  Menu,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Settings,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import Markdown from 'react-markdown';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, getDoc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserData, HealthScore, TaxResult, FIREResult, Goal, UserProfile, UserSettings } from './types';
import { calculateHealthScore, calculateTaxIndia, calculateFIRE } from './utils/finance';
import { getFinancialAdvice, getQuickInsights } from './services/geminiService';
import { cn, formatCurrency } from './utils/ui';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Profile from './components/Profile';
import SettingsPage from './components/Settings';

// --- Components ---

const Card = ({ children, className, title, icon: Icon }: { children: React.ReactNode, className?: string, title?: string, icon?: any }) => (
  <div className={cn("bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md", className)}>
    {title && (
      <div className="flex items-center gap-3 mb-6">
        {Icon && (
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <h3 className="font-bold text-slate-800 tracking-tight">{title}</h3>
      </div>
    )}
    {children}
  </div>
);

const StatCard = ({ label, value, subValue, trend, icon: Icon, color = "indigo" }: any) => (
  <Card className="flex flex-col justify-between group">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", `bg-${color}-50 text-${color}-600`)}>
        <Icon className="w-6 h-6" />
      </div>
      {trend && (
        <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1", 
          trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
          {trend > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <h4 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{value}</h4>
      {subValue && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{subValue}</p>}
    </div>
  </Card>
);

import { handleFirestoreError, OperationType } from './utils/firebase-errors';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'profile' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: "Namaste! I'm FinAI Mentor. How can I help you with your finances today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...data,
        updatedAt: new Date().toISOString()
      });
      showNotification('success', 'Profile updated successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      showNotification('error', 'Failed to update profile.');
    }
  };

  const handleUpdateSettings = async (settings: UserSettings) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        settings,
        updatedAt: new Date().toISOString()
      });
      showNotification('success', 'Settings saved!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      showNotification('error', 'Failed to save settings.');
    }
  };

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    let unsubDoc: (() => void) | null = null;
    
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      // Clean up previous listener if any
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      setUser(u);
      
      if (u) {
        // Listen to user data
        const path = `users/${u.uid}`;
        const userDoc = doc(db, 'users', u.uid);
        
        unsubDoc = onSnapshot(userDoc, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            // Document might not exist yet if onboarding isn't complete
            setUserProfile(null);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, path);
          setLoading(false);
        });
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  useEffect(() => {
    if (userProfile?.userData) {
      loadInsights();
    }
  }, [userProfile?.userData]);

  const loadInsights = async () => {
    if (!userProfile?.userData) return;
    const newInsights = await getQuickInsights(userProfile.userData);
    setInsights(newInsights);
  };

  const handleOnboardingComplete = async (data: any) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), {
      userData: data,
      updatedAt: new Date().toISOString()
    });
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !userProfile?.userData) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    const aiResponse = await getFinancialAdvice(userMsg, userProfile.userData);
    setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    setIsChatLoading(false);
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white animate-bounce shadow-xl shadow-indigo-200">
            <Zap className="w-8 h-8 fill-current" />
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Loading FinAI Mentor...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Auth />;
  if (!userProfile?.userData) return <Onboarding onComplete={handleOnboardingComplete} uid={user.uid} />;

  const userData = userProfile.userData;
  const healthScore = calculateHealthScore(userData);
  const netWorth = (userData.investments.equity + userData.investments.debt + userData.investments.gold + userData.investments.cash + userData.savings) - userData.loans;
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];
  const expenseData = Object.entries(userData.expensesBreakdown).map(([name, value]) => ({ name, value }));

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'AI Mentor', icon: MessageSquare },
    { id: 'fire', label: 'FIRE Planner', icon: TrendingUp },
    { id: 'tax', label: 'Tax Wizard', icon: ShieldCheck },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'expenses', label: 'Expenses', icon: PieChartIcon },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={cn(
              "fixed bottom-8 left-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 font-bold text-sm",
              notification.type === 'success' ? "bg-emerald-600 text-white border-emerald-500" : "bg-rose-600 text-white border-rose-500"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 transform transition-transform duration-500 ease-in-out lg:relative lg:translate-x-0 shadow-2xl lg:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <Zap className="w-7 h-7 fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">FinAI</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mentor</p>
          </div>
        </div>

        <nav className="mt-8 px-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300",
                activeTab === item.id 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-white" : "text-slate-400")} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-8 space-y-4">
          <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 border border-slate-100 overflow-hidden">
              {user.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : <User className="w-7 h-7" />}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black truncate text-slate-800">{user.displayName || 'User'}</p>
              <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest">Premium Plan</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-black text-rose-500 hover:bg-rose-50 transition-all uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 lg:px-12 sticky top-0 z-40">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-black capitalize tracking-tight text-slate-900">{activeTab}</h2>
            <div className="hidden md:flex items-center gap-2 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Market Data</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <Profile userProfile={userProfile} onUpdate={handleUpdateProfile} onLogout={handleLogout} />
              </motion.div>
            ) : activeTab === 'settings' ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <SettingsPage userProfile={userProfile} onUpdate={handleUpdateSettings} />
              </motion.div>
            ) : activeTab === 'dashboard' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                {/* Top Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <StatCard 
                    label="Net Worth" 
                    value={formatCurrency(netWorth)} 
                    subValue="Total Wealth"
                    trend={12.4}
                    icon={TrendingUp}
                    color="indigo"
                  />
                  <StatCard 
                    label="Monthly Savings" 
                    value={formatCurrency(userData.monthlyIncome - userData.monthlyExpenses)} 
                    subValue={`${Math.round(((userData.monthlyIncome - userData.monthlyExpenses) / userData.monthlyIncome) * 100)}% Savings Rate`}
                    trend={5.2}
                    icon={IndianRupee}
                    color="emerald"
                  />
                  <StatCard 
                    label="Money Health" 
                    value={`${healthScore.total}/100`} 
                    subValue="Financial Wellness"
                    icon={ShieldCheck}
                    color="violet"
                  />
                  <StatCard 
                    label="Emergency Fund" 
                    value={`${userData.emergencyFundMonths} Months`} 
                    subValue={`Target: 6 Months`}
                    icon={AlertCircle}
                    color="amber"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {/* Health Score Breakdown */}
                  <Card title="Financial Wellness" icon={ShieldCheck} className="lg:col-span-1">
                    <div className="flex flex-col items-center py-6">
                      <div className="relative w-48 h-48 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="96" cy="96" r="84" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-100" />
                          <circle cx="96" cy="96" r="84" stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray={527} strokeDashoffset={527 - (527 * healthScore.total) / 100} className="text-indigo-600 transition-all duration-1000" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-5xl font-black text-slate-900 tracking-tighter">{healthScore.total}</span>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">SCORE</span>
                        </div>
                      </div>
                      <div className="mt-10 w-full space-y-5">
                        {Object.entries(healthScore.breakdown).map(([key, val]) => (
                          <div key={key} className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                              <span className="text-slate-400">{key.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="text-slate-900">{Math.round(val * 5)}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${val * 5}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* AI Insights Panel */}
                  <Card title="Smart Insights" icon={Zap} className="lg:col-span-2 bg-indigo-900 text-white border-none shadow-2xl shadow-indigo-200 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <div className="relative z-10 space-y-6">
                      {insights.length > 0 ? insights.map((insight, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-start gap-5 p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all cursor-pointer group"
                        >
                          <div className="p-3 rounded-2xl bg-indigo-500/30 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-6 h-6 text-indigo-200" />
                          </div>
                          <p className="text-sm font-bold leading-relaxed text-indigo-50">{insight}</p>
                        </motion.div>
                      )) : (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                          <RefreshCw className="w-10 h-10 animate-spin text-indigo-300" />
                          <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Analyzing your data...</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Expense Breakdown */}
                  <Card title="Spending Analysis" icon={PieChartIcon}>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={110}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                          >
                            {expenseData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                            itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Net Worth Growth */}
                  <Card title="Wealth Projection" icon={TrendingUp}>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { name: 'Jan', value: netWorth * 0.9 },
                          { name: 'Feb', value: netWorth * 0.95 },
                          { name: 'Mar', value: netWorth },
                          { name: 'Apr', value: netWorth * 1.05 },
                          { name: 'May', value: netWorth * 1.1 },
                          { name: 'Jun', value: netWorth * 1.15 },
                        ]}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                          />
                          <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col h-[calc(100vh-14rem)] max-w-5xl mx-auto bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100"
              >
                {/* Chat Header */}
                <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-3xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                      <Zap className="w-8 h-8 fill-current" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight">FinAI Mentor</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">Expert Advisor Online</p>
                      </div>
                    </div>
                  </div>
                  <button className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={cn(
                      "flex flex-col max-w-[80%]",
                      msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                    )}>
                      <div className={cn(
                        "p-5 rounded-[30px] text-sm shadow-sm leading-relaxed",
                        msg.role === 'user' 
                          ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-100" 
                          : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                      )}>
                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-indigo-600 prose-strong:font-black">
                          <Markdown>
                            {msg.text}
                          </Markdown>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest">
                        {msg.role === 'user' ? 'You' : 'FinAI Mentor'} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex gap-2 p-5 bg-white rounded-[30px] rounded-tl-none border border-slate-100 w-24 shadow-sm items-center justify-center">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-6 bg-white border-t border-slate-100">
                  <div className="flex gap-3 items-center bg-slate-50 p-3 rounded-[30px] border border-slate-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask about tax, investments, or retirement..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 font-medium"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={isChatLoading || !chatInput.trim()}
                      className="p-4 bg-indigo-600 text-white rounded-[24px] hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
                    >
                      <Send className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Other tabs (FIRE, Tax, etc.) would follow similar high-grade UI patterns */}
            {activeTab === 'fire' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">FIRE Planner</h2>
                  <p className="text-slate-500 font-medium">Map your journey to financial freedom</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <Card title="Retirement Target" icon={Target}>
                    <div className="space-y-8">
                      <div className="p-6 bg-indigo-50 rounded-[32px] border border-indigo-100 text-center">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Monthly SIP Required</p>
                        <h4 className="text-4xl font-black text-indigo-600 tracking-tighter">{formatCurrency(calculateFIRE(userData).monthlySIP)}</h4>
                        <p className="text-xs font-bold text-indigo-400 mt-2">Target Corpus: {formatCurrency(calculateFIRE(userData).requiredCorpus)}</p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                          <span className="text-slate-400">Equity Allocation</span>
                          <span className="text-slate-900">70%</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600" style={{ width: '70%' }} />
                        </div>
                      </div>
                    </div>
                  </Card>
                  <Card title="Corpus Gap" icon={TrendingUp}>
                    <div className="h-64 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Current', value: netWorth },
                          { name: 'Target', value: calculateFIRE(userData).requiredCorpus },
                        ]}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontWeight: 'bold', fontSize: 12 }} />
                          <Tooltip formatter={(v: any) => formatCurrency(v)} />
                          <Bar dataKey="value" radius={[15, 15, 0, 0]}>
                            <Cell fill="#f1f5f9" />
                            <Cell fill="#6366f1" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-8 p-6 bg-slate-50 rounded-[32px] text-center">
                      <p className="text-sm font-bold text-slate-600">You can retire in <span className="text-indigo-600 font-black">{calculateFIRE(userData).yearsToRetire} years</span></p>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === 'tax' && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">Tax Wizard</h2>
                  <p className="text-slate-500 font-medium">Optimize your taxes for FY 2024-25</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <Card title="Regime Comparison" icon={ShieldCheck}>
                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="p-5 rounded-[24px] bg-slate-50 border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Old Regime</p>
                          <p className="text-lg font-black text-slate-700">{formatCurrency(calculateTaxIndia(userData.monthlyIncome * 12, 200000).oldRegime)}</p>
                        </div>
                        <div className="p-5 rounded-[24px] bg-slate-50 border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">New Regime</p>
                          <p className="text-lg font-black text-slate-700">{formatCurrency(calculateTaxIndia(userData.monthlyIncome * 12).newRegime)}</p>
                        </div>
                      </div>
                      <div className="p-8 bg-emerald-600 rounded-[40px] text-white text-center shadow-2xl shadow-emerald-100">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Recommended</p>
                        <h4 className="text-3xl font-black uppercase tracking-tight">{calculateTaxIndia(userData.monthlyIncome * 12, 200000).suggestedRegime} Regime</h4>
                        <p className="text-xs font-bold mt-3 opacity-90">Saves you {formatCurrency(calculateTaxIndia(userData.monthlyIncome * 12, 200000).savingsPotential)} annually</p>
                      </div>
                    </div>
                  </Card>
                  <Card title="Quick Actions" icon={Zap}>
                    <div className="space-y-4">
                      <div className="p-5 rounded-[24px] bg-indigo-50 border border-indigo-100 flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0"><Plus className="w-6 h-6" /></div>
                        <div>
                          <h5 className="text-sm font-black text-indigo-900">Max 80C</h5>
                          <p className="text-xs font-medium text-indigo-600">Save ₹46,800 more</p>
                        </div>
                      </div>
                      <div className="p-5 rounded-[24px] bg-violet-50 border border-violet-100 flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shrink-0"><ShieldCheck className="w-6 h-6" /></div>
                        <div>
                          <h5 className="text-sm font-black text-violet-900">Health Policy</h5>
                          <p className="text-xs font-medium text-violet-600">Deduct up to ₹25k</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Placeholder for other tabs to keep code concise but functional */}
            {['goals', 'expenses', 'calendar'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-100 rounded-[30px] flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-10 h-10 animate-spin" />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight capitalize">{activeTab} View Loading</h3>
                <p className="text-sm text-slate-400 font-medium">We're polishing this section for you.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
