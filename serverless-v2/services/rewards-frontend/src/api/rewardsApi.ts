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
  tagTypes: ['Rewards', 'History'],
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
  }),
});

export const { useGetRewardsSummaryQuery, useGetPointsHistoryQuery } = rewardsApi;
