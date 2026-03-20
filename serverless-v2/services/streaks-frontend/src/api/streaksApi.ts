import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  ApiResponse,
  StreakState,
  CalendarResponse,
  StreakReward,
  FreezeData,
  CheckInResponse,
} from '../types/streaks.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const streaksApi = createApi({
  reducerPath: 'streaksApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}`,
    prepareHeaders: (headers) => {
      const playerId = localStorage.getItem('playerId');
      if (playerId) {
        headers.set('X-Player-Id', playerId);
      }
      return headers;
    },
  }),
  tagTypes: ['Streaks', 'Calendar', 'Rewards', 'Freezes'],
  endpoints: (builder) => ({
    getStreaks: builder.query<StreakState, void>({
      query: () => '/api/v1/player/streaks',
      transformResponse: (response: ApiResponse<StreakState>) => response.data,
      providesTags: ['Streaks'],
    }),

    checkIn: builder.mutation<CheckInResponse, void>({
      query: () => ({
        url: '/api/v1/player/streaks/check-in',
        method: 'POST',
      }),
      transformResponse: (response: ApiResponse<CheckInResponse>) => response.data,
      invalidatesTags: ['Streaks', 'Calendar', 'Rewards', 'Freezes'],
    }),

    getCalendar: builder.query<CalendarResponse, string | void>({
      query: (month) => {
        const params = month ? `?month=${month}` : '';
        return `/api/v1/player/streaks/calendar${params}`;
      },
      transformResponse: (response: ApiResponse<CalendarResponse>) => response.data,
      providesTags: ['Calendar'],
    }),

    getRewards: builder.query<{ rewards: StreakReward[] }, void>({
      query: () => '/api/v1/player/streaks/rewards',
      transformResponse: (response: ApiResponse<{ rewards: StreakReward[] }>) => response.data,
      providesTags: ['Rewards'],
    }),

    getFreezes: builder.query<FreezeData, void>({
      query: () => '/api/v1/player/streaks/freezes',
      transformResponse: (response: ApiResponse<FreezeData>) => response.data,
      providesTags: ['Freezes'],
    }),
  }),
});

export const {
  useGetStreaksQuery,
  useCheckInMutation,
  useGetCalendarQuery,
  useGetRewardsQuery,
  useGetFreezesQuery,
} = streaksApi;
