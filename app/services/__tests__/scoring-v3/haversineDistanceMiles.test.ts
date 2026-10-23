import { describe, expect, it } from 'vitest';
import * as S from '../../scoring-v3.service';
import { family, tenpin } from './helpers';

describe('haversineDistanceMiles', () => {
  it('London → Paris ≈ 213 miles', () => {
    expect(S.haversineDistanceMiles(51.5074, -0.1278, 48.8566, 2.3522)).toBeCloseTo(213.4, 0);
  });

  it('params.json family → Tenpin Bowling is ~6.5 miles in a straight line', () => {
    const d = S.haversineDistanceMiles(Number(family.latitude), Number(family.longitude), Number(tenpin.latitude), Number(tenpin.longitude));
    expect(d).toBeGreaterThan(6);
    expect(d).toBeLessThan(7);
  });

  it('same point → 0', () => {
    expect(S.haversineDistanceMiles(50.6, -3.4, 50.6, -3.4)).toBe(0);
  });
});
