import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { login } from '../store';

function Login() {
  const [playerId, setPlayerId] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = () => {
    if (playerId.trim()) {
      localStorage.setItem('playerId', playerId.trim());
      dispatch(login(playerId.trim()));
      navigate('/');
    }
  };

  // Full logo from hijackpoker.com — update path if your instance uses a different asset URL
  const logoUrl = 'https://www.hijackpoker.com/hubfs/Hijack%20Poker%20(R)1.svg';

  return (
    <Container maxWidth="xs" sx={{ mt: 10 }}>
      <Paper sx={{ p: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <Box
            component="img"
            src={logoUrl}
            alt="Hijack Poker"
            sx={{ height: 48, width: 'auto', maxWidth: 200, objectFit: 'contain' }}
          />
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', mt: 1 }}>
            Rewards Login
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter a player ID to view rewards. This is a stub — no real authentication.
        </Typography>
        <TextField
          fullWidth
          label="Player ID"
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          placeholder="e.g. p1-uuid-0001"
          sx={{ mb: 2 }}
        />
        <Button fullWidth variant="contained" onClick={handleLogin} disabled={!playerId.trim()}>
          Login
        </Button>
      </Paper>
    </Container>
  );
}

export default Login;
