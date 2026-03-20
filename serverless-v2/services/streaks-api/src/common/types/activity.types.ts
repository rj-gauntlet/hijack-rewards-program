export enum ActivityType {
  NONE = 'none',
  LOGIN_ONLY = 'login_only',
  PLAYED = 'played',
  FREEZE = 'freeze',
  STREAK_BROKEN = 'streak_broken',
}

export interface DailyActivity {
  playerId: string;
  date: string; // YYYY-MM-DD
  loggedIn: boolean;
  played: boolean;
  freezeUsed: boolean;
  streakBroken: boolean;
  loginStreakAtDay: number;
  playStreakAtDay: number;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  activity: ActivityType;
  loginStreak: number;
  playStreak: number;
}

export interface CalendarResponse {
  month: string; // YYYY-MM
  days: CalendarDay[];
}
