import { describe, expect, it } from 'vitest';
import * as S from '../../scoring-v3.service';

describe('scoreDistance', () => {
  it('is linear inside the radius and 0 at/after it', () => {
    expect(S.scoreDistance(0, 40)).toBe(100);
    expect(S.scoreDistance(20, 40)).toBe(50);
    expect(S.scoreDistance(40, 40)).toBe(0);
    expect(S.scoreDistance(45, 40)).toBe(0);
  });

  it('a zero radius scores 0', () => {
    expect(S.scoreDistance(1, 0)).toBe(0);
  });
});
