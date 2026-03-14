import { Container, Box, Button, Grid, Typography } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';

// Full logo from hijackpoker.com — update path if your instance uses a different asset URL
const HIJACK_LOGO_URL = 'https://www.hijackpoker.com/hubfs/Hijack%20Poker%20(R)1.svg';
import SummaryCard from '../components/SummaryCard';
import PointsHistory from '../components/PointsHistory';
import LeaderboardWidget from '../components/LeaderboardWidget';
import TierTimeline from '../components/TierTimeline';
import NotificationBell from '../components/NotificationBell';
import { useNotificationStream } from '../hooks/useNotificationStream';
import { logout, type RootState } from '../store';
import { rewardsApi } from '../api/rewardsApi';

function Dashboard() {
  const { isAuthenticated, playerId } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  useNotificationStream(isAuthenticated ? playerId : null);

  const handleLogout = () => {
    dispatch(rewardsApi.util.resetApiState());
    dispatch(logout());
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
        flexWrap="wrap"
        gap={2}
        sx={{ pb: 2.5, borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}
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
            Rewards Dashboard
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1.5}>
          <NotificationBell />
          <Button variant="contained" size="medium" startIcon={<LogoutIcon />} onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Box display="flex" flexDirection="column" gap={3}>
            <SummaryCard />
            <PointsHistory />
          </Box>
        </Grid>
        <Grid item xs={12} md={5}>
          <Box display="flex" flexDirection="column" gap={3}>
            <LeaderboardWidget />
            <TierTimeline />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
