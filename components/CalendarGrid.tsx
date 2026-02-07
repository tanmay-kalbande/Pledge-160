import React from 'react';
import { CheckInLog } from '../types';

interface CalendarGridProps {
  logs: CheckInLog[];
  startDate: string | null;
  goalDays: number;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ logs, startDate, goalDays }) => {
  const start = startDate ? new Date(startDate) : new Date();

  // Create an array of 160 days
  const days = Array.from({ length: goalDays }, (_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    return date;
  });

  const getLogForDate = (date: Date) => {
    return logs.find(log => {
      const logDate = new Date(log.date);
      return logDate.getDate() === date.getDate() &&
        logDate.getMonth() === date.getMonth() &&
        logDate.getFullYear() === date.getFullYear();
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isFuture = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  return (
    <div className="bg-noir-surface border border-noir-border rounded-xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gold text-xs font-bold uppercase tracking-widest">Protocol Timeline</h3>
        <div className="flex gap-3 text-[10px] text-zinc-500 font-mono font-bold">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-gold"></div> WON</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-red-900"></div> LOST</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-noir-border"></div> PENDING</span>
        </div>
      </div>

      <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5">
        {days.map((date, index) => {
          const log = getLogForDate(date);
          const active = isToday(date);
          const future = isFuture(date);

          let bgColor = 'bg-noir-elevated'; // Default/Pending
          let borderColor = 'border-transparent';

          if (log) {
            if (log.status === 'SUCCESS') {
              bgColor = 'bg-gold';
              borderColor = 'border-gold';
            } else {
              bgColor = 'bg-red-900/50';
              borderColor = 'border-red-900';
            }
          } else if (active) {
            borderColor = 'border-white';
          } else if (future) {
            bgColor = 'bg-black/40 opacity-50';
          }

          return (
            <div
              key={index}
              className={`aspect-square rounded-sm border ${borderColor} ${bgColor} flex items-center justify-center relative group transition-all duration-200`}
            >
              <span className={`text-[8px] font-mono ${log?.status === 'SUCCESS' ? 'text-noir-base font-bold' : 'text-zinc-600'}`}>
                {index + 1}
              </span>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 w-max max-w-[150px] bg-noir-base border border-noir-border p-2 rounded shadow-2xl text-left">
                <p className="text-[10px] text-zinc-500 font-mono">{date.toLocaleDateString()}</p>
                {log ? (
                  <>
                    <p className={`text-xs font-bold ${log.status === 'SUCCESS' ? 'text-gold' : 'text-red-500'}`}>
                      {log.status === 'SUCCESS' ? 'MISSION SUCCESS' : 'RELAPSE'}
                    </p>
                    {log.note && <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 italic">"{log.note}"</p>}
                  </>
                ) : (
                  <p className="text-[10px] text-zinc-600">{future ? 'Future Operation' : 'No Data'}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};