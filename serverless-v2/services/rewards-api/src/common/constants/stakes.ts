export interface StakesBracket {
  minBigBlind: number;
  maxBigBlind: number;
  basePoints: number;
  label: string;
}

export const STAKES_BRACKETS: StakesBracket[] = [
  { minBigBlind: 0.10, maxBigBlind: 0.25, basePoints: 1, label: '$0.10-$0.25' },
  { minBigBlind: 0.50, maxBigBlind: 1.00, basePoints: 2, label: '$0.50-$1.00' },
  { minBigBlind: 2.00, maxBigBlind: 5.00, basePoints: 5, label: '$2.00-$5.00' },
  { minBigBlind: 10.00, maxBigBlind: Infinity, basePoints: 10, label: '$10.00+' },
];

export function getBasePointsForStakes(bigBlind: number): number {
  for (const bracket of STAKES_BRACKETS) {
    if (bigBlind >= bracket.minBigBlind && bigBlind <= bracket.maxBigBlind) {
      return bracket.basePoints;
    }
  }

  throw new Error(
    `No stakes bracket found for big blind $${bigBlind.toFixed(2)}. ` +
    `Valid ranges: ${STAKES_BRACKETS.map((b) => b.label).join(', ')}`,
  );
}
