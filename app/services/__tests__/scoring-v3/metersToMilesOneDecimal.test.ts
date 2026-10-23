import { describe, expect, it } from 'vitest';
import * as S from '../../scoring-v3.service';

describe('metersToMilesOneDecimal', () => {
  it('converts and rounds to one decimal', () => {
    expect(S.metersToMilesOneDecimal(1609.344)).toBe(1);
    expect(S.metersToMilesOneDecimal(22_850)).toBe(14.2);
    expect(S.metersToMilesOneDecimal(0)).toBe(0);
  });
});
