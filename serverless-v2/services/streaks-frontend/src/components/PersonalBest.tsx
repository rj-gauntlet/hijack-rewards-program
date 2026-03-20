import { Box, Typography, Paper } from '@mui/material';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';

interface PersonalBestProps {
  bestLoginStreak: number;
  bestPlayStreak: number;
}

export default function PersonalBest({ bestLoginStreak, bestPlayStreak }: PersonalBestProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <MilitaryTechIcon sx={{ color: '#ff6b35', fontSize: 20 }} />
        <Typography
          variant="h6"
          sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem' }}
        >
          Personal Best
        </Typography>
      </Box>

      <Box display="flex" gap={4}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #ff6b35, #e85d04)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {bestLoginStreak}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 10 }}
          >
            Login streak
          </Typography>
        </Box>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #ff6b35, #e85d04)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {bestPlayStreak}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 10 }}
          >
            Play streak
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
