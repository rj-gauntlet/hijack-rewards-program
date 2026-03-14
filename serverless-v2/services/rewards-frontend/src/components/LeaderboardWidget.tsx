import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  Box,
} from '@mui/material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import { useGetLeaderboardQuery } from '../api/rewardsApi';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

const TIER_COLORS: Record<string, string> = {
  Bronze: '#CD7F32',
  Silver: '#C0C0C0',
  Gold: '#ff6b35',
  Platinum: '#D4E8F7',
};

export default function LeaderboardWidget() {
  const { data, isLoading, error } = useGetLeaderboardQuery({ limit: 10 });
  const currentPlayerId = useSelector((state: RootState) => state.auth.playerId);

  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Skeleton variant="text" width="50%" height={32} />
        <Skeleton variant="rectangular" height={300} sx={{ mt: 2 }} />
      </Paper>
    );
  }

  if (error || !data) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="error">Failed to load leaderboard.</Typography>
      </Paper>
    );
  }

  const isPlayerInTop = data.entries.some((e) => e.playerId === currentPlayerId);

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <LeaderboardIcon color="primary" />
        <Typography variant="h6" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Leaderboard
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', textTransform: 'uppercase', fontWeight: 600 }}>
          {data.totalPlayers} players
        </Typography>
      </Box>

      <TableContainer sx={{ overflowX: 'hidden' }}>
        <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: '12%' }}>#</TableCell>
              <TableCell sx={{ width: '38%' }}>Player</TableCell>
              <TableCell align="center" sx={{ width: '28%' }}>Tier</TableCell>
              <TableCell align="right" sx={{ width: '22%' }}>Points</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.entries.map((entry) => {
              const isCurrentPlayer = entry.playerId === currentPlayerId;
              return (
                <TableRow
                  key={entry.playerId}
                  sx={{
                    bgcolor: isCurrentPlayer ? 'rgba(255, 107, 53, 0.15)' : undefined,
                    borderLeft: isCurrentPlayer ? '4px solid' : undefined,
                    borderColor: 'primary.main',
                    '& td': isCurrentPlayer ? { fontWeight: 700 } : undefined,
                  }}
                  hover
                >
                  <TableCell align="center" sx={{ verticalAlign: 'middle' }}>
                    {entry.rank <= 3 ? (
                      <Box component="span" sx={{ fontSize: 18, lineHeight: 1, display: 'inline-block' }}>
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                      </Box>
                    ) : (
                      entry.rank
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.displayName}
                    {isCurrentPlayer && (
                      <Chip label="You" size="small" color="primary" sx={{ ml: 1 }} />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={entry.tierName}
                      size="small"
                      sx={{
                        bgcolor: `${TIER_COLORS[entry.tierName]}33`,
                        color: TIER_COLORS[entry.tierName],
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {entry.monthlyPoints.toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}

            {!isPlayerInTop && data.playerRank && (
              <>
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      ···
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow
                  sx={{
                    bgcolor: 'rgba(255, 107, 53, 0.15)',
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                    '& td': { fontWeight: 700 },
                  }}
                >
                  <TableCell align="center" sx={{ verticalAlign: 'middle' }}>{data.playerRank.rank}</TableCell>
                  <TableCell>
                    {data.playerRank.displayName}
                    <Chip label="You" size="small" color="primary" sx={{ ml: 1 }} />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={data.playerRank.tierName}
                      size="small"
                      sx={{
                        bgcolor: `${TIER_COLORS[data.playerRank.tierName]}33`,
                        color: TIER_COLORS[data.playerRank.tierName],
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {data.playerRank.monthlyPoints.toLocaleString()}
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
