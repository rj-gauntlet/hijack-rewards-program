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
  Gold: '#FFD700',
  Platinum: '#E5E4E2',
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
        <Typography variant="h6" fontWeight={600}>
          Leaderboard
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          {data.totalPlayers} players
        </Typography>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={50}>#</TableCell>
              <TableCell>Player</TableCell>
              <TableCell>Tier</TableCell>
              <TableCell align="right">Points</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.entries.map((entry) => {
              const isCurrentPlayer = entry.playerId === currentPlayerId;
              return (
                <TableRow
                  key={entry.playerId}
                  sx={{
                    bgcolor: isCurrentPlayer ? 'rgba(108, 99, 255, 0.15)' : undefined,
                    '& td': isCurrentPlayer ? { fontWeight: 700 } : undefined,
                  }}
                  hover
                >
                  <TableCell>
                    {entry.rank <= 3 ? (
                      <Typography fontSize={18}>
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                      </Typography>
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
                  <TableCell>
                    <Chip
                      label={entry.tierName}
                      size="small"
                      sx={{
                        bgcolor: TIER_COLORS[entry.tierName],
                        color: '#000',
                        fontWeight: 600,
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
                    bgcolor: 'rgba(108, 99, 255, 0.15)',
                    '& td': { fontWeight: 700 },
                  }}
                >
                  <TableCell>{data.playerRank.rank}</TableCell>
                  <TableCell>
                    {data.playerRank.displayName}
                    <Chip label="You" size="small" color="primary" sx={{ ml: 1 }} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={data.playerRank.tierName}
                      size="small"
                      sx={{
                        bgcolor: TIER_COLORS[data.playerRank.tierName],
                        color: '#000',
                        fontWeight: 600,
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
