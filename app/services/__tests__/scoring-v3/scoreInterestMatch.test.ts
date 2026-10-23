import { describe, expect, it } from 'vitest';
import * as S from '../../scoring-v3.service';
import { bicton, estuaryRoute, exmouthBeach, familyMembers, kiaOra, littleGems, oppInterest, tenpin } from './helpers';

const opp: S.OpportunityInterestV3 = { themes: ['coastal_adventures'], variants: ['rnli_beach'], categories: ['nature_exploration'] };
const m = (id: string, categories: string[], picks: string[]): S.InterestMemberV3 => ({ id, categories, picks });
const full = (id: string) => m(id, ['nature_exploration'], ['coastal_adventures']); // 100
const theme = (id: string) => m(id, [], ['coastal_adventures']);                    // 90
const variant = (id: string) => m(id, [], ['rnli_beach']);                          // 80
const category = (id: string) => m(id, ['nature_exploration'], []);                 // 70
const none = (id: string) => m(id, [], ['soft_play']);                              // 0

describe('scoreInterestMatch — share of family members (dropped only at 10% or less)', () => {
  it('everyone category+theme → 100 (share 100%)', () => {
    expect(S.scoreInterestMatch([full('a'), full('b')], opp)).toMatchObject({ score: 100, share: 1 });
  });

  it('everyone on the theme only → 90', () => {
    expect(S.scoreInterestMatch([theme('a'), theme('b'), theme('c'), theme('d')], opp).score).toBe(90);
  });

  it('mixed levels average across members', () => {
    // (100 + 90 + 80 + 70) / 4
    expect(S.scoreInterestMatch([full('a'), theme('b'), variant('c'), category('d')], opp).score).toBe(85);
  });

  it('a non-matching member counts as 0, so shared interests score higher', () => {
    expect(S.scoreInterestMatch([theme('a'), theme('b'), theme('c'), theme('d')], opp).score).toBe(90);
    expect(S.scoreInterestMatch([theme('a'), theme('b'), theme('c'), none('d')], opp).score).toBe(67.5);
  });

  it('one member out of four is enough to keep it, scored low', () => {
    expect(S.scoreInterestMatch([theme('a'), none('b'), none('c'), none('d')], opp)).toMatchObject({ score: 22.5, share: 0.25 });
  });

  it('half the family → kept at half weight', () => {
    expect(S.scoreInterestMatch([full('a'), full('b'), none('c'), none('d')], opp)).toMatchObject({ score: 50, share: 0.5 });
  });

  it('nobody matches → 0 (dropped)', () => {
    expect(S.scoreInterestMatch([none('a'), none('b')], opp)).toMatchObject({ score: 0, share: 0 });
  });

  it('exactly 10% of members (1 of 10) → dropped', () => {
    const members = [full('a'), ...Array.from({ length: 9 }, (_, i) => none(`n${i}`))];
    expect(S.scoreInterestMatch(members, opp)).toMatchObject({ score: 0, share: 0.1 });
  });

  it('just over 10% (1 of 9) → kept', () => {
    const members = [full('a'), ...Array.from({ length: 8 }, (_, i) => none(`n${i}`))];
    expect(S.scoreInterestMatch(members, opp).score).toBeCloseTo(100 / 9, 10);
  });

  it('nobody has interests → neutral 50', () => {
    expect(S.scoreInterestMatch([], opp)).toMatchObject({ score: 50, share: 0 });
  });

  it('returns each member\'s level', () => {
    expect(S.scoreInterestMatch([full('a'), none('b'), variant('c')], opp).members).toEqual([
      { id: 'a', kind: 'categoryAndTheme', level: 100 },
      { id: 'b', kind: 'none', level: 0 },
      { id: 'c', kind: 'variant', level: 80 },
    ]);
  });
});

describe('scoreInterestMatch — real opportunities, params.json family (4 members)', () => {
  const score = (c: Parameters<typeof oppInterest>[0]) => S.scoreInterestMatch(familyMembers, oppInterest(c));

  it('Tenpin Bowling: all 4 category+theme → 100', () => expect(score(tenpin)).toMatchObject({ score: 100, share: 1 }));
  it('estuary route: 3 of 4 → 75 (share 75%)', () => expect(score(estuaryRoute)).toMatchObject({ score: 75, share: 0.75 }));
  it('Exmouth Beach: 2 of 4 → kept at 50', () => expect(score(exmouthBeach)).toMatchObject({ score: 50, share: 0.5 }));
  it('Bicton / Kia-Ora (gardens): 2 of 4 → kept at 50', () => {
    expect(score(bicton).score).toBe(50);
    expect(score(kiaOra).score).toBe(50);
  });
  it('Little Gems (community groups): nobody → dropped', () => expect(score(littleGems)).toMatchObject({ score: 0, share: 0 }));

  it('a variant pick now matches comma-joined variants (old known bug fixed)', () => {
    const r = S.scoreInterestMatch([m('p', [], ['rnli_beach'])], oppInterest(exmouthBeach));
    expect(r.members[0]!.kind).toBe('variant');
    expect(r.score).toBe(80);
  });
});
