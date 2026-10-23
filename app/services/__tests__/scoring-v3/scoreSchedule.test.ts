import { describe, expect, it, vi } from 'vitest';
import * as S from '../../scoring-v3.service';
import { SAT_15_00, estuaryRoute, exmouthBeach, kiaOra, littleGems, oceanSoftplayClub, tenpin, uk, useFixedClock } from './helpers';

useFixedClock(); // Saturday 2026-10-24 15:00 UK unless a test moves it

describe('scoreSchedule', () => {
  const all = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  it('routes are always available', () => {
    expect(S.scoreSchedule(estuaryRoute.type, estuaryRoute.startDate, estuaryRoute.endDate, estuaryRoute.activeDays, estuaryRoute.startTime, estuaryRoute.endTime)).toBe(100);
  });

  describe('venues (now: Saturday 15:00)', () => {
    it('open now → 90', () => expect(S.scoreSchedule('venue', null, null, all, '09:00', '17:00')).toBe(90));
    it('opens within the hour → 100', () => expect(S.scoreSchedule('venue', null, null, all, '15:45', '18:00')).toBe(100));
    it('opens more than an hour from now → 0', () => expect(S.scoreSchedule('venue', null, null, all, '16:30', '18:00')).toBe(0));
    it('already closed → 0', () => expect(S.scoreSchedule('venue', null, null, all, '09:00', '14:00')).toBe(0));
    it('not open on Saturdays → 0', () => expect(S.scoreSchedule('venue', null, null, ['monday', 'friday'], '09:00', '17:00')).toBe(0));
    it('no open days recorded → 0', () => expect(S.scoreSchedule('venue', null, null, [], '09:00', '17:00')).toBe(0));
    it('no times recorded for today → 0', () => expect(S.scoreSchedule('venue', null, null, all, null, null)).toBe(0));
    it('missing closing time is not a constraint → 90', () => expect(S.scoreSchedule('venue', null, null, all, '09:00', null)).toBe(90));
    it('open until 24:00 → 90', () => expect(S.scoreSchedule(exmouthBeach.type, null, null, exmouthBeach.activeDays, exmouthBeach.startTime, exmouthBeach.endTime)).toBe(90));

    // KNOWN BUG: closing times past midnight (Tenpin Bowling, Saturday 10:00–01:00) are read as
    // "01:00 the same morning", so the venue counts as closed all afternoon. Flip to `it` once fixed.
    it.fails('Tenpin Bowling (10:00–01:00) is open at 15:00', () => {
      expect(S.scoreSchedule(tenpin.type, tenpin.startDate, tenpin.endDate, tenpin.activeDays, tenpin.startTime, tenpin.endTime)).toBe(90);
    });
  });

  describe('events', () => {
    const run = (now: Date) => {
      vi.setSystemTime(now);
      return S.scoreSchedule(kiaOra.type, kiaOra.startDate, kiaOra.endDate, kiaOra.activeDays, kiaOra.startTime, kiaOra.endTime);
    };
    it('on its day, while running → 90', () => expect(run(uk('2026-08-16T15:00:00+01:00'))).toBe(90));
    it('on its day, starting within the hour → 100', () => expect(run(uk('2026-08-16T13:30:00+01:00'))).toBe(100));
    it('on its day, but starts more than an hour later → 0 (hidden until 1h before)', () => expect(run(uk('2026-08-16T11:30:00+01:00'))).toBe(0));
    it('the day before → 0', () => expect(run(uk('2026-08-15T15:00:00+01:00'))).toBe(0));
    it('after it ended (fixture "now") → 0', () => expect(run(SAT_15_00)).toBe(0));
    it('no dates at all → 0', () => expect(S.scoreSchedule('event', null, null, [], '10:00', '12:00')).toBe(0));
  });

  describe('clubs', () => {
    const run = (now: Date) => {
      vi.setSystemTime(now);
      return S.scoreSchedule(littleGems.type, littleGems.startDate, littleGems.endDate, littleGems.activeDays, littleGems.startTime, littleGems.endTime);
    };
    it('Little Gems on a Friday at 10:00 → 90', () => expect(run(uk('2026-11-06T10:00:00+00:00'))).toBe(90));
    it('Little Gems on a Friday at 09:00 → 100 (starts within the hour)', () => expect(run(uk('2026-11-06T09:00:00+00:00'))).toBe(100));
    it('Little Gems on a Saturday → 0', () => expect(run(uk('2026-11-07T10:00:00+00:00'))).toBe(0));
    it('club with a multi-session schedule (repository gives it no activeDays) → 0', () => {
      expect(oceanSoftplayClub.activeDays ?? []).toEqual([]);
      expect(S.scoreSchedule('club', oceanSoftplayClub.startDate, oceanSoftplayClub.endDate, oceanSoftplayClub.activeDays, oceanSoftplayClub.startTime, oceanSoftplayClub.endTime)).toBe(0);
    });
  });
});
