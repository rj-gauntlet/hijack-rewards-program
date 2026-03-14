import {
  Paper,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Skeleton,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useGetRewardsSummaryQuery } from '../api/rewardsApi';

const TIER_COLORS: Record<string, string> = {
  Bronze: '#CD7F32',
  Silver: '#C0C0C0',
  Gold: '#FFD700',
  Platinum: '#E5E4E2',
};

const TIER_ICONS: Record<string, string> = {
  Bronze: '🥉',
  Silver: '🥈',
  Gold: '🥇',
  Platinum: '💎',
};

export default function SummaryCard() {
  const { data, isLoading, error } = useGetRewardsSummaryQuery();

  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="rectangular" height={80} sx={{ mt: 2 }} />
      </Paper>
    );
  }

  if (error || !data) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="error">
          Failed to load rewards data. Make sure you're logged in.
        </Typography>
      </Paper>
    );
  }

  const tierColor = TIER_COLORS[data.tierName] || '#6C63FF';
  const tierIcon = TIER_ICONS[data.tierName] || '🏆';

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <EmojiEventsIcon sx={{ fontSize: 32, color: tierColor }} />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {tierIcon} {data.tierName} Tier
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Player: {data.playerId}
            </Typography>
          </Box>
        </Box>
        <Chip
          label={`${data.monthlyPoints.toLocaleString()} pts this month`}
          sx={{ bgcolor: tierColor, color: '#000', fontWeight: 600 }}
        />
      </Box>

      <Box display="flex" justifyContent="space-between" mb={1}>
        <Typography variant="body2" color="text.secondary">
          {data.nextTierName
            ? `${data.pointsToNextTier?.toLocaleString()} pts to ${data.nextTierName}`
            : 'Max tier reached!'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {data.progressPercent}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={data.progressPercent}
        sx={{
          height: 10,
          borderRadius: 5,
          bgcolor: 'rgba(255,255,255,0.1)',
          '& .MuiLinearProgress-bar': { bgcolor: tierColor, borderRadius: 5 },
        }}
      />

      <Box display="flex" justifyContent="space-between" mt={2}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Lifetime Points
          </Typography>
          <Typography variant="h6" fontWeight={600}>
            {data.lifetimePoints.toLocaleString()}
          </Typography>
        </Box>
        <Box textAlign="right">
          <Typography variant="caption" color="text.secondary">
            Month
          </Typography>
          <Typography variant="h6" fontWeight={600}>
            {data.currentMonthKey}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
