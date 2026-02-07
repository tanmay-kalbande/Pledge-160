import React, { useState } from 'react';
import { Button } from './Button';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { ShieldCheck, Mail, Lock, ArrowRight, User } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error("Connection Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables");
      }

      // Real Supabase Auth
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // Sign Up with Metadata (Name)
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            }
          }
        });
        if (error) throw error;
      }

      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#fbbf24] text-[#0e0e0e] mb-4 shadow-[0_0_40px_rgba(251,191,36,0.2)]">
            <ShieldCheck size={32} strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Pledge 160</h1>
          <p className="text-[#737373] text-sm">Discipline Protocol & Accountability</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl p-8 space-y-6">
          <div className="flex bg-[#0e0e0e] p-1 rounded-lg">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${isLogin ? 'bg-[#262626] text-white shadow' : 'text-[#525252] hover:text-[#a3a3a3]'}`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${!isLogin ? 'bg-[#262626] text-white shadow' : 'text-[#525252] hover:text-[#a3a3a3]'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">

            {!isLogin && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                <label className="text-[10px] font-bold text-[#fbbf24] uppercase tracking-widest">Codename / Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3.5 text-[#525252]" />
                  <input
                    type="text"
                    required={!isLogin}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0e0e0e] border border-[#333333] rounded-lg py-3 pl-10 pr-4 text-white placeholder-[#333333] focus:border-[#fbbf24] focus:outline-none transition-colors"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#fbbf24] uppercase tracking-widest">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3.5 text-[#525252]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0e0e0e] border border-[#333333] rounded-lg py-3 pl-10 pr-4 text-white placeholder-[#333333] focus:border-[#fbbf24] focus:outline-none transition-colors"
                  placeholder="operative@pledge.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#fbbf24] uppercase tracking-widest">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-[#525252]" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0e0e0e] border border-[#333333] rounded-lg py-3 pl-10 pr-4 text-white placeholder-[#333333] focus:border-[#fbbf24] focus:outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-xs bg-red-500/10 p-2 rounded border border-red-500/20">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full mt-2" isLoading={loading}>
              {isLogin ? 'Enter System' : 'Initiate Protocol'} <ArrowRight size={16} className="ml-2" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};