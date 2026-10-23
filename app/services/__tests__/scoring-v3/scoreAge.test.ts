import { describe, expect, it } from 'vitest';
import * as S from '../../scoring-v3.service';
import { exmouthBeach, littleGems, tenpin } from './helpers';

const bands = (on: Partial<S.AgeBandsV3>): S.AgeBandsV3 => ({
  under1: null, ages1To2: null, ages3To4: null, ages5To7: null, ages8To12: null, over13: null, adults: null, ...on,
});

describe('scoreAge', () => {
  it('Tenpin Bowling (5+) with children 8, 3, 5 → 2 of 3 fit', () => {
    expect(S.scoreAge([8, 3, 5], tenpin.ageBands)).toBeCloseTo(200 / 3, 6);
  });

  it('Exmouth Beach (all ages) → 100; Little Gems (0–4) → only the 3-year-old fits', () => {
    expect(S.scoreAge([8, 3, 5], exmouthBeach.ageBands)).toBe(100);
    expect(S.scoreAge([8, 3, 5], littleGems.ageBands)).toBeCloseTo(100 / 3, 6);
  });

  it('no bands selected → 100; no children → 100', () => {
    expect(S.scoreAge([2, 9], bands({}))).toBe(100);
    expect(S.scoreAge([], tenpin.ageBands)).toBe(100);
  });
});
