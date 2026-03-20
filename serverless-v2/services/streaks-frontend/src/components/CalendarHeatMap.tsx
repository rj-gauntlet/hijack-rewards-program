import { Box, Typography, Paper, Tooltip, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { CalendarDay } from '../types/streaks.types';

const ACTIVITY_COLORS: Record<string, string> = {
  none: 'rgba(255, 255, 255, 0.05)',
  login_only: 'rgba(255, 107, 53, 0.25)',
  played: '#ff6b35',
  freeze: '#5C6BC0',
  streak_broken: '#ef4444',
};

const ACTIVITY_LABELS: Record<string, string> = {
  none: 'No activity',
  login_only: 'Login only',
  played: 'Played',
  freeze: 'Freeze used',
  streak_broken: 'Streak broken',
};

interface CalendarHeatMapProps {
  days: CalendarDay[];
  month: string;
  onMonthChange?: (month: string) => void;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default function CalendarHeatMap({ days, month, onMonthChange }: CalendarHeatMapProps) {
  const [year, monthNum] = month.split('-').map(Number);
  const monthName = new Date(year, monthNum - 1).toLocaleString('en', { month: 'long', year: 'numeric' });
  const isCurrentMonth = month === getCurrentMonth();

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <IconButton
          size="small"
          onClick={() => onMonthChange?.(shiftMonth(month, -1))}
          sx={{
            border: '1px solid rgba(255,255,255,0.2)',
            '&:hover': { borderColor: '#ff6b35', bgcolor: 'rgba(255,107,53,0.2)' },
          }}
        >
          <ChevronLeftIcon />
        </IconButton>
        <Typography
          variant="h6"
          sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          {monthName}
        </Typography>
        <IconButton
          size="small"
          onClick={() => onMonthChange?.(shiftMonth(month, 1))}
          disabled={isCurrentMonth}
          sx={{
            border: '1px solid rgba(255,255,255,0.2)',
            '&:hover': { borderColor: '#ff6b35', bgcolor: 'rgba(255,107,53,0.2)' },
          }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Day of week headers */}
      <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={0.5} mb={0.5}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Typography
            key={`${d}-${i}`}
            variant="caption"
            sx={{
              textAlign: 'center',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'text.secondary',
            }}
          >
            {d}
          </Typography>
        ))}
      </Box>

      {/* Calendar grid */}
      <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={0.5}>
        {(() => {
          const firstDay = new Date(year, monthNum - 1, 1).getDay();
          return Array.from({ length: firstDay }, (_, i) => (
            <Box key={`empty-${i}`} sx={{ aspectRatio: '1', borderRadius: '8px' }} />
          ));
        })()}

        {days.map((day) => {
          const dayNum = parseInt(day.date.split('-')[2], 10);
          const color = ACTIVITY_COLORS[day.activity] || ACTIVITY_COLORS.none;
          const label = ACTIVITY_LABELS[day.activity] || 'No activity';
          const isPlayed = day.activity === 'played';
          const tooltipText = `${day.date}: ${label}${
            day.loginStreak ? ` · Login: ${day.loginStreak}` : ''
          }${day.playStreak ? ` · Play: ${day.playStreak}` : ''}`;

          return (
            <Tooltip key={day.date} title={tooltipText} arrow>
              <Box
                sx={{
                  aspectRatio: '1',
                  borderRadius: '8px',
                  bgcolor: color,
                  border: isPlayed ? 'none' : '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'scale(1.1)', opacity: 0.85 },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: 10,
                    fontWeight: isPlayed ? 700 : 400,
                    color: isPlayed ? '#000' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {dayNum}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* Legend */}
      <Box display="flex" gap={2} mt={2.5} pt={2} borderTop="1px solid rgba(255,255,255,0.1)" flexWrap="wrap">
        {Object.entries(ACTIVITY_COLORS).map(([key, color]) => (
          <Box key={key} display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: color }} />
            <Typography
              variant="caption"
              sx={{ fontSize: 10, color: 'text.secondary', letterSpacing: '0.05em' }}
            >
              {ACTIVITY_LABELS[key]}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
