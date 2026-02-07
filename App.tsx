import React, { useEffect, useState } from 'react';
import { CheckInLog, UserProfile } from './types';
import { APP_NAME, DEFAULT_PLEDGE_GOAL } from './constants';
import * as dataService from './services/dataService';
import { AuthScreen } from './components/AuthScreen';
import { AddPartnerModal } from './components/AddPartnerModal';
import { SettingsModal } from './components/SettingsModal';
import { CheckInModal } from './components/CheckInModal';
import { ProgressChart } from './components/ProgressChart';
import { CalendarGrid } from './components/CalendarGrid';
import { StatsOverview } from './components/StatsOverview';
import { ShieldCheck, Plus, LayoutDashboard, Calendar, History as HistoryIcon, LogOut, Users, UserPlus, Sliders } from 'lucide-react';

type Tab = 'DASHBOARD' | 'CALENDAR' | 'HISTORY';

const App: React.FC = () => {
  // --- Auth & Data State ---
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [partners, setPartners] = useState<UserProfile[]>([]);
  
  // --- UI State ---
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [viewingProfileId, setViewingProfileId] = useState<string>(''); 
  const [logs, setLogs] = useState<CheckInLog[]>([]);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
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
        
        // If we were viewing someone, keep viewing them, else view me
        if (!viewingProfileId) setViewingProfileId(user.id);
        
        const partnersList = await dataService.getPartners(user.id);
        setPartners(partnersList);

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
    setPartners([]);
    setViewingProfileId('');
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
    // Data reload handled by realtime subscription or manual refresh in dataService
    loadData();
  };

  // --- Views Logic ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#fbbf24]"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // Determine whose data we are showing
  const isMe = viewingProfileId === currentUser.id;
  const targetProfile = isMe 
    ? currentUser 
    : partners.find(p => p.id === viewingProfileId) || currentUser;
    
  const activeLogs = logs.filter(l => l.userId === targetProfile.id);
  const targetStartDate = targetProfile.journeyStartDate || new Date().toISOString();
  // Use the profile's specific goal, or fallback to default
  const targetGoal = targetProfile.pledgeGoal || DEFAULT_PLEDGE_GOAL;

  const calculateDaysRemaining = () => {
    if (!targetStartDate) return targetGoal;
    const start = new Date(targetStartDate);
    const now = new Date();
    // Reset hours to compare days only
    start.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    return Math.max(0, targetGoal - diffDays);
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#f5f5f5] pb-24 font-sans selection:bg-[#fbbf24] selection:text-[#0e0e0e]">
      
      {/* Top Navigation Bar */}
      <header className="bg-[#0e0e0e]/95 backdrop-blur-md border-b border-[#333333] sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#fbbf24] flex items-center justify-center text-[#0e0e0e] shadow-[0_0_15px_rgba(251,191,36,0.3)]">
              <ShieldCheck size={18} strokeWidth={3} />
            </div>
          </div>

          {/* User Switcher Scroll Area */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar mask-linear-fade">
             <button 
                onClick={() => setViewingProfileId(currentUser.id)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-full transition-all border ${
                  currentUser.id === viewingProfileId 
                    ? 'bg-[#fbbf24] text-[#0e0e0e] border-[#fbbf24]' 
                    : 'bg-[#1a1a1a] text-[#737373] border-[#333333] hover:border-[#525252] hover:text-white'
                }`}
              >
                ME
              </button>
              
              {partners.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setViewingProfileId(p.id)}
                  className={`flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-full transition-all border flex items-center gap-1.5 ${
                    p.id === viewingProfileId 
                      ? 'bg-[#fbbf24] text-[#0e0e0e] border-[#fbbf24]' 
                      : 'bg-[#1a1a1a] text-[#737373] border-[#333333] hover:border-[#525252] hover:text-white'
                  }`}
                >
                  <Users size={12} />
                  {p.name.toUpperCase()}
                </button>
              ))}

              <button 
                onClick={() => setIsAddPartnerOpen(true)}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a1a] border border-[#333333] text-[#737373] hover:text-[#fbbf24] hover:border-[#fbbf24] transition-all"
                title="Add Partner"
              >
                <Plus size={14} />
              </button>
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
                {targetProfile.id !== currentUser.id && <Users size={16} className="text-[#fbbf24]" />}
             </h2>
             <p className="text-[#737373] text-xs font-mono mt-1">
               STATUS: <span className={targetProfile.currentStreak > 0 ? "text-emerald-500" : "text-[#737373]"}>
                 {targetProfile.currentStreak > 0 ? 'ACTIVE' : 'INACTIVE'}
               </span>
             </p>
           </div>
           <div className="text-right">
             <div className="text-3xl font-mono font-bold text-[#fbbf24]">{targetProfile.currentStreak}</div>
             <div className="text-[10px] text-[#737373] tracking-widest uppercase">Day Streak</div>
           </div>
        </section>

        {/* Empty State for Partners */}
        {partners.length === 0 && isMe && (
           <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center text-[#fbbf24]">
                    <UserPlus size={20} />
                 </div>
                 <div>
                   <p className="text-sm font-bold text-white">Add Accountability Partner</p>
                   <p className="text-[10px] text-[#737373]">Boost success rate by 200%</p>
                 </div>
              </div>
              <button 
                onClick={() => setIsAddPartnerOpen(true)}
                className="px-4 py-2 bg-[#262626] hover:bg-[#333333] text-xs font-bold text-white rounded-lg border border-[#333333] transition-colors"
              >
                Add
              </button>
           </div>
        )}

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

      {/* Floating Action Button (Only Me) */}
      {isMe && (
        <div className="fixed bottom-24 right-6 z-50">
          <button 
            onClick={() => setIsCheckInOpen(true)}
            className="flex items-center justify-center bg-[#fbbf24] hover:bg-[#f59e0b] text-[#0e0e0e] rounded-full w-14 h-14 shadow-lg shadow-black/50 transition-transform active:scale-95"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0e0e0e] border-t border-[#333333] pb-safe z-40">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          <button 
            onClick={() => setActiveTab('DASHBOARD')}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'DASHBOARD' ? 'text-[#fbbf24]' : 'text-[#525252] hover:text-[#a3a3a3]'}`}
          >
            <LayoutDashboard size={20} strokeWidth={activeTab === 'DASHBOARD' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Dash</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('CALENDAR')}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'CALENDAR' ? 'text-[#fbbf24]' : 'text-[#525252] hover:text-[#a3a3a3]'}`}
          >
            <Calendar size={20} strokeWidth={activeTab === 'CALENDAR' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Grid</span>
          </button>

          <button 
            onClick={() => setActiveTab('HISTORY')}
            className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'HISTORY' ? 'text-[#fbbf24]' : 'text-[#525252] hover:text-[#a3a3a3]'}`}
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

      <AddPartnerModal 
        isOpen={isAddPartnerOpen}
        onClose={() => setIsAddPartnerOpen(false)}
        onPartnerAdded={loadData}
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