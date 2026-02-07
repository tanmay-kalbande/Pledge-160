import { supabase, isSupabaseConfigured } from './supabaseClient';
import { CheckInLog, UserProfile } from '../types';
import { DEFAULT_PLEDGE_GOAL } from '../constants';

// --- REALTIME SUBSCRIPTIONS ---

export const subscribeToUpdates = (onUpdate: () => void) => {
  if (!isSupabaseConfigured || !supabase) return () => {};

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
      .subscribe(),
      
    // Listen for new partnership requests
    supabase.channel('public:partnerships')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partnerships' }, () => {
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

// --- PARTNERSHIP SERVICES ---

export const getPartners = async (currentUserId: string): Promise<UserProfile[]> => {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data: partnerships } = await supabase
      .from('partnerships')
      .select('*')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${currentUserId},receiver_email.eq.${user.email}`);
    
    if (!partnerships || partnerships.length === 0) return [];
    
    const partnerProfiles: UserProfile[] = [];

    for (const rel of partnerships) {
      let p;
      // Depending on who initiated, we fetch the *other* person's profile
      if (rel.requester_id === currentUserId) {
        // I requested, so fetching receiver
        const res = await supabase.from('profiles').select('*').eq('email', rel.receiver_email).single();
        p = res.data;
      } else {
        // I received, so fetching requester
        const res = await supabase.from('profiles').select('*').eq('id', rel.requester_id).single();
        p = res.data;
      }

      if (p) {
        partnerProfiles.push({ 
          ...p, 
          journeyStartDate: p.journey_start_date,
          pledgeGoal: p.pledge_goal || DEFAULT_PLEDGE_GOAL
        });
      }
    }
    
    return partnerProfiles;
  } catch (error) {
    console.error("Error fetching partners:", error);
    return [];
  }
};

export const sendPartnershipRequest = async (receiverEmail: string) => {
  if (!isSupabaseConfigured || !supabase) throw new Error("Database not connected");

  const user = await getCurrentUser();
  if (!user) throw new Error("Not logged in");
  
  // Check for self-invite
  if (receiverEmail.toLowerCase() === user.email.toLowerCase()) {
    throw new Error("You cannot invite yourself.");
  }
  
  const { data: existing } = await supabase.from('partnerships')
      .select('*')
      .eq('receiver_email', receiverEmail)
      .eq('requester_id', user.id)
      .single();
      
  if (existing) return;

  await supabase.from('partnerships').insert([{
    requester_id: user.id,
    receiver_email: receiverEmail,
    status: 'pending'
  }]);
};

export const checkOutgoingRequests = async (): Promise<string | null> => {
  if (!isSupabaseConfigured || !supabase) return null;

   const user = await getCurrentUser();
   if (!user) return null;

   const { data } = await supabase
     .from('partnerships')
     .select('receiver_email')
     .eq('requester_id', user.id)
     .eq('status', 'pending')
     .order('created_at', { ascending: false })
     .limit(1)
     .single();
   
   return data ? data.receiver_email : null;
}

export const checkIncomingRequests = async () => {
  if (!isSupabaseConfigured || !supabase) return [];

  const user = await getCurrentUser();
  if (!user) return [];
  
  const { data } = await supabase.from('partnerships')
    .select('*')
    .eq('receiver_email', user.email)
    .eq('status', 'pending');
    
  if (data && data.length > 0) {
      const enriched = await Promise.all(data.map(async (req: any) => {
          // Fetch requester name. Note: RLS must allow this (see updated db_schema.sql)
          const { data: p } = await supabase.from('profiles').select('name').eq('id', req.requester_id).single();
          return { ...req, requesterName: p?.name || 'Unknown User' };
      }));
      return enriched;
  }
  return [];
};

export const acceptRequest = async (requestId: string) => {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('partnerships').update({ status: 'accepted' }).eq('id', requestId);
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