import {
  Paper,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Skeleton,
} from '@mui/material';
import { useGetRewardsSummaryQuery } from '../api/rewardsApi';

const TIER_COLORS: Record<string, string> = {
  Bronze: '#CD7F32',
  Silver: '#C0C0C0',
  Gold: '#ff6b35',
  Platinum: '#D4E8F7',
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

  const tierColor = TIER_COLORS[data.tierName] || '#ff6b35';
  const tierIcon = TIER_ICONS[data.tierName] || '🏆';

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} color="white" sx={{ mb: 0.5 }}>
        {data.displayName || data.playerId}
      </Typography>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Chip
          label={`${tierIcon} ${data.tierName} Tier`}
          size="medium"
          sx={{
            bgcolor: `${tierColor}33`,
            color: tierColor,
            fontWeight: 700,
            border: `1px solid ${tierColor}66`,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        />
        <Chip
          label={`${data.monthlyPoints.toLocaleString()} pts this month`}
          sx={{
            background: 'linear-gradient(135deg, #ff6b35, #e85d04)',
            color: '#000',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        />
      </Box>

      <Box display="flex" justifyContent="space-between" mb={1}>
        <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          {data.nextTierName
            ? `${data.pointsToNextTier?.toLocaleString()} pts to ${data.nextTierName}`
            : 'Max tier reached!'}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          {data.progressPercent}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={data.progressPercent}
        sx={{
          height: 12,
          borderRadius: 1,
          bgcolor: 'rgba(255,255,255,0.1)',
          '& .MuiLinearProgress-bar': {
            background: 'linear-gradient(90deg, #ff6b35, #e85d04)',
            borderRadius: 1,
          },
        }}
      />

      <Box display="flex" justifyContent="space-between" mt={2} sx={{ pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
            Lifetime Points
          </Typography>
          <Typography variant="h6" fontWeight={600} color="white">
            {data.lifetimePoints.toLocaleString()}
          </Typography>
        </Box>
        <Box textAlign="right">
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
            Month
          </Typography>
          <Typography variant="h6" fontWeight={600} color="white">
            {data.currentMonthKey}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
