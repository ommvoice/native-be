import { afterEach, describe, expect, it, vi } from 'vitest';
import * as S from '../../scoring-v3.service';

afterEach(() => vi.restoreAllMocks());

describe('rankWithShuffle', () => {
  const item = (id: string, total: number, interestTagsScore = 0) => ({ id, score: { total, totalWeighted: Math.round(total / 6), interestTagsScore } });

  it('orders by total, then interest tags, without mutating the input', () => {
    const input = [item('a', 200), item('b', 300), item('c', 200, 50)];
    expect(S.rankWithShuffle(input).map((x) => x.id)).toEqual(['b', 'c', 'a']);
    expect(input.map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });

  // KNOWN BUG: ties are detected with `sorted[j].score === sorted[i].score` (object identity), so items
  // with equal scores are never shuffled. With Math.random() → 0 a real shuffle would reorder the tie.
  it.fails('shuffles items with identical scores', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const ranked = S.rankWithShuffle([item('a', 200), item('b', 200)]);
    expect(ranked.map((x) => x.id)).toEqual(['b', 'a']);
  });
});
