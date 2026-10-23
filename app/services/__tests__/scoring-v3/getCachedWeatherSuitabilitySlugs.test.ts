import { afterEach, describe, expect, it, vi } from 'vitest';
import * as S from '../../scoring-v3.service';
import { getWeatherByPostcode } from '../../weather.service';
import { SAT_15_00, useFixedClock } from './helpers';

vi.mock('../../weather.service', () => ({ getWeatherByPostcode: vi.fn() }));

useFixedClock();
afterEach(() => vi.mocked(getWeatherByPostcode).mockReset());

describe('getCachedWeatherSuitabilitySlugs', () => {
  const rain = { condition: { code: 1183, isWindy: false }, temp_c: 12 };

  it('maps the live reading and caches it per postcode for 10 minutes', async () => {
    vi.mocked(getWeatherByPostcode).mockResolvedValue(rain as any);
    expect(await S.getCachedWeatherSuitabilitySlugs('EX1 1AA')).toEqual(['wet_rain']);
    expect(await S.getCachedWeatherSuitabilitySlugs(' ex1 1aa ')).toEqual(['wet_rain']); // same key
    expect(getWeatherByPostcode).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date(SAT_15_00.getTime() + 11 * 60_000));
    await S.getCachedWeatherSuitabilitySlugs('EX1 1AA');
    expect(getWeatherByPostcode).toHaveBeenCalledTimes(2); // expired → fetched again
  });
});
