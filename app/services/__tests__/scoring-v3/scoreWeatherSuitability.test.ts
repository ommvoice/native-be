import { describe, expect, it } from 'vitest';
import * as S from '../../scoring-v3.service';
import type { RecommendationV2Candidate } from '../../../dtos/recommendation.dto';
import { bicton, estuaryRoute, exmouthBeach, kiaOra, littleGems, tenpin } from './helpers';

/**
 * Rules: good weather → show everything. Rain / storm / snow → outside hidden (0), mixed shown but
 * lower, inside shown. The opportunity's own weather-suitability list must not change the outcome.
 */

const map = (code: number, temp_c: number, isWindy = false) => S.mapWeatherToSuitabilitySlugs({ condition: { code, isWindy }, temp_c });
const GOOD = {
  'sunny 22°C': map(1000, 22),
  'sunny 28°C': map(1000, 28),
  'sunny 5°C': map(1000, 5),
  'overcast 14°C': map(1009, 14),
  'overcast + windy': map(1009, 12, true),
  'fog 9°C': map(1135, 9),
};
const BAD = {
  'light rain': map(1183, 12),
  'rain + windy': map(1189, 11, true),
  'heavy rain': map(1195, 10),
  'thunderstorm': map(1087, 16),
  'snow': map(1066, -1),
};
const score = (c: RecommendationV2Candidate, weather: string[]) => S.scoreWeatherSuitability(weather, c.physicalSetting);

describe('scoreWeatherSuitability — good weather shows everything', () => {
  describe.each(Object.entries(GOOD))('%s', (_name, weather) => {
    it('outside venue (Exmouth Beach) → 10', () => expect(score(exmouthBeach, weather)).toBe(10));
    it('outside route → 10', () => expect(score(estuaryRoute, weather)).toBe(10));
    it('outside event (Kia-Ora) → 10', () => expect(score(kiaOra, weather)).toBe(10));
    it('mixed venue (Bicton) → 10', () => expect(score(bicton, weather)).toBe(10));
    it('inside venue (Tenpin) → 10', () => expect(score(tenpin, weather)).toBe(10));
    it('inside club (Little Gems) → 10', () => expect(score(littleGems, weather)).toBe(10));
  });
});

describe('scoreWeatherSuitability — rain / storm / snow', () => {
  describe.each(Object.entries(BAD))('%s', (_name, weather) => {
    it('outside venue (Exmouth Beach) → 0, hidden', () => expect(score(exmouthBeach, weather)).toBe(0));
    it('outside route → 0, hidden', () => expect(score(estuaryRoute, weather)).toBe(0));
    it('outside event (Kia-Ora) → 0, hidden', () => expect(score(kiaOra, weather)).toBe(0));
    it('mixed venue (Bicton) → 5, shown but lower', () => expect(score(bicton, weather)).toBe(5));
    it('inside venue (Tenpin) → 10', () => expect(score(tenpin, weather)).toBe(10));
    it('inside club (Little Gems) → 10', () => expect(score(littleGems, weather)).toBe(10));
  });
});

describe('scoreWeatherSuitability — regressions from the old suitability-list logic', () => {
  it('rain + windy no longer shows outside places just because they list "windy"', () => {
    expect(exmouthBeach.weatherSuitability).toContain('windy');
    expect(score(exmouthBeach, BAD['rain + windy'])).toBe(0);
  });

  it('an outside place that lists wet_rain/snow as suitable is still hidden in bad weather', () => {
    expect(S.scoreWeatherSuitability(['wet_rain'], ['outside'])).toBe(0);
    expect(S.scoreWeatherSuitability(['snow_ice'], ['outside'])).toBe(0);
  });

  it('fog (overcast + dry_cold) shows outside places even if dry_cold is not on their list', () => {
    expect(score(estuaryRoute, GOOD['fog 9°C'])).toBe(10);
  });

  it('outdoor clubs (no weather-suitability list at all) show in good weather', () => {
    expect(S.scoreWeatherSuitability(GOOD['sunny 22°C'], ['outside'])).toBe(10);
  });

  it('mixed scores lower than inside, but above hidden, in bad weather', () => {
    const { outside, mixed, inside } = S.WEATHER_SCORE.bad;
    expect(outside).toBe(0);
    expect(mixed).toBeGreaterThan(outside);
    expect(mixed).toBeLessThan(inside);
  });

  it('no setting recorded is treated as mixed', () => {
    expect(S.scoreWeatherSuitability(BAD['light rain'], [])).toBe(5);
    expect(S.scoreWeatherSuitability(GOOD['sunny 22°C'], [])).toBe(10);
  });
});
