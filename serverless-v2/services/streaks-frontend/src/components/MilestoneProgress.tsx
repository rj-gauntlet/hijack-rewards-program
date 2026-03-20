import { Box, Typography, Paper, LinearProgress } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import type { NextMilestone } from '../types/streaks.types';

interface MilestoneProgressProps {
  loginMilestone: NextMilestone | null;
  playMilestone: NextMilestone | null;
  loginStreak: number;
  playStreak: number;
}

function MilestoneBar({
  label,
  milestone,
  currentStreak,
}: {
  label: string;
  milestone: NextMilestone | null;
  currentStreak: number;
}) {
  if (!milestone) {
    return (
      <Box mb={2}>
        <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.05em' }}>
          {label}: All milestones reached
        </Typography>
      </Box>
    );
  }

  const progress = (currentStreak / milestone.days) * 100;

  return (
    <Box mb={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
        <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #ff6b35, #e85d04)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          +{milestone.reward.toLocaleString()} pts
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(progress, 100)}
        sx={{ height: 10, borderRadius: 1, mb: 0.5 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.03em' }}>
        {milestone.daysRemaining} more day{milestone.daysRemaining !== 1 ? 's' : ''} to {milestone.days}-day streak
      </Typography>
    </Box>
  );
}

export default function MilestoneProgress({
  loginMilestone,
  playMilestone,
  loginStreak,
  playStreak,
}: MilestoneProgressProps) {
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <EmojiEventsIcon sx={{ color: '#ff6b35', fontSize: 20 }} />
        <Typography
          variant="h6"
          sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem' }}
        >
          Next Milestones
        </Typography>
      </Box>
      <MilestoneBar label="Login" milestone={loginMilestone} currentStreak={loginStreak} />
      <MilestoneBar label="Play" milestone={playMilestone} currentStreak={playStreak} />
    </Paper>
  );
}
