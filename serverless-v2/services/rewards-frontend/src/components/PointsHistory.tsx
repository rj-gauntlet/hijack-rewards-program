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
      <Typography variant="h6" fontWeight={600} mb={2}>
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
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Table</TableCell>
                  <TableCell>Stakes</TableCell>
                  <TableCell align="right">Base</TableCell>
                  <TableCell align="right">Multiplier</TableCell>
                  <TableCell align="right">Earned</TableCell>
                  <TableCell>Tier</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={`${tx.playerId}-${tx.timestamp}`} hover>
                    <TableCell>
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                        {tx.type === 'admin_adjust' ? (
                          <Chip label="Admin" size="small" color="warning" />
                        ) : (
                          tx.tableId
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>{tx.tableStakes}</TableCell>
                    <TableCell align="right">{tx.basePoints}</TableCell>
                    <TableCell align="right">{tx.multiplier}x</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color="primary.main">
                        +{tx.earnedPoints}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={TIER_LABELS[tx.playerTier] || 'Unknown'}
                        size="small"
                        variant="outlined"
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
