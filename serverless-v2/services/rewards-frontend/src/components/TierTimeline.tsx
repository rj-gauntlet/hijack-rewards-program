import { Paper, Typography, Box, Skeleton } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useGetTierHistoryQuery } from '../api/rewardsApi';

const TIER_LABELS: Record<number, string> = {
  1: 'Bronze',
  2: 'Silver',
  3: 'Gold',
  4: 'Platinum',
};

const TIER_COLORS: Record<number, string> = {
  1: '#CD7F32',
  2: '#C0C0C0',
  3: '#FFD700',
  4: '#E5E4E2',
};

const TIER_HEIGHT: Record<number, number> = {
  1: 25,
  2: 50,
  3: 75,
  4: 100,
};

export default function TierTimeline() {
  const { data, isLoading, error } = useGetTierHistoryQuery();

  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Skeleton variant="text" width="40%" height={32} />
        <Skeleton variant="rectangular" height={160} sx={{ mt: 2 }} />
      </Paper>
    );
  }

  if (error || !data) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="error">Failed to load tier history.</Typography>
      </Paper>
    );
  }

  const entries = [...data].sort((a, b) => a.monthKey.localeCompare(b.monthKey)).slice(-6);

  if (entries.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <TimelineIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Tier History
          </Typography>
        </Box>
        <Typography color="text.secondary" textAlign="center" py={3}>
          No tier history yet. History is recorded at each monthly reset.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <TimelineIcon color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Tier History
        </Typography>
      </Box>

      <Box display="flex" alignItems="flex-end" gap={1} height={140} mt={2}>
        {entries.map((entry) => {
          const height = TIER_HEIGHT[entry.tier] || 25;
          const color = TIER_COLORS[entry.tier] || '#666';
          const label = TIER_LABELS[entry.tier] || '?';

          return (
            <Box
              key={entry.monthKey}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Typography variant="caption" fontWeight={600} sx={{ color }}>
                {label}
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  height: `${height}%`,
                  bgcolor: color,
                  borderRadius: '4px 4px 0 0',
                  opacity: 0.85,
                  transition: 'height 0.3s ease',
                  minHeight: 20,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {entry.monthKey}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
