import { describe, expect, it } from 'vitest';
import * as S from '../../scoring-v3.service';
import { familyTagWeights } from './helpers';

describe('buildChildTagWeights (params.json family)', () => {
  it('weights tags by how many children picked them (birds ×2, total 11)', () => {
    expect(familyTagWeights.get('birds')).toBe(2);
    expect([...familyTagWeights.values()].reduce((a, b) => a + b, 0)).toBe(11);
  });

  it('counts a tag once per child and ignores case/whitespace/empties', () => {
    const w = S.buildChildTagWeights([['Cats', ' cats', ''], ['CATS']]);
    expect(w.get('cats')).toBe(2);
    expect(w.has('')).toBe(false);
  });
});
