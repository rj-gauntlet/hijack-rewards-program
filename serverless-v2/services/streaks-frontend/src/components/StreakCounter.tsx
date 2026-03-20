import { Box, Typography, Paper, keyframes } from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import StyleIcon from '@mui/icons-material/Style';

const flicker = keyframes`
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
  25% { transform: scale(1.05) rotate(-2deg); opacity: 0.9; }
  50% { transform: scale(1.1) rotate(1deg); opacity: 1; }
  75% { transform: scale(1.03) rotate(-1deg); opacity: 0.95; }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
`;

interface StreakCounterProps {
  type: 'login' | 'play';
  count: number;
  label: string;
}

function getFlameSize(count: number): number {
  if (count >= 30) return 64;
  if (count >= 14) return 52;
  if (count >= 7) return 44;
  if (count >= 3) return 38;
  return 32;
}

function getFlameColor(count: number): string {
  if (count >= 30) return '#ff6b35';
  if (count >= 14) return '#e85d04';
  if (count >= 7) return '#ff6b35';
  if (count >= 3) return '#ffb380';
  return 'rgba(255, 255, 255, 0.3)';
}

function getFlameAnimation(count: number): string | undefined {
  if (count >= 30) return `${flicker} 0.8s ease-in-out infinite`;
  if (count >= 7) return `${pulse} 2s ease-in-out infinite`;
  return undefined;
}

export default function StreakCounter({ type, count, label }: StreakCounterProps) {
  const iconSize = type === 'login' ? getFlameSize(count) : 36;
  const iconColor = type === 'login' ? getFlameColor(count) : '#ff6b35';
  const animation = type === 'login' ? getFlameAnimation(count) : undefined;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography
        variant="caption"
        sx={{
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'text.secondary',
          fontWeight: 600,
          mb: 2,
          display: 'block',
        }}
      >
        {label}
      </Typography>
      <Box display="flex" alignItems="center" gap={2}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            borderRadius: '50%',
            bgcolor: 'rgba(255, 107, 53, 0.1)',
            border: '1px solid rgba(255, 107, 53, 0.2)',
          }}
        >
          {type === 'login' ? (
            <LocalFireDepartmentIcon
              sx={{
                fontSize: iconSize,
                color: iconColor,
                transition: 'all 0.3s ease',
                animation,
              }}
            />
          ) : (
            <StyleIcon
              sx={{
                fontSize: iconSize,
                color: iconColor,
                transition: 'all 0.3s ease',
              }}
            />
          )}
        </Box>
        <Box>
          <Typography
            variant="h2"
            sx={{ fontWeight: 700, lineHeight: 1, fontSize: '3rem' }}
          >
            {count}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.05em' }}>
            {count === 1 ? 'day' : 'days'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
