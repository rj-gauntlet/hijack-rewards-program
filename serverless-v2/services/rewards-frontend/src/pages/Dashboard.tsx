import { Container, Typography, Box, Button, Grid } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LogoutIcon from '@mui/icons-material/Logout';
import SummaryCard from '../components/SummaryCard';
import PointsHistory from '../components/PointsHistory';
import LeaderboardWidget from '../components/LeaderboardWidget';
import TierTimeline from '../components/TierTimeline';
import NotificationBell from '../components/NotificationBell';
import { logout, type RootState } from '../store';

function Dashboard() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <EmojiEventsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight={700}>
            Rewards Dashboard
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <NotificationBell />
          <Button
            variant="outlined"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={() => dispatch(logout())}
          >
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
