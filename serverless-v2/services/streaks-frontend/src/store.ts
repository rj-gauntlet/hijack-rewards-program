import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { streaksApi } from './api/streaksApi';

interface AuthState {
  playerId: string | null;
  isAuthenticated: boolean;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: { playerId: null, isAuthenticated: false } as AuthState,
  reducers: {
    login(state, action: PayloadAction<string>) {
      state.playerId = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('playerId', action.payload);
    },
    logout(state) {
      state.playerId = null;
      state.isAuthenticated = false;
      localStorage.removeItem('playerId');
    },
  },
});

export const { login, logout } = authSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    [streaksApi.reducerPath]: streaksApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(streaksApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
