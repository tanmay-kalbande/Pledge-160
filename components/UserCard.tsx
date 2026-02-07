import React from 'react';
import { UserProfile } from '../types';
import { Trophy, Flame, Calendar, Crown } from 'lucide-react';

interface UserCardProps {
  user: UserProfile;
  isCurrentUser: boolean;
  isActive: boolean;
  onClick: () => void;
  isLeading?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({ user, isCurrentUser, isActive, onClick, isLeading }) => {
  return (
    <div 
      onClick={onClick}
      className={`relative p-5 rounded-xl cursor-pointer transition-all duration-300 border group ${
        isActive 
          ? 'bg-[#1a1a1a] border-[#fbbf24] shadow-[0_0_20px_rgba(251,191,36,0.1)] transform scale-[1.02]' 
          : 'bg-[#1a1a1a] border-[#333333] hover:border-[#fbbf24]/50 hover:bg-[#262626]'
      }`}
    >
      {/* Leader Badge */}
      {isLeading && (
        <div className="absolute -top-3 -right-2 bg-[#fbbf24] text-[#0e0e0e] text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 z-10">
          <Crown size={10} fill="currentColor" />
          <span>LEADER</span>
        </div>
      )}

      <div className="flex items-center space-x-4">
        <div className="relative">
          <img 
            src={user.avatar} 
            alt={user.name} 
            className={`w-14 h-14 rounded-lg object-cover transition-all duration-300 ${
              isActive 
                ? 'ring-2 ring-[#fbbf24] ring-offset-2 ring-offset-[#0e0e0e] grayscale-0' 
                : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'
            }`}
          />
          {isActive && (
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fbbf24] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#fbbf24]"></span>
            </span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className={`text-base font-bold truncate pr-2 ${isActive ? 'text-white' : 'text-[#a3a3a3] group-hover:text-white'}`}>
              {user.name} {isCurrentUser && <span className="text-[10px] font-normal text-[#737373] ml-1 uppercase tracking-wider">(You)</span>}
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
             <div className={`flex items-center space-x-1.5 px-2 py-1 rounded text-xs font-mono font-medium ${
               isActive ? 'bg-[#fbbf24]/10 text-[#fbbf24]' : 'bg-[#262626] text-[#737373]'
             }`}>
                <Flame size={12} fill={isActive ? "currentColor" : "none"} />
                <span>{user.currentStreak} DAYS</span>
             </div>
          </div>
          
          <div className="mt-3 flex items-center space-x-4 text-[10px] uppercase tracking-wider text-[#737373]">
            <div className="flex items-center space-x-1">
              <Trophy size={10} className={isActive ? "text-[#fbbf24]" : ""} />
              <span>PB: {user.bestStreak}</span>
            </div>
             <div className="flex items-center space-x-1">
              <Calendar size={10} />
              <span>{user.lastCheckInDate ? new Date(user.lastCheckInDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'}) : '--'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};