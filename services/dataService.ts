import { supabase, isSupabaseConfigured } from './supabaseClient';
import { CheckInLog, UserProfile } from '../types';
import { DEFAULT_PLEDGE_GOAL } from '../constants';

// --- HARDCODED TWO-USER SYSTEM ---
const USER_EMAILS = {
  me: 'ashu@pledge.in',      // Ashu
  bro: 'mayank@pledge.in'    // Mayank
};

// --- REALTIME SUBSCRIPTIONS ---

export const subscribeToUpdates = (onUpdate: () => void) => {
  if (!isSupabaseConfigured || !supabase) return () => { };

  const channels = [
    // Listen for changes in logs (check-ins)
    supabase.channel('public:logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logs' }, () => {
        onUpdate();
      })
      .subscribe(),

    // Listen for changes in profiles (streaks, settings)
    supabase.channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        onUpdate();
      })
      .subscribe()
  ];

  return () => {
    channels.forEach(channel => supabase!.removeChannel(channel));
  };
};

// --- AUTH SERVICES ---

export const getCurrentUser = async (): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    if (data) {
      return {
        ...data,
        journeyStartDate: data.journey_start_date,
        pledgeGoal: data.pledge_goal || DEFAULT_PLEDGE_GOAL
      } as UserProfile;
    }

    // Fallback if profile doesn't exist yet (race condition with trigger)
    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name || user.email!.split('@')[0],
      currentStreak: 0,
      bestStreak: 0,
      lastCheckInDate: null,
      pledgeGoal: DEFAULT_PLEDGE_GOAL
    };
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
};

export const updateProfileSettings = async (userId: string, updates: { name: string; pledgeGoal: number }) => {
  if (!isSupabaseConfigured || !supabase) throw new Error("Database not connected");

  await supabase.from('profiles').update({
    name: updates.name,
    pledge_goal: updates.pledgeGoal
  }).eq('id', userId);
};

export const logout = async () => {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
};

// --- SIMPLE TWO-USER PARTNER SYSTEM ---

export const getBroProfile = async (currentUserEmail: string): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    // Determine who is "bro" based on current user
    const normalizedEmail = currentUserEmail.toLowerCase().trim();
    const broEmail = normalizedEmail === USER_EMAILS.me.toLowerCase()
      ? USER_EMAILS.bro
      : USER_EMAILS.me;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', broEmail)
      .single();

    if (data) {
      return {
        ...data,
        journeyStartDate: data.journey_start_date,
        pledgeGoal: data.pledge_goal || DEFAULT_PLEDGE_GOAL
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching bro profile:", error);
    return null;
  }
};

// --- DATA SERVICES ---

export const getLogs = async (): Promise<CheckInLog[]> => {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase.from('logs').select('*').order('date', { ascending: false });
  if (!error && data) return data as CheckInLog[];
  return [];
};

export const submitCheckIn = async (log: Omit<CheckInLog, 'id'>, user: UserProfile): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) throw new Error("Database not connected");

  const newLog: CheckInLog = { ...log, id: crypto.randomUUID() };
  await supabase.from('logs').insert([newLog]);

  // Update Streak Logic
  let updatedUser = { ...user };

  // Helper to check if two dates are the same calendar day (Client Local Time)
  const isSameDay = (d1: string, d2: string) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  };

  const alreadyCheckedInToday = user.lastCheckInDate && isSameDay(user.lastCheckInDate, newLog.date);

  if (newLog.status === 'RELAPSE') {
    updatedUser.currentStreak = 0;
    // Always update last check-in date on relapse to mark the event
    updatedUser.lastCheckInDate = newLog.date;
  } else {
    // Only increment streak if we haven't checked in successfully today
    if (!alreadyCheckedInToday) {
      updatedUser.currentStreak += 1;
      updatedUser.lastCheckInDate = newLog.date;
    }

    // Check for best streak
    if (updatedUser.currentStreak > updatedUser.bestStreak) {
      updatedUser.bestStreak = updatedUser.currentStreak;
    }
  }

  // If no start date, set it now
  if (!updatedUser.journeyStartDate) {
    updatedUser.journeyStartDate = new Date().toISOString();
  }

  const dbProfile = {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    current_streak: updatedUser.currentStreak,
    best_streak: updatedUser.bestStreak,
    last_check_in_date: updatedUser.lastCheckInDate,
    journey_start_date: updatedUser.journeyStartDate,
    pledge_goal: updatedUser.pledgeGoal
  };

  await supabase.from('profiles').upsert(dbProfile);
};

export const updateJourneyStart = async (date: string, user: UserProfile) => {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('profiles').update({ journey_start_date: date }).eq('id', user.id);
};