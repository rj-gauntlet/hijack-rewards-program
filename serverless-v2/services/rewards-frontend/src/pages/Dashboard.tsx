import { Container, Typography, Box, Button } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LogoutIcon from '@mui/icons-material/Logout';
import SummaryCard from '../components/SummaryCard';
import PointsHistory from '../components/PointsHistory';
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
        <Button
          variant="outlined"
          size="small"
          startIcon={<LogoutIcon />}
          onClick={() => dispatch(logout())}
        >
          Logout
        </Button>
      </Box>

      <Box display="flex" flexDirection="column" gap={3}>
        <SummaryCard />
        <PointsHistory />
      </Box>
    </Container>
  );
}

export default Dashboard;
