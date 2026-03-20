import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';

const HIJACK_LOGO_URL = 'https://www.hijackpoker.com/hubfs/Hijack%20Poker%20(R)1.svg';
import StreakCounter from '../components/StreakCounter';
import CalendarHeatMap from '../components/CalendarHeatMap';
import MilestoneProgress from '../components/MilestoneProgress';
import FreezeStatus from '../components/FreezeStatus';
import RewardHistory from '../components/RewardHistory';
import PersonalBest from '../components/PersonalBest';
import {
  streaksApi,
  useGetStreaksQuery,
  useCheckInMutation,
  useGetCalendarQuery,
  useGetRewardsQuery,
  useGetFreezesQuery,
} from '../api/streaksApi';
import { useDispatch } from 'react-redux';

function Dashboard() {
  const [playerId, setPlayerId] = useState(
    () => localStorage.getItem('playerId') || '',
  );
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!localStorage.getItem('playerId'),
  );
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const handleLogin = () => {
    if (playerId.trim()) {
      localStorage.setItem('playerId', playerId.trim());
      setIsLoggedIn(true);
    }
  };

  if (!isLoggedIn) {
    return (
      <Container maxWidth="xs" sx={{ mt: 10 }}>
        <Paper sx={{ p: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <Box
            component="img"
            src={HIJACK_LOGO_URL}
            alt="Hijack Poker"
            sx={{ height: 48, width: 'auto', maxWidth: 200, objectFit: 'contain' }}
          />
          <Typography
            variant="caption"
            sx={{ color: 'primary.main', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', mt: 1 }}
          >
            Daily Streaks
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter a player ID to view streaks. This is a stub — no real authentication.
        </Typography>
        <TextField
          fullWidth
          label="Player ID"
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          placeholder="e.g., streak-001"
          sx={{ mb: 2 }}
        />
        <Button fullWidth variant="contained" onClick={handleLogin} disabled={!playerId.trim()}>
          Login
        </Button>
        </Paper>
      </Container>
    );
  }

  const dispatch = useDispatch();
  const handleLogout = () => {
    localStorage.removeItem('playerId');
    dispatch(streaksApi.util.resetApiState());
    setPlayerId('');
    setIsLoggedIn(false);
  };

  return <DashboardContent playerId={playerId} onLogout={handleLogout} setSnackbar={setSnackbar} snackbar={snackbar} />;
}

function DashboardContent({
  playerId,
  onLogout,
  setSnackbar,
  snackbar,
}: {
  playerId: string;
  onLogout: () => void;
  setSnackbar: (s: { open: boolean; message: string; severity: 'success' | 'info' }) => void;
  snackbar: { open: boolean; message: string; severity: 'success' | 'info' };
}) {
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  });
  const { data: streaks, isLoading: streaksLoading, error: streaksError } = useGetStreaksQuery();
  const { data: calendar, isLoading: calendarLoading } = useGetCalendarQuery(calendarMonth);
  const { data: rewardsData, isLoading: rewardsLoading } = useGetRewardsQuery();
  const { data: freezeData, isLoading: freezeLoading } = useGetFreezesQuery();
  const [checkIn, { isLoading: checkingIn }] = useCheckInMutation();

  const handleCheckIn = async () => {
    try {
      const result = await checkIn().unwrap();
      if (result.alreadyCheckedIn) {
        setSnackbar({ open: true, message: 'Already checked in today!', severity: 'info' });
      } else {
        const msg = result.milestonesEarned.length > 0
          ? `Checked in! Milestone reached: +${result.milestonesEarned[0].points} pts!`
          : `Checked in! Login streak: ${result.loginStreak}`;
        setSnackbar({ open: true, message: msg, severity: 'success' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Check-in failed', severity: 'info' });
    }
  };

  if (streaksLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (streaksError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Failed to load streak data. Is the API running at localhost:5001?
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, pb: 4 }}>
      {/* Header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={4}
        pb={2.5}
        borderBottom="1px solid rgba(255, 255, 255, 0.12)"
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            component="img"
            src={HIJACK_LOGO_URL}
            alt="Hijack Poker"
            sx={{ height: 56, width: 'auto', maxWidth: 280, objectFit: 'contain' }}
          />
          <Typography
            variant="h5"
            component="span"
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              letterSpacing: '0.05em',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Daily Streaks
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            startIcon={<LoginIcon />}
            onClick={handleCheckIn}
            disabled={checkingIn}
            size="large"
          >
            {checkingIn ? 'Checking in...' : 'Check In'}
          </Button>
          <Button
            variant="contained"
            startIcon={<LogoutIcon />}
            onClick={onLogout}
            size="medium"
          >
            Logout
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Row 1: Streak Counters */}
        <Grid item xs={12} sm={6}>
          <StreakCounter
            type="login"
            count={streaks?.loginStreak ?? 0}
            label="Login Streak"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <StreakCounter
            type="play"
            count={streaks?.playStreak ?? 0}
            label="Play Streak"
          />
        </Grid>

        {/* Row 2: Calendar + Milestones/Personal Best (matched height) */}
        <Grid item xs={12} md={7}>
          {calendarLoading ? (
            <Box textAlign="center" p={4}>
              <CircularProgress size={24} />
            </Box>
          ) : calendar ? (
            <CalendarHeatMap
              days={calendar.days}
              month={calendar.month}
              onMonthChange={setCalendarMonth}
            />
          ) : null}
        </Grid>
        <Grid item xs={12} md={5}>
          <Box display="flex" flexDirection="column" gap={3} height="100%">
            <Box sx={{ flex: 1 }}>
              <MilestoneProgress
                loginMilestone={streaks?.nextLoginMilestone ?? null}
                playMilestone={streaks?.nextPlayMilestone ?? null}
                loginStreak={streaks?.loginStreak ?? 0}
                playStreak={streaks?.playStreak ?? 0}
              />
            </Box>
            <PersonalBest
              bestLoginStreak={streaks?.bestLoginStreak ?? 0}
              bestPlayStreak={streaks?.bestPlayStreak ?? 0}
            />
          </Box>
        </Grid>

        {/* Row 3: Freezes + Reward History (variable height, side by side) */}
        <Grid item xs={12} sm={6}>
          <FreezeStatus data={freezeData} isLoading={freezeLoading} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <RewardHistory rewards={rewardsData?.rewards} isLoading={rewardsLoading} />
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Dashboard;
