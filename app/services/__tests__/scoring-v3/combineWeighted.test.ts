import { describe, expect, it } from 'vitest';
import * as S from '../../scoring-v3.service';

describe('combineWeighted', () => {
  it('sums the six dimensions and averages them (rounded)', () => {
    const score = { ...S.getInitialScore({}), intrestScore: 4.7, interestTagsScore: 0, ageScore: 100, scheduleScore: 90, weatherScore: 5, distanceScore: 64.6 };
    const { total, totalWeighted } = S.combineWeighted(score);
    expect(total).toBeCloseTo(264.3, 6);
    expect(totalWeighted).toBe(44);
  });
});
