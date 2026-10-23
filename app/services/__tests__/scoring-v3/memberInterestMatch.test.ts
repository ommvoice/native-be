import { describe, expect, it } from 'vitest';
import * as S from '../../scoring-v3.service';
import { estuaryRoute, familyMembers, oppInterest, tenpin } from './helpers';

const opp: S.OpportunityInterestV3 = { themes: ['coastal_adventures'], variants: ['sandy_beach', 'rnli_beach'], categories: ['nature_exploration'] };
const member = (categories: string[], picks: string[]): S.InterestMemberV3 => ({ id: 'm', categories, picks });

describe('memberInterestMatch', () => {
  it.each([
    [['nature_exploration'], ['coastal_adventures'], 'categoryAndTheme', 100],
    [[], ['coastal_adventures'], 'theme', 90],
    [[], ['rnli_beach'], 'variant', 80],
    [['nature_exploration'], ['rnli_beach'], 'variant', 80],
    [['nature_exploration'], [], 'category', 70],
    [['movement_energy'], ['soft_play'], 'none', 0],
  ] as const)('categories %o + picks %o → %s (%i)', (cats, picks, kind, level) => {
    const k = S.memberInterestMatch(member([...cats], [...picks]), opp);
    expect(k).toBe(kind);
    expect(S.INTEREST_LEVEL[k]).toBe(level);
  });

  it('category + theme beats a variant match on the same member', () => {
    expect(S.memberInterestMatch(member(['nature_exploration'], ['coastal_adventures', 'rnli_beach']), opp)).toBe('categoryAndTheme');
  });

  it('real: every params.json member has category+theme for Tenpin Bowling', () => {
    expect(familyMembers.map((m) => S.memberInterestMatch(m, oppInterest(tenpin)))).toEqual(['categoryAndTheme', 'categoryAndTheme', 'categoryAndTheme', 'categoryAndTheme']);
  });

  it('real: child 1 has nothing in common with the estuary route', () => {
    expect(familyMembers.map((m) => S.memberInterestMatch(m, oppInterest(estuaryRoute)))).toEqual(['categoryAndTheme', 'none', 'categoryAndTheme', 'categoryAndTheme']);
  });
});
