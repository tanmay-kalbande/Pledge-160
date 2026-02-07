export interface CheckInLog {
  id: string;
  userId: string;
  date: string; // ISO date string YYYY-MM-DD
  status: 'SUCCESS' | 'RELAPSE';
  note?: string;
  mood?: string;
}

export interface UserProfile {
  id: string; // UUID from Auth
  email: string;
  name: string;
  avatar?: string;
  currentStreak: number;
  bestStreak: number;
  lastCheckInDate: string | null;
  journeyStartDate?: string; // ISO date string
  pledgeGoal: number; // Configurable goal (default 160)
}

export interface Partnership {
  id: string;
  requesterId: string;
  receiverEmail: string;
  status: 'pending' | 'accepted';
}

export interface PledgeState {
  startDate: string; // ISO date string
  goalDays: number;
}

export enum UserRole {
  ME = 'ME',
  FRIEND = 'FRIEND'
}

export interface MotivationResponse {
  quote: string;
  author: string;
}