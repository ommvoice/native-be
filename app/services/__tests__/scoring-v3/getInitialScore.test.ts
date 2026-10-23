import { describe, expect, it } from 'vitest';
import * as S from '../../scoring-v3.service';

describe('getInitialScore', () => {
  it('starts every dimension at 0 when nothing is skipped', () => {
    expect(S.getInitialScore({})).toEqual({
      intrestScore: 0, interestTagsScore: 0, ageScore: 0, scheduleScore: 0,
      weatherScore: 0, distanceScore: 0, total: 0, totalWeighted: 0,
    });
  });

  it('pre-sets only the skipped dimensions to 100', () => {
    const s = S.getInitialScore({ skipWeather: true, skipDistance: true });
    expect(s.weatherScore).toBe(100);
    expect(s.distanceScore).toBe(100);
    expect(s.intrestScore).toBe(0);
    expect(s.scheduleScore).toBe(0);
  });

  it('skipAll sets everything (incl. totals) to 100', () => {
    expect(Object.values(S.getInitialScore({ skipAll: true })).every((v) => v === 100)).toBe(true);
  });
});
