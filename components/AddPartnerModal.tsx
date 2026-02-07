import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { sendPartnershipRequest, checkIncomingRequests, checkOutgoingRequests, acceptRequest } from '../services/dataService';
import { Users, Mail, RefreshCw, X, Check } from 'lucide-react';

interface AddPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPartnerAdded: () => void;
}

export const AddPartnerModal: React.FC<AddPartnerModalProps> = ({ isOpen, onClose, onPartnerAdded }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentToEmail, setSentToEmail] = useState<string | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'invite' | 'requests'>('invite');

  // Initial check
  const refreshData = async () => {
    // 1. Check incoming
    const incoming = await checkIncomingRequests();
    setIncomingRequests(incoming);
    if (incoming.length > 0) setActiveTab('requests');

    // 2. Check outgoing
    const outgoingEmail = await checkOutgoingRequests();
    if (outgoingEmail) {
      setSentToEmail(outgoingEmail);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      const interval = setInterval(refreshData, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPartnershipRequest(email);
      setSentToEmail(email);
    } catch (err) {
      alert("Failed to send request. Ensure email is correct.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    setLoading(true);
    await acceptRequest(id);
    onPartnerAdded();
    onClose();
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0e0e0e] border border-[#333333] w-full max-w-sm rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#333333] bg-[#141414]">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#fbbf24]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Add Partner</h2>
          </div>
          <button onClick={onClose} className="text-[#525252] hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Tabs if there are requests */}
        {incomingRequests.length > 0 && (
          <div className="flex p-1 bg-[#0e0e0e] border-b border-[#333333]">
            <button 
              onClick={() => setActiveTab('invite')}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'invite' ? 'text-[#fbbf24] bg-[#1a1a1a]' : 'text-[#525252]'}`}
            >
              Invite
            </button>
            <button 
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'requests' ? 'text-[#fbbf24] bg-[#1a1a1a]' : 'text-[#525252]'}`}
            >
              Requests ({incomingRequests.length})
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto">
          
          {activeTab === 'invite' && (
             <div className="space-y-6">
                {!sentToEmail ? (
                  <form onSubmit={handleSend} className="space-y-4">
                    <p className="text-xs text-[#737373] leading-relaxed">
                      Enter your friend's email to send them a partnership request. They must have an account.
                    </p>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">Email Address</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-3.5 text-[#525252]" />
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg py-3 pl-10 pr-4 text-white placeholder-[#333333] focus:border-[#fbbf24] focus:outline-none transition-colors"
                          placeholder="friend@pledge.com"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" isLoading={loading}>
                      Send Invitation
                    </Button>
                  </form>
                ) : (
                  <div className="text-center space-y-4 py-4">
                    <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto border border-[#333333]">
                       <RefreshCw size={24} className="text-[#fbbf24] animate-spin-slow" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm">Request Pending</h3>
                      <p className="text-[#737373] text-xs mt-1">Waiting for <span className="text-[#fbbf24]">{sentToEmail}</span></p>
                    </div>
                    <Button variant="secondary" onClick={() => setSentToEmail(null)} size="sm" className="w-full">
                      Cancel & Send New
                    </Button>
                  </div>
                )}
             </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-3">
              {incomingRequests.map(req => (
                <div key={req.id} className="bg-[#1a1a1a] border border-[#333333] p-4 rounded-lg flex items-center justify-between">
                   <div>
                     <p className="text-sm font-bold text-white">{req.requesterName}</p>
                     <p className="text-[10px] text-[#737373] uppercase tracking-wider">Incoming Request</p>
                   </div>
                   <Button size="sm" onClick={() => handleAccept(req.id)} isLoading={loading}>
                     Accept
                   </Button>
                </div>
              ))}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};