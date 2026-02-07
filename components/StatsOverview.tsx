import React from 'react';
import { UserProfile, CheckInLog } from '../types';
import { Trophy, Flame, Target, TrendingUp, Flag } from 'lucide-react';

interface StatsOverviewProps {
  user: UserProfile;
  logs: CheckInLog[];
  goal: number;
  onGoalClick?: () => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ user, logs, goal, onGoalClick }) => {
  const successCount = logs.filter(l => l.status === 'SUCCESS').length;
  const failureCount = logs.filter(l => l.status === 'RELAPSE').length;
  const totalLogged = successCount + failureCount;
  const successRate = totalLogged > 0 ? Math.round((successCount / totalLogged) * 100) : 0;
  
  const StatBox = ({ label, value, icon: Icon, colorClass, onClick, isClickable }: any) => (
    <div 
      onClick={onClick}
      className={`bg-[#1a1a1a] border border-[#333333] p-4 rounded-xl flex flex-col justify-between h-24 relative overflow-hidden group transition-all duration-200 ${
        isClickable ? 'cursor-pointer hover:border-[#fbbf24] hover:bg-[#262626]' : ''
      }`}
    >
       <div className="absolute right-2 top-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <Icon size={40} />
       </div>
       <span className="text-[#737373] text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
         {label}
         {isClickable && <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] animate-pulse"></span>}
       </span>
       <div className={`text-2xl font-mono font-bold ${colorClass}`}>
         {value}
       </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatBox 
        label="Protocol Goal" 
        value={`${goal} Days`} 
        icon={Flag}
        colorClass="text-white"
        onClick={onGoalClick}
        isClickable={!!onGoalClick}
      />
      <StatBox 
        label="Current Streak" 
        value={`${user.currentStreak} Days`} 
        icon={Flame}
        colorClass="text-[#fbbf24]" 
      />
      <StatBox 
        label="Success Rate" 
        value={`${successRate}%`} 
        icon={TrendingUp}
        colorClass="text-emerald-500" 
      />
      <StatBox 
        label="Failures" 
        value={failureCount} 
        icon={Target}
        colorClass="text-red-500" 
      />
    </div>
  );
};