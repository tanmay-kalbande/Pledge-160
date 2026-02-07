import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { CheckInLog } from '../types';

interface ProgressChartProps {
  logs: CheckInLog[];
  goal: number;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ logs, goal }) => {
  const data = React.useMemo(() => {
    const today = new Date();
    const result = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const hasSuccess = logs.some(l => {
         const logDate = new Date(l.date);
         return logDate.getDate() === d.getDate() && 
                logDate.getMonth() === d.getMonth() && 
                l.status === 'SUCCESS';
      });

      result.push({
        name: dateStr,
        value: hasSuccess ? 1 : 0
      });
    }
    return result;
  }, [logs]);

  return (
    <div className="h-64 w-full bg-[#1a1a1a] rounded-xl p-6 border border-[#333333] relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#fbbf24] opacity-[0.03] blur-[50px] rounded-full pointer-events-none"></div>

        <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-white text-sm font-bold tracking-wide">CONSISTENCY</h4>
              <p className="text-[#737373] text-xs mt-1">Last 7 Days</p>
            </div>
            <div className="px-3 py-1 rounded bg-[#262626] border border-[#333333] text-xs font-mono text-[#fbbf24]">
              GOAL: {goal}
            </div>
        </div>
      <ResponsiveContainer width="100%" height="75%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#737373" 
            fontSize={10} 
            tickLine={false}
            axisLine={false}
            tick={{ fontFamily: 'Inter', fontWeight: 500 }}
            dy={10}
          />
          <YAxis hide domain={[0, 1.5]} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0e0e0e', borderColor: '#333333', borderRadius: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
            itemStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
            cursor={{ stroke: '#333333', strokeWidth: 1 }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#fbbf24" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorValue)" 
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};