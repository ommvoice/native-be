import { describe, expect, it } from 'vitest';
import * as S from '../../scoring-v3.service';

const bands = (on: Partial<S.AgeBandsV3>): S.AgeBandsV3 => ({
  under1: null, ages1To2: null, ages3To4: null, ages5To7: null, ages8To12: null, over13: null, adults: null, ...on,
});

describe('childAgeMatchesBands', () => {
  it.each([
    [0, { under1: true }, true],
    [1, { under1: true }, false],
    [1, { ages1To2: true }, true],
    [4, { ages3To4: true }, true],
    [5, { ages3To4: true }, false],
    [12, { ages8To12: true }, true],
    [13, { ages8To12: true }, false],
    [13, { over13: true }, true],
    [15, { adults: true }, false],
    [16, { adults: true }, true],
  ])('age %i with %o → %s', (age, on, expected) => {
    expect(S.childAgeMatchesBands(age, bands(on))).toBe(expected);
  });

  it('no bands selected suits everyone', () => {
    expect(S.childAgeMatchesBands(40, bands({}))).toBe(true);
  });
});
