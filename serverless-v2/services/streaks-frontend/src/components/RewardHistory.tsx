import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
} from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import type { StreakReward } from '../types/streaks.types';

interface RewardHistoryProps {
  rewards: StreakReward[] | undefined;
  isLoading: boolean;
}

export default function RewardHistory({ rewards, isLoading }: RewardHistoryProps) {
  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">Loading...</Typography>
      </Paper>
    );
  }

  const items = rewards ?? [];

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <CardGiftcardIcon sx={{ color: '#ff6b35', fontSize: 20 }} />
        <Typography
          variant="h6"
          sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem' }}
        >
          Reward History
        </Typography>
      </Box>

      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No rewards earned yet. Keep your streaks going!
        </Typography>
      ) : (
        <TableContainer sx={{ overflowX: 'hidden' }}>
          <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '30%', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 10, color: 'text.secondary' }}>Date</TableCell>
                <TableCell sx={{ width: '25%', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 10, color: 'text.secondary' }}>Milestone</TableCell>
                <TableCell sx={{ width: '20%', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 10, color: 'text.secondary' }}>Type</TableCell>
                <TableCell sx={{ width: '25%', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 10, color: 'text.secondary' }} align="right">Points</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.slice(0, 20).map((reward) => (
                <TableRow key={reward.rewardId} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {new Date(reward.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{reward.milestone}-day</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={reward.type === 'login_milestone' ? 'Login' : 'Play'}
                      size="small"
                      sx={reward.type === 'login_milestone' ? {
                        bgcolor: 'rgba(255, 107, 53, 0.25)',
                        color: '#ff6b35',
                        border: '1px solid rgba(255, 107, 53, 0.4)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: 10,
                      } : {
                        bgcolor: 'rgba(92, 107, 192, 0.25)',
                        color: '#8c9eff',
                        border: '1px solid rgba(92, 107, 192, 0.4)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: 10,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #ff6b35, #e85d04)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      +{reward.points.toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
