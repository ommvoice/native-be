import { describe, expect, it } from 'vitest';
import * as S from '../../scoring-v3.service';

describe('isBadWeather', () => {
  it.each([
    [['wet_rain'], true],
    [['wet_rain', 'windy'], true],
    [['storm_heavy_rain'], true],
    [['snow_ice'], true],
    [[' Wet_Rain '], true],
    [['sunshine', 'dry_warm'], false],
    [['overcast', 'dry_mild', 'windy'], false],
    [['windy'], false],
    [[], false],
  ])('%o → %s', (slugs, expected) => {
    expect(S.isBadWeather(slugs)).toBe(expected);
  });

  it('agrees with real WeatherAPI readings', () => {
    const map = (code: number, temp_c: number, isWindy = false) => S.mapWeatherToSuitabilitySlugs({ condition: { code, isWindy }, temp_c });
    expect(S.isBadWeather(map(1183, 12))).toBe(true);        // light rain
    expect(S.isBadWeather(map(1087, 16))).toBe(true);        // thunderstorm
    expect(S.isBadWeather(map(1066, -1))).toBe(true);        // snow
    expect(S.isBadWeather(map(1135, 9))).toBe(false);        // fog
    expect(S.isBadWeather(map(1009, 12, true))).toBe(false); // overcast + windy
  });
});
