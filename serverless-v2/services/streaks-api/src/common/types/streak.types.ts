export interface StreakPlayer {
  playerId: string;
  displayName: string;
  loginStreak: number;
  playStreak: number;
  bestLoginStreak: number;
  bestPlayStreak: number;
  lastLoginDate: string | null; // YYYY-MM-DD or null if never logged in
  lastPlayDate: string | null; // YYYY-MM-DD or null if never played
  freezesAvailable: number;
  freezesUsedThisMonth: number;
  lastFreezeGrantDate: string | null; // YYYY-MM or null
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

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

export type StreakType = 'login' | 'play';

export interface StreakUpdateResult {
  newStreak: number;
  gapDays: number;
  streakReset: boolean;
  freezesConsumed: number;
  previousStreak: number;
}
