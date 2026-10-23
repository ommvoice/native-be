import { describe, expect, it } from 'vitest';
import * as S from '../../scoring-v3.service';
import { family, uk, useFixedClock } from './helpers';

useFixedClock();

describe('getAgeInYears (UK calendar)', () => {
  it('params.json children are 8, 3 and 5 on 2026-10-24', () => {
    expect(family.children.map((c) => S.getAgeInYears(new Date(c.dateOfBirth)))).toEqual([8, 3, 5]);
  });

  it('turns a year older on the UK birthday, even when it is still the previous day in UTC', () => {
    const dob = new Date('2018-10-25T00:00:00Z');
    expect(S.getAgeInYears(dob, uk('2026-10-24T23:00:00+01:00'))).toBe(7);
    expect(S.getAgeInYears(dob, uk('2026-10-25T00:30:00+01:00'))).toBe(8); // 23:30 UTC on the 24th
  });
});
