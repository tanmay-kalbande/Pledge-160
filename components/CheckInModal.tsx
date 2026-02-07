import React, { useState } from 'react';
import { MOODS } from '../constants';
import { Button } from './Button';
import { X, Check, X as XIcon } from 'lucide-react';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (status: 'SUCCESS' | 'RELAPSE', mood: string, note: string) => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [status, setStatus] = useState<'SUCCESS' | 'RELAPSE' | null>(null);
  const [selectedMood, setSelectedMood] = useState<string>(MOODS[0].label);
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (status) {
      onSubmit(status, selectedMood, note);
      setStatus(null);
      setNote('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0e0e0e] border border-[#333333] w-full max-w-sm rounded-lg shadow-2xl overflow-hidden">
        
        <div className="flex justify-between items-center p-4 border-b border-[#333333] bg-[#141414]">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">New Entry</h2>
          <button onClick={onClose} className="text-[#525252] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">Outcome</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStatus('SUCCESS')}
                className={`flex items-center justify-center gap-2 p-3 rounded border transition-all ${
                  status === 'SUCCESS' 
                    ? 'bg-[#fbbf24] border-[#fbbf24] text-[#0e0e0e]' 
                    : 'bg-[#1a1a1a] border-[#333333] text-[#737373] hover:border-[#737373]'
                }`}
              >
                <Check size={16} strokeWidth={3} />
                <span className="font-bold text-xs uppercase">Success</span>
              </button>
              
              <button
                onClick={() => setStatus('RELAPSE')}
                className={`flex items-center justify-center gap-2 p-3 rounded border transition-all ${
                  status === 'RELAPSE' 
                    ? 'bg-red-600 border-red-600 text-white' 
                    : 'bg-[#1a1a1a] border-[#333333] text-[#737373] hover:border-[#737373]'
                }`}
              >
                <XIcon size={16} strokeWidth={3} />
                <span className="font-bold text-xs uppercase">Relapse</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">Mental State</label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.label}
                  onClick={() => setSelectedMood(m.label)}
                  className={`px-3 py-1.5 rounded text-xs border transition-all ${
                    selectedMood === m.label
                      ? 'bg-[#262626] text-[#fbbf24] border-[#fbbf24]'
                      : 'bg-[#1a1a1a] text-[#737373] border-[#333333] hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">Log</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Brief tactical update..."
              className="w-full bg-[#141414] border border-[#333333] rounded p-3 text-sm text-white focus:outline-none focus:border-[#fbbf24] h-20 resize-none"
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={!status} 
            className="w-full rounded h-10 text-xs uppercase tracking-widest"
            variant={status === 'RELAPSE' ? 'danger' : 'primary'}
          >
            Submit Report
          </Button>

        </div>
      </div>
    </div>
  );
};