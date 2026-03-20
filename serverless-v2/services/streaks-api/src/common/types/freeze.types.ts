export type FreezeSource = 'free_monthly' | 'purchased';

export interface FreezeRecord {
  playerId: string;
  date: string; // YYYY-MM-DD when freeze was consumed
  source: FreezeSource;
}

export interface FreezeConsumeResult {
  daysProtected: number;
  daysUnprotected: number;
  streakSurvived: boolean;
  freezeDates: string[]; // dates where freezes were consumed
}

export interface FreezeStatus {
  freezesAvailable: number;
  freezesUsedThisMonth: number;
  lastGrantDate: string | null; // YYYY-MM
}
