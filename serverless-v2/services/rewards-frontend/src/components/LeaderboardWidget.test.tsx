import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../test/utils';
import LeaderboardWidget from './LeaderboardWidget';
import { store } from '../store';
import { login } from '../store';

const mockLeaderboard = {
  entries: [
    { rank: 1, playerId: 'p1', displayName: 'Alice', currentTier: 4, tierName: 'Platinum', monthlyPoints: 10000 },
    { rank: 2, playerId: 'p2', displayName: 'Bob', currentTier: 3, tierName: 'Gold', monthlyPoints: 5000 },
    { rank: 3, playerId: 'me', displayName: 'Me', currentTier: 2, tierName: 'Silver', monthlyPoints: 1000 },
  ],
  totalPlayers: 3,
  playerRank: { rank: 3, playerId: 'me', displayName: 'Me', currentTier: 2, tierName: 'Silver', monthlyPoints: 1000 },
};

vi.mock('../api/rewardsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/rewardsApi')>();
  return {
    ...actual,
    useGetLeaderboardQuery: vi.fn(),
  };
});

const { useGetLeaderboardQuery } = await import('../api/rewardsApi');

describe('LeaderboardWidget', () => {
  beforeEach(() => {
    vi.mocked(useGetLeaderboardQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useGetLeaderboardQuery>);
    store.dispatch(login('me'));
  });

  it('shows loading skeleton when loading', () => {
    vi.mocked(useGetLeaderboardQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useGetLeaderboardQuery>);
    render(<LeaderboardWidget />);
    expect(document.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('shows error when request fails', () => {
    vi.mocked(useGetLeaderboardQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 500 },
      refetch: vi.fn(),
    } as ReturnType<typeof useGetLeaderboardQuery>);
    render(<LeaderboardWidget />);
    expect(screen.getByText(/Failed to load leaderboard/)).toBeInTheDocument();
  });

  it('renders leaderboard table with entries and total players', () => {
    vi.mocked(useGetLeaderboardQuery).mockReturnValue({
      data: mockLeaderboard,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useGetLeaderboardQuery>);
    render(<LeaderboardWidget />);
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    expect(screen.getByText('3 players')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Me')).toBeInTheDocument();
  });

  it('highlights current player with You chip', () => {
    vi.mocked(useGetLeaderboardQuery).mockReturnValue({
      data: mockLeaderboard,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useGetLeaderboardQuery>);
    render(<LeaderboardWidget />);
    const youChips = screen.getAllByText('You');
    expect(youChips.length).toBeGreaterThanOrEqual(1);
  });
});
