import { describe, expect, it } from 'vitest';
import * as S from '../../scoring-v3.service';

describe('mapWeatherToSuitabilitySlugs', () => {
  const map = (code: number, temp_c: number, isWindy = false) => S.mapWeatherToSuitabilitySlugs({ condition: { code, isWindy }, temp_c });

  it('sunny + temperature band', () => {
    expect(map(1000, 22)).toEqual(['sunshine', 'dry_warm']);
    expect(map(1003, 26)).toEqual(['sunshine', 'dry_hot']);
  });
  it('overcast cold + windy', () => expect(map(1009, 5, true)).toEqual(['overcast', 'dry_cold', 'windy']));
  it('rain gets no "dry" band', () => expect(map(1183, 13)).toEqual(['wet_rain']));
  it('snow / storm', () => {
    expect(map(1066, -1)).toEqual(['snow_ice']);
    expect(map(1087, 15)).toEqual(['storm_heavy_rain']);
  });
  it.each([[9.9, 'dry_cold'], [10, 'dry_mild'], [17.9, 'dry_mild'], [18, 'dry_warm'], [24.9, 'dry_warm'], [25, 'dry_hot']])(
    'dry band at %s°C → %s', (temp, band) => expect(map(1000, temp)).toContain(band),
  );
});
