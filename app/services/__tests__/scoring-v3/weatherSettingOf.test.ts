import { describe, expect, it } from 'vitest';
import * as S from '../../scoring-v3.service';
import { bicton, estuaryRoute, exmouthBeach, littleGems, tenpin } from './helpers';

describe('weatherSettingOf', () => {
  it.each([
    [['outside'], 'outside'],
    [['inside'], 'inside'],
    [['mixed_covering'], 'mixed'],
    [['inside', 'outside'], 'mixed'],
    [['outside', 'mixed_covering'], 'mixed'],
    [[' Inside '], 'inside'],
    [[], 'mixed'], // nothing recorded → mixed: shown in bad weather, but lower
  ])('%o → %s', (setting, expected) => {
    expect(S.weatherSettingOf(setting)).toBe(expected);
  });

  it('real opportunities', () => {
    expect(S.weatherSettingOf(exmouthBeach.physicalSetting)).toBe('outside');
    expect(S.weatherSettingOf(estuaryRoute.physicalSetting)).toBe('outside');
    expect(S.weatherSettingOf(bicton.physicalSetting)).toBe('mixed');
    expect(S.weatherSettingOf(tenpin.physicalSetting)).toBe('inside');
    expect(S.weatherSettingOf(littleGems.physicalSetting)).toBe('inside');
  });
});
