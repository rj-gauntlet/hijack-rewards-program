export interface StreakState {
  loginStreak: number;
  playStreak: number;
  bestLoginStreak: number;
  bestPlayStreak: number;
  freezesAvailable: number;
  nextLoginMilestone: NextMilestone | null;
  nextPlayMilestone: NextMilestone | null;
  lastLoginDate: string | null;
  lastPlayDate: string | null;
}

export interface NextMilestone {
  days: number;
  reward: number;
  daysRemaining: number;
}

export interface CalendarDay {
  date: string;
  activity: 'none' | 'login_only' | 'played' | 'freeze' | 'streak_broken';
  loginStreak: number;
  playStreak: number;
}

export interface CalendarResponse {
  month: string;
  days: CalendarDay[];
}

export interface StreakReward {
  playerId: string;
  rewardId: string;
  type: 'login_milestone' | 'play_milestone';
  milestone: number;
  points: number;
  streakCount: number;
  createdAt: string;
}

export interface FreezeRecord {
  playerId: string;
  date: string;
  source: 'free_monthly' | 'purchased';
}

export interface FreezeData {
  status: {
    freezesAvailable: number;
    freezesUsedThisMonth: number;
    lastGrantDate: string | null;
  };
  history: FreezeRecord[];
}

export interface CheckInResponse {
  loginStreak: number;
  playStreak: number;
  bestLoginStreak: number;
  bestPlayStreak: number;
  freezesAvailable: number;
  lastLoginDate: string;
  alreadyCheckedIn: boolean;
  milestonesEarned: { milestone: number; type: string; points: number }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
