import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface RewardsSummary {
  playerId: string;
  currentTier: number;
  tierName: string;
  monthlyPoints: number;
  lifetimePoints: number;
  pointsToNextTier: number | null;
  nextTierName: string | null;
  progressPercent: number;
  currentMonthKey: string;
}

export interface PointsTransaction {
  playerId: string;
  timestamp: number;
  transactionId: string;
  handId: string;
  tableId: string;
  tableStakes: string;
  bigBlind: number;
  basePoints: number;
  multiplier: number;
  earnedPoints: number;
  playerTier: number;
  monthKey: string;
  type: 'hand' | 'admin_adjust';
  reason: string | null;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  currentTier: number;
  tierName: string;
  monthlyPoints: number;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  totalPlayers: number;
  playerRank: LeaderboardEntry | null;
}

export interface PlayerNotification {
  playerId: string;
  notificationId: string;
  type: 'tier_upgrade' | 'tier_downgrade' | 'milestone';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResult {
  notifications: PlayerNotification[];
  unreadCount: number;
}

export interface TierHistoryEntry {
  monthKey: string;
  tier: number;
  monthlyPoints: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}

interface PaginatedData<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export const rewardsApi = createApi({
  reducerPath: 'rewardsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/api/v1`,
    prepareHeaders: (headers) => {
      const playerId = localStorage.getItem('playerId');
      if (playerId) {
        headers.set('X-Player-Id', playerId);
      }
      return headers;
    },
  }),
  tagTypes: ['Rewards', 'History', 'Leaderboard', 'Notifications', 'TierHistory'],
  endpoints: (builder) => ({
    getRewardsSummary: builder.query<RewardsSummary, void>({
      query: () => 'player/rewards',
      transformResponse: (response: ApiResponse<RewardsSummary>) => response.data,
      providesTags: ['Rewards'],
    }),
    getPointsHistory: builder.query<PaginatedData<PointsTransaction>, { limit?: number; offset?: number }>({
      query: ({ limit = 20, offset = 0 }) =>
        `player/rewards/history?limit=${limit}&offset=${offset}`,
      transformResponse: (response: ApiResponse<PaginatedData<PointsTransaction>>) => response.data,
      providesTags: ['History'],
    }),
    getLeaderboard: builder.query<LeaderboardResult, { limit?: number }>({
      query: ({ limit = 10 }) => `leaderboard?limit=${limit}`,
      transformResponse: (response: ApiResponse<LeaderboardResult>) => response.data,
      providesTags: ['Leaderboard'],
    }),
    getNotifications: builder.query<NotificationsResult, { unread?: boolean }>({
      query: ({ unread = false }) =>
        `player/notifications${unread ? '?unread=true' : ''}`,
      transformResponse: (response: ApiResponse<NotificationsResult>) => response.data,
      providesTags: ['Notifications'],
    }),
    dismissNotification: builder.mutation<void, string>({
      query: (notificationId) => ({
        url: `player/notifications/${notificationId}/dismiss`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notifications'],
    }),
    getTierHistory: builder.query<TierHistoryEntry[], void>({
      query: () => 'player/tier-history',
      transformResponse: (response: ApiResponse<TierHistoryEntry[]>) => response.data,
      providesTags: ['TierHistory'],
    }),
  }),
});

export const {
  useGetRewardsSummaryQuery,
  useGetPointsHistoryQuery,
  useGetLeaderboardQuery,
  useGetNotificationsQuery,
  useDismissNotificationMutation,
  useGetTierHistoryQuery,
} = rewardsApi;
