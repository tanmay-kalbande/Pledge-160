import React, { useState } from 'react';
import { Button } from './Button';
import { updateProfileSettings } from '../services/dataService';
import { UserProfile } from '../types';
import { X, Save, Sliders, Calendar } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdate: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [goal, setGoal] = useState(user.pledgeGoal.toString());
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        const goalNum = parseInt(goal) || 160;
        await updateProfileSettings(user.id, {
            name: name,
            pledgeGoal: goalNum
        });
        await onUpdate();
        onClose();
    } catch (err) {
        alert("Failed to update settings");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0e0e0e] border border-[#333333] w-full max-w-sm rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#333333] bg-[#141414]">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-[#fbbf24]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Protocol Settings</h2>
          </div>
          <button onClick={onClose} className="text-[#525252] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">Codename / Display Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg py-3 px-4 text-white focus:border-[#fbbf24] focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">Pledge Goal (Days)</label>
            <div className="relative">
                <Calendar size={16} className="absolute left-3 top-3.5 text-[#525252]" />
                <input 
                type="number" 
                min="1"
                max="3650"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg py-3 pl-10 pr-4 text-white focus:border-[#fbbf24] focus:outline-none transition-colors"
                />
            </div>
            <p className="text-[10px] text-[#525252] mt-1">Recommended: 90, 160, or 365 days.</p>
          </div>

          <Button type="submit" className="w-full" isLoading={loading}>
            <Save size={16} className="mr-2" /> Save Changes
          </Button>

        </form>
      </div>
    </div>
  );
};