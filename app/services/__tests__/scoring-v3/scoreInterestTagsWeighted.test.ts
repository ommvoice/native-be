import { describe, expect, it } from 'vitest';
import * as S from '../../scoring-v3.service';
import { estuaryRoute, familyTagWeights, tenpin } from './helpers';

describe('scoreInterestTagsWeighted (params.json family)', () => {
  it('estuary route matches "cycling" ×1 → 1/11', () => {
    expect(S.scoreInterestTagsWeighted(familyTagWeights, estuaryRoute.tags)).toBeCloseTo((1 / 11) * 100, 6);
  });

  it('a tag 2 children share counts double', () => {
    expect(S.scoreInterestTagsWeighted(familyTagWeights, ['Birds'])).toBeCloseTo((2 / 11) * 100, 6);
  });

  it('no overlap → 0; no child tags → neutral 50', () => {
    expect(S.scoreInterestTagsWeighted(familyTagWeights, tenpin.tags)).toBe(0);
    expect(S.scoreInterestTagsWeighted(new Map(), tenpin.tags)).toBe(50);
  });
});
