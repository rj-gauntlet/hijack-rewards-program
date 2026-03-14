import { useState } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Skeleton,
  Box,
} from '@mui/material';
import { useGetPointsHistoryQuery } from '../api/rewardsApi';

const TIER_LABELS: Record<number, string> = {
  1: 'Bronze',
  2: 'Silver',
  3: 'Gold',
  4: 'Platinum',
};

const TIER_COLORS: Record<string, string> = {
  Bronze: '#CD7F32',
  Silver: '#C0C0C0',
  Gold: '#ff6b35',
  Platinum: '#D4E8F7',
};

export default function PointsHistory() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data, isLoading, error } = useGetPointsHistoryQuery({
    limit: rowsPerPage,
    offset: page * rowsPerPage,
  });

  if (isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Skeleton variant="text" width="40%" height={32} />
        <Skeleton variant="rectangular" height={300} sx={{ mt: 2 }} />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="error">Failed to load points history.</Typography>
      </Paper>
    );
  }

  const transactions = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={700} mb={2} sx={{ textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        Points History
      </Typography>

      {transactions.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography color="text.secondary">
            No transactions yet. Play some hands to earn points!
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ overflowX: 'hidden' }}>
            <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '11%' }}>Date</TableCell>
                  <TableCell sx={{ width: '16%' }}>Table</TableCell>
                  <TableCell sx={{ width: '11%' }}>Stakes</TableCell>
                  <TableCell align="right" sx={{ width: '10%' }}>Base</TableCell>
                  <TableCell align="right" sx={{ width: '11%' }}>Mult</TableCell>
                  <TableCell align="right" sx={{ width: '11%' }}>Earned</TableCell>
                  <TableCell align="center" sx={{ width: '20%', minWidth: 84, overflow: 'visible', whiteSpace: 'nowrap' }}>Tier</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={`${tx.playerId}-${tx.timestamp}`} hover>
                    <TableCell>
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Typography variant="body2" noWrap component="span">
                        {tx.type === 'admin_adjust' ? (
                          <Chip
                            label="Admin"
                            size="small"
                            sx={{ bgcolor: '#5C6BC0', color: '#fff', fontWeight: 600 }}
                          />
                        ) : (
                          tx.tableId
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>{tx.tableStakes}</TableCell>
                    <TableCell align="right">{tx.basePoints}</TableCell>
                    <TableCell align="right">{tx.multiplier}x</TableCell>
                    <TableCell align="right">
                      <Typography
                        fontWeight={600}
                        color={tx.earnedPoints >= 0 ? 'primary.main' : 'error'}
                      >
                        {tx.earnedPoints >= 0 ? `+${tx.earnedPoints}` : tx.earnedPoints}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ overflow: 'visible', whiteSpace: 'nowrap' }}>
                      <Chip
                        label={TIER_LABELS[tx.playerTier] || 'Unknown'}
                        size="small"
                        sx={{
                          bgcolor: TIER_COLORS[TIER_LABELS[tx.playerTier]]
                            ? `${TIER_COLORS[TIER_LABELS[tx.playerTier]]}33`
                            : 'rgba(255,255,255,0.15)',
                          color: TIER_COLORS[TIER_LABELS[tx.playerTier]] || 'rgba(255,255,255,0.9)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 20, 50]}
          />
        </>
      )}
    </Paper>
  );
}
