import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../test/utils';
import SummaryCard from './SummaryCard';

const mockSummary = {
  playerId: 'player-001',
  displayName: 'TestPlayer',
  currentTier: 2,
  tierName: 'Silver',
  monthlyPoints: 600,
  lifetimePoints: 5000,
  pointsToNextTier: 1400,
  nextTierName: 'Gold',
  progressPercent: 30,
  currentMonthKey: '2026-03',
};

vi.mock('../api/rewardsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/rewardsApi')>();
  return {
    ...actual,
    useGetRewardsSummaryQuery: vi.fn(),
  };
});

const { useGetRewardsSummaryQuery } = await import('../api/rewardsApi');

describe('SummaryCard', () => {
  beforeEach(() => {
    vi.mocked(useGetRewardsSummaryQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useGetRewardsSummaryQuery>);
  });

  it('shows loading skeleton when loading', () => {
    vi.mocked(useGetRewardsSummaryQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useGetRewardsSummaryQuery>);
    render(<SummaryCard />);
    expect(screen.queryByText(/TestPlayer/)).not.toBeInTheDocument();
    expect(document.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('shows error message when request fails', () => {
    vi.mocked(useGetRewardsSummaryQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { status: 401 },
      refetch: vi.fn(),
    } as ReturnType<typeof useGetRewardsSummaryQuery>);
    render(<SummaryCard />);
    expect(screen.getByText(/Failed to load rewards data/)).toBeInTheDocument();
  });

  it('renders display name and tier when data is loaded', () => {
    vi.mocked(useGetRewardsSummaryQuery).mockReturnValue({
      data: mockSummary,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useGetRewardsSummaryQuery>);
    render(<SummaryCard />);
    expect(screen.getByText('TestPlayer')).toBeInTheDocument();
    expect(screen.getByText(/Silver Tier/)).toBeInTheDocument();
    expect(screen.getByText(/600 pts this month/)).toBeInTheDocument();
  });

  it('shows progress to next tier and progress percent', () => {
    vi.mocked(useGetRewardsSummaryQuery).mockReturnValue({
      data: mockSummary,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useGetRewardsSummaryQuery>);
    render(<SummaryCard />);
    expect(screen.getByText(/1,400 pts to Gold/)).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('shows lifetime points and current month key', () => {
    vi.mocked(useGetRewardsSummaryQuery).mockReturnValue({
      data: mockSummary,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as ReturnType<typeof useGetRewardsSummaryQuery>);
    render(<SummaryCard />);
    expect(screen.getByText('5,000')).toBeInTheDocument();
    expect(screen.getByText('2026-03')).toBeInTheDocument();
  });
});
