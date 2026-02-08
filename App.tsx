import React, { useEffect, useState } from 'react';
import { CheckInLog, UserProfile } from './types';
import { APP_NAME, DEFAULT_PLEDGE_GOAL } from './constants';
import * as dataService from './services/dataService';
import { AuthScreen } from './components/AuthScreen';
import { SettingsModal } from './components/SettingsModal';
import { CheckInModal } from './components/CheckInModal';
import { ProgressChart } from './components/ProgressChart';
import { CalendarGrid } from './components/CalendarGrid';
import { StatsOverview } from './components/StatsOverview';
import { ShieldCheck, Plus, LayoutDashboard, Calendar, History as HistoryIcon, LogOut, Users, Sliders } from 'lucide-react';

type Tab = 'DASHBOARD' | 'CALENDAR' | 'HISTORY';
type ViewMode = 'ME' | 'BRO';

const App: React.FC = () => {
  // --- Auth & Data State ---
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [broProfile, setBroProfile] = useState<UserProfile | null>(null);

  // --- UI State ---
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [viewMode, setViewMode] = useState<ViewMode>('ME');
  const [logs, setLogs] = useState<CheckInLog[]>([]);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- Initialization ---
  const loadData = async () => {
    const user = await dataService.getCurrentUser();
    if (user) {
      // Auto-set start date if missing
      if (!user.journeyStartDate) {
        const now = new Date().toISOString();
        await dataService.updateJourneyStart(now, user);
        user.journeyStartDate = now;
      }

      setCurrentUser(user);

      // Get bro's profile
      const bro = await dataService.getBroProfile(user.email);
      setBroProfile(bro);

      const loadedLogs = await dataService.getLogs();
      setLogs(loadedLogs);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();

    // Enable Realtime Subscription for seamless sync
    const unsubscribe = dataService.subscribeToUpdates(() => {
      loadData();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // --- Handlers ---
  const handleAuthSuccess = () => {
    setIsLoading(true);
    loadData();
  };

  const handleLogout = async () => {
    await dataService.logout();
    setCurrentUser(null);
    setBroProfile(null);
  };

  const handleCheckIn = async (status: 'SUCCESS' | 'RELAPSE', mood: string, note: string) => {
    if (!currentUser) return;

    const newLog = {
      userId: currentUser.id,
      date: new Date().toISOString(),
      status,
      mood,
      note
    };

    await dataService.submitCheckIn(newLog, currentUser);
    loadData();
  };

  // --- Views Logic ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-noir-base flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // Determine whose data we are showing
  const isMe = viewMode === 'ME';
  const targetProfile = isMe ? currentUser : (broProfile || currentUser);

  const activeLogs = logs.filter(l => l.userId === targetProfile.id);
  const targetStartDate = targetProfile.journeyStartDate || new Date().toISOString();
  const targetGoal = targetProfile.pledgeGoal || DEFAULT_PLEDGE_GOAL;

  const calculateDaysRemaining = () => {
    if (!targetStartDate) return targetGoal;
    const start = new Date(targetStartDate);
    const now = new Date();
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, targetGoal - diffDays);
  };

  return (
    <div className="min-h-screen bg-noir-base text-zinc-100 pb-24 font-sans selection:bg-gold selection:text-noir-base">

      {/* Top Navigation Bar */}
      <header className="bg-noir-base/95 backdrop-blur-md border-b border-noir-border sticky top-0 z-40 shadow-lg">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gold flex items-center justify-center text-noir-base shadow-[0_0_15px_rgba(251,191,36,0.5)]">
              <ShieldCheck size={18} strokeWidth={3} />
            </div>
          </div>

          {/* Simple ME / BRO Toggle */}
          <div className="flex-1 flex items-center justify-center gap-2">
            <button
              onClick={() => setViewMode('ME')}
              className={`px-4 py-2 text-xs font-bold rounded-full transition-all border ${viewMode === 'ME'
                ? 'bg-gold text-noir-base border-gold'
                : 'bg-noir-surface text-zinc-400 border-noir-border hover:border-zinc-600 hover:text-white'
                }`}
            >
              ME
            </button>

            {broProfile && (
              <button
                onClick={() => setViewMode('BRO')}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-all border flex items-center gap-1.5 ${viewMode === 'BRO'
                  ? 'bg-gold text-noir-base border-gold'
                  : 'bg-noir-surface text-zinc-400 border-noir-border hover:border-zinc-600 hover:text-white'
                  }`}
              >
                <Users size={12} />
                BRO
              </button>
            )}
          </div>

          {/* Settings / Logout */}
          <div className="flex items-center">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-[#333333] hover:text-white transition-colors"
              title="Settings"
            >
              <Sliders size={18} />
            </button>
            <button onClick={handleLogout} className="p-2 text-[#333333] hover:text-red-500 transition-colors" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">

        {/* User Header Stats */}
        <section className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {targetProfile.name}
              {!isMe && <Users size={16} className="text-gold" />}
            </h2>
            <p className="text-zinc-500 text-xs font-mono mt-1">
              STATUS: <span className={targetProfile.currentStreak > 0 ? "text-emerald-500 font-bold" : "text-zinc-500"}>
                {targetProfile.currentStreak > 0 ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-gold drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">{targetProfile.currentStreak}</div>
            <div className="text-[10px] text-zinc-500 tracking-widest uppercase font-bold">Day Streak</div>
          </div>
        </section>

        {/* Content Area Based on Tab */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <StatsOverview
              user={targetProfile}
              logs={activeLogs}
              goal={targetGoal}
              onGoalClick={isMe ? () => setIsSettingsOpen(true) : undefined}
            />
            <ProgressChart logs={activeLogs} goal={targetGoal} />
          </div>
        )}

        {activeTab === 'CALENDAR' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-end">
              <h3 className="text-sm font-bold text-white">Full Timeline</h3>
              <span className="text-xs text-[#737373] font-mono">{calculateDaysRemaining()} Days Remaining (Goal: {targetGoal})</span>
            </div>
            <CalendarGrid logs={activeLogs} startDate={targetStartDate} goalDays={targetGoal} />
          </div>
        )}

        {activeTab === 'HISTORY' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h3 className="text-sm font-bold text-white">Mission Logs</h3>
            <div className="space-y-2">
              {activeLogs.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-[#333333] rounded-lg">
                  <p className="text-[#525252] text-sm">No records found.</p>
                </div>
              ) : (
                activeLogs.map(log => (
                  <div key={log.id} className="bg-[#1a1a1a] border border-[#262626] p-4 rounded-lg flex items-start gap-4">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${log.status === 'SUCCESS' ? 'bg-[#fbbf24]' : 'bg-red-500'}`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <span className={`text-sm font-bold ${log.status === 'SUCCESS' ? 'text-white' : 'text-red-500'}`}>
                          {log.status === 'SUCCESS' ? 'Complete' : 'Relapse'}
                        </span>
                        <span className="text-[10px] text-[#525252] font-mono">{new Date(log.date).toLocaleDateString()}</span>
                      </div>
                      {log.note && <p className="text-xs text-[#a3a3a3] mt-1">{log.note}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

      {/* Floating Action Button (Only for ME) */}
      {isMe && (
        <div className="fixed bottom-24 right-6 z-50">
          <button
            onClick={() => setIsCheckInOpen(true)}
            className="flex items-center justify-center bg-gold hover:bg-gold-dim text-noir-base rounded-full w-14 h-14 shadow-2xl shadow-gold/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-noir-base/95 backdrop-blur-md border-t border-noir-border pb-safe z-40">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'DASHBOARD' ? 'text-gold' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <LayoutDashboard size={20} strokeWidth={activeTab === 'DASHBOARD' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Dash</span>
          </button>

          <button
            onClick={() => setActiveTab('CALENDAR')}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'CALENDAR' ? 'text-gold' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <Calendar size={20} strokeWidth={activeTab === 'CALENDAR' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Grid</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'HISTORY' ? 'text-gold' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <HistoryIcon size={20} strokeWidth={activeTab === 'HISTORY' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Log</span>
          </button>
        </div>
      </nav>

      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onSubmit={handleCheckIn}
      />

      {currentUser && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          user={currentUser}
          onUpdate={loadData}
        />
      )}

    </div>
  );
};

export default App;