import { Box, Typography, Paper, Chip, List, ListItem, ListItemText } from '@mui/material';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import type { FreezeData } from '../types/streaks.types';

interface FreezeStatusProps {
  data: FreezeData | undefined;
  isLoading: boolean;
}

export default function FreezeStatus({ data, isLoading }: FreezeStatusProps) {
  if (isLoading || !data) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">Loading...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <AcUnitIcon sx={{ color: '#5C6BC0', fontSize: 20 }} />
        <Typography
          variant="h6"
          sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem' }}
        >
          Streak Freezes
        </Typography>
      </Box>

      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Chip
          label={`${data.status.freezesAvailable} available`}
          sx={{
            bgcolor: data.status.freezesAvailable > 0
              ? 'rgba(255, 107, 53, 0.25)'
              : 'rgba(255, 255, 255, 0.08)',
            color: data.status.freezesAvailable > 0 ? '#ff6b35' : 'text.secondary',
            border: data.status.freezesAvailable > 0
              ? '1px solid rgba(255, 107, 53, 0.4)'
              : '1px solid rgba(255, 255, 255, 0.1)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: 11,
          }}
          size="small"
        />
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.03em' }}>
          {data.status.freezesUsedThisMonth} used this month
        </Typography>
      </Box>

      {data.history.length > 0 && (
        <Box mt={2} pt={2} borderTop="1px solid rgba(255,255,255,0.1)">
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 10, mb: 1, display: 'block' }}
          >
            Recent usage
          </Typography>
          <List dense disablePadding>
            {data.history.slice(0, 5).map((freeze) => (
              <ListItem key={freeze.date} disablePadding sx={{ py: 0.25 }}>
                <ListItemText
                  primary={freeze.date}
                  secondary={freeze.source === 'free_monthly' ? 'Free monthly' : 'Purchased'}
                  primaryTypographyProps={{ variant: 'body2', sx: { fontWeight: 600 } }}
                  secondaryTypographyProps={{ variant: 'caption', sx: { letterSpacing: '0.03em' } }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {data.history.length === 0 && (
        <Typography variant="caption" color="text.secondary">
          No freezes used yet
        </Typography>
      )}
    </Paper>
  );
}
